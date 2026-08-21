import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "FieldOps", template: "%s · FieldOps" },
  // FieldOps is an internal operational tool for a separate entity. It has no
  // business in a search index.
  robots: { index: false, follow: false },
};

/**
 * Everything FieldOps shares: nothing but metadata.
 *
 * Three different shells live below this one, and they must not wrap each
 * other:
 *
 *   (portal)/   the desktop operations portal — sidebar, sign-in required
 *   app/        the handset data-collection app — its own chrome
 *   sign-in/    no chrome at all, and reachable while signed out
 *
 * The route group is what keeps `sign-in` outside the portal layout, which
 * redirects anyone without a session and would otherwise redirect to itself.
 */
export default function FieldOpsRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
