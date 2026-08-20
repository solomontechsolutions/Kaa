import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { KaaMark, KaaWordmark } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui";

const nav = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/landlords", label: "For landlords" },
  { href: "/field-ops", label: "Field Ops" },
  { href: "/pricing", label: "Pricing" },
];

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 w-full max-w-7xl items-center gap-8 px-5 lg:px-8">
          <Link href="/" aria-label="Kaa home">
            <KaaWordmark />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/operators"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground sm:block"
            >
              Sign in
            </Link>
            <ButtonLink href="#get-the-app" size="sm">
              Get the app
            </ButtonLink>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-5 py-14 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <KaaWordmark showTagline />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground-muted">
                Tanzania&rsquo;s rental platform. Verified homes, direct from landlords — no dalali fees, no
                guesswork.
              </p>
              <p className="mt-4 text-sm text-foreground-subtle">Dar es Salaam, Tanzania</p>
            </div>

            <FooterColumn
              title="Product"
              links={[
                { href: "/how-it-works", label: "How it works" },
                { href: "/pricing", label: "Pricing" },
                { href: "/landlords", label: "For landlords" },
                { href: "/field-ops", label: "Become an agent" },
              ]}
            />
            <FooterColumn
              title="Sign in"
              links={[
                { href: "/operators", label: "Kaa Operators" },
                { href: "/field", label: "Kaa Field Ops" },
              ]}
            />
            <FooterColumn
              title="Company"
              links={[
                { href: "/about", label: "About" },
                { href: "/legal/terms", label: "Terms" },
                { href: "/legal/privacy", label: "Privacy" },
              ]}
            />
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <p className="text-sm text-foreground-subtle">
              © {new Date().getFullYear()} Kaa. All rights reserved.
            </p>
            <p className="flex items-center gap-1.5 text-sm text-foreground-subtle">
              <KaaMark className="size-4 text-kaa-500" />
              Stay. Settle. Belong.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-1 text-sm text-foreground-muted transition-colors hover:text-foreground"
            >
              {link.label}
              <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
