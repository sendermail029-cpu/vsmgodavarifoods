import "server-only";
import { db } from "./db";

export type Category = {
  id: number; name: string; telugu_name: string | null; slug: string; description: string | null;
  image: string | null; sort: number; active: number; product_count?: number;
};
export type Variant = {
  id: number; product_id: number; label: string; weight_grams: number; price: number; mrp: number | null;
  stock: number; low_stock_at: number; sku: string | null; sort: number;
};
export type Product = {
  id: number; category_id: number | null; name: string; telugu_name: string | null; slug: string;
  short_description: string | null; description: string | null; ingredients: string | null; shelf_life: string | null;
  image: string | null; art: string; spice_level: number; featured: number; active: number; updated_at: string;
  category_name?: string | null; category_slug?: string | null; variants: Variant[];
};

const rowsAs = <T,>(rows: unknown[]) => rows.map((r) => ({ ...(r as object) })) as T[];

export async function getCategories(opts: { includeInactive?: boolean } = {}) {
  const c = await db();
  const { rows } = await c.execute(
    `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
     FROM categories c ${opts.includeInactive ? "" : "WHERE c.active = 1"} ORDER BY c.sort, c.name`,
  );
  return rowsAs<Category>(rows);
}

export async function getCategoryBySlug(slug: string) {
  const c = await db();
  const { rows } = await c.execute({ sql: "SELECT * FROM categories WHERE slug = ? AND active = 1", args: [slug] });
  return rows[0] ? (rowsAs<Category>(rows)[0]) : null;
}

async function attachVariants(products: Product[]) {
  if (!products.length) return products;
  const c = await db();
  const ids = products.map((p) => p.id);
  const { rows } = await c.execute({
    sql: `SELECT * FROM variants WHERE product_id IN (${ids.map(() => "?").join(",")}) ORDER BY sort, price`,
    args: ids,
  });
  const vs = rowsAs<Variant>(rows);
  for (const p of products) p.variants = vs.filter((v) => v.product_id === p.id);
  return products;
}

export async function getProducts(opts: { categorySlug?: string; featured?: boolean; includeInactive?: boolean; q?: string; limit?: number } = {}) {
  const c = await db();
  const where: string[] = [];
  const args: (string | number)[] = [];
  // products switched off in admin stay listed on the website, shown as "Out of stock" (see soldOutIfOff)
  if (!opts.includeInactive) where.push("(cat.active = 1 OR cat.id IS NULL)");
  if (opts.categorySlug) { where.push("cat.slug = ?"); args.push(opts.categorySlug); }
  if (opts.featured) where.push("p.featured = 1");
  if (opts.q) { where.push("(p.name LIKE ? OR p.telugu_name LIKE ?)"); args.push(`%${opts.q}%`, `%${opts.q}%`); }
  const { rows } = await c.execute({
    sql: `SELECT p.*, cat.name AS category_name, cat.slug AS category_slug
          FROM products p LEFT JOIN categories cat ON cat.id = p.category_id
          ${where.length ? "WHERE " + where.join(" AND ") : ""}
          ORDER BY cat.sort, p.featured DESC, p.name ${opts.limit ? "LIMIT " + Number(opts.limit) : ""}`,
    args,
  });
  const list = await attachVariants(rowsAs<Product>(rows));
  return opts.includeInactive ? list : list.map(soldOutIfOff);
}

/** For the public website: a product switched off in admin shows every pack size with 0 stock ("Out of stock", cannot be ordered). */
function soldOutIfOff(p: Product): Product {
  return p.active ? p : { ...p, variants: p.variants.map((v) => ({ ...v, stock: 0 })) };
}

export async function getProductBySlug(slug: string) {
  const c = await db();
  const { rows } = await c.execute({
    sql: `SELECT p.*, cat.name AS category_name, cat.slug AS category_slug
          FROM products p LEFT JOIN categories cat ON cat.id = p.category_id WHERE p.slug = ?`,
    args: [slug],
  });
  if (!rows[0]) return null;
  return soldOutIfOff((await attachVariants(rowsAs<Product>(rows)))[0]);
}

export async function getProductById(id: number) {
  const c = await db();
  const { rows } = await c.execute({
    sql: `SELECT p.*, cat.name AS category_name, cat.slug AS category_slug
          FROM products p LEFT JOIN categories cat ON cat.id = p.category_id WHERE p.id = ?`,
    args: [id],
  });
  if (!rows[0]) return null;
  return (await attachVariants(rowsAs<Product>(rows)))[0];
}

/** Cloudinary delivery URL with automatic format/quality and a sensible max width. */
export const optimised = (url: string, w = 900) => url.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_limit,w_${w}/`);

/** Lightweight shape sent to client components (no big image blobs duplicated). */
export function toCard(p: Product) {
  const inStock = p.variants.filter((v) => v.stock > 0);
  const from = (inStock.length ? inStock : p.variants).reduce((m, v) => Math.min(m, v.price), Infinity);
  return {
    id: p.id, name: p.name, telugu: p.telugu_name, slug: p.slug, short: p.short_description, art: p.art,
    image: p.image ? (p.image.startsWith("https://res.cloudinary.com/") ? optimised(p.image) : `/api/image/product/${p.id}?v=${encodeURIComponent(p.image.length.toString(36))}`) : null,
    spice: p.spice_level, category: p.category_name ?? null, categorySlug: p.category_slug ?? null,
    fromPrice: Number.isFinite(from) ? from : 0,
    variants: p.variants.map((v) => ({ id: v.id, label: v.label, price: v.price, mrp: v.mrp, stock: v.stock, grams: v.weight_grams })),
  };
}
export type ProductCard = ReturnType<typeof toCard>;
