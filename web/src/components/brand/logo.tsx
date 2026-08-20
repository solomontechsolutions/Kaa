import { cn } from "@/lib/utils";

/**
 * The Kaa mark.
 *
 * Shaped from `brand/KAA.svg`, but rebuilt as clean geometry rather than used
 * directly. The supplied file is a raster auto-trace: 105 paths across 30
 * colour bands, including 1px specks. It is the exact artwork, so it is what
 * ships as the favicon and app icon (see app/icon.svg) where fidelity is the
 * only thing that matters. It cannot animate, because a colour band is not a
 * claw. This version is built as three hinged groups so it can.
 *
 * Two claws: adaptable, protective. An arch: shelter, a place to belong.
 * Two dots: people at the centre of everything.
 */
export function KaaMark({
  className,
  gradient = false,
  animated = false,
  id = "kaa",
}: {
  className?: string;
  /** Fill from the brand gradient rather than `currentColor`. */
  gradient?: boolean;
  /** Work the pincers on a loop. Reserve for hero and loading moments. */
  animated?: boolean;
  /** Unique suffix when several gradient marks share a page. */
  id?: string;
}) {
  const paint = gradient ? `url(#${id}-grad)` : "currentColor";
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn("size-8", animated && "kaa-mark-animated", className)}
    >
      {gradient && (
        <defs>
          <linearGradient id={`${id}-grad`} x1="10" y1="4" x2="54" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3BDCAB" />
            <stop offset="1" stopColor="#00A57F" />
          </linearGradient>
        </defs>
      )}

      {/* Shell. Rocks a little when the claws snap, so the motion has weight. */}
      <g className="kaa-shell" style={{ transformOrigin: "32px 44px" }}>
        <path
          fill={paint}
          d="M7 30C7 47 18 58 32 58C46 58 57 47 57 30C54 43 45 50.5 32 50.5C19 50.5 10 43 7 30Z"
        />
        <path
          d="M25 38.5C27 42.5 29.5 44 32 44C34.5 44 37 42.5 39 38.5"
          stroke={paint}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="26" cy="34" r="2.9" fill={paint} />
        <circle cx="38" cy="34" r="2.9" fill={paint} />
      </g>

      {/* Left claw. Hinged at its base so the blades open rather than slide. */}
      <g className="kaa-claw kaa-claw-left" style={{ transformOrigin: "19px 30px" }} fill={paint}>
        <path d="M17 31C10 24 5 14 7 3C13 11 17 21 21 29Z" />
        <path d="M14 27C17 20 22 13 29 10C28 19 25 26 21 32Z" />
      </g>

      {/* Right claw */}
      <g className="kaa-claw kaa-claw-right" style={{ transformOrigin: "45px 30px" }} fill={paint}>
        <path d="M47 31C54 24 59 14 57 3C51 11 47 21 43 29Z" />
        <path d="M50 27C47 20 42 13 35 10C36 19 39 26 43 32Z" />
      </g>
    </svg>
  );
}

export function KaaWordmark({
  className,
  showTagline = false,
  gradient = true,
  animated = false,
  id = "kaa-wm",
}: {
  className?: string;
  showTagline?: boolean;
  gradient?: boolean;
  animated?: boolean;
  id?: string;
}) {
  return (
    <span className={cn("group inline-flex items-center gap-2.5", className)}>
      <KaaMark
        className="size-9 shrink-0 text-kaa-500 transition-transform duration-500 group-hover:scale-105"
        gradient={gradient}
        animated={animated}
        id={id}
      />
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
 * Sub-brand lockup for the operator-facing surfaces.
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
    <span className={cn("group inline-flex items-center gap-2.5", className)}>
      <KaaMark
        className="size-8 shrink-0 text-kaa-500 transition-transform duration-500 group-hover:scale-105"
        gradient
        id={id}
      />
      <span className="flex items-baseline gap-1.5 leading-none">
        <span className="text-xl font-semibold tracking-tight">Kaa</span>
        <span className="rounded-md bg-kaa-50 px-1.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-kaa-700 dark:bg-kaa-950 dark:text-kaa-300">
          {surface}
        </span>
      </span>
    </span>
  );
}
