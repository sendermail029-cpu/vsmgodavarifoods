import Link from "next/link";

export const POLICY_DATE = "6 November 2026";

export function PolicyPage({ title, telugu, children }: { title: string; telugu?: string; children: React.ReactNode }) {
  const links = [
    ["/privacy-policy", "Privacy Policy"], ["/terms-and-conditions", "Terms & Conditions"],
    ["/shipping-policy", "Shipping & Delivery"], ["/refund-policy", "Cancellation & Refunds"],
  ];
  return (
    <div className="container-x grid gap-10 py-12 lg:grid-cols-[240px_1fr]">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <nav className="card flex gap-1 overflow-x-auto p-2 lg:flex-col" aria-label="Policies">
          {links.map(([h, l]) => <Link key={h} href={h} className="shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold hover:bg-cream">{l}</Link>)}
        </nav>
      </aside>
      <article className="prose-policy max-w-3xl">
        {telugu && <p className="telugu text-gold">{telugu}</p>}
        <h1 className="font-display text-4xl font-black text-maroon-700 sm:text-5xl">{title}</h1>
        <p className="mt-2 text-sm text-ink/60">Last updated: {POLICY_DATE}</p>
        {children}
      </article>
    </div>
  );
}
