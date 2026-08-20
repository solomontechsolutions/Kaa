"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import * as React from "react";

import { Button, Input, Select } from "@/components/ui";
import { displayPhone, normalizePhone } from "@/lib/format";

type Role = "tenant" | "landlord" | "agent";

/**
 * Waitlist capture. Posts to `/api/waitlist`, which writes to the `waitlist`
 * table when Supabase is configured and logs otherwise.
 */
export function WaitlistForm() {
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState<Role>("tenant");
  const [state, setState] = React.useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = React.useState<string | null>(null);

  const normalized = normalizePhone(phone);
  const invalid = phone.length > 0 && !normalized;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!normalized) {
      setMessage("Enter a Tanzanian number, like 0784 000 500.");
      return;
    }

    setState("sending");
    setMessage(null);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized, role }),
      });
      if (!response.ok) throw new Error(await response.text());
      setState("done");
    } catch {
      setState("error");
      setMessage("Something went wrong. Try again in a moment.");
    }
  }

  if (state === "done") {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-kaa-200 bg-kaa-50 p-5 dark:border-kaa-900 dark:bg-kaa-950/60">
        <CheckCircle2 className="size-5 shrink-0 text-kaa-600 dark:text-kaa-400" />
        <p className="text-sm font-medium text-kaa-900 dark:text-kaa-200">
          Asante! We will message {displayPhone(normalized!)} the day Kaa opens near you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="0784 000 500"
          aria-label="Phone number"
          aria-invalid={invalid}
          className={invalid ? "border-[var(--color-danger)] sm:flex-1" : "sm:flex-1"}
        />
        <Select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          aria-label="I am a"
          className="sm:w-44"
        >
          <option value="tenant">I need a home</option>
          <option value="landlord">I have property</option>
          <option value="agent">I want to be an agent</option>
        </Select>
        <Button type="submit" disabled={state === "sending"} className="sm:w-auto">
          {state === "sending" ? <Loader2 className="animate-spin" /> : null}
          Notify me
        </Button>
      </div>

      {message && <p className="text-sm text-[var(--color-danger)]">{message}</p>}
      <p className="text-xs text-foreground-subtle">
        We only message you about Kaa. No sharing your number with brokers — that is the whole point.
      </p>
    </form>
  );
}
