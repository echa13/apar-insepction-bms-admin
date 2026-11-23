import { createClient } from '@supabase/supabase-js';

// Default Supabase project configuration
// Prioritize environment variables, fallback gracefully to project defaults so build never crashes
const DEFAULT_SUPABASE_URL = 'https://vekfijwvhzphqvkbjltb.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_y9FywvoEACMzkbL2loTIxQ_nWKjIyjk';

export const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  DEFAULT_SUPABASE_URL;

export const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  DEFAULT_SUPABASE_KEY;

// Safe client creation ensuring it never throws unhandled fatal errors during module evaluation
let client = null;
try {
  client = createClient(
    supabaseUrl || DEFAULT_SUPABASE_URL,
    supabaseAnonKey || DEFAULT_SUPABASE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  );
} catch (err) {
  console.warn('Fallback Supabase client initialization:', err?.message || err);
  client = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
}

export const supabase = client;
