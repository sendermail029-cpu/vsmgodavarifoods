import { getAdmin } from "@/lib/auth";
import { investorBook } from "@/lib/investors";
import { investorBookPdf } from "@/lib/investors-pdf";
import { investorBookXlsx } from "@/lib/investors-xlsx";
import { todayIST } from "@/lib/reports";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Admin-only: the investors & money book as PDF (default) or ?format=xlsx (Excel). */
export async function GET(req: Request) {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });
  const s = await getSettings();
  const book = await investorBook();
  const name = `Investors-and-money-${todayIST()}`;
  if (new URL(req.url).searchParams.get("format") === "xlsx") {
    const buf = await investorBookXlsx(book, s.store_name || "VSM Godavari Foods");
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${name}.xlsx"`, "Cache-Control": "no-store" },
    });
  }
  const bytes = await investorBookPdf(book, s);
  return new Response(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${name}.pdf"`, "Cache-Control": "no-store" },
  });
}
