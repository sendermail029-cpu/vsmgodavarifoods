"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { paymentNotReceivedAction, reviveOrderAction, updateOrder } from "@/app/admin/actions";
import { useToast } from "@/components/admin/useToast";

export function OrderControls({ id, status, payment, tracking, cod = false }: { id: number; status: string; payment: string; tracking: string; cod?: boolean }) {
  const [s, setS] = useState(status);
  const [p, setP] = useState(payment);
  const [t, setT] = useState(tracking);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  // until the payment is received, an online order can only be "placed" or "cancelled"
  const needsPayment = !cod && p !== "paid";
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, ask?: string) => start(async () => {
    if (ask && !confirm(ask)) return;
    const r = await fn();
    toast.show(r.ok, r.ok ? r.message ?? "Done" : r.error ?? "Error");
    router.refresh();
  });
  // the order was closed for non-payment (expired / customer claimed after expiry) — it can be brought back
  const closedUnpaid = status === "cancelled" && (payment === "expired" || payment === "submitted");
  const save = (patch?: { status?: string; payment_status?: string }) => start(async () => {
    if ((patch?.status ?? s) === "cancelled" && status !== "cancelled" && !confirm("Cancel this order? Reserved stock will be returned to inventory.")) return;
    const r = await updateOrder(id, { status: patch?.status ?? s, payment_status: patch?.payment_status ?? p, tracking: t });
    toast.show(r.ok, r.ok ? "Order updated" : r.error);
    router.refresh();
  });
  return (
    <section className="card space-y-4 p-5">
      {toast.node}
      <h2 className="font-display text-xl font-bold">Update order</h2>
      {payment === "submitted" && (
        <div className="rounded-2xl bg-yellow-50 p-4 ring-1 ring-yellow-200">
          <p className="text-sm font-semibold text-yellow-900">The customer says they paid. Check your bank / PhonePe app first.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button className="btn bg-leaf py-3 text-white hover:opacity-90" disabled={pending}
              onClick={() => closedUnpaid ? run(() => reviveOrderAction(id)) : (setP("paid"), setS("confirmed"), save({ payment_status: "paid", status: status === "placed" ? "confirmed" : s }))}>
              ✓ Money received
            </button>
            <button className="btn bg-white py-3 text-chilli ring-1 ring-chilli/40 hover:bg-chilli/5" disabled={pending}
              onClick={() => run(() => paymentNotReceivedAction(id), "Money NOT received? The order moves to the Expired list and its stock is released. You can still restore it later if the money arrives.")}>
              ✗ Not received
            </button>
          </div>
        </div>
      )}
      {payment === "expired" && (
        <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
          <p className="text-sm text-ink/70">Payment wasn&apos;t received in time, so the stock was released. If you find this money in your bank, restore the order — it will be marked <b>Paid</b> and <b>Confirmed</b> and the stock reserved again.</p>
          <button className="btn mt-3 w-full bg-leaf py-3 text-white hover:opacity-90" disabled={pending} onClick={() => run(() => reviveOrderAction(id))}>
            ✓ Money received — restore order
          </button>
        </div>
      )}
      {(payment === "pending" || payment === "failed") && status !== "cancelled" && (
        <button className="btn w-full bg-leaf py-3 text-white hover:opacity-90" disabled={pending} onClick={() => { setP("paid"); setS(status === "placed" ? "confirmed" : s); save({ payment_status: "paid", status: status === "placed" ? "confirmed" : s }); }}>
          ✓ Payment received — mark Paid & Confirm
        </button>
      )}
      {!closedUnpaid && <>
      <div><label className="label">Order status</label>
        <select className="input" value={s} onChange={(e) => setS(e.target.value)} disabled={status === "cancelled"}>
          {["placed", "confirmed", "packed", "shipped", "delivered", "cancelled"].map((x) => <option key={x} value={x} disabled={needsPayment && !["placed", "cancelled"].includes(x)}>{x}{needsPayment && !["placed", "cancelled"].includes(x) ? " (after payment)" : ""}</option>)}
        </select>
        {needsPayment && <p className="mt-1 text-xs text-ink/55">Confirm, pack and ship become available once the payment is marked received.</p>}
      </div>
      <div><label className="label">Payment status</label>
        <select className="input" value={p} onChange={(e) => { setP(e.target.value); if (!cod && e.target.value !== "paid" && !["placed", "cancelled"].includes(s)) setS("placed"); }}>
          {["pending", "submitted", "paid", "failed", "refunded", "expired"].map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </div>
      <div><label className="label">Courier & tracking no. (shown to customer)</label><input className="input" value={t} onChange={(e) => setT(e.target.value)} placeholder="DTDC · D12345678" /></div>
      <button className="btn-primary w-full" disabled={pending} onClick={() => save()}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} Save changes</button>
      </>}
    </section>
  );
}
