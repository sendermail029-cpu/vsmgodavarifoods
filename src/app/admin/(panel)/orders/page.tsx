import Link from "next/link";
import { countOrderViews, listOrders, ORDER_VIEWS, PAYMENT_WINDOW_HOURS, type OrderView } from "@/lib/orders";
import { rupees } from "@/lib/format";
import { Badge, PageHeader } from "@/components/admin/ui";

const STATUSES = ["", "placed", "confirmed", "packed", "shipped", "delivered", "cancelled"];
const PAYS = ["", "pending", "submitted", "paid", "failed", "refunded", "expired"];
const METHOD: Record<string, string> = { upi_qr: "UPI QR", phonepe: "PhonePe", cod: "COD" };
const HELP: Record<OrderView, string> = {
  action: "Paid (or COD) orders to pack & ship, and customers who say they paid — check your bank for those.",
  awaiting: `Customers who saw the payment page but haven't paid yet. Don't pack these. After ${PAYMENT_WINDOW_HOURS} hours they move to "Expired" and the stock is released.`,
  expired: "Not paid in time — stock was released. Nothing is deleted: if you find the money in your bank, open the order and tap “Money received — restore order”.",
  done: "Orders already shipped or delivered.",
  all: "Every order, including cancelled ones.",
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ view?: string; status?: string; payment?: string; q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.slice(0, 40);
  // searching looks through all orders; otherwise start on "Needs action"
  const view: OrderView = sp.view && sp.view in ORDER_VIEWS ? (sp.view as OrderView) : q || sp.status || sp.payment ? "all" : "action";
  const [orders, counts] = await Promise.all([
    listOrders({ view, status: STATUSES.includes(sp.status ?? "") ? sp.status || undefined : undefined, payment: PAYS.includes(sp.payment ?? "") ? sp.payment || undefined : undefined, q }),
    countOrderViews(),
  ]);
  return (
    <div>
      <PageHeader title="Orders" sub={`${orders.length} ${ORDER_VIEWS[view].toLowerCase()}`}><Link href="/admin/reports" className="btn-ghost bg-white">📊 Sales reports & downloads</Link></PageHeader>

      <nav className="mb-3 flex flex-wrap gap-2" aria-label="Order lists">
        {(Object.keys(ORDER_VIEWS) as OrderView[]).map((v) => (
          <Link key={v} href={`/admin/orders?view=${v}`} aria-current={v === view ? "page" : undefined}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${v === view ? "bg-maroon-700 text-cream ring-maroon-700" : "bg-white text-ink/75 ring-maroon-700/15 hover:bg-cream"}`}>
            {ORDER_VIEWS[v]}
            {v !== "all" && <span className={`rounded-full px-2 text-xs ${v === view ? "bg-cream/20" : v === "action" && counts.action ? "bg-chilli text-white" : "bg-ink/5"}`}>{counts[v]}</span>}
          </Link>
        ))}
      </nav>
      <p className="mb-4 text-sm text-ink/60">{HELP[view]}</p>

      <form className="mb-4 flex flex-wrap gap-2">
        <input type="hidden" name="view" value={view} />
        <input name="q" defaultValue={sp.q} placeholder="Order no, name or phone" className="input w-60" />
        {view === "all" && <>
          <select name="status" defaultValue={sp.status ?? ""} className="input w-auto">{STATUSES.map((s) => <option key={s} value={s}>{s ? `Status: ${s}` : "All statuses"}</option>)}</select>
          <select name="payment" defaultValue={sp.payment ?? ""} className="input w-auto">{PAYS.map((s) => <option key={s} value={s}>{s ? `Payment: ${s}` : "All payments"}</option>)}</select>
        </>}
        <button className="btn-primary">Search</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-cream text-left text-xs uppercase text-ink/50"><tr><th className="px-4 py-2">Order</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Items</th><th className="px-3 py-2">Total</th><th className="px-3 py-2">Payment</th><th className="px-3 py-2">Status</th><th /></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className={`border-t border-maroon-700/5 hover:bg-cream/40 ${o.payment_status === "submitted" ? "bg-yellow-50/70" : ""}`}>
                <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="font-mono font-bold text-maroon-700">{o.code}</Link></td>
                <td className="px-3 py-3 text-xs text-ink/60">{new Date(o.created_at.replace(" ", "T") + "Z").toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="px-3 py-3"><p className="font-semibold">{o.customer_name}</p><p className="text-xs text-ink/50">{o.phone} · {o.city}</p></td>
                <td className="px-3 py-3 text-xs">{o.items.map((i) => `${i.name} ${i.label}×${i.qty}`).join(", ")}</td>
                <td className="px-3 py-3 font-semibold">{rupees(o.total)}</td>
                <td className="px-3 py-3"><span className="mr-1 text-xs text-ink/50">{METHOD[o.payment_method]}</span><Badge v={o.payment_status} /></td>
                <td className="px-3 py-3">{o.payment_status === "expired" ? <span className="text-xs text-ink/40">—</span> : <Badge v={o.status} />}</td>
                <td className="px-3 py-3 text-right">
                  {o.payment_status === "submitted" || o.payment_status === "expired"
                    ? <Link href={`/admin/orders/${o.id}`} className="inline-flex rounded-lg bg-maroon-700 px-3 py-1.5 text-xs font-semibold text-cream">{o.payment_status === "submitted" ? "Check payment" : "Open"}</Link>
                    : <a href={`/api/admin/orders/${o.id}/bill`} title="Download bill (PDF)" className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-maroon-700 ring-1 ring-maroon-700/20 hover:bg-cream">⬇ Bill</a>}
                </td>
              </tr>
            ))}
            {!orders.length && <tr><td colSpan={8} className="px-4 py-12 text-center text-ink/50">{view === "action" ? "All caught up — nothing to do right now. 🎉" : "No orders here."}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
