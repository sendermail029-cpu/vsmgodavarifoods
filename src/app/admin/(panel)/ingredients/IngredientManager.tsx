"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ClipboardCheck, Loader2, Minus, Pencil, Plus, ShoppingBasket, Trash2, X } from "lucide-react";
import { deleteMaterial, recordMaterial, saveMaterial } from "@/app/admin/actions";
import { useToast } from "@/components/admin/useToast";

type Item = {
  id: number; name: string; telugu: string | null; unit: string; stock: number; lowAt: number; costPerUnit: number | null;
  used30: number; bought30: number; perDay: number; daysLeft: number | null; lastPurchase: string | null; status: "out" | "low" | "soon" | "ok" | "unset";
};
type Log = { id: number; name: string; unit: string; kind: string; change: number; after: number; note: string; by: string; cost: number | null; at: string };
type Move = { item: Item; kind: "purchase" | "usage" | "count" };
type Edit = { id?: number; name: string; telugu_name: string; unit: string; low_at: number; cost_per_unit: number | null; opening_stock: number };

const UNITS = ["kg", "g", "L", "ml", "pcs", "packets"];
/** Second unit offered when entering a quantity: factor converts it into the item's own unit. */
const ALT_UNIT: Record<string, { unit: string; factor: number }> = { kg: { unit: "g", factor: 0.001 }, g: { unit: "kg", factor: 1000 }, L: { unit: "ml", factor: 0.001 }, ml: { unit: "L", factor: 1000 } };
const n = (v: number) => (Math.round(v * 100) / 100).toLocaleString("en-IN");
const rs = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const when = (s: string) => new Date(s.replace(" ", "T") + "Z").toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

const STATUS: Record<Item["status"], { label: string; cls: string; bar: string }> = {
  out: { label: "Out of stock", cls: "bg-red-100 text-red-800", bar: "bg-red-500" },
  low: { label: "Shortage", cls: "bg-orange-100 text-orange-800", bar: "bg-orange-500" },
  soon: { label: "Running out soon", cls: "bg-amber-100 text-amber-900", bar: "bg-amber-400" },
  ok: { label: "In stock", cls: "bg-emerald-100 text-emerald-800", bar: "bg-leaf" },
  unset: { label: "Add stock", cls: "bg-zinc-100 text-zinc-700", bar: "bg-zinc-300" },
};

