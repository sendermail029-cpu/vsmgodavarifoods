"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDownLeft, ArrowUpRight, Download, Loader2, Pencil, Plus, Receipt, Trash2, TrendingDown, TrendingUp, UserPlus, X } from "lucide-react";
import { addMoneyEntry, deleteInvestor, deleteMoneyEntry, saveInvestor } from "@/app/admin/actions";
import { useToast } from "@/components/admin/useToast";
import type { InvestorBook, Member, MoneyEntry } from "@/lib/investors";

const rs = (paise: number) => `${paise < 0 ? "-" : ""}₹${(Math.abs(paise) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const day = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" });
const month = (m: string) => new Date(m + "-01T00:00:00Z").toLocaleDateString("en-IN", { timeZone: "UTC", month: "long", year: "numeric" });

type Kind = MoneyEntry["kind"];
type EntryForm = { kind: Kind; investorId?: number };
type MemberForm = { id?: number; name: string; phone: string; note: string };

const KIND: Record<Kind, { label: string; cls: string; sign: string }> = {
  invest: { label: "Money in", cls: "bg-emerald-100 text-emerald-800", sign: "+" },
  withdraw: { label: "Taken out", cls: "bg-orange-100 text-orange-800", sign: "-" },
  expense: { label: "Expense", cls: "bg-red-100 text-red-800", sign: "-" },
};

export function InvestorManager({ book, categories, today }: { book: InvestorBook; categories: string[]; today: string }) {
  const { members, entries, months, totals, byCategory } = book;
  const [entry, setEntry] = useState<EntryForm | null>(null);
  const [member, setMember] = useState<MemberForm | null>(null);
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const profit = totals.profit >= 0;
  const shown = filter === "all" ? entries : entries.filter((e) => e.kind === filter);
  const maxCat = Math.max(1, ...byCategory.map((c) => c.amount));

  /** money in / out needs a member — open "Add member" first */
  const needMember = () => { toast.show(false, "Add a member first, then record their money."); setMember({ name: "", phone: "", note: "" }); };

  const run = (p:Promise<{ ok: boolean; message?: string; error?: string }>, done?: () => void) => start(async () => {
    const r = await p;
    toast.show(r.ok, r.ok ? r.message ?? "Saved" : r.error ?? "Could not save");
    if (r.ok) { done?.(); router.refresh(); }
  });

  return (
    <div>
      {toast.node}

      {/* profit / loss hero */}
      <div className="relative overflow-hidden rounded-3xl p-6 shadow-lg sm:p-8" style={{ background: profit ? "linear-gradient(120deg, #1f4a27 0%, #2f6b3a 55%, #3d8049 100%)" : "linear-gradient(120deg, #3d0d0d 0%, #5e1515 50%, #7a1c1c 100%)", color: "#fdf8ee" }}>
        {/* soft decorative circles */}
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full" style={{ background: "rgba(233,207,138,0.14)" }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 right-40 h-48 w-48 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.14)", color: "#e9cf8a" }}>
              {profit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />} {profit ? "Profit so far" : "Loss so far"}
            </p>
            <p className="mt-3 font-display text-5xl font-black sm:text-6xl">{rs(Math.abs(totals.profit))}</p>
            <p className="mt-2 text-sm" style={{ color: "rgba(253,248,238,0.8)" }}>Sales <b>{rs(totals.sales)}</b> − money used <b>{rs(totals.used)}</b></p>
          </div>
          <div className="w-full rounded-2xl px-5 py-4 sm:w-auto" style={{ background: "rgba(255,255,255,0.12)", boxShadow: "inset 0 0 0 1px rgba(233,207,138,0.35)" }}>
            <p className="text-xs font-semibold" style={{ color: "rgba(253,248,238,0.8)" }}>Cash the business should have now</p>
            <p className="mt-1 font-display text-3xl font-black">{rs(totals.cash)}</p>
            <p className="text-[11px]" style={{ color: "rgba(253,248,238,0.65)" }}>invested − taken out + sales − used</p>
          </div>
        </div>
      </div>

      {/* summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { t: "Total invested", v: rs(totals.invested), sub: `by ${members.length} ${members.length === 1 ? "member" : "members"}` },
          { t: "Taken out by members", v: rs(totals.withdrawn), sub: "withdrawals / profit paid out" },
          { t: "Money used", v: rs(totals.used), sub: `expenses ${rs(totals.expenses)} + ingredients ${rs(totals.ingredients)}`, red: true },
          { t: "Sales income", v: rs(totals.sales), sub: "paid orders (and delivered COD)" },
        ].map((s) => (
          <div key={s.t} className="card p-5">
            <p className="text-sm font-semibold text-ink/60">{s.t}</p>
            <p className={`mt-1 font-display text-3xl font-black ${s.red ? "text-chilli" : "text-maroon-700"}`}>{s.v}</p>
            <p className="text-xs text-ink/50">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* actions */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button className="btn-primary" onClick={() => members.length ? setEntry({ kind: "invest" }) : needMember()}><ArrowDownLeft className="h-4 w-4" /> Add money in</button>
        <button className="btn-ghost bg-white" onClick={() => members.length ? setEntry({ kind: "withdraw" }) : needMember()}><ArrowUpRight className="h-4 w-4" /> Member takes money out</button>
        <button className="btn-ghost bg-white" onClick={() => setEntry({ kind: "expense" })}><Receipt className="h-4 w-4" /> Add expense</button>
        <a href="/api/admin/investors" className="btn-ghost ml-auto bg-white"><Download className="h-4 w-4" /> Download PDF</a>
        <button className="btn-ghost bg-white" onClick={() => setMember({ name: "", phone: "", note: "" })}><UserPlus className="h-4 w-4" /> Add member</button>
      </div>

      {/* members */}
      <section className="mt-6">
        <h2 className="font-display text-xl font-bold">Members</h2>
        {!members.length && <p className="card mt-3 p-6 text-center text-ink/55">No members yet. Click <b>Add member</b> to add each person in the group, then use <b>Add money in</b> to record what they invested.</p>}
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((m) => <MemberCard key={m.id} m={m} pending={pending}
            onAdd={() => setEntry({ kind: "invest", investorId: m.id })}
            onTake={() => setEntry({ kind: "withdraw", investorId: m.id })}
            onEdit={() => setMember({ id: m.id, name: m.name, phone: m.phone, note: m.note })}
            onDelete={() => { if (confirm(`Remove member "${m.name}"?`)) run(deleteInvestor(m.id)); }} />)}
        </div>
        {members.length > 0 && <p className="mt-2 text-xs text-ink/50">Profit or loss is shared in proportion to how much each member invested. &quot;Current value&quot; = invested − taken out + their share of profit (or loss).</p>}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* where money went */}
        <section className="card p-5">
          <h2 className="font-display text-xl font-bold">Where the money went</h2>
          <ul className="mt-4 space-y-3">
            {byCategory.map((c) => (
              <li key={c.category}>
                <div className="flex justify-between text-sm"><span>{c.category}</span><b>{rs(c.amount)}</b></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-cream-dark"><div className="h-full rounded-full bg-chilli/80" style={{ width: `${(c.amount / maxCat) * 100}%` }} /></div>
              </li>
            ))}
            {!byCategory.length && <li className="py-6 text-center text-sm text-ink/50">No expenses recorded yet.</li>}
          </ul>
          <p className="mt-4 text-xs text-ink/50">Ingredient purchases entered on the <b>Ingredients stock</b> page (with a cost) are counted here automatically, so don&apos;t add them again as expenses.</p>
        </section>

        {/* month by month */}
        <section className="card overflow-hidden p-5">
          <h2 className="font-display text-xl font-bold">Month by month</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead><tr className="text-left text-xs text-ink/50"><th className="py-2">Month</th><th className="text-right">Invested</th><th className="text-right">Used</th><th className="text-right">Sales</th><th className="text-right">Profit / loss</th></tr></thead>
              <tbody className="divide-y divide-maroon-700/5">
                {months.map((m) => (
                  <tr key={m.month}>
                    <td className="py-2 font-semibold">{month(m.month)}</td>
                    <td className="text-right">{m.invested ? rs(m.invested) : "—"}</td>
                    <td className="text-right">{m.expenses + m.ingredients ? rs(m.expenses + m.ingredients) : "—"}</td>
                    <td className="text-right">{m.sales ? rs(m.sales) : "—"}</td>
                    <td className={`text-right font-bold ${m.profit >= 0 ? "text-leaf" : "text-chilli"}`}>{rs(m.profit)}</td>
                  </tr>
                ))}
                {!months.length && <tr><td colSpan={5} className="py-6 text-center text-ink/50">Nothing yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* all entries */}
      <section className="card mt-8 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-display text-xl font-bold">All entries</h2>
          {(["all", "invest", "withdraw", "expense"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${filter === f ? "bg-maroon-700 text-cream ring-maroon-700" : "bg-white ring-gold/40 hover:bg-gold-pale"}`}>
              {f === "all" ? `All (${entries.length})` : KIND[f].label}
            </button>
          ))}
          <a href="/api/admin/investors" title="Download as PDF" className="inline-flex items-center gap-1.5 rounded-full bg-maroon-700 px-3 py-1.5 text-xs font-semibold text-cream ring-1 ring-maroon-700 transition hover:bg-maroon-800"><Download className="h-3.5 w-3.5" /> PDF</a>
        </div>
        <ul className="mt-3 divide-y divide-maroon-700/5 text-sm">
          {shown.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span className="min-w-0">
                <span className={`mr-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${KIND[e.kind].cls}`}>{KIND[e.kind].label}</span>
                <b>{e.kind === "expense" ? e.category : e.investor}</b>
                {e.note && <span className="text-ink/55"> — {e.note}</span>}
                {e.by && <span className="ml-2 text-[11px] text-ink/45">entered by {e.by}</span>}
              </span>
              <span className="flex items-center gap-3">
                <b className={e.kind === "invest" ? "text-leaf" : "text-chilli"}>{KIND[e.kind].sign}{rs(e.amount)}</b>
                <span className="text-xs text-ink/45">{day(e.date)}</span>
                <button className="rounded-lg p-1.5 text-chilli hover:bg-cream" title="Delete entry" disabled={pending} onClick={() => { if (confirm(`Delete this entry of ${rs(e.amount)}?`)) run(deleteMoneyEntry(e.id)); }}><Trash2 className="h-4 w-4" /></button>
              </span>
            </li>
          ))}
          {!shown.length && <li className="py-6 text-center text-ink/50">No entries yet.</li>}
        </ul>
      </section>

      <AnimatePresence>
        {entry && <EntryDialog form={entry} members={members} categories={categories} today={today} pending={pending} onClose={() => setEntry(null)}
          onSave={(d) => run(addMoneyEntry(d), () => setEntry(null))} />}
        {member && <MemberDialog form={member} setForm={setMember} pending={pending} onClose={() => setMember(null)}
          onSave={() => run(saveInvestor(member), () => setMember(null))} />}
      </AnimatePresence>
    </div>
  );
}

