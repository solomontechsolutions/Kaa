import type { MetadataRoute } from "next";

/**
 * Kaa installs as an app.
 *
 * `start_url` points at /app, not /, because someone who installs Kaa to their
 * home screen wants the product, not the marketing site. `display: standalone`
 * drops the browser chrome so it behaves as a native app would.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kaa, Stay. Settle. Belong.",
    short_name: "Kaa",
    description:
      "Find a verified home in Tanzania. Every listing visited and managed by Kaa Field Ops, every tenancy on a digital contract.",
    id: "/app",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#121A1F",
    theme_color: "#121A1F",
    lang: "sw",
    dir: "ltr",
    categories: ["lifestyle", "business", "travel"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Search homes", short_name: "Search", url: "/app/search" },
      { name: "Saved", short_name: "Saved", url: "/app/saved" },
      { name: "My tenancy", short_name: "Tenancy", url: "/app/tenancy" },
    ],
  };
}
