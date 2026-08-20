import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import { Card } from "./index";

export function Stat({
  label,
  value,
  sub,
  icon,
  delta,
  tone = "neutral",
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  /** Percentage change against the previous period. */
  delta?: number;
  tone?: "neutral" | "brand" | "warning" | "danger";
  className?: string;
}) {
  const accent = {
    neutral: "text-foreground",
    brand: "text-kaa-700 dark:text-kaa-400",
    warning: "text-[var(--color-warning)]",
    danger: "text-[var(--color-danger)]",
  }[tone];

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-foreground-muted">{label}</p>
        {icon && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-surface text-foreground-subtle [&_svg]:size-4">
            {icon}
          </span>
        )}
      </div>
      <p className={cn("tnum mt-3 text-2xl font-semibold tracking-tight", accent)}>{value}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {typeof delta === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium [&_svg]:size-3.5",
              delta >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]",
            )}
          >
            {delta >= 0 ? <ArrowUpRight /> : <ArrowDownRight />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {sub && <span className="text-xs text-foreground-subtle">{sub}</span>}
      </div>
    </Card>
  );
}

/**
 * Deterministic architectural placeholder for a unit with no photo yet.
 * Real Supabase Storage photos replace this the moment they exist.
 */
export function Thumb({
  seed,
  className,
  label,
}: {
  seed: string;
  className?: string;
  label?: string;
}) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = 150 + (hash % 40) - 20; // stay in the brand's green-teal band
  const variant = hash % 3;

  return (
    <div
      className={cn("relative overflow-hidden rounded-xl bg-surface", className)}
      style={{ background: `linear-gradient(140deg, hsl(${hue} 45% 92%), hsl(${hue + 12} 35% 84%))` }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 120" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
        <g stroke={`hsl(${hue} 30% 40% / 0.28)`} strokeWidth="1.4" fill="none">
          {variant === 0 && (
            <>
              <path d="M20 96V54l32-22 32 22v42" />
              <path d="M96 96V44l30-18 30 18v52" />
              <path d="M40 96V74h24v22M112 96V72h28v24" />
            </>
          )}
          {variant === 1 && (
            <>
              <rect x="24" y="40" width="60" height="56" />
              <rect x="96" y="26" width="46" height="70" />
              <path d="M24 40h60M34 54h16M34 68h16M60 54h14M60 68h14M106 40h26M106 56h26M106 72h26" />
            </>
          )}
          {variant === 2 && (
            <>
              <path d="M16 96V60h40v36M56 96V38h44v58M100 96V52h48v44" />
              <path d="M28 72h14M28 84h14M68 56h20M68 72h20M112 68h24M112 82h24" />
            </>
          )}
          <path d="M0 96h200" strokeWidth="2" />
        </g>
      </svg>
      {label && (
        <span className="absolute bottom-2 left-2 rounded-md bg-white/85 px-1.5 py-0.5 text-[0.65rem] font-medium text-ink-800 backdrop-blur-sm">
          {label}
        </span>
      )}
    </div>
  );
}
