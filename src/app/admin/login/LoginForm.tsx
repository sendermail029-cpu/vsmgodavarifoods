"use client";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: null });
  return (
    <form action={action} className="mt-6 space-y-4">
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required className="input" /></div>
      <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required className="input" /></div>
      {state.error && <p role="alert" className="rounded-xl bg-chilli/10 p-3 text-sm text-chilli">{state.error}</p>}
      <button className="btn-primary w-full py-3" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} Sign in</button>
    </form>
  );
}
