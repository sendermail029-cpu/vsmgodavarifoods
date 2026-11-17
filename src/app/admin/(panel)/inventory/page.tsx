import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { InventoryTable } from "./InventoryTable";

export default async function InventoryPage() {
  const c = await db();
  const [rows, log] = await Promise.all([
    c.execute(`SELECT v.id, v.label, v.price, v.mrp, v.stock, v.low_stock_at, p.name, p.id pid, p.active, cat.name cat
               FROM variants v JOIN products p ON p.id = v.product_id LEFT JOIN categories cat ON cat.id = p.category_id
               ORDER BY cat.sort, p.name, v.sort`),
    c.execute(`SELECT l.change, l.reason, l.created_at, v.label, p.name FROM inventory_log l
               LEFT JOIN variants v ON v.id = l.variant_id LEFT JOIN products p ON p.id = v.product_id ORDER BY l.id DESC LIMIT 25`),
  ]);
  const items = rows.rows.map((r) => ({
    id: Number(r.id), label: String(r.label), price: Number(r.price) / 100, mrp: r.mrp ? Number(r.mrp) / 100 : null, stock: Number(r.stock),
    low: Number(r.low_stock_at), name: String(r.name), pid: Number(r.pid), active: !!Number(r.active), cat: r.cat ? String(r.cat) : "—",
  }));
  const value = items.reduce((s, i) => s + i.price * i.stock, 0);
  return (
    <div>
      <PageHeader title="Inventory" sub={`${items.length} pack sizes · ${items.filter((i) => i.stock <= i.low).length} low/out of stock · stock value ≈ ₹${Math.round(value).toLocaleString("en-IN")}`} />
      <InventoryTable items={items} />
      <section className="card mt-8 p-5">
        <h2 className="font-display text-xl font-bold">Recent stock movements</h2>
        <ul className="mt-3 divide-y divide-maroon-700/5 text-sm">
          {log.rows.map((l, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{String(l.name ?? "Deleted item")} <span className="text-ink/50">{String(l.label ?? "")}</span> — <span className="text-ink/60">{String(l.reason)}</span></span>
              <span className="flex items-center gap-3"><b className={Number(l.change) >= 0 ? "text-leaf" : "text-chilli"}>{Number(l.change) > 0 ? "+" : ""}{String(l.change)}</b><span className="text-xs text-ink/40">{String(l.created_at)} UTC</span></span>
            </li>
          ))}
          {!log.rows.length && <li className="py-6 text-center text-ink/50">No movements yet.</li>}
        </ul>
      </section>
    </div>
  );
}
