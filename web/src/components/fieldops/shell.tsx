"use client";

import {
  Activity,
  BarChart3,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { FieldOpsLockup } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { translator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { Actor } from "@/lib/fieldops/permissions";
import { cn } from "@/lib/utils";

/**
 * The FieldOps operations portal shell.
 *
 * Desktop-first, deliberately. This is a supervisor at a desk with a
 * spreadsheet's worth of submissions to get through, not an officer holding a
 * phone in the sun — that is a different application, and it lives at /field/app.
 * So: a persistent sidebar rather than a tab bar, a wide content column rather
 * than a phone-width one, and density over thumb-reach.
 *
 * It still collapses to a drawer below `lg`, because a supervisor checking the
 * queue from a car is a real thing. Small screens are supported; they are not
 * the design target.
 */

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
  badgeKey?: "review" | "corrections";
  children?: { href: string; labelKey: string; badgeKey?: "review" | "corrections" }[];
}

const NAV: NavItem[] = [
  { href: "/field", labelKey: "fieldops.nav.dashboard", icon: <LayoutDashboard /> },
  {
    href: "/field/submissions",
    labelKey: "fieldops.nav.properties",
    icon: <ClipboardList />,
    children: [
      { href: "/field/submissions", labelKey: "fieldops.nav.allProperties" },
      { href: "/field/submissions?status=READY_FOR_UPLOAD&status=DRAFT", labelKey: "fieldops.nav.pendingUpload" },
      { href: "/field/submissions?status=UPLOADED&status=UNDER_REVIEW&status=RESUBMITTED", labelKey: "fieldops.nav.underReview", badgeKey: "review" },
      { href: "/field/submissions?status=CORRECTION_REQUIRED", labelKey: "fieldops.nav.corrections", badgeKey: "corrections" },
      { href: "/field/submissions?status=APPROVED", labelKey: "fieldops.nav.approved" },
    ],
  },
  { href: "/field/officers", labelKey: "fieldops.nav.officers", icon: <Users /> },
  { href: "/field/activity", labelKey: "fieldops.nav.activity", icon: <Activity /> },
  { href: "/field/reports", labelKey: "fieldops.nav.reports", icon: <BarChart3 /> },
  { href: "/field/settings", labelKey: "fieldops.nav.settings", icon: <Settings /> },
];

export function FieldOpsShell({
  actor,
  locale,
  badges,
  children,
}: {
  actor: Actor;
  locale: Locale;
  badges: { review: number; corrections: number };
  children: React.ReactNode;
}) {
  const t = React.useMemo(() => translator(locale), [locale]);
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // The drawer closes on the click that navigates, rather than by watching the
  // pathname afterwards — leaving it open over the new page is the classic
  // mobile-drawer bug, and closing it here costs no extra render.
  const closeDrawer = React.useCallback(() => setDrawerOpen(false), []);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/field" className="text-foreground">
          <FieldOpsLockup />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" onClick={closeDrawer}>
        {NAV.map((item) => (
          <NavGroup key={item.href} item={item} pathname={pathname} badges={badges} t={t} />
        ))}
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-kaa-50 text-sm font-semibold text-kaa-800 dark:bg-kaa-950 dark:text-kaa-300">
            {actor.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{actor.name}</p>
            <p className="truncate text-xs text-foreground-subtle">{t(`fieldops.role.${actor.role}`)}</p>
          </div>
          <button
            type="button"
            aria-label={t("fieldops.signOut")}
            onClick={async () => {
              await fetch("/api/fieldops/session", { method: "DELETE" });
              router.push("/field/sign-in");
              router.refresh();
            }}
            className="flex size-8 items-center justify-center rounded-lg text-foreground-subtle transition-colors hover:bg-surface hover:text-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 shrink-0 border-r border-border bg-surface-raised lg:block">
        {sidebar}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t("common.cancel")}
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink-950/50"
          />
          <div className="relative h-full w-72 border-r border-border bg-surface-raised">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label={t("common.cancel")}
              className="absolute right-3 top-4 flex size-9 items-center justify-center rounded-lg text-foreground-muted"
            >
              <X className="size-4" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface-raised/90 px-4 backdrop-blur-md lg:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t("fieldops.nav.menu")}
            className="flex size-9 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <form
            action="/field/submissions"
            className="hidden max-w-md flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 focus-within:border-kaa-400 md:flex"
          >
            <Search className="size-4 shrink-0 text-foreground-subtle" />
            <input
              type="search"
              name="q"
              placeholder={t("fieldops.searchPlaceholder")}
              aria-label={t("fieldops.searchPlaceholder")}
              className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-subtle"
            />
          </form>

          <div className="ml-auto flex items-center gap-1.5">
            <LanguageSwitcher current={locale} />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function NavGroup({
  item,
  pathname,
  badges,
  t,
}: {
  item: NavItem;
  pathname: string;
  badges: { review: number; corrections: number };
  t: (key: string) => string;
}) {
  const active = item.href === "/field" ? pathname === "/field" : pathname.startsWith(item.href);
  const [open, setOpen] = React.useState(active);

  return (
    <div>
      <div className="flex items-center">
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors [&_svg]:size-[1.15rem] [&_svg]:shrink-0",
            active
              ? "bg-kaa-50 text-kaa-800 dark:bg-kaa-950/60 dark:text-kaa-300"
              : "text-foreground-muted hover:bg-surface hover:text-foreground",
          )}
        >
          <span className={active ? "text-kaa-600 dark:text-kaa-400" : "text-foreground-subtle"}>
            {item.icon}
          </span>
          <span className="flex-1 truncate">{t(item.labelKey)}</span>
        </Link>

        {item.children && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={t(item.labelKey)}
            className="flex size-8 items-center justify-center rounded-lg text-foreground-subtle transition-colors hover:bg-surface"
          >
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>

      {item.children && open && (
        <ul className="mt-1 space-y-0.5 border-l border-border pl-3 ml-5">
          {item.children.map((child) => {
            const count = child.badgeKey ? badges[child.badgeKey] : 0;
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-surface hover:text-foreground"
                >
                  <span className="flex-1 truncate">{t(child.labelKey)}</span>
                  {count > 0 && (
                    <span className="tnum inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface px-1.5 text-[0.7rem] font-semibold text-foreground-muted">
                      {count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
