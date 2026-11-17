import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { calcShipping } from "./format";
import { getSettings, shippingRules, paymentOptions } from "./settings";

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z.string().trim().regex(/^(\+?91)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email").max(120)]).optional(),
  address: z.string().trim().min(8, "Please enter your full address").max(400),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.string().trim().min(2, "Enter your state").max(60),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
  notes: z.string().trim().max(400).optional(),
  payment: z.enum(["upi_qr", "phonepe", "cod"]),
  items: z.array(z.object({ variantId: z.number().int().positive(), qty: z.number().int().min(1).max(50) })).min(1, "Your cart is empty").max(40),
  acceptTerms: z.literal(true, { message: "Please accept the Terms & Conditions" }),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type OrderItem = { variantId: number; productId: number; name: string; label: string; price: number; qty: number; grams: number };
export type Order = {
  id: number; code: string; access_token: string; customer_name: string; phone: string; email: string | null;
  address: string; city: string; state: string; pincode: string; notes: string | null; items: OrderItem[];
  subtotal: number; shipping: number; total: number; payment_method: "upi_qr" | "phonepe" | "cod";
  payment_status: "pending" | "submitted" | "paid" | "failed" | "refunded" | "expired"; utr: string | null; provider_txn: string | null;
  status: "placed" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled"; tracking: string | null;
  stock_restored: number; alert_at: string | null; created_at: string; updated_at: string;
};

const toOrder = (r: Record<string, unknown>): Order => ({ ...(r as unknown as Order), items: JSON.parse(String(r.items_json)) });

function newCode() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rnd = Array.from(randomBytes(5), (b) => alphabet[b % alphabet.length]).join("");
  return `VSM${ymd}${rnd}`;
}

/** Prices, shipping and stock are ALWAYS computed on the server from the database — never trusted from the browser. */
export async function quote(items: { variantId: number; qty: number }[]) {
  const c = await db();
  const ids = [...new Set(items.map((i) => i.variantId))];
  if (!ids.length) return { lines: [] as OrderItem[], subtotal: 0, shipping: 0, grams: 0, problems: [] as string[] };
  const { rows } = await c.execute({
    sql: `SELECT v.id, v.label, v.price, v.stock, v.weight_grams, p.id AS pid, p.name, p.active
          FROM variants v JOIN products p ON p.id = v.product_id WHERE v.id IN (${ids.map(() => "?").join(",")})`,
    args: ids,
  });
  const byId = new Map(rows.map((r) => [Number(r.id), r]));
  const problems: string[] = [];
  const lines: OrderItem[] = [];
  for (const it of items) {
    const v = byId.get(it.variantId);
    if (!v || !Number(v.active)) { problems.push("An item in your cart is no longer available."); continue; }
    if (Number(v.stock) < it.qty) {
      problems.push(Number(v.stock) > 0 ? `Only ${v.stock} left of ${v.name} (${v.label}).` : `${v.name} (${v.label}) is out of stock.`);
      continue;
    }
    lines.push({ variantId: it.variantId, productId: Number(v.pid), name: String(v.name), label: String(v.label), price: Number(v.price), qty: it.qty, grams: Number(v.weight_grams) });
  }
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const grams = lines.reduce((s, l) => s + l.grams * l.qty, 0);
  const shipping = calcShipping(subtotal, grams, shippingRules(await getSettings()), lines.reduce((s, l) => s + l.qty, 0));
  return { lines, subtotal, shipping, grams, problems };
}

export async function createOrder(input: CheckoutInput) {
  await expireUnpaidOrders();
  const opts = await paymentOptions();
  if ((input.payment === "upi_qr" && !opts.upiQr) || (input.payment === "phonepe" && !opts.phonepe) || (input.payment === "cod" && !opts.cod)) {
    return { error: "Selected payment method is not available." } as const;
  }
  // merge duplicates
  const merged = new Map<number, number>();
  for (const i of input.items) merged.set(i.variantId, (merged.get(i.variantId) || 0) + i.qty);
  const items = [...merged].map(([variantId, qty]) => ({ variantId, qty }));

  const q = await quote(items);
  if (q.problems.length) return { error: q.problems.join(" ") } as const;
  const codFee = input.payment === "cod" ? opts.codFee * 100 : 0;
  const total = q.subtotal + q.shipping + codFee;

  const c = await db();
  const tx = await c.transaction("write");
  try {
    for (const l of q.lines) {
      const r = await tx.execute({ sql: "UPDATE variants SET stock = stock - ? WHERE id = ? AND stock >= ?", args: [l.qty, l.variantId, l.qty] });
      if (r.rowsAffected !== 1) throw new Error(`Sorry, ${l.name} (${l.label}) just went out of stock.`);
    }
    const code = newCode();
    const token = randomBytes(18).toString("base64url");
    await tx.execute({
      sql: `INSERT INTO orders(code, access_token, customer_name, phone, email, address, city, state, pincode, notes, items_json, subtotal, shipping, total, payment_method, alert_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, CASE WHEN ? = 'cod' THEN datetime('now') END)`,
      args: [code, token, input.name, input.phone.replace(/^\+?91/, ""), input.email || null, input.address, input.city, input.state, input.pincode,
        input.notes || null, JSON.stringify(q.lines), q.subtotal, q.shipping + codFee, total, input.payment, input.payment],
    });
    for (const l of q.lines) {
      await tx.execute({ sql: "INSERT INTO inventory_log(variant_id, change, reason) VALUES (?,?,?)", args: [l.variantId, -l.qty, `Order ${code}`] });
    }
    await tx.commit();
    return { code, token, total } as const;
  } catch (e) {
    await tx.rollback();
    return { error: e instanceof Error ? e.message : "Could not place order." } as const;
  } finally {
    tx.close();
  }
}

