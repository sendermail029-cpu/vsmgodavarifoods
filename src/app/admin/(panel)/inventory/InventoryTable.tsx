"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { adjustStock, updatePrice } from "@/app/admin/actions";
import { useToast } from "@/components/admin/useToast";

type Item = { id: number; label: string; price: number; mrp: number | null; stock: number; low: number; name: string; pid: number; active: boolean; cat: string };

function Row({ it, onDone }: { it: Item; onDone: (ok: boolean, msg: string) => void }) {
  const [count, setCount] = useState(String(it.stock));
  const [price, setPrice] = useState(String(it.price));
  const [pending, start] = useTransition();
  const status = it.stock <= 0 ? "bg-red-100 text-red-800" : it.stock <= it.low ? "bg-orange-100 text-orange-800" : "bg-emerald-100 text-emerald-800";
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => { const r = await fn(); onDone(r.ok, r.ok ? r.message ?? "Saved" : r.error ?? "Error"); });
  return (
    <tr className={`border-t border-maroon-700/5 ${pending ? "opacity-50" : ""}`}>
      <td className="px-4 py-2.5"><Link href={`/admin/products/${it.pid}`} className="font-semibold hover:text-maroon-700">{it.name}</Link>{!it.active && <span className="ml-2 text-xs text-ink/40">(hidden)</span>}<p className="text-xs text-ink/50">{it.cat}</p></td>
      <td className="px-3 py-2.5 font-semibold">{it.label}</td>
      <td className="px-3 py-2.5">
        <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); run(() => updatePrice(it.id, Number(price), it.mrp)); }}>
          <span className="text-ink/50">₹</span>
          <input className="input w-24 px-2 py-1.5" type="number" min={1} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Price" />
          {Number(price) !== it.price && <button className="rounded-lg bg-leaf p-1.5 text-white" aria-label="Save price"><Check className="h-4 w-4" /></button>}
        </form>
      </td>
      <td className="px-3 py-2.5"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status}`}>{it.stock <= 0 ? "Out of stock" : `${it.stock} in stock`}</span></td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1">
          <button className="rounded-lg p-1.5 ring-1 ring-maroon-700/15 hover:bg-cream" onClick={() => run(() => adjustStock(it.id, "add", -1, "Manual -1"))} aria-label="Minus one"><Minus className="h-4 w-4" /></button>
          <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); run(() => adjustStock(it.id, "set", Number(count), "Stock count")); }}>
            <input className="input w-20 px-2 py-1.5 text-center" type="number" min={0} value={count} onChange={(e) => setCount(e.target.value)} aria-label="Set stock" />
            {Number(count) !== it.stock && <button className="rounded-lg bg-leaf p-1.5 text-white" aria-label="Save stock"><Check className="h-4 w-4" /></button>}
          </form>
          <button className="rounded-lg p-1.5 ring-1 ring-maroon-700/15 hover:bg-cream" onClick={() => run(() => adjustStock(it.id, "add", 1, "Manual +1"))} aria-label="Plus one"><Plus className="h-4 w-4" /></button>
          <button className="rounded-lg px-2 py-1 text-xs font-bold ring-1 ring-maroon-700/15 hover:bg-cream" onClick={() => run(() => adjustStock(it.id, "add", 10, "Restock +10"))}>+10</button>
        </div>
      </td>
    </tr>
  );
}

export function InventoryTable({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState<"all" | "low">("all");
  const [q, setQ] = useState("");
  const router = useRouter();
  const toast = useToast();
  const list = useMemo(() => items.filter((i) => (filter === "all" || i.stock <= i.low) && (!q || i.name.toLowerCase().includes(q.toLowerCase()))), [items, filter, q]);
  return (
    <>
      {toast.node}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "low"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 ${filter === f ? "bg-maroon-700 text-cream ring-maroon-700" : "bg-white ring-maroon-700/15"}`}>{f === "all" ? "All items" : "Low / out of stock"}</button>
        ))}
        <input className="input w-56" placeholder="Search product…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-cream text-left text-xs uppercase text-ink/50"><tr><th className="px-4 py-2">Product</th><th className="px-3 py-2">Size</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Adjust stock</th></tr></thead>
          <tbody>{list.map((it) => <Row key={`${it.id}-${it.stock}-${it.price}`} it={it} onDone={(ok, m) => { toast.show(ok, m); router.refresh(); }} />)}</tbody>
        </table>
      </div>
    </>
  );
}
