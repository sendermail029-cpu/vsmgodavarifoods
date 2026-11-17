import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/format";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "VSM Godavari Foods — Authentic Andhra Pickles, Sweets & Snacks Online",
    template: "%s | VSM Godavari Foods",
  },
  description:
    "Buy homemade Godavari-style chicken pickle, mutton pickle, avakaya, gongura, sunnundalu, laddus and traditional snacks online. No preservatives, no added colours. All-India delivery, free above ₹1,500.",
  keywords: [
    "chicken pickle online", "andhra pickles", "godavari pickles", "avakaya", "gongura pickle", "mutton pickle",
    "prawn pickle", "sunnundalu", "putharekulu", "homemade pickles", "west godavari foods", "tanuku pickles", "VSM Godavari Foods",
  ],
  applicationName: "VSM Godavari Foods",
  authors: [{ name: "VSM Godavari Foods" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", locale: "en_IN", siteName: "VSM Godavari Foods", url: SITE_URL,
    title: "VSM Godavari Foods — గోదావరి రుచులు మీ ఇంటికి",
    description: "Authentic pickles, traditional sweets & snacks from the heart of Godavari. Delivered across India.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "VSM Godavari Foods" }],
  },
  twitter: { card: "summary_large_image", title: "VSM Godavari Foods", description: "Authentic Godavari pickles, sweets & snacks.", images: ["/og.png"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  formatDetection: { telephone: true },
  category: "food",
};

export const viewport: Viewport = {
  themeColor: "#7A1C1C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
