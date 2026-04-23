/**
 * Authentication Service for CyberLearn
 * Handles all auth operations with Supabase
 */

import { supabase } from './supabaseClient';

function getAuthRedirectUrl() {
  return `${window.location.origin}/`;
}

/**
 * Sign up a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data and session
 */
export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });

  if (error) {
    console.error('Sign up error:', error.message);
    throw new Error(error.message);
  }

  return {
    success: true,
    user: data.user,
    session: data.session,
    message: 'Sign up successful! Check your email for confirmation.',
  };
}

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data and session
 */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in error:', error.message);
    throw new Error(error.message);
  }

  return {
    success: true,
    user: data.user,
    session: data.session,
    message: 'Signed in successfully!',
  };
}

/**
 * Sign in with Google OAuth
 * @returns {Promise<Object>} Auth result
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthRedirectUrl(),
    },
  });

  if (error) {
    console.error('Google sign in error:', error.message);
    throw new Error(error.message);
  }

  return {
    success: true,
    message: 'Google sign in initiated',
  };
}

/**
 * Sign in anonymously
 * @returns {Promise<Object>} User session
 */
export async function signInAnonymously() {
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.error('Anonymous sign in error:', error.message);
    throw new Error(error.message);
  }

  return {
    success: true,
    user: data.user,
    session: data.session,
    message: 'Anonymous sign in successful',
  };
}

/**
 * Sign out the current user
 * @returns {Promise<Object>} Sign out result
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Sign out error:', error.message);
    throw new Error(error.message);
  }

  return {
    success: true,
    message: 'Signed out successfully',
  };
}

/**
 * Reset password via email
 * @param {string} email - User email
 * @returns {Promise<Object>} Reset result
 */
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    console.error('Password reset error:', error.message);
    throw new Error(error.message);
  }

  return {
    success: true,
    message: 'Password reset email sent. Check your inbox.',
  };
}

/**
 * Update user password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Update result
 */
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error('Password update error:', error.message);
    throw new Error(error.message);
  }

  return {
    success: true,
    message: 'Password updated successfully',
  };
}

/**
 * Get current user session
 * @returns {Promise<Object>} Current session or null
 */
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Get session error:', error.message);
    throw new Error(error.message);
  }

  return {
    success: true,
    session: data.session,
    user: data.session?.user || null,
  };
}

/**
 * Get current authenticated user
 * @returns {Promise<Object>} Current user or null
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Get user error:', error.message);
    throw new Error(error.message);
  }

  return {
    success: true,
    user: data.user,
  };
}

/**
 * Link email to anonymous user
 * @param {string} email - Email address
 * @param {string} password - Password
 * @returns {Promise<Object>} Link result
 */
export async function linkEmailToAnonymous(email, password) {
  const { data, error } = await supabase.auth.updateUser({
    email,
    password,
  });

  if (error) {
    console.error('Link email error:', error.message);
    throw new Error(error.message);
  }

  return {
    success: true,
    user: data.user,
    message: 'Email linked to account successfully',
  };
}

/**
 * Verify OTP token
 * @param {string} email - Email address
 * @param {string} token - OTP token
 * @param {string} type - Token type (email, phone, recovery)
 * @returns {Promise<Object>} Verification result
 */
export async function verifyOtp(email, token, type = 'email') {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  });

  if (error) {
    console.error('OTP verification error:', error.message);
    throw new Error(error.message);
  }

  return {
    success: true,
    user: data.user,
    session: data.session,
    message: 'OTP verified successfully',
  };
}

/**
 * Update user metadata
 * @param {Object} metadata - User metadata to update
 * @returns {Promise<Object>} Update result
 */
export async function updateUserMetadata(metadata) {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });

  if (error) {
    console.error('Update metadata error:', error.message);
    throw new Error(error.message);
  }

  return {
    success: true,
    user: data.user,
    message: 'User metadata updated successfully',
  };
}

/**
 * Set up auth state change listener
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return data.subscription.unsubscribe;
}

/**
 * Get auth token
 * @returns {Promise<string|null>} Access token or null
 */
export async function getAuthToken() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    return data.session?.access_token || null;
  } catch (error) {
    console.error('Get token error:', error.message);
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} True if user is authenticated
 */
export async function isAuthenticated() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return false;
    }

    return !!data.user;
  } catch (error) {
    console.error('Auth check error:', error.message);
    return false;
  }
}

export default {
  signUpWithEmail,
  signUp: signUpWithEmail, // Alias
  signInWithEmail,
  signIn: signInWithEmail, // Alias
  signInWithGoogle,
  signInAnonymously,
  signOut,
  resetPassword,
  updatePassword,
  getCurrentSession,
  getCurrentUser,
  linkEmailToAnonymous,
  verifyOtp,
  updateUserMetadata,
  onAuthStateChange,
  getAuthToken,
  isAuthenticated,
};