export async function getOrderByCode(code: string) {
  const c = await db();
  const { rows } = await c.execute({ sql: "SELECT * FROM orders WHERE code = ?", args: [code] });
  return rows[0] ? toOrder(rows[0] as Record<string, unknown>) : null;
}

/** Customer access requires the secret token from the confirmation link (prevents order enumeration). */
export async function getOrderForCustomer(code: string, token: string) {
  const o = await getOrderByCode(code);
  if (!o || !token) return null;
  const a = Buffer.from(o.access_token), b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b) ? o : null;
}

export async function getOrderById(id: number) {
  const c = await db();
  const { rows } = await c.execute({ sql: "SELECT * FROM orders WHERE id = ?", args: [id] });
  return rows[0] ? toOrder(rows[0] as Record<string, unknown>) : null;
}

/** Order-list tabs in the admin panel. */
export const ORDER_VIEWS = {
  action: "Needs action",
  awaiting: "Awaiting payment",
  expired: "Expired – not paid",
  done: "Shipped & delivered",
  all: "All orders",
} as const;
export type OrderView = keyof typeof ORDER_VIEWS;
const VIEW_SQL: Record<OrderView, string> = {
  // money received (or COD) and still to be packed / shipped, or a customer says they paid
  action: "(payment_status = 'submitted' OR (status IN ('placed','confirmed','packed') AND (payment_status = 'paid' OR payment_method = 'cod')))",
  awaiting: "(status = 'placed' AND payment_method != 'cod' AND payment_status IN ('pending','failed'))",
  expired: "(payment_status = 'expired')",
  done: "(status IN ('shipped','delivered'))",
  all: "1=1",
};

export async function countOrderViews() {
  const c = await db();
  const keys = Object.keys(VIEW_SQL) as OrderView[];
  const { rows } = await c.execute(`SELECT ${keys.map((v) => `SUM(CASE WHEN ${VIEW_SQL[v]} THEN 1 ELSE 0 END) AS "${v}"`).join(", ")} FROM orders`);
  return Object.fromEntries(keys.map((v) => [v, Number(rows[0]?.[v] ?? 0)])) as Record<OrderView, number>;
}

export async function listOrders(filter: { status?: string; payment?: string; q?: string; view?: OrderView } = {}) {
  const c = await db();
  const where: string[] = [];
  const args: string[] = [];
  if (filter.view) where.push(VIEW_SQL[filter.view]);
  if (filter.status) { where.push("status = ?"); args.push(filter.status); }
  if (filter.payment) { where.push("payment_status = ?"); args.push(filter.payment); }
  if (filter.q) { where.push("(code LIKE ? OR customer_name LIKE ? OR phone LIKE ?)"); args.push(`%${filter.q}%`, `%${filter.q}%`, `%${filter.q}%`); }
  const { rows } = await c.execute({ sql: `SELECT * FROM orders ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY id DESC LIMIT 300`, args });
  return rows.map((r) => toOrder(r as Record<string, unknown>));
}

