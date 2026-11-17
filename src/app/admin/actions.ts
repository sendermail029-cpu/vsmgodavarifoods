"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, login, logout, MIN_PASSWORD, newPasswordVersion, requireAdmin, requireOwner, startSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { slugify } from "@/lib/format";
import { getOrderById, restoreStock, reviveOrder } from "@/lib/orders";
import { DEFAULT_SETTINGS } from "@/lib/seed-data";
import { destroyImage, isOurCloudinaryUrl, signUpload } from "@/lib/cloudinary";

type Result = { ok: true; message?: string; id?: number } | { ok: false; error: string };

const refreshStore = () => revalidatePath("/", "layout");

/* ---------------- auth ---------------- */
export async function loginAction(_: unknown, fd: FormData): Promise<{ error: string | null }> {
  const err = await login(String(fd.get("email") || ""), String(fd.get("password") || ""));
  if (err) return { error: err };
  redirect("/admin");
}
export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

/* ---------------- images ---------------- */
const imageSchema = z.string().max(2_800_000).refine(
  (s) => s === "" || /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(s) || (isOurCloudinaryUrl(s) && /^https:\/\/[^\s"'<>]+$/.test(s)),
  "Image must be an uploaded JPG/PNG/WebP photo",
);

/** Admin-only: a one-time signature so the browser can upload a photo straight to our Cloudinary folder. */
export async function cloudinarySignAction() {
  await requireAdmin();
  return signUpload();
}

/** Current image of a product/category (used to clean up the old photo after it is replaced). */
async function currentImage(table: "products" | "categories", id: number | undefined) {
  if (!id) return null;
  const c = await db();
  const { rows } = await c.execute({ sql: `SELECT image FROM ${table} WHERE id = ?`, args: [id] });
  return rows[0]?.image ? String(rows[0].image) : null;
}

/** True if any product or category still uses this image. */
async function imageInUse(url: string) {
  const c = await db();
  const { rows } = await c.execute({ sql: "SELECT (SELECT COUNT(*) FROM products WHERE image = ?) + (SELECT COUNT(*) FROM categories WHERE image = ?) n", args: [url, url] });
  return Number(rows[0].n) > 0;
}

/** Delete an old Cloudinary photo once nothing references it any more. */
async function cleanupImage(old: string | null, now: string | null | undefined) {
  if (old && old !== now && isOurCloudinaryUrl(old) && !(await imageInUse(old))) await destroyImage(old);
}

/** Admin-only: throw away a photo that was uploaded but never saved (replaced or cancelled in the form). */
export async function discardUploadAction(url: string): Promise<Result> {
  await requireAdmin();
  if (typeof url !== "string" || !isOurCloudinaryUrl(url)) return { ok: false, error: "Not our image" };
  if (await imageInUse(url)) return { ok: true };
  await destroyImage(url);
  return { ok: true };
}

/* ---------------- categories ---------------- */
const catSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(2).max(80),
  telugu_name: z.string().trim().max(80).optional().default(""),
  slug: z.string().trim().max(80).optional().default(""),
  description: z.string().trim().max(500).optional().default(""),
  image: imageSchema.optional(),
  sort: z.number().int().min(0).max(999).default(0),
  active: z.boolean(),
});

export async function saveCategory(input: unknown): Promise<Result> {
  await requireAdmin();
  const p = catSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const d = p.data;
  const slug = slugify(d.slug || d.name);
  const c = await db();
  const oldImage = d.image !== undefined ? await currentImage("categories", d.id) : null;
  try {
    if (d.id) {
      await c.execute({
        sql: `UPDATE categories SET name=?, telugu_name=?, slug=?, description=?, sort=?, active=? ${d.image !== undefined ? ", image=?" : ""} WHERE id=?`,
        args: [d.name, d.telugu_name || null, slug, d.description || null, d.sort, d.active ? 1 : 0, ...(d.image !== undefined ? [d.image || null] : []), d.id],
      });
    } else {
      const r = await c.execute({
        sql: "INSERT INTO categories(name, telugu_name, slug, description, image, sort, active) VALUES (?,?,?,?,?,?,?)",
        args: [d.name, d.telugu_name || null, slug, d.description || null, d.image || null, d.sort, d.active ? 1 : 0],
      });
      d.id = Number(r.lastInsertRowid);
    }
  } catch (e) {
    return { ok: false, error: String(e).includes("UNIQUE") ? "A category with this URL slug already exists." : "Could not save category." };
  }
  if (d.image !== undefined) await cleanupImage(oldImage, d.image || null);
  refreshStore();
  return { ok: true, id: d.id, message: "Category saved" };
}

