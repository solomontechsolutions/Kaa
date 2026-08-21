"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import type { SubmissionStatus } from "@/lib/fieldops/types";
import { cn } from "@/lib/utils";

/**
 * Filters that live in the URL.
 *
 * Every change rewrites the query string and lets the server re-query, so the
 * view is shareable and the back button behaves. Holding this in component
 * state would be less code and would break both.
 */
export function SubmissionFilters({
  statuses,
  wards,
  officers,
  selected,
  labels,
  statusLabels,
}: {
  statuses: SubmissionStatus[];
  wards: string[];
  officers: { id: string; name: string }[];
  selected: { status: SubmissionStatus[]; officerId?: string; ward?: string; q?: string };
  labels: {
    status: string;
    officer: string;
    ward: string;
    anyOfficer: string;
    anyWard: string;
    clear: string;
    search: string;
  };
  statusLabels: Record<string, string>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = React.useState(selected.q ?? "");

  const apply = React.useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      router.push(`/field/submissions${next.toString() ? `?${next}` : ""}`);
    },
    [params, router],
  );

  function toggleStatus(status: SubmissionStatus) {
    apply((next) => {
      const current = next.getAll("status");
      next.delete("status");
      const updated = current.includes(status)
        ? current.filter((value) => value !== status)
        : [...current, status];
      for (const value of updated) next.append("status", value);
    });
  }

  // Debounced, so typing does not push a history entry per keystroke.
  React.useEffect(() => {
    if (query === (selected.q ?? "")) return;
    const timer = setTimeout(() => {
      apply((next) => {
        if (query.trim()) next.set("q", query.trim());
        else next.delete("q");
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [query, selected.q, apply]);

  const active = selected.status.length > 0 || selected.officerId || selected.ward || selected.q;

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface-raised p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 min-w-[16rem] flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 focus-within:border-kaa-400">
          <Search className="size-4 shrink-0 text-foreground-subtle" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.search}
            aria-label={labels.search}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-subtle"
          />
        </div>

        <label className="sr-only" htmlFor="officer-filter">{labels.officer}</label>
        <select
          id="officer-filter"
          value={selected.officerId ?? ""}
          onChange={(event) =>
            apply((next) => {
              if (event.target.value) next.set("officerId", event.target.value);
              else next.delete("officerId");
            })
          }
          className="h-10 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-kaa-400"
        >
          <option value="">{labels.anyOfficer}</option>
          {officers.map((officer) => (
            <option key={officer.id} value={officer.id}>{officer.name}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor="ward-filter">{labels.ward}</label>
        <select
          id="ward-filter"
          value={selected.ward ?? ""}
          onChange={(event) =>
            apply((next) => {
              if (event.target.value) next.set("ward", event.target.value);
              else next.delete("ward");
            })
          }
          className="h-10 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-kaa-400"
        >
          <option value="">{labels.anyWard}</option>
          {wards.map((ward) => (
            <option key={ward} value={ward}>{ward}</option>
          ))}
        </select>

        {active && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              router.push("/field/submissions");
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <X className="size-3.5" />
            {labels.clear}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {statuses.map((status) => {
          const on = selected.status.includes(status);
          return (
            <button
              key={status}
              type="button"
              onClick={() => toggleStatus(status)}
              aria-pressed={on}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                on
                  ? "border-kaa-400 bg-kaa-500 text-ink-950"
                  : "border-border bg-surface text-foreground-muted hover:border-border-strong",
              )}
            >
              {statusLabels[status] ?? status}
            </button>
          );
        })}
      </div>
    </div>
  );
}
