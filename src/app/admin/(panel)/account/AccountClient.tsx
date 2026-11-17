"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, KeyRound, Loader2, UserPlus } from "lucide-react";
import { addAdminUser, changeMyPassword, resetAdminPassword, setAdminActive, setAdminRole } from "@/app/admin/actions";
import { useToast } from "@/components/admin/useToast";

type R = { ok: boolean; message?: string; error?: string };

/** Password box with a show/hide eye — easier to type correctly on a phone. */
function PasswordInput({ value, onChange, auto, placeholder, id }: { value: string; onChange: (v: string) => void; auto: string; placeholder?: string; id?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? "text" : "password"} autoComplete={auto} className="input pr-11" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} required />
      <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink/50" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/** Suggest an easy-to-type but strong password, e.g. "Mango-Ariselu-4821". */
function suggest() {
  const words = ["Mango", "Gongura", "Avakaya", "Ariselu", "Kaja", "Laddu", "Godavari", "Velpuru", "Chekkalu", "Murukulu", "Pulihora", "Sunnundalu"];
  const r = new Uint32Array(3); crypto.getRandomValues(r);
  return `${words[r[0] % words.length]}-${words[r[1] % words.length]}-${1000 + (r[2] % 9000)}`;
}

export function ChangePasswordForm({ min }: { min: number }) {
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [pending, start] = useTransition();
  const toast = useToast();
  const submit = () => start(async () => {
    const r: R = await changeMyPassword(f);
    toast.show(r.ok, r.ok ? r.message ?? "Saved" : r.error ?? "Error");
    if (r.ok) setF({ current: "", next: "", confirm: "" });
  });
  return (
    <form className="card space-y-4 p-6 xl:self-start" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      {toast.node}
      <h2 className="flex items-center gap-2 font-display text-xl font-bold"><KeyRound className="h-5 w-5 text-maroon-700" /> Change my password</h2>
      <div><label className="label" htmlFor="cur">Current password</label><PasswordInput id="cur" auto="current-password" value={f.current} onChange={(v) => setF({ ...f, current: v })} /></div>
      <div><label className="label" htmlFor="new">New password</label><PasswordInput id="new" auto="new-password" value={f.next} onChange={(v) => setF({ ...f, next: v })} placeholder={`At least ${min} characters`} /></div>
      <div><label className="label" htmlFor="conf">New password again</label><PasswordInput id="conf" auto="new-password" value={f.confirm} onChange={(v) => setF({ ...f, confirm: v })} /></div>
      <p className="text-xs text-ink/55">Tip: 3 words + a number is strong and easy to remember, e.g. <b>Velpuru-Avakaya-2026</b>. After changing, any other phone or computer using your login is signed out.</p>
      <button className="btn-primary w-full py-3" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} Change password</button>
    </form>
  );
}

type U = { id: number; name: string; email: string; role: "owner" | "partner"; active: boolean; lastLogin: string | null };
const when = (s: string | null) => (s ? new Date(s.replace(" ", "T") + "Z").toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) : "never");

