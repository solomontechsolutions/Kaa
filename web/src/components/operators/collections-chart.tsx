"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { money, moneyCompact } from "@/lib/format";

type Point = { month: string; expected: number; collected: number };

export function CollectionsChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground-subtle)", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tick={{ fill: "var(--foreground-subtle)", fontSize: 11 }}
            tickFormatter={(v: number) => moneyCompact(v)}
          />
          <Tooltip
            cursor={{ fill: "var(--surface)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]!.payload as Point;
              const rate = point.expected ? (point.collected / point.expected) * 100 : 0;
              return (
                <div className="rounded-xl border border-border bg-surface-raised p-3 shadow-[var(--shadow-elev-2)]">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                    {label}
                  </p>
                  <p className="tnum text-sm">
                    <span className="text-foreground-muted">Invoiced </span>
                    {money(point.expected)}
                  </p>
                  <p className="tnum text-sm">
                    <span className="text-foreground-muted">Collected </span>
                    {money(point.collected)}
                  </p>
                  <p className="mt-1.5 text-xs font-medium text-kaa-700 dark:text-kaa-400">
                    {rate.toFixed(0)}% collection rate
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="expected" radius={[6, 6, 0, 0]} fill="var(--color-ink-200)" />
          <Bar dataKey="collected" radius={[6, 6, 0, 0]}>
            {data.map((point, i) => {
              const rate = point.expected ? point.collected / point.expected : 0;
              return (
                <Cell
                  key={i}
                  fill={rate >= 0.95 ? "var(--color-kaa-500)" : rate >= 0.7 ? "var(--color-kaa-300)" : "var(--color-warning)"}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 flex items-center justify-center gap-5 text-xs text-foreground-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-ink-200" /> Invoiced
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-kaa-500" /> Collected
        </span>
      </div>
    </div>
  );
}
