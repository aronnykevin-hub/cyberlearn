import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton instance of Supabase client
let supabaseInstance: SupabaseClient | null = null;

/**
 * Initialize Supabase client as a singleton
 * Ensures only one GoTrueClient instance exists across the app
 */
export function initSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Validation
  if (!supabaseUrl) {
    const msg = '❌ [Supabase] Missing VITE_SUPABASE_URL in environment variables';
    console.error(msg);
    throw new Error(msg);
  }
  
  if (!supabaseAnonKey) {
    const msg = '❌ [Supabase] Missing VITE_SUPABASE_ANON_KEY in environment variables';
    console.error(msg);
    throw new Error(msg);
  }

  try {
    // Create client with optimized settings
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    console.log('✅ [Supabase] Client initialized (singleton instance)');
    console.log(`✅ [Supabase] Project: ${supabaseUrl.split('.')[0].split('//')[1]}`);
    return supabaseInstance;
  } catch (err) {
    console.error('❌ [Supabase] Failed to initialize client:', err);
    throw err;
  }
}

/**
 * Get the Supabase client instance
 * Creates it if it doesn't exist yet
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    return initSupabaseClient();
  }
  return supabaseInstance;
}

// Initialize on module load to catch configuration errors early
export const supabase = getSupabaseClient();