export async function deleteCategory(id: number): Promise<Result> {
  await requireAdmin();
  const c = await db();
  const { rows } = await c.execute({ sql: "SELECT COUNT(*) n FROM products WHERE category_id = ?", args: [id] });
  if (Number(rows[0].n) > 0) return { ok: false, error: "Move or delete the products in this category first." };
  const oldImage = await currentImage("categories", id);
  await c.execute({ sql: "DELETE FROM categories WHERE id = ?", args: [id] });
  await cleanupImage(oldImage, null);
  refreshStore();
  return { ok: true };
}

/* ---------------- products ---------------- */
const variantSchema = z.object({
  id: z.number().int().positive().optional(),
  label: z.string().trim().min(1).max(30),
  weight_grams: z.number().int().min(1).max(50000),
  price: z.number().min(1).max(1_000_000),
  mrp: z.number().min(0).max(1_000_000).nullable(),
  stock: z.number().int().min(0).max(100000),
  low_stock_at: z.number().int().min(0).max(10000).default(5),
  sku: z.string().trim().max(40).optional().default(""),
});
const productSchema = z.object({
  id: z.number().int().positive().optional(),
  category_id: z.number().int().positive().nullable(),
  name: z.string().trim().min(2).max(120),
  telugu_name: z.string().trim().max(120).optional().default(""),
  slug: z.string().trim().max(120).optional().default(""),
  short_description: z.string().trim().max(300).optional().default(""),
  description: z.string().trim().max(5000).optional().default(""),
  ingredients: z.string().trim().max(1000).optional().default(""),
  shelf_life: z.string().trim().max(300).optional().default(""),
  image: imageSchema.optional(),
  art: z.string().trim().max(30).default("mango"),
  spice_level: z.number().int().min(0).max(5),
  featured: z.boolean(),
  active: z.boolean(),
  variants: z.array(variantSchema).min(1, "Add at least one pack size / price").max(20),
});

