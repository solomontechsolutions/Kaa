"use client";

import { useRouter } from "next/navigation";

import { Avatar } from "@/components/ui";

/**
 * Kaa operators sign in through the FieldOps session (see the comment on
 * `lib/fieldops/session.ts` for why) — so signing out here clears that same
 * cookie, the one `/api/fieldops/session` issued.
 */
export function OperatorIdentity({ name }: { name: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/fieldops/session", { method: "DELETE" });
        router.push("/operators/sign-in");
        router.refresh();
      }}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-foreground-muted transition-colors hover:bg-surface hover:text-foreground"
    >
      <Avatar name={name} className="size-7" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{name}</span>
        <span className="block truncate text-xs text-foreground-subtle">Kaa operator · Sign out</span>
      </span>
    </button>
  );
}
