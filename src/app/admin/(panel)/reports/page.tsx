import Link from "next/link";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { rupees } from "@/lib/format";
import { isDay, salesReport, todayIST } from "@/lib/reports";

export const dynamic = "force-dynamic";

const shift = (d: string, days: number) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + days); return x.toISOString().slice(0, 10); };
const niceDay = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "short", year: "numeric" });

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const today = todayIST();
  let from = isDay(sp.from) ? sp.from : shift(today, -6);
  let to = isDay(sp.to) ? sp.to : today;
  if (from > to) [from, to] = [to, from];
  if ((Date.parse(to) - Date.parse(from)) / 864e5 > 366) from = shift(to, -366);
  const r = await salesReport(from, to);
  const t = r.totals;
  const monthStart = today.slice(0, 8) + "01";
  const lastMonthEnd = shift(monthStart, -1), lastMonthStart = lastMonthEnd.slice(0, 8) + "01";
  const presets: [string, string, string][] = [
    ["Today", today, today], ["Yesterday", shift(today, -1), shift(today, -1)], ["Last 7 days", shift(today, -6), today],
    ["This month", monthStart, today], ["Last month", lastMonthStart, lastMonthEnd], ["Last 30 days", shift(today, -29), today],
  ];
  const q = `from=${from}&to=${to}`;
  const max = Math.max(1, ...r.days.map((d) => d.sales));

  return (
    <div>
      <PageHeader title="Sales reports" sub={`${from === to ? niceDay(from) : `${niceDay(from)} → ${niceDay(to)}`} · India time`}>
        <a href={`/api/admin/reports/sales?${q}`} className="btn-primary"><FileText className="h-4 w-4" /> Download PDF</a>
        <a href={`/api/admin/reports/sales?${q}&format=xlsx`} className="btn-ghost bg-white"><FileSpreadsheet className="h-4 w-4 text-emerald-700" /> Download Excel</a>
      </PageHeader>

      {/* date pickers */}
      <div className="card mb-6 p-4">
        <div className="flex flex-wrap gap-2">
          {presets.map(([label, a, b]) => (
            <Link key={label} href={`/admin/reports?from=${a}&to=${b}`} className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${a === from && b === to ? "bg-maroon-700 text-cream ring-maroon-700" : "bg-white ring-gold/40 hover:bg-gold-pale"}`}>{label}</Link>
          ))}
        </div>
        <form className="mt-4 flex flex-wrap items-end gap-3">
          <div><label className="label" htmlFor="from">From</label><input id="from" name="from" type="date" defaultValue={from} max={today} className="input w-auto" /></div>
          <div><label className="label" htmlFor="to">To</label><input id="to" name="to" type="date" defaultValue={to} max={today} className="input w-auto" /></div>
          <button className="btn-primary">Show report</button>
          <p className="text-xs text-ink/50">For a single day, pick the same date in both boxes.</p>
        </form>
      </div>

      {/* summary */}
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ["Total sales", rupees(t.sales)], ["Orders", String(t.orders)], ["Items sold", String(t.items)],
          ["Average order", rupees(t.orders ? Math.round(t.sales / t.orders) : 0)], ["Received (paid)", rupees(t.paid)], ["Cancelled", String(t.cancelled)],
        ].map(([k, v]) => (
          <div key={k} className="card p-4"><p className="text-xs font-semibold text-ink/55">{k}</p><p className="mt-1 font-display text-2xl font-black text-maroon-700">{v}</p></div>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink/60">Payment split: UPI <b>{rupees(t.upi)}</b> · Card <b>{rupees(t.card)}</b> · Cash on Delivery <b>{rupees(t.cod)}</b> · Still pending <b>{rupees(t.pending)}</b></p>

      {/* day-wise */}
      <section className="card mt-6 overflow-hidden">
        <h2 className="p-5 pb-3 font-display text-xl font-bold">Day-wise sales</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-cream text-left text-xs uppercase text-ink/50">
              <tr><th className="px-5 py-2">Date</th><th className="px-3 py-2">Orders</th><th className="px-3 py-2">Items</th><th className="px-3 py-2">UPI</th><th className="px-3 py-2">Card</th><th className="px-3 py-2">COD</th><th className="px-3 py-2">Sales</th><th className="px-3 py-2 w-40" /><th className="px-3 py-2">Cancelled</th><th /></tr>
            </thead>
            <tbody>
              {[...r.days].reverse().map((d) => (
                <tr key={d.day} className={`border-t border-maroon-700/5 ${d.orders ? "" : "text-ink/40"}`}>
                  <td className="px-5 py-2.5 font-semibold">{niceDay(d.day)}</td>
                  <td className="px-3 py-2.5">{d.orders}</td>
                  <td className="px-3 py-2.5">{d.items}</td>
                  <td className="px-3 py-2.5">{rupees(d.upi)}</td>
                  <td className="px-3 py-2.5">{rupees(d.card)}</td>
                  <td className="px-3 py-2.5">{rupees(d.cod)}</td>
                  <td className="px-3 py-2.5 font-bold text-maroon-700">{rupees(d.sales)}</td>
                  <td className="px-3 py-2.5"><div className="h-2 rounded-full bg-cream-dark"><div className="h-full rounded-full bg-gradient-to-r from-gold to-maroon-600" style={{ width: `${(d.sales / max) * 100}%` }} /></div></td>
                  <td className="px-3 py-2.5">{d.cancelled || "—"}</td>
                  <td className="px-3 py-2.5 text-right"><a href={`/api/admin/reports/sales?from=${d.day}&to=${d.day}`} title={`Download ${niceDay(d.day)} report (PDF)`} className="inline-flex rounded-lg p-1.5 text-maroon-700 hover:bg-cream"><Download className="h-4 w-4" /></a></td>
                </tr>
              ))}
              <tr className="border-t-2 border-maroon-700/20 bg-gold-pale/50 font-bold">
                <td className="px-5 py-3">Total</td><td className="px-3 py-3">{t.orders}</td><td className="px-3 py-3">{t.items}</td><td className="px-3 py-3">{rupees(t.upi)}</td><td className="px-3 py-3">{rupees(t.card)}</td><td className="px-3 py-3">{rupees(t.cod)}</td><td className="px-3 py-3 text-maroon-700">{rupees(t.sales)}</td><td /><td className="px-3 py-3">{t.cancelled || "—"}</td><td />
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[380px_1fr]">
        {/* top items */}
        <section className="card p-5">
          <h2 className="font-display text-xl font-bold">Top-selling items</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {r.top.map((p, i) => (
              <li key={p.name + p.label} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-maroon-700 text-[11px] font-bold text-cream">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{p.name} <span className="text-ink/50">{p.label}</span></span>
                <span className="font-semibold">× {p.qty}</span><span className="w-24 text-right text-ink/60">{rupees(p.amount)}</span>
              </li>
            ))}
            {!r.top.length && <li className="py-6 text-center text-ink/50">No sales in this period.</li>}
          </ol>
        </section>
        {/* orders with bill download */}
        <section className="card overflow-hidden">
          <h2 className="p-5 pb-3 font-display text-xl font-bold">Orders & bills</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-cream text-left text-xs uppercase text-ink/50"><tr><th className="px-5 py-2">Bill no.</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Total</th><th className="px-3 py-2">Status</th><th /></tr></thead>
              <tbody>
                {[...r.orders].reverse().map((o) => (
                  <tr key={o.id} className="border-t border-maroon-700/5">
                    <td className="px-5 py-2.5"><Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-maroon-700">{o.code}</Link></td>
                    <td className="px-3 py-2.5 text-xs text-ink/60">{new Date(o.created_at.replace(" ", "T") + "Z").toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="px-3 py-2.5">{o.customer_name}</td>
                    <td className="px-3 py-2.5 font-semibold">{rupees(o.total)}</td>
                    <td className="px-3 py-2.5 capitalize">{o.status}</td>
                    <td className="px-3 py-2.5 text-right"><a href={`/api/admin/orders/${o.id}/bill`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-maroon-700 ring-1 ring-maroon-700/20 hover:bg-cream"><Download className="h-3.5 w-3.5" /> Bill</a></td>
                  </tr>
                ))}
                {!r.orders.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-ink/50">No orders in this period.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
