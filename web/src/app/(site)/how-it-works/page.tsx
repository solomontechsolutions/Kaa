import { BadgeCheck, Camera, Crosshair, PhoneCall, ScrollText, Search, Smartphone, XCircle } from "lucide-react";
import type { Metadata } from "next";

import { Badge, ButtonLink, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How a Kaa listing gets verified — GPS pinned on site, photographed the same day, confirmed with the landlord, and costs stated before you travel.",
};

const pipeline = [
  {
    icon: <Crosshair />,
    title: "A field agent stands at the gate",
    body: "Kaa agents work assigned wards. They take a GPS pin on site, with the phone's accuracy recorded alongside it. Anything above 10 metres is rejected — at that distance a pin can land on the neighbouring plot, which is how tenants end up at the wrong house.",
  },
  {
    icon: <Camera />,
    title: "Photographs, the same day",
    body: "Every room, the kitchen, the bathroom, the compound, and the water source. Each photo carries the time and place it was taken, so a listing cannot be padded out with pictures from a different house or a different year.",
  },
  {
    icon: <PhoneCall />,
    title: "The landlord confirms it",
    body: "Kaa calls the owner directly to confirm the unit is genuinely free, that the rent quoted is the rent charged, and that they agree to list. No listing goes live on a broker's say-so.",
  },
  {
    icon: <ScrollText />,
    title: "The real cost is written down",
    body: "Months upfront, deposit, and what utilities cost. In Tanzania the advance is often six to twelve months — that number belongs on the listing, not sprung on you at the gate after you have travelled across the city.",
  },
  {
    icon: <BadgeCheck />,
    title: "A reviewer signs it off",
    body: "A Kaa reviewer checks the pin, the photos and the paperwork before publishing. Anything incomplete goes back to the agent with a note. The agent is only paid once it passes.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="kaa-wash border-b border-border">
        <div className="mx-auto w-full max-w-4xl px-5 py-20 lg:px-8 lg:py-24">
          <Badge tone="brand" className="mb-5">
            For tenants
          </Badge>
          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            What &ldquo;verified&rdquo; actually means on Kaa.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-foreground-muted">
            Plenty of sites say verified and mean somebody typed an address into a form. On Kaa it means a
            named person went to the property, and there is a record of it.
          </p>
        </div>
      </section>

      {/* ── Verification pipeline ───────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto w-full max-w-4xl px-5 lg:px-8">
          <ol className="space-y-10">
            {pipeline.map((step, i) => (
              <li key={step.title} className="flex gap-5 sm:gap-7">
                <div className="flex flex-col items-center">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-kaa-50 text-kaa-700 dark:bg-kaa-950 dark:text-kaa-400 [&_svg]:size-5">
                    {step.icon}
                  </span>
                  {i < pipeline.length - 1 && <span className="mt-2 w-px flex-1 bg-border" />}
                </div>
                <div className="pb-2">
                  <p className="tnum text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                    Step {String(i + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-1.5 text-xl font-semibold tracking-tight">{step.title}</h2>
                  <p className="mt-2.5 text-pretty leading-relaxed text-foreground-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── What gets rejected ──────────────────────────────────── */}
      <section className="border-y border-border bg-surface py-20 lg:py-24">
        <div className="mx-auto w-full max-w-4xl px-5 lg:px-8">
          <h2 className="text-balance text-3xl font-semibold tracking-tight">
            What we throw out.
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-foreground-muted">
            A platform is only as trustworthy as the listings it refuses.
          </p>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "GPS accuracy worse than 10 metres",
              "Photos that repeat the same room twice",
              "A landlord who cannot show proof of ownership",
              "Rent that changes when Kaa calls to confirm",
              "Units already let but left up to attract calls",
              "Listings without the upfront cost declared",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                <XCircle className="mt-0.5 size-4 shrink-0 text-[var(--color-danger)]" />
                <span className="text-sm text-foreground-muted">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Then what ───────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto w-full max-w-4xl px-5 lg:px-8">
          <h2 className="text-balance text-3xl font-semibold tracking-tight">Once you find a place.</h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <Card className="p-6">
              <Search className="size-5 text-kaa-600 dark:text-kaa-400" />
              <h3 className="mt-3.5 font-semibold tracking-tight">Book a viewing</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                Choose a slot in the app or over WhatsApp. A Kaa agent meets you at the property — you are
                never sent to a stranger&rsquo;s gate alone.
              </p>
            </Card>
            <Card className="p-6">
              <ScrollText className="size-5 text-kaa-600 dark:text-kaa-400" />
              <h3 className="mt-3.5 font-semibold tracking-tight">Sign a real lease</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                A digital agreement signed on your phone, stating rent, term, deposit and notice. Both sides
                keep a copy.
              </p>
            </Card>
            <Card className="p-6">
              <Smartphone className="size-5 text-kaa-600 dark:text-kaa-400" />
              <h3 className="mt-3.5 font-semibold tracking-tight">Pay and get a receipt</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                Rent by M-Pesa, Tigo Pesa or Airtel Money. Every payment is logged against your lease, so
                there is never an argument about what you paid.
              </p>
            </Card>
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <ButtonLink href="/#get-the-app" size="lg">
              Get the Kaa app
            </ButtonLink>
            <ButtonLink href="/landlords" size="lg" variant="outline">
              I have property to rent
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
