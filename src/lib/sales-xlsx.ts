import "server-only";
import ExcelJS from "exceljs";
import type { SalesReport } from "./reports";

/* Brand colours (ARGB) */
const MAROON = "FF7A1F1F", MAROON_DARK = "FF5A1414", CREAM = "FFFFF7E8", GOLD = "FFE8C36A", GOLD_PALE = "FFFBF1DA";
const GREEN_BG = "FFDCFCE7", GREEN = "FF166534", ORANGE_BG = "FFFFEDD5", ORANGE = "FF9A3412", YELLOW_BG = "FFFEF9C3", YELLOW = "FF854D0E", GREY_BG = "FFE4E4E7", GREY = "FF52525B";
const ZEBRA = "FFFDFAF3";

/** ₹ with Indian digit grouping (1,23,456.00). */
const INR = '[>=10000000]"₹"##\\,##\\,##\\,##0.00;[>=100000]"₹"##\\,##\\,##0.00;"₹"#,##0.00';
const DATE = "dd-mmm-yyyy";
const rupees = (paise: number) => Math.round(paise) / 100;
const istDate = (utc: string) => new Date(new Date(utc.replace(" ", "T") + "Z").getTime() + 330 * 60_000);
/** Excel stores dates without a time zone — give it the IST wall-clock time as if it were UTC. */
const asExcelDate = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()));
const nice = (day: string) => new Date(day + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const METHOD: Record<string, string> = { upi_qr: "UPI", phonepe: "Card / PhonePe", cod: "Cash on Delivery" };
const PAY: Record<string, [string, string, string]> = {
  paid: ["Paid", GREEN_BG, GREEN], pending: ["Awaiting payment", ORANGE_BG, ORANGE], submitted: ["Customer says paid", YELLOW_BG, YELLOW],
  expired: ["Expired – not paid", GREY_BG, GREY], failed: ["Failed", ORANGE_BG, ORANGE], refunded: ["Refunded", GREY_BG, GREY],
};
const STATUS: Record<string, string> = { placed: "Placed", confirmed: "Confirmed", packed: "Packed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };

const thin = { style: "thin" as const, color: { argb: "FFEADFC8" } };
const box = { top: thin, left: thin, bottom: thin, right: thin };

function title(ws: ExcelJS.Worksheet, text: string, sub: string, cols: number) {
  ws.mergeCells(1, 1, 1, cols);
  const t = ws.getCell(1, 1);
  t.value = text;
  t.font = { name: "Calibri", size: 18, bold: true, color: { argb: CREAM } };
  t.fill = { type: "pattern", pattern: "solid", fgColor: { argb: MAROON } };
  t.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(1).height = 36;
  ws.mergeCells(2, 1, 2, cols);
  const s = ws.getCell(2, 1);
  s.value = sub;
  s.font = { size: 11, italic: true, color: { argb: MAROON_DARK } };
  s.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD_PALE } };
  s.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(2).height = 22;
}

function header(row: ExcelJS.Row) {
  row.height = 24;
  row.eachCell((c) => {
    c.font = { bold: true, color: { argb: CREAM } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: MAROON_DARK } };
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = box;
  });
}

function body(row: ExcelJS.Row, i: number) {
  row.eachCell({ includeEmpty: true }, (c) => {
    c.border = box;
    c.alignment = { vertical: "middle", ...(c.alignment ?? {}) };
    if (i % 2) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
  });
}

