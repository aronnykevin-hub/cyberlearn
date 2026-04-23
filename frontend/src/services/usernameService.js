import { supabase } from './supabaseClient';

/**
 * Convert username to internal email format for Supabase
 * Uses .test TLD (reserved for testing) as it passes email validation
 */
export function usernameToEmail(username) {
  // Sanitize username: lowercase, replace spaces/special chars with underscores
  const sanitized = username.toLowerCase().replace(/[^a-z0-9._-]/g, '_');
  return `${sanitized}@cyberlearn.test`;
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailable(username) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const email = usernameToEmail(username);
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  // If error is "no rows returned", username is available
  if (error?.code === 'PGRST116') {
    return true;
  }

  // If we got data, username is taken
  if (data) {
    return false;
  }

  // Any other error, throw it
  if (error) {
    throw new Error(error.message);
  }

  return false;
}

/**
 * Register username in user_profiles
 * If profile exists (from backend trigger), updates it with the username
 * If profile doesn't exist, creates it
 */
export async function registerUsername(userId, username) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  try {
    // First, try to update existing profile
    const { data: existing, error: selectError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = "no rows returned", which means we need to create
      throw selectError;
    }

    if (existing) {
      // Profile already exists, update it with the username
      console.log(`[Profile] Profile exists for ${userId}, updating with full_name`);
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ full_name: username })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Profile doesn't exist, create it
      console.log(`[Profile] Creating new profile for ${userId}`);
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: userId,
            full_name: username,
            role: 'employee',
            is_active: true,
          },
        ]);

      if (insertError) {
        throw insertError;
      }
    }
  } catch (error) {
    console.error(`[Profile] Error managing profile: ${error.message}`);
    throw new Error(`Failed to register username: ${error.message}`);
  }
}

export default {
  usernameToEmail,
  checkUsernameAvailable,
  registerUsername,
};
