import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Order } from "./orders";
import type { SalesReport } from "./reports";
import type { Settings } from "./settings";

/* A4 portrait, points */
const W = 595.28, H = 841.89, M = 40;
const MAROON = rgb(0.478, 0.11, 0.11), GOLD = rgb(0.72, 0.54, 0.18), INK = rgb(0.16, 0.07, 0.06), GREY = rgb(0.45, 0.42, 0.4), LINE = rgb(0.88, 0.84, 0.78), CREAM = rgb(0.99, 0.97, 0.93);

/** Standard PDF fonts only know Western characters: drop anything else (e.g. Telugu) so the PDF never fails. */
const safe = (s: unknown) => String(s ?? "").replace(/₹/g, "Rs.").replace(/[–—]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim();
const money = (paise: number) => `Rs. ${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const istDate = (utc: string, withTime = true) =>
  new Date(utc.replace(" ", "T") + "Z").toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) });
const niceDay = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric", weekday: "short" });
const METHOD: Record<string, string> = { upi_qr: "UPI", phonepe: "Card / PhonePe", cod: "Cash on Delivery" };

type Ctx = { doc: PDFDocument; page: PDFPage; y: number; f: PDFFont; b: PDFFont };

function text(c: Ctx, s: string, x: number, y: number, size = 9, bold = false, color = INK, align: "left" | "right" | "center" = "left") {
  const t = safe(s), font = bold ? c.b : c.f, w = font.widthOfTextAtSize(t, size);
  c.page.drawText(t, { x: align === "right" ? x - w : align === "center" ? x - w / 2 : x, y, size, font, color });
}
/** wrap text into lines that fit a width */
function wrap(font: PDFFont, s: string, size: number, width: number) {
  const words = safe(s).split(" "), lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > width && cur) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function header(c: Ctx, s: Settings, title: string, sub: string) {
  c.page.drawRectangle({ x: 0, y: H - 92, width: W, height: 92, color: MAROON });
  c.page.drawRectangle({ x: 0, y: H - 96, width: W, height: 4, color: GOLD });
  text(c, s.store_name || "VSM Godavari Foods", M, H - 42, 20, true, rgb(1, 1, 1));
  text(c, s.address, M, H - 58, 8.5, false, rgb(0.97, 0.9, 0.75));
  text(c, `Phone: +91 ${s.phone}   Email: ${s.email}${s.fssai_license ? `   FSSAI: ${s.fssai_license}` : ""}`, M, H - 71, 8.5, false, rgb(0.97, 0.9, 0.75));
  text(c, title, W - M, H - 42, 16, true, rgb(0.98, 0.86, 0.55), "right");
  text(c, sub, W - M, H - 58, 9, false, rgb(1, 1, 1), "right");
  c.y = H - 120;
}

function footer(c: Ctx, note: string) {
  c.page.drawLine({ start: { x: M, y: 42 }, end: { x: W - M, y: 42 }, thickness: 0.6, color: LINE });
  text(c, note, M, 30, 7.5, false, GREY);
  text(c, `Page ${c.doc.getPageCount()}`, W - M, 30, 7.5, false, GREY, "right");
}

type Col = { label: string; w: number; align?: "left" | "right" | "center" };
/** Draws a table, adding pages as needed. Returns nothing; advances c.y. */
function table(c: Ctx, cols: Col[], rows: string[][], opts: { onNewPage: () => void; bold?: (i: number) => boolean; size?: number }) {
  const size = opts.size ?? 8.5, rowH = size + 8;
  const drawHead = () => {
    c.page.drawRectangle({ x: M, y: c.y - rowH + 4, width: W - 2 * M, height: rowH, color: CREAM });
    let x = M + 6;
    for (const col of cols) { text(c, col.label.toUpperCase(), col.align === "right" ? x + col.w - 12 : col.align === "center" ? x + col.w / 2 - 6 : x, c.y - rowH + 9, 7, true, GREY, col.align ?? "left"); x += col.w; }
    c.y -= rowH + 7;
  };
  drawHead();
  rows.forEach((r, i) => {
    if (c.y < 70) { opts.onNewPage(); drawHead(); }
    let x = M + 6;
    const bold = opts.bold?.(i) ?? false;
    if (bold) c.page.drawRectangle({ x: M, y: c.y - 5, width: W - 2 * M, height: rowH, color: rgb(0.98, 0.94, 0.86) });
    cols.forEach((col, j) => {
      const v = r[j] ?? "";
      text(c, v, col.align === "right" ? x + col.w - 12 : col.align === "center" ? x + col.w / 2 - 6 : x, c.y, size, bold, INK, col.align ?? "left");
      x += col.w;
    });
    c.page.drawLine({ start: { x: M, y: c.y - 6 }, end: { x: W - M, y: c.y - 6 }, thickness: 0.4, color: LINE });
    c.y -= rowH;
  });
}

async function newDoc() {
  const doc = await PDFDocument.create();
  const f = await doc.embedFont(StandardFonts.Helvetica), b = await doc.embedFont(StandardFonts.HelveticaBold);
  return { doc, f, b };
}

/** Customer bill for one order. */
export async function invoicePdf(o: Order, s: Settings) {
  const { doc, f, b } = await newDoc();
  doc.setTitle(`Bill ${o.code}`); doc.setAuthor(safe(s.store_name));
  const c: Ctx = { doc, page: doc.addPage([W, H]), y: 0, f, b };
  header(c, s, "BILL / INVOICE", `No. ${o.code}`);

  // bill info + customer
  const top = c.y;
  text(c, "BILL TO", M, top, 7.5, true, GOLD);
  text(c, o.customer_name, M, top - 14, 11, true);
  let y = top - 28;
  for (const line of wrap(f, `${o.address}, ${o.city}, ${o.state} - ${o.pincode}`, 9, 260)) { text(c, line, M, y, 9); y -= 12; }
  text(c, `Phone: +91 ${o.phone}${o.email ? `   ${o.email}` : ""}`, M, y, 9, false, GREY);

  const rx = W - M;
  const meta: [string, string][] = [
    ["Bill date", istDate(o.created_at)],
    ["Order status", o.status[0].toUpperCase() + o.status.slice(1)],
    ["Payment", METHOD[o.payment_method] ?? o.payment_method],
    ["Payment status", o.payment_status[0].toUpperCase() + o.payment_status.slice(1)],
    ...(o.utr ? [["UPI ref (UTR)", o.utr] as [string, string]] : []),
    ...(o.tracking ? [["Tracking", o.tracking] as [string, string]] : []),
  ];
  meta.forEach(([k, v], i) => { text(c, k, rx - 150, top - i * 14, 8.5, false, GREY); text(c, v, rx, top - i * 14, 8.5, true, INK, "right"); });
  c.y = Math.min(y, top - meta.length * 14) - 26;

  table(c, [
    { label: "#", w: 24 }, { label: "Item", w: 230 }, { label: "Pack", w: 60 }, { label: "Qty", w: 40, align: "center" }, { label: "Rate", w: 80, align: "right" }, { label: "Amount", w: 81, align: "right" },
  ], o.items.map((i, n) => [String(n + 1), i.name, i.label, String(i.qty), money(i.price), money(i.price * i.qty)]), {
    onNewPage: () => { footer(c, "Thank you for your order!"); c.page = doc.addPage([W, H]); c.y = H - 60; },
  });

  // totals
  c.y -= 8;
  const totals: [string, string, boolean][] = [["Subtotal", money(o.subtotal), false], ["Delivery & fees", o.shipping ? money(o.shipping) : "FREE", false], ["Total", money(o.total), true]];
  for (const [k, v, big] of totals) {
    if (big) { c.y -= 6; c.page.drawRectangle({ x: rx - 210, y: c.y - 7, width: 210, height: 22, color: MAROON }); }
    text(c, k, rx - 200, c.y, big ? 11 : 9, big, big ? rgb(1, 1, 1) : GREY);
    text(c, v, rx - 10, c.y, big ? 11 : 9, true, big ? rgb(1, 1, 1) : INK, "right");
    c.y -= big ? 26 : 16;
  }
  text(c, `Amount in words: ${inWords(Math.round(o.total / 100))} rupees only`, M, c.y - 4, 8.5, false, GREY);
  if (o.notes) { c.y -= 22; text(c, "Customer note:", M, c.y, 8.5, true); text(c, o.notes, M + 72, c.y, 8.5); }

  c.y -= 50;
  text(c, "Thank you for choosing VSM Godavari Foods - homemade in Velpuru, West Godavari.", W / 2, c.y, 9.5, true, MAROON, "center");
  text(c, "This is a computer-generated bill and does not need a signature.", W / 2, c.y - 14, 8, false, GREY, "center");
  footer(c, `${safe(s.store_name)} - Bill ${o.code}`);
  return doc.save();
}

/** Date-wise (day by day) sales report for a range. */
export async function salesReportPdf(r: SalesReport, s: Settings) {
  const { doc, f, b } = await newDoc();
  doc.setTitle(`Sales report ${r.from} to ${r.to}`); doc.setAuthor(safe(s.store_name));
  const c: Ctx = { doc, page: doc.addPage([W, H]), y: 0, f, b };
  const range = r.from === r.to ? niceDay(r.from) : `${niceDay(r.from)}  to  ${niceDay(r.to)}`;
  header(c, s, "SALES REPORT", range);
  const nextPage = () => { footer(c, `Sales report ${r.from} to ${r.to}`); c.page = doc.addPage([W, H]); c.y = H - 60; };

  // summary boxes
  const t = r.totals, avg = t.orders ? t.sales / t.orders : 0;
  const boxes: [string, string][] = [["Total sales", money(t.sales)], ["Orders", String(t.orders)], ["Items sold", String(t.items)], ["Avg. order", money(avg)], ["Received (paid)", money(t.paid)], ["Cancelled", String(t.cancelled)]];
  const bw = (W - 2 * M - 5 * 8) / 6;
  boxes.forEach(([k, v], i) => {
    const x = M + i * (bw + 8);
    c.page.drawRectangle({ x, y: c.y - 40, width: bw, height: 46, color: CREAM, borderColor: LINE, borderWidth: 0.6 });
    text(c, k, x + 6, c.y - 8, 7, false, GREY);
    text(c, v, x + 6, c.y - 26, v.length > 13 ? 8.5 : 10.5, true, MAROON);
  });
  c.y -= 66;
  text(c, `Payment split:  UPI ${money(t.upi)}   |   Card ${money(t.card)}   |   Cash on Delivery ${money(t.cod)}   |   Pending ${money(t.pending)}`, M, c.y, 8.5, false, GREY);
  c.y -= 24;

  // day-wise table
  text(c, "Day-wise sales", M, c.y, 12, true, MAROON); c.y -= 16;
  const dayRows = r.days.map((d) => [niceDay(d.day), String(d.orders), String(d.items), money(d.upi), money(d.card), money(d.cod), money(d.sales), String(d.cancelled)]);
  dayRows.push(["TOTAL", String(t.orders), String(t.items), money(t.upi), money(t.card), money(t.cod), money(t.sales), String(t.cancelled)]);
  table(c, [
    { label: "Date", w: 92 }, { label: "Orders", w: 44, align: "center" }, { label: "Items", w: 40, align: "center" }, { label: "UPI", w: 72, align: "right" },
    { label: "Card", w: 66, align: "right" }, { label: "COD", w: 70, align: "right" }, { label: "Sales", w: 84, align: "right" }, { label: "Cancel", w: 47, align: "center" },
  ], dayRows, { onNewPage: nextPage, bold: (i) => i === dayRows.length - 1, size: 8 });

  // top products
  if (r.top.length) {
    c.y -= 18; if (c.y < 160) nextPage();
    text(c, "Top-selling items", M, c.y, 12, true, MAROON); c.y -= 16;
    table(c, [{ label: "#", w: 24 }, { label: "Item", w: 270 }, { label: "Pack", w: 70 }, { label: "Qty sold", w: 60, align: "center" }, { label: "Amount", w: 91, align: "right" }],
      r.top.map((p, i) => [String(i + 1), p.name, p.label, String(p.qty), money(p.amount)]), { onNewPage: nextPage });
  }

  // order list
  if (r.orders.length) {
    c.y -= 18; if (c.y < 160) nextPage();
    text(c, "All orders in this period", M, c.y, 12, true, MAROON); c.y -= 16;
    table(c, [{ label: "Bill no.", w: 100 }, { label: "Date", w: 96 }, { label: "Customer", w: 120 }, { label: "Payment", w: 72 }, { label: "Status", w: 58 }, { label: "Total", w: 69, align: "right" }],
      r.orders.map((o) => [o.code, istDate(o.created_at), o.customer_name, `${METHOD[o.payment_method] === "Cash on Delivery" ? "COD" : METHOD[o.payment_method] ?? ""} ${o.payment_status === "paid" ? "(paid)" : ""}`, o.status, money(o.total)]),
      { onNewPage: nextPage, size: 7.5 });
  }
  c.y -= 20;
  text(c, `Generated on ${istDate(new Date().toISOString().slice(0, 19).replace("T", " "))}. Cancelled orders are excluded from sales totals.`, M, Math.max(c.y, 56), 7.5, false, GREY);
  footer(c, `${safe(s.store_name)} - Sales report ${r.from} to ${r.to}`);
  return doc.save();
}

/** Indian-system number in words (e.g. 1,25,400 → "One Lakh Twenty Five Thousand Four Hundred"). */
function inWords(n: number): string {
  if (n === 0) return "Zero";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const t = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x: number) => (x < 20 ? a[x] : `${t[Math.floor(x / 10)]}${x % 10 ? " " + a[x % 10] : ""}`);
  const three = (x: number) => `${x >= 100 ? a[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " : "") : ""}${x % 100 ? two(x % 100) : ""}`;
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7), lakh = Math.floor((n % 1e7) / 1e5), thousand = Math.floor((n % 1e5) / 1e3), rest = n % 1e3;
  if (crore) parts.push(`${two(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (rest) parts.push(three(rest));
  return parts.join(" ");
}
