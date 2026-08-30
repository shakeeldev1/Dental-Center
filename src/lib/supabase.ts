import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True once the public Supabase URL + anon key are provided in `.env`. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Browser Supabase client (anon key + user session — RLS enforced).
 * Null until credentials are configured, so the app can still render the
 * login screen during early development.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null;
