import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { KaaMark, KaaWordmark } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui";

const nav = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/landlords", label: "Landlords" },
  { href: "/whatsapp", label: "WhatsApp" },
  { href: "/field-ops", label: "Field Ops" },
  { href: "/pricing", label: "Pricing" },
];

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="shell flex h-18 items-center gap-10">
          <Link href="/" aria-label="Kaa home">
            <KaaWordmark />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative rounded-lg px-3 py-2 text-sm font-medium text-foreground-muted transition-colors after:absolute after:inset-x-3 after:-bottom-px after:h-px after:origin-left after:scale-x-0 after:bg-kaa-500 after:transition-transform after:duration-300 hover:text-foreground hover:after:scale-x-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/landlords#sign-in"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground sm:block"
            >
              Landlord sign in
            </Link>
            <ButtonLink href="/app" size="sm">
              Open Kaa
            </ButtonLink>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-surface">
        <div className="shell py-16">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div>
              <KaaWordmark showTagline animated />
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-foreground-muted">
                Tanzania&rsquo;s managed rental platform. Every property visited, verified and run by Kaa
                Field Ops. Every tenant vetted on NIDA.
              </p>
              <p className="mt-4 text-sm text-foreground-subtle">Dar es Salaam, Tanzania</p>
            </div>

            <FooterColumn
              title="Product"
              links={[
                { href: "/how-it-works", label: "How it works" },
                { href: "/whatsapp", label: "WhatsApp assistant" },
                { href: "/pricing", label: "Pricing" },
                { href: "/app", label: "Open the app" },
              ]}
            />
            <FooterColumn
              title="Partners"
              links={[
                { href: "/landlords", label: "For landlords" },
                { href: "/field-ops", label: "Become an agent" },
                { href: "/operators", label: "Operator sign in" },
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

          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-7">
            <p className="text-sm text-foreground-subtle">
              © <span className="tnum">{new Date().getFullYear()}</span> Kaa. All rights reserved.
            </p>
            <p className="flex items-center gap-2 text-sm text-foreground-subtle">
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
              <ArrowUpRight className="size-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
