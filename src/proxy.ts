import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Extra guard: every /admin page (except login) requires a valid signed session cookie.
// Pages and server actions ALSO check the session themselves (defence in depth).
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const token = req.cookies.get("vsm_admin")?.value;
  const secret = process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32
    ? process.env.AUTH_SECRET
    : process.env.NODE_ENV === "production" ? null : "dev-only-insecure-secret-change-me-please-0123456789";
  if (token && secret) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
      if (payload.role === "admin") return NextResponse.next();
    } catch {}
  }
  return NextResponse.redirect(new URL("/admin/login", req.url));
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
