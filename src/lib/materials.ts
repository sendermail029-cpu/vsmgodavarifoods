import "server-only";
import { db } from "./db";

export type MaterialStatus = "out" | "low" | "soon" | "ok" | "unset";
export type Material = {
  id: number; name: string; telugu: string | null; unit: string; stock: number; lowAt: number; costPerUnit: number | null; active: boolean;
  used30: number; bought30: number; perDay: number; daysLeft: number | null; lastPurchase: string | null; status: MaterialStatus;
};

/** Days of stock below which an item is flagged "running out soon" (even if still above its alert level). */
const SOON_DAYS = 7;

/** Every ingredient with its usage over the last 30 days, daily usage rate and how many days the stock will last. */
export async function listMaterials(): Promise<Material[]> {
  const c = await db();
  const { rows } = await c.execute(`
    SELECT m.*,
      COALESCE((SELECT -SUM(change) FROM raw_material_log l WHERE l.material_id = m.id AND l.kind = 'usage' AND l.created_at >= datetime('now','-30 days')), 0) AS used30,
      COALESCE((SELECT SUM(change) FROM raw_material_log l WHERE l.material_id = m.id AND l.kind = 'purchase' AND l.created_at >= datetime('now','-30 days')), 0) AS bought30,
      (SELECT MIN(created_at) FROM raw_material_log l WHERE l.material_id = m.id AND l.kind = 'usage' AND l.created_at >= datetime('now','-30 days')) AS first_use,
      (SELECT MAX(created_at) FROM raw_material_log l WHERE l.material_id = m.id AND l.kind = 'purchase') AS last_purchase
    FROM raw_materials m WHERE m.active = 1 ORDER BY m.name`);
  return rows.map((r) => {
    const stock = Number(r.stock), lowAt = Number(r.low_at), used30 = Number(r.used30);
    // average over the days we actually have records for (min 7) so a new item isn't under-estimated
    const since = r.first_use ? (Date.now() - new Date(String(r.first_use).replace(" ", "T") + "Z").getTime()) / 864e5 : 0;
    const window = Math.min(30, Math.max(7, since));
    const perDay = used30 > 0 ? used30 / window : 0;
    const daysLeft = perDay > 0 ? stock / perDay : null;
    const hasHistory = !!r.last_purchase || used30 > 0;
    const status: MaterialStatus = stock <= 0 ? (hasHistory ? "out" : "unset") : stock <= lowAt ? "low" : daysLeft !== null && daysLeft < SOON_DAYS ? "soon" : "ok";
    return {
      id: Number(r.id), name: String(r.name), telugu: r.telugu_name ? String(r.telugu_name) : null, unit: String(r.unit), stock, lowAt,
      costPerUnit: r.cost_per_unit == null ? null : Number(r.cost_per_unit), active: !!Number(r.active),
      used30, bought30: Number(r.bought30), perDay, daysLeft, lastPurchase: r.last_purchase ? String(r.last_purchase) : null, status,
    };
  });
}

export async function materialLog(limit = 30) {
  const c = await db();
  const { rows } = await c.execute({
    sql: `SELECT l.*, m.name, m.unit FROM raw_material_log l LEFT JOIN raw_materials m ON m.id = l.material_id ORDER BY l.id DESC LIMIT ?`,
    args: [limit],
  });
  return rows.map((r) => ({
    id: Number(r.id), name: r.name ? String(r.name) : "Deleted item", unit: r.unit ? String(r.unit) : "", kind: String(r.kind),
    change: Number(r.change), after: Number(r.stock_after), note: r.note ? String(r.note) : "", by: r.by_name ? String(r.by_name) : "", cost: r.cost == null ? null : Number(r.cost), at: String(r.created_at),
  }));
}

/** Partner names used before (for the "Done by" suggestions). */
export async function materialPeople() {
  const c = await db();
  const { rows } = await c.execute("SELECT by_name, COUNT(*) n FROM raw_material_log WHERE by_name IS NOT NULL AND by_name != '' GROUP BY by_name ORDER BY n DESC LIMIT 12");
  return rows.map((r) => String(r.by_name));
}

/** Count of ingredients that need attention (for the dashboard / menu badge). */
export async function materialAlerts() {
  const list = await listMaterials();
  return list.filter((m) => m.status === "out" || m.status === "low" || m.status === "soon");
}
