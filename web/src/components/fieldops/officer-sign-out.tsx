"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/fieldops/session", { method: "DELETE" });
        router.push("/field/sign-in");
        router.refresh();
      }}
      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground disabled:opacity-50"
    >
      <LogOut className="size-4" />
      {label}
    </button>
  );
}
