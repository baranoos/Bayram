import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

// Next walks up for package-lock.json; one exists in C:\Users\baran\ and was
// picked as the monorepo root, causing Turbopack to watch the whole profile.
const projectRoot =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer", "puppeteer-core", "@sparticuz/chromium"],

  turbopack: {
    root: projectRoot,
  },

  async headers() {
    return [
      {
        // Service worker must be served with no-cache and broad scope
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control",          value: "no-cache, no-store, must-revalidate" },
          { key: "Pragma",                 value: "no-cache" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
          { key: "Content-Type",  value: "application/manifest+json" },
        ],
      },
      {
        source: "/offline.html",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        // SVG icons — long-lived, content doesn't change often
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
