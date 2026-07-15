/**
 * Central place to read environment configuration.
 *
 * The whole app is designed to degrade gracefully: every feature that
 * depends on an external service checks one of these booleans first and
 * falls back to mock data / static UI when the key is absent. Nothing
 * here ever throws — a missing key is a normal, supported state.
 */

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
};

/** True when both Supabase env vars are present and look real. */
export const hasSupabase =
  env.supabaseUrl.startsWith('http') && env.supabaseAnonKey.length > 20;

/** True when a Mapbox token is present. */
export const hasMapbox = env.mapboxToken.startsWith('pk.');

/** Convenience flag surfaced in the UI so testers know what mode they're in. */
export const isDemoMode = !hasSupabase;