export async function saveProduct(input: unknown): Promise<Result> {
  await requireAdmin();
  const p = productSchema.safeParse(input);
  if (!p.success) { const i = p.error.issues[0]; return { ok: false, error: `${i.path.join(".")}: ${i.message}` }; }
  const d = p.data;
  const slug = slugify(d.slug || d.name);
  const oldImage = d.image !== undefined ? await currentImage("products", d.id) : null;
  const c = await db();
  const tx = await c.transaction("write");
  try {
    let id = d.id;
    const fields = [d.category_id, d.name, d.telugu_name || null, slug, d.short_description || null, d.description || null, d.ingredients || null, d.shelf_life || null, d.art, d.spice_level, d.featured ? 1 : 0, d.active ? 1 : 0];
    if (id) {
      await tx.execute({
        sql: `UPDATE products SET category_id=?, name=?, telugu_name=?, slug=?, short_description=?, description=?, ingredients=?, shelf_life=?, art=?, spice_level=?, featured=?, active=?, updated_at=datetime('now') ${d.image !== undefined ? ", image=?" : ""} WHERE id=?`,
        args: [...fields, ...(d.image !== undefined ? [d.image || null] : []), id],
      });
    } else {
      const r = await tx.execute({
        sql: `INSERT INTO products(category_id, name, telugu_name, slug, short_description, description, ingredients, shelf_life, art, spice_level, featured, active, image) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [...fields, d.image || null],
      });
      id = Number(r.lastInsertRowid);
    }
    // variants: update existing, insert new, delete removed
    const { rows } = await tx.execute({ sql: "SELECT id, stock FROM variants WHERE product_id = ?", args: [id] });
    const existing = new Map(rows.map((r) => [Number(r.id), Number(r.stock)]));
    const keep = new Set<number>();
    for (const [i, v] of d.variants.entries()) {
      const price = Math.round(v.price * 100), mrp = v.mrp ? Math.round(v.mrp * 100) : null;
      if (v.id && existing.has(v.id)) {
        keep.add(v.id);
        await tx.execute({ sql: "UPDATE variants SET label=?, weight_grams=?, price=?, mrp=?, stock=?, low_stock_at=?, sku=?, sort=? WHERE id=? AND product_id=?", args: [v.label, v.weight_grams, price, mrp, v.stock, v.low_stock_at, v.sku || null, i, v.id, id] });
        const diff = v.stock - (existing.get(v.id) ?? 0);
        if (diff) await tx.execute({ sql: "INSERT INTO inventory_log(variant_id, change, reason) VALUES (?,?,?)", args: [v.id, diff, "Edited in product form"] });
      } else {
        const r = await tx.execute({ sql: "INSERT INTO variants(product_id, label, weight_grams, price, mrp, stock, low_stock_at, sku, sort) VALUES (?,?,?,?,?,?,?,?,?)", args: [id, v.label, v.weight_grams, price, mrp, v.stock, v.low_stock_at, v.sku || null, i] });
        if (v.stock) await tx.execute({ sql: "INSERT INTO inventory_log(variant_id, change, reason) VALUES (?,?,?)", args: [Number(r.lastInsertRowid), v.stock, "Opening stock"] });
      }
    }
    for (const vid of existing.keys()) if (!keep.has(vid)) await tx.execute({ sql: "DELETE FROM variants WHERE id = ?", args: [vid] });
    await tx.commit();
    if (d.image !== undefined) await cleanupImage(oldImage, d.image || null);
    refreshStore();
    return { ok: true, id, message: "Product saved" };
  } catch (e) {
    await tx.rollback();
    return { ok: false, error: String(e).includes("UNIQUE") ? "Another product already uses this URL slug." : "Could not save product." };
  } finally {
    tx.close();
  }
}

export async function deleteProduct(id: number): Promise<Result> {
  await requireAdmin();
  const c = await db();
  const oldImage = await currentImage("products", id);
  await c.execute({ sql: "DELETE FROM variants WHERE product_id = ?", args: [id] });
  await c.execute({ sql: "DELETE FROM products WHERE id = ?", args: [id] });
  await cleanupImage(oldImage, null);
  refreshStore();
  return { ok: true };
}

export async function toggleProduct(id: number, field: "active" | "featured"): Promise<Result> {
  await requireAdmin();
  const c = await db();
  await c.execute({ sql: `UPDATE products SET ${field === "active" ? "active" : "featured"} = 1 - ${field === "active" ? "active" : "featured"} WHERE id = ?`, args: [id] });
  refreshStore();
  return { ok: true };
}

/* ---------------- inventory ---------------- */
export async function adjustStock(variantId: number, mode: "set" | "add", amount: number, reason: string): Promise<Result> {
  await requireAdmin();
  if (!Number.isInteger(amount) || Math.abs(amount) > 100000) return { ok: false, error: "Invalid quantity" };
  const c = await db();
  const { rows } = await c.execute({ sql: "SELECT stock FROM variants WHERE id = ?", args: [variantId] });
  if (!rows[0]) return { ok: false, error: "Not found" };
  const cur = Number(rows[0].stock);
  const next = Math.max(0, mode === "set" ? amount : cur + amount);
  await c.batch([
    { sql: "UPDATE variants SET stock = ? WHERE id = ?", args: [next, variantId] },
    { sql: "INSERT INTO inventory_log(variant_id, change, reason) VALUES (?,?,?)", args: [variantId, next - cur, (reason || (mode === "set" ? "Stock count" : "Restock")).slice(0, 120)] },
  ], "write");
  refreshStore();
  return { ok: true, message: `Stock is now ${next}` };
}

export async function updatePrice(variantId: number, price: number, mrp: number | null): Promise<Result> {
  await requireAdmin();
  if (!(price >= 1 && price <= 1_000_000)) return { ok: false, error: "Invalid price" };
  const c = await db();
  await c.execute({ sql: "UPDATE variants SET price = ?, mrp = ? WHERE id = ?", args: [Math.round(price * 100), mrp ? Math.round(mrp * 100) : null, variantId] });
  refreshStore();
  return { ok: true, message: "Price updated" };
}

/* ---------------- orders ---------------- */
const ORDER_STATUS = ["placed", "confirmed", "packed", "shipped", "delivered", "cancelled"] as const;
const PAY_STATUS = ["pending", "submitted", "paid", "failed", "refunded", "expired"] as const;

export async function updateOrder(id: number, input: { status?: string; payment_status?: string; tracking?: string }): Promise<Result> {
  await requireAdmin();
  const o = await getOrderById(id);
  if (!o) return { ok: false, error: "Order not found" };
  const pay = input.payment_status && (PAY_STATUS as readonly string[]).includes(input.payment_status) ? input.payment_status : o.payment_status;
  let status = input.status && (ORDER_STATUS as readonly string[]).includes(input.status) ? input.status : o.status;
  // marking the payment received moves a just-placed order to "confirmed" automatically
  if (pay === "paid" && o.payment_status !== "paid" && status === "placed") status = "confirmed";
  // online orders cannot move past "placed" until the money is received
  if (o.payment_method !== "cod" && pay !== "paid" && !["placed", "cancelled"].includes(status)) return { ok: false, error: "Mark the payment as received first — then you can confirm, pack and ship this order." };
  const tracking = (input.tracking ?? o.tracking ?? "").slice(0, 200);
  if (o.status === "cancelled" && status !== "cancelled") return { ok: false, error: "Cancelled orders can't be re-opened (stock was returned). Create a new order instead." };
  const c = await db();
  await c.execute({ sql: "UPDATE orders SET status=?, payment_status=?, tracking=?, updated_at=datetime('now') WHERE id=?", args: [status, pay, tracking || null, id] });
  if (status === "cancelled" && o.status !== "cancelled") await restoreStock(id, `Order ${o.code} cancelled`);
  revalidatePath(`/admin/orders/${id}`);
  refreshStore();
  return { ok: true, message: "Order updated" };
}

/** Money for an expired order showed up in the bank: mark it paid, confirm it and reserve the stock again. */
export async function reviveOrderAction(id: number): Promise<Result> {
  await requireAdmin();
  const o = await getOrderById(id);
  if (!o) return { ok: false, error: "Order not found" };
  if (o.status !== "cancelled" || !["expired", "submitted"].includes(o.payment_status)) return { ok: false, error: "Only an expired order can be restored." };
  try {
    const { short } = await reviveOrder(id);
    revalidatePath(`/admin/orders/${id}`);
    refreshStore();
    return short.length
      ? { ok: true, message: `Order restored & confirmed. Not enough stock for: ${short.join("; ")} — please update stock.` }
      : { ok: true, message: "Order restored, marked Paid & confirmed" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not restore the order" };
  }
}

/** Customer said "I've paid" but the money is not in the bank. */
export async function paymentNotReceivedAction(id: number): Promise<Result> {
  await requireAdmin();
  const o = await getOrderById(id);
  if (!o) return { ok: false, error: "Order not found" };
  if (o.payment_status !== "submitted") return { ok: false, error: "This order is not waiting for a payment check." };
  const c = await db();
  if (o.status === "cancelled") {
    // it had already expired — just put it back in the Expired list
    await c.execute({ sql: "UPDATE orders SET payment_status = 'expired', updated_at = datetime('now') WHERE id = ?", args: [id] });
  } else {
    await c.execute({ sql: "UPDATE orders SET status = 'cancelled', payment_status = 'expired', updated_at = datetime('now') WHERE id = ?", args: [id] });
    await restoreStock(id, `Order ${o.code} - payment not received`);
  }
  revalidatePath(`/admin/orders/${id}`);
  refreshStore();
  return { ok: true, message: "Marked as not received. The order is in the Expired list — you can still restore it if the money arrives." };
}

/* ---------------- settings ---------------- */
export async function saveSettings(input: Record<string, string>): Promise<Result> {
  await requireAdmin();
  const allowed = Object.keys(DEFAULT_SETTINGS);
  const c = await db();
  const stmts = [];
  for (const k of allowed) {
    if (!(k in input)) continue;
    let v = String(input[k] ?? "").trim().slice(0, 300);
    if (k === "upi_id" && v && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(v)) return { ok: false, error: "UPI ID looks invalid (example: yourname@okhdfcbank)" };
    if (k === "upi_account_type" && !["personal", "business"].includes(v)) return { ok: false, error: "UPI account type must be personal or business" };
    if (k === "whatsapp") v = v.replace(/\D/g, "");
    if (k === "phone" || k === "phone2") v = v.replace(/\D/g, "").slice(-10);
    if ((k === "maps_url" || k === "facebook_url") && v && !/^https:\/\/[^\s"'<>]+$/.test(v)) return { ok: false, error: `${k === "maps_url" ? "Google Maps" : "Facebook"} link must start with https://` };
    if (k === "map_lat_lng" && v && !/^-?\d{1,2}(\.\d+)?,\s*-?\d{1,3}(\.\d+)?$/.test(v)) return { ok: false, error: "Map location must look like 16.7194,81.6750" };
    if (["free_shipping_above", "shipping_per_kg", "min_shipping", "cod_fee", "packing_grams"].includes(k) && !/^\d{1,6}$/.test(v)) return { ok: false, error: `${k.replace(/_/g, " ")} must be a whole number` };
    stmts.push({ sql: "INSERT INTO settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", args: [k, v] });
  }
  await c.batch(stmts, "write");
  refreshStore();
  return { ok: true, message: "Settings saved" };
}

/* ---------------- raw materials / ingredients ---------------- */
const materialSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(2, "Enter a name").max(80),
  telugu_name: z.string().trim().max(80).optional().default(""),
  unit: z.enum(["kg", "g", "L", "ml", "pcs", "packets"]),
  low_at: z.number().min(0).max(1_000_000),
  cost_per_unit: z.number().min(0).max(1_000_000).nullable().optional(),
  opening_stock: z.number().min(0).max(1_000_000).optional(),
});

export async function saveMaterial(input: unknown): Promise<Result> {
  await requireAdmin();
  const p = materialSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const d = p.data;
  const c = await db();
  const cost = d.cost_per_unit == null ? null : Math.round(d.cost_per_unit * 100);
  if (d.id) {
    await c.execute({ sql: "UPDATE raw_materials SET name=?, telugu_name=?, unit=?, low_at=?, cost_per_unit=? WHERE id=?", args: [d.name, d.telugu_name || null, d.unit, d.low_at, cost, d.id] });
  } else {
    const stock = d.opening_stock ?? 0;
    const r = await c.execute({ sql: "INSERT INTO raw_materials(name, telugu_name, unit, low_at, cost_per_unit, stock) VALUES (?,?,?,?,?,?)", args: [d.name, d.telugu_name || null, d.unit, d.low_at, cost, stock] });
    if (stock) await c.execute({ sql: "INSERT INTO raw_material_log(material_id, kind, change, stock_after, note) VALUES (?,?,?,?,?)", args: [Number(r.lastInsertRowid), "adjust", stock, stock, "Opening stock"] });
  }
  revalidatePath("/admin/ingredients");
  return { ok: true, message: "Saved" };
}

export async function deleteMaterial(id: number): Promise<Result> {
  await requireAdmin();
  const c = await db();
  await c.execute({ sql: "UPDATE raw_materials SET active = 0 WHERE id = ?", args: [id] });
  revalidatePath("/admin/ingredients");
  return { ok: true };
}

/** purchase = add stock, usage = take stock out, count = set the exact stock after a physical count. */
const movementSchema = z.object({
  id: z.number().int().positive(),
  kind: z.enum(["purchase", "usage", "count"]),
  qty: z.number().min(0).max(1_000_000),
  note: z.string().trim().max(200).optional().default(""),
  cost: z.number().min(0).max(10_000_000).nullable().optional(),
  by: z.string().trim().min(2, "Enter who did this (partner name)").max(40),
});

export async function recordMaterial(input: unknown): Promise<Result> {
  await requireAdmin();
  const p = movementSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const d = p.data;
  if (d.kind !== "count" && d.qty <= 0) return { ok: false, error: "Enter a quantity greater than 0" };
  const c = await db();
  const tx = await c.transaction("write");
  try {
    const { rows } = await tx.execute({ sql: "SELECT stock, unit FROM raw_materials WHERE id = ?", args: [d.id] });
    if (!rows[0]) throw new Error("Item not found");
    const before = Number(rows[0].stock);
    if (d.kind === "usage" && d.qty > before + 1e-9) throw new Error(`Only ${+before.toFixed(3)} ${rows[0].unit} in stock — record a purchase or stock count first.`);
    const change = d.kind === "purchase" ? d.qty : d.kind === "usage" ? -d.qty : d.qty - before;
    const after = Math.round((before + change) * 1000) / 1000;
    await tx.execute({ sql: "UPDATE raw_materials SET stock = ? WHERE id = ?", args: [after, d.id] });
    await tx.execute({
      sql: "INSERT INTO raw_material_log(material_id, kind, change, stock_after, note, cost, by_name) VALUES (?,?,?,?,?,?,?)",
      args: [d.id, d.kind === "count" ? "adjust" : d.kind, change, after, d.note || (d.kind === "count" ? "Stock count" : null), d.cost == null ? null : Math.round(d.cost * 100), d.by],
    });
    if (d.kind === "purchase" && d.cost && d.qty) {
      await tx.execute({ sql: "UPDATE raw_materials SET cost_per_unit = ? WHERE id = ?", args: [Math.round((d.cost / d.qty) * 100), d.id] });
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    return { ok: false, error: e instanceof Error ? e.message : "Could not save" };
  } finally {
    tx.close();
  }
  revalidatePath("/admin/ingredients");
  revalidatePath("/admin");
  return { ok: true, message: d.kind === "purchase" ? "Purchase added" : d.kind === "usage" ? "Usage recorded" : "Stock updated" };
}

/* ---------------- website popup poster ---------------- */
const popupSchema = z.object({
  enabled: z.boolean(),
  image: imageSchema.optional(),
  title: z.string().trim().max(80).default(""),
  text: z.string().trim().max(300).default(""),
  button: z.string().trim().max(30).default(""),
  link: z.string().trim().max(200).refine((s) => s === "" || s.startsWith("/") || /^https:\/\/[^\s"'<>]+$/.test(s), "Link must start with / (a page on this site) or https://").default(""),
  start: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).default(""),
  end: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).default(""),
  frequency: z.enum(["session", "day", "once"]),
  delay: z.number().int().min(0).max(30),
});

export async function savePopup(input: unknown): Promise<Result> {
  await requireAdmin();
  const p = popupSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const d = p.data;
  if (d.enabled && !d.image && !d.title) return { ok: false, error: "Add a poster image or a title before switching the popup on." };
  if (d.start && d.end && d.start > d.end) return { ok: false, error: "End date is before the start date." };
  const c = await db();
  const { rows } = await c.execute("SELECT value FROM settings WHERE key = 'popup_image'");
  const oldImage = rows[0]?.value ? String(rows[0].value) : null;
  const vals: Record<string, string> = {
    enabled: d.enabled ? "1" : "0", title: d.title, text: d.text, button: d.button, link: d.link, start: d.start, end: d.end,
    frequency: d.frequency, delay: String(d.delay), version: Date.now().toString(36),
  };
  if (d.image !== undefined) vals.image = d.image;
  await c.batch(Object.entries(vals).map(([k, v]) => ({ sql: "INSERT INTO settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", args: [`popup_${k}`, v] })), "write");
  if (d.image !== undefined && oldImage && oldImage !== d.image && isOurCloudinaryUrl(oldImage)) await destroyImage(oldImage);
  refreshStore();
  return { ok: true, message: d.enabled ? "Popup is live on the website" : "Popup saved (switched off)" };
}

/* ---------------- admin logins (My account & logins) ---------------- */
const passwordSchema = z.string().min(MIN_PASSWORD, `Password must be at least ${MIN_PASSWORD} characters`).max(200);
const weak = (pw: string, email: string) =>
  /^(.)\1+$/.test(pw) || /^(0123456789|1234567890|password|admin123)/i.test(pw) || pw.toLowerCase().includes(email.split("@")[0].toLowerCase());

/** Anyone signed in: change your own password (needs the current one). Other devices are signed out. */
export async function changeMyPassword(input: { current: string; next: string; confirm: string }): Promise<Result> {
  const me = await requireAdmin();
  const p = passwordSchema.safeParse(input.next);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  if (input.next !== input.confirm) return { ok: false, error: "The two new passwords don't match." };
  if (weak(input.next, me.email)) return { ok: false, error: "That password is too easy to guess. Try a few words with numbers, e.g. Velpuru-Avakaya-2026!" };
  const c = await db();
  const { rows } = await c.execute({ sql: "SELECT password_hash FROM admin_users WHERE id = ?", args: [me.id] });
  if (!rows[0] || !(await bcrypt.compare(input.current, String(rows[0].password_hash)))) return { ok: false, error: "Your current password is wrong." };
  if (await bcrypt.compare(input.next, String(rows[0].password_hash))) return { ok: false, error: "The new password is the same as the old one." };
  await c.execute({
    sql: "UPDATE admin_users SET password_hash = ?, pw_version = ?, updated_at = datetime('now') WHERE id = ?",
    args: [await hashPassword(input.next), newPasswordVersion(), me.id],
  });
  await startSession(me.id); // keep this device signed in; every other device is signed out
  return { ok: true, message: "Password changed. Other phones/computers using your login have been signed out." };
}

const userSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(40),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(120),
  password: passwordSchema,
  role: z.enum(["owner", "partner"]),
});

