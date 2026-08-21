import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Building2,
  Camera,
  Clock,
  Crosshair,
  FileSignature,
  Fingerprint,
  MapPin,
  MessageCircle,
  ScrollText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UsersRound,
  Wallet,
} from "lucide-react";

import { KaaMark } from "@/components/brand/logo";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { CountUp, Reveal, RevealGroup } from "@/components/motion/reveal";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { Thumb } from "@/components/ui/stat";
import { money } from "@/lib/format";

export default function HomePage() {
  return (
    <>
      {/* ══ Hero ══════════════════════════════════════════════════ */}
      <section className="kaa-wash relative overflow-hidden">
        <div className="grid-lines absolute inset-0 opacity-60" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-40 top-[-18rem] size-[46rem] rounded-full bg-kaa-400/12 blur-3xl"
          aria-hidden="true"
        />
        <div className="shell relative grid items-center gap-16 pb-24 pt-20 lg:grid-cols-[1.05fr_1fr] lg:pb-32 lg:pt-28">
          <div>
            <Reveal>
              <Badge tone="brand" className="mb-7">
                <Sparkles />
                Now onboarding landlords across Dar es Salaam
              </Badge>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="text-balance text-[2.75rem] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-6xl xl:text-7xl">
                Your property, <span className="kaa-gradient-text">professionally run</span>. Without
                you lifting a finger.
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-7 max-w-xl text-pretty text-lg leading-relaxed text-foreground-muted xl:text-xl">
                Kaa Field Ops visits your property, photographs it, lists it and manages it. We bring the
                tenants, vet every one of them on NIDA, and put the tenancy on a digital contract. You just
                watch it happen.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink href="/landlords" size="lg" className="group">
                  <Building2 />
                  List my property
                  <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                </ButtonLink>
                <ButtonLink href="/app" size="lg" variant="outline">
                  <Smartphone />
                  I am looking for a home
                </ButtonLink>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <dl className="mt-14 grid max-w-xl grid-cols-3 gap-8 border-t border-border/70 pt-8">
                <Metric value={<CountUp to={51} suffix="%" />} label="of Dar households rent" />
                <Metric value={<CountUp to={20} />} label="digit NIDA check on every tenant" />
                <Metric value={<span className="tnum">TSh 0</span>} label="dalali fee, ever" />
              </dl>
            </Reveal>
          </div>

          {/* ── Listing card preview ──────────────────────────── */}
          <Reveal direction="scale" delay={200} className="relative">
            <div
              className="absolute -inset-6 rounded-[2.5rem] bg-kaa-500/10 blur-3xl"
              aria-hidden="true"
            />
            <Card className="relative overflow-hidden p-0 shadow-[var(--shadow-elev-3)]">
              <div className="relative">
                <Thumb seed="hero-listing" className="h-60 w-full rounded-none" />
                <div className="absolute left-4 top-4 flex gap-2">
                  <Badge tone="brand" className="bg-white/95 shadow-sm backdrop-blur dark:bg-ink-900/95">
                    <ShieldCheck />
                    Visited by Kaa
                  </Badge>
                </div>
                <div className="absolute bottom-4 right-4">
                  <Badge tone="neutral" className="bg-white/95 shadow-sm backdrop-blur dark:bg-ink-900/95">
                    <Camera />
                    <span className="tnum">22</span> photos
                  </Badge>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold tracking-tight">Bahari Court, A2</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground-muted">
                      <MapPin className="size-3.5 shrink-0" />
                      Mikocheni, Kinondoni
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tnum text-xl font-semibold text-kaa-700 dark:text-kaa-400">
                      {money(700_000)}
                    </p>
                    <p className="text-xs text-foreground-subtle">per month</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge tone="outline">
                    <span className="tnum">2</span> bed
                  </Badge>
                  <Badge tone="outline">
                    <span className="tnum">2</span> bath
                  </Badge>
                  <Badge tone="outline">
                    <span className="tnum">96</span> m²
                  </Badge>
                  <Badge tone="outline">Parking</Badge>
                </div>

                {/* The number tenants get ambushed with, stated up front. */}
                <div className="mt-5 rounded-xl border border-kaa-200 bg-kaa-50 p-4 dark:border-kaa-900 dark:bg-kaa-950/60">
                  <p className="text-xs font-medium text-kaa-800 dark:text-kaa-300">
                    <span className="tnum">6</span> months upfront plus <span className="tnum">1</span> month
                    deposit
                  </p>
                  <p className="tnum mt-1 text-base font-semibold text-kaa-900 dark:text-kaa-200">
                    {money(4_900_000)} to move in
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-foreground-subtle">
                  <Crosshair className="size-3.5" />
                  Pinned to <span className="tnum">±3.9 m</span> · managed by Kaa Field Ops
                </div>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ══ The problem ═══════════════════════════════════════════ */}
      <section className="border-y border-border bg-surface py-24 lg:py-28">
        <div className="shell">
          <Reveal className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-kaa-700 dark:text-kaa-400">
              Why Kaa exists
            </p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
              Renting in Tanzania costs more than rent.
            </h2>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-foreground-muted">
              The search runs through informal brokers. Tenants pay to view houses that are already taken.
              Landlords hand their building to whoever turns up and hope for the best.
            </p>
          </Reveal>

          <RevealGroup className="mt-14 grid gap-6 md:grid-cols-3">
            <ProblemCard
              icon={<Wallet />}
              title="Viewing fees that buy nothing"
              body="A dalali charges to open a gate. Ten viewings later a tenant has paid for a service that produced no home."
            />
            <ProblemCard
              icon={<Clock />}
              title="Landlords doing a second job"
              body="Chasing rent, screening strangers, fixing taps at night. Owning property in Dar is unpaid work nobody signed up for."
            />
            <ProblemCard
              icon={<Ban />}
              title="Nobody is accountable"
              body="No contract, no receipt, no recourse. When a deposit disappears or a tenant vanishes, there is nowhere to take it."
            />
          </RevealGroup>
        </div>
      </section>

      {/* ══ The managed model ═════════════════════════════════════ */}
      <section className="py-24 lg:py-28">
        <div className="shell">
          <Reveal className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-kaa-700 dark:text-kaa-400">
              The Kaa model
            </p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
              You do not list your property. We do.
            </h2>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-foreground-muted">
              Kaa Field Ops is our property management arm, built with an established Tanzanian dalali who
              already knows these streets. An agent comes to you, and from that point the work is ours.
            </p>
          </Reveal>

          <RevealGroup className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4" step={110}>
            <StepCard
              n="01"
              icon={<UsersRound />}
              title="An agent visits you"
              body="A named Kaa Field Ops agent comes to the property, meets you, and takes over from there. No forms, no uploading, no app to learn."
            />
            <StepCard
              n="02"
              icon={<Camera />}
              title="We capture and list it"
              body="Photographs of every room, a GPS pin at the gate, and the real cost of moving in written down. Then it goes live."
            />
            <StepCard
              n="03"
              icon={<Fingerprint />}
              title="We vet the tenant"
              body="Every applicant is checked against their 20 digit NIDA number, with a selfie and photographs of the card itself."
            />
            <StepCard
              n="04"
              icon={<FileSignature />}
              title="We run the tenancy"
              body="Digital contract, witnesses, rent collection, arrears and maintenance. You watch it from your phone."
            />
          </RevealGroup>
        </div>
      </section>

      {/* ══ Landlord view ═════════════════════════════════════════ */}
      <section className="border-y border-border bg-ink-950 py-24 text-white lg:py-28 dark:bg-ink-900">
        <div className="shell grid gap-16 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <Reveal direction="left">
            <p className="text-sm font-semibold uppercase tracking-wider text-kaa-400">For landlords</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
              Your only job is to watch.
            </h2>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-white/70">
              Open the Kaa app or sign in on the web and see exactly what is happening: which units are let,
              who is in them, what has been paid, what is outstanding, and what is broken. Nothing to file,
              nothing to chase.
            </p>
            <ButtonLink href="/landlords" variant="outline" size="lg" className="mt-9 border-white/25 text-white hover:bg-white/10">
              See the landlord view
            </ButtonLink>
          </Reveal>

          <RevealGroup direction="right" className="grid gap-4 sm:grid-cols-2" step={80}>
            <DarkCard
              icon={<Wallet />}
              title="Rent, tracked"
              body="Every payment receipted against the lease. Arrears surfaced the day they happen, not the month after."
            />
            <DarkCard
              icon={<BadgeCheck />}
              title="Who is in your building"
              body="Names, NIDA verification status, lease dates and contact details for every tenant in every unit."
            />
            <DarkCard
              icon={<ScrollText />}
              title="Contracts on file"
              body="Signed digital leases with witnesses attached, stored where you can find them years later."
            />
            <DarkCard
              icon={<Building2 />}
              title="Occupancy at a glance"
              body="What is let, what is empty, what it is earning, and what an empty month is costing you."
            />
          </RevealGroup>
        </div>
      </section>

      {/* ══ WhatsApp ══════════════════════════════════════════════ */}
      <section className="py-24 lg:py-28">
        <div className="shell grid gap-16 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <Reveal direction="left">
            <Badge tone="brand" className="mb-6">
              <MessageCircle />
              No download required
            </Badge>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
              House hunting, in the app Tanzania already uses.
            </h2>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-foreground-muted">
              Message the Kaa assistant on WhatsApp. Tell it where you want to live, what you can pay and
              what you need. It sends back real listings with photos, the full cost of moving in, and a pin
              you can open in Maps. Pick one and it hands you the link to sign.
            </p>
            <ButtonLink href="/whatsapp" size="lg" className="mt-9">
              How the assistant works
            </ButtonLink>
          </Reveal>

          <Reveal direction="right" delay={120}>
            <WhatsAppPreview />
          </Reveal>
        </div>
      </section>

      {/* ══ Trust ═════════════════════════════════════════════════ */}
      <section className="border-y border-border bg-surface py-24 lg:py-28">
        <div className="shell">
          <Reveal className="max-w-3xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
              Every tenancy on the record.
            </h2>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-foreground-muted">
              The informal market runs on handshakes, which is exactly why it fails everyone in it. Kaa
              replaces the handshake with a document that both sides keep.
            </p>
          </Reveal>

          <RevealGroup className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <VerifyCard
              icon={<Fingerprint />}
              title="NIDA verified"
              body="The tenant's 20 digit National Identification Number, checked before they are ever shown a property."
            />
            <VerifyCard
              icon={<Camera />}
              title="Selfie and card"
              body="A live selfie and photographs of the NIDA card, matched to the number on file."
            />
            <VerifyCard
              icon={<FileSignature />}
              title="Digital contract"
              body="Signed on the phone, with the tenant's number attached. Both sides keep a copy that does not go missing."
            />
            <VerifyCard
              icon={<UsersRound />}
              title="Witnessed"
              body="The tenant sends the contract to their own witnesses, who confirm it. The tenancy has people standing behind it."
            />
          </RevealGroup>
        </div>
      </section>

      {/* ══ Pricing ═══════════════════════════════════════════════ */}
      <section className="py-24 lg:py-28">
        <div className="shell">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
              One price. No viewing fees, ever.
            </h2>
          </Reveal>

          <RevealGroup className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2">
            <Card className="p-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">Tenants</p>
              <p className="mt-5 flex items-baseline gap-2">
                <span className="tnum text-4xl font-semibold tracking-tight">{money(10_000)}</span>
                <span className="text-foreground-muted">per year</span>
              </p>
              <p className="mt-4 text-sm leading-relaxed text-foreground-muted">
                Every verified listing, unlimited viewings, and a real contract at the end of it.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  "No dalali fee and no viewing fee",
                  "The cost of moving in shown before you travel",
                  "Search on WhatsApp or in the app",
                  "Digital lease and mobile money receipts",
                ].map((point) => (
                  <Tick key={point}>{point}</Tick>
                ))}
              </ul>
              <ButtonLink href="/app" className="mt-8 w-full">
                Open Kaa
              </ButtonLink>
            </Card>

            <Card className="p-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
                Landlords
              </p>
              <p className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight">Free</span>
                <span className="text-foreground-muted">to list and manage</span>
              </p>
              <p className="mt-4 text-sm leading-relaxed text-foreground-muted">
                Kaa Field Ops manages the property at no cost to you. Kaa never charges a landlord a
                subscription or a commission — the <span className="tnum">10%</span> service charge is
                billed to the tenant, separately from your rent.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  "An agent visits, photographs and lists it for you",
                  "Tenants vetted on NIDA before they view",
                  "Rent collection, arrears and maintenance handled",
                  "Watch it all from the app or the web",
                ].map((point) => (
                  <Tick key={point}>{point}</Tick>
                ))}
              </ul>
              <ButtonLink href="/landlords" variant="outline" className="mt-8 w-full">
                List my property
              </ButtonLink>
            </Card>
          </RevealGroup>
        </div>
      </section>

      {/* ══ Waitlist ══════════════════════════════════════════════ */}
      <section id="get-the-app" className="border-t border-border py-24 lg:py-32">
        <div className="shell">
          <Reveal className="mx-auto max-w-2xl text-center">
            <KaaMark className="mx-auto size-14" />
            <h2 className="mt-7 text-balance text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
              Be first when Kaa opens in your ward.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-foreground-muted">
              We are onboarding Dar es Salaam ward by ward. Leave your number and we will tell you the day we
              reach yours.
            </p>
            <div className="mx-auto mt-10 max-w-xl text-left">
              <WaitlistForm />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

