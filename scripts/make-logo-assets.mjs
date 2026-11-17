// Builds round web/icon versions of the brand logo from public/brand/vsm-logo-original.png
// Usage: node scripts/make-logo-assets.mjs
import sharp from "sharp";
const src = "public/brand/vsm-logo-original.png";
// Bounding box of the outer ring (slightly oval) in the 1254px original, plus a small margin for the gold rim
const box = { left: 5, top: 3, width: 1243, height: 1192 };
const ring = await sharp(src).extract(box).toBuffer({ resolveWithObject: true });
const { width, height } = ring.info;
const s = Math.max(width, height);
const mask = Buffer.from(`<svg width="${width}" height="${height}"><ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 2 - 3}" ry="${height / 2 - 3}" fill="#fff"/></svg>`);
const oval = await sharp(ring.data).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
const round = await sharp(oval).resize(s, s, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const out = (size, file, fmt = "png") => sharp(round).resize(size, size)[fmt]({ quality: 88 }).toFile(file);
await out(512, "public/brand/vsm-logo.webp", "webp");
await out(1024, "public/brand/logo-mark-1024.png");
await out(192, "public/icon-192.png");
await out(512, "public/icon-512.png");
await out(180, "src/app/apple-icon.png");
await out(96, "src/app/icon.png");
console.log("done");
