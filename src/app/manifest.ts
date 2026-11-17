import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VSM Godavari Foods", short_name: "VSM Foods", description: "Authentic Godavari pickles, sweets & snacks",
    start_url: "/", display: "standalone", background_color: "#FBF1DE", theme_color: "#7A1C1C",
    icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  };
}
