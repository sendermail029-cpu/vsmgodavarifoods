import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container-x py-28 text-center">
      <p className="telugu text-xl text-gold">అయ్యో!</p>
      <h1 className="font-display text-5xl font-black text-maroon-700">Page not found</h1>
      <p className="mt-3 text-ink/70">This jar seems to be empty. Let&apos;s get you back to the good stuff.</p>
      <Link href="/shop" className="btn-primary mt-6">Go to shop</Link>
    </div>
  );
}
