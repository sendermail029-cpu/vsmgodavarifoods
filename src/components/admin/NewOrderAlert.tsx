"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Bell, BellRing, PartyPopper, X } from "lucide-react";
import { rupees } from "@/lib/format";

type Latest = { id: number; code: string; customer: string; city: string; total: number; method: string; createdAt: string; alertAt: string; payment: string; summary: string };
const SEEN_KEY = "vsm-admin-last-alert";
const METHOD: Record<string, string> = { upi_qr: "UPI", phonepe: "Card / PhonePe", cod: "Cash on Delivery" };

/** Short two-note chime so the shop owner hears new orders (no audio file needed). */
function chime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.45);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.18); o.stop(ctx.currentTime + i * 0.18 + 0.5);
    });
  } catch {}
}

/**
 * Lives in the admin panel layout. Checks for new orders every 8 seconds; when one arrives it shows a
 * popup ("New order placed!"), plays a chime, sends a desktop notification (if allowed) and refreshes the page data.
 */
export function NewOrderAlert() {
  const router = useRouter();
  const [alert, setAlert] = useState<Latest | null>(null);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const lastSeen = useRef<string | null>(null);

  const check = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/orders/latest", { cache: "no-store" });
      if (!r.ok) return;
      const { latest } = (await r.json()) as { latest: Latest | null };
      if (!latest) return;
      if (lastSeen.current === null) {
        // first check: remember where we are (orders that came in while the panel was closed also alert once)
        let stored: string | null = null;
        try { stored = localStorage.getItem(SEEN_KEY); } catch {}
        lastSeen.current = stored ?? latest.alertAt;
      }
      if (latest.alertAt > (lastSeen.current ?? "")) {
        lastSeen.current = latest.alertAt;
        try { localStorage.setItem(SEEN_KEY, latest.alertAt); } catch {}
        setAlert(latest);
        chime();
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(latest.payment === "submitted" ? "Customer says they paid — check your bank" : "New order — VSM Godavari Foods", { body: `${latest.code} · ${latest.customer} · ${rupees(latest.total)}`, tag: latest.code });
        }
        router.refresh();
      } else {
        try { localStorage.setItem(SEEN_KEY, String(lastSeen.current)); } catch {}
      }
    } catch {}
  }, [router]);

  useEffect(() => {
    setPerm("Notification" in window ? Notification.permission : "unsupported");
    check();
    const t = setInterval(check, 8000);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, [check]);

  return (
    <>
      {perm === "default" && (
        <button onClick={() => Notification.requestPermission().then(setPerm)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-maroon-700 px-4 py-2.5 text-sm font-semibold text-cream shadow-lg">
          <Bell className="h-4 w-4" /> Turn on order alerts
        </button>
      )}
      <AnimatePresence>
        {alert && (
          <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div role="alertdialog" aria-modal="true" aria-labelledby="new-order-title"
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white text-center shadow-2xl ring-2 ring-gold-light"
              initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 18, stiffness: 260 }}>
              <button onClick={() => setAlert(null)} className="absolute right-3 top-3 rounded-full p-1.5 text-cream/80 hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button>
              <div className="bg-gradient-to-b from-maroon-700 to-maroon-900 px-6 pb-6 pt-8 text-cream">
                <motion.div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold-light text-maroon-900 shadow-lg"
                  animate={{ rotate: [0, -14, 14, -10, 10, 0] }} transition={{ duration: 0.9, repeat: 2 }}>
                  <BellRing className="h-8 w-8" />
                </motion.div>
                <h2 id="new-order-title" className="mt-4 flex items-center justify-center gap-2 font-display text-2xl font-bold">
                  <PartyPopper className="h-6 w-6 text-gold-light" /> {alert.payment === "submitted" ? "Customer says they paid" : "New order received"}
                </h2>
                <p className="mt-1 font-mono text-sm text-gold-light">{alert.code}</p>
              </div>
              <div className="space-y-2 px-6 py-5 text-left text-sm">
                <p><span className="text-ink/50">Customer:</span> <b>{alert.customer}</b>{alert.city ? `, ${alert.city}` : ""}</p>
                <p><span className="text-ink/50">Items:</span> {alert.summary}</p>
                <p><span className="text-ink/50">Payment:</span> {METHOD[alert.method] ?? alert.method}</p>
                <p className="pt-1 text-lg"><span className="text-ink/50">Total:</span> <b className="text-maroon-700">{rupees(alert.total)}</b></p>
                {alert.payment === "submitted" && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Open your bank / PhonePe app and check that <b>{rupees(alert.total)}</b> arrived (note: <b>Order {alert.code}</b>) before packing.</p>}
              </div>
              <div className="flex gap-2 px-6 pb-6">
                <button onClick={() => setAlert(null)} className="btn-ghost flex-1">Later</button>
                <Link href={`/admin/orders/${alert.id}`} onClick={() => setAlert(null)} className="btn-primary flex-1">View order</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
