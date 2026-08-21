import { cn } from "@/lib/utils";

/**
 * The Kaa mark.
 *
 * This is the approved artwork, not an interpretation of it. `brand/KAA.svg`
 * is the designer's file — the app-icon lockup, a dark rounded tile with the
 * crab on it. `public/brand/kaa-mark.svg` is that same file with the tile
 * paths removed so the mark can sit on any surface. Every curve that remains
 * is the original; nothing was redrawn.
 *
 * Consequences worth knowing before changing anything here:
 *
 *  • The mark carries its own greens, twenty of them across the trace. It
 *    cannot take `currentColor` and must not be recoloured — the gradient is
 *    part of the identity.
 *  • It cannot work its claws. The trace is colour bands, not hinged parts,
 *    and building hinged parts means redrawing the logo, which is exactly what
 *    we are not doing. Motion, where it is wanted, is applied to the whole
 *    mark — see the splash.
 *
 * Two claws: adaptable, protective. An arch: shelter, a place to belong.
 * Two dots: people at the centre of everything.
 */
export function KaaMark({ className }: { className?: string }) {
  return (
    // A plain <img> rather than an inline SVG: the trace is 26 KB, and the
    // header, the footer and every card would otherwise each carry a copy of
    // it in the HTML. As a file the browser fetches it once.
    //
    // next/image is not the answer either — it declines to optimise SVG unless
    // `dangerouslyAllowSVG` is turned on, which is a poor trade for a vector
    // that is already small and already the exact size it renders at.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/kaa-mark.svg"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn("size-8 select-none object-contain", className)}
    />
  );
}

/**
 * Mark plus wordmark. "Kaa" is set in Poppins SemiBold, the brand typeface,
 * with the tagline beneath it — the lockup as the brand board draws it.
 */
export function KaaWordmark({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={cn("group inline-flex items-center gap-2.5", className)}>
      <KaaMark className="size-9 shrink-0 transition-transform duration-500 group-hover:scale-105" />
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
 * Sub-brand lockup.
 *
 * `Kaa Operators` is Kaa wearing a work badge — same company, internal tool.
 * `Field Ops` is not: FieldOps is a separate entity, jointly owned, and its
 * lockup says so by putting its own name first and crediting Kaa beneath it
 * rather than presenting itself as a department of Kaa.
 */
export function KaaLockup({ surface, className }: { surface: "Operators" | "Landlord"; className?: string }) {
  return (
    <span className={cn("group inline-flex items-center gap-2.5", className)}>
      <KaaMark className="size-8 shrink-0 transition-transform duration-500 group-hover:scale-105" />
      <span className="flex items-baseline gap-1.5 leading-none">
        <span className="text-xl font-semibold tracking-tight">Kaa</span>
        <span className="rounded-md bg-kaa-50 px-1.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-kaa-700 dark:bg-kaa-950 dark:text-kaa-300">
          {surface}
        </span>
      </span>
    </span>
  );
}

/**
 * The FieldOps lockup. A separate operating entity that collects for Kaa, so
 * the hierarchy reads FieldOps first, "for Kaa" second.
 */
export function FieldOpsLockup({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <KaaMark className={compact ? "size-7 shrink-0" : "size-9 shrink-0"} />
      <span className="flex flex-col leading-none">
        <span className={cn("font-semibold tracking-tight", compact ? "text-base" : "text-lg")}>
          FieldOps
        </span>
        {!compact && (
          <span className="mt-1 whitespace-nowrap text-[0.58rem] font-medium uppercase tracking-[0.1em] text-foreground-subtle">
            Property data collection for Kaa
          </span>
        )}
      </span>
    </span>
  );
}
