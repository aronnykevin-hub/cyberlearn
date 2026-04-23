import { supabase, isSupabaseConfigured } from './supabaseClient';

// Re-export for backward compatibility
export { supabase };

function ensureSupabaseConfigured() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local and restart the dev server.',
    );
  }

  return supabase;
}

/**
 * Sign up a new user
 */
export async function signUp(email, password) {
  const client = ensureSupabaseConfigured();
  const { data, error } = await client.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign in an existing user
 */
export async function signIn(email, password) {
  const client = ensureSupabaseConfigured();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const client = ensureSupabaseConfigured();
  const { error } = await client.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const client = ensureSupabaseConfigured();
  const { data, error } = await client.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

/**
 * Get the current session
 */
export async function getSession() {
  const client = ensureSupabaseConfigured();
  const { data, error } = await client.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback) {
  if (!supabase) {
    callback(null, 'INITIAL_SESSION', null);
    return () => {};
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null, event, session);
  });

  return () => subscription.unsubscribe();
}

export default {
  isSupabaseConfigured,
  supabase,
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getSession,
  onAuthStateChange,
};
