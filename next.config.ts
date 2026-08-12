import type { NextConfig } from "next";

/**
 * Export estático → Firebase Hosting no plano Spark (gratuito).
 * Sem Cloud Functions / sem Blaze.
 */
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
