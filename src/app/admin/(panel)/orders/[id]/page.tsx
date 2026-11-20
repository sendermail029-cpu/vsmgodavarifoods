import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/orders";
import { rupees } from "@/lib/format";
import { Badge, PageHeader } from "@/components/admin/ui";
import { OrderControls } from "./OrderControls";
import { CustomerMessages } from "./CustomerMessages";
import { getSettings } from "@/lib/settings";

const METHOD: Record<string, string> = { upi_qr: "UPI (scan & pay to your UPI ID)", phonepe: "PhonePe (automatic)", cod: "Cash on Delivery" };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const o = await getOrderById(Number((await params).id));
  if (!o) notFound();
  const s = await getSettings();
  const wa = `https://wa.me/${o.phone.startsWith("+") ? o.phone.slice(1) : `91${o.phone}`}?text=${encodeURIComponent(`Hello ${o.customer_name}, this is VSM Godavari Foods about your order ${o.code}.`)}`;
  return (
    <div>
      <PageHeader title={`Order ${o.code}`} sub={new Date(o.created_at.replace(" ", "T") + "Z").toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}>
        <a href={`/api/admin/orders/${o.id}/bill`} className="btn-primary">⬇ Download bill (PDF)</a>
        <a href={`/api/admin/stickers?type=shipping&ids=${o.id}`} className="btn-ghost bg-white">🚚 Parcel label</a>
        <a href={`/api/admin/stickers?type=jars&ids=${o.id}`} className="btn-ghost bg-white">🏷 Jar stickers</a>
        <Link href="/admin/orders" className="btn-ghost bg-white">← All orders</Link>
      </PageHeader>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-display text-xl font-bold">Items</h2>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {o.items.map((i) => (
                  <tr key={i.variantId} className="border-b border-maroon-700/5"><td className="py-2">{i.name} <span className="text-ink/50">{i.label}</span></td><td className="py-2 text-center">× {i.qty}</td><td className="py-2 text-right">{rupees(i.price)}</td><td className="py-2 text-right font-semibold">{rupees(i.price * i.qty)}</td></tr>
                ))}
              </tbody>
            </table>
            <dl className="ml-auto mt-3 max-w-xs space-y-1 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{rupees(o.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Delivery/fees</dt><dd>{rupees(o.shipping)}</dd></div>
              <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd className="text-maroon-700">{rupees(o.total)}</dd></div>
            </dl>
          </section>
          <section className="card grid gap-6 p-5 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-xl font-bold">Customer</h2>
              <p className="mt-2 font-semibold">{o.customer_name}</p>
              <p className="text-sm"><a className="text-maroon-700" href={`tel:${o.phone.startsWith("+") ? o.phone : `+91${o.phone}`}`}>{o.phone.startsWith("+") ? o.phone : `+91 ${o.phone}`}</a>{o.email && <> · <a className="text-maroon-700" href={`mailto:${o.email}`}>{o.email}</a></>}</p>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-gold mt-3">WhatsApp customer</a>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Ship to</h2>
              <p className="mt-2 whitespace-pre-line text-sm">{o.customer_name}{"\n"}{o.address}{"\n"}{o.city}, {o.state} – {o.pincode}{o.country && o.country !== "India" ? `, ${o.country.toUpperCase()}` : ""}{"\n"}Ph: {o.phone}</p>
              {o.notes && <p className="mt-3 rounded-xl bg-turmeric/20 p-3 text-sm"><b>Note:</b> {o.notes}</p>}
            </div>
          </section>
        </div>
        <aside className="space-y-6">
          <section className="card space-y-3 p-5 text-sm">
            <h2 className="font-display text-xl font-bold">Payment</h2>
            <p>{METHOD[o.payment_method]}</p>
            <p>Status: <Badge v={o.payment_status} /></p>
            {o.utr && <p>Customer UTR: <b className="font-mono text-base">{o.utr}</b></p>}
            {o.provider_txn && <p>Transaction ID: <span className="font-mono">{o.provider_txn}</span></p>}
            {o.payment_proof && (
              <div>
                <p className="font-semibold">Customer&apos;s payment screenshot</p>
                <a href={o.payment_proof} target="_blank" rel="noopener noreferrer" title="Open full size">
                  <img src={o.payment_proof} alt="Payment screenshot sent by the customer" className="mt-2 max-h-80 w-full rounded-xl object-contain ring-1 ring-maroon-700/15 transition hover:ring-maroon-700/50" />
                </a>
                <p className="mt-1 text-[11px] text-ink/50">Tap to open full size. A screenshot can be faked — always check the money in your bank app before marking Paid.</p>
              </div>
            )}
            {o.payment_method === "upi_qr" && o.payment_status !== "paid" && (
              <p className="rounded-xl bg-cream p-3 text-xs text-ink/70">Open your bank / UPI business app and check that <b>{rupees(o.total)}</b> was received{o.utr ? <> with reference <b>{o.utr}</b></> : ""} (note: <b>Order {o.code}</b>). Only then mark as <b>Paid</b>. If they paid to the mobile number without a note, match by the <b>amount</b> and the <b>payer&apos;s name</b> ({o.customer_name}).</p>
            )}
          </section>
          <CustomerMessages o={o} shop={s.store_name || "VSM Godavari Foods"} />
          <OrderControls cod={o.payment_method === "cod"} id={o.id} status={o.status} payment={o.payment_status} tracking={o.tracking ?? ""} />
        </aside>
      </div>
    </div>
  );
}
