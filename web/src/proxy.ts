import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { ROLE_SIGN_IN } from "@/lib/auth/roles";
import { landlordFromToken, LANDLORD_COOKIE } from "@/lib/landlords/session";
import { operatorFromToken, OPERATOR_COOKIE } from "@/lib/operators/session";

/**
 * Runs first on every matched request. Three jobs.
 *
 * 1. Surface routing. The same codebase is deployed to Vercel twice, and the
 *    two deployments are separate products with separate audiences.
 *
 *    • `kaatz.vercel.app` — the public site, Kaa Operators, and the Kaa app.
 *      It does **not** serve Field Ops. A request for /field here is a 404,
 *      not a redirect, because Field Ops is not a page of the Kaa website and
 *      should not be discoverable from it. This is unconditional: even a
 *      signed-in Kaa operator gets the 404 — Kaa operators review FieldOps
 *      submissions from inside `/operators`, not by visiting FieldOps'
 *      product, so there is no session that should ever unlock this tree on
 *      this domain.
 *
 *    • `kaafieldops.vercel.app` — sets NEXT_PUBLIC_KAA_SURFACE=fieldops and
 *      serves only Kaa Field Ops, mounted at its own root, so an agent's day
 *      is at `/` and `/capture` is the capture flow. Anything outside the
 *      Field Ops tree on that host is rewritten into it.
 *
 * 2. Role enforcement for `/operators` and `/landlord`. This is the fix for
 *    "Landlord sign in opens the operator admin": those two trees now check
 *    who is actually signed in *before* anything renders, not after, and not
 *    only in a layout — a layout and its page render in parallel in the App
 *    Router, so a `redirect()` there does not stop the page underneath it
 *    from running for one tick. Denying here, in the one place every request
 *    passes through first, is what makes this a backend rule and not a
 *    frontend redirect. `/operators` checks Kaa's own operator session
 *    (`lib/operators/session.ts`) — never FieldOps' — because a Kaa operator
 *    is not a FieldOps employee and the two sessions are unrelated cookies
 *    against unrelated tables.
 *
 * 3. Supabase session refresh. Server Components cannot write cookies, so a
 *    rotated refresh token has nowhere to land unless something upstream does
 *    it. The symptom otherwise is users logged out at random.
 *
 * Renamed from `middleware` in Next.js 16, see
 * node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md
 */

const SURFACE = process.env.NEXT_PUBLIC_KAA_SURFACE;

/**
 * `/operators` needs a signed-in Kaa operator; `/landlord` (past sign-in)
 * needs a signed-in landlord. Both read the raw cookie directly — `proxy.ts`
 * has no access to `next/headers`' `cookies()`, which only works inside the
 * request-scoped App Router context — and both look the id up in that
 * domain's own store, never trusting a role carried in the cookie itself.
 */
function enforceRole(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (pathname === "/operators" || pathname.startsWith("/operators/")) {
    if (pathname === "/operators/sign-in") return null;
    const operator = operatorFromToken(request.cookies.get(OPERATOR_COOKIE)?.value);
    if (!operator) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_SIGN_IN.KAA_OPERATOR;
      return NextResponse.redirect(url);
    }
    return null;
  }

  if (pathname.startsWith("/landlord") && pathname !== "/landlord/sign-in") {
    const landlord = landlordFromToken(request.cookies.get(LANDLORD_COOKIE)?.value);
    if (!landlord) {
      const url = request.nextUrl.clone();
      url.pathname = "/landlord/sign-in";
      return NextResponse.redirect(url);
    }
    return null;
  }

  return null;
}

/** Paths that must resolve literally, whatever surface is being served. */
const PASSTHROUGH = [
  "/api",
  "/_next",
  "/icon",
  "/apple-icon",
  "/manifest.webmanifest",
  "/sw.js",
  "/offline",
];

function routeForSurface(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (PASSTHROUGH.some((p) => pathname.startsWith(p))) return null;

  if (SURFACE === "fieldops") {
    if (pathname.startsWith("/field")) return null;

    // Everything else on this deployment is Field Ops, mounted at the root, so
    // /capture serves /field/capture and bare / serves the agent's day.
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/field" : `/field${pathname}`;
    return NextResponse.rewrite(url);
  }

  // The main deployment. Field Ops lives at its own domain and its own Vercel
  // project; serving it here as well would give the public surface two URLs,
  // one of them reachable from the marketing site. No session on this domain
  // unlocks it — not a landlord's, not a tenant's, and not a Kaa operator's.
  // A Kaa operator reviews FieldOps submissions from `/operators/fieldops`,
  // which reads the same submission store directly; they have no reason to
  // ever be sent to FieldOps' own product, on this domain or FieldOps'.
  if (pathname === "/field" || pathname.startsWith("/field/")) {
    // Rewriting to a path no route matches renders `app/not-found.tsx` with a
    // 404. A redirect would be worse: it would leave the impression that Field
    // Ops has an address on this domain and is merely elsewhere today.
    const url = request.nextUrl.clone();
    url.pathname = "/field-ops-is-a-separate-deployment";
    return NextResponse.rewrite(url);
  }

  return null;
}

export async function proxy(request: NextRequest) {
  // Role enforcement runs against the real pathname, before the surface
  // rewrite. Neither `/operators` nor `/landlord` exist on the Field Ops
  // deployment — a request for them there is someone poking at a URL that
  // only makes sense on the main site, so it is left to the surface routing
  // below to turn into Field Ops' own 404 rather than being redirected as if
  // it were a denied Kaa session.
  if (SURFACE !== "fieldops") {
    const denied = enforceRole(request);
    if (denied) return denied;
  }

  const routed = routeForSurface(request);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return routed ?? NextResponse.next();

  let response = routed ?? NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(items) {
        for (const { name, value } of items) {
          request.cookies.set(name, value);
        }
        // Re-issue the response so it carries the refreshed cookies, keeping
        // whichever rewrite the surface routing already decided on.
        response = routed ?? NextResponse.next({ request });
        for (const { name, value, options } of items) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Do not remove: this call is what performs the refresh. Anything between
  // creating the client and this line risks the session expiring at random.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files, those never carry a
     * session and refreshing on them wastes a round trip per asset.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
