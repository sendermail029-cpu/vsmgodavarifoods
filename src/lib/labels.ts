import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, concatTransformationMatrix, popGraphicsState, pushGraphicsState, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { db } from "./db";
import { SITE_URL } from "./format";
import type { Order } from "./orders";
import type { Settings } from "./settings";

const MAROON = rgb(0.478, 0.11, 0.11), GOLD = rgb(0.72, 0.54, 0.18), INK = rgb(0.12, 0.07, 0.06), GREY = rgb(0.42, 0.4, 0.38), WHITE = rgb(1, 1, 1);
const GREEN = rgb(0.13, 0.5, 0.2), RED = rgb(0.75, 0.13, 0.1);
const safe = (s: unknown) => String(s ?? "").replace(/₹/g, "Rs.").replace(/[–—]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim();
const rs = (paise: number) => `Rs. ${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });

type F = { r: PDFFont; b: PDFFont };
function txt(p: PDFPage, f: F, s: string, x: number, y: number, size: number, o: { bold?: boolean; color?: RGB; align?: "left" | "right" | "center"; maxW?: number } = {}) {
  const font = o.bold ? f.b : f.r;
  let t = safe(s), sz = size;
  // shrink long text to fit the box instead of overflowing
  if (o.maxW) while (sz > 5 && font.widthOfTextAtSize(t, sz) > o.maxW) sz -= 0.5;
  const w = font.widthOfTextAtSize(t, sz);
  p.drawText(t, { x: o.align === "right" ? x - w : o.align === "center" ? x - w / 2 : x, y, size: sz, font, color: o.color ?? INK });
}
function wrap(font: PDFFont, s: string, size: number, width: number, maxLines = 4) {
  const words = safe(s).split(" "), lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > width && cur) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);
}
/** FSSAI-style veg (green) / non-veg (red/brown) mark */
function vegMark(p: PDFPage, x: number, y: number, size: number, nonVeg: boolean) {
  const c = nonVeg ? RED : GREEN;
  p.drawRectangle({ x, y, width: size, height: size, borderColor: c, borderWidth: 1.2 });
  if (nonVeg) p.drawSvgPath(`M ${size / 2} ${size * 0.22} L ${size * 0.8} ${size * 0.75} L ${size * 0.2} ${size * 0.75} Z`, { x, y: y + size, color: c });
  else p.drawCircle({ x: x + size / 2, y: y + size / 2, size: size * 0.28, color: c });
}

async function newDoc(title: string) {
  const doc = await PDFDocument.create();
  doc.setTitle(title); doc.setAuthor("VSM Godavari Foods");
  return { doc, f: { r: await doc.embedFont(StandardFonts.Helvetica), b: await doc.embedFont(StandardFonts.HelveticaBold) } };
}

/* ------------------------------------------------------------------ */
/* 1) Shipping label — 4 x 6 inch design, printed 4 per A4 sheet (2 x 2) */
/* ------------------------------------------------------------------ */
/** Our round logo (PNG), or null if the file can't be read. */
const LOGO = "brand/logo-mark-1024.png";
/** Our round logo: read from /public, or (on serverless hosts where /public isn't on disk) fetched from the site itself. */
async function loadLogo(doc: PDFDocument) {
  try { return await doc.embedPng(await readFile(path.join(process.cwd(), "public", LOGO))); } catch {}
  try {
    const res = await fetch(`${SITE_URL}/${LOGO}`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return await doc.embedPng(new Uint8Array(await res.arrayBuffer()));
  } catch {}
  return null;
}

export async function shippingLabelsPdf(orders: Order[], s: Settings) {
  const { doc, f } = await newDoc("Shipping labels");
  const logo = await loadLogo(doc);
  const W = 288, H = 432, M = 14;
  // A4 sheet, 2 x 2 labels, scaled to fit, with dashed cut lines
  const PW = 595.28, PH = 841.89, m = 10;
  const cw = (PW - 2 * m) / 2, ch = (PH - 2 * m) / 2;
  const scale = Math.min((cw - 8) / W, (ch - 8) / H);
  const cut = rgb(0.6, 0.6, 0.6);
  let p: PDFPage = null!;
  orders.forEach((o, n) => {
    const slot = n % 4;
    if (slot === 0) {
      p = doc.addPage([PW, PH]);
      p.drawLine({ start: { x: PW / 2, y: m }, end: { x: PW / 2, y: PH - m }, thickness: 0.5, color: cut, dashArray: [4, 3] });
      p.drawLine({ start: { x: m, y: PH / 2 }, end: { x: PW - m, y: PH / 2 }, thickness: 0.5, color: cut, dashArray: [4, 3] });
    }
    const col = slot % 2, row = Math.floor(slot / 2);
    const ox = m + col * cw + (cw - W * scale) / 2, oy = PH - m - (row + 1) * ch + (ch - H * scale) / 2;
    // draw this label in its own 288 x 432 coordinate space
    p.pushOperators(pushGraphicsState(), concatTransformationMatrix(scale, 0, 0, scale, ox, oy));

    p.drawRectangle({ x: 6, y: 6, width: W - 12, height: H - 12, borderColor: INK, borderWidth: 1.2 });
    // header
    p.drawRectangle({ x: 6, y: H - 52, width: W - 12, height: 46, color: MAROON });
    txt(p, f, s.store_name || "VSM Godavari Foods", M, H - 30, 15, { bold: true, color: WHITE, maxW: 170 });
    txt(p, f, "Homemade pickles, sweets & snacks", M, H - 44, 7.5, { color: rgb(0.97, 0.88, 0.7) });
    txt(p, f, o.code, W - M, H - 30, 9, { bold: true, color: rgb(0.98, 0.86, 0.55), align: "right" });
    txt(p, f, fmtDate(new Date(o.created_at.replace(" ", "T") + "Z")), W - M, H - 44, 7.5, { color: WHITE, align: "right" });

    // payment banner: what the courier must collect
    const cod = o.payment_method === "cod" && o.payment_status !== "paid";
    p.drawRectangle({ x: 6, y: H - 84, width: W - 12, height: 32, color: cod ? rgb(1, 0.93, 0.8) : rgb(0.88, 0.96, 0.89) });
    txt(p, f, cod ? `CASH ON DELIVERY - COLLECT ${rs(o.total)}` : "PREPAID - DO NOT COLLECT CASH", W / 2, H - 73, cod ? 12 : 11, { bold: true, color: cod ? RED : GREEN, align: "center", maxW: W - 30 });

    // TO
    let y = H - 104;
    txt(p, f, "DELIVER TO", M, y, 8, { bold: true, color: GOLD }); y -= 20;
    txt(p, f, o.customer_name, M, y, 16, { bold: true, maxW: W - 2 * M }); y -= 18;
    for (const line of wrap(f.r, o.address, 11, W - 2 * M, 3)) { txt(p, f, line, M, y, 11); y -= 14; }
    txt(p, f, `${o.city}, ${o.state}`, M, y, 11, { bold: true, maxW: W - 2 * M }); y -= 22;
    const abroad = !!o.country && o.country !== "India";
    // abroad: postcode + COUNTRY in big letters (what the international courier sorts by)
    txt(p, f, abroad ? `${o.pincode}  ${o.country.toUpperCase()}` : `PIN ${o.pincode}`, M, y, abroad ? 16 : 20, { bold: true, maxW: W - 2 * M - 110 });
    txt(p, f, `Ph: ${o.phone}`, W - M, y + 2, abroad ? 10 : 12, { bold: true, align: "right", maxW: 105 }); y -= 16;

    // contents
    p.drawLine({ start: { x: 6, y }, end: { x: W - 6, y }, thickness: 0.8, color: INK }); y -= 14;
    const grams = o.items.reduce((t, i) => t + i.grams * i.qty, 0);
    txt(p, f, `CONTENTS (${o.items.reduce((t, i) => t + i.qty, 0)} items, approx ${(grams / 1000).toFixed(2)} kg food)`, M, y, 7.5, { bold: true, color: GOLD }); y -= 12;
    for (const i of o.items.slice(0, 6)) { txt(p, f, `${i.qty} x ${i.name} - ${i.label}`, M, y, 8.5, { maxW: W - 2 * M }); y -= 11; }
    if (o.items.length > 6) { txt(p, f, `+ ${o.items.length - 6} more item(s)`, M, y, 8, { color: GREY }); y -= 11; }
    const fy0 = Math.max(y - 6, 92);
    txt(p, f, "FRAGILE - HANDLE WITH CARE - THIS SIDE UP", W / 2, fy0, 9, { bold: true, color: RED, align: "center" });

    // FROM (logo on the right of this box)
    p.drawLine({ start: { x: 6, y: 82 }, end: { x: W - 6, y: 82 }, thickness: 0.8, color: INK });
    const LS = 66, fromW = W - 2 * M - (logo ? LS + 6 : 0);
    if (logo) p.drawImage(logo, { x: W - 9 - LS, y: 6 + (76 - LS) / 2, width: LS, height: LS });
    txt(p, f, "FROM / RETURN TO", M, 70, 7, { bold: true, color: GOLD });
    txt(p, f, s.store_name || "VSM Godavari Foods", M, 58, 9, { bold: true, maxW: fromW });
    let fy = 47;
    for (const line of wrap(f.r, s.address, 7.5, fromW, 3)) { txt(p, f, line, M, fy, 7.5); fy -= 9; }
    txt(p, f, `Ph: +91 ${s.phone}${s.fssai_license ? `   FSSAI: ${s.fssai_license}` : ""}`, M, fy, 7.5, { maxW: fromW });

    p.pushOperators(popGraphicsState());
  });
  if (!orders.length) doc.addPage([PW, PH]);
  return doc.save();
}

/* ------------------------------------------------------------------ */
/* 2) Jar / product stickers — A4 sheet, 2 x 6 stickers (approx 92 x 44 mm) */
/* ------------------------------------------------------------------ */
export type JarSticker = { name: string; pack: string; mrp: number | null; price: number; nonVeg: boolean; shelfDays: ShelfLife | null; shelf: string; ingredients: string; orderCode?: string };
type ShelfLife = { n: number; unit: "day" | "month" };

/** Shelf life from the product text: "45 days at room temperature" → 45 days, "12 months" → 12 calendar months. */
export function shelfDays(text: string | null | undefined): ShelfLife | null {
  const m = /(\d+)\s*(day|week|month|year)/i.exec(text ?? "");
  if (!m) return null;
  const n = Number(m[1]), u = m[2].toLowerCase();
  return u.startsWith("day") ? { n, unit: "day" } : u.startsWith("week") ? { n: n * 7, unit: "day" } : u.startsWith("month") ? { n, unit: "month" } : { n: n * 12, unit: "month" };
}
function bestBefore(packed: Date, life: ShelfLife) {
  const d = new Date(packed);
  if (life.unit === "day") d.setDate(d.getDate() + life.n); else d.setMonth(d.getMonth() + life.n);
  return d;
}

export async function jarStickersPdf(stickers: JarSticker[], s: Settings, packedOn = new Date()) {
  const { doc, f } = await newDoc("Jar stickers");
  const logo = await loadLogo(doc);
  const BAND = logo ? 80 : 34;
  const PW = 595.28, PH = 841.89, cols = 2, rows = 6, mx = 22, my = 28, gap = 10;
  const w = (PW - 2 * mx - gap) / cols, h = (PH - 2 * my - gap * (rows - 1)) / rows;
  let page: PDFPage | null = null;
  stickers.forEach((st, n) => {
    const slot = n % (cols * rows);
    if (slot === 0) page = doc.addPage([PW, PH]);
    const p = page!;
    const x = mx + (slot % cols) * (w + gap), y = PH - my - Math.floor(slot / cols) * (h + gap) - h;
    // border (cut line) + maroon side band
    p.drawRectangle({ x, y, width: w, height: h, borderColor: rgb(0.8, 0.75, 0.68), borderWidth: 0.6, borderDashArray: [3, 2] });
    p.drawRectangle({ x, y, width: BAND, height: h, color: MAROON });
    p.drawRectangle({ x: BAND + x, y, width: 2.5, height: h, color: GOLD });
    if (logo) {
      // big logo on a cream disc with a gold ring, centred in the maroon band
      const cx = x + BAND / 2, cy = y + h / 2, ls = BAND - 8;
      p.drawCircle({ x: cx, y: cy, size: ls / 2 + 2.5, color: rgb(0.99, 0.96, 0.88), borderColor: GOLD, borderWidth: 1.6 });
      p.drawImage(logo, { x: cx - ls / 2, y: cy - ls / 2, width: ls, height: ls });
    } else {
      p.drawText("VSM", { x: x + 9, y: y + h / 2 + 8, size: 10, font: f.b, color: WHITE });
      p.drawText("GODAVARI", { x: x + 4.5, y: y + h / 2 - 4, size: 5.2, font: f.b, color: rgb(0.98, 0.86, 0.55) });
      p.drawText("FOODS", { x: x + 9, y: y + h / 2 - 11, size: 5.2, font: f.b, color: rgb(0.98, 0.86, 0.55) });
    }

    const L = x + BAND + 10, R = x + w - 8, inner = R - L;
    vegMark(p, R - 11, y + h - 17, 10, st.nonVeg);
    txt(p, f, st.name, L, y + h - 18, 12, { bold: true, color: MAROON, maxW: inner - 16 });
    txt(p, f, `Net wt: ${st.pack}`, L, y + h - 32, 9, { bold: true });
    txt(p, f, `MRP ${rs(st.mrp && st.mrp > st.price ? st.mrp : st.price)}`, R, y + h - 32, 9, { bold: true, align: "right" });
    txt(p, f, "(incl. of all taxes)", R, y + h - 39, 5.2, { color: GREY, align: "right" });
    let iy = y + h - 49;
    if (st.ingredients) for (const line of wrap(f.r, `Ingredients: ${st.ingredients}`, 6.2, inner, 3)) { txt(p, f, line, L, iy, 6.2, { color: GREY }); iy -= 7.5; }
    const best = st.shelfDays ? bestBefore(packedOn, st.shelfDays) : null;
    txt(p, f, `Packed on: ${fmtDate(packedOn)}`, L, y + 26, 7.5, { bold: true, maxW: inner / 2 - 4 });
    txt(p, f, best ? `Best before: ${fmtDate(best)}` : `Best before: ${st.shelf || "see pack"}`, R, y + 26, 7.5, { bold: true, color: RED, align: "right", maxW: inner / 2 - 4 });
    txt(p, f, "Use a dry spoon. Store in a cool, dry place.", L, y + 16, 6.2, { color: GREY, maxW: inner - (st.orderCode ? 52 : 0) });
    if (st.orderCode) txt(p, f, st.orderCode, R, y + 16, 6, { bold: true, align: "right" });
    txt(p, f, `${s.store_name || "VSM Godavari Foods"}, Velpuru, W. Godavari  |  +91 ${s.phone}${s.fssai_license ? `  |  FSSAI ${s.fssai_license}` : ""}`, L, y + 7, 5.6, { color: GREY, maxW: inner });
  });
  if (!stickers.length) doc.addPage([PW, PH]);
  return doc.save();
}

/** Look up category (veg / non-veg), shelf life, ingredients and MRP for product variants. */
export async function productInfo(variantIds: number[]) {
  if (!variantIds.length) return new Map<number, Omit<JarSticker, "orderCode">>();
  const c = await db();
  const { rows } = await c.execute({
    sql: `SELECT v.id, v.label, v.price, v.mrp, p.name, p.shelf_life, p.ingredients, cat.slug cat
          FROM variants v JOIN products p ON p.id = v.product_id LEFT JOIN categories cat ON cat.id = p.category_id
          WHERE v.id IN (${variantIds.map(() => "?").join(",")})`,
    args: variantIds,
  });
  return new Map(rows.map((r) => [Number(r.id), {
    name: String(r.name), pack: String(r.label), price: Number(r.price), mrp: r.mrp == null ? null : Number(r.mrp),
    nonVeg: /non-?veg/i.test(String(r.cat ?? "")), shelfDays: shelfDays(r.shelf_life as string), shelf: safe(r.shelf_life),
    ingredients: String(r.ingredients ?? ""),
  }]));
}

/** One sticker per jar in the order(s). */
export async function stickersForOrders(orders: Order[]) {
  const info = await productInfo([...new Set(orders.flatMap((o) => o.items.map((i) => i.variantId)))]);
  const out: JarSticker[] = [];
  for (const o of orders) for (const i of o.items) {
    const pi = info.get(i.variantId) ?? { name: i.name, pack: i.label, price: i.price, mrp: null, nonVeg: false, shelfDays: null, shelf: "", ingredients: "" };
    for (let k = 0; k < i.qty; k++) out.push({ ...pi, name: i.name, pack: i.label, orderCode: o.code });
  }
  return out;
}
