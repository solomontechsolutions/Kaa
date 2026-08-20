import {
  BadgeCheck,
  FileSignature,
  Fingerprint,
  Images,
  MapPin,
  MessageCircle,
  Search,
  Signal,
  Smartphone,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";

import { KaaMark } from "@/components/brand/logo";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { Reveal, RevealGroup } from "@/components/motion/reveal";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { Thumb } from "@/components/ui/stat";

export const metadata: Metadata = {
  title: "The WhatsApp assistant",
  description:
    "Find a home by chatting on WhatsApp. Tell the Kaa assistant your ward, budget and what you need, and it sends verified listings with photos, costs and a pin.",
};

const thread = [
  { from: "user", text: "Habari. Natafuta nyumba Mikocheni." },
  {
    from: "bot",
    text: "Karibu Kaa. Bajeti yako ni kiasi gani kwa mwezi, na unahitaji vyumba vingapi vya kulala?",
  },
  { from: "user", text: "Mpaka 700,000. Vyumba 2." },
  {
    from: "bot",
    text: "Sawa. Kuna kitu lazima kiwepo? Kwa mfano maegesho, tanki la maji, au ulinzi.",
  },
  { from: "user", text: "Parking na maji ya uhakika" },
  {
    from: "bot",
    text: "Nimepata 3 zilizothibitishwa. Hii ndio ya kwanza:",
    card: {
      title: "Bahari Court, A2",
      ward: "Mikocheni, Kinondoni",
      rent: "TSh 700,000 / mwezi",
      move: "TSh 4,900,000 kuingia",
    },
  },
  {
    from: "bot",
    text: "Miezi 6 mbele pamoja na dhamana ya mwezi 1. Ukipenda hii, nitakutumia link ya kujaza mkataba.",
  },
  { from: "user", text: "Ndio, nataka hii" },
];

export default function WhatsAppPage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="kaa-wash relative overflow-hidden border-b border-border">
        <div className="grid-lines absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="shell relative grid items-center gap-16 py-24 lg:grid-cols-[1.05fr_1fr] lg:py-28">
          <Reveal>
            <Badge tone="brand" className="mb-6">
              <MessageCircle />
              No download, no data plan needed
            </Badge>
            <h1 className="text-balance text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl xl:text-6xl">
              Find a home by sending a message.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-foreground-muted">
              WhatsApp is where Tanzania already is, so Kaa lives there too. Tell the assistant which ward,
              what you can pay and what you need. It answers with real listings, real photographs and the
              full cost of moving in.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="#join" size="lg">
                <MessageCircle />
                Get the number
              </ButtonLink>
              <ButtonLink href="/app" size="lg" variant="outline">
                <Smartphone />
                Or use the app
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal direction="scale" delay={140}>
            <ChatPreview />
          </Reveal>
        </div>
      </section>

      {/* ── Why WhatsApp ────────────────────────────────────────── */}
      <section className="py-24 lg:py-28">
        <div className="shell">
          <Reveal className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-kaa-700 dark:text-kaa-400">
              Why here
            </p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
              We are not asking anyone to change how they use their phone.
            </h2>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-foreground-muted">
              Every app store download is a person lost. The assistant works on the handset people already
              carry, on the app they already open, using data they have already paid for.
            </p>
          </Reveal>

          <RevealGroup className="mt-14 grid gap-6 md:grid-cols-3">
            <Reason
              icon={<Signal />}
              title="Works on a light connection"
              body="Text and compressed photographs. No app to install, no heavy pages to load on a slow signal."
            />
            <Reason
              icon={<Search />}
              title="Ask the way you speak"
              body="Kiswahili or English, in whatever order. The assistant asks what it still needs and nothing more."
            />
            <Reason
              icon={<BadgeCheck />}
              title="The same verified stock"
              body="Every listing it sends has been visited, photographed and pinned by a Kaa Field Ops agent."
            />
          </RevealGroup>
        </div>
      </section>

      {/* ── What it sends ───────────────────────────────────────── */}
      <section className="border-y border-border bg-surface py-24 lg:py-28">
        <div className="shell">
          <Reveal className="max-w-3xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
              What comes back in the chat.
            </h2>
          </Reveal>

          <RevealGroup className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Sends
              icon={<Images />}
              title="Photographs"
              body="Taken on site by the agent who visited, not forwarded from somewhere else."
            />
            <Sends
              icon={<Wallet />}
              title="The real cost"
              body="Rent, deposit, and the months demanded upfront. Before you spend anything travelling."
            />
            <Sends
              icon={<MapPin />}
              title="A pin you can open"
              body="The exact location in Maps, so you know the walk to the daladala before you go."
            />
            <Sends
              icon={<FileSignature />}
              title="A link to sign"
              body="Choose one and the assistant hands you the listing page where you complete the contract."
            />
          </RevealGroup>
        </div>
      </section>

      {/* ── From chat to contract ───────────────────────────────── */}
      <section className="py-24 lg:py-28">
        <div className="shell">
          <Reveal className="max-w-3xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
              From a chat to a signed tenancy.
            </h2>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-foreground-muted">
              The conversation ends at a link. What happens after it is the part that makes a Kaa tenancy
              different from a handshake at a gate.
            </p>
          </Reveal>

          <ol className="mt-14 max-w-3xl space-y-10">
            {[
              {
                icon: <MessageCircle />,
                title: "You choose a listing in the chat",
                body: "The assistant sends the link for that specific unit, tied to the conversation you just had.",
              },
              {
                icon: <Fingerprint />,
                title: "You confirm who you are",
                body: "Your 20 digit NIDA number, a selfie, and photographs of the card itself. This is what lets a landlord accept a stranger.",
              },
              {
                icon: <FileSignature />,
                title: "You sign the contract",
                body: "A digital lease with your phone number attached, stating rent, term, deposit and notice. You keep a copy that cannot go missing.",
              },
              {
                icon: <BadgeCheck />,
                title: "Your witnesses confirm it",
                body: "You send the contract to your own witnesses from inside Kaa. They confirm, and the tenancy has people standing behind it.",
              },
            ].map((step, i, all) => (
              <Reveal as="li" key={step.title} delay={i * 90}>
                <div className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-kaa-50 text-kaa-700 dark:bg-kaa-950 dark:text-kaa-400 [&_svg]:size-5">
                      {step.icon}
                    </span>
                    {i < all.length - 1 && <span className="mt-2 w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-2">
                    <p className="tnum text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                      Step {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-1.5 text-xl font-semibold tracking-tight">{step.title}</h3>
                    <p className="mt-2.5 text-pretty leading-relaxed text-foreground-muted">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Join ────────────────────────────────────────────────── */}
      <section id="join" className="border-t border-border bg-surface py-24 lg:py-28">
        <div className="shell">
          <Reveal className="mx-auto max-w-2xl text-center">
            <KaaMark className="mx-auto size-14 text-kaa-500" gradient animated id="wa-cta" />
            <h2 className="mt-7 text-balance text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
              We will send you the number.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-foreground-muted">
              The assistant goes live ward by ward alongside our Field Ops teams. Leave your number and we
              will message you when it covers where you are looking.
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

function Reason({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card interactive className="h-full p-7">
      <span className="flex size-11 items-center justify-center rounded-xl bg-kaa-50 text-kaa-700 dark:bg-kaa-950 dark:text-kaa-400 [&_svg]:size-5">
        {icon}
      </span>
      <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2.5 text-sm leading-relaxed text-foreground-muted">{body}</p>
    </Card>
  );
}

function Sends({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card interactive className="h-full p-6">
      <span className="flex size-10 items-center justify-center rounded-lg bg-background text-foreground-muted [&_svg]:size-5">
        {icon}
      </span>
      <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{body}</p>
    </Card>
  );
}

function ChatPreview() {
  return (
    <div className="relative mx-auto max-w-sm">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-kaa-500/10 blur-3xl" aria-hidden="true" />
      <div className="relative rounded-[2.25rem] border border-border bg-surface-raised p-3 shadow-[var(--shadow-elev-3)]">
        <div className="overflow-hidden rounded-[1.75rem] bg-surface">
          <div className="flex items-center gap-3 border-b border-border bg-surface-raised px-4 py-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-kaa-500 text-ink-950">
              <KaaMark className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Kaa</p>
              <p className="text-xs text-kaa-700 dark:text-kaa-400">online</p>
            </div>
          </div>

          <ul className="max-h-[30rem] space-y-2.5 overflow-hidden p-4">
            {thread.map((message, i) => (
              <li key={i} className={message.from === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    message.from === "user"
                      ? "max-w-[86%] rounded-2xl rounded-br-md bg-kaa-500 px-3.5 py-2.5 text-sm leading-snug text-ink-950"
                      : "max-w-[86%] rounded-2xl rounded-bl-md bg-surface-raised px-3.5 py-2.5 text-sm leading-snug shadow-[var(--shadow-elev-1)]"
                  }
                >
                  {message.text}
                  {message.card && (
                    <div className="mt-2.5 overflow-hidden rounded-xl border border-border bg-background">
                      <Thumb seed="wa-listing" className="h-24 w-full rounded-none" />
                      <div className="space-y-0.5 p-3">
                        <p className="text-xs font-semibold">{message.card.title}</p>
                        <p className="text-xs text-foreground-subtle">{message.card.ward}</p>
                        <p className="tnum pt-1 text-xs font-medium text-kaa-700 dark:text-kaa-400">
                          {message.card.rent}
                        </p>
                        <p className="tnum text-xs text-foreground-muted">{message.card.move}</p>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
