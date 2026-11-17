// Builds "served" product images for the custom-order banner:
// food cutouts (public/products/cutouts) placed in brass bowls / on a brass plate, and avakaya in a glass jar.
// Usage: node scripts/make-served-images.mjs
import sharp from "sharp";
import fs from "node:fs";

const C = "public/products/cutouts/";
const OUT = "public/products/served/";
fs.mkdirSync(OUT, { recursive: true });

const DEFS = `
  <linearGradient id="brass" x1="0" x2="1">
    <stop offset="0" stop-color="#4a2f0a"/><stop offset=".12" stop-color="#9c6f22"/><stop offset=".28" stop-color="#f6d98a"/>
    <stop offset=".4" stop-color="#c8962f"/><stop offset=".62" stop-color="#7d5314"/><stop offset=".8" stop-color="#e2b457"/><stop offset="1" stop-color="#4a2f0a"/>
  </linearGradient>
  <linearGradient id="shadeV" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a0d00" stop-opacity=".55"/>
  </linearGradient>
  <radialGradient id="inside" cx=".5" cy=".3" r=".8">
    <stop offset="0" stop-color="#3a2405"/><stop offset=".7" stop-color="#6b4511"/><stop offset="1" stop-color="#b8862b"/>
  </radialGradient>
  <linearGradient id="gl" x1="0" x2="1">
    <stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".15" stop-color="#fff" stop-opacity=".05"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/>
    <stop offset=".85" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".5"/>
  </linearGradient>
  <linearGradient id="cloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c0392b"/><stop offset="1" stop-color="#7a1c1c"/></linearGradient>`;
const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs>${DEFS}</defs>${body}</svg>`);
const blank = (w, h) => sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
const save = (img, out, width) => img.png().toBuffer().then((b) => sharp(b).trim({ threshold: 1 }).resize({ width }).webp({ quality: 88, alphaQuality: 92 }).toFile(OUT + out));

/** Brass bowl with food heaped inside: back rim -> food -> front of bowl (hides the food's lower part). */
async function bowl(food, out, { foodW = 460, sink = 80 } = {}) {
  const W = 600, H = 520, cx = 300, ry = 250, rx = 262, rr = 58;
  const front = `M${cx - rx} ${ry} A${rx} ${rr} 0 0 0 ${cx + rx} ${ry} C${cx + rx - 10} 400 ${cx + 130} 470 ${cx} 470 C${cx - 130} 470 ${cx - rx + 10} 400 ${cx - rx} ${ry}Z`;
  const back = svg(W, H, `<ellipse cx="${cx}" cy="${ry}" rx="${rx}" ry="${rr}" fill="url(#inside)"/>
    <ellipse cx="${cx}" cy="${ry}" rx="${rx}" ry="${rr}" fill="none" stroke="url(#brass)" stroke-width="12"/>`);
  const fr = svg(W, H, `
    <ellipse cx="${cx}" cy="486" rx="96" ry="18" fill="#5a3a0e"/><rect x="${cx - 96}" y="460" width="192" height="26" fill="url(#brass)"/>
    <path d="${front}" fill="url(#brass)"/><path d="${front}" fill="url(#shadeV)"/>
    <path d="M${cx - rx} ${ry} A${rx} ${rr} 0 0 0 ${cx + rx} ${ry}" fill="none" stroke="#f8e3a0" stroke-width="9"/>
    <path d="M${cx - rx + 4} ${ry + 5} A${rx - 4} ${rr} 0 0 0 ${cx + rx - 4} ${ry + 5}" fill="none" stroke="#7d5314" stroke-width="3" stroke-opacity=".7"/>
    <path d="M${cx - 170} ${ry + 70} C${cx - 150} 380 ${cx - 90} 430 ${cx - 40} 445" stroke="#fff6d8" stroke-opacity=".55" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M${cx + 120} ${ry + 90} C${cx + 130} 360 ${cx + 110} 400 ${cx + 80} 425" stroke="#fff6d8" stroke-opacity=".25" stroke-width="6" fill="none" stroke-linecap="round"/>`);
  const f = await sharp(C + food).resize({ width: foodW }).toBuffer({ resolveWithObject: true });
  await save(blank(W, H).composite([
    { input: back },
    { input: f.data, left: Math.round(cx - f.info.width / 2), top: Math.max(0, ry + sink - f.info.height) },
    { input: fr },
  ]), out, 360);
}

