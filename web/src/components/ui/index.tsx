/**
 * Kaa UI primitives.
 *
 * Deliberately small and server-renderable, nothing here needs a client
 * boundary. Interactive pieces live beside the surfaces that need them.
 */

import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import * as React from "react";

import { cn } from "@/lib/utils";

// ── Button ─────────────────────────────────────────────────────────────

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-kaa-500 text-ink-950 shadow-[0_1px_2px_rgba(17,19,24,0.08)] hover:bg-kaa-400 hover:shadow-[var(--shadow-glow)]",
        dark: "bg-ink-950 text-white hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-ink-100",
        outline:
          "border border-border-strong bg-transparent hover:bg-surface hover:border-kaa-400",
        ghost: "hover:bg-surface text-foreground-muted hover:text-foreground",
        danger: "bg-[var(--color-danger)] text-white hover:brightness-110",
        link: "text-kaa-700 underline-offset-4 hover:underline dark:text-kaa-400 px-0",
      },
      size: {
        sm: "h-9 px-3 text-sm [&_svg]:size-4",
        md: "h-11 px-5 text-sm [&_svg]:size-4",
        lg: "h-13 px-7 text-base [&_svg]:size-5",
        icon: "size-10 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;

export function ButtonLink({ className, variant, size, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

// ── Card ───────────────────────────────────────────────────────────────

export function Card({
  className,
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface-raised shadow-[var(--shadow-elev-1)]",
        interactive &&
          "transition-all hover:border-kaa-300 hover:shadow-[var(--shadow-elev-2)] dark:hover:border-kaa-800",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-start justify-between gap-4 p-5 pb-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-base font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("mt-1 text-sm text-foreground-muted", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex items-center gap-3 border-t border-border px-5 py-3.5", className)} {...props} />
  );
}

// ── Badge ──────────────────────────────────────────────────────────────

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      tone: {
        neutral: "bg-surface text-foreground-muted border border-border",
        brand: "bg-kaa-50 text-kaa-800 dark:bg-kaa-950 dark:text-kaa-300",
        success: "bg-[#E8F7EE] text-[#0B7038] dark:bg-[#0B2C1A] dark:text-[#4ADE80]",
        warning: "bg-[#FDF3E0] text-[#8A5A00] dark:bg-[#33240A] dark:text-[#FBBF24]",
        danger: "bg-[#FDECEE] text-[#A61B2B] dark:bg-[#37151A] dark:text-[#FB7185]",
        info: "bg-[#EAF2FF] text-[#1A4FA8] dark:bg-[#0F1F3D] dark:text-[#93B8FF]",
        outline: "border border-border-strong text-foreground-muted",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/** A small coloured dot, pairs with Badge for status rows. */
export function Dot({ tone = "neutral", className }: { tone?: string; className?: string }) {
  const colors: Record<string, string> = {
    neutral: "bg-ink-400",
    brand: "bg-kaa-500",
    success: "bg-[var(--color-success)]",
    warning: "bg-[var(--color-warning)]",
    danger: "bg-[var(--color-danger)]",
    info: "bg-[var(--color-info)]",
  };
  return <span className={cn("size-1.5 rounded-full", colors[tone] ?? colors.neutral, className)} />;
}

// ── Form controls ──────────────────────────────────────────────────────

const fieldBase =
  "w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-foreground-subtle transition-colors focus:border-kaa-400 focus:outline-none focus:ring-2 focus:ring-kaa-500/25 disabled:opacity-60";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-24 py-3", className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(fieldBase, "h-11 pr-9", className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-foreground", className)} {...props} />;
}

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>
        {label}
        {required && <span className="ml-0.5 text-[var(--color-danger)]">*</span>}
      </Label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-foreground-subtle">{hint}</p>}
    </div>
  );
}

// ── Table ──────────────────────────────────────────────────────────────

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "border-b border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground-subtle",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("border-b border-border px-4 py-3.5 align-middle", className)} {...props} />;
}

export function Tr({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn("transition-colors hover:bg-surface/60", className)} {...props} />;
}

// ── Layout helpers ─────────────────────────────────────────────────────

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-foreground-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border-strong px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-surface text-foreground-subtle [&_svg]:size-6">
          {icon}
        </div>
      )}
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-foreground-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Progress({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "warning" | "danger" }) {
  const fill = { brand: "bg-kaa-500", warning: "bg-[var(--color-warning)]", danger: "bg-[var(--color-danger)]" }[tone];
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface", className)}>
      <div className={cn("h-full rounded-full transition-all", fill)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Avatar({ name, src, className }: { name: string; src?: string; className?: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-kaa-100 text-xs font-semibold text-kaa-800 dark:bg-kaa-900 dark:text-kaa-200",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        letters
      )}
    </span>
  );
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}
