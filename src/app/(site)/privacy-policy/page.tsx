import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy/PolicyPage";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How VSM Godavari Foods collects, uses and protects your personal information.",
  alternates: { canonical: "/privacy-policy" },
};
export const revalidate = 3600;

export default async function Privacy() {
  const s = await getSettings();
  return (
    <PolicyPage title="Privacy Policy" telugu="గోప్యతా విధానం">
      <p className="mt-6">VSM Godavari Foods (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), located at {s.address}, respects your privacy. This policy explains what personal information we collect when you visit our website or place an order, why we collect it, and the choices you have. It is written in line with India&apos;s Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023.</p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><b>Order details you give us:</b> name, mobile number, email (optional), delivery address, city, state, pincode and any order notes.</li>
        <li><b>Payment reference:</b> for UPI payments we store the UPI transaction/UTR reference number and payment status. We <b>never</b> collect or store your UPI PIN, card number, CVV, net-banking password or bank account details — payments happen inside your UPI app or on the payment provider&apos;s secure page.</li>
        <li><b>Messages:</b> anything you send us on WhatsApp, phone or email.</li>
        <li><b>Basic technical data:</b> our hosting provider may log IP address, browser type and pages visited for security and to prevent fraud.</li>
      </ul>

      <h2>2. Cookies and local storage</h2>
      <p>We do not use advertising or tracking cookies. Your shopping cart is saved only in your own browser&apos;s local storage so it isn&apos;t lost if you close the page. The admin area uses one secure, http-only login cookie for staff only.</p>

      <h2>3. How we use your information</h2>
      <ul>
        <li>To process, pack, ship and deliver your order and to collect payment.</li>
        <li>To contact you about your order (confirmation, payment, delivery updates) by phone, SMS, WhatsApp or email.</li>
        <li>To handle custom orders, questions, complaints, cancellations and refunds.</li>
        <li>To prevent fraud and keep our website secure, and to meet legal, tax and accounting requirements.</li>
      </ul>
      <p>We will only send you offers or promotional messages if you have asked us to, and you can opt out at any time.</p>

      <h2>4. Who we share it with</h2>
      <p>We do <b>not</b> sell or rent your personal information. We share only what is necessary with:</p>
      <ul>
        <li>Courier and delivery partners — name, phone and address to deliver your parcel.</li>
        <li>Payment providers (your UPI app/bank, and PhonePe if you choose it) — to process and confirm payment.</li>
        <li>Our website hosting and database providers, who store data securely on our behalf.</li>
        <li>Government or law-enforcement authorities, if required by law.</li>
      </ul>

      <h2>5. How long we keep it</h2>
      <p>We keep order records for as long as needed to fulfil the order and to meet tax and legal obligations (generally up to 8 years for invoices under Indian law). You may ask us to delete other personal data earlier.</p>

      <h2>6. How we protect it</h2>
      <p>Our website is served over HTTPS. Order pages can only be opened with a private link. Prices and payments are verified on our server, the admin panel is password-protected with brute-force protection, and access to customer data is limited to staff who need it. No system is 100% secure, but we take reasonable care to protect your data.</p>

      <h2>7. Your rights</h2>
      <p>You can ask us to access, correct, update or erase your personal data, withdraw consent, or raise a grievance. Contact us using the details below and we will respond within a reasonable time (and within the time required by law).</p>

      <h2>8. Children</h2>
      <p>Our website is meant for adults. If you are under 18, please place orders with the help of a parent or guardian.</p>

      <h2>9. Grievance officer & contact</h2>
      <p>{s.grievance_officer}<br />{s.address}<br />Phone / WhatsApp: +91 {s.phone}<br />Email: <a href={`mailto:${s.email}`}>{s.email}</a></p>

      <h2>10. Changes to this policy</h2>
      <p>We may update this policy from time to time. The latest version will always be on this page with the &quot;Last updated&quot; date.</p>
    </PolicyPage>
  );
}