/** Owner: add a login for a partner (or another owner). */
export async function addAdminUser(input: { name: string; email: string; password: string; role: string }): Promise<Result> {
  try { await requireOwner(); } catch (e) { return { ok: false, error: (e as Error).message }; }
  const p = userSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  if (weak(p.data.password, p.data.email)) return { ok: false, error: "That password is too easy to guess." };
  const c = await db();
  const dup = await c.execute({ sql: "SELECT 1 FROM admin_users WHERE email = ?", args: [p.data.email] });
  if (dup.rows.length) return { ok: false, error: "A login with this email already exists." };
  await c.execute({
    sql: "INSERT INTO admin_users(name, email, password_hash, role, active, pw_version) VALUES (?,?,?,?,1,?)",
    args: [p.data.name, p.data.email, await hashPassword(p.data.password), p.data.role, newPasswordVersion()],
  });
  revalidatePath("/admin/account");
  return { ok: true, message: `Login created for ${p.data.name}. Share the password with them privately (not in a group chat) and ask them to change it.` };
}

/** Owner: set a new password for someone who forgot theirs (signs them out everywhere). */
export async function resetAdminPassword(id: number, password: string): Promise<Result> {
  let me;
  try { me = await requireOwner(); } catch (e) { return { ok: false, error: (e as Error).message }; }
  const p = passwordSchema.safeParse(password);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const c = await db();
  const { rows } = await c.execute({ sql: "SELECT email FROM admin_users WHERE id = ?", args: [id] });
  if (!rows[0]) return { ok: false, error: "Login not found" };
  if (weak(password, String(rows[0].email))) return { ok: false, error: "That password is too easy to guess." };
  await c.execute({ sql: "UPDATE admin_users SET password_hash = ?, pw_version = ?, updated_at = datetime('now') WHERE id = ?", args: [await hashPassword(password), newPasswordVersion(), id] });
  if (id === me.id) await startSession(me.id);
  revalidatePath("/admin/account");
  return { ok: true, message: "New password set. They have been signed out — share the new password privately." };
}

