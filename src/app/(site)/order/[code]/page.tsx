import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CheckCircle2, Clock, Hourglass, PackageCheck, Phone, ShieldCheck, Truck, XCircle } from "lucide-react";
import { expireUnpaidOrders, getOrderForCustomer, PAYMENT_WINDOW_HOURS } from "@/lib/orders";
import { refreshPhonePeStatus, upiQrFor } from "@/lib/payments";
import { getSettings } from "@/lib/settings";
import { rupees } from "@/lib/format";
import { ClearCartOnce, CopyText, PaidButton, PaymentWatcher, ProofUpload } from "./OrderClient";
import { WhatsAppIcon } from "@/components/brand/SocialIcons";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const STEPS = ["placed", "confirmed", "packed", "shipped", "delivered"] as const;
const PAY_LABEL: Record<string, string> = { pending: "Awaiting payment", submitted: "Payment submitted — verifying", paid: "Paid", failed: "Payment failed", refunded: "Refunded", expired: "Payment not received" };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ t?: string; new?: string; pp?: string; app?: string }> }) {
  const { code } = await params;
  const sp = await searchParams;
  await expireUnpaidOrders().catch(() => 0);
  let order = await getOrderForCustomer(code, sp.t ?? "");
  if (!order) notFound();
  if (order.payment_method === "phonepe" && order.payment_status !== "paid") {
    await refreshPhonePeStatus(order);
    order = (await getOrderForCustomer(code, sp.t ?? ""))!;
  }
  const s = await getSettings();
  // the QR / pay box is shown only while we are still waiting for the customer to pay
  const showQr = order.payment_method === "upi_qr" && (order.payment_status === "pending" || order.payment_status === "failed") && order.status !== "cancelled";
  // "submitted" also covers a customer who said "I've paid" after the order expired — the shop checks and restores it
  const verifying = order.payment_method === "upi_qr" && order.payment_status === "submitted";
  const expired = order.payment_status === "expired";
  const paid = order.payment_status === "paid";
  const qr = showQr ? await upiQrFor(order) : null;
  // after "I've paid", the customer lands in our WhatsApp chat with this message (and attaches the payment screenshot)
  const paidWa = `https://wa.me/${s.whatsapp}?text=${encodeURIComponent(
    `Hello VSM Godavari Foods, I have paid ${rupees(order.total)} for order ${order.code}.\nName: ${order.customer_name}\nPhone: ${order.phone}\nI'm sending the payment screenshot here.`)}`;
  const stepIdx = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const cancelled = order.status === "cancelled";

  return (
    <div className="container-x max-w-4xl py-10">
      <ClearCartOnce when={sp.new === "1"} />
      <PaymentWatcher code={order.code} token={sp.t ?? ""} payment={order.payment_status} status={order.status} />
      <div className="text-center">
        {expired || verifying || showQr ? <Clock className="mx-auto h-14 w-14 text-gold" /> : cancelled ? <XCircle className="mx-auto h-14 w-14 text-chilli" /> : showQr || verifying ? <Clock className="mx-auto h-14 w-14 text-gold" /> : <CheckCircle2 className="mx-auto h-14 w-14 text-leaf" />}
        <h1 className="mt-3 font-display text-3xl font-black text-maroon-700 sm:text-4xl">{expired ? "Payment not received" : verifying ? "Waiting for payment confirmation" : cancelled ? "Order cancelled" : showQr ? "Complete your payment" : paid || order.payment_method === "cod" ? "Order placed successfully!" : "Waiting for payment"}</h1>
        <p className="mt-2 text-ink/70">Order <b className="font-mono">{order.code}</b> · {PAY_LABEL[order.payment_status]}</p>
        <p className="mt-1 text-xs text-ink/50">Bookmark this page to track your order. Only people with this link can see it.</p>
      </div>

      {sp.pp === "fail" && order.payment_status !== "paid" && (
        <p className="mt-6 rounded-2xl bg-chilli/10 p-4 text-center text-sm text-chilli">We couldn&apos;t open the PhonePe payment page. Please contact us on WhatsApp with your order number and we&apos;ll help you complete payment.</p>
      )}

      {showQr && qr && qr.personal && (
        /* personal UPI: scan the QR or pay to the mobile number (no pre-filled merchant links → no UPI risk warning) */
        <section className="card mt-8 overflow-hidden">
          <div className="bg-gradient-to-r from-maroon-700 to-maroon-800 px-6 py-4 text-center text-cream">
            <p className="text-sm text-gold-light">Amount to pay</p>
            <p className="font-display text-4xl font-black">{rupees(order.total)}</p>
            <p className="text-xs text-cream/70">Paying to <b>{qr.payee}</b> · {qr.upiId}</p>
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-[260px_1fr] sm:p-8">
            <div className="text-center">
              <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-inner ring-1 ring-maroon-700/10">
                <img src={qr.image} alt={`UPI QR code to pay ${rupees(order.total)}`} className="h-52 w-52" />
              </div>
              <a href={qr.image} download={`VSM-pay-${order.code}.png`} className="btn-ghost mt-3 bg-white text-sm">⬇ Save QR to gallery</a>
            </div>
            <div className="space-y-4 text-sm">
              <div className="rounded-2xl bg-cream/70 p-4">
                <p className="font-semibold text-maroon-700">Option 1 · Scan the QR</p>
                <p className="mt-1 text-ink/70"><span className="hidden sm:inline">Open {sp.app === "gpay" ? "Google Pay" : sp.app === "phonepe" ? "PhonePe" : "your UPI app"} on your phone and scan this code.</span><span className="sm:hidden">Tap <b>Save QR to gallery</b>, open {sp.app === "gpay" ? "Google Pay" : sp.app === "phonepe" ? "PhonePe" : "your UPI app"} → <b>Scan</b> → choose the photo from your gallery.</span> The amount fills in automatically.</p>
              </div>
              {qr.mobile && (
                <div className="rounded-2xl bg-cream/70 p-4">
                  <p className="font-semibold text-maroon-700">Option 2 · Pay to our mobile number</p>
                  <p className="mt-1 text-ink/70">In {sp.app === "gpay" ? "Google Pay" : sp.app === "phonepe" ? "PhonePe" : "your UPI app"} choose <b>Pay to mobile number / contact</b>, enter the number and amount:</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <b className="font-mono text-base">{qr.mobile}</b> <CopyText text={qr.mobile} label="Copy number" />
                    <b className="ml-2 text-base">{rupees(order.total)}</b> <CopyText text={String(order.total / 100)} label="Copy amount" />
                  </div>
                </div>
              )}
              <p className="flex flex-wrap items-center gap-2 text-ink/60">UPI ID: <b className="font-mono text-ink">{qr.upiId}</b> <CopyText text={qr.upiId} label="Copy" /></p>
              <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Please pay exactly <b>{rupees(order.total)}</b> and add the note <b className="font-mono">{order.code}</b> if your app asks for one.</p>
              <PaidButton code={order.code} token={sp.t ?? ""} whatsappUrl={paidWa} />
              <p className="text-center text-xs text-ink/50">Please pay within {PAYMENT_WINDOW_HOURS} hours — after that the items are released for other customers.</p>
            </div>
          </div>
        </section>
      )}

      {showQr && qr && !qr.personal && qr.links && (
        <section className="card mt-8 grid items-center gap-6 p-6 sm:grid-cols-[240px_1fr] sm:p-8">
          <div className="mx-auto rounded-2xl bg-white p-3 shadow-inner ring-1 ring-maroon-700/10">
            <img src={qr.image} alt={`UPI QR code to pay ${rupees(order.total)}`} className="h-52 w-52" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Pay {rupees(order.total)} via UPI</h2>
            <p className="mt-1 text-sm text-ink/70">Scan with any UPI app — or tap a button below on your phone. The amount is fixed for this order.</p>
            {(sp.app === "gpay" || sp.app === "phonepe") && (
              <a href={sp.app === "gpay" ? qr.links.gpay : qr.links.phonepe} className="btn-primary mt-4 w-full py-3 text-base sm:hidden">
                Pay {rupees(order.total)} with {sp.app === "gpay" ? "Google Pay" : "PhonePe"}
              </a>
            )}
            <div className="mt-4 flex flex-wrap gap-2 sm:hidden">
              {sp.app !== "gpay" && <a href={qr.links.gpay} className="btn-ghost bg-white">Google Pay</a>}
              {sp.app !== "phonepe" && <a href={qr.links.phonepe} className="btn-ghost bg-white">PhonePe</a>}
              <a href={qr.links.paytm} className="btn-ghost bg-white">Paytm</a>
              <a href={qr.links.generic} className={sp.app === "gpay" || sp.app === "phonepe" ? "btn-ghost bg-white" : "btn-primary"}>Other UPI app</a>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-ink/60">UPI ID:</span> <b className="font-mono">{qr.upiId}</b> <CopyText text={qr.upiId} label="Copy" />
            </div>
            <PaidButton code={order.code} token={sp.t ?? ""} whatsappUrl={paidWa} />
          </div>
        </section>
      )}

      {expired && order.payment_method === "upi_qr" && (
        <section className="mt-8 rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-maroon-700/10 sm:p-8">
          <h2 className="font-display text-2xl font-bold text-maroon-700">We haven&apos;t received your payment yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-ink/70">This order wasn&apos;t paid within {PAYMENT_WINDOW_HOURS} hours, so the items were released. <b>Already paid {rupees(order.total)}?</b> Tap the button below — we&apos;ll check our bank and restore your order. Nothing is lost.</p>
          <div className="mx-auto max-w-sm"><PaidButton code={order.code} token={sp.t ?? ""} whatsappUrl={paidWa} /></div>
          <p className="mt-4 text-sm text-ink/60">Haven&apos;t paid yet? Please <Link href="/shop" className="font-semibold text-maroon-700 underline">place a new order</Link>.</p>
        </section>
      )}

      {verifying && (
        <section className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-maroon-700/10">
          {/* progress: what's done and what's left */}
          <ol className="grid grid-cols-3 gap-2 bg-cream/70 px-4 py-5 text-center text-xs font-semibold sm:text-sm">
            {[
              { t: "Order placed", done: true },
              { t: "Payment sent", done: true },
              { t: "We confirm", done: false },
            ].map((st, i) => (
              <li key={st.t} className="flex flex-col items-center gap-2">
                <span className={`grid h-10 w-10 place-items-center rounded-full ${st.done ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-700 ring-2 ring-amber-300"}`}>
                  {st.done ? <CheckCircle2 className="h-5 w-5" /> : <Hourglass className="h-5 w-5 animate-pulse" />}
                </span>
                <span className={st.done ? "text-emerald-800" : "text-amber-800"}>{i + 1}. {st.t}</span>
              </li>
            ))}
          </ol>

          <div className="p-6 text-center sm:p-8">
            <h2 className="font-display text-2xl font-bold text-maroon-700">Thank you! Your order is saved</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-ink/70">We&apos;re matching your payment of <b>{rupees(order.total)}</b> with our bank{order.utr ? <> (reference <b className="font-mono">{order.utr}</b>)</> : null}. This usually takes a few minutes during working hours — <b>this page updates by itself</b>.</p>

            <div className="mx-auto max-w-md">
              {!order.payment_proof && <p className="mt-6 text-sm font-semibold text-maroon-700">To confirm faster, upload the screenshot of your payment:</p>}
              <ProofUpload code={order.code} token={sp.t ?? ""} existing={order.payment_proof} />
              <a href={paidWa} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#128C7E] hover:underline">
                <WhatsAppIcon className="h-4 w-4" /> Or send it to us on WhatsApp
              </a>
            </div>

            {/* reassurance */}
            <ul className="mx-auto mt-7 grid max-w-2xl gap-3 text-left text-sm sm:grid-cols-3">
              <li className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100"><ShieldCheck className="h-5 w-5 text-emerald-600" /><b className="mt-2 block text-emerald-900">Your money is safe</b><span className="text-xs text-emerald-900/70">If we can&apos;t match your payment, we refund the full amount.</span></li>
              <li className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100"><PackageCheck className="h-5 w-5 text-emerald-600" /><b className="mt-2 block text-emerald-900">Items reserved for you</b><span className="text-xs text-emerald-900/70">Your jars are kept aside while we confirm.</span></li>
              <li className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100"><Phone className="h-5 w-5 text-emerald-600" /><b className="mt-2 block text-emerald-900">Talk to us anytime</b><span className="text-xs text-emerald-900/70">Call <a href={`tel:+91${s.phone}`} className="font-semibold underline">+91 {s.phone}</a></span></li>
            </ul>
          </div>
        </section>
      )}

      {paid && !cancelled && (
        <section className="mt-8 flex flex-col items-center gap-3 rounded-3xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200 sm:flex-row sm:text-left">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-emerald-500 text-white shadow"><BadgeCheck className="h-8 w-8" /></span>
          <div>
            <h2 className="font-display text-xl font-bold text-emerald-800">Payment received · {rupees(order.total)}</h2>
            <p className="text-sm text-emerald-900/75">Your order is confirmed. We&apos;ll pack it fresh and send you the tracking details here.</p>
          </div>
        </section>
      )}

      {!cancelled && (paid || order.payment_method === "cod") && (
        <section className="card mt-8 p-6">
          <ol className="grid grid-cols-5 gap-2 text-center text-[11px] font-semibold sm:text-sm">
            {STEPS.map((st, i) => {
              const Icon = [Clock, CheckCircle2, PackageCheck, Truck, CheckCircle2][i];
              const done = i <= stepIdx;
              return (
                <li key={st} className="flex flex-col items-center gap-2">
                  <span className={`grid h-10 w-10 place-items-center rounded-full ${done ? "bg-leaf text-white" : "bg-cream-dark text-ink/40"}`}><Icon className="h-5 w-5" /></span>
                  <span className={`capitalize ${done ? "" : "text-ink/40"}`}>{st}</span>
                </li>
              );
            })}
          </ol>
          {order.tracking && <p className="mt-5 rounded-xl bg-cream p-3 text-center text-sm">Tracking: <b>{order.tracking}</b></p>}
        </section>
      )}

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-xl font-bold">Items</h2>
          <ul className="mt-3 divide-y divide-maroon-700/10 text-sm">
            {order.items.map((i) => (
              <li key={i.variantId} className="flex justify-between py-2"><span>{i.name} <span className="text-ink/50">({i.label}) × {i.qty}</span></span><span className="font-semibold">{rupees(i.price * i.qty)}</span></li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-dashed border-maroon-700/20 pt-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{rupees(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery & fees</dt><dd>{order.shipping ? rupees(order.shipping) : "FREE"}</dd></div>
            <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd className="text-maroon-700">{rupees(order.total)}</dd></div>
          </dl>
        </div>
        <div className="card p-6 text-sm">
          <h2 className="font-display text-xl font-bold">Delivery to</h2>
          <p className="mt-3 font-semibold">{order.customer_name}</p>
          <p className="text-ink/70">{order.address}, {order.city}, {order.state} – {order.pincode}{order.country && order.country !== "India" ? `, ${order.country}` : ""}</p>
          <p className="text-ink/70">{order.phone.startsWith("+") ? order.phone : `+91 ${order.phone}`}</p>
          <p className="mt-4 text-ink/70">Payment: <b>{order.payment_method === "cod" ? "Cash on Delivery" : order.payment_method === "phonepe" ? "PhonePe / UPI" : "UPI"}</b></p>
          <a className="btn-gold mt-5" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(`Hello VSM Godavari Foods, about my order ${order.code}`)}`}>Questions? WhatsApp us</a>
        </div>
      </section>
      <div className="mt-10 text-center"><Link href="/shop" className="btn-ghost">Continue shopping</Link></div>
    </div>
  );
}
