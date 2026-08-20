"use client";

import * as React from "react";

import { KaaMark } from "@/components/brand/logo";

const DURATION_MS = 2000;

/**
 * Whether the opening has already run in this page session.
 *
 * Module scope rather than state, so moving between tabs does not replay it
 * and there is no first-render flicker deciding. It is only ever written from
 * an effect, which never runs on the server, so the server and the client
 * agree on the first render and hydration is clean.
 */
let played = false;

/**
 * The opening.
 *
 * Kaa installed to a home screen has no browser chrome and no loading bar, so
 * the first thing a tenant sees is whatever the app paints. This paints the
 * mark: it arrives, settles, and the claws pick up their idle loop, then the
 * whole thing fades and the app is underneath it.
 *
 * Someone who has asked their system for reduced motion gets the app straight
 * away — the global `prefers-reduced-motion` rule flattens the animation, and
 * the timer here collapses with it rather than holding an unmoving overlay in
 * front of them for two seconds.
 */
export function Splash({ greeting, tagline }: { greeting: string; tagline: string }) {
  const [visible, setVisible] = React.useState(!played);

  React.useEffect(() => {
    if (!visible) return;
    played = true;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setVisible(false), reduced ? 0 : DURATION_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="kaa-splash-out fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink-950 text-white"
    >
      <div className="relative flex items-center justify-center">
        <span className="kaa-splash-ring absolute size-40 rounded-full border border-kaa-500/40" />
        <span className="kaa-splash-mark">
          <KaaMark className="size-24 text-kaa-500" gradient animated id="splash" />
        </span>
      </div>

      <p className="kaa-splash-word mt-8 text-3xl font-semibold tracking-tight">Kaa</p>
      <p className="kaa-splash-tagline mt-2 text-xs font-medium uppercase tracking-[0.22em] text-white/55">
        {tagline}
      </p>
      <p className="kaa-splash-tagline mt-10 text-sm text-white/40">{greeting}</p>
    </div>
  );
}
