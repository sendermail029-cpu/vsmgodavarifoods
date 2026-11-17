"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, Loader2 } from "lucide-react";
import { savePopup } from "@/app/admin/actions";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { useToast } from "@/components/admin/useToast";
import { PopupPoster } from "@/components/layout/PopupPoster";

type P = { enabled: boolean; image?: string; title: string; text: string; button: string; link: string; start: string; end: string; frequency: "session" | "day" | "once"; delay: number; version: string };

export function PopupForm({ initial, currentImage }: { initial: P; currentImage: string | null }) {
  const [p, setP] = useState<P>(initial);
  const [image, setImage] = useState<string | undefined>(undefined);
  const [preview, setPreview] = useState(0);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const shownImage = image === "" ? "" : image ?? currentImage ?? "";
  const set = (patch: Partial<P>) => setP((x) => ({ ...x, ...patch }));

  const save = () => start(async () => {
    const r = await savePopup({ ...p, image });
    toast.show(r.ok, r.ok ? r.message ?? "Saved" : r.error);
    if (r.ok) { setImage(undefined); router.refresh(); }
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      {toast.node}
      <form className="card space-y-5 p-6" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <label className={`flex items-center justify-between rounded-2xl p-4 ring-2 transition ${p.enabled ? "bg-emerald-50 ring-emerald-400" : "bg-white ring-maroon-700/10"}`}>
          <span>
            <span className="block font-semibold">{p.enabled ? "Popup is ON" : "Popup is OFF"}</span>
            <span className="text-xs text-ink/55">{p.enabled ? "Visitors will see it after saving." : "Switch on, then save, to show it on the website."}</span>
          </span>
          <input type="checkbox" className="h-6 w-6 accent-emerald-600" checked={p.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
        </label>

        <div><label className="label">Poster image</label><ImagePicker value={image} onChange={(v) => { setImage(v); if (v) set({ enabled: true }); }} preview={currentImage} />
          <p className="mt-1 text-xs text-ink/50">A portrait or square poster works best (for example 1080 × 1350). With no title or message, only the poster is shown — no frame, no button. Old posters are deleted from Cloudinary when replaced.</p></div>
        <div><label className="label">Title (optional)</label><input className="input" maxLength={80} value={p.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Sankranti special — 15% off sweets!" /></div>
        <div><label className="label">Short message (optional)</label><textarea className="input" rows={2} maxLength={300} value={p.text} onChange={(e) => set({ text: e.target.value })} placeholder="e.g. Fresh ariselu and sunnundalu — order before 14 January." /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Button text (shown only with a title or message)</label><input className="input" maxLength={30} value={p.button} onChange={(e) => set({ button: e.target.value })} placeholder="Shop now" /></div>
          <div><label className="label">Tapping the poster / button opens</label><input className="input font-mono" maxLength={200} value={p.link} onChange={(e) => set({ link: e.target.value })} placeholder="/shop/sweets-laddus" /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label">Show from (optional)</label><input type="date" className="input" value={p.start} onChange={(e) => set({ start: e.target.value })} /></div>
          <div><label className="label">Show until (optional)</label><input type="date" className="input" value={p.end} onChange={(e) => set({ end: e.target.value })} /></div>
          <div><label className="label">Open after (seconds)</label><input type="number" min={0} max={30} className="input" value={p.delay} onChange={(e) => set({ delay: Math.max(0, Math.min(30, Number(e.target.value) || 0)) })} /></div>
        </div>
        <div>
          <label className="label">How often each visitor sees it</label>
          <div className="grid gap-2 sm:grid-cols-3">
            {([["day", "Once a day"], ["session", "Every visit"], ["once", "Only once"]] as const).map(([v, l]) => (
              <label key={v} className={`cursor-pointer rounded-xl p-3 text-center text-sm font-semibold ring-1 transition ${p.frequency === v ? "bg-maroon-700 text-cream ring-maroon-700" : "bg-white ring-gold/40 hover:bg-gold-pale"}`}>
                <input type="radio" name="freq" value={v} checked={p.frequency === v} onChange={() => set({ frequency: v })} className="sr-only" />{l}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-ink/50">Saving a new poster shows it again to everyone, even if they closed the old one. It never opens on the checkout or order pages.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary flex-1 py-3" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} Save popup</button>
          <button type="button" className="btn-ghost" onClick={() => setPreview((n) => n + 1)}><Eye className="h-4 w-4" /> Preview</button>
        </div>
      </form>

      {/* live preview */}
      <div className="xl:sticky xl:top-6 xl:self-start">
        <p className="label">Preview</p>
        <div className="relative h-[600px] overflow-hidden rounded-3xl bg-[url('/godavari/godavari-arch-bridge.webp')] bg-cover bg-center ring-1 ring-gold/40">
          {shownImage || p.title ? (
            <PopupPoster key={preview + shownImage + p.title + p.text + p.button} preview popup={{ ...p, image: shownImage }} />
          ) : (
            <p className="grid h-full place-items-center bg-white/70 p-8 text-center text-sm text-ink/60">Add a poster image or a title to see the preview.</p>
          )}
        </div>
      </div>
    </div>
  );
}
