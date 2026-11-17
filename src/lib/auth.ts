import "server-only";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual, createHash, randomBytes } from "node:crypto";
import { db } from "./db";

/*
 * Admin logins live in the database (table admin_users, bcrypt-hashed passwords), so the owner can
 * change passwords and add a login for each partner from Admin → My account & logins — no redeploy needed.
 *
 * ADMIN_EMAIL + ADMIN_PASSWORD_HASH (hosting environment variables) are used only:
 *   1. for the very first sign-in, which creates the Owner login, and
 *   2. for emergency recovery when ADMIN_RECOVERY=1 is set (forgotten owner password).
 */

const COOKIE = "vsm_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
export const MIN_PASSWORD = 10;

export type AdminUser = { id: number; name: string; email: string; role: "owner" | "partner" };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set (32+ random characters).");
    return new TextEncoder().encode("dev-only-insecure-secret-change-me-please-0123456789");
  }
  return new TextEncoder().encode(s);
}

const sha = (s: string) => createHash("sha256").update(s).digest();
const newVersion = () => randomBytes(9).toString("base64url");
const toUser = (r: Record<string, unknown>): AdminUser => ({ id: Number(r.id), name: String(r.name), email: String(r.email), role: r.role === "owner" ? "owner" : "partner" });
// used so a wrong email takes as long as a wrong password (no hints about which emails exist)
const DUMMY_HASH = "$2b$12$G9layWIQr71u/YkxVdyOTem4hJ6r/8B4.N17o0aTrcOKLUdBSYwW2";

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);

/** The login from the hosting environment variables (first setup / recovery only). */
async function envLoginOk(email: string, password: string) {
  const envEmail = (process.env.ADMIN_EMAIL || "admin@vsmgodavarifoods.in").toLowerCase();
  if (!timingSafeEqual(sha(email), sha(envEmail))) return false;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) return bcrypt.compare(password, hash);
  // local development only: admin123 until a real login exists
  return process.env.NODE_ENV !== "production" && timingSafeEqual(sha(password), sha(process.env.ADMIN_PASSWORD || "admin123"));
}

export async function hasOwner() {
  const c = await db();
  const { rows } = await c.execute("SELECT COUNT(*) AS n FROM admin_users WHERE role = 'owner' AND active = 1");
  return Number(rows[0].n) > 0;
}

async function checkCredentials(rawEmail: string, password: string): Promise<AdminUser | null> {
  const email = rawEmail.trim().toLowerCase();
  const c = await db();
  const { rows } = await c.execute({ sql: "SELECT * FROM admin_users WHERE email = ? AND active = 1", args: [email] });
  const u = rows[0] as Record<string, unknown> | undefined;
  const ok = await bcrypt.compare(password, u ? String(u.password_hash) : DUMMY_HASH);
  if (u && ok) {
    await c.execute({ sql: "UPDATE admin_users SET last_login_at = datetime('now') WHERE id = ?", args: [Number(u.id)] });
    return toUser(u);
  }
  // first sign-in (no owner yet) or emergency recovery → (re)create the Owner login from the environment variables
  if ((!(await hasOwner()) || process.env.ADMIN_RECOVERY === "1") && (await envLoginOk(email, password))) {
    const hash = process.env.ADMIN_PASSWORD_HASH || (await hashPassword(password));
    await c.execute({
      sql: `INSERT INTO admin_users(name, email, password_hash, role, active, pw_version, last_login_at)
            VALUES ('Owner', ?, ?, 'owner', 1, ?, datetime('now'))
            ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, role = 'owner', active = 1,
              pw_version = excluded.pw_version, last_login_at = excluded.last_login_at, updated_at = datetime('now')`,
      args: [email, hash, newVersion()],
    });
    const r = await c.execute({ sql: "SELECT * FROM admin_users WHERE email = ?", args: [email] });
    return toUser(r.rows[0] as Record<string, unknown>);
  }
  return null;
}

async function clientIp() {
  const h = await headers();
  // Vercel puts the visitor's real IP in x-real-ip / x-vercel-forwarded-for
  return (h.get("x-real-ip") || h.get("x-vercel-forwarded-for")?.split(",")[0] || h.get("x-forwarded-for")?.split(",")[0] || "local").trim();
}

/** Signs the session cookie. The password version is inside, so changing a password signs out old sessions. */
export async function startSession(userId: number) {
  const c = await db();
  const { rows } = await c.execute({ sql: "SELECT pw_version FROM admin_users WHERE id = ?", args: [userId] });
  const token = await new SignJWT({ role: "admin", pv: String(rows[0]?.pw_version ?? "") })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: MAX_AGE,
  });
}

/** Returns error message, or null on success. Brute-force protected (5 tries / 15 min per IP). */
export async function login(email: string, password: string): Promise<string | null> {
  const c = await db();
  const ip = await clientIp();
  const now = Date.now();
  const { rows } = await c.execute({ sql: "SELECT count, first_at FROM login_attempts WHERE ip = ?", args: [ip] });
  const rec = rows[0] ? { count: Number(rows[0].count), first: Number(rows[0].first_at) } : null;
  if (rec && now - rec.first < WINDOW_MS && rec.count >= MAX_ATTEMPTS) {
    return "Too many attempts. Please wait 15 minutes and try again.";
  }
  const user = await checkCredentials(email, password);
  if (!user) {
    if (!rec || now - rec.first >= WINDOW_MS) {
      await c.execute({ sql: "INSERT OR REPLACE INTO login_attempts(ip, count, first_at) VALUES (?, 1, ?)", args: [ip, now] });
    } else {
      await c.execute({ sql: "UPDATE login_attempts SET count = count + 1 WHERE ip = ?", args: [ip] });
    }
    await new Promise((r) => setTimeout(r, 600));
    return "Invalid email or password.";
  }
  await c.execute({ sql: "DELETE FROM login_attempts WHERE ip = ?", args: [ip] });
  await startSession(user.id);
  return null;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}

/** The signed-in admin, or null. Also checks the login is still active and its password hasn't changed since. */
export async function getAdmin(): Promise<AdminUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.role !== "admin") return null;
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    const c = await db();
    const { rows } = await c.execute({ sql: "SELECT * FROM admin_users WHERE id = ? AND active = 1", args: [id] });
    const u = rows[0] as Record<string, unknown> | undefined;
    if (!u || String(u.pw_version) !== String(payload.pv ?? "")) return null;
    return toUser(u);
  } catch {
    return null;
  }
}

/** Use at the top of every admin page AND every admin server action. */
export async function requireAdmin() {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  return a;
}

/** Only the owner can manage other logins. */
export async function requireOwner() {
  const a = await requireAdmin();
  if (a.role !== "owner") throw new Error("Only the owner can do this.");
  return a;
}

export { newVersion as newPasswordVersion };
