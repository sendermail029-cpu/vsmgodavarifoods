import "server-only";
import { createClient, type Client, type InStatement } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { SEED_CATEGORIES, SEED_PRODUCTS, DEFAULT_SETTINGS } from "./seed-data";

/**
 * Database: libSQL (SQLite-compatible).
 * - Local development: a file at ./data/vsm.db (created automatically).
 * - Production (Vercel): set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
 *   (free Turso database) because serverless hosts have no persistent disk.
 */
const globalForDb = globalThis as unknown as { __vsmDb?: Client; __vsmDbReady?: Promise<void>; __vsmDbSchema?: number };

function makeClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  if (process.env.NETLIFY || process.env.VERCEL) {
    throw new Error("TURSO_DATABASE_URL is not set. Serverless hosts have no permanent disk — create a free Turso database and add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN (see README).");
  }
  try {
    mkdirSync("./data", { recursive: true });
  } catch {}
  return createClient({ url: "file:./data/vsm.db" });
}

/** [name, Telugu name, unit, alert when stock falls to] */
const SEED_MATERIALS: [string, string, string, number][] = [
  ["Salt", "ఉప్పు", "kg", 10],
  ["Red chilli powder", "కారం", "kg", 10],
  ["Pickle masala", "మసాలా", "kg", 5],
  ["Groundnut oil", "వేరుశనగ నూనె", "L", 15],
  ["Sesame oil", "నువ్వుల నూనె", "L", 10],
  ["Mustard powder", "ఆవ పిండి", "kg", 3],
  ["Fenugreek powder", "మెంతి పిండి", "kg", 2],
  ["Turmeric powder", "పసుపు", "kg", 2],
  ["Garlic", "వెల్లుల్లి", "kg", 5],
  ["Ginger-garlic paste", "అల్లం వెల్లుల్లి పేస్ట్", "kg", 3],
  ["Tamarind", "చింతపండు", "kg", 5],
  ["Jaggery", "బెల్లం", "kg", 10],
  ["Ghee", "నెయ్యి", "kg", 5],
  ["Rice flour", "బియ్యం పిండి", "kg", 10],
  ["Packing jars", "జాడీలు", "pcs", 100],
];

