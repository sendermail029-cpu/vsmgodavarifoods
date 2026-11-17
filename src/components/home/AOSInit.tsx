"use client";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

/** Animate-On-Scroll for the home page: elements with data-aos animate once as they enter the screen. */
export function AOSInit() {
  useEffect(() => {
    AOS.init({ duration: 800, easing: "ease-out-cubic", once: true, offset: 80, disable: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches });
    // re-measure after images and fonts settle
    const t = setTimeout(() => AOS.refresh(), 600);
    return () => clearTimeout(t);
  }, []);
  return null;
}
