import { BadgeCheck, CalendarDays, LogOut, MapPin, Phone, ShieldCheck, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Avatar, Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle, Field, Select } from "@/components/ui";
import { agentToday, currentAgent, earningsSummary, listSubmissions } from "@/lib/data/queries";
import { CURRENT_AGENT_ID } from "@/lib/data/seed";
import { date, displayPhone, mnoFor, money } from "@/lib/format";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  const agent = currentAgent();
  const { wardNames } = agentToday();
  const summary = earningsSummary();
  const submissions = listSubmissions(CURRENT_AGENT_ID);
  const approved = submissions.filter((s) => s.status === "approved").length;
  const rate = submissions.length ? (approved / submissions.length) * 100 : 0;

  return (
    <>
      {/* ── Identity ────────────────────────────────────────────── */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <Avatar name={agent.fullName} className="size-14 text-base" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight">{agent.fullName}</h1>
            <p className="tnum text-sm text-foreground-subtle">{agent.agentCode}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge tone={agent.isActive ? "success" : "neutral"}>
                {agent.isActive ? "Active agent" : "Inactive"}
              </Badge>
              <Badge tone="brand">
                <ShieldCheck />
                NIDA verified
              </Badge>
            </div>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
          <div>
            <dt className="text-xs text-foreground-subtle">Listings</dt>
            <dd className="tnum mt-0.5 text-lg font-semibold">{submissions.length}</dd>
          </div>
          <div>
            <dt className="text-xs text-foreground-subtle">Approved</dt>
            <dd className="tnum mt-0.5 text-lg font-semibold text-kaa-700 dark:text-kaa-400">
              {rate.toFixed(0)}%
            </dd>
          </div>
          <div>
            <dt className="text-xs text-foreground-subtle">Lifetime</dt>
            <dd className="tnum mt-0.5 text-lg font-semibold">{money(summary.lifetime)}</dd>
          </div>
        </dl>
      </Card>

      {/* ── Contact ─────────────────────────────────────────────── */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3 pt-3 text-sm">
          <div className="flex items-center gap-3">
            <Phone className="size-4 shrink-0 text-foreground-subtle" />
            <span className="flex-1">{displayPhone(agent.phone)}</span>
            <Badge tone="outline">{mnoFor(agent.phone)}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <CalendarDays className="size-4 shrink-0 text-foreground-subtle" />
            <span>On the network since {date(agent.startedAt)}</span>
          </div>
        </CardBody>
      </Card>

      {/* ── Zones ───────────────────────────────────────────────── */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Assigned wards</CardTitle>
          <Badge tone="outline">{wardNames.length}</Badge>
        </CardHeader>
        <CardBody className="pt-3">
          <div className="flex flex-wrap gap-2">
            {wardNames.map((ward) => (
              <Badge key={ward} tone="brand">
                <MapPin />
                {ward}
              </Badge>
            ))}
          </div>
          <p className="mt-3 text-xs text-foreground-subtle">
            Ask your supervisor to change your zones.
          </p>
        </CardBody>
      </Card>

      {/* ── Payout ──────────────────────────────────────────────── */}
      <Card className="mt-5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="size-4 text-foreground-subtle" />
            <CardTitle>Payout</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 pt-4">
          <Field label="Mobile money number" hint={`Currently ${mnoFor(agent.payoutPhone)}`}>
            <div className="flex h-11 items-center rounded-xl border border-border bg-surface px-3.5 text-sm">
              <BadgeCheck className="mr-2 size-4 text-[var(--color-success)]" />
              {displayPhone(agent.payoutPhone)}
            </div>
          </Field>
          <Field label="Language">
            <Select defaultValue="sw">
              <option value="sw">Kiswahili</option>
              <option value="en">English</option>
            </Select>
          </Field>
        </CardBody>
        <CardFooter className="justify-end">
          <Button variant="outline" size="sm">
            Request a change
          </Button>
        </CardFooter>
      </Card>

      <Link href="/" className="mt-5 block">
        <Button variant="ghost" className="w-full text-[var(--color-danger)]">
          <LogOut />
          Sign out
        </Button>
      </Link>
    </>
  );
}