function totalRow(row: ExcelJS.Row) {
  row.height = 22;
  row.eachCell({ includeEmpty: true }, (c) => {
    c.font = { bold: true, color: { argb: MAROON_DARK } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
    c.border = { top: { style: "medium", color: { argb: MAROON } }, bottom: { style: "medium", color: { argb: MAROON } }, left: thin, right: thin };
  });
}

/** A well-formatted Excel workbook for the sales report: Summary · Day-wise · Orders · Products. */
export async function salesReportXlsx(r: SalesReport, shopName: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = shopName;
  wb.created = new Date();
  const period = r.from === r.to ? nice(r.from) : `${nice(r.from)} – ${nice(r.to)}`;
  const generated = new Date(Date.now() + 330 * 60_000).toISOString().replace("T", " ").slice(0, 16);
  const sub = `Period: ${period}   ·   Generated: ${nice(generated.slice(0, 10))}, ${generated.slice(11)} IST`;
  const live = r.orders.filter((o) => o.status !== "cancelled");
  const notPaid = r.orders.filter((o) => o.status === "cancelled");
  const T = r.totals;

  /* ---------------- Summary ---------------- */
  const s = wb.addWorksheet("Summary", { views: [{ showGridLines: false }], properties: { tabColor: { argb: MAROON } } });
  s.columns = [{ width: 30 }, { width: 20 }, { width: 4 }, { width: 30 }, { width: 14 }, { width: 18 }];
  title(s, `${shopName} — Sales Report`, sub, 6);

  const kpis: [string, number | string, string?][] = [
    ["Total sales", rupees(T.sales), INR],
    ["Money received (paid)", rupees(T.paid), INR],
    ["Pending (not yet paid / COD to collect)", rupees(T.pending), INR],
    ["Orders", T.orders],
    ["Items sold", T.items],
    ["Average order value", T.orders ? rupees(T.sales / T.orders) : 0, INR],
    ["Cancelled / not paid in time", T.cancelled],
  ];
  s.getCell("A4").value = "Key numbers";
  s.getCell("A4").font = { bold: true, size: 13, color: { argb: MAROON } };
  kpis.forEach(([label, v, fmt], i) => {
    const row = s.getRow(5 + i);
    row.height = 22;
    row.getCell(1).value = label;
    row.getCell(2).value = v;
    if (fmt) row.getCell(2).numFmt = fmt;
    row.getCell(1).font = { color: { argb: "FF3F3F46" } };
    row.getCell(2).font = { bold: true, size: i === 0 ? 14 : 12, color: { argb: i === 0 ? MAROON : "FF18181B" } };
    row.getCell(2).alignment = { horizontal: "right" };
    [1, 2].forEach((c) => { row.getCell(c).border = box; row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: i === 0 ? GOLD_PALE : "FFFFFFFF" } }; });
  });

  // payment split
  s.getCell("D4").value = "How customers paid";
  s.getCell("D4").font = { bold: true, size: 13, color: { argb: MAROON } };
  const h = s.getRow(5);
  h.getCell(4).value = "Method"; h.getCell(5).value = "Share"; h.getCell(6).value = "Amount";
  [4, 5, 6].forEach((c) => { const x = h.getCell(c); x.font = { bold: true, color: { argb: CREAM } }; x.fill = { type: "pattern", pattern: "solid", fgColor: { argb: MAROON_DARK } }; x.border = box; x.alignment = { horizontal: "center" }; });
  ([["UPI", T.upi], ["Card / PhonePe", T.card], ["Cash on Delivery", T.cod]] as const).forEach(([m, v], i) => {
    const row = s.getRow(6 + i);
    row.getCell(4).value = m;
    row.getCell(5).value = T.sales ? v / T.sales : 0; row.getCell(5).numFmt = "0%";
    row.getCell(6).value = rupees(v); row.getCell(6).numFmt = INR;
    [4, 5, 6].forEach((c) => { row.getCell(c).border = box; });
    row.getCell(5).alignment = { horizontal: "center" };
  });

  // best sellers
  const top0 = 14;
  s.getCell(`A${top0}`).value = "Best sellers";
  s.getCell(`A${top0}`).font = { bold: true, size: 13, color: { argb: MAROON } };
  const th = s.getRow(top0 + 1);
  ["Product", "Pack", "", "Qty sold", "", "Amount"].forEach((v, i) => { if (v) th.getCell(i + 1).value = v; });
  s.mergeCells(top0 + 1, 2, top0 + 1, 3); s.mergeCells(top0 + 1, 4, top0 + 1, 5);
  header(th);
  if (!r.top.length) {
    s.getCell(`A${top0 + 2}`).value = "No sales in this period.";
    s.getCell(`A${top0 + 2}`).font = { italic: true, color: { argb: GREY } };
  }
  r.top.forEach((t, i) => {
    const n = top0 + 2 + i;
    const row = s.getRow(n);
    row.getCell(1).value = `${i + 1}. ${t.name}`;
    row.getCell(2).value = t.label; s.mergeCells(n, 2, n, 3);
    row.getCell(4).value = t.qty; s.mergeCells(n, 4, n, 5); row.getCell(4).alignment = { horizontal: "center" };
    row.getCell(6).value = rupees(t.amount); row.getCell(6).numFmt = INR;
    body(row, i);
  });
  const noteRow = top0 + 3 + Math.max(r.top.length, 1);
  s.getCell(`A${noteRow}`).value = "Sales = orders that were not cancelled. \"Cancelled / not paid in time\" includes online orders that expired without payment. See the other tabs for day-wise numbers, every order and every product.";
  s.mergeCells(noteRow, 1, noteRow, 6);
  s.getCell(`A${noteRow}`).font = { italic: true, size: 9, color: { argb: GREY } };
  s.getCell(`A${noteRow}`).alignment = { wrapText: true };
  s.getRow(noteRow).height = 30;
  s.pageSetup = { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } };

  /* ---------------- Day-wise ---------------- */
  const d = wb.addWorksheet("Day-wise", { views: [{ state: "frozen", ySplit: 4, showGridLines: false }], properties: { tabColor: { argb: GOLD } } });
  d.columns = [{ width: 15 }, { width: 10 }, { width: 11 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 16 }, { width: 16 }, { width: 15 }, { width: 13 }];
  const activeDays = r.days.filter((x) => x.orders || x.cancelled);
  title(d, "Day-wise sales", `${sub}   ·   ${activeDays.length} day(s) with orders (days with no orders are left out)`, 10);
  const dh = d.getRow(4);
  dh.values = ["Date", "Orders", "Items sold", "UPI", "Card", "COD", "Total sales", "Received", "Pending", "Cancelled / not paid"];
  header(dh);
  activeDays.forEach((x, i) => {
    const row = d.getRow(5 + i);
    row.values = [new Date(x.day + "T00:00:00Z"), x.orders, x.items, rupees(x.upi), rupees(x.card), rupees(x.cod), rupees(x.sales), rupees(x.paid), rupees(x.pending), x.cancelled];
    row.getCell(1).numFmt = DATE;
    [4, 5, 6, 7, 8, 9].forEach((c) => (row.getCell(c).numFmt = INR));
    [2, 3, 10].forEach((c) => (row.getCell(c).alignment = { horizontal: "center" }));
    row.getCell(7).font = { bold: true };
    body(row, i);
  });
  if (!activeDays.length) { d.getCell("A5").value = "No orders in this period."; d.getCell("A5").font = { italic: true, color: { argb: GREY } }; }
  const dEnd = 4 + Math.max(activeDays.length, 1);
  const dt = d.getRow(dEnd + 1);
  dt.getCell(1).value = "TOTAL";
  "BCDEFGHIJ".split("").forEach((col, k) => {
    const c = dt.getCell(k + 2);
    // formula keeps working if rows are edited; the stored result shows in phone previews too
    const v = [T.orders, T.items, rupees(T.upi), rupees(T.card), rupees(T.cod), rupees(T.sales), rupees(T.paid), rupees(T.pending), T.cancelled][k];
    c.value = activeDays.length ? { formula: `SUM(${col}5:${col}${dEnd})`, result: v } : 0;
    if (k >= 2 && k <= 7) c.numFmt = INR;
    if ([0, 1, 8].includes(k)) c.alignment = { horizontal: "center" };
  });
  totalRow(dt);
  if (activeDays.length) d.autoFilter = { from: "A4", to: `J${dEnd}` };
  d.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "4:4" };

  /* ---------------- Orders ---------------- */
  const o = wb.addWorksheet("Orders", { views: [{ state: "frozen", ySplit: 4, xSplit: 1, showGridLines: false }], properties: { tabColor: { argb: "FF15803D" } } });
  o.columns = [{ width: 18 }, { width: 13 }, { width: 9 }, { width: 22 }, { width: 13 }, { width: 14 }, { width: 46 }, { width: 7 }, { width: 17 }, { width: 20 }, { width: 12 }, { width: 13 }, { width: 12 }, { width: 14 }];
  title(o, "All orders", `${sub}   ·   ${r.orders.length} order(s), including cancelled / expired (shown in grey)`, 14);
  const oh = o.getRow(4);
  oh.values = ["Bill no.", "Date", "Time", "Customer", "Phone", "City", "Items", "Qty", "Payment method", "Payment status", "Order status", "Items total", "Delivery", "Total"];
  header(oh);
  r.orders.forEach((x, i) => {
    const t = istDate(x.created_at);
    const row = o.getRow(5 + i);
    row.values = [
      x.code, asExcelDate(t), `${String(t.getUTCHours() % 12 || 12).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")} ${t.getUTCHours() < 12 ? "AM" : "PM"}`,
      x.customer_name, x.phone, x.city,
      x.items.map((it) => `${it.name} ${it.label} × ${it.qty}`).join("\n"), x.items.reduce((a, it) => a + it.qty, 0),
      METHOD[x.payment_method] ?? x.payment_method, PAY[x.payment_status]?.[0] ?? x.payment_status, STATUS[x.status] ?? x.status,
      rupees(x.subtotal), rupees(x.shipping), rupees(x.total),
    ];
    row.getCell(2).numFmt = DATE;
    [12, 13, 14].forEach((c) => (row.getCell(c).numFmt = INR));
    row.getCell(1).font = { bold: true, color: { argb: MAROON } };
    row.getCell(7).alignment = { wrapText: true, vertical: "middle" };
    row.getCell(8).alignment = { horizontal: "center" };
    row.getCell(14).font = { bold: true };
    row.height = Math.max(20, 15 * x.items.length + 4);
    body(row, i);
    const pay = PAY[x.payment_status];
    if (pay) { row.getCell(10).fill = { type: "pattern", pattern: "solid", fgColor: { argb: pay[1] } }; row.getCell(10).font = { bold: true, color: { argb: pay[2] } }; }
    if (x.status === "cancelled") [1, 4, 7, 12, 13, 14].forEach((c) => (row.getCell(c).font = { ...(row.getCell(c).font ?? {}), color: { argb: "FFA1A1AA" }, strike: c === 14 }));
  });
  if (!r.orders.length) { o.getCell("A5").value = "No orders in this period."; o.getCell("A5").font = { italic: true, color: { argb: GREY } }; }
  const oEnd = 4 + Math.max(r.orders.length, 1);
  const ot = o.getRow(oEnd + 2);
  ot.getCell(11).value = "Sales total";
  ot.getCell(14).value = rupees(live.reduce((a, x) => a + x.total, 0)); ot.getCell(14).numFmt = INR;
  ot.getCell(13).value = `${live.length} order(s)`;
  totalRow(ot);
  if (notPaid.length) {
    const nr = o.getRow(oEnd + 3);
    nr.getCell(11).value = "Not counted (cancelled / expired)";
    nr.getCell(14).value = rupees(notPaid.reduce((a, x) => a + x.total, 0)); nr.getCell(14).numFmt = INR;
    nr.getCell(13).value = `${notPaid.length} order(s)`;
    nr.eachCell((c) => (c.font = { italic: true, color: { argb: GREY } }));
  }
  if (r.orders.length) o.autoFilter = { from: "A4", to: `N${oEnd}` };
  o.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "4:4" };

  /* ---------------- Products ---------------- */
  const p = wb.addWorksheet("Products", { views: [{ state: "frozen", ySplit: 4, showGridLines: false }], properties: { tabColor: { argb: "FFB45309" } } });
  p.columns = [{ width: 6 }, { width: 36 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 16 }, { width: 12 }];
  const prod = new Map<string, { name: string; label: string; qty: number; amount: number; orders: number }>();
  for (const x of live) for (const it of x.items) {
    const k = `${it.name}|${it.label}`;
    const e = prod.get(k) ?? { name: it.name, label: it.label, qty: 0, amount: 0, orders: 0 };
    e.qty += it.qty; e.amount += it.price * it.qty; e.orders++;
    prod.set(k, e);
  }
  const list = [...prod.values()].sort((a, b) => b.amount - a.amount);
  const sumAmt = list.reduce((a, x) => a + x.amount, 0);
  title(p, "Product-wise sales", `${sub}   ·   ${list.length} product pack(s) sold (cancelled / expired orders not counted)`, 7);
  const ph = p.getRow(4);
  ph.values = ["#", "Product", "Pack", "Qty sold", "In orders", "Amount", "Share"];
  header(ph);
  list.forEach((x, i) => {
    const row = p.getRow(5 + i);
    row.values = [i + 1, x.name, x.label, x.qty, x.orders, rupees(x.amount), sumAmt ? x.amount / sumAmt : 0];
    row.getCell(6).numFmt = INR; row.getCell(7).numFmt = "0.0%";
    [1, 3, 4, 5, 7].forEach((c) => (row.getCell(c).alignment = { horizontal: "center" }));
    body(row, i);
  });
  if (!list.length) { p.getCell("B5").value = "No products sold in this period."; p.getCell("B5").font = { italic: true, color: { argb: GREY } }; }
  const pEnd = 4 + Math.max(list.length, 1);
  const pt = p.getRow(pEnd + 1);
  pt.getCell(2).value = "TOTAL";
  pt.getCell(4).value = list.reduce((a, x) => a + x.qty, 0); pt.getCell(4).alignment = { horizontal: "center" };
  pt.getCell(6).value = rupees(sumAmt); pt.getCell(6).numFmt = INR;
  pt.getCell(7).value = list.length ? 1 : 0; pt.getCell(7).numFmt = "0%"; pt.getCell(7).alignment = { horizontal: "center" };
  totalRow(pt);
  if (list.length) {
    // little in-cell bars so the best sellers stand out at a glance
    p.addConditionalFormatting({ ref: `F5:F${pEnd}`, rules: [{ type: "dataBar", priority: 1, cfvo: [{ type: "min" }, { type: "max" }], color: { argb: "FFE8C36A" } } as unknown as ExcelJS.ConditionalFormattingRule] });
    p.autoFilter = { from: "A4", to: `G${pEnd}` };
  }
  p.pageSetup = { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "4:4" };

  return Buffer.from(await wb.xlsx.writeBuffer());
}
