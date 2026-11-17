"use client";
import { createContext, useContext } from "react";
import type { ShippingRules } from "@/lib/format";

export type StoreInfo = {
  name: string; phone: string; phone2?: string; whatsapp: string; email: string; address: string; announcement: string; shipping: ShippingRules;
  mapsUrl?: string; facebookUrl?: string;
};
const Ctx = createContext<StoreInfo | null>(null);
export const StoreInfoProvider = ({ value, children }: { value: StoreInfo; children: React.ReactNode }) => <Ctx.Provider value={value}>{children}</Ctx.Provider>;
export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreInfoProvider missing");
  return v;
}
export const waLink = (num: string, msg: string) => `https://wa.me/${num.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
