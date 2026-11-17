import { redirect } from "next/navigation";
import { getAdmin, hasOwner } from "@/lib/auth";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  const firstTime = !(await hasOwner());
  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <div className="card w-full max-w-sm p-8">
        <Logo className="mx-auto h-20 w-auto" />
        <h1 className="mt-6 text-center font-display text-2xl font-bold">Admin sign in</h1>
        <LoginForm />
        {firstTime && process.env.NODE_ENV !== "production" && !process.env.ADMIN_PASSWORD_HASH && (
          <p className="mt-4 rounded-xl bg-turmeric/20 p-3 text-xs text-ink/70">First sign-in on this computer: admin@vsmgodavarifoods.in / admin123 — then change it in <b>My account &amp; logins</b>.</p>
        )}
        <details className="mt-4 text-xs text-ink/55">
          <summary className="cursor-pointer">Forgot your password?</summary>
          <p className="mt-2">Partners: ask the owner — they can set a new password for you in <b>My account &amp; logins</b>.</p>
          <p className="mt-1">Owner: ask your website developer to switch on <b>recovery mode</b>.</p>
        </details>
      </div>
    </div>
  );
}
