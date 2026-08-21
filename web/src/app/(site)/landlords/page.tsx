import {
  BadgeCheck,
  Banknote,
  Building2,
  Camera,
  Eye,
  FileSignature,
  Fingerprint,
  Handshake,
  PhoneCall,
  ShieldCheck,
  Smartphone,
  TrendingDown,
  UsersRound,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";

import { Reveal, RevealGroup } from "@/components/motion/reveal";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { money } from "@/lib/format";

export const metadata: Metadata = {
  title: "For landlords",
  description:
    "Kaa Field Ops manages your property end to end. We visit, photograph, list, vet tenants on NIDA and collect the rent. You watch it from your phone.",
};

const watching = [
  {
    icon: <Building2 />,
    title: "Every unit, live",
    body: "What is let, what is empty, what each one earns, and what a vacant month is costing you.",
  },
  {
    icon: <UsersRound />,
    title: "Who is in your building",
    body: "Name, NIDA verification status, lease dates and contact details for every tenant we placed.",
  },
  {
    icon: <Banknote />,
    title: "Rent as it lands",
    body: "Each mobile money payment receipted against the lease, with arrears flagged the day they occur.",
  },
  {
    icon: <FileSignature />,
    title: "Contracts on file",
    body: "Signed digital leases with witnesses attached, stored where you can still find them in three years.",
  },
  {
    icon: <Wrench />,
    title: "What is broken",
    body: "Faults raised by tenants, what Field Ops is doing about them, and what it cost to fix.",
  },
  {
    icon: <Eye />,
    title: "Nothing to file",
    body: "No forms, no uploads, no dashboard to maintain. Reading it is the whole of your job.",
  },
];

export default function LandlordsPage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="kaa-wash relative overflow-hidden border-b border-border">
        <div className="grid-lines absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="shell relative grid items-center gap-16 py-24 lg:grid-cols-[1.05fr_1fr] lg:py-28">
          <Reveal>
            <Badge tone="brand" className="mb-6">
              <Handshake />
              Managed by Kaa Field Ops
            </Badge>
            <h1 className="text-balance text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl xl:text-6xl">
              Own the building. Skip the job that comes with it.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-foreground-muted">
              You will not upload a listing, screen a stranger, or chase anybody for rent. A Kaa Field Ops
              agent visits your property, takes it on, and runs it. Your part is to open the app and see how
              it is doing.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="#how-we-find-you" size="lg">
                How an agent reaches you
              </ButtonLink>
              <ButtonLink href="#sign-in" size="lg" variant="outline">
                <Smartphone />
                Already enrolled? Sign in
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal direction="scale" delay={140}>
            <Card className="p-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
                What it costs you
              </p>
              <dl className="mt-6 space-y-4">
                <Row label="An agent visiting and assessing" value="Free" />
                <Row label="Photography and geo-tagging" value="Free" />
                <Row label="Listing and marketing" value="Free" />
                <Row label="Tenant vetting on NIDA" value="Free" />
                <Row label="Rent collection and reporting" value="Free" />
                <Row
                  label="When Kaa fills the unit"
                  value="up to 5%"
                  note="of the first year's rent, charged once"
                  emphasis
                />
              </dl>
              <p className="mt-7 border-t border-border pt-6 text-sm leading-relaxed text-foreground-muted">
                You pay only when a unit is actually let. An empty unit costs you nothing on Kaa. It costs
                you the rent you are not collecting, which is the point.
              </p>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ── How the handover works ──────────────────────────────── */}
      <section className="py-24 lg:py-28">
        <div className="shell">
          <Reveal className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-kaa-700 dark:text-kaa-400">
              The handover
            </p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
              One visit, and it is off your hands.
            </h2>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-foreground-muted">
              Kaa Field Ops is our property management arm, built together with an established Tanzanian
              dalali whose people already work these wards. They are the ones who come to you.
            </p>
          </Reveal>

          <RevealGroup className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4" step={110}>
            <Step
              n="01"
              icon={<PhoneCall />}
              title="You leave a number"
              body="That is the entire application. A Field Ops supervisor calls to arrange a time that suits you."
            />
            <Step
              n="02"
              icon={<Camera />}
              title="An agent comes to the property"
              body="They meet you, walk the units, photograph every room, pin the gate on GPS and write down the real terms."
            />
            <Step
              n="03"
              icon={<Fingerprint />}
              title="We find and vet the tenant"
              body="Applicants are checked on their 20 digit NIDA number with a selfie and photographs of the card before they ever view."
            />
            <Step
              n="04"
              icon={<FileSignature />}
              title="We run the tenancy"
              body="Digital contract with witnesses, rent collection, arrears, maintenance. You are told, not asked."
            />
          </RevealGroup>
        </div>
      </section>

      {/* ── The vacancy argument ────────────────────────────────── */}
      <section className="border-y border-border bg-ink-950 py-24 text-white lg:py-28 dark:bg-ink-900">
        <div className="shell grid gap-16 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <Reveal direction="left">
            <TrendingDown className="size-8 text-kaa-400" />
            <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
              An empty month never comes back.
            </h2>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-white/70">
              A unit at <span className="tnum">{money(700_000)}</span> a month standing empty for two months
              has cost you <span className="tnum">{money(1_400_000)}</span>, many times any facilitation fee.
              Speed of letting is the number that matters, and it is the number Kaa is built to move.
            </p>
          </Reveal>

          <RevealGroup direction="right" className="grid gap-4 sm:grid-cols-2" step={80}>
            <DarkCard
              icon={<Camera />}
              title="Real listings let faster"
              body="Photographs taken on site and honest upfront costs bring genuine enquiries and far fewer no-shows."
            />
            <DarkCard
              icon={<ShieldCheck />}
              title="Fewer wasted viewings"
              body="Tenants see the deposit and months upfront before they book, so whoever turns up can afford it."
            />
            <DarkCard
              icon={<UsersRound />}
              title="A city-wide pool"
              body="Kaa reaches tenants searching your ward from anywhere in Dar, plus everyone on the WhatsApp assistant."
            />
            <DarkCard
              icon={<BadgeCheck />}
              title="Vetted before the keys"
              body="NIDA verification happens before a viewing is booked, not after somebody is already living there."
            />
          </RevealGroup>
        </div>
      </section>

      {/* ── What you see ────────────────────────────────────────── */}
      <section id="sign-in" className="py-24 lg:py-28">
        <div className="shell">
          <Reveal className="max-w-3xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
              What you actually see.
            </h2>
            <p className="mt-5 text-lg text-foreground-muted">
              Sign in on the web or open the Kaa app. Same portfolio, same numbers, read only by design.
            </p>
          </Reveal>

          <RevealGroup className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {watching.map((item) => (
              <Card key={item.title} interactive className="h-full p-7">
                <span className="flex size-11 items-center justify-center rounded-xl bg-kaa-50 text-kaa-700 dark:bg-kaa-950 dark:text-kaa-400 [&_svg]:size-5">
                  {item.icon}
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-foreground-muted">{item.body}</p>
              </Card>
            ))}
          </RevealGroup>

          <Reveal className="mt-12">
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/app" size="lg">
                <Smartphone />
                Open the Kaa app
              </ButtonLink>
              <ButtonLink href="/landlord/sign-in" size="lg" variant="outline">
                Sign in on the web
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── How Field Ops reaches you ───────────────────────────── */}
      <section id="how-we-find-you" className="border-t border-border bg-surface py-24 lg:py-28">
        <div className="shell">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
              You do not sign up for Kaa. Kaa comes to you.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-foreground-muted">
              There is no landlord registration on this site, and there never will be. Kaa Field Ops
              agents work a ward at a time, find the empty units, and knock. Your part starts when
              one of them is standing at your gate.
            </p>
          </Reveal>

          <RevealGroup className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "An agent finds the unit",
                body: "Field Ops walks the ward, spots what is empty, and traces the owner. Nobody waits for you to hear about Kaa.",
              },
              {
                step: "02",
                title: "They explain Kaa at your gate",
                body: "What it costs, what it does, and what changes. An hour of your time, once. You decide there and then.",
              },
              {
                step: "03",
                title: "They enrol the property for you",
                body: "The agent captures the unit on site — GPS, photographs, terms — and Kaa creates your account. You receive the login, not a form.",
              },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 90}>
                <Card className="h-full p-7">
                  <p className="tnum text-xs font-semibold uppercase tracking-wider text-kaa-700 dark:text-kaa-400">
                    Step {item.step}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-foreground-muted">{item.body}</p>
                </Card>
              </Reveal>
            ))}
          </RevealGroup>

          <Reveal className="mx-auto mt-12 max-w-2xl text-center">
            <p className="text-sm leading-relaxed text-foreground-subtle">
              Once your property is enrolled it appears in the Kaa app and in the Kaa WhatsApp
              assistant at the same moment, from the same database. There is nothing further for you
              to publish anywhere.
            </p>
          </Reveal>
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

function Step({
  n,
  icon,
  title,
  body,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card interactive className="group h-full p-7">
      <div className="flex items-center justify-between">
        <span className="flex size-11 items-center justify-center rounded-xl bg-kaa-50 text-kaa-700 transition-transform duration-500 group-hover:scale-110 dark:bg-kaa-950 dark:text-kaa-400 [&_svg]:size-5">
          {icon}
        </span>
        <span className="tnum text-sm font-semibold text-foreground-subtle">{n}</span>
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2.5 text-sm leading-relaxed text-foreground-muted">{body}</p>
    </Card>
  );
}

function DarkCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="h-full rounded-card border border-white/10 bg-white/5 p-6 transition-colors hover:border-kaa-400/40 hover:bg-white/[0.07]">
      <span className="flex size-10 items-center justify-center rounded-lg bg-kaa-500/15 text-kaa-400 [&_svg]:size-4">
        {icon}
      </span>
      <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/65">{body}</p>
    </div>
  );
}