export function IngredientManager({ items, log, people }: { items: Item[]; log: Log[]; people: string[] }) {
  const [move, setMove] = useState<Move | null>(null);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [filter, setFilter] = useState<"all" | "alerts">("all");
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const alerts = items.filter((i) => i.status === "out" || i.status === "low" || i.status === "soon");
  const unset = items.filter((i) => i.status === "unset");
  const shown = filter === "alerts" ? alerts : items;
  const order = useMemo(() => ({ out: 0, low: 1, soon: 2, unset: 3, ok: 4 }), []);
  const sorted = [...shown].sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
  const spent30 = log.filter((l) => l.kind === "purchase" && l.cost && Date.now() - new Date(l.at.replace(" ", "T") + "Z").getTime() < 30 * 864e5).reduce((s, l) => s + (l.cost ?? 0), 0);

  return (
    <div>
      {toast.node}
      {/* summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { t: "Ingredients tracked", v: String(items.length), sub: `${unset.length ? `${unset.length} still need opening stock` : "all have stock entered"}` },
          { t: "Shortages", v: String(items.filter((i) => i.status === "out" || i.status === "low").length), sub: "at or below alert level", warn: true },
          { t: "Running out within 7 days", v: String(items.filter((i) => i.status === "soon").length), sub: "based on recent usage", warn: true },
          { t: "Bought (last 30 days)", v: spent30 ? rs(spent30) : "—", sub: "from purchases with a cost entered" },
        ].map((s) => (
          <div key={s.t} className="card p-5">
            <p className="text-sm font-semibold text-ink/60">{s.t}</p>
            <p className={`mt-1 font-display text-3xl font-black ${s.warn && s.v !== "0" ? "text-chilli" : "text-maroon-700"}`}>{s.v}</p>
            <p className="text-xs text-ink/50">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* shortage alert banner */}
      {alerts.length > 0 && (
        <div className="mt-6 rounded-3xl bg-gradient-to-r from-maroon-700 to-maroon-800 p-5 text-cream shadow-lg">
          <p className="flex items-center gap-2 font-display text-lg font-bold"><AlertTriangle className="h-5 w-5 text-gold-light" /> Buy soon — {alerts.length} {alerts.length === 1 ? "ingredient" : "ingredients"} need attention</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {alerts.map((a) => (
              <button key={a.id} onClick={() => setMove({ item: a, kind: "purchase" })} className="rounded-full bg-white/10 px-3 py-1.5 text-sm ring-1 ring-gold-light/40 transition hover:bg-white/20">
                <b>{a.name}</b> · {n(a.stock)} {a.unit} left{a.daysLeft !== null ? ` · ~${Math.max(0, Math.floor(a.daysLeft))} days` : ""}
              </button>
            ))}
          </div>
        </div>
      )}
      {unset.length > 0 && (
        <p className="mt-4 rounded-2xl bg-turmeric/20 p-3 text-sm">
          <b>Getting started:</b> use <b>Stock count</b> on each ingredient to enter how much you have right now. After that, record <b>Purchases</b> when you buy and <b>Usage</b> when you cook — shortages and “days left” are worked out automatically.
        </p>
      )}

      {/* toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["all", "alerts"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${filter === f ? "bg-maroon-700 text-cream ring-maroon-700" : "bg-white ring-gold/40 hover:bg-gold-pale"}`}>
            {f === "all" ? `All (${items.length})` : `Needs attention (${alerts.length})`}
          </button>
        ))}
        <button className="btn-primary ml-auto" onClick={() => setEdit({ name: "", telugu_name: "", unit: "kg", low_at: 5, cost_per_unit: null, opening_stock: 0 })}><Plus className="h-4 w-4" /> Add ingredient</button>
      </div>

      {/* ingredient cards */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((i) => {
          const st = STATUS[i.status];
          const fill = i.lowAt > 0 ? Math.min(100, (i.stock / (i.lowAt * 3)) * 100) : i.stock > 0 ? 100 : 0;
          return (
            <article key={i.id} className={`card flex flex-col p-5 ${i.status === "out" || i.status === "low" ? "ring-2 ring-orange-300" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold leading-tight">{i.name}</h3>
                  {i.telugu && <p className="telugu text-sm text-ink/55">{i.telugu}</p>}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${st.cls}`}>{st.label}</span>
              </div>
              <p className="mt-3 font-display text-3xl font-black text-maroon-700">{n(i.stock)} <span className="text-base font-semibold text-ink/50">{i.unit}</span></p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-dark"><div className={`h-full rounded-full ${st.bar}`} style={{ width: `${fill}%` }} /></div>
              <p className="mt-1 text-[11px] text-ink/45">Alert at {n(i.lowAt)} {i.unit}</p>
              <dl className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-cream/60 p-3 text-center text-xs">
                <div><dt className="text-ink/50">Used · 30 days</dt><dd className="mt-0.5 font-bold">{i.used30 ? `${n(i.used30)} ${i.unit}` : "—"}</dd></div>
                <div><dt className="text-ink/50">Per day</dt><dd className="mt-0.5 font-bold">{i.perDay ? `${n(i.perDay)} ${i.unit}` : "—"}</dd></div>
                <div><dt className="text-ink/50">Lasts about</dt><dd className={`mt-0.5 font-bold ${i.daysLeft !== null && i.daysLeft < 7 ? "text-chilli" : ""}`}>{i.daysLeft === null ? "—" : `${Math.floor(i.daysLeft)} days`}</dd></div>
              </dl>
              {i.costPerUnit != null && <p className="mt-2 text-xs text-ink/50">Last price {rs(i.costPerUnit)} / {i.unit}</p>}
              <div className="mt-4 flex items-center gap-1 border-t border-maroon-700/10 pt-3">
                <button className="btn-primary min-w-0 flex-1 px-2 py-2 text-xs" onClick={() => setMove({ item: i, kind: "purchase" })}><ShoppingBasket className="h-3.5 w-3.5" /> Purchase</button>
                <button className="btn-ghost min-w-0 flex-1 px-2 py-2 text-xs" onClick={() => setMove({ item: i, kind: "usage" })}><Minus className="h-3.5 w-3.5" /> Usage</button>
                <button className="shrink-0 rounded-lg p-1.5 hover:bg-cream" title="Stock count (set exact amount)" onClick={() => setMove({ item: i, kind: "count" })}><ClipboardCheck className="h-4 w-4" /></button>
                <button className="shrink-0 rounded-lg p-1.5 hover:bg-cream" title="Edit" onClick={() => setEdit({ id: i.id, name: i.name, telugu_name: i.telugu ?? "", unit: i.unit, low_at: i.lowAt, cost_per_unit: i.costPerUnit == null ? null : i.costPerUnit / 100, opening_stock: 0 })}><Pencil className="h-4 w-4" /></button>
                <button className="shrink-0 rounded-lg p-1.5 text-chilli hover:bg-cream" title="Remove" onClick={() => {
                  if (!confirm(`Remove "${i.name}" from the ingredient list?`)) return;
                  start(async () => { const r = await deleteMaterial(i.id); toast.show(r.ok, r.ok ? "Removed" : r.error); router.refresh(); });
                }}><Trash2 className="h-4 w-4" /></button>
              </div>
            </article>
          );
        })}
        {!sorted.length && <p className="col-span-full py-12 text-center text-ink/50">{filter === "alerts" ? "No shortages — everything is well stocked 👍" : "No ingredients yet."}</p>}
      </div>

      {/* activity */}
      <section className="card mt-8 p-5">
        <h2 className="font-display text-xl font-bold">Recent purchases & usage</h2>
        <ul className="mt-3 divide-y divide-maroon-700/5 text-sm">
          {log.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                <span className={`mr-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${l.kind === "purchase" ? "bg-emerald-100 text-emerald-800" : l.kind === "usage" ? "bg-orange-100 text-orange-800" : "bg-zinc-100 text-zinc-700"}`}>{l.kind === "purchase" ? "Purchase" : l.kind === "usage" ? "Usage" : "Count"}</span>
                <b>{l.name}</b>{l.note && <span className="text-ink/55"> — {l.note}</span>}
                {l.by && <span className="ml-2 rounded-full bg-maroon-700/10 px-2 py-0.5 text-[11px] font-semibold text-maroon-800">by {l.by}</span>}
              </span>
              <span className="flex items-center gap-3">
                <b className={l.change >= 0 ? "text-leaf" : "text-chilli"}>{l.change > 0 ? "+" : ""}{n(l.change)} {l.unit}</b>
                {l.cost ? <span className="text-ink/60">{rs(l.cost)}</span> : null}
                <span className="text-xs text-ink/45">→ {n(l.after)} · {when(l.at)}</span>
              </span>
            </li>
          ))}
          {!log.length && <li className="py-6 text-center text-ink/50">Nothing recorded yet.</li>}
        </ul>
      </section>

      {/* purchase / usage / count dialog */}
      <AnimatePresence>
        {move && <MoveDialog move={move} people={people} pending={pending} onClose={() => setMove(null)} onSave={(qty, note, cost, by) => start(async () => {
          const r = await recordMaterial({ id: move.item.id, kind: move.kind, qty, note, cost, by });
          toast.show(r.ok, r.ok ? r.message ?? "Saved" : r.error);
          if (r.ok) { setMove(null); router.refresh(); }
        })} />}
        {edit && <EditDialog edit={edit} setEdit={setEdit} pending={pending} onClose={() => setEdit(null)} onSave={() => start(async () => {
          const r = await saveMaterial(edit);
          toast.show(r.ok, r.ok ? "Saved" : r.error);
          if (r.ok) { setEdit(null); router.refresh(); }
        })} />}
      </AnimatePresence>
    </div>
  );
}

