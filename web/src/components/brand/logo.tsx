import { cn } from "@/lib/utils";

/**
 * The Kaa mark — a crab, drawn from `brand/Kaa Logo.png`.
 *
 * Two claws: adaptable, protective. An arch: shelter, a place to belong.
 * Two dots: people at the centre of everything.
 *
 * Filled tapered blades rather than strokes, so the pincers keep their points
 * at every size.
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
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={cn("size-8", className)}>
      {gradient && (
        <defs>
          <linearGradient id={`${id}-grad`} x1="10" y1="4" x2="54" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3BDCAB" />
            <stop offset="1" stopColor="#00A57F" />
          </linearGradient>
        </defs>
      )}

      <g fill={paint}>
        {/* Shell — a wide crescent with upturned, tapered tips */}
        <path d="M7 30C7 47 18 58 32 58C46 58 57 47 57 30C54 43 45 50.5 32 50.5C19 50.5 10 43 7 30Z" />

        {/* Left claw — two tapered blades meeting at the base, pincer opening upward */}
        <path d="M17 31C10 24 5 14 7 3C13 11 17 21 21 29Z" />
        <path d="M14 27C17 20 22 13 29 10C28 19 25 26 21 32Z" />

        {/* Right claw, mirrored */}
        <path d="M47 31C54 24 59 14 57 3C51 11 47 21 43 29Z" />
        <path d="M50 27C47 20 42 13 35 10C36 19 39 26 43 32Z" />
      </g>

      {/* Mouth */}
      <path
        d="M25 38.5C27 42.5 29.5 44 32 44C34.5 44 37 42.5 39 38.5"
        stroke={paint}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* People at the centre */}
      <circle cx="26" cy="34" r="2.9" fill={paint} />
      <circle cx="38" cy="34" r="2.9" fill={paint} />
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
