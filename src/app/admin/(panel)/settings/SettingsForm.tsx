"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { saveSettings } from "@/app/admin/actions";
import { useToast } from "@/components/admin/useToast";

export function SettingsForm({ initial, phonepe, phonepeEnv }: { initial: Record<string, string>; phonepe: boolean; phonepeEnv: string }) {
  const [s, setS] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const f = (k: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, help?: string) => (
    <div>
      <label className="label" htmlFor={k}>{label}</label>
      <input id={k} className="input" value={s[k] ?? ""} onChange={(e) => setS({ ...s, [k]: e.target.value })} {...props} />
      {help && <p className="mt-1 text-xs text-ink/50">{help}</p>}
    </div>
  );
  const toggle = (k: string, label: string) => (
    <label className="flex items-center justify-between rounded-xl bg-cream/60 px-4 py-3 text-sm font-semibold">{label}
      <input type="checkbox" className="h-5 w-5 accent-maroon-700" checked={s[k] === "1"} onChange={(e) => setS({ ...s, [k]: e.target.checked ? "1" : "0" })} />
    </label>
  );
  return (
    <form className="grid gap-6 xl:grid-cols-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await saveSettings(s); toast.show(r.ok, r.ok ? "Settings saved" : r.error); router.refresh(); }); }}>
      {toast.node}
      <section className="card space-y-4 p-5 sm:p-6">
        <h2 className="font-display text-xl font-bold">Payments</h2>
        <div className="rounded-2xl bg-cream/60 p-4 text-sm">
          <p className="font-semibold">1 · UPI scan &amp; pay (0% fees, no merchant account needed)</p>
          <p className="mt-1 text-xs text-ink/60">Customers get a QR code + app buttons for the exact amount. Money goes straight to this UPI ID. They submit the UTR and you mark the order Paid after checking your bank app.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {f("upi_id", "Business UPI ID", { placeholder: "vsmfoods@okhdfcbank" })}
            {f("upi_payee_name", "Name on the bank account", {}, "For a personal UPI, use the exact bank-verified name (e.g. Mutyala Suresh Kumar)")}
          <div>
            <label className="label" htmlFor="upi_account_type">UPI account type</label>
            <select id="upi_account_type" className="input" value={s.upi_account_type ?? "personal"} onChange={(e) => setS({ ...s, upi_account_type: e.target.value })}>
              <option value="personal">Personal UPI (savings account / BHIM / phone number)</option>
              <option value="business">Business / merchant UPI (PhonePe Business, Paytm Business…)</option>
            </select>
            <p className="mt-1 text-xs text-ink/50">Personal: customers scan the QR or pay to your number (avoids UPI risk warnings). Business: one-tap “Pay with PhonePe / Google Pay” buttons.</p>
          </div>
          </div>
          <div className="mt-3">{toggle("enable_upi_qr", "Enable UPI scan & pay")}</div>
        </div>
        <div className="rounded-2xl bg-cream/60 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold">2 · PhonePe Business (automatic confirmation) {phonepe ? <CheckCircle2 className="h-4 w-4 text-leaf" /> : <XCircle className="h-4 w-4 text-ink/30" />}</p>
          <p className="mt-1 text-xs text-ink/60">{phonepe ? `Connected (${phonepeEnv}). Payments are verified with PhonePe's server automatically.` : "Not connected. Add PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX and PHONEPE_ENV in your hosting environment variables (keys are never stored in the database)."}</p>
        </div>
        <div className="rounded-2xl bg-cream/60 p-4 text-sm space-y-3">
          <p className="font-semibold">3 · Cash on Delivery</p>
          {toggle("enable_cod", "Enable Cash on Delivery")}
          {f("cod_fee", "COD handling fee (₹)", { inputMode: "numeric" })}
        </div>
      </section>
      <div className="space-y-6">
        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">Delivery charges</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {f("free_shipping_above", "Free above (₹)", { inputMode: "numeric" }, "0 = never free")}
            {f("shipping_per_kg", "Per kg (₹)", { inputMode: "numeric" })}
            {f("min_shipping", "Minimum (₹)", { inputMode: "numeric" })}
          </div>
          {f("packing_grams", "Jar + box weight per item (grams)", { inputMode: "numeric" }, "Added to the food weight for each jar, because the courier charges on the packed weight (e.g. 150)")}
          {f("dispatch_days", "Dispatch time (working days)", {}, "Shown in the shipping policy, e.g. 1–3")}
        </section>
        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">Contact, map & social</h2>
          {f("phone2", "Second mobile number", { inputMode: "tel" }, "Shown next to the main number on the website")}
          {f("maps_url", "Google Maps link", {}, "Share → Copy link from Google Maps")}
          {f("map_lat_lng", "Map location (latitude,longitude)", {}, "Used for the map on the Contact page, e.g. 16.7194,81.6750")}
          {f("facebook_url", "Facebook page link")}
        </section>
        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">Store details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {f("phone", "Phone (10 digits)", { inputMode: "tel" })}
            {f("whatsapp", "WhatsApp (with 91)", { inputMode: "tel" })}
          </div>
          {f("email", "Email", { type: "email" })}
          {f("address", "Address")}
          {f("announcement", "Top announcement bar", {}, "Leave empty to hide")}
          {f("fssai_license", "FSSAI licence / registration no.", {}, "Shown in Terms when filled")}
          {f("grievance_officer", "Grievance officer (name / team)")}
        </section>
        <button className="btn-primary w-full py-3.5 text-base" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />} Save settings</button>
      </div>
    </form>
  );
}
