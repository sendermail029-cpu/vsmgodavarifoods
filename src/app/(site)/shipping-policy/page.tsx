import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy/PolicyPage";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy",
  description: "All-India delivery of pickles, sweets and snacks from VSM Godavari Foods — charges, timelines and packing.",
  alternates: { canonical: "/shipping-policy" },
};
export const revalidate = 3600;

export default async function Shipping() {
  const s = await getSettings();
  const free = Number(s.free_shipping_above);
  return (
    <PolicyPage title="Shipping & Delivery Policy" telugu="డెలివరీ వివరాలు">
      <h2>Where we deliver</h2>
      <p>We deliver across India through trusted courier partners and India Post. Local orders in and around Tanuku can also be picked up or delivered directly — just ask us on WhatsApp.</p>

      <h2>Delivery charges</h2>
      <ul>
        {free > 0 && <li><b>FREE delivery</b> on orders of ₹{free.toLocaleString("en-IN")} and above.</li>}
        <li>For smaller orders, delivery is charged by the total weight of your parcel: ₹{s.shipping_per_kg} per kg (packed weight, including about {s.packing_grams} g of jar and packing per item, rounded up to the next whole kg — e.g. 2 kg = ₹{Number(s.shipping_per_kg) * 2}), with a minimum of ₹{s.min_shipping}.</li>
        <li>The exact delivery charge is always shown at checkout before you pay.</li>
      </ul>

      <h2>Dispatch & delivery time</h2>
      <ul>
        <li>Orders are packed and dispatched within <b>{s.dispatch_days} working days</b> after payment is confirmed (Cash on Delivery orders after confirmation). Freshly prepared or custom items may take a little longer — we&apos;ll tell you.</li>
        <li>Usual delivery time after dispatch: 2–4 days within Andhra Pradesh &amp; Telangana, 4–8 days for the rest of India. Remote areas may take longer.</li>
        <li>We share the courier name and tracking number on your order page / WhatsApp once shipped.</li>
      </ul>

      <h2>Packing</h2>
      <p>Pickles are packed in food-grade, leak-proof jars/pouches, sealed and wrapped to prevent oil leakage. Sweets and snacks are packed in airtight food-grade packs.</p>

      <h2>Delays and failed delivery</h2>
      <ul>
        <li>Courier delays caused by weather, holidays, strikes or other events outside our control may happen; we will help you follow up with the courier.</li>
        <li>If a parcel is returned because the address was incorrect or nobody was available, re-shipping charges may apply. Perishable items returned to us cannot be refunded.</li>
      </ul>

      <h2>Damaged parcel?</h2>
      <p>If the outer box looks badly damaged or is leaking, please take a photo before opening and message us within 48 hours of delivery on WhatsApp +91 {s.phone}. See our Cancellation &amp; Refund Policy.</p>
    </PolicyPage>
  );
}
