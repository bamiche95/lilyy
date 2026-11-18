import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lilyy Bakers",
    short_name: "Lilyy",
    description:
      "Small-batch sourdough, cakes and pastries baked fresh every morning in Norway.",
    id: "/",
    start_url: "/en",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf7ef",
    theme_color: "#3b2a20",
    lang: "en",
    dir: "ltr",
    categories: ["food", "shopping", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Sign in",
        url: "/en/auth/sign-in",
      },
    ],
  };
}
