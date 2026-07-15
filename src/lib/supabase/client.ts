import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env, hasSupabase } from '@/lib/env';

let cached: SupabaseClient | null = null;

/**
 * Returns a Supabase browser client, or `null` when Supabase isn't
 * configured. Callers MUST handle the null case and fall back to mock
 * data — this is what lets the app run with zero keys.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!hasSupabase) return null;
  if (cached) return cached;
  cached = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
  return cached;
}
