import { db } from "@/lib/db";

const ALLOWED = new Set(["image/webp", "image/jpeg", "image/png", "image/avif"]);

export async function GET(_req: Request, ctx: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await ctx.params;
  if (type === "popup") {
    const c = await db();
    const { rows } = await c.execute("SELECT value FROM settings WHERE key = 'popup_image'");
    return serve(rows[0]?.value ? String(rows[0].value) : "");
  }
  const table = type === "product" ? "products" : type === "category" ? "categories" : null;
  const n = Number(id);
  if (!table || !Number.isInteger(n)) return new Response("Not found", { status: 404 });
  const c = await db();
  const { rows } = await c.execute({ sql: `SELECT image FROM ${table} WHERE id = ?`, args: [n] });
  return serve(rows[0]?.image ? String(rows[0].image) : "");
}

function serve(img: string) {
  // Cloudinary photos: send the optimised copy (WebP/AVIF, sensible size), never the full original
  if (img.startsWith("https://")) return Response.redirect(img.includes("/image/upload/") && !img.includes("f_auto") ? img.replace("/image/upload/", "/image/upload/f_auto,q_auto,c_limit,w_1200/") : img, 302);
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(img);
  if (!m || !ALLOWED.has(m[1])) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(m[2], "base64"), {
    headers: {
      "Content-Type": m[1],
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
