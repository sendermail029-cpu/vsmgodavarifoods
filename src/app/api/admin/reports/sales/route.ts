import { getAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { isDay, salesReport, todayIST } from "@/lib/reports";
import { salesReportPdf } from "@/lib/pdf";
import { salesReportXlsx } from "@/lib/sales-xlsx";

export const dynamic = "force-dynamic";

const csvCell = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const rs = (p: number) => (p / 100).toFixed(2);

/** Admin-only: sales report for ?from=YYYY-MM-DD&to=YYYY-MM-DD as PDF (default), ?format=xlsx (formatted Excel) or ?format=csv (plain). */
export async function GET(req: Request) {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });
  const sp = new URL(req.url).searchParams;
  let from = sp.get("from"), to = sp.get("to");
  if (!isDay(from)) from = todayIST();
  if (!isDay(to)) to = from;
  if (from > to) [from, to] = [to, from];
  if ((Date.parse(to) - Date.parse(from)) / 864e5 > 366) return new Response("Please choose a range of one year or less.", { status: 400 });
  const r = await salesReport(from, to);
  const name = `Sales-${from}${from === to ? "" : `-to-${to}`}`;

  if (sp.get("format") === "xlsx") {
    const s = await getSettings();
    const buf = await salesReportXlsx(r, s.store_name || "VSM Godavari Foods");
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${name}.xlsx"`, "Cache-Control": "no-store",
      },
    });
  }
  if (sp.get("format") === "csv") {
    const lines = [
      ["Date", "Orders", "Items sold", "UPI (Rs)", "Card (Rs)", "COD (Rs)", "Total sales (Rs)", "Received (Rs)", "Pending (Rs)", "Cancelled"],
      ...r.days.map((d) => [d.day, d.orders, d.items, rs(d.upi), rs(d.card), rs(d.cod), rs(d.sales), rs(d.paid), rs(d.pending), d.cancelled]),
      ["TOTAL", r.totals.orders, r.totals.items, rs(r.totals.upi), rs(r.totals.card), rs(r.totals.cod), rs(r.totals.sales), rs(r.totals.paid), rs(r.totals.pending), r.totals.cancelled],
      [],
      ["Bill no.", "Date & time (IST)", "Customer", "Phone", "City", "Items", "Payment", "Payment status", "Order status", "Total (Rs)"],
      ...r.orders.map((o) => [o.code, new Date(o.created_at.replace(" ", "T") + "Z").toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), o.customer_name, o.phone, o.city,
        o.items.map((i) => `${i.name} ${i.label} x${i.qty}`).join("; "), o.payment_method, o.payment_status, o.status, rs(o.total)]),
    ];
    // BOM so Excel opens it as UTF-8 (Telugu / ₹ safe)
    return new Response("\uFEFF" + lines.map((l) => l.map(csvCell).join(",")).join("\r\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"`, "Cache-Control": "no-store" },
    });
  }
  const bytes = await salesReportPdf(r, await getSettings());
  return new Response(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${name}.pdf"`, "Cache-Control": "no-store" },
  });
}
