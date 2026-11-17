import { phonepe, refreshPhonePeStatus } from "@/lib/payments";
import { getOrderByCode } from "@/lib/orders";

// PhonePe server-to-server callback. 1) verify X-VERIFY signature, 2) re-check status + amount with PhonePe's API.
export async function POST(req: Request) {
  const pp = phonepe();
  if (!pp) return new Response("Not configured", { status: 404 });
  const raw = await req.text();
  const sig = req.headers.get("x-verify") || "";
  let orderId = "";
  try {
    const ev = pp.verifyWebhook(raw, sig, { enableReplayProtection: false });
    if (!ev.verified) throw new Error("bad signature");
    orderId = ev.orderId;
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }
  const order = await getOrderByCode(orderId);
  if (!order) return new Response("Unknown order", { status: 404 });
  await refreshPhonePeStatus(order); // authoritative S2S check incl. amount match
  return Response.json({ ok: true });
}
