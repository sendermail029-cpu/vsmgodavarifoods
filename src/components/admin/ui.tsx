export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-black text-maroon-700">{title}</h1>
        {sub && <p className="text-sm text-ink/60">{sub}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

const TONES: Record<string, string> = {
  placed: "bg-sky-100 text-sky-800", confirmed: "bg-indigo-100 text-indigo-800", packed: "bg-violet-100 text-violet-800",
  shipped: "bg-amber-100 text-amber-800", delivered: "bg-emerald-100 text-emerald-800", cancelled: "bg-zinc-200 text-zinc-700",
  pending: "bg-orange-100 text-orange-800", submitted: "bg-yellow-100 text-yellow-900", paid: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800", refunded: "bg-zinc-200 text-zinc-700", expired: "bg-zinc-200 text-zinc-600",
};
/** Plain-language payment labels for the shop owners. */
const LABELS: Record<string, string> = {
  pending: "Awaiting payment", submitted: "Customer says paid – check bank", expired: "Expired – not paid",
};
export function Badge({ v, label }: { v: string; label?: string }) {
  const text = label ?? LABELS[v];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${text ? "" : "capitalize"} ${v === "submitted" ? "animate-pulse" : ""} ${TONES[v] ?? "bg-zinc-100"}`}>{text ?? v}</span>;
}
