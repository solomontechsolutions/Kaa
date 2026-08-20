import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kaa.co.tz"),
  title: {
    default: "Kaa — Stay. Settle. Belong.",
    template: "%s · Kaa",
  },
  description:
    "Kaa is Tanzania's rental platform. Verified homes, direct from landlords — no dalali fees, no guesswork. Nyumba zilizothibitishwa, moja kwa moja kutoka kwa mwenye nyumba.",
  keywords: [
    "rent in Tanzania", "nyumba za kupanga", "Dar es Salaam rentals",
    "kupanga nyumba", "verified rentals Tanzania", "Kaa",
  ],
  openGraph: {
    type: "website",
    locale: "sw_TZ",
    siteName: "Kaa",
    title: "Kaa — Stay. Settle. Belong.",
    description: "Verified rental homes across Tanzania, direct from landlords.",
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sw" className={poppins.variable} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
