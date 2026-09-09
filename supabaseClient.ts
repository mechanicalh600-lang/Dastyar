
import { createClient } from '@supabase/supabase-js';

export const MUSEUM_SESSION_KEY = 'newray_museum_session';

export const setMuseumSession = (token: string) => {
  if (typeof window !== 'undefined' && token) {
    window.localStorage.setItem(MUSEUM_SESSION_KEY, token);
  }
};

export const clearMuseumSession = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(MUSEUM_SESSION_KEY);
  }
};

export const getMuseumSession = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(MUSEUM_SESSION_KEY);
};

function getEnv(key: string): string | undefined {
  try {
    // @ts-ignore - Vite injects import.meta.env at build time.
    if (typeof import.meta !== 'undefined' && import.meta && import.meta.env) {
      // @ts-ignore
      const value = import.meta.env[key];
      return typeof value === 'string' && value.trim() ? value.trim() : undefined;
    }
  } catch (err) {
    console.warn(`Error accessing environment variable ${key}:`, err);
  }
  return undefined;
}

// Runtime configuration must come from environment variables only.
// No live Supabase URL or publishable/anon key is stored in source control.
export const supabaseUrl = getEnv('VITE_SUPABASE_URL') || '';
export const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

const museumFetch: typeof fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const options = init ?? {};
  const headers = new Headers(options.headers);
  const token = getMuseumSession();
  if (token) headers.set('x-museum-session', token);
  return fetch(input, { ...options, headers });
};

// Use non-live placeholders only so the historical UI can render a controlled
// connection error instead of crashing when configuration has not been supplied yet.
export const supabase = createClient(
  supabaseUrl || 'https://missing-config.invalid',
  supabaseAnonKey || 'missing-config',
  {
    global: { fetch: museumFetch },
  }
);

export const restoreMuseumSession = async () => {
  if (!getMuseumSession() || !supabaseUrl || !supabaseAnonKey) return null;
  try {
    const { data, error } = await supabase.rpc('museum_current_user');
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row?.id) {
      clearMuseumSession();
      return null;
    }
    return row;
  } catch {
    clearMuseumSession();
    return null;
  }
};

export const logoutMuseumSession = async () => {
  if (!getMuseumSession() || !supabaseUrl || !supabaseAnonKey) {
    clearMuseumSession();
    return;
  }
  try {
    await supabase.rpc('museum_logout');
  } catch (error) {
    console.warn('Museum session logout failed:', error);
  } finally {
    clearMuseumSession();
  }
};
