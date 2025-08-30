// Supabase client with lazy initialization to avoid runtime crashes when env vars are missing
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

let _client: SupabaseClient | null = null;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function ensureClient(): SupabaseClient {
  if (_client) return _client;
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
    );
  }
  _client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
  return _client;
}

export function getSupabaseClient(): SupabaseClient {
  return ensureClient();
}

// Export a proxy that lazily initializes the real client upon first use
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const real = ensureClient() as any;
    return real[prop as keyof SupabaseClient];
  },
  set(_target, prop, value) {
    const real = ensureClient() as any;
    real[prop as keyof SupabaseClient] = value;
    return true;
  },
}) as unknown as SupabaseClient;
