import "server-only";
import { db } from "./db";
import { DEFAULT_SETTINGS } from "./seed-data";
import type { ShippingRules } from "./format";

export type Settings = typeof DEFAULT_SETTINGS;

export async function getSettings(): Promise<Settings> {
  const c = await db();
  const { rows } = await c.execute("SELECT key, value FROM settings");
  const s: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const r of rows) s[String(r.key)] = String(r.value ?? "");
  return s as Settings;
}

export const shippingRules = (s: Settings): ShippingRules => ({
  freeAbove: Number(s.free_shipping_above) || 0,
  perKg: Number(s.shipping_per_kg) || 0,
  min: Number(s.min_shipping) || 0,
  packGrams: Number(s.packing_grams) || 0,
});

export function phonePeEnabled() {
  return Boolean(process.env.PHONEPE_MERCHANT_ID && process.env.PHONEPE_SALT_KEY);
}

export async function paymentOptions() {
  const s = await getSettings();
  return {
    upiQr: s.enable_upi_qr === "1" && /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(s.upi_id),
    phonepe: phonePeEnabled(),
    cod: s.enable_cod === "1",
    codFee: Number(s.cod_fee) || 0,
  };
}
