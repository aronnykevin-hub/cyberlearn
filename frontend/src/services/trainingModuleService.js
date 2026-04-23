import { supabase } from './supabaseClient';

/**
 * Get all training modules
 */
export async function getTrainingModules(filters = {}) {
  let query = supabase.from('training_modules').select('*').eq('is_active', true);

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.difficulty) {
    query = query.eq('difficulty', filters.difficulty);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Get a specific training module with full content
 */
export async function getTrainingModule(moduleId) {
  const { data, error } = await supabase
    .from('training_modules')
    .select('*')
    .eq('id', moduleId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Create a new training module (admin only)
 */
export async function createTrainingModule(module) {
  const { data, error } = await supabase
    .from('training_modules')
    .insert({
      title: module.title,
      description: module.description,
      category: module.category,
      difficulty: module.difficulty,
      estimated_minutes: module.estimatedMinutes,
      content: module.content || [],
      is_active: module.isActive !== undefined ? module.isActive : true,
      required_for_roles: module.requiredForRoles || [],
      passing_score: module.passingScore || 70,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Update a training module (admin only)
 */
export async function updateTrainingModule(moduleId, updates) {
  const updateData = {};

  if (updates.title) updateData.title = updates.title;
  if (updates.description) updateData.description = updates.description;
  if (updates.category) updateData.category = updates.category;
  if (updates.difficulty) updateData.difficulty = updates.difficulty;
  if (updates.estimatedMinutes) updateData.estimated_minutes = updates.estimatedMinutes;
  if (updates.content) updateData.content = updates.content;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
  if (updates.requiredForRoles) updateData.required_for_roles = updates.requiredForRoles;
  if (updates.passingScore) updateData.passing_score = updates.passingScore;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('training_modules')
    .update(updateData)
    .eq('id', moduleId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Delete a training module (admin only)
 */
export async function deleteTrainingModule(moduleId) {
  const { error } = await supabase.from('training_modules').delete().eq('id', moduleId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Search training modules
 */
export async function searchTrainingModules(searchTerm) {
  const { data, error } = await supabase
    .from('training_modules')
    .select('*')
    .eq('is_active', true)
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
