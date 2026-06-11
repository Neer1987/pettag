import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, ''),
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    );
  }

  return client;
}

export function getWebBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_WEB_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://pettag.app';
}

export function getIosAppUrl(): string {
  return import.meta.env.VITE_IOS_APP_URL || 'https://apps.apple.com/app/pettag';
}

export function getAndroidAppUrl(): string {
  return (
    import.meta.env.VITE_ANDROID_APP_URL ||
    'https://play.google.com/store/apps/details?id=app.pettag'
  );
}

export function getDeepLinkUrl(qrCodeId: string): string {
  return `pettag://pet/${qrCodeId}`;
}
