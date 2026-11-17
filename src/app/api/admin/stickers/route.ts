import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrderById, type Order } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { jarStickersPdf, productInfo, shippingLabelsPdf, stickersForOrders } from "@/lib/labels";

export const dynamic = "force-dynamic";

/**
 * Admin-only packing stickers (PDF):
 *   ?type=shipping&ids=1,2      shipping labels (4x6 in) for orders
 *   ?type=jars&ids=1,2          one jar sticker per item in the orders
 *   ?type=shipping|jars&ids=topack   all orders waiting to be packed
 *   ?type=product&variant=5&count=12&date=2026-11-14   stickers for jars packed in advance
 */
export async function GET(req: Request) {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });
  const sp = new URL(req.url).searchParams;
  const type = sp.get("type");
  const s = await getSettings();
  const pdf = (bytes: Uint8Array, name: string) =>
    new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${name}.pdf"`, "Cache-Control": "no-store" } });

  if (type === "product") {
    const variant = Number(sp.get("variant")), count = Math.min(240, Math.max(1, Number(sp.get("count")) || 12));
    const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.get("date") ?? "") ? new Date(sp.get("date") + "T06:00:00Z") : new Date();
    const info = (await productInfo([variant])).get(variant);
    if (!info) return new Response("Product not found", { status: 404 });
    return pdf(await jarStickersPdf(Array.from({ length: count }, () => info), s, date), `Stickers-${info.name.replace(/\W+/g, "-")}-${info.pack.replace(/\W+/g, "")}`);
  }
  if (type !== "shipping" && type !== "jars") return new Response("Unknown sticker type", { status: 400 });

  let orders: Order[] = [];
  const ids = sp.get("ids") ?? "";
  if (ids === "topack") {
    const c = await db();
    const { rows } = await c.execute("SELECT id FROM orders WHERE status IN ('placed','confirmed','packed') AND (payment_status = 'paid' OR payment_method = 'cod') ORDER BY id");
    orders = (await Promise.all(rows.map((r) => getOrderById(Number(r.id))))).filter(Boolean) as Order[];
  } else {
    const list = ids.split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 200);
    orders = (await Promise.all(list.map((id) => getOrderById(id)))).filter(Boolean) as Order[];
  }
  if (!orders.length) return new Response("No orders to print", { status: 404 });
  const tag = orders.length === 1 ? orders[0].code : `${orders.length}-orders`;
  if (type === "shipping") return pdf(await shippingLabelsPdf(orders, s), `Shipping-labels-${tag}`);
  return pdf(await jarStickersPdf(await stickersForOrders(orders), s), `Jar-stickers-${tag}`);
}
