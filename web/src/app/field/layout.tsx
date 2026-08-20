import { CameraIcon, Home, UserRound, Wallet } from "lucide-react";
import { FileStack } from "lucide-react";
import Link from "next/link";

import { KaaLockup } from "@/components/brand/logo";
import { TabLink } from "@/components/shell/nav-link";
import { Avatar, Badge } from "@/components/ui";
import { agentToday, currentAgent } from "@/lib/data/queries";

/**
 * Field Ops runs on a phone in the sun, one-handed, on patchy data.
 * The shell is a fixed top bar and a thumb-reachable tab bar; content
 * between them is a single column that never needs a horizontal scroll.
 */
export default function FieldLayout({ children }: { children: React.ReactNode }) {
  const agent = currentAgent();
  const today = agentToday();
  const attention = today.needsAttention.length;

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-20 border-b border-border bg-surface-raised/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-3 px-4">
          <Link href="/field" className="text-foreground">
            <KaaLockup surface="Field Ops" />
          </Link>
          <div className="ml-auto flex items-center gap-2.5">
            <Badge tone="outline" className="tnum hidden sm:inline-flex">
              {agent.agentCode}
            </Badge>
            <Link href="/field/account">
              <Avatar name={agent.fullName} className="size-9" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-28">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface-raised/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl">
          <TabLink href="/field" icon={<Home />} label="Today" exact />
          <TabLink href="/field/capture" icon={<CameraIcon />} label="Capture" />
          <TabLink href="/field/submissions" icon={<FileStack />} label="Listings" badge={attention} />
          <TabLink href="/field/earnings" icon={<Wallet />} label="Earnings" />
          <TabLink href="/field/account" icon={<UserRound />} label="Account" />
        </div>
      </nav>
    </div>
  );
}
