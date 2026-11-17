import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/policy/PolicyPage";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for buying pickles, sweets and snacks from VSM Godavari Foods.",
  alternates: { canonical: "/terms-and-conditions" },
};
export const revalidate = 3600;

export default async function Terms() {
  const s = await getSettings();
  return (
    <PolicyPage title="Terms & Conditions" telugu="నిబంధనలు & షరతులు">
      <p className="mt-6">These terms apply when you use this website or buy products from VSM Godavari Foods, {s.address} (&quot;we&quot;, &quot;us&quot;). By placing an order you agree to these terms, our <Link href="/privacy-policy">Privacy Policy</Link>, <Link href="/shipping-policy">Shipping Policy</Link> and <Link href="/refund-policy">Cancellation & Refund Policy</Link>.</p>

      <h2>1. Our products</h2>
      <ul>
        <li>Our pickles, sweets and snacks are homemade in small batches using traditional recipes. Taste, colour, spice level and the size of pieces can vary slightly from batch to batch and from the pictures on this website.</li>
        <li>Product weights are net weights at the time of packing. Pickles naturally contain oil, which is part of the product.</li>
        <li><b>Allergens:</b> our products may contain or be made in a kitchen that handles groundnut (peanut) oil, sesame, mustard, gluten (wheat/maida), dairy (ghee), nuts and shellfish (prawn). Please read the ingredients and contact us before ordering if you have an allergy.</li>
        <li>Follow the storage instructions on each product (cool, dry place; always use a clean, dry spoon). Non-veg pickles should be refrigerated after opening.</li>
        {s.fssai_license && <li>FSSAI Licence / Registration No.: {s.fssai_license}</li>}
      </ul>

      <h2>2. Prices and payment</h2>
      <ul>
        <li>All prices are in Indian Rupees (₹) and include applicable taxes unless stated otherwise. Delivery charges are shown at checkout before you pay.</li>
        <li>The price charged is the price shown at the time you place the order. If a price is shown incorrectly because of an obvious error, we may cancel the order and refund any amount paid.</li>
        <li>We accept UPI payments (paid directly to our business UPI account, or through PhonePe where available) and Cash on Delivery where offered. For &quot;scan &amp; pay&quot; UPI orders, your order is confirmed after we verify the payment against the UPI reference (UTR) number you submit.</li>
        <li>Never share your UPI PIN or OTP with anyone. We will never ask for it.</li>
      </ul>

      <h2>3. Orders</h2>
      <ul>
        <li>An order is accepted when we confirm it (by order status update, message or call). We may refuse or cancel any order — for example if an item is out of stock, the address is not serviceable, payment is not received within 24 hours, or we suspect fraud. If you have already paid, we will refund you in full.</li>
        <li>Please make sure your name, phone number and address are correct. We are not responsible for delays or failed delivery caused by incorrect details.</li>
        <li>Custom orders (special flavours, spice levels or recipes made on request) are prepared specially for you and cannot be cancelled once preparation has started.</li>
      </ul>

      <h2>4. Delivery, cancellation and refunds</h2>
      <p>Delivery timelines and charges are explained in our <Link href="/shipping-policy">Shipping Policy</Link>. Cancellations, replacements and refunds are explained in our <Link href="/refund-policy">Cancellation & Refund Policy</Link>.</p>

      <h2>5. Use of the website</h2>
      <ul>
        <li>You agree not to misuse this website — including trying to access the admin area, interfering with security, placing fake orders or submitting false payment references.</li>
        <li>All content on this website — the VSM Godavari Foods name, logo, text, illustrations and design — belongs to us and may not be copied or used without permission.</li>
      </ul>

      <h2>6. Limitation of liability</h2>
      <p>To the extent allowed by law, our total liability for any order is limited to the amount you paid for that order. We are not liable for indirect losses, or for problems caused by not following storage instructions, by allergies to declared ingredients, or by events outside our control (such as courier delays, strikes, natural disasters or network outages).</p>

      <h2>7. Governing law</h2>
      <p>These terms are governed by the laws of India. Any dispute will be subject to the jurisdiction of the courts at West Godavari District, Andhra Pradesh. We will always try to resolve complaints amicably first — please contact us.</p>

      <h2>8. Contact & grievances</h2>
      <p>{s.grievance_officer}<br />Phone / WhatsApp: +91 {s.phone}<br />Email: <a href={`mailto:${s.email}`}>{s.email}</a><br />We acknowledge complaints within 48 hours and aim to resolve them within 30 days, as required by the Consumer Protection (E-Commerce) Rules, 2020.</p>
    </PolicyPage>
  );
}
