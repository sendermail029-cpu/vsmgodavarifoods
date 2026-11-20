"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, Loader2, Package, Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteCategory, saveCategory } from "@/app/admin/actions";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { useToast } from "@/components/admin/useToast";

type Cat = { id: number; name: string; telugu_name: string; slug: string; description: string; sort: number; active: boolean; hasImage: boolean; count: number };
const EMPTY = { id: 0, name: "", telugu_name: "", slug: "", description: "", sort: 0, active: true, hasImage: false, count: 0 };

/** Fallback photo per category when no image has been uploaded. */
const CAT_PHOTO: Record<string, string> = { "non-veg-pickles": "chicken", "veg-pickles": "mango", "sweets-laddus": "laddu", "traditional-snacks": "murukulu" };
const photoFor = (c: Cat) => (c.hasImage ? `/api/image/category/${c.id}` : `/products/${CAT_PHOTO[c.slug] ?? "mango"}.webp?v=3`);

export function CategoryManager({ cats }: { cats: Cat[] }) {
  const [edit, setEdit] = useState<Cat | null>(null);
  const [image, setImage] = useState<string | undefined>(undefined);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const open = (c: Cat) => { setEdit(c); setImage(undefined); };
  const save = () => edit && start(async () => {
    const r = await saveCategory({ ...edit, id: edit.id || undefined, image });
    toast.show(r.ok, r.ok ? "Category saved" : r.error);
    if (r.ok) { setEdit(null); router.refresh(); }
  });
  /** quick actions on a card (save the category with one field changed) */
  const quick = (c: Cat, patch: Partial<Cat>, msg: string) => start(async () => {
    const r = await saveCategory({ ...c, ...patch });
    toast.show(r.ok, r.ok ? msg : r.error);
    router.refresh();
  });
  /** swap position with the neighbour above/below */
  const move = (i: number, dir: -1 | 1) => {
    const a = cats[i], b = cats[i + dir];
    if (!a || !b) return;
    start(async () => {
      const sa = a.sort === b.sort ? i + dir : b.sort, sb = a.sort === b.sort ? i : a.sort;
      const [r1, r2] = await Promise.all([saveCategory({ ...a, sort: sa }), saveCategory({ ...b, sort: sb })]);
      toast.show(r1.ok && r2.ok, r1.ok && r2.ok ? "Order updated" : "Could not reorder");
      router.refresh();
    });
  };

  const total = cats.reduce((s, c) => s + c.count, 0);

  return (
    <div>
      {toast.node}
      {/* summary + add */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-gold/40">{cats.length} categories</span>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-gold/40">{cats.filter((c) => c.active).length} visible</span>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-gold/40">{total} products</span>
        <button className="btn-primary ml-auto" onClick={() => open({ ...EMPTY, sort: cats.length })}><Plus className="h-4 w-4" /> Add category</button>
      </div>

      {/* category cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cats.map((c, i) => (
          <article key={c.id} className={`card group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg ${c.active ? "" : "opacity-70"}`}>
            <div className="relative aspect-[4/3] overflow-hidden bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoFor(c)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-maroon-900/85 via-maroon-900/25 to-transparent" />
              <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-sm font-bold text-maroon-800 shadow">{i + 1}</span>
              <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow ${c.active ? "bg-leaf text-white" : "bg-ink/70 text-white"}`}>{c.active ? "Visible" : "Hidden"}</span>
              <div className="absolute inset-x-0 bottom-0 p-4 text-cream">
                <h3 className="font-display text-xl font-bold leading-tight">{c.name}</h3>
                {c.telugu_name && <p className="telugu text-sm text-gold-light">{c.telugu_name}</p>}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="space-y-1 text-sm">
                <span className="flex items-center gap-1.5 whitespace-nowrap font-semibold"><Package className="h-4 w-4 text-gold" /> {c.count} {c.count === 1 ? "product" : "products"}</span>
                <Link href={`/shop/${c.slug}`} target="_blank" className="flex w-fit items-center gap-1 truncate font-mono text-xs text-ink/50 hover:text-maroon-700">/shop/{c.slug} <ExternalLink className="h-3 w-3" /></Link>
              </div>
              {c.description && <p className="line-clamp-2 text-xs text-ink/60">{c.description}</p>}
              <div className="mt-auto flex items-center gap-0.5 border-t border-maroon-700/10 pt-3">
                <button className="btn-ghost min-w-0 flex-1 px-3 py-2 text-xs" onClick={() => open(c)}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <button className="rounded-lg p-2 hover:bg-cream disabled:opacity-30" disabled={pending || i === 0} onClick={() => move(i, -1)} aria-label="Move earlier" title="Move earlier"><ArrowUp className="h-4 w-4" /></button>
                <button className="rounded-lg p-2 hover:bg-cream disabled:opacity-30" disabled={pending || i === cats.length - 1} onClick={() => move(i, 1)} aria-label="Move later" title="Move later"><ArrowDown className="h-4 w-4" /></button>
                <button className="rounded-lg p-2 hover:bg-cream" disabled={pending} onClick={() => quick(c, { active: !c.active }, c.active ? "Hidden from website" : "Visible on website")} aria-label={c.active ? "Hide" : "Show"} title={c.active ? "Hide from website" : "Show on website"}>
                  {c.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button className="rounded-lg p-2 text-chilli hover:bg-cream" aria-label="Delete" title="Delete" disabled={pending} onClick={() => {
                  if (!confirm(`Delete category "${c.name}"?`)) return;
                  start(async () => { const r = await deleteCategory(c.id); toast.show(r.ok, r.ok ? "Deleted" : r.error); router.refresh(); });
                }}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </article>
        ))}
        {/* add tile */}
        <button onClick={() => open({ ...EMPTY, sort: cats.length })} className="grid min-h-[16rem] place-items-center rounded-3xl border-2 border-dashed border-gold/50 bg-white/40 text-maroon-700 transition hover:border-maroon-700 hover:bg-white">
          <span className="flex flex-col items-center gap-2 font-semibold"><span className="grid h-12 w-12 place-items-center rounded-full bg-maroon-700 text-cream"><Plus className="h-6 w-6" /></span>Add category</span>
        </button>
      </div>

      {/* add / edit panel */}
      <AnimatePresence>
        {edit && (
          <>
            <motion.div className="fixed inset-0 z-[70] bg-ink/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEdit(null)} />
            <motion.aside role="dialog" aria-modal="true" aria-label={edit.id ? "Edit category" : "New category"}
              className="fixed right-0 top-0 z-[71] flex h-dvh w-full max-w-md flex-col bg-cream shadow-2xl"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}>
              <div className="flex items-center justify-between bg-gradient-to-r from-maroon-700 to-maroon-800 px-5 py-4 text-cream">
                <h2 className="font-display text-xl font-bold">{edit.id ? `Edit “${edit.name}”` : "New category"}</h2>
                <button onClick={() => setEdit(null)} className="rounded-full p-2 hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button>
              </div>
              <form className="flex-1 space-y-4 overflow-y-auto p-5" onSubmit={(e) => { e.preventDefault(); save(); }}>
                <div><label className="label">Photo</label><ImagePicker value={image} onChange={setImage} preview={edit.hasImage ? `/api/image/category/${edit.id}` : null} /></div>
                <div><label className="label">Name</label><input className="input" required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="e.g. Veg Pickles" /></div>
                <div><label className="label">Telugu name</label><input className="input telugu" value={edit.telugu_name} onChange={(e) => setEdit({ ...edit, telugu_name: e.target.value })} placeholder="e.g. వెజ్ పచ్చళ్ళు" /></div>
                <div><label className="label">Web address</label>
                  <div className="flex items-center rounded-xl bg-white ring-1 ring-maroon-700/20"><span className="pl-3 font-mono text-xs text-ink/50">/shop/</span><input className="input border-0 font-mono ring-0 focus:ring-0" placeholder="auto from name" value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /></div>
                </div>
                <div><label className="label">Description (shown on the category page & Google)</label><textarea className="input" rows={3} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
                <label className="flex items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-maroon-700/10">
                  <span><span className="block text-sm font-semibold">Show on website</span><span className="text-xs text-ink/50">Hidden categories stay in the admin only.</span></span>
                  <input type="checkbox" className="h-5 w-5 accent-maroon-700" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />
                </label>
                <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-maroon-700/10 bg-cream px-5 pt-4">
                  <button className="btn-primary flex-1 py-3" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} {edit.id ? "Save changes" : "Create category"}</button>
                  <button type="button" className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
                </div>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
