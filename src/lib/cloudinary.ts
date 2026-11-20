import "server-only";
import { createHash } from "node:crypto";

/**
 * Cloudinary (free plan) for product & category photos.
 * The API secret stays on the server: we only hand the browser a short-lived *signature* that allows
 * one upload into our own folder. Set these in .env.local (and in Vercel → Settings → Environment Variables):
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
const FOLDER = "vsm-godavari-foods";

export function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

/** Signature for a direct browser → Cloudinary upload (valid ~1 hour, folder fixed to ours). */
export function signUpload() {
  const cfg = cloudinaryConfig();
  if (!cfg) return null;
  const timestamp = Math.floor(Date.now() / 1000);
  const params = `folder=${FOLDER}&timestamp=${timestamp}`;
  const signature = createHash("sha1").update(params + cfg.apiSecret).digest("hex");
  return { cloudName: cfg.cloudName, apiKey: cfg.apiKey, folder: FOLDER, timestamp, signature };
}

/** Only accept image links that point at OUR Cloudinary account. */
export function isOurCloudinaryUrl(url: string) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  return !!cloud && url.startsWith(`https://res.cloudinary.com/${cloud}/image/upload/`);
}

/** "https://res.cloudinary.com/<cloud>/image/upload/[transforms/]v123/folder/name.webp" → "folder/name" */
export function publicIdFromUrl(url: string) {
  if (!isOurCloudinaryUrl(url)) return null;
  const rest = url.split("/image/upload/")[1]?.split("?")[0] ?? "";
  const parts = rest.split("/");
  const v = parts.findIndex((p) => /^v\d+$/.test(p));
  const path = (v >= 0 ? parts.slice(v + 1) : parts.filter((p) => !p.includes(","))).join("/");
  return path.replace(/\.[a-z0-9]+$/i, "") || null;
}

/** Permanently delete one of our photos from Cloudinary. Never throws (a failed cleanup must not break saving). */
export async function destroyImage(url: string | null | undefined) {
  const cfg = cloudinaryConfig();
  const publicId = url ? publicIdFromUrl(url) : null;
  if (!cfg || !publicId || !publicId.startsWith(`${FOLDER}/`)) return false;
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${cfg.apiSecret}`).digest("hex");
    const fd = new FormData();
    fd.append("public_id", publicId);
    fd.append("api_key", cfg.apiKey);
    fd.append("timestamp", String(timestamp));
    fd.append("signature", signature);
    const r = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/destroy`, { method: "POST", body: fd });
    const j = (await r.json()) as { result?: string };
    return j.result === "ok";
  } catch {
    return false;
  }
}

/** Server-side upload of a data-URL image into a sub-folder of ours (e.g. customers' payment screenshots). Returns the https URL or null. */
export async function uploadImage(dataUrl: string, subfolder: string) {
  const cfg = cloudinaryConfig();
  if (!cfg) return null;
  try {
    const folder = `${FOLDER}/${subfolder}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${cfg.apiSecret}`).digest("hex");
    const fd = new FormData();
    fd.append("file", dataUrl);
    fd.append("folder", folder);
    fd.append("api_key", cfg.apiKey);
    fd.append("timestamp", String(timestamp));
    fd.append("signature", signature);
    const r = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`, { method: "POST", body: fd });
    const j = (await r.json()) as { secure_url?: string };
    return j.secure_url ?? null;
  } catch {
    return null;
  }
}
