import "server-only";
import { db } from "./db";
import type { Order, OrderItem } from "./orders";

/** Dates are handled in India time (IST, UTC+5:30); the database stores UTC. */
const IST = "'+330 minutes'";
export const todayIST = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
export const isDay = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export type DayRow = { day: string; orders: number; cancelled: number; items: number; sales: number; cod: number; upi: number; card: number; paid: number; pending: number };
export type SalesReport = {
  from: string; to: string; days: DayRow[]; totals: DayRow; orders: Order[];
  top: { name: string; label: string; qty: number; amount: number }[];
};

/** Everything needed for a date-wise sales report between two IST dates (inclusive). */
export async function salesReport(from: string, to: string): Promise<SalesReport> {
  const c = await db();
  const { rows } = await c.execute({
    sql: `SELECT *, date(created_at, ${IST}) AS day FROM orders WHERE date(created_at, ${IST}) BETWEEN ? AND ? ORDER BY id`,
    args: [from, to],
  });
  const orders = rows.map((r) => ({ ...(r as unknown as Order), items: JSON.parse(String(r.items_json)) as OrderItem[], day: String(r.day) }));
  const empty = (day: string): DayRow => ({ day, orders: 0, cancelled: 0, items: 0, sales: 0, cod: 0, upi: 0, card: 0, paid: 0, pending: 0 });
  const byDay = new Map<string, DayRow>();
  // every day in the range appears, even with no orders
  for (let d = new Date(from + "T00:00:00Z"); d <= new Date(to + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)) {
    const k = d.toISOString().slice(0, 10);
    byDay.set(k, empty(k));
  }
  const top = new Map<string, { name: string; label: string; qty: number; amount: number }>();
  for (const o of orders) {
    const row = byDay.get(o.day) ?? empty(o.day);
    byDay.set(o.day, row);
    if (o.status === "cancelled") { row.cancelled++; continue; }
    row.orders++;
    row.sales += o.total;
    row.items += o.items.reduce((s, i) => s + i.qty, 0);
    if (o.payment_method === "cod") row.cod += o.total;
    else if (o.payment_method === "phonepe") row.card += o.total;
    else row.upi += o.total;
    if (o.payment_status === "paid") row.paid += o.total; else row.pending += o.total;
    for (const i of o.items) {
      const k = `${i.name}|${i.label}`;
      const t = top.get(k) ?? { name: i.name, label: i.label, qty: 0, amount: 0 };
      t.qty += i.qty; t.amount += i.price * i.qty;
      top.set(k, t);
    }
  }
  const days = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
  const totals = days.reduce((t, d) => {
    (Object.keys(t) as (keyof DayRow)[]).forEach((k) => { if (k !== "day") (t[k] as number) += d[k] as number; });
    return t;
  }, empty("Total"));
  return { from, to, days, totals, orders, top: [...top.values()].sort((a, b) => b.qty - a.qty).slice(0, 10) };
}
