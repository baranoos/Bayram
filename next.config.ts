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

  experimental: {
    // Default proxy body cap is 10MB, which silently truncates larger photo
    // uploads mid-stream (formidable then fails with a generic parse error).
    // Note: on actual Vercel deployment, serverless functions still enforce
    // their own ~4.5MB request body limit independent of this setting — see
    // release report for the full explanation and the existing R2 presigned
    // direct-to-storage upload path as the long-term fix for larger files.
    proxyClientMaxBodySize: "20mb",
  },

  outputFileTracingIncludes: {
    "/api/opdrachten/[opdrachtId]/rapporten/[rapportId]/pdf": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
  },

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
