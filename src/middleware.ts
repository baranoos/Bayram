import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

const PUBLIC_PATHS = ["/login"];

const PUBLIC_API_PREFIXES = ["/api/auth/login", "/api/auth/status"];

function matchesAnyPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return matchesAnyPrefix(pathname, PUBLIC_API_PREFIXES);
}

// Role is deliberately not checked here. The JWT's role claim is baked in at
// login time, so a session started before a role change (e.g. a promotion,
// or the OWNER/EMPLOYEE migration) keeps its old value until the token is
// reissued — middleware has no DB access to notice the drift. Owner-only
// enforcement instead lives entirely in the Server Component / route handler
// (requireOwner(), and the OWNER check in settings/gebruikers/page.tsx),
// which always re-reads the current role from the database.
async function verifyAuthToken(token: string): Promise<boolean> {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.json" ||
    pathname === "/offline.html" ||
    pathname.startsWith("/icons/") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = token ? await verifyAuthToken(token) : false;

  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.next();

  // Authenticated pages must never be served from the browser's back/forward
  // cache: without this, pressing "back" after logout can briefly show the
  // previous user's cached page (email, nav) even though their session is
  // already invalid server-side.
  if (!pathname.startsWith("/api/")) {
    res.headers.set("Cache-Control", "no-store");
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
