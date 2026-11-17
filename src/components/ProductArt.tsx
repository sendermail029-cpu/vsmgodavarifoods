/** Stock product photo used until real photos are uploaded from the admin panel. Credits: /photo-credits */

const PHOTOS = [
  "chicken", "mutton", "prawn", "mango", "gongura", "tomato", "lemon", "ginger",
  "sunnundalu", "laddu", "kaja", "putharekulu", "chekkalu", "murukulu", "ariselu",
] as const;

export const ART_KEYS: string[] = [...PHOTOS];

export function ProductArt({ art, name, className = "" }: { art: string; name: string; className?: string }) {
  const key = ART_KEYS.includes(art) ? art : "mango";
  return <img src={`/products/${key}.webp?v=3`} alt={name} loading="lazy" decoding="async" className={`object-cover ${className}`} />;
}
