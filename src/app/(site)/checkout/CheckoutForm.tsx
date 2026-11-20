"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Banknote, CreditCard, Loader2, Lock, QrCode, Smartphone, AlertCircle, Wallet } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { ProductArt } from "@/components/ProductArt";
import { rupees } from "@/lib/format";
import { COUNTRIES, INDIA } from "@/lib/countries";
import { placeOrderAction, quoteAction } from "./actions";

function Field({ name, label, error, ...rest }: { name: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} className={`input ${error ? "border-chilli ring-2 ring-chilli/20" : ""}`} aria-invalid={!!error} {...rest} />
      {error && <p className="mt-1 text-xs text-chilli">{error}</p>}
    </div>
  );
}

type Opts = { upiQr: boolean; phonepe: boolean; cod: boolean; codFee: number };
type Quote = Awaited<ReturnType<typeof quoteAction>>;

const STATES = ["Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Kerala", "Maharashtra", "Odisha", "Delhi", "Gujarat", "West Bengal", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "Punjab", "Haryana", "Bihar", "Jharkhand", "Chhattisgarh", "Goa", "Assam", "Uttarakhand", "Himachal Pradesh", "Jammu & Kashmir", "Puducherry", "Other"];

export function CheckoutForm({ options, whatsapp, international }: { options: Opts; whatsapp: string; international: boolean }) {
  const { lines, ready, setQty } = useCart();
  const [country, setCountry] = useState(INDIA);
  const abroad = country !== INDIA;
  const [q, setQ] = useState<Quote | null>(null);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  /**
   * What the shopper picks. PhonePe / Google Pay / other UPI all pay straight to our UPI ID (opening that app);
   * card goes through the PhonePe payment gateway (needs gateway keys); COD is pay-on-delivery.
   */
  const methods = useMemo(() => [
    { id: "phonepe_app", pay: "upi_qr", app: "phonepe", icon: Smartphone, title: "PhonePe", desc: "Pay by UPI with PhonePe — scan our QR or pay to our number. 0% fee.", tint: "text-[#5f259f]", ok: options.upiQr },
    { id: "gpay", pay: "upi_qr", app: "gpay", icon: Wallet, title: "Google Pay", desc: "Pay by UPI with Google Pay — scan our QR or pay to our number. 0% fee.", tint: "text-[#1a73e8]", ok: options.upiQr },
    { id: "upi", pay: "upi_qr", app: "upi", icon: QrCode, title: "Any UPI app / scan QR", desc: "Paytm, BHIM or any UPI app — or scan the QR code.", tint: "text-leaf", ok: options.upiQr },
    { id: "card", pay: "phonepe", app: "", icon: CreditCard, title: "Debit / Credit card", desc: "Visa, Mastercard, RuPay — on PhonePe's secure payment page.", tint: "text-maroon-700", ok: options.phonepe },
    { id: "cod", pay: "cod", app: "", icon: Banknote, title: "Cash on Delivery", desc: options.codFee ? `₹${options.codFee} COD handling fee applies.` : "Pay in cash when your order arrives.", tint: "text-gold", ok: options.cod },
  ].filter((m) => m.id !== "cod" || (m.ok && !abroad)), [options, abroad]); // Cash on Delivery: hidden when switched off, and never abroad
  const available = methods.filter((m) => m.ok);
  const [picked, setChoice] = useState(available[0]?.id ?? "");
  // if the picked method disappears (e.g. COD after choosing another country) fall back to the first available one
  const choice = available.some((m) => m.id === picked) ? picked : available[0]?.id ?? "";
  const chosen = methods.find((m) => m.id === choice);
  const payment = chosen?.pay ?? "";


  const items = useMemo(() => lines.map((l) => ({ variantId: l.variantId, qty: l.qty })), [lines]);
  useEffect(() => {
    if (!ready) return;
    let live = true;
    setQ(null);
    quoteAction(items, country).then((r) => live && setQ(r));
    return () => { live = false; };
  }, [items, ready, country]);

  if (!ready) return <div className="py-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-maroon-700" /></div>;
  if (!lines.length) return (
    <div className="card mt-8 p-10 text-center">
      <p className="text-lg">Your cart is empty.</p>
      <Link href="/shop" className="btn-primary mt-4">Browse products</Link>
    </div>
  );

  const codFee = payment === "cod" ? options.codFee * 100 : 0;
  const subtotal = q?.subtotal ?? 0;
  const shipping = q?.shipping ?? 0;
  const total = subtotal + shipping + codFee;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      country, name: String(fd.get("name") || ""), phone: String(fd.get("phone") || "").replace(/[\s\-()]/g, ""), email: String(fd.get("email") || ""),
      address: String(fd.get("address") || ""), city: String(fd.get("city") || ""), state: String(fd.get("state") || ""),
      pincode: String(fd.get("pincode") || ""), notes: String(fd.get("notes") || ""), payment, items, acceptTerms: fd.get("terms") === "on",
    };
    setErr(null); setFields({});
    start(async () => {
      const r = await placeOrderAction(input);
      if (!r.ok) { setErr(r.error); setFields(r.fields ?? {}); return; }
      window.location.href = chosen?.app && chosen.pay === "upi_qr" ? `${r.url}&app=${chosen.app}` : r.url;
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]" noValidate>
      <div className="space-y-6">
        <section className="card p-5 sm:p-7">
          <h2 className="font-display text-xl font-bold">Delivery details</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {international && (
              <div className="sm:col-span-2">
                <label className="label" htmlFor="country">Country</label>
                <select id="country" name="country" className="input" value={country} autoComplete="country-name" onChange={(e) => setCountry(e.target.value)}>
                  <option value={INDIA}>India</option>
                  <optgroup label="International delivery">{COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>
                </select>
                {fields.country && <p className="mt-1 text-xs text-chilli">{fields.country}</p>}
                {abroad && <p className="mt-1 text-xs text-ink/60">International orders are shipped by courier. Delivery charge depends on the country and parcel weight. Any customs duty in your country is paid by you.</p>}
              </div>
            )}
            <Field error={fields.name} name="name" label="Full name" autoComplete="name" required />
            <Field key={abroad ? "ph-intl" : "ph-in"} error={fields.phone} name="phone" label={abroad ? "Phone (with country code)" : "Mobile number"} autoComplete="tel" inputMode="tel" placeholder={abroad ? "+1 415 555 0123" : "10-digit mobile"} required />
            <div className="sm:col-span-2"><Field error={fields.email} name="email" label="Email (optional, for order updates)" type="email" autoComplete="email" /></div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="address">Full address</label>
              <textarea id="address" name="address" rows={3} autoComplete="street-address" className={`input ${fields.address ? "border-chilli" : ""}`} placeholder="House no, street, area, landmark" required />
              {fields.address && <p className="mt-1 text-xs text-chilli">{fields.address}</p>}
            </div>
            <Field error={fields.city} name="city" label="City / Town" autoComplete="address-level2" required />
            {abroad ? (
              <Field key="st-intl" error={fields.state} name="state" label="State / Province / Region" autoComplete="address-level1" required />
            ) : (
              <div>
                <label className="label" htmlFor="state">State</label>
                <select key="st-in" id="state" name="state" className="input" defaultValue="Andhra Pradesh">{STATES.map((s) => <option key={s}>{s}</option>)}</select>
              </div>
            )}
            <Field key={abroad ? "pc-intl" : "pc-in"} error={fields.pincode} name="pincode" label={abroad ? "Postcode / ZIP code" : "Pincode"} inputMode={abroad ? "text" : "numeric"} maxLength={abroad ? 12 : 6} autoComplete="postal-code" required />
            <div className="sm:col-span-2">
              <label className="label" htmlFor="notes">Order notes (optional)</label>
              <input id="notes" name="notes" className="input" placeholder="Spice preference, delivery instructions…" maxLength={400} />
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-7">
          <h2 className="font-display text-xl font-bold">Payment</h2>
          {available.length === 0 ? (
            <p className="mt-3 text-sm text-ink/70">Online ordering is being set up. Please <a className="text-maroon-700 underline" href={`https://wa.me/${whatsapp}`}>order on WhatsApp</a>.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
              {methods.map((m) => {
                const on = choice === m.id;
                return (
                  <label key={m.id} className={`relative flex items-start gap-3 rounded-2xl p-4 ring-1 transition ${!m.ok ? "cursor-not-allowed bg-ink/[0.03] opacity-55 ring-ink/10" : on ? "cursor-pointer bg-maroon-700/5 ring-2 ring-maroon-700" : "cursor-pointer bg-white ring-maroon-700/15 hover:ring-maroon-700/40"} ${m.id === "cod" ? "sm:col-span-2" : ""}`}>
                    <input type="radio" name="payment" value={m.id} checked={on} disabled={!m.ok} onChange={() => setChoice(m.id)} className="mt-1 accent-maroon-700" />
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white shadow-sm ring-1 ring-ink/10 ${m.tint}`}><m.icon className="h-5 w-5" /></span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{m.title}</span>
                      <span className="block text-sm text-ink/60">{m.ok ? m.desc : "Not available yet"}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          <p className="mt-4 flex items-center gap-2 text-xs text-ink/60"><Lock className="h-3.5 w-3.5" /> We never see or store your UPI PIN, card or bank details.</p>
        </section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">Order summary</h2>
          <ul className="mt-4 divide-y divide-maroon-700/10">
            {lines.map((l) => (
              <li key={l.variantId} className="flex gap-3 py-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">{l.image ? <img loading="lazy" decoding="async" src={l.image} alt="" className="h-full w-full object-cover" /> : <ProductArt art={l.art} name={l.name} className="h-full w-full" />}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l.name}</p>
                  <p className="text-xs text-ink/60">{l.label} × {l.qty}</p>
                </div>
                <span className="text-sm font-semibold">{rupees((q?.lines.find((x) => x.variantId === l.variantId)?.price ?? l.price) * l.qty)}</span>
              </li>
            ))}
          </ul>
          {q?.problems.length ? (
            <div className="mt-3 rounded-xl bg-chilli/10 p-3 text-sm text-chilli">
              <p className="flex items-center gap-1.5 font-semibold"><AlertCircle className="h-4 w-4" /> Cart needs attention</p>
              <ul className="mt-1 list-disc pl-5">{q.problems.map((p) => <li key={p}>{p}</li>)}</ul>
              <button type="button" className="mt-2 underline" onClick={() => lines.forEach((l) => { const ok = q.lines.find((x) => x.variantId === l.variantId); if (!ok) setQty(l.variantId, 0); })}>Remove unavailable items</button>
            </div>
          ) : null}
          <dl className="mt-4 space-y-2 border-t border-dashed border-maroon-700/20 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-semibold">{q ? rupees(subtotal) : "…"}</dd></div>
            <div className="flex justify-between"><dt>{abroad ? `Delivery to ${country}` : "Delivery"}</dt><dd className="font-semibold">{q ? (shipping ? rupees(shipping) : "FREE") : "…"}</dd></div>
            {codFee > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd className="font-semibold">{rupees(codFee)}</dd></div>}
            <div className="flex justify-between border-t border-maroon-700/10 pt-2 text-lg"><dt className="font-bold">Total</dt><dd className="font-black text-maroon-700">{q ? rupees(total) : "…"}</dd></div>
          </dl>
          <label className="mt-4 flex items-start gap-2 text-sm">
            <input type="checkbox" name="terms" className="mt-1 accent-maroon-700" required />
            <span>I agree to the <Link href="/terms-and-conditions" target="_blank" className="text-maroon-700 underline">Terms</Link>, <Link href="/privacy-policy" target="_blank" className="text-maroon-700 underline">Privacy</Link> and <Link href="/refund-policy" target="_blank" className="text-maroon-700 underline">Refund policy</Link>.</span>
          </label>
          {fields.acceptTerms && <p className="mt-1 text-xs text-chilli">{fields.acceptTerms}</p>}
          {err && <p role="alert" className="mt-3 rounded-xl bg-chilli/10 p-3 text-sm text-chilli">{err}</p>}
          <button type="submit" disabled={pending || !q || !!q.problems.length || !chosen?.ok} className="btn-primary mt-4 w-full py-3.5 text-base">
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
            {payment === "cod" ? "Place order" : "Place order & pay"} {q && `· ${rupees(total)}`}
          </button>
        </div>
      </aside>
    </form>
  );
}
