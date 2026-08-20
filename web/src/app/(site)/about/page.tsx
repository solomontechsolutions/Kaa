import type { Metadata } from "next";

import { KaaMark } from "@/components/brand/logo";
import { ButtonLink, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description: "Kaa is building the trusted rental layer for Tanzania — starting in Dar es Salaam.",
};

export default function AboutPage() {
  return (
    <>
      <section className="kaa-wash border-b border-border">
        <div className="mx-auto w-full max-w-4xl px-5 py-20 lg:px-8 lg:py-24">
          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Shelter is the second thing a family needs. It should not be the hardest to find.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-foreground-muted">
            Around half of Dar es Salaam&rsquo;s households rent, and almost every one of them found their
            home the same way: a phone number, a broker, a fee, and hope. Kaa is building the alternative —
            a rental market with a record, a receipt and a name attached to every listing.
          </p>
        </div>
      </section>

      {/* ── The name ────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto grid w-full max-w-5xl gap-12 px-5 lg:grid-cols-[1fr_1.3fr] lg:px-8">
          <div>
            <KaaMark className="size-16 text-kaa-500" gradient id="about-mark" />
            <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
              The name
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Kaa</h2>
            <p className="mt-4 text-pretty leading-relaxed text-foreground-muted">
              In Kiswahili, <em>kaa</em> means to sit, to stay, to settle — and it is also the word for a
              crab. The crab carries its home with it: adaptable, protective, always sheltered. Our mark
              holds both readings. Two claws for protection, an arch for shelter, and two dots for the
              people at the centre of it.
            </p>
            <p className="mt-4 text-pretty leading-relaxed text-foreground-muted">
              <span className="font-medium text-foreground">Stay. Settle. Belong.</span> — three words for
              what a home actually is, and the order in which it happens.
            </p>
          </div>
        </div>
      </section>

      {/* ── Principles ──────────────────────────────────────────── */}
      <section className="border-y border-border bg-surface py-20 lg:py-24">
        <div className="mx-auto w-full max-w-5xl px-5 lg:px-8">
          <h2 className="text-balance text-3xl font-semibold tracking-tight">How we build</h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Principle
              title="Verified or not listed"
              body="A listing nobody has visited is worse than no listing at all, because it teaches people not to trust the platform. We would rather have a hundred real homes than ten thousand rumours."
            />
            <Principle
              title="Integrate, don't displace"
              body="Brokers hold the knowledge of which units fall empty. Kaa turns that into paid, accountable work through Field Ops rather than pretending it can be routed around."
            />
            <Principle
              title="Swahili first, phone first"
              body="Kaa is built for the phone in a Tanzanian pocket, on Tanzanian data, in the language people actually use. Kiswahili is the default, not a translation layer."
            />
          </div>
        </div>
      </section>

      {/* ── Where we are ────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto w-full max-w-5xl px-5 lg:px-8">
          <h2 className="text-balance text-3xl font-semibold tracking-tight">Where we are</h2>
          <p className="mt-4 max-w-2xl text-lg text-foreground-muted">
            Kaa launches in Dar es Salaam, ward by ward. Density is what makes a marketplace useful, so we
            saturate a handful of wards before widening out.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { district: "Kinondoni", wards: "Mikocheni · Msasani · Kawe · Mwananyamala" },
              { district: "Ubungo", wards: "Sinza · Kimara · Mbezi · Manzese" },
              { district: "Ilala", wards: "Upanga · Kariakoo · Tabata" },
              { district: "Temeke", wards: "Mbagala · Kurasini · Chang'ombe" },
              { district: "Kigamboni", wards: "Kigamboni" },
              { district: "Next", wards: "Dodoma · Mwanza · Arusha" },
            ].map((row) => (
              <Card key={row.district} className="p-5">
                <p className="font-semibold tracking-tight">{row.district}</p>
                <p className="mt-1.5 text-sm text-foreground-muted">{row.wards}</p>
              </Card>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <ButtonLink href="/#get-the-app" size="lg">
              Join the waitlist
            </ButtonLink>
            <ButtonLink href="/field-ops" size="lg" variant="outline">
              Work with us
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

function Principle({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold tracking-tight">{title}</h3>
      <p className="mt-2.5 text-sm leading-relaxed text-foreground-muted">{body}</p>
    </Card>
  );
}
