"use client";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { cloudinarySignAction, discardUploadAction } from "@/app/admin/actions";

/** Resizes to max 1000px and converts to WebP in the browser (small, fast uploads). */
async function compress(file: File): Promise<HTMLCanvasElement> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Please choose a JPG, PNG or WebP image.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Image is too large (max 15 MB).");
  const bmp = await createImageBitmap(file);
  const max = 1000;
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c;
}

function toDataUrl(c: HTMLCanvasElement) {
  let q = 0.85, out = c.toDataURL("image/webp", q);
  while (out.length > 1_400_000 && q > 0.4) { q -= 0.1; out = c.toDataURL("image/webp", q); }
  if (!out.startsWith("data:image/webp")) out = c.toDataURL("image/jpeg", 0.82);
  return out;
}

/** Upload to Cloudinary with a server-made signature (the API secret never reaches the browser). */
async function uploadToCloudinary(c: HTMLCanvasElement): Promise<string | null> {
  const sig = await cloudinarySignAction();
  if (!sig) return null; // Cloudinary not configured → caller falls back to storing in the database
  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Could not prepare image"))), "image/webp", 0.88));
  const fd = new FormData();
  fd.append("file", blob, "photo.webp");
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", String(sig.timestamp));
  fd.append("folder", sig.folder);
  fd.append("signature", sig.signature);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: fd });
  const j = (await r.json()) as { secure_url?: string; error?: { message?: string } };
  if (!r.ok || !j.secure_url) throw new Error(j.error?.message ? `Upload failed: ${j.error.message}` : "Upload failed. Please try again.");
  return j.secure_url;
}

export function ImagePicker({ value, onChange, preview }: { value: string | undefined; onChange: (v: string) => void; preview: string | null }) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const shown = value === "" ? null : value ?? preview;
  // a photo uploaded in this form but not saved yet — if it gets replaced or removed, delete it from Cloudinary
  const unsavedUpload = value && value.startsWith("https://res.cloudinary.com/") ? value : null;
  const discard = () => { if (unsavedUpload) discardUploadAction(unsavedUpload).catch(() => {}); };
  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cream ring-1 ring-maroon-700/10">
          {shown ? <img src={shown} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-8 w-8 text-ink/30" />}
          {busy && <span className="absolute inset-0 grid place-items-center bg-white/70"><Loader2 className="h-6 w-6 animate-spin text-maroon-700" /></span>}
        </div>
        <div className="space-y-2">
          <button type="button" disabled={busy} className="btn-ghost bg-white" onClick={() => ref.current?.click()}>
            <ImagePlus className="h-4 w-4" /> {busy ? "Uploading…" : "Upload photo"}
          </button>
          {shown && !busy && <button type="button" className="btn text-chilli" onClick={() => { discard(); onChange(""); }}><Trash2 className="h-4 w-4" /> Remove</button>}
          <p className="text-xs text-ink/50">Square photos look best. Auto-resized.</p>
        </div>
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = "";
        if (!f) return;
        setErr(null); setBusy(true);
        try {
          const canvas = await compress(f);
          const url = await uploadToCloudinary(canvas);
          discard();
          onChange(url ?? toDataUrl(canvas));
        } catch (x) {
          setErr(x instanceof Error ? x.message : "Could not upload image");
        } finally {
          setBusy(false);
        }
      }} />
      {err && <p className="mt-2 text-xs text-chilli">{err}</p>}
    </div>
  );
}
