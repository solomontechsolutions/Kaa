import { FileSignature, Fingerprint, ShieldCheck, UserRound } from "lucide-react";

import { Badge, ButtonLink, Card } from "@/components/ui";

export const metadata = { title: "You" };

export default function AppTenancyPage() {
  return (
    <div className="px-5 pb-8 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      <div className="flex items-center gap-3.5">
        <span className="flex size-14 items-center justify-center rounded-full bg-kaa-100 text-lg font-semibold text-kaa-800 dark:bg-kaa-900 dark:text-kaa-200">
          AM
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight">Asha Mkwawa</h1>
          <Badge tone="success" className="mt-1">
            <ShieldCheck />
            NIDA verified
          </Badge>
        </div>
      </div>

      <Card className="mt-6 p-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          Your verification
        </p>
        <ul className="mt-4 space-y-3">
          <Row icon={<Fingerprint />} label="NIDA number" value="Verified, 20 digits" done />
          <Row icon={<UserRound />} label="Selfie" value="Matched to the card" done />
          <Row icon={<FileSignature />} label="Witnesses" value="2 confirmed" done />
        </ul>
      </Card>

      <Card className="mt-4 p-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          Current tenancy
        </p>
        <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
          You have no active tenancy on Kaa yet. Once you sign, the contract, rent schedule and receipts
          live here.
        </p>
        <ButtonLink href="/app/search" className="mt-5 w-full">
          Find a home
        </ButtonLink>
      </Card>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  done,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  done?: boolean;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-foreground-subtle [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-foreground-subtle">{value}</p>
      </div>
      {done && <ShieldCheck className="size-4 shrink-0 text-[var(--color-success)]" />}
    </li>
  );
}
