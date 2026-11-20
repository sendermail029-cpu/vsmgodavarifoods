"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { checkoutSchema, createOrder, getOrderByCode, quote } from "@/lib/orders";
import { startPhonePe } from "@/lib/payments";
import { INDIA, isCountry } from "@/lib/countries";

const itemsSchema = z.array(z.object({ variantId: z.number().int().positive(), qty: z.number().int().min(1).max(50) })).max(40);

export async function quoteAction(items: unknown, country: unknown = INDIA) {
  const parsed = itemsSchema.safeParse(items);
  if (!parsed.success) return { lines: [], subtotal: 0, shipping: 0, problems: ["Invalid cart"] };
  const q = await quote(parsed.data, typeof country === "string" && isCountry(country) ? country : INDIA);
  return { lines: q.lines.map((l) => ({ variantId: l.variantId, price: l.price, qty: l.qty })), subtotal: q.subtotal, shipping: q.shipping, problems: q.problems };
}

// simple per-IP throttle against spam orders (per server instance)
const hits = new Map<string, number[]>();
async function throttled() {
  const h = await headers();
  const ip = (h.get("x-real-ip") || h.get("x-vercel-forwarded-for")?.split(",")[0] || h.get("x-forwarded-for")?.split(",")[0] || "local").trim();
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 8;
}

export async function placeOrderAction(input: unknown): Promise<{ ok: true; url: string } | { ok: false; error: string; fields?: Record<string, string> }> {
  if (await throttled()) return { ok: false, error: "Too many orders from your network. Please try again in a few minutes or contact us on WhatsApp." };
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] ||= i.message;
    return { ok: false, error: "Please check the highlighted fields.", fields };
  }
  const res = await createOrder(parsed.data);
  if ("error" in res) return { ok: false, error: res.error ?? "Could not place order" };
  const orderUrl = `/order/${res.code}?t=${res.token}&new=1`;
  if (parsed.data.payment === "phonepe") {
    try {
      const order = await getOrderByCode(res.code);
      const url = await startPhonePe(order!);
      return { ok: true, url };
    } catch {
      return { ok: true, url: orderUrl + "&pp=fail" };
    }
  }
  return { ok: true, url: orderUrl };
}
