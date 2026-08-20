import type { Metadata, Viewport } from "next";

import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://kaatz.vercel.app"),
  title: {
    default: "Kaa, Tanzania's managed rental platform",
    template: "%s · Kaa",
  },
  description:
    "Kaa Field Ops visits, verifies and manages every property. Tenants are vetted by NIDA and sign digital contracts. Landlords simply watch their portfolio.",
  applicationName: "Kaa",
  keywords: [
    "rent in Tanzania",
    "nyumba za kupanga",
    "Dar es Salaam rentals",
    "kupanga nyumba",
    "property management Tanzania",
    "Kaa",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Kaa",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    locale: "sw_TZ",
    siteName: "Kaa",
    title: "Kaa, Tanzania's managed rental platform",
    description: "Verified homes, managed end to end. Stay. Settle. Belong.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0D11" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Swahili is the default, but the visitor's choice is a cookie, so the
  // document language has to be resolved per request rather than hard coded.
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
