# VSM Godavari Foods — Website + Admin Panel

Next.js 16 · React 19 · Tailwind CSS 4 · React Three Fiber (3D) · libSQL/Turso · `upipay` UPI payments

## What's inside

| Area | Details |
|---|---|
| **3D scroll story (home)** | Chicken pieces, chillies & garlic fall into a glass jar → lid seals → avakaya jar fills → laddus drop into a brass uruli → all three line up. Fully scroll-driven (scrub up/down), lighter mode on phones, static fallback when WebGL is off or "reduce motion" is on. `src/components/three/` |
| **Your own 3D models** | Drop GLB files in `public/models/` and set their paths in `src/components/three/models.ts` (non-Draco). |
| **Shop** | Categories, product pages with pack sizes, cart drawer, free-delivery progress bar, checkout, order tracking page. |
| **Payments** | 1) UPI scan & pay straight to your UPI ID (0% fee) with QR + GPay/PhonePe/Paytm buttons, customer submits UTR, you verify. 2) Optional PhonePe Business automatic confirmation. 3) Cash on Delivery. |
| **Admin panel** `/admin` | Dashboard, Orders (mark paid, status, tracking, cancel → stock returned), Products & prices (pack sizes, MRP, photos), Categories, Inventory (quick +/-, set count, price edit, stock log), Settings (UPI ID, COD, delivery charges, contact info). |
| **Policies** | Privacy Policy, Terms & Conditions, Shipping & Delivery, Cancellation & Refunds (Indian e-commerce rules friendly). |
| **SEO** | Per-page titles/descriptions, canonical URLs, Open Graph image, `sitemap.xml`, `robots.txt`, JSON-LD (Store, Product, Breadcrumb, FAQ), web manifest, fast static pages (ISR). |
| **Brand** | Logo set in `public/brand/` (SVG + PNG, horizontal / stacked / icon / light version). Regenerate with `node scripts/build-logo.mjs`. |

## Run locally

```bash
npm install
npm run dev            # http://localhost:3000
```
Admin: http://localhost:3000/admin — dev login `admin@vsmgodavarifoods.in` / `admin123` (only works in dev).
The database is created and filled with sample products automatically in `./data/vsm.db`.
**Sample prices & stock are placeholders — change them in Admin → Products.**

## Deploy (Vercel)

1. **Database** — create a free database at https://turso.tech in the **Mumbai (ap-south-1)** region → copy the URL (`libsql://…`) and a token. (Vercel has no permanent disk, so the local `data/vsm.db` file can't be used there.)
2. **Admin password** — `npm run hash-password -- "YourStrongPassword"` and copy the hash (version 2, without `\`).
3. **Environment variables** (Vercel → project → Settings → Environment Variables) — see `.env.example`:
   - `NEXT_PUBLIC_SITE_URL` = your https domain
   - `AUTH_SECRET` = long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`
   - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
4. Push to GitHub and import the repo in Vercel (Next.js is auto-detected). `vercel.json` runs the server in Mumbai (`bom1`) — close to your customers and to a Mumbai Turso database.
5. Open `/admin` → **Settings & Payments** → add your business UPI ID → Save. Then edit prices, stock and photos.
6. Submit `https://your-domain/sitemap.xml` in Google Search Console.

## Payments — how it stays safe

- Uses the open-source **upipay** SDK (github.com/iamrobinsharaya/upipay, MIT). The version is **pinned to exactly 1.0.0** so an update can't change payment code without you knowing. Review its changelog before upgrading.
- Prices, delivery and stock are always recalculated on the server — editing prices in the browser does nothing.
- UPI QR amount is locked (fixed mode). Raw UPI has no automatic confirmation, so orders stay "Payment submitted" until you check your bank/UPI app and press **Mark Paid** in Admin.
- PhonePe (optional): add `PHONEPE_MERCHANT_ID`, `PHONEPE_SALT_KEY`, `PHONEPE_SALT_INDEX`, `PHONEPE_ENV`. Callbacks are signature-verified and every payment is re-checked server-to-server with the amount compared to the order. Test in `sandbox` first. Note: upipay uses PhonePe's checksum (salt-key) API — check with PhonePe which API your merchant account gets; newer accounts may be issued OAuth (v2) credentials instead.
- Order pages need a secret link token; UTRs can't be reused across orders; reserved stock is returned automatically when an order is cancelled or a PhonePe payment fails.

## Security notes

- Admin: bcrypt password hash, signed http-only `SameSite=Strict` session cookie (8h), 5 failed logins → 15-minute lock per IP, every admin page **and** server action re-checks the session, `/admin` is `noindex`.
- Security headers: CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy.
- Uploaded photos are resized to WebP in the browser and validated on the server (JPG/PNG/WebP only).

## Useful paths
- Text & policies: `src/app/(site)/…/page.tsx`
- Colours & fonts: `src/app/globals.css`
- 3D timing & layout: `TL` and `layoutPoses` in `src/components/three/JarScene.tsx`
