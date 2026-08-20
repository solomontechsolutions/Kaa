"use client";

import { Bookmark, Home, MessageCircle, Search, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

import { TabLink } from "@/components/shell/nav-link";

/**
 * The tab bar, hidden during the screens that are not part of the app proper.
 *
 * Creating an account and paying for membership are single-purpose flows —
 * showing five tabs underneath them invites a tenant to wander off halfway
 * through verifying their identity, which is the one moment that should have
 * exactly one way forward.
 */
const CHROMELESS = ["/app/welcome", "/app/join", "/app/unlock"];

export function AppTabBar({
  labels,
}: {
  labels: { home: string; search: string; saved: string; chat: string; you: string };
}) {
  const pathname = usePathname();
  if (CHROMELESS.some((path) => pathname.startsWith(path))) return null;

  return (
    <nav className="shrink-0 border-t border-border bg-surface-raised/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-lg">
        <TabLink href="/app" icon={<Home />} label={labels.home} exact />
        <TabLink href="/app/search" icon={<Search />} label={labels.search} />
        <TabLink href="/app/saved" icon={<Bookmark />} label={labels.saved} />
        <TabLink href="/app/chat" icon={<MessageCircle />} label={labels.chat} />
        <TabLink href="/app/tenancy" icon={<UserRound />} label={labels.you} />
      </div>
    </nav>
  );
}
