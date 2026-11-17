"use client";
import Link from "next/link";
import { useState } from "react";
import { Package, Sticker, Tag, Truck } from "lucide-react";
import { rupees } from "@/lib/format";

type Row = { id: number; code: string; customer: string; city: string; cod: boolean; total: number; status: string; jars: number; items: string; at: string };

export function StickerTools({ toPack, recent, variants, today }: { toPack: Row[]; recent: Row[]; variants: { id: number; label: string }[]; today: string }) {
  const [sel, setSel] = useState<number[]>(toPack.map((o) => o.id));
  const [variant, setVariant] = useState(variants[0]?.id ?? 0);
  const [count, setCount] = useState(12);
  const [date, setDate] = useState(today);
  const toggle = (id: number) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const ids = sel.join(",");
  const jarsSelected = [...toPack, ...recent].filter((o) => sel.includes(o.id)).reduce((t, o) => t + o.jars, 0);

  const Table = ({ rows, title, empty }: { rows: Row[]; title: string; empty: string }) => (
    <section className="card overflow-hidden">
      <h2 className="p-5 pb-3 font-display text-xl font-bold">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-cream text-left text-xs uppercase text-ink/50">
            <tr><th className="w-10 px-5 py-2" /><th className="px-3 py-2">Order</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Items</th><th className="px-3 py-2">Payment</th><th className="px-3 py-2 text-right">Stickers</th></tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className={`border-t border-maroon-700/5 ${sel.includes(o.id) ? "bg-gold-pale/40" : ""}`}>
                <td className="px-5 py-3"><input type="checkbox" className="h-4 w-4 accent-maroon-700" checked={sel.includes(o.id)} onChange={() => toggle(o.id)} aria-label={`Select ${o.code}`} /></td>
                <td className="px-3 py-3"><Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-maroon-700">{o.code}</Link><p className="text-xs capitalize text-ink/50">{o.status}</p></td>
                <td className="px-3 py-3"><p className="font-semibold">{o.customer}</p><p className="text-xs text-ink/50">{o.city}</p></td>
                <td className="px-3 py-3 text-xs">{o.items}</td>
                <td className="px-3 py-3">{o.cod ? <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-800">COD {rupees(o.total)}</span> : <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">Prepaid</span>}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right">
                  <a href={`/api/admin/stickers?type=shipping&ids=${o.id}`} className="mr-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-maroon-700 ring-1 ring-maroon-700/20 hover:bg-cream"><Truck className="h-3.5 w-3.5" /> Parcel</a>
                  <a href={`/api/admin/stickers?type=jars&ids=${o.id}`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-maroon-700 ring-1 ring-maroon-700/20 hover:bg-cream"><Tag className="h-3.5 w-3.5" /> Jars ({o.jars})</a>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-ink/50">{empty}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      {/* bulk download bar */}
      <div className="sticky top-2 z-10 flex flex-wrap items-center gap-3 rounded-3xl bg-gradient-to-r from-maroon-700 to-maroon-800 p-4 text-cream shadow-lg">
        <Package className="h-5 w-5 text-gold-light" />
        <p className="font-semibold">{sel.length} {sel.length === 1 ? "order" : "orders"} selected · {jarsSelected} jars</p>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" onClick={() => setSel(sel.length ? [] : toPack.map((o) => o.id))} className="rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-gold-light/50 hover:bg-white/10">{sel.length ? "Clear selection" : "Select all to pack"}</button>
          <a aria-disabled={!sel.length} href={sel.length ? `/api/admin/stickers?type=shipping&ids=${ids}` : undefined} className={`btn-gold ${sel.length ? "" : "pointer-events-none opacity-50"}`}><Truck className="h-4 w-4" /> Parcel labels (4×6)</a>
          <a aria-disabled={!sel.length} href={sel.length ? `/api/admin/stickers?type=jars&ids=${ids}` : undefined} className={`btn-gold ${sel.length ? "" : "pointer-events-none opacity-50"}`}><Tag className="h-4 w-4" /> Jar stickers (A4)</a>
        </div>
      </div>

      <Table rows={toPack} title={`Orders to pack (${toPack.length})`} empty="Nothing waiting to be packed 🎉" />

      {/* product stickers for jars packed in advance */}
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Sticker className="h-5 w-5 text-gold" /> Product stickers (for jars packed in advance)</h2>
        <p className="mt-1 text-sm text-ink/60">Each sticker shows the product name, net weight, MRP, ingredients, veg/non-veg mark, packed-on date and best-before date (worked out from the product&apos;s shelf life). 12 stickers per A4 page.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px_180px_auto] sm:items-end">
          <div><label className="label" htmlFor="v">Product & pack size</label><select id="v" className="input" value={variant} onChange={(e) => setVariant(Number(e.target.value))}>{variants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}</select></div>
          <div><label className="label" htmlFor="n">How many</label><input id="n" type="number" min={1} max={240} className="input" value={count} onChange={(e) => setCount(Math.max(1, Math.min(240, Number(e.target.value) || 1)))} /></div>
          <div><label className="label" htmlFor="d">Packed on</label><input id="d" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <a href={`/api/admin/stickers?type=product&variant=${variant}&count=${count}&date=${date}`} className="btn-primary"><Tag className="h-4 w-4" /> Download stickers</a>
        </div>
      </section>

      <Table rows={recent} title="Other recent orders (reprint)" empty="No other orders." />
      <p className="text-xs text-ink/50">Tip: in the print window choose <b>Actual size / 100%</b> (not “Fit to page”) so stickers line up with your sticker sheets.</p>
    </div>
  );
}
