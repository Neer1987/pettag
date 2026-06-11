import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { getErrorMessage, isNetworkError } from '@/lib/errors';
import type { Database } from '@/lib/supabase/types';

async function supabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Network connection failed. Check your internet and try again.'));
  }
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient<Database> | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseReachabilityHint(): string | null {
  if (!supabaseUrl) {
    return 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env, then restart Expo with npx expo start -c.';
  }

  if (Platform.OS !== 'web' && /localhost|127\.0\.0\.1/i.test(supabaseUrl)) {
    return 'Your Supabase URL uses localhost, which phones and emulators cannot reach. Use your hosted Supabase project URL from supabase.com, or your computer’s LAN IP for local dev.';
  }

  return null;
}

export function getSupabaseNetworkErrorMessage(error: unknown, fallback: string): string {
  if (isNetworkError(error)) {
    return getSupabaseReachabilityHint() ?? getErrorMessage(error, fallback);
  }

  return getErrorMessage(error, fallback);
}

export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env',
    );
  }

  if (!client) {
    client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: supabaseFetch,
      },
    });
  }

  return client;
}
