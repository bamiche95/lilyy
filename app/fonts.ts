import { Inter_Tight, Playfair_Display } from "next/font/google";

/**
 * Headings — high-contrast Didone-style serif with a genuine 700–900 bold cut.
 * Loaded as a variable font, self-hosted by `next/font` at build time.
 */
export const displayFont = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

/**
 * Body and UI — tight, sleek humanist sans. `latin` covers the Norwegian
 * letters æ (U+00E5), ø (U+00F8) and å (U+00E5), so no extra subset is needed.
 */
export const bodyFont = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  fallback: ["system-ui", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
});
