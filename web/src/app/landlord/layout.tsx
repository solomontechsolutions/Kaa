import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Landlord", template: "%s · Kaa Landlord" },
  robots: { index: false, follow: false },
};

/**
 * Everything the landlord tree shares: nothing but metadata.
 *
 * `sign-in/` must not sit inside `(portal)`'s guarded layout — that layout
 * redirects anyone without a session, and sign-in is exactly where a
 * signed-out visitor is supposed to land. Same split FieldOps uses, same
 * reason: see `src/app/field/layout.tsx`.
 */
export default function LandlordRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