const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    telugu_name TEXT,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image TEXT,
    sort INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    telugu_name TEXT,
    slug TEXT NOT NULL UNIQUE,
    short_description TEXT,
    description TEXT,
    ingredients TEXT,
    shelf_life TEXT,
    image TEXT,
    art TEXT NOT NULL DEFAULT 'mango',
    spice_level INTEGER NOT NULL DEFAULT 2,
    featured INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    weight_grams INTEGER NOT NULL DEFAULT 250,
    price INTEGER NOT NULL,
    mrp INTEGER,
    stock INTEGER NOT NULL DEFAULT 0,
    low_stock_at INTEGER NOT NULL DEFAULT 5,
    sku TEXT,
    sort INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    notes TEXT,
    items_json TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    shipping INTEGER NOT NULL,
    total INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    utr TEXT,
    provider_txn TEXT,
    status TEXT NOT NULL DEFAULT 'placed',
    tracking TEXT,
    stock_restored INTEGER NOT NULL DEFAULT 0,
    alert_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS inventory_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    variant_id INTEGER NOT NULL,
    change INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`,
  // raw materials / ingredients used in the kitchen (salt, karam, oil, masala…)
  `CREATE TABLE IF NOT EXISTS raw_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    telugu_name TEXT,
    unit TEXT NOT NULL DEFAULT 'kg',
    stock REAL NOT NULL DEFAULT 0,
    low_at REAL NOT NULL DEFAULT 5,
    cost_per_unit INTEGER,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS raw_material_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL,
    kind TEXT NOT NULL,
    change REAL NOT NULL,
    stock_after REAL NOT NULL,
    note TEXT,
    cost INTEGER,
    by_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_rml_material ON raw_material_log(material_id, created_at)`,
  // admin logins (owner + partners). Passwords are bcrypt hashes; pw_version changes on every password change
  `CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'partner',
    active INTEGER NOT NULL DEFAULT 1,
    pw_version TEXT NOT NULL DEFAULT '',
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  // investors / group members and the business money book
  `CREATE TABLE IF NOT EXISTS investors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  // kind: invest = member puts money in, withdraw = member takes money out, expense = money used for the business
  `CREATE TABLE IF NOT EXISTS money_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investor_id INTEGER REFERENCES investors(id),
    kind TEXT NOT NULL,
    amount INTEGER NOT NULL,
    category TEXT,
    note TEXT,
    entry_date TEXT NOT NULL,
    by_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_money_date ON money_entries(entry_date)`,
  `CREATE TABLE IF NOT EXISTS login_attempts (ip TEXT PRIMARY KEY, count INTEGER NOT NULL, first_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`,
  `CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)`,
];

async function init(client: Client) {
  await client.execute("PRAGMA foreign_keys = ON");
  await client.batch(SCHEMA, "write");
  // migrations for databases created before a column existed
  const cols = (await client.execute("PRAGMA table_info(orders)")).rows.map((r) => String(r.name));
  if (!cols.includes("alert_at")) await client.execute("ALTER TABLE orders ADD COLUMN alert_at TEXT");

  // default settings (only inserts missing keys)
  await client.batch(
    Object.entries(DEFAULT_SETTINGS).map(([k, v]) => ({
      sql: "INSERT OR IGNORE INTO settings(key, value) VALUES (?, ?)",
      args: [k, v],
    })),
    "write",
  );

  // starter list of common pickle / sweets ingredients (only if the list is empty; stock starts at 0)
  const rm = await client.execute("SELECT COUNT(*) AS n FROM raw_materials");
  if (Number(rm.rows[0].n) === 0) {
    await client.batch(
      SEED_MATERIALS.map((m) => ({ sql: "INSERT INTO raw_materials(name, telugu_name, unit, low_at) VALUES (?,?,?,?)", args: [m[0], m[1], m[2], m[3]] })),
      "write",
    );
  }

  const { rows } = await client.execute("SELECT COUNT(*) AS n FROM categories");
  if (Number(rows[0].n) > 0) return;

  // First run: seed catalogue so the site is never empty.
  const catIds: Record<string, number> = {};
  for (const [i, c] of SEED_CATEGORIES.entries()) {
    const r = await client.execute({
      sql: "INSERT INTO categories(name, telugu_name, slug, description, sort) VALUES (?,?,?,?,?)",
      args: [c.name, c.telugu, c.slug, c.description, i],
    });
    catIds[c.slug] = Number(r.lastInsertRowid);
  }
  for (const p of SEED_PRODUCTS) {
    const r = await client.execute({
      sql: `INSERT INTO products(category_id, name, telugu_name, slug, short_description, description, ingredients, shelf_life, art, spice_level, featured)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      args: [catIds[p.category], p.name, p.telugu, p.slug, p.short, p.description, p.ingredients, p.shelfLife, p.art, p.spice, p.featured ? 1 : 0],
    });
    const pid = Number(r.lastInsertRowid);
    const stmts: InStatement[] = p.variants.map((v, i) => ({
      sql: "INSERT INTO variants(product_id, label, weight_grams, price, mrp, stock, sort) VALUES (?,?,?,?,?,?,?)",
      args: [pid, v.label, v.grams, v.price * 100, v.mrp ? v.mrp * 100 : null, v.stock, i],
    }));
    await client.batch(stmts, "write");
  }
}

export async function db(): Promise<Client> {
  if (!globalForDb.__vsmDb) globalForDb.__vsmDb = makeClient();
  // re-run setup when new tables were added while the server is running (dev hot reload)
  if (globalForDb.__vsmDbSchema !== SCHEMA.length) { globalForDb.__vsmDbReady = undefined; globalForDb.__vsmDbSchema = SCHEMA.length; }
  if (!globalForDb.__vsmDbReady) {
    globalForDb.__vsmDbReady = init(globalForDb.__vsmDb).catch((e) => {
      globalForDb.__vsmDbReady = undefined;
      throw e;
    });
  }
  await globalForDb.__vsmDbReady;
  return globalForDb.__vsmDb;
}
