"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

export function LandlordSignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/landlords/session", { method: "DELETE" });
        router.push("/landlord/sign-in");
        router.refresh();
      }}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground disabled:opacity-50"
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
