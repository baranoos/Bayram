export const AUTH_COOKIE_NAME = "token";

export function getAuthCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    path: "/",
    maxAge: maxAgeSeconds,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
