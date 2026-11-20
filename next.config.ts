import type { NextConfig } from "next";

const r2PublicUrl = process.env.R2_PUBLIC_URL ?? "https://pub-df5a7ed06237401ca5ccd477fa0ebe4a.r2.dev";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  /**
   * The container image (see `Dockerfile`) ships the traced standalone server
   * instead of a full `node_modules` tree. Has no effect on `next dev` or on
   * platform builds such as Vercel.
   */
  output: "standalone",

  images: {
    qualities: [75, 90],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(r2PublicUrl).hostname,
        pathname: "/**",
      },
      { protocol: "https", hostname: "*.r2.dev", pathname: "/**" },
      // Admins may paste an image URL from their own CDN; any https host is
      // accepted so `next/image` never renders a broken thumbnail.
      { protocol: "https", hostname: "**", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
    ],
  },

  // nodemailer uses dynamic requires that must not be bundled.
  serverExternalPackages: ["nodemailer"],

  /**
   * The service worker must never be served stale, and it needs to answer for
   * the whole origin (`Service-Worker-Allowed`), not just `/`. The manifest is
   * revalidated so an installed app picks up icon/shortcut changes.
   */
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;

