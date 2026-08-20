import { cn } from "@/lib/utils";

/**
 * The Kaa mark.
 *
 * Two claws — adaptable, protective. An arch — shelter, a place to belong.
 * Two dots — people at the centre of everything.
 */
export function KaaMark({
  className,
  gradient = false,
  id = "kaa",
}: {
  className?: string;
  /** Fill from the brand gradient rather than `currentColor`. */
  gradient?: boolean;
  /** Unique suffix when several gradient marks share a page. */
  id?: string;
}) {
  const paint = gradient ? `url(#${id}-grad)` : "currentColor";
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      {gradient && (
        <defs>
          <linearGradient id={`${id}-grad`} x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22D19E" />
            <stop offset="1" stopColor="#00A57F" />
          </linearGradient>
        </defs>
      )}
      <g stroke={paint} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Left claw */}
        <path d="M17.5 30C11 25.5 8.5 18 11.5 10.5" />
        <path d="M11.5 10.5C14.5 16.5 18 19.5 23.5 20.5" />
        {/* Right claw */}
        <path d="M46.5 30C53 25.5 55.5 18 52.5 10.5" />
        <path d="M52.5 10.5C49.5 16.5 46 19.5 40.5 20.5" />
        {/* Shelter arch */}
        <path d="M13 31C13 44.5 21.5 53 32 53C42.5 53 51 44.5 51 31" />
      </g>
      {/* People at the centre */}
      <circle cx="25.5" cy="33" r="3.4" fill={paint} />
      <circle cx="38.5" cy="33" r="3.4" fill={paint} />
    </svg>
  );
}

export function KaaWordmark({
  className,
  showTagline = false,
  gradient = true,
  id = "kaa-wm",
}: {
  className?: string;
  showTagline?: boolean;
  gradient?: boolean;
  id?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <KaaMark className="size-9 shrink-0 text-kaa-500" gradient={gradient} id={id} />
      <span className="flex flex-col leading-none">
        <span className="text-[1.6rem] font-semibold tracking-tight">Kaa</span>
        {showTagline && (
          <span className="mt-1 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-foreground-muted">
            Stay. Settle. Belong.
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * Sub-brand lockup for the two operator-facing surfaces.
 * `Kaa Operators` and `Kaa Field Ops` are the same brand wearing a work badge.
 */
export function KaaLockup({
  surface,
  className,
  id = "kaa-lockup",
}: {
  surface: "Operators" | "Field Ops";
  className?: string;
  id?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <KaaMark className="size-8 shrink-0 text-kaa-500" gradient id={id} />
      <span className="flex items-baseline gap-1.5 leading-none">
        <span className="text-xl font-semibold tracking-tight">Kaa</span>
        <span className="rounded-md bg-kaa-50 px-1.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-kaa-700 dark:bg-kaa-950 dark:text-kaa-300">
          {surface}
        </span>
      </span>
    </span>
  );
}