function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-3xl bg-cream shadow-2xl"
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}>
        <div className="flex items-center justify-between bg-gradient-to-r from-maroon-700 to-maroon-800 px-5 py-4 text-cream">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function MoveDialog({ move, people, pending, onClose, onSave }: { move: Move; people: string[]; pending: boolean; onClose: () => void; onSave: (qty: number, note: string, cost: number | null, by: string) => void }) {
  const { item, kind } = move;
  // type in a smaller/larger unit if easier (e.g. 250 g of a kg item); converted to the item's unit on save
  const alt = ALT_UNIT[item.unit];
  const [entryUnit, setEntryUnit] = useState(item.unit);
  const factor = alt && entryUnit === alt.unit ? alt.factor : 1;
  const [qty, setQty] = useState(kind === "count" ? String(item.stock) : "");
  const [note, setNote] = useState("");
  const [cost, setCost] = useState("");
  // remember who is using this computer, so partners don't retype their name every time
  const [by, setBy] = useState(() => { try { return localStorage.getItem("vsm-partner") ?? ""; } catch { return ""; } });
  const title = kind === "purchase" ? `Purchase — ${item.name}` : kind === "usage" ? `Usage — ${item.name}` : `Stock count — ${item.name}`;
  const q = Number(qty) * factor;
  const after = kind === "purchase" ? item.stock + q : kind === "usage" ? item.stock - q : q;
  return (
    <Shell title={title} onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); try { localStorage.setItem("vsm-partner", by.trim()); } catch {} onSave(q, note, cost === "" ? null : Number(cost), by.trim()); }}>
        <p className="text-sm text-ink/60">In stock now: <b>{n(item.stock)} {item.unit}</b></p>
        <div>
          <label className="label">{kind === "purchase" ? "Quantity bought" : kind === "usage" ? "Quantity used" : "Exact quantity in stock now"}</label>
          <div className="flex gap-2">
            <input className="input text-lg font-semibold" type="number" min="0" step="any" required autoFocus value={qty} onChange={(e) => setQty(e.target.value)} />
            {alt ? (
              <div className="flex shrink-0 overflow-hidden rounded-xl ring-1 ring-maroon-700/20" role="radiogroup" aria-label="Unit">
                {[item.unit, alt.unit].map((u) => (
                  <button key={u} type="button" aria-pressed={entryUnit === u} onClick={() => { if (u !== entryUnit && qty !== "") setQty(String(+(Number(qty) * (u === alt.unit ? 1 / alt.factor : alt.factor)).toFixed(4))); setEntryUnit(u); }}
                    className={`px-4 text-sm font-semibold transition ${entryUnit === u ? "bg-maroon-700 text-cream" : "bg-white hover:bg-cream"}`}>{u}</button>
                ))}
              </div>
            ) : <span className="grid shrink-0 place-items-center px-2 text-sm font-semibold text-ink/60">{item.unit}</span>}
          </div>
          {alt && entryUnit === alt.unit && qty !== "" && <p className="mt-1 text-xs text-ink/50">= {n(q)} {item.unit}</p>}
        </div>
        {kind === "purchase" && (
          <div><label className="label">Total cost paid (₹, optional)</label><input className="input" type="number" min="0" step="any" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="e.g. 1200" /></div>
        )}
        <div>
          <label className="label">Done by (partner name)</label>
          <input className="input" required minLength={2} list="vsm-partners" value={by} onChange={(e) => setBy(e.target.value)} placeholder="Your name" />
          <datalist id="vsm-partners">{people.map((p) => <option key={p} value={p} />)}</datalist>
        </div>
        <div><label className="label">Note (optional)</label><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={kind === "purchase" ? "Shop name, bill no…" : kind === "usage" ? "e.g. 20 kg mango pickle batch" : "Physical count"} maxLength={200} /></div>
        {qty !== "" && Number.isFinite(q) && <p className={`rounded-xl p-3 text-sm ${after < 0 ? "bg-chilli/10 text-chilli" : after <= item.lowAt ? "bg-orange-50 text-orange-800" : "bg-white"}`}>After saving: <b>{n(after)} {item.unit}</b>{after >= 0 && after <= item.lowAt ? " — below alert level" : ""}</p>}
        <div className="flex gap-2">
          <button className="btn-primary flex-1 py-3" disabled={pending || qty === ""}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Shell>
  );
}

