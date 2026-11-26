import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lilyy Bakers",
    short_name: "Lilyy",
    description:
      "Småbatches surdeig, kaker og bakverk ferskt fra ovnen hver morgen i Norge.",
    id: "/",
    // Unprefixed on purpose: launching the installed app runs the same
    // country/language detection as a first visit instead of forcing English.
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Installed app windows stay standalone; minimal-ui is the graceful fallback
    // for browsers that reject a display mode.
    display_override: ["standalone", "minimal-ui"],
    launch_handler: { client_mode: "navigate-existing" },
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#3b2a20",
    lang: "nb",
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
        url: "/admin",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Orders",
        short_name: "Orders",
        description: "Work through the order queue.",
        url: "/admin/orders",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Shop",
        short_name: "Shop",
        description: "Browse this morning's bakes.",
        url: "/shop",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