/** Owner: switch a login off (e.g. a partner leaves) or back on. Can't switch off yourself or the last owner. */
export async function setAdminActive(id: number, active: boolean): Promise<Result> {
  let me;
  try { me = await requireOwner(); } catch (e) { return { ok: false, error: (e as Error).message }; }
  if (id === me.id) return { ok: false, error: "You can't switch off your own login." };
  const c = await db();
  const { rows } = await c.execute({ sql: "SELECT role FROM admin_users WHERE id = ?", args: [id] });
  if (!rows[0]) return { ok: false, error: "Login not found" };
  await c.execute({ sql: "UPDATE admin_users SET active = ?, pw_version = ?, updated_at = datetime('now') WHERE id = ?", args: [active ? 1 : 0, newPasswordVersion(), id] });
  revalidatePath("/admin/account");
  return { ok: true, message: active ? "Login switched on." : "Login switched off — they are signed out and can't sign in." };
}

/** Owner: make someone an owner (can manage logins) or a partner. Keeps at least one owner. */
export async function setAdminRole(id: number, role: "owner" | "partner"): Promise<Result> {
  let me;
  try { me = await requireOwner(); } catch (e) { return { ok: false, error: (e as Error).message }; }
  if (id === me.id && role !== "owner") return { ok: false, error: "You can't remove your own owner rights. Ask another owner." };
  const c = await db();
  await c.execute({ sql: "UPDATE admin_users SET role = ?, updated_at = datetime('now') WHERE id = ?", args: [role, id] });
  revalidatePath("/admin/account");
  return { ok: true, message: role === "owner" ? "They can now manage logins too." : "Changed to partner." };
}
