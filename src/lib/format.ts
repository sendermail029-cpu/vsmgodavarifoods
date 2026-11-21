/** All money is stored in paise (integer). */
export const rupees = (paise: number) =>
  "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: paise % 100 ? 2 : 0, maximumFractionDigits: 2 });

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

/** Public website address — used in customer links (WhatsApp messages, order links), SEO and the sticker logo. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.vsmgodavarifoods.com").replace(/\/$/, "");

/** packGrams = weight of the jar + box added per item (couriers charge on the packed weight). */
export type ShippingRules = { freeAbove: number; perKg: number; min: number; packGrams?: number };

/**
 * Shipping in paise (DTDC-style): charged per kg, rounded UP to the next whole kg, never below the minimum.
 * e.g. Rs 50/kg: up to 1 kg = 50, 1.2 kg or 2 kg = 100, 2.5 kg = 150. Free above the threshold (0 = never free).
 */
export function calcShipping(subtotalPaise: number, totalGrams: number, r: ShippingRules, itemCount = 0) {
  if (subtotalPaise <= 0) return 0;
  if (r.freeAbove > 0 && subtotalPaise >= r.freeAbove * 100) return 0;
  const packed = totalGrams + itemCount * (r.packGrams ?? 0);
  const kgs = Math.max(1, Math.ceil(packed / 1000));
  return Math.max(kgs * r.perKg * 100, r.min * 100);
}
