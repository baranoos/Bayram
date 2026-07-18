import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

const PUBLIC_PATHS = ["/login"];

const PUBLIC_API_PREFIXES = ["/api/auth/login", "/api/auth/status"];

// Owner-only surface. This is a fast, edge-level check against the JWT's
// role claim — the routes/page themselves re-check role AND active status
// against the database, which is the authoritative check.
const OWNER_ONLY_PREFIXES = ["/settings/gebruikers", "/api/users"];

function matchesAnyPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return matchesAnyPrefix(pathname, PUBLIC_API_PREFIXES);
}

function isOwnerOnlyPath(pathname: string) {
  return matchesAnyPrefix(pathname, OWNER_ONLY_PREFIXES);
}

async function verifyAuthToken(token: string): Promise<{ role: string } | null> {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return { role: String(payload.role ?? "") };
  } catch {
    return null;
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
  const auth = token ? await verifyAuthToken(token) : null;
  const isAuthenticated = auth !== null;

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

  if (isOwnerOnlyPath(pathname) && auth.role !== "OWNER") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/settings", request.url));
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
