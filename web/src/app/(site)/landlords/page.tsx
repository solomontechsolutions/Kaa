import {
  BadgeCheck,
  Banknote,
  Building2,
  CalendarCheck,
  Camera,
  FileSignature,
  ShieldCheck,
  TrendingDown,
  UsersRound,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";

import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { money } from "@/lib/format";

export const metadata: Metadata = {
  title: "For landlords",
  description:
    "List your property on Kaa for free. Verified tenants, digital leases, mobile-money rent collection and arrears tracking in Kaa Operators.",
};

const features = [
  {
    icon: <Building2 />,
    title: "Every unit in one place",
    body: "Properties, units, occupancy and rent roll across your whole portfolio — not a notebook and three WhatsApp groups.",
  },
  {
    icon: <UsersRound />,
    title: "Tenants with verified identity",
    body: "Kaa checks a tenant's NIDA before they reach you. You know who is moving in.",
  },
  {
    icon: <FileSignature />,
    title: "Digital leases",
    body: "Generate and sign the agreement in the portal. Renewal reminders before the term runs out.",
  },
  {
    icon: <Banknote />,
    title: "Rent collection and arrears",
    body: "Invoices raised automatically each period, mobile-money settlement, and a clear list of who has not paid.",
  },
  {
    icon: <CalendarCheck />,
    title: "Viewings handled for you",
    body: "Requests from the app get routed to the Kaa agent covering your ward. No more strangers calling at 9pm.",
  },
  {
    icon: <Wrench />,
    title: "Maintenance you can see",
    body: "Tenants log faults with photos. You see what is open, how urgent, and how long it has been sitting.",
  },
];

export default function LandlordsPage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="kaa-wash border-b border-border">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <Badge tone="brand" className="mb-5">
              Kaa Operators
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Fill your units faster. Stop chasing rent.
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-foreground-muted">
              Listing on Kaa is free. We photograph and verify your property, put it in front of tenants who
              have confirmed their identity, and give you a portal to run the tenancy afterwards.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="#list-with-kaa" size="lg">
                List your property
              </ButtonLink>
              <ButtonLink href="/operators" size="lg" variant="outline">
                See the portal
              </ButtonLink>
            </div>
          </div>

          <Card className="p-7">
            <p className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
              What it costs you
            </p>
            <dl className="mt-5 space-y-4">
              <Row label="Listing your property" value="Free" />
              <Row label="Professional photography" value="Free" />
              <Row label="Verification and geo-tagging" value="Free" />
              <Row label="Kaa Operators portal" value="Free" />
              <Row
                label="When Kaa finds your tenant"
                value="up to 5%"
                note="of the first year's rent, charged once"
                emphasis
              />
            </dl>
            <p className="mt-6 border-t border-border pt-5 text-sm text-foreground-muted">
              You pay only when a unit is actually filled. An empty unit costs you nothing on Kaa — it just
              costs you the rent you are not collecting.
            </p>
          </Card>
        </div>
      </section>

      {/* ── The vacancy argument ────────────────────────────────── */}
      <section className="border-b border-border bg-ink-950 py-20 text-white lg:py-24 dark:bg-ink-900">
        <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <TrendingDown className="size-7 text-kaa-400" />
              <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                An empty month is gone forever.
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-white/70">
                A unit at {money(700_000)} a month that sits empty for two months has cost you{" "}
                {money(1_400_000)} — far more than any facilitation fee. Speed of letting is the number that
                matters, and it is the number Kaa is built to move.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DarkCard
                icon={<Camera />}
                title="Better listings let faster"
                body="Verified listings with real photos and honest upfront costs get more genuine enquiries and far fewer no-shows."
              />
              <DarkCard
                icon={<ShieldCheck />}
                title="Fewer wasted viewings"
                body="Tenants see the deposit and months upfront before they book, so the people who turn up can actually afford it."
              />
              <DarkCard
                icon={<UsersRound />}
                title="A bigger pool"
                body="Kaa reaches tenants searching your ward across the whole city, not just the ones who walk past your gate."
              />
              <DarkCard
                icon={<BadgeCheck />}
                title="Identity checked first"
                body="NIDA verification happens before a viewing is booked, not after someone has your keys."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need after the tenant signs.
            </h2>
            <p className="mt-4 text-lg text-foreground-muted">
              Kaa Operators is the back office — free, in your browser, on any device.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-kaa-50 text-kaa-700 dark:bg-kaa-950 dark:text-kaa-400 [&_svg]:size-5">
                  {feature.icon}
                </span>
                <h3 className="mt-4 font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{feature.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Getting started ─────────────────────────────────────── */}
      <section id="list-with-kaa" className="border-t border-border bg-surface py-20 lg:py-24">
        <div className="mx-auto w-full max-w-3xl px-5 text-center lg:px-8">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Leave your number. An agent comes to you.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-foreground-muted">
            A Kaa field agent visits, photographs the property, records the details and sets up your
            Operators account. It takes about an hour and costs nothing.
          </p>
          <div className="mx-auto mt-9 max-w-xl text-left">
            <WaitlistForm />
          </div>
        </div>
      </section>
    </>
  );
}

function Row({
  label,
  value,
  note,
  emphasis,
}: {
  label: string;
  value: string;
  note?: string;
  emphasis?: boolean;
}) {
  return (
    <div className={emphasis ? "border-t border-border pt-4" : undefined}>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-sm text-foreground-muted">{label}</dt>
        <dd className={emphasis ? "font-semibold text-kaa-700 dark:text-kaa-400" : "font-medium"}>{value}</dd>
      </div>
      {note && <p className="mt-1 text-xs text-foreground-subtle">{note}</p>}
    </div>
  );
}

function DarkCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-card border border-white/10 bg-white/5 p-5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-kaa-500/15 text-kaa-400 [&_svg]:size-4">
        {icon}
      </span>
      <h3 className="mt-3.5 text-sm font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-white/65">{body}</p>
    </div>
  );
}
