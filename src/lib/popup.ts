import "server-only";
import { db } from "./db";

/** Website popup poster (shown a few seconds after a visitor opens the site). Stored in the settings table as popup_* keys. */
export type Popup = {
  enabled: boolean; image: string; title: string; text: string; button: string; link: string;
  start: string; end: string; frequency: "session" | "day" | "once"; delay: number; version: string;
};
export const POPUP_DEFAULTS: Popup = { enabled: false, image: "", title: "", text: "", button: "Shop now", link: "/shop", start: "", end: "", frequency: "day", delay: 3, version: "" };

export async function getPopup(): Promise<Popup> {
  const c = await db();
  const { rows } = await c.execute("SELECT key, value FROM settings WHERE key LIKE 'popup_%'");
  const m = Object.fromEntries(rows.map((r) => [String(r.key).slice(6), String(r.value ?? "")]));
  return {
    enabled: m.enabled === "1", image: m.image ?? "", title: m.title ?? "", text: m.text ?? "", button: m.button ?? POPUP_DEFAULTS.button, link: m.link ?? POPUP_DEFAULTS.link,
    start: m.start ?? "", end: m.end ?? "", frequency: (["session", "day", "once"].includes(m.frequency) ? m.frequency : "day") as Popup["frequency"],
    delay: Math.min(30, Math.max(0, Number(m.delay ?? 3) || 3)), version: m.version ?? "",
  };
}

/** Image URL the website should use (uploaded photos stored in the database are served through /api/image/popup). */
export const popupImageSrc = (p: Popup) => (!p.image ? "" : p.image.startsWith("https://") ? p.image.replace("/image/upload/", "/image/upload/f_auto,q_auto,c_limit,w_900/") : `/api/image/popup/1?v=${p.version}`);
