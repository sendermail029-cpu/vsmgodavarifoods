import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy/PolicyPage";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description: "Cancellation, replacement and refund policy for VSM Godavari Foods orders.",
  alternates: { canonical: "/refund-policy" },
};
export const revalidate = 3600;

export default async function Refund() {
  const s = await getSettings();
  return (
    <PolicyPage title="Cancellation & Refund Policy" telugu="రద్దు & రీఫండ్ విధానం">
      <p className="mt-6">Our products are food items made fresh in small batches, so we follow these simple rules to keep things fair and hygienic for everyone.</p>

      <h2>Cancelling an order</h2>
      <ul>
        <li>You can cancel free of charge <b>before your order is packed/dispatched</b>. Message us on WhatsApp +91 {s.phone} or email {s.email} with your order number.</li>
        <li>Orders cannot be cancelled after dispatch.</li>
        <li>Custom orders cannot be cancelled once preparation has started.</li>
      </ul>

      <h2>Returns</h2>
      <p>For hygiene and food-safety reasons we cannot accept returns of food items once delivered, unless the item is damaged, wrong or spoiled on arrival as described below.</p>

      <h2>Damaged, wrong or spoiled items</h2>
      <ul>
        <li>Contact us within <b>48 hours of delivery</b> with your order number and clear photos/video of the parcel and the product (an unboxing video helps a lot).</li>
        <li>After checking, we will send a <b>free replacement</b> or give you a <b>full refund</b> for the affected item(s), including delivery charges for those items.</li>
        <li>Differences in taste, colour or spice level between batches, or spoilage caused by not following storage instructions (wet spoon, not refrigerating after opening, etc.), are not considered defects.</li>
      </ul>

      <h2>Refunds</h2>
      <ul>
        <li>Approved refunds are made to the original payment method — to the same UPI ID / bank account you paid from. For Cash on Delivery orders, we refund by UPI or bank transfer to an account you share with us.</li>
        <li>Refunds are initiated within <b>2 working days</b> of approval and usually reach your account within <b>5–7 working days</b>, depending on your bank.</li>
        <li>If an order is cancelled by us (for example, out of stock), we refund the full amount you paid.</li>
        <li>If a payment was deducted from your account but the order shows unpaid, send us the UTR/transaction reference — we will either confirm the order or refund the amount.</li>
      </ul>

      <h2>Contact</h2>
      <p>{s.grievance_officer}<br />Phone / WhatsApp: +91 {s.phone}<br />Email: <a href={`mailto:${s.email}`}>{s.email}</a></p>
    </PolicyPage>
  );
}
