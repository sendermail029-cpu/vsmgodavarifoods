import { requireAdmin, MIN_PASSWORD } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import { ChangePasswordForm, LoginsManager } from "./AccountClient";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const me = await requireAdmin();
  const c = await db();
  const users = me.role === "owner"
    ? (await c.execute("SELECT id, name, email, role, active, last_login_at FROM admin_users ORDER BY active DESC, role = 'owner' DESC, name")).rows.map((r) => ({
        id: Number(r.id), name: String(r.name), email: String(r.email), role: String(r.role) as "owner" | "partner",
        active: Number(r.active) === 1, lastLogin: r.last_login_at ? String(r.last_login_at) : null,
      }))
    : [];
  return (
    <div>
      <PageHeader title="My account & logins" sub={`Signed in as ${me.name} · ${me.email} · ${me.role === "owner" ? "Owner" : "Partner"}`} />
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <ChangePasswordForm min={MIN_PASSWORD} />
        {me.role === "owner"
          ? <LoginsManager users={users} meId={me.id} min={MIN_PASSWORD} />
          : <section className="card p-6 text-sm text-ink/70"><h2 className="font-display text-xl font-bold text-ink">Logins</h2><p className="mt-2">Only the owner can add or remove logins. If you forget your password, ask the owner to set a new one for you.</p></section>}
      </div>
    </div>
  );
}
