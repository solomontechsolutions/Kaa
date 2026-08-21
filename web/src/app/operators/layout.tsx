import type { Metadata } from "next";

/** The portals are working tools, not marketing surfaces, keep them out of search. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Everything the operators tree shares: nothing but metadata.
 *
 * `sign-in/` must not sit inside `(portal)`'s guarded layout — that layout
 * redirects anyone without a session to `/operators/sign-in`, and a redirect
 * that lands back on the page it started from is a loop, not a sign-in flow.
 * Same split FieldOps and the landlord portal use, same reason: see
 * `src/app/field/layout.tsx`.
 */
export default function OperatorsRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
