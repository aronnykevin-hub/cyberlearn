import { supabase } from './supabaseClient';

/**
 * Get training progress for a user
 */
export async function getUserTrainingProgress(userId, moduleId = null) {
  let query = supabase
    .from('training_progress')
    .select('*')
    .eq('user_id', userId);

  if (moduleId) {
    query = query.eq('module_id', moduleId).single();
  }

  const { data, error } = await query;

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Start a training module
 */
export async function startTrainingModule(userId, moduleId) {
  const { data, error } = await supabase
    .from('training_progress')
    .upsert(
      {
        user_id: userId,
        module_id: moduleId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        attempts: 1,
      },
      { onConflict: 'user_id,module_id' }
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Update training progress
 */
export async function updateTrainingProgress(userId, moduleId, updates) {
  const { data, error } = await supabase
    .from('training_progress')
    .update({
      ...(updates.status && { status: updates.status }),
      ...(updates.score !== undefined && { score: updates.score }),
      ...(updates.currentSlide !== undefined && { current_slide: updates.currentSlide }),
      ...(updates.quizAnswers && { quiz_answers: updates.quizAnswers }),
      ...(updates.attempts !== undefined && { attempts: updates.attempts }),
      ...(updates.status === 'completed' && { completed_at: new Date().toISOString() }),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Complete a training module
 */
export async function completeTrainingModule(userId, moduleId, score) {
  const { data, error } = await supabase
    .from('training_progress')
    .update({
      status: 'completed',
      score,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Get all training progress for a user (including module details)
 */
export async function getUserTrainingProgressWithDetails(userId) {
  const { data, error } = await supabase
    .from('training_progress')
    .select(
      `
      *,
      training_modules!inner (
        id,
        title,
        category,
        difficulty,
        estimated_minutes
      )
    `
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Get training statistics for all users (admin)
 */
export async function getTrainingStatistics() {
  const { data, error } = await supabase
    .from('training_progress')
    .select(
      `
      status,
      score,
      training_modules!inner (
        title,
        category
      ),
      user_id
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Reset training progress
 */
export async function resetTrainingProgress(userId, moduleId) {
  const { error } = await supabase
    .from('training_progress')
    .delete()
    .eq('user_id', userId)
    .eq('module_id', moduleId);

  if (error) {
    throw new Error(error.message);
  }
}
