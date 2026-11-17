"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { claimPaidAction, submitUtrAction } from "./actions";

export function ClearCartOnce({ when }: { when: boolean }) {
  const { clear, ready } = useCart();
  useEffect(() => { if (when && ready) clear(); }, [when, ready, clear]);
  return null;
}

export function CopyText({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" onClick={() => navigator.clipboard?.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); })}
      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-maroon-700/20">
      {ok ? <Check className="h-4 w-4 text-leaf" /> : <Copy className="h-4 w-4" />} {label}
    </button>
  );
}

export function UtrForm({ code, token, existing }: { code: string; token: string; existing: string | null }) {
  const [utr, setUtr] = useState(existing ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form className="mt-4" onSubmit={(e) => { e.preventDefault(); start(async () => {
      const r = await submitUtrAction(code, token, utr);
      setMsg(r.ok ? { ok: true, text: "Thank you! We'll verify your payment and confirm your order shortly." } : { ok: false, text: r.error ?? "Error" });
      if (r.ok) router.refresh();
    }); }}>
      <label className="label" htmlFor="utr">After paying, enter the 12-digit UPI reference (UTR) number</label>
      <div className="flex gap-2">
        <input id="utr" value={utr} onChange={(e) => setUtr(e.target.value.replace(/[^\d]/g, "").slice(0, 12))} inputMode="numeric" placeholder="e.g. 412345678901" className="input font-mono" />
        <button className="btn-primary shrink-0" disabled={pending || utr.length !== 12}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}</button>
      </div>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-leaf" : "text-chilli"}`}>{msg.text}</p>}
    </form>
  );
}

/**
 * Keeps the order page live: checks every 5 seconds (while the tab is open) and refreshes the page when the
 * payment or order status changes. When the payment is confirmed it shows a big "Payment received" celebration.
 */
export function PaymentWatcher({ code, token, payment, status }: { code: string; token: string; payment: string; status: string }) {
  const router = useRouter();
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    // keep watching an expired order too: the shop may restore it when the money shows up
    if ((status === "cancelled" && payment !== "submitted" && payment !== "expired") || status === "delivered") return;
    let alive = true;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch(`/api/order-status?code=${encodeURIComponent(code)}&t=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (!r.ok || !alive) return;
        const j = (await r.json()) as { payment: string; status: string };
        if (j.payment !== payment || j.status !== status) {
          if (j.payment === "paid" && payment !== "paid") setCelebrate(true);
          router.refresh();
        }
      } catch {}
    };
    const t = setInterval(tick, 5000);
    document.addEventListener("visibilitychange", tick);
    return () => { alive = false; clearInterval(t); document.removeEventListener("visibilitychange", tick); };
  }, [code, token, payment, status, router]);

  useEffect(() => { if (celebrate) { const t = setTimeout(() => setCelebrate(false), 4500); return () => clearTimeout(t); } }, [celebrate]);
  if (!celebrate) return null;
  return (
    <div role="status" className="fixed inset-0 z-[95] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" onClick={() => setCelebrate(false)}>
      <div className="paid-pop w-full max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-2xl ring-2 ring-emerald-300">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500 text-white shadow-lg"><Check className="h-11 w-11" strokeWidth={3} /></span>
        <h2 className="mt-4 font-display text-2xl font-black text-emerald-700">Payment received!</h2>
        <p className="mt-1 text-ink/70">Your order is confirmed. We&apos;ll start packing it soon.</p>
      </div>
    </div>
  );
}

/**
 * Replaces the UTR box: one big "I've completed the payment" button (reference number optional).
 * When the shopper comes back from their UPI app, it also asks "Did your payment go through?".
 */
export function PaidButton({ code, token, whatsappUrl }: { code: string; token: string; whatsappUrl?: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ask, setAsk] = useState(false);
  const [utr, setUtr] = useState("");
  const router = useRouter();
  useEffect(() => {
    let hiddenAt = 0;
    const onVis = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 4000) setAsk(true); // back from the UPI app
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  const confirm = () => {
    // open the shop's WhatsApp chat with a ready message so the customer can send the payment screenshot
    if (whatsappUrl) window.open(whatsappUrl, "_blank", "noopener");
    send();
  };
  const send = () => start(async () => {
    const r = await claimPaidAction(code, token, utr);
    if (!r.ok) { setErr(r.error ?? "Error"); return; }
    setAsk(false); router.refresh();
  });
  return (
    <div className="mt-5">
      <button type="button" disabled={pending} onClick={confirm} className="btn w-full bg-emerald-600 py-3.5 text-base text-white shadow-lg hover:bg-emerald-700">
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />} I&apos;ve completed the payment
      </button>
      <details className="mt-2 text-xs text-ink/55">
        <summary className="cursor-pointer">Have the UPI reference number? (optional — helps us confirm faster)</summary>
        <input value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))} inputMode="numeric" placeholder="12-digit number (optional)" className="input mt-2 font-mono" />
      </details>
      {err && <p className="mt-2 text-sm text-chilli">{err}</p>}
      {ask && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Did your payment go through?">{/* confirm → WhatsApp */}
          <div className="paid-pop w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-2xl ring-2 ring-gold-light">
            <h2 className="font-display text-2xl font-black text-maroon-700">Did your payment go through?</h2>
            <p className="mt-2 text-sm text-ink/65">If your UPI app showed <b>“Payment successful”</b>, tap the button below.</p>
            <button type="button" disabled={pending} onClick={confirm} className="btn mt-5 w-full bg-emerald-600 py-3 text-white hover:bg-emerald-700">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Yes, I&apos;ve paid</button>
            <button type="button" onClick={() => setAsk(false)} className="btn-ghost mt-2 w-full">Not yet — pay again</button>
          </div>
        </div>
      )}
    </div>
  );
}
