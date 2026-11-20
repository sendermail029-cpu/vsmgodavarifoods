import "server-only";
import ExcelJS from "exceljs";
import type { InvestorBook } from "./investors";
import { body, DATE, header, INR, MAROON_DARK, title, totalRow } from "./sales-xlsx";

const GREEN = "FF166534", RED = "FFB91C1C";
const rupees = (paise: number) => Math.round(paise) / 100;
const asDate = (d: string) => new Date(d + "T00:00:00Z");
const monthName = (m: string) => new Date(m + "-01T00:00:00Z").toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const KIND: Record<string, string> = { invest: "Money in", withdraw: "Taken out", expense: "Expense" };

/** Excel workbook of the money book: Summary · Members · Entries · Month by month · Where money went. */
export async function investorBookXlsx(b: InvestorBook, shopName: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = shopName;
  wb.created = new Date();
  const now = new Date(Date.now() + 330 * 60_000).toISOString();
  const sub = `Generated: ${new Date(now.slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}, ${now.slice(11, 16)} IST`;
  const t = b.totals;

  /* Summary */
  const s = wb.addWorksheet("Summary", { views: [{ showGridLines: false }] });
  s.columns = [{ width: 42 }, { width: 20 }];
  title(s, `${shopName} — Investors & money`, sub, 2);
  const lines: [string, number, string?][] = [
    ["Total invested by members", t.invested],
    ["Taken out by members", t.withdrawn],
    ["Expenses entered", t.expenses],
    ["Ingredient purchases (Ingredients stock)", t.ingredients],
    ["Total money used", t.used],
    ["Sales income (paid orders + delivered COD)", t.sales],
    [t.profit >= 0 ? "PROFIT" : "LOSS", t.profit, "total"],
    ["Cash the business should have now", t.cash, "total"],
  ];
  s.addRow([]);
  lines.forEach(([label, v, kind], i) => {
    const r = s.addRow([label, rupees(v)]);
    r.getCell(2).numFmt = INR;
    if (kind) { totalRow(r); r.getCell(2).font = { bold: true, color: { argb: label === "LOSS" ? RED : MAROON_DARK } }; }
    else body(r, i);
  });
  s.addRow([]);
  s.addRow(["Profit / loss = sales income − money used. Members share it in proportion to what they invested."]).font = { italic: true, size: 9, color: { argb: "FF71717A" } };

  /* Members */
  const m = wb.addWorksheet("Members", { views: [{ state: "frozen", ySplit: 3, showGridLines: false }] });
  m.columns = [{ width: 24 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 12 }, { width: 18 }, { width: 18 }];
  title(m, "Members", sub, 7);
  header(m.addRow(["Member", "Phone", "Invested", "Taken out", "Share %", "Share of profit / loss", "Current value"]));
  b.members.forEach((x, i) => {
    const r = m.addRow([x.name, x.phone, rupees(x.invested), rupees(x.withdrawn), x.sharePct / 100, rupees(x.profitShare), rupees(x.balance)]);
    [3, 4, 6, 7].forEach((c) => (r.getCell(c).numFmt = INR));
    r.getCell(5).numFmt = "0.0%";
    r.getCell(6).font = { color: { argb: x.profitShare >= 0 ? GREEN : RED } };
    body(r, i);
  });
  const mt = m.addRow(["TOTAL", "", rupees(t.invested), rupees(t.withdrawn), t.invested ? 1 : 0, rupees(b.members.reduce((a, x) => a + x.profitShare, 0)), rupees(b.members.reduce((a, x) => a + x.balance, 0))]);
  [3, 4, 6, 7].forEach((c) => (mt.getCell(c).numFmt = INR));
  mt.getCell(5).numFmt = "0.0%";
  totalRow(mt);

  /* All entries */
  const e = wb.addWorksheet("All entries", { views: [{ state: "frozen", ySplit: 3, showGridLines: false }] });
  e.columns = [{ width: 14 }, { width: 12 }, { width: 24 }, { width: 16 }, { width: 16 }, { width: 36 }, { width: 16 }];
  title(e, "All entries", sub, 7);
  header(e.addRow(["Date", "Type", "Member / category", "Money in", "Money out", "Note", "Entered by"]));
  b.entries.forEach((x, i) => {
    const r = e.addRow([asDate(x.date), KIND[x.kind], x.kind === "expense" ? x.category : x.investor ?? "", x.kind === "invest" ? rupees(x.amount) : null, x.kind === "invest" ? null : rupees(x.amount), x.note, x.by]);
    r.getCell(1).numFmt = DATE;
    r.getCell(4).numFmt = INR; r.getCell(4).font = { color: { argb: GREEN } };
    r.getCell(5).numFmt = INR; r.getCell(5).font = { color: { argb: RED } };
    body(r, i);
  });
  if (b.entries.length) {
    const et = e.addRow(["TOTAL", "", "", rupees(t.invested), rupees(t.withdrawn + t.expenses), "", ""]);
    et.getCell(4).numFmt = INR; et.getCell(5).numFmt = INR;
    totalRow(et);
  }
  e.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: 7 } };

  /* Month by month */
  const mo = wb.addWorksheet("Month by month", { views: [{ state: "frozen", ySplit: 3, showGridLines: false }] });
  mo.columns = [{ width: 18 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 17 }];
  title(mo, "Month by month", sub, 7);
  header(mo.addRow(["Month", "Invested", "Taken out", "Expenses", "Ingredients", "Sales", "Profit / loss"]));
  b.months.forEach((x, i) => {
    const r = mo.addRow([monthName(x.month), rupees(x.invested), rupees(x.withdrawn), rupees(x.expenses), rupees(x.ingredients), rupees(x.sales), rupees(x.profit)]);
    for (let c = 2; c <= 7; c++) r.getCell(c).numFmt = INR;
    r.getCell(7).font = { bold: true, color: { argb: x.profit >= 0 ? GREEN : RED } };
    body(r, i);
  });
  const mtot = mo.addRow(["TOTAL", rupees(t.invested), rupees(t.withdrawn), rupees(t.expenses), rupees(t.ingredients), rupees(t.sales), rupees(t.profit)]);
  for (let c = 2; c <= 7; c++) mtot.getCell(c).numFmt = INR;
  totalRow(mtot);

  /* Where money went */
  const w = wb.addWorksheet("Where money went", { views: [{ showGridLines: false }] });
  w.columns = [{ width: 40 }, { width: 18 }, { width: 12 }];
  title(w, "Where the money went", sub, 3);
  header(w.addRow(["Category", "Amount", "% of used"]));
  b.byCategory.forEach((x, i) => {
    const r = w.addRow([x.category, rupees(x.amount), t.used ? x.amount / t.used : 0]);
    r.getCell(2).numFmt = INR; r.getCell(3).numFmt = "0.0%";
    body(r, i);
  });
  const wt = w.addRow(["TOTAL", rupees(t.used), t.used ? 1 : 0]);
  wt.getCell(2).numFmt = INR; wt.getCell(3).numFmt = "0.0%";
  totalRow(wt);

  return wb.xlsx.writeBuffer();
}
