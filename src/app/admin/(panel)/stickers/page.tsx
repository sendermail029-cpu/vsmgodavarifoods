import { PageHeader } from "@/components/admin/ui";
import { getProducts } from "@/lib/catalog";
import { listOrders } from "@/lib/orders";
import { todayIST } from "@/lib/reports";
import { StickerTools } from "./StickerTools";

export const dynamic = "force-dynamic";

export default async function StickersPage() {
  const [orders, products] = await Promise.all([listOrders(), getProducts({ includeInactive: true })]);
  const toPack = orders
    .filter((o) => ["placed", "confirmed", "packed"].includes(o.status) && (o.payment_status === "paid" || o.payment_method === "cod"))
    .map((o) => ({ id: o.id, code: o.code, customer: o.customer_name, city: o.city, cod: o.payment_method === "cod" && o.payment_status !== "paid", total: o.total, status: o.status, jars: o.items.reduce((t, i) => t + i.qty, 0), items: o.items.map((i) => `${i.qty}× ${i.name} ${i.label}`).join(", "), at: o.created_at }));
  const recent = orders.filter((o) => !toPack.some((t) => t.id === o.id) && o.status !== "cancelled").slice(0, 20)
    .map((o) => ({ id: o.id, code: o.code, customer: o.customer_name, city: o.city, cod: o.payment_method === "cod" && o.payment_status !== "paid", total: o.total, status: o.status, jars: o.items.reduce((t, i) => t + i.qty, 0), items: o.items.map((i) => `${i.qty}× ${i.name} ${i.label}`).join(", "), at: o.created_at }));
  const variants = products.flatMap((p) => p.variants.map((v) => ({ id: v.id, label: `${p.name} — ${v.label}` })));
  return (
    <div>
      <PageHeader title="Packing stickers" sub="Download and print labels for parcels and jars. Print on A4 sticker sheets (jars) or 4×6 inch label paper (parcels)." />
      <StickerTools toPack={toPack} recent={recent} variants={variants} today={todayIST()} />
    </div>
  );
}