// ── Section pieces ───────────────────────────────────────────────

function Metric({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-1.5 text-xs leading-snug text-foreground-muted">{label}</dt>
      <dd className="text-3xl font-semibold tracking-tight">{value}</dd>
    </div>
  );
}

function ProblemCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card interactive className="h-full p-7">
      <span className="flex size-11 items-center justify-center rounded-xl bg-background text-foreground-muted [&_svg]:size-5">
        {icon}
      </span>
      <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2.5 text-sm leading-relaxed text-foreground-muted">{body}</p>
    </Card>
  );
}

function VerifyCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card interactive className="h-full p-6">
      <span className="flex size-10 items-center justify-center rounded-lg bg-kaa-50 text-kaa-700 dark:bg-kaa-950 dark:text-kaa-400 [&_svg]:size-5">
        {icon}
      </span>
      <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{body}</p>
    </Card>
  );
}

function StepCard({
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

function Tick({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <BadgeCheck className="mt-0.5 size-4 shrink-0 text-kaa-600 dark:text-kaa-400" />
      <span className="text-foreground-muted">{children}</span>
    </li>
  );
}

/** A short, honest reconstruction of the assistant thread. */
function WhatsAppPreview() {
  const thread = [
    { from: "user", text: "Natafuta nyumba Mikocheni, bajeti 700,000" },
    {
      from: "bot",
      text: "Nimekuelewa. Vyumba vingapi vya kulala, na unahitaji maegesho?",
    },
    { from: "user", text: "2 bedroom, na parking" },
    {
      from: "bot",
      text: "Nimepata 3 zilizothibitishwa Mikocheni. Ya kwanza: Bahari Court A2, TSh 700,000 kwa mwezi, miezi 6 mbele.",
      card: true,
    },
  ];

  return (
    <div className="mx-auto max-w-sm rounded-[2rem] border border-border bg-surface-raised p-3 shadow-[var(--shadow-elev-3)]">
      <div className="rounded-[1.5rem] bg-surface p-4">
        <div className="flex items-center gap-2.5 border-b border-border pb-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-kaa-500 text-ink-950">
            <KaaMark className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Kaa</p>
            <p className="text-xs text-foreground-subtle">online</p>
          </div>
        </div>

        <ul className="mt-4 space-y-2.5">
          {thread.map((message, i) => (
            <li
              key={i}
              className={message.from === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  message.from === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-md bg-kaa-500 px-3.5 py-2.5 text-sm text-ink-950"
                    : "max-w-[85%] rounded-2xl rounded-bl-md bg-surface-raised px-3.5 py-2.5 text-sm"
                }
              >
                {message.text}
                {message.card && (
                  <div className="mt-2.5 overflow-hidden rounded-xl border border-border bg-background">
                    <Thumb seed="wa-card" className="h-20 w-full rounded-none" />
                    <div className="p-2.5">
                      <p className="text-xs font-semibold">Bahari Court, A2</p>
                      <p className="tnum text-xs text-foreground-muted">TSh 700,000 / mwezi</p>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
