"use client";

import { ClipboardList, Home, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

import { TabLink } from "@/components/shell/nav-link";
import type { Locale } from "@/lib/i18n/config";

/**
 * The handset tab bar. Hidden inside the collection flow, which is a
 * single-purpose task — an officer halfway through a property should have one
 * way forward, not three ways out.
 */
export function FieldAppTabs({
  labels,
}: {
  locale: Locale;
  labels: { today: string; properties: string; account: string };
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/field/app/collect")) return null;

  return (
    <nav className="shrink-0 border-t border-border bg-surface-raised/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-lg">
        <TabLink href="/field/app" icon={<Home />} label={labels.today} exact />
        <TabLink href="/field/app/properties" icon={<ClipboardList />} label={labels.properties} />
        <TabLink href="/field/app/account" icon={<UserRound />} label={labels.account} />
      </div>
    </nav>
  );
}
