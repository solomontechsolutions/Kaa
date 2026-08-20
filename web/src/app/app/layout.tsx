import type { Metadata, Viewport } from "next";

import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { AppTabBar } from "@/components/app/tab-bar";
import { Splash } from "@/components/app/splash";
import { getI18n } from "@/lib/i18n/server";

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
 * supply its own: an opening animation, a tab bar pinned above the home
 * indicator, safe-area padding on every edge, and no rubber-band overscroll on
 * the document. Everything inside scrolls in its own pane, the way a native
 * screen does.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getI18n();

  return (
    <div className="kaa-app flex h-dvh flex-col overflow-hidden bg-background">
      <RegisterServiceWorker />
      <Splash greeting={t("splash.greeting")} tagline={t("common.tagline")} />

      <div className="relative flex-1 overflow-y-auto overscroll-contain">{children}</div>

      <AppTabBar
        labels={{
          home: t("tabs.home"),
          search: t("tabs.search"),
          saved: t("tabs.saved"),
          chat: t("tabs.chat"),
          you: t("tabs.you"),
        }}
      />
    </div>
  );
}
