"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { saveProduct } from "@/app/admin/actions";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { useToast } from "@/components/admin/useToast";
import { ART_KEYS, ProductArt } from "@/components/ProductArt";

type V = { id?: number; label: string; weight_grams: number; price: number; mrp: number | null; stock: number; low_stock_at: number; sku: string };
type P = {
  id?: number; category_id: number | null; name: string; telugu_name: string; slug: string; short_description: string; description: string;
  ingredients: string; shelf_life: string; art: string; spice_level: number; featured: boolean; active: boolean; hasImage: boolean; variants: V[];
};

const BLANK: P = {
  category_id: null, name: "", telugu_name: "", slug: "", short_description: "", description: "", ingredients: "", shelf_life: "",
  art: "mango", spice_level: 2, featured: false, active: true, hasImage: false,
  variants: [{ label: "250 g", weight_grams: 250, price: 0, mrp: null, stock: 0, low_stock_at: 5, sku: "" }],
};

export function ProductForm({ categories, initial }: { categories: { id: number; name: string }[]; initial?: P }) {
  const [p, setP] = useState<P>(initial ?? { ...BLANK, category_id: categories[0]?.id ?? null });
  const [image, setImage] = useState<string | undefined>(undefined);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const set = <K extends keyof P>(k: K, v: P[K]) => setP((x) => ({ ...x, [k]: v }));
  const setV = (i: number, patch: Partial<V>) => setP((x) => ({ ...x, variants: x.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const { hasImage: _h, ...rest } = p;
      void _h;
      const r = await saveProduct({ ...rest, image });
      toast.show(r.ok, r.ok ? "Product saved ✓" : r.error);
      if (r.ok) {
        setImage(undefined);
        if (!p.id && r.id) router.replace(`/admin/products/${r.id}`);
        else router.refresh();
      }
    });
  }

  const num = (s: string) => (s === "" ? 0 : Number(s));

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      {toast.node}
      <div className="space-y-6">
        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">Basic details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Product name *</label><input className="input" required value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="Chicken Boneless Pickle" /></div>
            <div><label className="label">Telugu name</label><input className="input telugu" value={p.telugu_name} onChange={(e) => set("telugu_name", e.target.value)} placeholder="చికెన్ పచ్చడి" /></div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={p.category_id ?? ""} onChange={(e) => set("category_id", e.target.value ? Number(e.target.value) : null)}>
                <option value="">— none —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="label">URL slug</label><input className="input font-mono" value={p.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto from name" /></div>
          </div>
          <div><label className="label">Short description (cards & Google snippet)</label><input className="input" maxLength={300} value={p.short_description} onChange={(e) => set("short_description", e.target.value)} /></div>
          <div><label className="label">Full description</label><textarea className="input" rows={5} value={p.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Ingredients</label><textarea className="input" rows={3} value={p.ingredients} onChange={(e) => set("ingredients", e.target.value)} /></div>
            <div><label className="label">Shelf life & storage</label><textarea className="input" rows={3} value={p.shelf_life} onChange={(e) => set("shelf_life", e.target.value)} /></div>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">Pack sizes, prices & stock</h2>
              <p className="text-xs text-ink/60">Each pack size has its own price and inventory. Weight is used to calculate delivery charges.</p>
            </div>
            <button type="button" className="btn-ghost shrink-0 whitespace-nowrap bg-white" onClick={() => set("variants", [...p.variants, { label: "", weight_grams: 500, price: 0, mrp: null, stock: 0, low_stock_at: 5, sku: "" }])}><Plus className="h-4 w-4" /> Add size</button>
          </div>
          <div className="mt-4 space-y-3">
            {p.variants.map((v, i) => (
              <div key={v.id ?? `n${i}`} className="grid grid-cols-2 gap-3 rounded-2xl bg-cream/60 p-3 sm:grid-cols-[1.1fr_1fr_1fr_1fr_1fr_auto] sm:items-end">
                <div><label className="label">Size label</label><input className="input" required value={v.label} onChange={(e) => setV(i, { label: e.target.value })} placeholder="500 g" /></div>
                <div><label className="label">Weight (g)</label><input className="input" type="number" min={1} required value={v.weight_grams} onChange={(e) => setV(i, { weight_grams: num(e.target.value) })} /></div>
                <div><label className="label">Price ₹ *</label><input className="input" type="number" min={1} step="0.01" required value={v.price || ""} onChange={(e) => setV(i, { price: num(e.target.value) })} /></div>
                <div><label className="label">MRP ₹ (opt.)</label><input className="input" type="number" min={0} step="0.01" value={v.mrp ?? ""} onChange={(e) => setV(i, { mrp: e.target.value ? Number(e.target.value) : null })} /></div>
                <div><label className="label">Stock</label><input className="input" type="number" min={0} required value={v.stock} onChange={(e) => setV(i, { stock: num(e.target.value) })} /></div>
                <button type="button" disabled={p.variants.length === 1} className="col-span-2 justify-self-end rounded-xl p-2.5 text-chilli hover:bg-white disabled:opacity-30 sm:col-span-1" aria-label="Remove size"
                  onClick={() => set("variants", p.variants.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="card space-y-4 p-5">
          <h2 className="font-display text-xl font-bold">Visibility</h2>
          <label className="flex items-center justify-between text-sm font-semibold">Show in shop <input type="checkbox" className="h-5 w-5 accent-maroon-700" checked={p.active} onChange={(e) => set("active", e.target.checked)} /></label>
          <label className="flex items-center justify-between text-sm font-semibold">Feature on home page <input type="checkbox" className="h-5 w-5 accent-maroon-700" checked={p.featured} onChange={(e) => set("featured", e.target.checked)} /></label>
          <div>
            <label className="label">Spice level: {p.spice_level}/5</label>
            <input type="range" min={0} max={5} value={p.spice_level} onChange={(e) => set("spice_level", Number(e.target.value))} className="w-full accent-chilli" />
          </div>
        </section>
        <section className="card space-y-4 p-5">
          <h2 className="font-display text-xl font-bold">Photo</h2>
          <ImagePicker value={image} onChange={setImage} preview={p.hasImage && p.id ? `/api/image/product/${p.id}` : null} />
          <div>
            <label className="label">Illustration (used when there&apos;s no photo)</label>
            <div className="grid grid-cols-5 gap-2">
              {ART_KEYS.map((k) => (
                <button type="button" key={k} title={k} onClick={() => set("art", k)} className={`overflow-hidden rounded-xl ring-2 ${p.art === k ? "ring-maroon-700" : "ring-transparent"}`}>
                  <ProductArt art={k} name={k} className="h-full w-full" />
                </button>
              ))}
            </div>
          </div>
        </section>
        <button className="btn-primary sticky bottom-4 w-full py-3.5 text-base shadow-2xl" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} Save product</button>
      </aside>
    </form>
  );
}
