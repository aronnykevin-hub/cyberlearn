import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isValidHttpUrl(value) {
  if (!value || typeof value !== 'string') return false;
  if (value.includes('your-supabase-url-here')) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidAnonKey(value) {
  if (!value || typeof value !== 'string') return false;
  if (value.includes('your-supabase-anon-key-here')) return false;
  return value.length > 20;
}

export const isSupabaseConfigured = isValidHttpUrl(supabaseUrl) && isValidAnonKey(supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error(
    '[Supabase] Invalid configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.',
  );
}

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

