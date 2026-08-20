import { Bike, Camera, HandCoins, MapPin, Smartphone, TrendingUp, UserCheck, Wallet } from "lucide-react";
import type { Metadata } from "next";

import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { money } from "@/lib/format";

export const metadata: Metadata = {
  title: "Become a Kaa field agent",
  description:
    "Earn TSh 2,000 per verified listing and TSh 5,000 for every tenant who moves in. Work your own ward with the Kaa Field Ops app.",
};

export default function FieldOpsPage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="kaa-wash border-b border-border">
        <div className="shell grid items-center gap-14 py-24 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div>
            <Badge tone="brand" className="mb-5">
              Kaa Field Ops
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Know your ward? Turn that into income.
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-foreground-muted">
              Kaa field agents find rental properties, photograph them, and bring landlords onto the
              platform. You get paid for every listing that passes review, and again when a tenant moves in.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="#apply" size="lg">
                Apply to join
              </ButtonLink>
              <ButtonLink href="/field" size="lg" variant="outline">
                See the agent app
              </ButtonLink>
            </div>
          </div>

          <Card className="p-7">
            <p className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
              What you earn
            </p>
            <div className="mt-5 space-y-5">
              <Payline
                icon={<Camera />}
                amount={money(2000)}
                label="per verified listing"
                note="Paid once a reviewer approves what you captured."
              />
              <Payline
                icon={<HandCoins />}
                amount={money(5000)}
                label="per tenant who moves in"
                note="Paid when a lease you sourced is signed."
              />
              <Payline
                icon={<TrendingUp />}
                amount="Monthly bonus"
                label="at 20+ approved listings"
                note="Performance tiers on top of your per-listing rate."
              />
            </div>
            <div className="mt-6 flex items-center gap-2.5 rounded-xl bg-kaa-50 p-3.5 dark:bg-kaa-950/60">
              <Wallet className="size-4 shrink-0 text-kaa-700 dark:text-kaa-400" />
              <p className="text-xs font-medium text-kaa-800 dark:text-kaa-300">
                Paid straight to your mobile money, M-Pesa, Tigo Pesa or Airtel Money.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Working with dalalis ────────────────────────────────── */}
      <section className="border-b border-border bg-surface py-20 lg:py-24">
        <div className="shell">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            If you already do this work, Kaa is not your competitor.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-foreground-muted">
            Brokers know the buildings, the caretakers and which units fall empty. Kaa formalises that
            knowledge rather than replacing it: you keep the relationships, we supply the tenants, the
            tooling and a payment that arrives on time.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            <Card className="p-6">
              <MapPin className="size-5 text-kaa-600 dark:text-kaa-400" />
              <h3 className="mt-3.5 font-semibold tracking-tight">Your own wards</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                Agents are assigned specific wards. You work the area you already know, without competing
                against every other agent in the city.
              </p>
            </Card>
            <Card className="p-6">
              <UserCheck className="size-5 text-kaa-600 dark:text-kaa-400" />
              <h3 className="mt-3.5 font-semibold tracking-tight">Landlords stay yours</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                Landlords you onboard remain attributed to you, so repeat business keeps earning long after
                the first listing.
              </p>
            </Card>
            <Card className="p-6">
              <Smartphone className="size-5 text-kaa-600 dark:text-kaa-400" />
              <h3 className="mt-3.5 font-semibold tracking-tight">One app, no paperwork</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                Capture, submit, track your balance and see exactly what a reviewer wants fixed, all from
                your phone.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ── What you need ───────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="shell grid gap-14 lg:grid-cols-2">
          <div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              What you need to start.
            </h2>
            <ul className="mt-8 space-y-4">
              {[
                { icon: <Smartphone />, text: "An Android phone with a working camera and GPS" },
                { icon: <UserCheck />, text: "A valid NIDA number, every Kaa agent is identity-verified" },
                { icon: <MapPin />, text: "Real knowledge of the ward you want to cover" },
                { icon: <Bike />, text: "The ability to move around your zone during the day" },
                { icon: <Wallet />, text: "A mobile money account in your own name" },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-foreground-muted [&_svg]:size-4">
                    {item.icon}
                  </span>
                  <span className="text-foreground-muted">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              How the work goes.
            </h2>
            <ol className="mt-8 space-y-6">
              {[
                { n: "01", title: "Training", body: "A short induction covering capture standards, how to talk to landlords, and the code of conduct." },
                { n: "02", title: "Zone assignment", body: "You are given wards to cover. Density beats spread. Saturating a ward is what makes Kaa useful." },
                { n: "03", title: "Capture", body: "Find a property, agree with the landlord, pin it, photograph it, and submit from the app." },
                { n: "04", title: "Review", body: "A reviewer approves it or sends it back with a note. Approval triggers your payment." },
                { n: "05", title: "Payout", body: "Balances settle to your mobile money on the payout run." },
              ].map((step) => (
                <li key={step.n} className="flex gap-4">
                  <span className="tnum shrink-0 text-sm font-semibold text-kaa-600 dark:text-kaa-400">
                    {step.n}
                  </span>
                  <div>
                    <p className="font-semibold tracking-tight">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Conduct ─────────────────────────────────────────────── */}
      <section className="border-y border-border bg-surface py-16">
        <div className="shell">
          <h2 className="text-xl font-semibold tracking-tight">The standard we hold</h2>
          <p className="mt-3 text-pretty leading-relaxed text-foreground-muted">
            No falsified data, no reused photos, no charging tenants a viewing fee, and no pressure on
            landlords. Kaa exists because the informal market has none of these guarantees. An agent who
            breaks them is removed from the network. The whole product rests on tenants being able to
            believe what they see.
          </p>
        </div>
      </section>

      {/* ── Apply ───────────────────────────────────────────────── */}
      <section id="apply" className="py-20 lg:py-24">
        <div className="shell text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Apply to join the network.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-foreground-muted">
            Leave your number and choose &ldquo;I want to be an agent&rdquo;. A supervisor will call you
            about the next induction in your area.
          </p>
          <div className="mx-auto mt-9 max-w-xl text-left">
            <WaitlistForm />
          </div>
        </div>
      </section>
    </>
  );
}

function Payline({
  icon,
  amount,
  label,
  note,
}: {
  icon: React.ReactNode;
  amount: string;
  label: string;
  note: string;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-foreground-muted [&_svg]:size-4">
        {icon}
      </span>
      <div>
        <p className="tnum font-semibold tracking-tight">
          {amount} <span className="text-sm font-normal text-foreground-muted">{label}</span>
        </p>
        <p className="mt-0.5 text-xs text-foreground-subtle">{note}</p>
      </div>
    </div>
  );
}
