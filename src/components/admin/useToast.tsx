"use client";
import { useCallback, useState } from "react";
export function useToast() {
  const [t, setT] = useState<{ ok: boolean; msg: string } | null>(null);
  const show = useCallback((ok: boolean, msg: string) => { setT({ ok, msg }); setTimeout(() => setT(null), 3200); }, []);
  const node = t ? (
    <div role="status" className={`fixed bottom-5 left-1/2 z-[80] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold shadow-xl ${t.ok ? "bg-leaf text-white" : "bg-chilli text-white"}`}>{t.msg}</div>
  ) : null;
  return { show, node };
}