/** Put reserved stock back (once) when an order is cancelled / payment failed. */
export async function restoreStock(orderId: number, reason: string) {
  const c = await db();
  const tx = await c.transaction("write");
  try {
    const r = await tx.execute({ sql: "UPDATE orders SET stock_restored = 1 WHERE id = ? AND stock_restored = 0", args: [orderId] });
    if (r.rowsAffected === 1) {
      const { rows } = await tx.execute({ sql: "SELECT items_json FROM orders WHERE id = ?", args: [orderId] });
      const items: OrderItem[] = JSON.parse(String(rows[0].items_json));
      for (const l of items) {
        await tx.execute({ sql: "UPDATE variants SET stock = stock + ? WHERE id = ?", args: [l.qty, l.variantId] });
        await tx.execute({ sql: "INSERT INTO inventory_log(variant_id, change, reason) VALUES (?,?,?)", args: [l.variantId, l.qty, reason] });
      }
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  } finally {
    tx.close();
  }
}

export async function setPaymentStatus(code: string, status: Order["payment_status"], providerTxn?: string) {
  const c = await db();
  // never downgrade a paid order from an automated source
  await c.execute({
    sql: `UPDATE orders SET payment_status = ?, provider_txn = COALESCE(?, provider_txn), updated_at = datetime('now')
          WHERE code = ? AND payment_status != 'paid'`,
    args: [status, providerTxn ?? null, code],
  });
  if (status === "paid") await c.execute({ sql: "UPDATE orders SET status = 'confirmed', alert_at = COALESCE(alert_at, datetime('now')) WHERE code = ? AND status = 'placed'", args: [code] });
  if (status === "failed") {
    const o = await getOrderByCode(code);
    if (o && o.payment_status === "failed" && o.status === "placed") {
      await c.execute({ sql: "UPDATE orders SET status = 'cancelled' WHERE id = ?", args: [o.id] });
      await restoreStock(o.id, `Payment failed ${code}`);
    }
  }
}

/* ---------------- unpaid-order expiry ---------------- */
export const PAYMENT_WINDOW_HOURS = 2;
let lastExpiryRun = 0;

/**
 * Online orders still unpaid after PAYMENT_WINDOW_HOURS are marked "expired" and their reserved stock is released.
 * The order itself is NEVER deleted: the shop can restore it with one tap if the money turns up later,
 * and the customer can still say "I've paid" from their order link.
 * Runs at most once a minute, triggered by normal page visits (no cron needed).
 */
export async function expireUnpaidOrders(force = false) {
  if (!force && Date.now() - lastExpiryRun < 60_000) return 0;
  lastExpiryRun = Date.now();
  const c = await db();
  const { rows } = await c.execute({
    sql: `SELECT id, code FROM orders WHERE status = 'placed' AND payment_method != 'cod' AND payment_status IN ('pending','failed')
          AND created_at < datetime('now', ?)`,
    args: [`-${PAYMENT_WINDOW_HOURS} hours`],
  });
  let n = 0;
  for (const r of rows) {
    const u = await c.execute({
      sql: "UPDATE orders SET status = 'cancelled', payment_status = 'expired', updated_at = datetime('now') WHERE id = ? AND status = 'placed' AND payment_status IN ('pending','failed')",
      args: [Number(r.id)],
    });
    if (u.rowsAffected === 1) { await restoreStock(Number(r.id), `Order ${r.code} expired - payment not received in ${PAYMENT_WINDOW_HOURS} h`); n++; }
  }
  return n;
}

/**
 * Admin found the money for an expired order: mark it paid, confirm it and reserve the stock again.
 * Stock never goes below zero — if something sold out meanwhile, the shortfall is returned so the admin can see it.
 */
export async function reviveOrder(orderId: number) {
  const c = await db();
  const tx = await c.transaction("write");
  const short: string[] = [];
  try {
    const { rows } = await tx.execute({ sql: "SELECT code, items_json, stock_restored, status FROM orders WHERE id = ?", args: [orderId] });
    const o = rows[0];
    if (!o || String(o.status) !== "cancelled") throw new Error("Only an expired / cancelled order can be restored.");
    if (Number(o.stock_restored) === 1) {
      for (const l of JSON.parse(String(o.items_json)) as OrderItem[]) {
        const v = await tx.execute({ sql: "SELECT stock FROM variants WHERE id = ?", args: [l.variantId] });
        const have = Number(v.rows[0]?.stock ?? 0);
        const take = Math.min(have, l.qty);
        if (take < l.qty) short.push(`${l.name} ${l.label}: need ${l.qty}, only ${have} in stock`);
        if (take > 0) {
          await tx.execute({ sql: "UPDATE variants SET stock = stock - ? WHERE id = ?", args: [take, l.variantId] });
          await tx.execute({ sql: "INSERT INTO inventory_log(variant_id, change, reason) VALUES (?,?,?)", args: [l.variantId, -take, `Order ${o.code} restored (payment found)`] });
        }
      }
    }
    await tx.execute({
      sql: "UPDATE orders SET status = 'confirmed', payment_status = 'paid', stock_restored = 0, updated_at = datetime('now') WHERE id = ?",
      args: [orderId],
    });
    await tx.commit();
    return { short };
  } catch (e) {
    await tx.rollback();
    throw e;
  } finally {
    tx.close();
  }
}