/** Brass plate (thali) with food piled on it. */
async function plate(food, out) {
  const W = 600, H = 520, cx = 300, cy = 420;
  const back = svg(W, H, `<ellipse cx="${cx}" cy="${cy + 12}" rx="280" ry="70" fill="#4a2f0a"/>
    <ellipse cx="${cx}" cy="${cy}" rx="280" ry="70" fill="url(#brass)"/>
    <ellipse cx="${cx}" cy="${cy}" rx="236" ry="54" fill="url(#inside)" opacity=".55"/>
    <ellipse cx="${cx}" cy="${cy}" rx="280" ry="70" fill="none" stroke="#f8e3a0" stroke-width="5" stroke-opacity=".8"/>`);
  const f = await sharp(C + food).resize({ width: 400 }).toBuffer({ resolveWithObject: true });
  await save(blank(W, H).composite([
    { input: back },
    { input: f.data, left: Math.round(cx - f.info.width / 2), top: Math.max(0, cy + 20 - f.info.height) },
  ]), out, 360);
}

/** Glass pickle jar filled with the pickle photo, red cloth cover tied with twine. */
async function jar(photo, out) {
  const W = 420, H = 560;
  const body = "M70 170 C70 140 110 128 130 120 L130 100 L290 100 L290 120 C310 128 350 140 350 170 L350 500 C350 530 330 545 300 545 L120 545 C90 545 70 530 70 500Z";
  // only the pickle + oil part of the photo (no serving dish)
  const fill = await sharp(photo).extract({ left: 0, top: 80, width: 430, height: 590 }).resize(300, 420, { fit: "cover" }).modulate({ brightness: 0.92, saturation: 1.15 }).toBuffer();
  const filled = await blank(W, H).composite([{ input: fill, left: 60, top: 140 }, { input: svg(W, H, `<path d="${body}" fill="#fff"/>`), blend: "dest-in" }]).png().toBuffer();
  const glass = svg(W, H, `
    <rect x="70" y="140" width="280" height="44" fill="#5e0e04" fill-opacity=".75"/>
    <rect x="70" y="182" width="280" height="6" fill="#c0391b" fill-opacity=".5"/>
    <path d="${body}" fill="url(#gl)"/>
    <rect x="96" y="190" width="18" height="320" rx="9" fill="#fff" fill-opacity=".35"/>
    <rect x="124" y="200" width="6" height="280" rx="3" fill="#fff" fill-opacity=".25"/>
    <rect x="312" y="200" width="8" height="300" rx="4" fill="#fff" fill-opacity=".15"/>
    <path d="${body}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>
    <path d="M100 112 C100 40 320 40 320 112 Z" fill="url(#cloth)"/>
    <path d="M96 106 C120 125 140 150 128 175 C150 160 170 170 190 182 C210 166 230 172 250 184 C266 168 285 165 298 178 C292 150 300 125 324 106 Z" fill="url(#cloth)"/>
    <path d="M128 175 C150 160 170 170 190 182 C210 166 230 172 250 184 C266 168 285 165 298 178" fill="none" stroke="#fbe9b4" stroke-width="5" stroke-dasharray="2 7" stroke-linecap="round"/>
    <path d="M150 70 C180 58 240 58 270 70" stroke="#fff" stroke-opacity=".25" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M118 120 C180 132 240 132 302 120" stroke="#d9b36a" stroke-width="9" fill="none"/>
    <path d="M118 120 C180 132 240 132 302 120" stroke="#8a6a2a" stroke-width="9" fill="none" stroke-dasharray="4 4" stroke-opacity=".6"/>
    <path d="M210 128 C200 150 188 158 180 172 M210 128 C222 150 236 156 246 168" stroke="#d9b36a" stroke-width="6" fill="none" stroke-linecap="round"/>`);
  await save(blank(W, H).composite([{ input: filled }, { input: glass }]), out, 260);
}

await bowl("prawn.webp", "prawn-bowl.webp", { foodW: 500, sink: 175 });
await bowl("murukulu.webp", "murukulu-bowl.webp", { foodW: 520, sink: 185 });
await bowl("laddu.webp", "laddu-bowl.webp", { foodW: 470, sink: 140 });
await jar("public/products/mango.jpg", "avakaya-jar.webp");
console.log("done");
