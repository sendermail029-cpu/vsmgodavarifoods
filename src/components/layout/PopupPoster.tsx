"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

export type PopupData = { image: string; title: string; text: string; button: string; link: string; start: string; end: string; frequency: "session" | "day" | "once"; delay: number; version: string };

const KEY = "vsm-popup-seen";
const todayIST = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);

/** Promotional poster that opens a few seconds after the visitor lands (set up in Admin → Website popup). */
export function PopupPoster({ popup, preview = false }: { popup: PopupData; preview?: boolean }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    if (preview) { setOpen(true); return; }
    // never interrupt checkout / order pages
    if (/^\/(checkout|order)/.test(path ?? "")) return;
    const day = todayIST();
    if ((popup.start && day < popup.start) || (popup.end && day > popup.end)) return;
    let seen: { v?: string; day?: string } = {};
    try {
      const store = popup.frequency === "session" ? sessionStorage : localStorage;
      seen = JSON.parse(store.getItem(KEY) || "{}");
    } catch {}
    if (seen.v === popup.version && (popup.frequency !== "day" || seen.day === day)) return;
    const t = setTimeout(() => setOpen(true), popup.delay * 1000);
    return () => clearTimeout(t);
    // run once per poster version, on first page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popup.version, preview]);

  const close = () => {
    setOpen(false);
    if (preview) return;
    try {
      const store = popup.frequency === "session" ? sessionStorage : localStorage;
      store.setItem(KEY, JSON.stringify({ v: popup.version, day: todayIST() }));
    } catch {}
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const external = popup.link.startsWith("https://");
  // poster only (no title / message): show just the full poster — no frame, no button; tapping it opens the link
  const posterOnly = !!popup.image && !popup.title && !popup.text;
  const posterImg = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={popup.image} alt="Offer poster" className="block max-h-[85vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl" />
  );
  return (
    <AnimatePresence>
      {open && (
        <motion.div className={`${preview ? "absolute" : "fixed"} inset-0 z-[90] grid place-items-center bg-ink/55 p-4 backdrop-blur-sm`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          {posterOnly ? (
            <motion.div role="dialog" aria-modal="true" aria-label="Special offer" onClick={(e) => e.stopPropagation()} className="relative w-fit max-w-[min(92vw,34rem)]"
              initial={{ scale: 0.8, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 20, stiffness: 240 }}>
              <button onClick={close} className="absolute -right-2 -top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-maroon-800 shadow-lg ring-1 ring-black/10 transition hover:scale-110" aria-label="Close"><X className="h-5 w-5" /></button>
              {popup.link
                ? external
                  ? <a href={popup.link} target="_blank" rel="noopener noreferrer" onClick={close} aria-label="Open offer">{posterImg}</a>
                  : <Link href={popup.link} onClick={close} aria-label="Open offer">{posterImg}</Link>
                : posterImg}
            </motion.div>
          ) : (
          <motion.div role="dialog" aria-modal="true" aria-label={popup.title || "Special offer"} onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-cream shadow-2xl ring-2 ring-gold-light"
            initial={{ scale: 0.8, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 20, stiffness: 240 }}>
            <button onClick={close} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-maroon-800 shadow-md ring-1 ring-gold/40 transition hover:scale-110" aria-label="Close"><X className="h-5 w-5" /></button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {popup.image && <img src={popup.image} alt={popup.title || "Offer"} className="block max-h-[60vh] w-full object-cover" />}
            {(popup.title || popup.text) && (
              <div className="p-6 text-center">
                {popup.title && <h2 className="font-display text-2xl font-black text-maroon-700">{popup.title}</h2>}
                {popup.text && <p className="mt-2 text-sm text-ink/75">{popup.text}</p>}
                {popup.button && popup.link && (
                  external
                    ? <a href={popup.link} target="_blank" rel="noopener noreferrer" onClick={close} className="btn-primary mt-5 px-7 py-3 text-base">{popup.button}</a>
                    : <Link href={popup.link} onClick={close} className="btn-primary mt-5 px-7 py-3 text-base">{popup.button}</Link>
                )}
              </div>
            )}
          </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