function MemberCard({ m, pending, onAdd, onTake, onEdit, onDelete }: { m: Member; pending: boolean; onAdd: () => void; onTake: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{m.name}</h3>
          {(m.phone || m.note) && <p className="truncate text-xs text-ink/50">{[m.phone, m.note].filter(Boolean).join(" · ")}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-gold-pale px-2.5 py-0.5 text-xs font-bold text-maroon-800">{m.sharePct.toFixed(1)}% share</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream-dark"><div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, m.sharePct)}%` }} /></div>
      <dl className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-cream/60 p-3 text-xs">
        <div><dt className="text-ink/50">Invested</dt><dd className="mt-0.5 text-base font-bold">{rs(m.invested)}</dd></div>
        <div><dt className="text-ink/50">Taken out</dt><dd className="mt-0.5 text-base font-bold">{rs(m.withdrawn)}</dd></div>
        <div><dt className="text-ink/50">{m.profitShare >= 0 ? "Share of profit" : "Share of loss"}</dt><dd className={`mt-0.5 text-base font-bold ${m.profitShare >= 0 ? "text-leaf" : "text-chilli"}`}>{rs(m.profitShare)}</dd></div>
        <div><dt className="text-ink/50">Current value</dt><dd className="mt-0.5 text-base font-bold text-maroon-700">{rs(m.balance)}</dd></div>
      </dl>
      <div className="mt-4 flex items-center gap-1 border-t border-maroon-700/10 pt-3">
        <button className="btn-primary min-w-0 flex-1 px-2 py-2 text-xs" onClick={onAdd}><Plus className="h-3.5 w-3.5" /> Money in</button>
        <button className="btn-ghost min-w-0 flex-1 px-2 py-2 text-xs" onClick={onTake}><ArrowUpRight className="h-3.5 w-3.5" /> Take out</button>
        <button className="shrink-0 rounded-lg p-1.5 hover:bg-cream" title="Edit member" onClick={onEdit}><Pencil className="h-4 w-4" /></button>
        <button className="shrink-0 rounded-lg p-1.5 text-chilli hover:bg-cream" title="Remove member" disabled={pending} onClick={onDelete}><Trash2 className="h-4 w-4" /></button>
      </div>
    </article>
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

type EntryData = { kind: Kind; amount: number; investor_id: number | null; category: string; note: string; date: string };

function EntryDialog({ form, members, categories, today, pending, onClose, onSave }: { form: EntryForm; members: Member[]; categories: string[]; today: string; pending: boolean; onClose: () => void; onSave: (d: EntryData) => void }) {
  const [kind, setKind] = useState<Kind>(form.kind);
  const [who, setWho] = useState(String(form.investorId ?? members[0]?.id ?? ""));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);
  const title = kind === "invest" ? "Add money in" : kind === "withdraw" ? "Member takes money out" : "Add expense";
  return (
    <Shell title={title} onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave({ kind, amount: Number(amount), investor_id: kind === "expense" ? null : Number(who) || null, category, note, date }); }}>
        <div className="grid grid-cols-3 overflow-hidden rounded-xl ring-1 ring-maroon-700/20" role="radiogroup" aria-label="Type">
          {(["invest", "withdraw", "expense"] as const).map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} disabled={k !== "expense" && !members.length} onClick={() => setKind(k)}
              className={`px-2 py-2 text-xs font-semibold transition disabled:opacity-40 ${kind === k ? "bg-maroon-700 text-cream" : "bg-white hover:bg-cream"}`}>{KIND[k].label}</button>
          ))}
        </div>
        {kind !== "expense" ? (
          <div><label className="label">Member</label>
            <select className="input" required value={who} onChange={(e) => setWho(e.target.value)}>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          </div>
        ) : (
          <div><label className="label">What was it for?</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Amount (₹)</label><input className="input text-lg font-semibold" type="number" min="1" step="any" required autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50000" /></div>
          <div><label className="label">Date</label><input className="input" type="date" required max={today} value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <div><label className="label">Note (optional)</label><input className="input" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder={kind === "expense" ? "Shop name, bill no…" : kind === "invest" ? "e.g. UPI to business account" : "e.g. profit share for October"} /></div>
        <div className="flex gap-2">
          <button className="btn-primary flex-1 py-3" disabled={pending || !amount}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Shell>
  );
}

function MemberDialog({ form, setForm, pending, onClose, onSave }: { form: MemberForm; setForm: (f: MemberForm) => void; pending: boolean; onClose: () => void; onSave: () => void }) {
  return (
    <Shell title={form.id ? `Edit — ${form.name}` : "Add member"} onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
        <div><label className="label">Name</label><input className="input" required minLength={2} autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Member name" /></div>
        <div><label className="label">Phone (optional)</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} /></div>
        <div><label className="label">Note (optional)</label><input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={200} placeholder="e.g. Founder, handles purchases" /></div>
        <div className="flex gap-2">
          <button className="btn-primary flex-1 py-3" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} {form.id ? "Save changes" : "Add member"}</button>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Shell>
  );
}
