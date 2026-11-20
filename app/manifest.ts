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
    // Installed app windows stay standalone; minimal-ui is the graceful fallback
    // for browsers that reject a display mode.
    display_override: ["standalone", "minimal-ui"],
    launch_handler: { client_mode: "navigate-existing" },
    orientation: "portrait",
    background_color: "#fbf7ef",
    theme_color: "#3b2a20",
    lang: "en",
    dir: "ltr",
    categories: ["food", "shopping", "lifestyle"],
    prefer_related_applications: false,
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
        name: "Admin dashboard",
        short_name: "Dashboard",
        description: "Sales, orders and today's bakery at a glance.",
        url: "/en/admin",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Orders",
        short_name: "Orders",
        description: "Work through the order queue.",
        url: "/en/admin/orders",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Shop",
        short_name: "Shop",
        description: "Browse this morning's bakes.",
        url: "/en/shop",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
