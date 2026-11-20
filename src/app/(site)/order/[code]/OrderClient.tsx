"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Copy, ImageUp, Loader2, RefreshCw } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { claimPaidAction, submitUtrAction, uploadPaymentProofAction } from "./actions";

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
  // stay on this page: the next screen asks for the screenshot right here (WhatsApp is offered there as a backup)
  void whatsappUrl;
  const confirm = () => send();
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

/** Shrink a phone screenshot to max 1400px WebP/JPEG in the browser so it uploads fast on mobile data. */
async function shrink(file: File) {
  if (!/^image\//.test(file.type)) throw new Error("Please choose a photo of the payment screen.");
  if (file.size > 20 * 1024 * 1024) throw new Error("This photo is too large. Please choose the screenshot.");
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  let q = 0.85, out = c.toDataURL("image/webp", q);
  if (!out.startsWith("data:image/webp")) out = c.toDataURL("image/jpeg", 0.8);
  while (out.length > 1_400_000 && q > 0.35) { q -= 0.1; out = c.toDataURL(out.startsWith("data:image/webp") ? "image/webp" : "image/jpeg", q); }
  return out;
}

/**
 * One-tap "upload payment screenshot": pick from gallery (or take a photo), it is compressed and sent right away.
 * Shows the uploaded screenshot with a green tick so the customer knows we have it.
 */
export function ProofUpload({ code, token, existing }: { code: string; token: string; existing: string | null }) {
  const [preview, setPreview] = useState<string | null>(existing);
  const [done, setDone] = useState(!!existing);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const pick = (file: File | undefined) => {
    if (!file) return;
    setErr(null);
    start(async () => {
      try {
        const data = await shrink(file);
        setPreview(data);
        const r = await uploadPaymentProofAction(code, token, data);
        if (!r.ok) { setErr(r.error ?? "Upload failed"); setDone(false); return; }
        setDone(true); router.refresh();
      } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed"); }
    });
  };
  return (
    <div className="mt-5 w-full">
      <label className={`group relative flex cursor-pointer flex-col items-center gap-3 rounded-3xl border-2 border-dashed p-5 text-center transition ${done ? "border-emerald-400 bg-emerald-50" : "border-maroon-700/30 bg-white hover:border-maroon-700/60 hover:bg-cream/50"}`}>
        <input type="file" accept="image/*" className="sr-only" disabled={pending} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Your payment screenshot" className={`max-h-56 rounded-2xl shadow ring-1 ring-ink/10 ${pending ? "opacity-50" : ""}`} />
            {pending && <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-maroon-700" />}
            {done && !pending && <span className="absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-white shadow-lg ring-4 ring-white"><Check className="h-5 w-5" /></span>}
          </div>
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-full bg-maroon-700 text-cream shadow-lg transition group-hover:scale-105">{pending ? <Loader2 className="h-7 w-7 animate-spin" /> : <ImageUp className="h-7 w-7" />}</span>
        )}
        {done && !pending ? (
          <span>
            <span className="block font-display text-lg font-bold text-emerald-800">Screenshot received ✓</span>
            <span className="mt-0.5 flex items-center justify-center gap-1 text-xs text-emerald-900/70"><RefreshCw className="h-3 w-3" /> Wrong photo? Tap to choose another</span>
          </span>
        ) : (
          <span>
            <span className="block font-display text-lg font-bold text-maroon-700">{pending ? "Uploading…" : "Upload payment screenshot"}</span>
            <span className="mt-0.5 flex items-center justify-center gap-1 text-xs text-ink/60"><Camera className="h-3.5 w-3.5" /> Tap to choose the &quot;Payment successful&quot; screenshot from your gallery</span>
          </span>
        )}
      </label>
      {err && <p className="mt-2 rounded-xl bg-chilli/10 p-2 text-center text-sm text-chilli">{err}</p>}
    </div>
  );
}
