import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs first on every matched request. Two jobs.
 *
 * 1. Surface routing. The same codebase is deployed to Vercel more than once.
 *    The main deployment serves everything; a second project sets
 *    NEXT_PUBLIC_KAA_SURFACE=fieldops and serves only Kaa Field Ops, at its own
 *    domain, with its own root. Field agents never pass through the public site
 *    to reach their work.
 *
 * 2. Supabase session refresh. Server Components cannot write cookies, so a
 *    rotated refresh token has nowhere to land unless something upstream does
 *    it. The symptom otherwise is users logged out at random.
 *
 * Renamed from `middleware` in Next.js 16, see
 * node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md
 */

const SURFACE = process.env.NEXT_PUBLIC_KAA_SURFACE;

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
  if (SURFACE !== "fieldops") return null;

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/field") || PASSTHROUGH.some((p) => pathname.startsWith(p))) {
    return null;
  }

  // Everything else on this deployment is Field Ops, mounted at the root, so
  // /capture serves /field/capture and bare / serves the agent's day.
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/field" : `/field${pathname}`;
  return NextResponse.rewrite(url);
}

export async function proxy(request: NextRequest) {
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
