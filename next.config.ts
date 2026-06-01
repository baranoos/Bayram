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
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
