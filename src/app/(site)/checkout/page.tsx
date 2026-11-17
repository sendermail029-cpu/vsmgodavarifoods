import type { Metadata } from "next";
import { CheckoutForm } from "./CheckoutForm";
import { paymentOptions, getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [opts, s] = await Promise.all([paymentOptions(), getSettings()]);
  return (
    <div className="container-x py-10">
      <h1 className="font-display text-4xl font-black text-maroon-700">Checkout</h1>
      <p className="mt-1 text-sm text-ink/60">Secure checkout · Your details are only used to deliver your order.</p>
      <CheckoutForm options={opts} whatsapp={s.whatsapp} />
    </div>
  );
}
