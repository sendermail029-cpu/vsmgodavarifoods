"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getOrderForCustomer } from "@/lib/orders";
import { destroyImage, uploadImage } from "@/lib/cloudinary";

export async function submitUtrAction(code: string, token: string, utr: string) {
  const clean = utr.replace(/\s/g, "");
  if (!/^\d{12}$/.test(clean)) return { ok: false, error: "UTR / UPI reference number must be 12 digits." };
  const o = await getOrderForCustomer(code, token);
  if (!o) return { ok: false, error: "Order not found." };
  if (o.payment_method !== "upi_qr" || o.payment_status === "paid" || o.status === "cancelled") return { ok: false, error: "This order can't be updated." };
  const c = await db();
  const dup = await c.execute({ sql: "SELECT 1 FROM orders WHERE utr = ? AND code != ?", args: [clean, code] });
  if (dup.rows.length) return { ok: false, error: "This UTR is already used for another order. Please check the number." };
  await c.execute({ sql: "UPDATE orders SET utr = ?, payment_status = 'submitted', updated_at = datetime('now') WHERE code = ? AND payment_status IN ('pending','submitted')", args: [clean, code] });
  revalidatePath(`/order/${code}`);
  return { ok: true };
}

/** Customer taps "I've paid" (UTR optional). Marks the order "payment submitted" so the shop can verify it. */
export async function claimPaidAction(code: string, token: string, utr = "") {
  const clean = utr.replace(/\s/g, "");
  if (clean && !/^\d{12}$/.test(clean)) return { ok: false, error: "UPI reference number must be 12 digits (or leave it empty)." };
  const o = await getOrderForCustomer(code, token);
  if (!o) return { ok: false, error: "Order not found." };
  // an expired order (unpaid after the time limit) can still be claimed — the shop checks the bank and restores it
  const expired = o.status === "cancelled" && o.payment_status === "expired";
  if (o.payment_method !== "upi_qr" || o.payment_status === "paid" || (o.status === "cancelled" && !expired && o.payment_status !== "submitted")) return { ok: false, error: "This order can't be updated." };
  const c = await db();
  if (clean) {
    const dup = await c.execute({ sql: "SELECT 1 FROM orders WHERE utr = ? AND code != ?", args: [clean, code] });
    if (dup.rows.length) return { ok: false, error: "This reference number is already used for another order." };
  }
  await c.execute({
    sql: "UPDATE orders SET utr = COALESCE(?, utr), payment_status = 'submitted', alert_at = CASE WHEN payment_status = 'submitted' THEN alert_at ELSE datetime('now') END, updated_at = datetime('now') WHERE code = ? AND payment_status IN ('pending','submitted','failed','expired')",
    args: [clean || null, code],
  });
  revalidatePath(`/order/${code}`);
  return { ok: true };
}

/**
 * Customer uploads the "payment successful" screenshot from their UPI app.
 * Saves it on the order and marks the payment as submitted so the shop can verify it.
 */
export async function uploadPaymentProofAction(code: string, token: string, dataUrl: string) {
  if (typeof dataUrl !== "string" || !/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(dataUrl)) return { ok: false, error: "Please choose a photo (JPG, PNG or WebP)." };
  if (dataUrl.length > 1_500_000) return { ok: false, error: "The photo is too large. Please try a smaller screenshot." };
  const o = await getOrderForCustomer(code, token);
  if (!o) return { ok: false, error: "Order not found." };
  const expired = o.status === "cancelled" && o.payment_status === "expired";
  if (o.payment_method !== "upi_qr" || o.payment_status === "paid" || (o.status === "cancelled" && !expired && o.payment_status !== "submitted")) return { ok: false, error: "This order can't be updated." };
  const url = (await uploadImage(dataUrl, "payments")) ?? (dataUrl.length <= 900_000 ? dataUrl : null);
  if (!url) return { ok: false, error: "Could not save the screenshot. Please send it on WhatsApp instead." };
  const c = await db();
  await c.execute({
    sql: "UPDATE orders SET payment_proof = ?, payment_status = 'submitted', alert_at = CASE WHEN payment_status = 'submitted' THEN alert_at ELSE datetime('now') END, updated_at = datetime('now') WHERE code = ? AND payment_status IN ('pending','submitted','failed','expired')",
    args: [url, code],
  });
  if (o.payment_proof && o.payment_proof !== url) await destroyImage(o.payment_proof);
  revalidatePath(`/order/${code}`);
  return { ok: true };
}
