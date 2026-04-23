import { supabase } from './supabaseClient';

/**
 * Get user profile by user ID
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Create a new user profile
 */
export async function createUserProfile(userId, profile) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      role: profile.role || 'employee',
      department: profile.department,
      job_title: profile.jobTitle,
      phone: profile.phone,
      is_active: profile.isActive !== undefined ? profile.isActive : true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...(updates.role && { role: updates.role }),
      ...(updates.department && { department: updates.department }),
      ...(updates.jobTitle && { job_title: updates.jobTitle }),
      ...(updates.phone && { phone: updates.phone }),
      ...(updates.isActive !== undefined && { is_active: updates.isActive }),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(filters = {}) {
  let query = supabase.from('user_profiles').select('*');

  if (filters.role) {
    query = query.eq('role', filters.role);
  }

  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  if (filters.department) {
    query = query.eq('department', filters.department);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Search users by name or email
 */
export async function searchUsers(searchTerm) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .or(
      `id.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%,job_title.ilike.%${searchTerm}%`
    );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
