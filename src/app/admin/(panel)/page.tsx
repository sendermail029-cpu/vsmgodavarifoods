import Link from "next/link";
import { AlertTriangle, IndianRupee, PackageCheck, ShoppingCart, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { rupees } from "@/lib/format";
import { listOrders } from "@/lib/orders";
import { materialAlerts } from "@/lib/materials";
import { paymentOptions } from "@/lib/settings";
import { Badge, PageHeader } from "@/components/admin/ui";

export default async function Dashboard() {
  const c = await db();
  const [today, month, verify, toShip, low, recent, opts] = await Promise.all([
    c.execute("SELECT COUNT(*) n, COALESCE(SUM(total),0) s FROM orders WHERE date(created_at) = date('now') AND status != 'cancelled'"),
    c.execute("SELECT COUNT(*) n, COALESCE(SUM(total),0) s FROM orders WHERE created_at >= datetime('now','-30 days') AND payment_status = 'paid'"),
    c.execute("SELECT COUNT(*) n FROM orders WHERE payment_status = 'submitted'"),
    c.execute("SELECT COUNT(*) n FROM orders WHERE status IN ('placed','confirmed','packed') AND (payment_status = 'paid' OR payment_method = 'cod')"),
    c.execute("SELECT v.id, v.label, v.stock, v.low_stock_at, p.name, p.id pid FROM variants v JOIN products p ON p.id = v.product_id WHERE v.stock <= v.low_stock_at AND p.active = 1 ORDER BY v.stock LIMIT 10"),
    listOrders(),
    paymentOptions(),
  ]);
  const shortages = await materialAlerts();
  const stats = [
    { t: "Orders today", v: String(today.rows[0].n), sub: rupees(Number(today.rows[0].s)), icon: ShoppingCart },
    { t: "Paid sales (30 days)", v: rupees(Number(month.rows[0].s)), sub: `${month.rows[0].n} orders`, icon: IndianRupee },
    { t: "Customer says paid", v: String(verify.rows[0].n), sub: "Check your bank app", icon: Wallet, href: "/admin/orders?view=action" },
    { t: "Orders to pack & ship", v: String(toShip.rows[0].n), sub: "Paid or COD", icon: PackageCheck, href: "/admin/orders?view=action" },
  ];
  return (
    <div>
      <PageHeader title="Dashboard" sub="Welcome back! Here's how VSM Godavari Foods is doing." />
      {!opts.upiQr && !opts.phonepe && (
        <Link href="/admin/settings" className="mb-6 flex items-center gap-3 rounded-2xl bg-turmeric/25 p-4 text-sm font-semibold">
          <AlertTriangle className="h-5 w-5 text-chilli" /> Add your business UPI ID in Settings to accept online payments (0% fee). →
        </Link>
      )}
      {shortages.length > 0 && (
        <Link href="/admin/ingredients" className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-gradient-to-r from-maroon-700 to-maroon-800 p-4 text-sm text-cream shadow-lg">
          <AlertTriangle className="h-5 w-5 text-gold-light" />
          <b>Ingredients to buy soon:</b>
          {shortages.slice(0, 6).map((m) => <span key={m.id} className="rounded-full bg-white/10 px-2.5 py-1">{m.name} · {Math.round(m.stock * 100) / 100} {m.unit}</span>)}
          {shortages.length > 6 && <span>+{shortages.length - 6} more</span>}
          <span className="ml-auto font-semibold text-gold-light">View →</span>
        </Link>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ t, v, sub, icon: I, href }) => {
          const body = (
            <div className="card h-full p-5">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold text-ink/60">{t}</p><I className="h-5 w-5 text-chilli" /></div>
              <p className="mt-2 font-display text-3xl font-black text-maroon-700">{v}</p>
              <p className="text-xs text-ink/50">{sub}</p>
            </div>
          );
          return href ? <Link key={t} href={href}>{body}</Link> : <div key={t}>{body}</div>;
        })}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between p-5"><h2 className="font-display text-xl font-bold">Recent orders</h2><Link href="/admin/orders" className="text-sm font-semibold text-maroon-700">View all →</Link></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream text-left text-xs uppercase text-ink/50"><tr><th className="px-5 py-2">Order</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Total</th><th className="px-3 py-2">Payment</th><th className="px-3 py-2">Status</th></tr></thead>
              <tbody>
                {recent.slice(0, 8).map((o) => (
                  <tr key={o.id} className="border-t border-maroon-700/5 hover:bg-cream/50">
                    <td className="px-5 py-2.5"><Link className="font-mono font-semibold text-maroon-700" href={`/admin/orders/${o.id}`}>{o.code}</Link></td>
                    <td className="px-3 py-2.5">{o.customer_name}</td>
                    <td className="px-3 py-2.5 font-semibold">{rupees(o.total)}</td>
                    <td className="px-3 py-2.5"><Badge v={o.payment_status} /></td>
                    <td className="px-3 py-2.5"><Badge v={o.status} /></td>
                  </tr>
                ))}
                {!recent.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-ink/50">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card p-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Low stock</h2><Link href="/admin/inventory" className="text-sm font-semibold text-maroon-700">Inventory →</Link></div>
          <ul className="mt-3 divide-y divide-maroon-700/5 text-sm">
            {low.rows.map((r) => (
              <li key={String(r.id)} className="flex items-center justify-between py-2.5">
                <span>{String(r.name)} <span className="text-ink/50">{String(r.label)}</span></span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${Number(r.stock) === 0 ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}`}>{Number(r.stock) === 0 ? "Out" : `${r.stock} left`}</span>
              </li>
            ))}
            {!low.rows.length && <li className="py-6 text-center text-ink/50">All products well stocked 👍</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
