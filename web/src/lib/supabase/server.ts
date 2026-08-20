import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase is optional during early development: with no credentials the app
 * runs entirely off the seed dataset. Anything that needs a live database
 * checks `isSupabaseConfigured()` first and degrades rather than throwing.
 */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Request-scoped client that carries the signed-in user's session. */
export async function createClient() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(items) {
          try {
            for (const { name, value, options } of items) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — the proxy refreshes the session
            // instead, so this is safe to ignore.
          }
        },
      },
    },
  );
}
