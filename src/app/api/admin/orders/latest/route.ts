import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Admin-only: the newest order that needs attention (COD placed, customer says paid, gateway paid) — drives the alert popup. */
export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await db();
  const { rows } = await c.execute("SELECT id, code, customer_name, city, total, payment_method, payment_status, items_json, created_at, alert_at FROM orders WHERE alert_at IS NOT NULL ORDER BY alert_at DESC, id DESC LIMIT 1");
  const r = rows[0];
  if (!r) return NextResponse.json({ latest: null });
  const items = JSON.parse(String(r.items_json)) as { name: string; label: string; qty: number }[];
  return NextResponse.json(
    {
      latest: {
        id: Number(r.id), code: String(r.code), customer: String(r.customer_name), city: String(r.city),
        total: Number(r.total), method: String(r.payment_method), createdAt: String(r.created_at),
        alertAt: String(r.alert_at), payment: String(r.payment_status),
        summary: items.map((i) => `${i.name} ${i.label} × ${i.qty}`).join(", "),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
