import type { NextConfig } from "next";

const r2PublicUrl = process.env.R2_PUBLIC_URL ?? "https://pub-df5a7ed06237401ca5ccd477fa0ebe4a.r2.dev";

const nextConfig: NextConfig = {
  poweredByHeader: false,

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
};

export default nextConfig;

