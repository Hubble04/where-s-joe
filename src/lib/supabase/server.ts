import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { env, hasSupabase } from '@/lib/env';

/**
 * Server-side Supabase client for Server Components and Route Handlers.
 * Returns `null` when unconfigured so server code can fall back to mock
 * data exactly like the client does.
 */
export function getSupabaseServer(): SupabaseClient | null {
  if (!hasSupabase) return null;

  const cookieStore = cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore; middleware
          // (or the browser client) will refresh the session instead.
        }
      },
    },
  });
}
