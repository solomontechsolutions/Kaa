import { BadgeCheck, Minus } from "lucide-react";
import type { Metadata } from "next";

import { Badge, ButtonLink, Card } from "@/components/ui";
import { money, percent } from "@/lib/format";
import { KAA_RENTAL_SERVICE_RATE } from "@/lib/pricing/service-charge";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Kaa costs tenants TSh 10,000 a year with no viewing fees, plus a 10% service charge shown separately from your landlord's rent. Landlords pay Kaa nothing, ever.",
};

const KAA_RATE_LABEL = percent(KAA_RENTAL_SERVICE_RATE * 100);

const comparison = [
  { feature: "Access to every verified listing", tenant: true, landlord: false },
  { feature: "Unlimited viewing bookings", tenant: true, landlord: false },
  { feature: "Upfront cost shown before you travel", tenant: true, landlord: false },
  { feature: "Digital lease and receipts", tenant: true, landlord: true },
  { feature: "Free listing and photography", tenant: false, landlord: true },
  { feature: "Property, unit and tenant management", tenant: false, landlord: true },
  { feature: "Rent collection and arrears tracking", tenant: false, landlord: true },
  { feature: "Viewing requests routed to a Kaa agent", tenant: false, landlord: true },
];

export default function PricingPage() {
  return (
    <>
      <section className="kaa-wash border-b border-border">
        <div className="shell py-24 text-center lg:py-28">
          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            No viewing fees. Not now, not ever.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-foreground-muted">
            The informal market charges you to look at a house. Kaa charges one subscription a year and
            nothing else. The whole point is that finding a home should not be a series of small payments
            to strangers.
          </p>
        </div>
      </section>

      {/* ── Plans ───────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="shell grid gap-6 md:grid-cols-2">
          <Card className="flex flex-col p-8">
            <Badge tone="brand" className="self-start">
              Tenants
            </Badge>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="tnum text-5xl font-semibold tracking-tight">{money(10_000)}</span>
            </p>
            <p className="mt-1 text-foreground-muted">per year</p>
            <p className="mt-5 text-sm leading-relaxed text-foreground-muted">
              Roughly what one dalali charges to open a single gate, except this covers the whole search,
              for a year. Once you rent through Kaa, a separate {KAA_RATE_LABEL} service charge applies on
              top of your landlord&rsquo;s rent, shown as its own line — never hidden inside the rent.
            </p>
            <ul className="mt-7 flex-1 space-y-3">
              {[
                "Every verified listing, unlimited searching",
                "Unlimited viewing bookings with a Kaa agent",
                "Deposit and months upfront shown on every listing",
                "Digital lease signed on your phone",
                "Mobile-money rent payments with receipts",
                "Report a fault to your landlord in the app",
              ].map((item) => (
                <Tick key={item}>{item}</Tick>
              ))}
            </ul>
            <ButtonLink href="/#get-the-app" size="lg" className="mt-8">
              Get the Kaa app
            </ButtonLink>
          </Card>

          <Card className="flex flex-col p-8">
            <Badge tone="neutral" className="self-start">
              Landlords &amp; managers
            </Badge>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tracking-tight">Free</span>
            </p>
            <p className="mt-1 text-foreground-muted">
              {money(0)} to Kaa. Always.
            </p>
            <p className="mt-5 text-sm leading-relaxed text-foreground-muted">
              Listing, verification, photography and the whole Landlord portal cost nothing — no
              subscription, no commission, no facilitation fee. Kaa&rsquo;s {KAA_RATE_LABEL} service
              charge is billed separately to the tenant, on top of your rent, never taken from it.
            </p>
            <ul className="mt-7 flex-1 space-y-3">
              {[
                "Free listing, verification and photography",
                "Kaa Operators portal for your whole portfolio",
                "Tenants with NIDA-verified identity",
                "Rent collection, invoices and arrears tracking",
                "Digital leases with renewal reminders",
                "Maintenance requests in one queue",
              ].map((item) => (
                <Tick key={item}>{item}</Tick>
              ))}
            </ul>
            <ButtonLink href="/landlords" size="lg" variant="outline" className="mt-8">
              How Field Ops enrols you
            </ButtonLink>
          </Card>
        </div>
      </section>

      {/* ── Comparison ──────────────────────────────────────────── */}
      <section className="border-y border-border bg-surface py-20 lg:py-24">
        <div className="shell">
          <h2 className="text-balance text-center text-3xl font-semibold tracking-tight">
            What each side gets
          </h2>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-md border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                    Feature
                  </th>
                  <th className="border-b border-border px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                    Tenant
                  </th>
                  <th className="border-b border-border px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                    Landlord
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature}>
                    <td className="border-b border-border px-4 py-3.5 text-foreground-muted">{row.feature}</td>
                    <Cell on={row.tenant} />
                    <Cell on={row.landlord} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="shell">
          <h2 className="text-balance text-3xl font-semibold tracking-tight">Questions people ask</h2>
          <dl className="mt-10 space-y-8">
            <Faq
              q="Do I pay anything to view a house?"
              a="No. Viewings are included in the subscription, however many you book. If anyone asks you for a viewing fee on a Kaa property, report it in the app, that agent will be removed."
            />
            <Faq
              q="Does Kaa take a cut of my rent?"
              a={`No — your landlord's rent goes to your landlord, in full, unchanged. Once you rent through Kaa, Kaa adds its own ${KAA_RATE_LABEL} service charge as a separate line, for as long as the rental is active. Your rent and Kaa's charge are always shown apart, never combined into one number.`}
            />
            <Faq
              q="What do landlords pay Kaa?"
              a="Nothing. Kaa does not charge landlords a subscription, a commission or a listing fee — not once, not ever. A landlord lists and manages their property on Kaa for TSh 0."
            />
            <Faq
              q="Can I pay the subscription by mobile money?"
              a="Yes. M-Pesa, Tigo Pesa, Airtel Money or Halopesa. The provider's transaction fee is shown before you confirm."
            />
            <Faq
              q="What if I do not find a house?"
              a="The subscription runs for a year regardless, but there is no cap on how much you search or how many viewings you book in that time."
            />
          </dl>
        </div>
      </section>
    </>
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

function Cell({ on }: { on: boolean }) {
  return (
    <td className="border-b border-border px-4 py-3.5 text-center">
      {on ? (
        <BadgeCheck className="mx-auto size-4 text-kaa-600 dark:text-kaa-400" />
      ) : (
        <Minus className="mx-auto size-4 text-foreground-subtle" />
      )}
      <span className="sr-only">{on ? "Included" : "Not applicable"}</span>
    </td>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <dt className="font-semibold tracking-tight">{q}</dt>
      <dd className="mt-2 text-pretty leading-relaxed text-foreground-muted">{a}</dd>
    </div>
  );
}
