import { MapPin, Phone, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { Avatar, Badge, Card, CardBody, CardHeader, CardTitle, PageHeader, Progress, Table, Td, Th, Tr } from "@/components/ui";
import { Stat } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/status";
import { listAgents, reviewQueue } from "@/lib/data/queries";
import { date, displayPhone, money, relative } from "@/lib/format";

export const metadata: Metadata = { title: "Field agents" };

export default function AgentsPage() {
  const agents = listAgents();
  const queue = reviewQueue();
  const totalSubmissions = agents.reduce((sum, a) => sum + a.submissionCount, 0);
  const totalApproved = agents.reduce((sum, a) => sum + a.approvedCount, 0);

  return (
    <>
      <PageHeader
        title="Field agents"
        description="The FieldOps network sourcing and verifying supply on the ground."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active agents" value={agents.filter((a) => a.isActive).length} icon={<ShieldCheck />} />
        <Stat label="Submissions" value={totalSubmissions} sub="all time" />
        <Stat
          label="Approval rate"
          value={`${totalSubmissions ? ((totalApproved / totalSubmissions) * 100).toFixed(0) : 0}%`}
          tone="brand"
        />
        <Stat label="Awaiting review" value={queue.length} tone={queue.length ? "warning" : "neutral"} />
      </div>

      {/* ── Review queue ────────────────────────────────────────── */}
      <Card className="mt-6 p-0">
        <CardHeader className="p-5">
          <div>
            <CardTitle>Submission review queue</CardTitle>
            <p className="mt-1 text-sm text-foreground-muted">Oldest first. Agents are paid on approval.</p>
          </div>
          <Badge tone={queue.length ? "warning" : "neutral"}>{queue.length} waiting</Badge>
        </CardHeader>
        <Table>
          <thead>
            <tr>
              <Th>Reference</Th>
              <Th>Property</Th>
              <Th>Agent</Th>
              <Th className="text-right">Units</Th>
              <Th className="text-right">Proposed rent</Th>
              <Th>GPS</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {queue.map((submission) => (
              <Tr key={submission.id}>
                <Td>
                  <span className="tnum text-xs font-medium text-foreground-muted">{submission.reference}</span>
                  <p className="text-xs text-foreground-subtle">
                    {submission.submittedAt && relative(submission.submittedAt)}
                  </p>
                </Td>
                <Td>
                  <p className="font-medium">{submission.propertyName}</p>
                  <p className="text-xs text-foreground-subtle">
                    {submission.ward} · {submission.landlordName}
                  </p>
                </Td>
                <Td className="text-sm">{submission.agentName}</Td>
                <Td className="tnum text-right">{submission.unitsCount}</Td>
                <Td className="tnum text-right font-medium">{money(submission.proposedRent)}</Td>
                <Td>
                  <span
                    className={
                      submission.gpsAccuracyM <= 10
                        ? "text-xs font-medium text-[var(--color-success)]"
                        : "text-xs font-medium text-[var(--color-warning)]"
                    }
                  >
                    ±{submission.gpsAccuracyM.toFixed(1)} m
                  </span>
                  <p className="tnum text-xs text-foreground-subtle">
                    {submission.latitude.toFixed(4)}, {submission.longitude.toFixed(4)}
                  </p>
                </Td>
                <Td>
                  <StatusBadge kind="submission" value={submission.status} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* ── Roster ──────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {agents.map((agent) => {
          const rate = agent.submissionCount ? (agent.approvedCount / agent.submissionCount) * 100 : 0;
          return (
            <Card key={agent.id}>
              <CardBody>
                <div className="flex items-start gap-3">
                  <Avatar name={agent.fullName} className="size-11" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{agent.fullName}</p>
                      <Badge tone={agent.isActive ? "success" : "neutral"}>
                        {agent.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="tnum text-xs text-foreground-subtle">{agent.agentCode}</p>
                    <a
                      href={`tel:${agent.phone}`}
                      className="mt-1 inline-flex items-center gap-1.5 text-sm text-kaa-700 hover:underline dark:text-kaa-400"
                    >
                      <Phone className="size-3.5" />
                      {displayPhone(agent.phone)}
                    </a>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {agent.wardNames.map((ward) => (
                    <Badge key={ward} tone="outline">
                      <MapPin />
                      {ward}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-foreground-muted">Approval rate</span>
                    <span className="tnum font-medium">
                      {agent.approvedCount}/{agent.submissionCount} · {rate.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={rate} tone={rate >= 70 ? "brand" : "warning"} />
                  <p className="mt-3 text-xs text-foreground-subtle">
                    On the network since {date(agent.startedAt)}
                  </p>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
}