function EditDialog({ edit, setEdit, pending, onClose, onSave }: { edit: Edit; setEdit: (e: Edit) => void; pending: boolean; onClose: () => void; onSave: () => void }) {
  return (
    <Shell title={edit.id ? `Edit — ${edit.name}` : "Add ingredient"} onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
        <div><label className="label">Name</label><input className="input" required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="e.g. Red chilli powder" /></div>
        <div><label className="label">Telugu name</label><input className="input telugu" value={edit.telugu_name} onChange={(e) => setEdit({ ...edit, telugu_name: e.target.value })} placeholder="e.g. కారం" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Unit</label><select className="input" value={edit.unit} onChange={(e) => setEdit({ ...edit, unit: e.target.value })}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></div>
          <div><label className="label">Alert when below</label><input className="input" type="number" min="0" step="any" value={edit.low_at} onChange={(e) => setEdit({ ...edit, low_at: Number(e.target.value) })} /></div>
        </div>
        {!edit.id && <div><label className="label">Stock you have now ({edit.unit})</label><input className="input" type="number" min="0" step="any" value={edit.opening_stock} onChange={(e) => setEdit({ ...edit, opening_stock: Number(e.target.value) })} /></div>}
        <div><label className="label">Price per {edit.unit} (₹, optional)</label><input className="input" type="number" min="0" step="any" value={edit.cost_per_unit ?? ""} onChange={(e) => setEdit({ ...edit, cost_per_unit: e.target.value === "" ? null : Number(e.target.value) })} /></div>
        <div className="flex gap-2">
          <button className="btn-primary flex-1 py-3" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} {edit.id ? "Save changes" : "Add ingredient"}</button>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Shell>
  );
}
