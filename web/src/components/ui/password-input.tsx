"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * A password field with a show/hide toggle. Every password-based sign-in
 * form uses this one component — Kaa operator, FieldOps, and the landlord
 * portal's email + password mode — so the behaviour (default hidden, toggle
 * never touches the value itself, keyboard- and screen-reader-reachable) is
 * identical everywhere a password is actually typed. NIDA and OTP screens
 * have no password field, so this never appears on them.
 */
export function PasswordInput({ className, ...props }: React.ComponentProps<"input">) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-11", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={-1}
        className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-foreground-subtle transition-colors hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
