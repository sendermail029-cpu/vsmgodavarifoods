import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { FacebookIcon } from "@/components/brand/SocialIcons";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact Us & Custom Orders",
  description: "Call or WhatsApp VSM Godavari Foods, Velpuru, Tanuku, West Godavari for orders, bulk and custom pickle orders.",
  alternates: { canonical: "/contact" },
};
export const revalidate = 3600;

export default async function Contact() {
  const s = await getSettings();
  const cards = [
    { i: Phone, t: "Call us", v: `+91 ${s.phone}`, href: `tel:+91${s.phone}` },
    ...(s.phone2 ? [{ i: Phone, t: "Call us (2nd number)", v: `+91 ${s.phone2}`, href: `tel:+91${s.phone2}` }] : []),
    { i: MessageCircle, t: "WhatsApp", v: "Chat to order", href: `https://wa.me/${s.whatsapp}?text=${encodeURIComponent("Hello VSM Godavari Foods, I would like to place an order.")}` },
    { i: Mail, t: "Email", v: s.email, href: `mailto:${s.email}` },
    ...(s.facebook_url ? [{ i: FacebookIcon, t: "Facebook", v: "Follow our page", href: s.facebook_url }] : []),
  ];
  return (
    <div className="container-x py-14">
      <div className="text-center">
        <p className="telugu text-xl text-gold">మమ్మల్ని సంప్రదించండి</p>
        <h1 className="font-display text-5xl font-black text-maroon-700">Contact us</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink/70">Orders, bulk/function orders, custom pickles or any question — we&apos;re happy to help. WhatsApp is the fastest way to reach us.</p>
      </div>
      <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ i: I, t, v, href }) => (
          <a key={t} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="card group p-6 text-center transition hover:-translate-y-1 hover:shadow-lg">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-maroon-700 text-cream transition group-hover:bg-chilli"><I className="h-6 w-6" /></span>
            <h2 className="mt-4 font-display text-xl font-bold">{t}</h2>
            <p className="mt-1 break-all text-sm text-ink/70">{v}</p>
          </a>
        ))}
      </div>
      <div className="card mx-auto mt-8 max-w-5xl overflow-hidden">
        <div className="flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
          <MapPin className="h-8 w-8 shrink-0 text-chilli" />
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold">Visit us</h2>
            <p className="text-ink/70">{s.address}</p>
            <p className="telugu text-ink/60">వెల్పూరు, తణుకు మండలం, పశ్చిమ గోదావరి జిల్లా</p>
          </div>
          {s.maps_url && <a href={s.maps_url} target="_blank" rel="noopener noreferrer" className="btn-primary shrink-0"><Navigation className="h-4 w-4" /> Get directions</a>}
        </div>
        {/^-?[\d.]+,\s*-?[\d.]+$/.test(s.map_lat_lng ?? "") && (
          <iframe title="VSM Godavari Foods on Google Maps" src={`https://maps.google.com/maps?q=${encodeURIComponent(s.map_lat_lng)}&z=15&output=embed`}
            className="block h-80 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        )}
      </div>
    </div>
  );
}
