import "server-only";
import { UPIPay, generateUPIQR, buildIntentLinks } from "upipay";
import QRCode from "qrcode";
import { SITE_URL } from "./format";
import type { Order } from "./orders";
import { setPaymentStatus } from "./orders";
import { getSettings } from "./settings";

/**
 * Payments use the open-source `upipay` SDK (github.com/iamrobinsharaya/upipay, MIT, pinned to 1.0.0).
 *
 * 1. UPI QR / app links (no merchant account) — money goes straight to your UPI ID with 0 fees.
 *    There is no automatic confirmation for raw UPI, so the customer submits the UTR and you
 *    mark the order "Paid" in Admin → Orders after checking your bank/UPI app.
 * 2. PhonePe Business (optional, automatic confirmation) — enabled when PHONEPE_* env vars are set.
 *    Callbacks are signature-verified (HMAC/X-VERIFY) AND the amount is checked against our DB, and the
 *    order page re-checks status server-to-server, so a forged redirect can never mark an order paid.
 */

let client: UPIPay | null = null;
export function phonepe() {
  if (!process.env.PHONEPE_MERCHANT_ID || !process.env.PHONEPE_SALT_KEY) return null;
  if (!client) {
    client = new UPIPay({
      provider: "phonepe",
      environment: process.env.PHONEPE_ENV === "production" ? "production" : "sandbox",
      credentials: {
        merchantId: process.env.PHONEPE_MERCHANT_ID,
        saltKey: process.env.PHONEPE_SALT_KEY,
        saltIndex: process.env.PHONEPE_SALT_INDEX || "1",
      },
      options: { timeout: 20000 },
    });
  }
  return client;
}

export async function upiQrFor(order: Order) {
  const s = await getSettings();
  if (!s.upi_id) return null;
  // A personal UPI ID must get a plain person-to-person request. Merchant-style links (order reference "tr", mode=04,
  // shop name) sent to a personal account trigger UPI risk warnings ("This payment may fail as per UPI Risk Policy").
  if (s.upi_account_type !== "business") {
    const p = new URLSearchParams({ pa: s.upi_id, pn: s.upi_payee_name || "VSM Godavari Foods", am: (order.total / 100).toFixed(2), cu: "INR", tn: `Order ${order.code}` });
    const uri = `upi://pay?${p.toString().replace(/\+/g, "%20")}`;
    const image = await QRCode.toDataURL(uri, { errorCorrectionLevel: "M", margin: 2, width: 480, color: { dark: "#2a1210", light: "#ffffff" } });
    const mobile = /^(\d{10})@/.exec(s.upi_id)?.[1] ?? "";
    return { personal: true as const, image, uri, links: null, upiId: s.upi_id, mobile, payee: s.upi_payee_name };
  }
  const qr = await generateUPIQR({
    vpa: s.upi_id,
    name: s.upi_payee_name || "VSM Godavari Foods",
    amount: order.total / 100,
    orderId: order.code,
    note: `Order ${order.code}`,
    mode: "fixed",
  });
  return { personal: false as const, image: qr.qrImage, uri: qr.upiUri, links: buildIntentLinks(qr.upiUri), upiId: s.upi_id, mobile: "", payee: s.upi_payee_name };
}

export async function startPhonePe(order: Order) {
  const pp = phonepe();
  if (!pp) throw new Error("PhonePe is not configured");
  const res = await pp.createPayment({
    amount: order.total, // paise
    orderId: order.code,
    customerPhone: order.phone,
    customerName: order.customer_name,
    callbackUrl: `${SITE_URL}/api/payments/phonepe/callback`,
    redirectUrl: `${SITE_URL}/order/${order.code}?t=${order.access_token}`,
    idempotencyKey: order.code,
  });
  if (!res.success || !res.paymentUrl) throw new Error("Could not start PhonePe payment");
  return res.paymentUrl;
}

/** Server-to-server status check; safe to call on every visit to the order page. */
export async function refreshPhonePeStatus(order: Order) {
  const pp = phonepe();
  if (!pp || order.payment_method !== "phonepe" || order.payment_status === "paid") return order.payment_status;
  try {
    const st = await pp.checkStatus(order.code, { expectedAmount: order.total, maxRetries: 1 });
    if (st.status === "SUCCESS" && st.amount === order.total) {
      await setPaymentStatus(order.code, "paid", st.transactionId);
      return "paid";
    }
    if (st.status === "FAILED") {
      await setPaymentStatus(order.code, "failed", st.transactionId);
      return "failed";
    }
  } catch {
    /* keep pending; webhook or next visit will update */
  }
  return order.payment_status;
}
