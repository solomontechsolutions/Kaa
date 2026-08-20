import {
  Ban,
  BadgeCheck,
  Building2,
  Camera,
  Clock,
  Crosshair,
  MapPin,
  MessageCircle,
  ScrollText,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
} from "lucide-react";

import { KaaMark } from "@/components/brand/logo";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { Thumb } from "@/components/ui/stat";
import { money } from "@/lib/format";

export default function HomePage() {
  return (
    <>
      {/* ══ Hero ══════════════════════════════════════════════════ */}
      <section className="kaa-wash relative overflow-hidden">
        <div className="grid-lines absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <Badge tone="brand" className="mb-6">
                <Sparkles />
                Now onboarding landlords in Dar es Salaam
              </Badge>

              <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Find a home you can <span className="kaa-gradient-text">trust</span>, straight from the
                landlord.
              </h1>

              <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-foreground-muted">
                Kaa lists only homes a field agent has stood in front of, photographed and pinned. No dalali
                fee. No fake listings. No wasted Saturdays.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="#get-the-app" size="lg">
                  <Smartphone />
                  Get the Kaa app
                </ButtonLink>
                <ButtonLink href="/landlords" size="lg" variant="outline">
                  <Building2 />
                  I have property to rent
                </ButtonLink>
              </div>

              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6">
                <Metric value="51%" label="of Dar households rent" />
                <Metric value="~1.5M" label="renting households" />
                <Metric value="TSh 0" label="dalali fee on Kaa" />
              </dl>
            </div>

            {/* ── Listing card preview ──────────────────────────── */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-kaa-500/8 blur-2xl" aria-hidden="true" />
              <Card className="relative overflow-hidden p-0 shadow-[var(--shadow-elev-3)]">
                <div className="relative">
                  <Thumb seed="hero-listing" className="h-56 w-full rounded-none" />
                  <div className="absolute left-4 top-4">
                    <Badge tone="brand" className="bg-white/95 shadow-sm backdrop-blur dark:bg-ink-900/95">
                      <ShieldCheck />
                      Verified by Kaa
                    </Badge>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold tracking-tight">Bahari Court, A2</h3>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-foreground-muted">
                        <MapPin className="size-3.5 shrink-0" />
                        Mikocheni, Kinondoni
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tnum text-lg font-semibold text-kaa-700 dark:text-kaa-400">
                        {money(700_000)}
                      </p>
                      <p className="text-xs text-foreground-subtle">per month</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge tone="outline">2 bed</Badge>
                    <Badge tone="outline">2 bath</Badge>
                    <Badge tone="outline">96 m²</Badge>
                    <Badge tone="outline">Parking</Badge>
                  </div>

                  {/* The number tenants get ambushed with, stated up front. */}
                  <div className="mt-4 rounded-xl border border-kaa-200 bg-kaa-50 p-3.5 dark:border-kaa-900 dark:bg-kaa-950/60">
                    <p className="text-xs font-medium text-kaa-800 dark:text-kaa-300">
                      6 months upfront + 1 month deposit
                    </p>
                    <p className="tnum mt-1 text-sm font-semibold text-kaa-900 dark:text-kaa-200">
                      {money(4_900_000)} to move in
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-xs text-foreground-subtle">
                    <Camera className="size-3.5" />
                    22 photos · pinned to ±3.9 m · checked 12 days ago
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ══ The problem ═══════════════════════════════════════════ */}
      <section className="border-y border-border bg-surface py-20 lg:py-24">
        <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-kaa-700 dark:text-kaa-400">
              Why Kaa exists
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Renting in Tanzania costs more than rent.
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-foreground-muted">
              The search runs through informal brokers. You pay to view houses that are already taken, that
              do not exist, or that look nothing like the photo on WhatsApp.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <ProblemCard
              icon={<Wallet />}
              title="Viewing fees that buy nothing"
              body="A dalali charges to open a gate. Ten viewings later you have paid for a service that produced no home."
            />
            <ProblemCard
              icon={<Clock />}
              title="Weeks of wasted Saturdays"
              body="No central list means calling twenty numbers to find out which houses are actually free this month."
            />
            <ProblemCard
              icon={<Ban />}
              title="Nobody is accountable"
              body="No contract, no receipt, no recourse. If the deposit disappears, there is nowhere to take it."
            />
          </div>
        </div>
      </section>

      {/* ══ What verified means ═══════════════════════════════════ */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-kaa-700 dark:text-kaa-400">
                Verified means verified
              </p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                A person went there. Here is the proof.
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-foreground-muted">
                Every Kaa listing is captured on site by a trained field agent — not scraped, not forwarded,
                not resubmitted from last year. Four checks before it reaches you.
              </p>
              <ButtonLink href="/how-it-works" variant="outline" className="mt-7">
                See how a listing gets verified
              </ButtonLink>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <VerifyCard
                icon={<Crosshair />}
                title="Pinned on site"
                body="GPS taken at the gate, within 10 metres. If the pin drifts, the listing is rejected."
              />
              <VerifyCard
                icon={<Camera />}
                title="Photographed that day"
                body="Every room, the kitchen, the bathroom, and the water source — timestamped."
              />
              <VerifyCard
                icon={<BadgeCheck />}
                title="Landlord confirmed"
                body="Kaa calls the owner to confirm the unit is free and the rent is what was quoted."
              />
              <VerifyCard
                icon={<ScrollText />}
                title="Costs stated upfront"
                body="Months upfront and deposit are shown before you travel, not at the gate."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══ How it works ══════════════════════════════════════════ */}
      <section className="border-y border-border bg-ink-950 py-20 text-white lg:py-24 dark:bg-ink-900">
        <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Four steps from searching to keys.
            </h2>
          </div>

          <ol className="mt-12 grid gap-8 md:grid-cols-4">
            <StepCard
              n="01"
              icon={<Search />}
              title="Search your ward"
              body="Filter by budget, bedrooms and how much you can put down upfront."
            />
            <StepCard
              n="02"
              icon={<MessageCircle />}
              title="Book a viewing"
              body="Pick a time in the app or on WhatsApp. A Kaa agent meets you there."
            />
            <StepCard
              n="03"
              icon={<ScrollText />}
              title="Sign digitally"
              body="A real lease, on your phone, with the terms you agreed — not a handshake."
            />
            <StepCard
              n="04"
              icon={<Smartphone />}
              title="Pay by mobile money"
              body="M-Pesa, Tigo Pesa, Airtel Money. Every shilling receipted."
            />
          </ol>
        </div>
      </section>

      {/* ══ Two portals ═══════════════════════════════════════════ */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Kaa is not only an app for tenants.
            </h2>
            <p className="mt-4 text-lg text-foreground-muted">
              Two web portals keep supply honest and running.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <PortalCard
              surface="Operators"
              href="/operators"
              headline="For landlords and property managers"
              body="Your whole portfolio in one place: units, tenants, leases, rent collection, arrears, maintenance, and the listings tenants see."
              points={[
                "Track occupancy and rent roll across every property",
                "Collect rent by mobile money with receipts and arrears tracking",
                "Approve listings before they publish to the Kaa app",
                "Route viewing requests to the agent covering that ward",
              ]}
            />
            <PortalCard
              surface="Field Ops"
              href="/field"
              headline="For Kaa field agents"
              body="Capture listings on a phone, in the field, with the proof attached. Get paid on approval."
              points={[
                "Guided capture: GPS pin, landlord details, photos, costs",
                `${money(2000)} per verified listing, ${money(5000)} per tenant who moves in`,
                "See exactly what a reviewer wants changed",
                "Track your balance and mobile-money payouts",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ══ Pricing ═══════════════════════════════════════════════ */}
      <section className="border-y border-border bg-surface py-20 lg:py-24">
        <div className="mx-auto w-full max-w-5xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              One price. No viewing fees, ever.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Card className="p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">Tenants</p>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="tnum text-4xl font-semibold tracking-tight">{money(10_000)}</span>
                <span className="text-foreground-muted">/ year</span>
              </p>
              <p className="mt-3 text-sm text-foreground-muted">
                Full access to every verified listing, unlimited viewing bookings, digital leases and receipts.
              </p>
              <ul className="mt-6 space-y-2.5">
                {[
                  "No dalali fee, no viewing fee",
                  "Costs to move in shown before you travel",
                  "Book viewings in the app or on WhatsApp",
                  "Digital lease and mobile-money receipts",
                ].map((point) => (
                  <Tick key={point}>{point}</Tick>
                ))}
              </ul>
              <ButtonLink href="#get-the-app" className="mt-7 w-full">
                Get the app
              </ButtonLink>
            </Card>

            <Card className="p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">Landlords</p>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight">Free</span>
                <span className="text-foreground-muted">to list</span>
              </p>
              <p className="mt-3 text-sm text-foreground-muted">
                Kaa Operators costs nothing to use. A facilitation fee of up to 5% applies only on a tenancy
                Kaa sources for you.
              </p>
              <ul className="mt-6 space-y-2.5">
                {[
                  "Free listing, verification and photography",
                  "Full property, tenant and lease management",
                  "Rent collection with arrears tracking",
                  "Up to 5% only when Kaa fills your unit",
                ].map((point) => (
                  <Tick key={point}>{point}</Tick>
                ))}
              </ul>
              <ButtonLink href="/landlords" variant="outline" className="mt-7 w-full">
                List your property
              </ButtonLink>
            </Card>
          </div>
        </div>
      </section>

      {/* ══ Waitlist ══════════════════════════════════════════════ */}
      <section id="get-the-app" className="py-20 lg:py-28">
        <div className="mx-auto w-full max-w-3xl px-5 text-center lg:px-8">
          <KaaMark className="mx-auto size-12 text-kaa-500" gradient id="cta-mark" />
          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Be first when Kaa opens in your ward.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-foreground-muted">
            The Kaa app launches in Dar es Salaam first. Leave your number and we will tell you the day it
            goes live where you are looking.
          </p>
          <div className="mx-auto mt-9 max-w-xl">
            <WaitlistForm />
          </div>
        </div>
      </section>
    </>
  );
}

// ── Section pieces ───────────────────────────────────────────────

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-1 text-xs leading-snug text-foreground-muted">{label}</dt>
      <dd className="tnum text-2xl font-semibold tracking-tight">{value}</dd>
    </div>
  );
}

function ProblemCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card className="p-6">
      <span className="flex size-10 items-center justify-center rounded-xl bg-background text-foreground-muted [&_svg]:size-5">
        {icon}
      </span>
      <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{body}</p>
    </Card>
  );
}

function VerifyCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card className="p-5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-kaa-50 text-kaa-700 dark:bg-kaa-950 dark:text-kaa-400 [&_svg]:size-4.5">
        {icon}
      </span>
      <h3 className="mt-3.5 text-sm font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{body}</p>
    </Card>
  );
}

function StepCard({ n, icon, title, body }: { n: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <li>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-kaa-500/15 text-kaa-400 [&_svg]:size-5">
          {icon}
        </span>
        <span className="tnum text-sm font-semibold text-white/40">{n}</span>
      </div>
      <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/65">{body}</p>
    </li>
  );
}

function PortalCard({
  surface,
  href,
  headline,
  body,
  points,
}: {
  surface: "Operators" | "Field Ops";
  href: string;
  headline: string;
  body: string;
  points: string[];
}) {
  return (
    <Card interactive className="flex flex-col p-7">
      <div className="flex items-center gap-2.5">
        <KaaMark className="size-7 text-kaa-500" gradient id={`portal-${surface.replace(/\s/g, "")}`} />
        <span className="text-lg font-semibold tracking-tight">Kaa</span>
        <Badge tone="brand">{surface}</Badge>
      </div>

      <h3 className="mt-5 text-xl font-semibold tracking-tight">{headline}</h3>
      <p className="mt-2.5 text-sm leading-relaxed text-foreground-muted">{body}</p>

      <ul className="mt-5 flex-1 space-y-2.5">
        {points.map((point) => (
          <Tick key={point}>{point}</Tick>
        ))}
      </ul>

      <ButtonLink href={href} variant="outline" className="mt-7">
        Open Kaa {surface}
      </ButtonLink>
    </Card>
  );
}

function Tick({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <BadgeCheck className="mt-0.5 size-4 shrink-0 text-kaa-600 dark:text-kaa-400" />
      <span className="text-foreground-muted">{children}</span>
    </li>
  );
}
