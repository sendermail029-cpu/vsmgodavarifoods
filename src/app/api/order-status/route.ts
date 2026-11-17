import { NextResponse } from "next/server";
import { expireUnpaidOrders, getOrderForCustomer } from "@/lib/orders";
import { refreshPhonePeStatus } from "@/lib/payments";

export const dynamic = "force-dynamic";

/** Customer order page polls this (needs the secret order link token) to update itself when payment is confirmed. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const code = (sp.get("code") ?? "").slice(0, 40), t = (sp.get("t") ?? "").slice(0, 80);
  await expireUnpaidOrders().catch(() => 0);
  let o = await getOrderForCustomer(code, t);
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (o.payment_method === "phonepe" && o.payment_status !== "paid") {
    await refreshPhonePeStatus(o);
    o = (await getOrderForCustomer(code, t))!;
  }
  return NextResponse.json({ payment: o.payment_status, status: o.status }, { headers: { "Cache-Control": "no-store" } });
}
