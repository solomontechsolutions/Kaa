import type { Metadata, Viewport } from "next";
import { Bookmark, Home, MessageCircle, Search, UserRound } from "lucide-react";

import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { TabLink } from "@/components/shell/nav-link";

export const metadata: Metadata = {
  title: { default: "Kaa", template: "%s · Kaa" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#121A1F",
};

/**
 * The Kaa app.
 *
 * Installed to a home screen this runs without browser chrome, so it has to
 * supply its own: a tab bar pinned above the home indicator, safe-area padding
 * on every edge, and no rubber-band overscroll on the document. Everything
 * inside scrolls in its own pane, the way a native screen does.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="kaa-app flex h-dvh flex-col overflow-hidden bg-background">
      <RegisterServiceWorker />

      <div className="relative flex-1 overflow-y-auto overscroll-contain">{children}</div>

      <nav className="shrink-0 border-t border-border bg-surface-raised/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-lg">
          <TabLink href="/app" icon={<Home />} label="Home" exact />
          <TabLink href="/app/search" icon={<Search />} label="Search" />
          <TabLink href="/app/saved" icon={<Bookmark />} label="Saved" />
          <TabLink href="/app/chat" icon={<MessageCircle />} label="Chat" />
          <TabLink href="/app/tenancy" icon={<UserRound />} label="You" />
        </div>
      </nav>
    </div>
  );
}