export function LoginsManager({ users, meId, min }: { users: U[]; meId: number; min: number }) {
  const [n, setN] = useState({ name: "", email: "", password: "", role: "partner" });
  const [resetFor, setResetFor] = useState<U | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const run = (fn: () => Promise<R>, after?: () => void, ask?: string) => start(async () => {
    if (ask && !confirm(ask)) return;
    const r = await fn();
    toast.show(r.ok, r.ok ? r.message ?? "Done" : r.error ?? "Error");
    if (r.ok) { after?.(); router.refresh(); }
  });
  return (
    <section className="card min-w-0 p-6">
      {toast.node}
      <h2 className="font-display text-xl font-bold">Logins for the partners</h2>
      <p className="mt-1 text-sm text-ink/60">Give each partner their own login — then nobody has to share one password, and you can switch off a login any time. <b>Owners</b> can manage logins; <b>partners</b> can use everything else.</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-cream text-left text-xs uppercase text-ink/50"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Last sign-in</th><th className="px-3 py-2 text-right">Actions</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={`border-t border-maroon-700/5 ${u.active ? "" : "opacity-50"}`}>
                <td className="px-3 py-2.5"><p className="font-semibold">{u.name}{u.id === meId && <span className="ml-1 text-xs text-ink/40">(you)</span>}</p><p className="text-xs text-ink/50">{u.email}</p></td>
                <td className="px-3 py-2.5">
                  <select className="input w-auto py-1 text-xs" value={u.role} disabled={pending || u.id === meId} onChange={(e) => run(() => setAdminRole(u.id, e.target.value as "owner" | "partner"))}>
                    <option value="partner">Partner</option><option value="owner">Owner</option>
                  </select>
                </td>
                <td className="px-3 py-2.5 text-xs text-ink/60">{u.active ? when(u.lastLogin) : "switched off"}</td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {u.id !== meId && <button className="rounded-lg px-2.5 py-1 text-xs font-semibold text-maroon-700 ring-1 ring-maroon-700/20 hover:bg-cream" disabled={pending} onClick={() => { setResetFor(u); setResetPw(suggest()); }}>New password</button>}
                    {u.id !== meId && (u.active
                      ? <button className="rounded-lg px-2.5 py-1 text-xs font-semibold text-chilli ring-1 ring-chilli/30 hover:bg-chilli/5" disabled={pending} onClick={() => run(() => setAdminActive(u.id, false), undefined, `Switch off ${u.name}'s login? They are signed out immediately.`)}>Switch off</button>
                      : <button className="rounded-lg px-2.5 py-1 text-xs font-semibold text-leaf ring-1 ring-leaf/30 hover:bg-leaf/5" disabled={pending} onClick={() => run(() => setAdminActive(u.id, true))}>Switch on</button>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resetFor && (
        <form className="mt-4 rounded-2xl bg-cream/70 p-4" onSubmit={(e) => { e.preventDefault(); run(() => resetAdminPassword(resetFor.id, resetPw), () => setResetFor(null)); }}>
          <p className="text-sm font-semibold">New password for {resetFor.name}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <div className="min-w-56 flex-1"><PasswordInput auto="new-password" value={resetPw} onChange={setResetPw} /></div>
            <button type="button" className="btn-ghost bg-white" onClick={() => setResetPw(suggest())}>Suggest</button>
            <button className="btn-primary" disabled={pending}>Set password</button>
            <button type="button" className="btn-ghost" onClick={() => setResetFor(null)}>Cancel</button>
          </div>
          <p className="mt-2 text-xs text-ink/55">Tell them the new password in person or by phone call, and ask them to change it from this page.</p>
        </form>
      )}

      <form className="mt-6 space-y-3 rounded-2xl p-4 ring-1 ring-gold/40" onSubmit={(e) => { e.preventDefault(); run(() => addAdminUser(n), () => setN({ name: "", email: "", password: "", role: "partner" })); }}>
        <p className="flex items-center gap-2 font-semibold"><UserPlus className="h-4 w-4 text-maroon-700" /> Add a login</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Name</label><input className="input" value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} placeholder="e.g. Suresh" required maxLength={40} /></div>
          <div><label className="label">Email (used to sign in)</label><input type="email" className="input" value={n.email} onChange={(e) => setN({ ...n, email: e.target.value })} placeholder="name@gmail.com" required /></div>
          <div><label className="label">First password</label>
            <div className="flex gap-2"><div className="flex-1"><PasswordInput auto="new-password" value={n.password} onChange={(v) => setN({ ...n, password: v })} placeholder={`At least ${min} characters`} /></div>
              <button type="button" className="btn-ghost bg-white" onClick={() => setN({ ...n, password: suggest() })}>Suggest</button></div></div>
          <div><label className="label">Role</label>
            <select className="input" value={n.role} onChange={(e) => setN({ ...n, role: e.target.value })}><option value="partner">Partner — everything except logins</option><option value="owner">Owner — can also manage logins</option></select></div>
        </div>
        <button className="btn-primary" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} Create login</button>
      </form>
    </section>
  );
}
