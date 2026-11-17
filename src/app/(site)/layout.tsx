import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StoreInfoProvider } from "@/components/StoreInfo";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { getCategories } from "@/lib/catalog";
import { getSettings, shippingRules } from "@/lib/settings";
import { SITE_URL } from "@/lib/format";
import { getPopup, popupImageSrc } from "@/lib/popup";
import { expireUnpaidOrders } from "@/lib/orders";
import { PopupPoster } from "@/components/layout/PopupPoster";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [cats, s, popup] = await Promise.all([getCategories(), getSettings(), getPopup(), expireUnpaidOrders().catch(() => 0)]);
  const categories = cats.map((c) => ({ name: c.name, slug: c.slug, telugu: c.telugu_name }));
  const store = {
    name: s.store_name, phone: s.phone, phone2: s.phone2, mapsUrl: s.maps_url, facebookUrl: s.facebook_url, whatsapp: s.whatsapp, email: s.email, address: s.address,
    announcement: s.announcement, shipping: shippingRules(s),
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${SITE_URL}/#store`,
    name: "VSM Godavari Foods",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo-mark-1024.png`,
    image: `${SITE_URL}/og.png`,
    description: "Homemade Godavari-style pickles, traditional sweets and snacks. All-India delivery.",
    telephone: [`+91${s.phone}`, ...(s.phone2 ? [`+91${s.phone2}`] : [])],
    ...(s.maps_url ? { hasMap: s.maps_url } : {}),
    ...(/^-?[\d.]+,\s*-?[\d.]+$/.test(s.map_lat_lng ?? "") ? { geo: { "@type": "GeoCoordinates", latitude: Number(s.map_lat_lng.split(",")[0]), longitude: Number(s.map_lat_lng.split(",")[1]) } } : {}),
    email: s.email,
    priceRange: "₹₹",
    address: { "@type": "PostalAddress", streetAddress: "Velpuru", addressLocality: "Tanuku", addressRegion: "Andhra Pradesh", postalCode: "534222", addressCountry: "IN" },
    areaServed: "IN",
    sameAs: [`https://wa.me/${s.whatsapp}`, ...(s.facebook_url ? [s.facebook_url] : [])],
  };
  return (
    <StoreInfoProvider value={store}>
      <CartProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
        <Header categories={categories} />
        <main id="main">{children}</main>
        <Footer categories={categories} phone={s.phone} phone2={s.phone2} mapsUrl={s.maps_url} facebookUrl={s.facebook_url} email={s.email} address={s.address} whatsapp={s.whatsapp} />
        <CartDrawer />
        <WhatsAppFab />
        {popup.enabled && (popup.image || popup.title) && (
          <PopupPoster popup={{ image: popupImageSrc(popup), title: popup.title, text: popup.text, button: popup.button, link: popup.link, start: popup.start, end: popup.end, frequency: popup.frequency, delay: popup.delay, version: popup.version }} />
        )}
      </CartProvider>
    </StoreInfoProvider>
  );
}
