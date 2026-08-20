"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";

/** Exact match for index routes, prefix match for everything below them. */
function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarLink({
  href,
  icon,
  label,
  badge,
  exact,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href, exact);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors [&_svg]:size-[1.15rem] [&_svg]:shrink-0",
        active
          ? "bg-kaa-50 text-kaa-800 dark:bg-kaa-950/60 dark:text-kaa-300"
          : "text-foreground-muted hover:bg-surface hover:text-foreground",
      )}
    >
      <span className={cn(active ? "text-kaa-600 dark:text-kaa-400" : "text-foreground-subtle group-hover:text-foreground-muted")}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <span className="tnum inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-kaa-500 px-1.5 text-[0.7rem] font-semibold text-ink-950">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export function TabLink({
  href,
  icon,
  label,
  badge,
  exact,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href, exact);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-1 py-2 text-[0.68rem] font-medium transition-colors [&_svg]:size-[1.35rem]",
        active ? "text-kaa-700 dark:text-kaa-400" : "text-foreground-subtle",
      )}
    >
      {typeof badge === "number" && badge > 0 && (
        <span className="tnum absolute right-[22%] top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[0.6rem] font-semibold text-white">
          {badge}
        </span>
      )}
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function SegmentLink({ href, label, exact }: { href: string; label: string; exact?: boolean }) {
  const pathname = usePathname();
  const active = isActive(pathname, href, exact);
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-surface-raised text-foreground shadow-[var(--shadow-elev-1)]" : "text-foreground-muted hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
