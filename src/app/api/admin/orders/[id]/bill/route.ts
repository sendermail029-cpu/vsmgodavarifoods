import { getAdmin } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { invoicePdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";

/** Admin-only: download the bill (PDF) for one order. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });
  const o = await getOrderById(Number((await ctx.params).id));
  if (!o) return new Response("Not found", { status: 404 });
  const bytes = await invoicePdf(o, await getSettings());
  return new Response(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="Bill-${o.code}.pdf"`, "Cache-Control": "no-store" },
  });
}
