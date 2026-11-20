import "server-only";
import { db } from "./db";

/** All money in paise. Dates in IST (YYYY-MM-DD). */
export const EXPENSE_CATEGORIES = ["Raw materials", "Packaging (jars, boxes)", "Courier / shipping", "Marketing & ads", "Equipment", "Rent & bills", "Labour / salaries", "Other"] as const;

export type Member = { id: number; name: string; phone: string; note: string; invested: number; withdrawn: number; sharePct: number; profitShare: number; balance: number; entries: number };
export type MoneyEntry = { id: number; kind: "invest" | "withdraw" | "expense"; amount: number; category: string; note: string; date: string; investor: string | null; investorId: number | null; by: string };
export type MonthRow = { month: string; invested: number; withdrawn: number; expenses: number; ingredients: number; sales: number; profit: number };
export type InvestorBook = {
  members: Member[]; entries: MoneyEntry[]; months: MonthRow[];
  totals: { invested: number; withdrawn: number; expenses: number; ingredients: number; used: number; sales: number; profit: number; cash: number };
  byCategory: { category: string; amount: number }[];
};

const IST = "'+330 minutes'";
/** Orders that brought money in: not cancelled, and paid (or cash-on-delivery that was delivered). */
const SALE = "status != 'cancelled' AND (payment_status = 'paid' OR (payment_method = 'cod' AND status = 'delivered'))";

export async function investorBook(): Promise<InvestorBook> {
  const c = await db();
  const [inv, ent, sales, ingr] = await Promise.all([
    c.execute("SELECT * FROM investors ORDER BY name"),
    c.execute("SELECT e.*, i.name AS investor FROM money_entries e LEFT JOIN investors i ON i.id = e.investor_id ORDER BY e.entry_date DESC, e.id DESC"),
    c.execute(`SELECT strftime('%Y-%m', created_at, ${IST}) AS m, SUM(total) AS t FROM orders WHERE ${SALE} GROUP BY m`),
    // ingredient purchases recorded on the Ingredients page (counted automatically as money used)
    c.execute(`SELECT strftime('%Y-%m', created_at, ${IST}) AS m, SUM(cost) AS t FROM raw_material_log WHERE kind = 'purchase' AND cost > 0 GROUP BY m`),
  ]);

  const entries: MoneyEntry[] = ent.rows.map((r) => ({
    id: Number(r.id), kind: String(r.kind) as MoneyEntry["kind"], amount: Number(r.amount), category: r.category ? String(r.category) : "",
    note: r.note ? String(r.note) : "", date: String(r.entry_date), investor: r.investor ? String(r.investor) : null,
    investorId: r.investor_id == null ? null : Number(r.investor_id), by: r.by_name ? String(r.by_name) : "",
  }));

  // month-wise
  const months = new Map<string, MonthRow>();
  const row = (m: string) => { let x = months.get(m); if (!x) { x = { month: m, invested: 0, withdrawn: 0, expenses: 0, ingredients: 0, sales: 0, profit: 0 }; months.set(m, x); } return x; };
  for (const e of entries) {
    const x = row(e.date.slice(0, 7));
    if (e.kind === "invest") x.invested += e.amount; else if (e.kind === "withdraw") x.withdrawn += e.amount; else x.expenses += e.amount;
  }
  for (const r of sales.rows) if (r.m) row(String(r.m)).sales += Number(r.t);
  for (const r of ingr.rows) if (r.m) row(String(r.m)).ingredients += Number(r.t);
  const monthList = [...months.values()].map((m) => ({ ...m, profit: m.sales - m.expenses - m.ingredients })).sort((a, b) => b.month.localeCompare(a.month));

  const sum = (k: keyof Omit<MonthRow, "month">) => monthList.reduce((t, m) => t + m[k], 0);
  const invested = sum("invested"), withdrawn = sum("withdrawn"), expenses = sum("expenses"), ingredients = sum("ingredients"), salesT = sum("sales");
  const used = expenses + ingredients, profit = salesT - used;
  const totals = { invested, withdrawn, expenses, ingredients, used, sales: salesT, profit, cash: invested - withdrawn + salesT - used };

  // members: share of profit is in proportion to the money each one put in
  const members: Member[] = inv.rows.map((r) => {
    const id = Number(r.id);
    const mine = entries.filter((e) => e.investorId === id);
    const inAmt = mine.filter((e) => e.kind === "invest").reduce((t, e) => t + e.amount, 0);
    const outAmt = mine.filter((e) => e.kind === "withdraw").reduce((t, e) => t + e.amount, 0);
    const sharePct = invested > 0 ? (inAmt / invested) * 100 : 0;
    const profitShare = Math.round((profit * sharePct) / 100);
    return { id, name: String(r.name), phone: r.phone ? String(r.phone) : "", note: r.note ? String(r.note) : "", invested: inAmt, withdrawn: outAmt, sharePct, profitShare, balance: inAmt - outAmt + profitShare, entries: mine.length };
  });

  const cats = new Map<string, number>();
  for (const e of entries) if (e.kind === "expense") cats.set(e.category || "Other", (cats.get(e.category || "Other") ?? 0) + e.amount);
  if (ingredients) cats.set("Ingredients (from Ingredients stock)", ingredients);
  const byCategory = [...cats.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);

  return { members, entries, months: monthList, totals, byCategory };
}
