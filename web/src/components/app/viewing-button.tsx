"use client";

import { CalendarCheck, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui";

/**
 * Requesting a viewing. Posts to the existing Kaa viewing pipeline — the same
 * requests an Operators queue and a Field Ops agent's day are built from, not
 * a second booking store.
 */
export function ViewingButton({ unitId, label }: { unitId: string; label: string }) {
  const router = useRouter();
  const [state, setState] = React.useState<"idle" | "busy" | "done">("idle");
  const [reference, setReference] = React.useState<string | null>(null);

  async function request() {
    setState("busy");
    try {
      const response = await fetch("/api/viewings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ unitId }),
      });

      if (response.status === 402) {
        router.push("/app/unlock");
        setState("idle");
        return;
      }

      const payload = await response.json();
      if (response.ok) {
        setReference(payload.reference);
        setState("done");
      } else {
        setState("idle");
      }
    } catch {
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p className="flex items-center justify-center gap-2 rounded-xl bg-kaa-50 py-3 text-sm font-medium text-kaa-800 dark:bg-kaa-950 dark:text-kaa-300">
        <Check className="size-4" />
        <span className="tnum">{reference}</span>
      </p>
    );
  }

  return (
    <Button size="lg" className="w-full" onClick={request} disabled={state === "busy"}>
      {state === "busy" ? <Loader2 className="animate-spin" /> : <CalendarCheck />}
      {label}
    </Button>
  );
}
