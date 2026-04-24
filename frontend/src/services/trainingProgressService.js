import { supabase } from './supabaseClient';
import { getTrainingModule, normalizeTrainingModule } from './trainingModuleService';

function normalizeTrainingProgress(progress) {
  if (!progress) return null;

  return {
    ...progress,
    moduleId: progress.module_id ?? progress.moduleId,
    userId: progress.user_id ?? progress.userId,
    currentSlide: progress.current_slide ?? progress.currentSlide ?? 0,
    quizAnswers: progress.quiz_answers ?? progress.quizAnswers ?? [],
    startedAt: progress.started_at ?? progress.startedAt ?? null,
    completedAt: progress.completed_at ?? progress.completedAt ?? null,
    createdAt: progress.created_at ?? progress.createdAt ?? null,
    updatedAt: progress.updated_at ?? progress.updatedAt ?? null,
  };
}

function normalizeCertificate(certificate) {
  if (!certificate) return null;

  return {
    ...certificate,
    trainingModuleId: certificate.training_module_id ?? certificate.trainingModuleId,
    certificateNumber: certificate.certificate_number ?? certificate.certificateNumber,
    issueDate: certificate.issue_date ?? certificate.issueDate ?? null,
    completionScore: certificate.completion_score ?? certificate.completionScore ?? null,
  };
}

async function getLatestCertificateForModule(userId, moduleId) {
  const { data, error } = await supabase
    .from('certificates')
    .select('id, training_module_id, certificate_number, issue_date, completion_score, module_title, status')
    .eq('user_id', userId)
    .eq('training_module_id', moduleId)
    .order('issue_date', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const latest = Array.isArray(data) ? data[0] ?? null : null;
  return normalizeCertificate(latest);
}

/**
 * Get training progress for a user
 */
export async function getUserTrainingProgress(userId, moduleId = null) {
  if (moduleId) {
    const { data, error } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    const progress = Array.isArray(data) ? data[0] ?? null : null;
    return normalizeTrainingProgress(progress);
  }

  const { data, error } = await supabase
    .from('training_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(normalizeTrainingProgress);
}

/**
 * Start a training module
 */
export async function startTrainingModule(userId, moduleId) {
  const module = normalizeTrainingModule(await getTrainingModule(moduleId));
  if (!module?.company_id) {
    throw new Error('Training module is missing company context');
  }

  const existing = await getUserTrainingProgress(userId, moduleId);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('training_progress')
    .upsert(
      {
        company_id: module.company_id,
        user_id: userId,
        module_id: moduleId,
        status: existing?.status === 'completed' ? 'completed' : 'in_progress',
        started_at: existing?.startedAt ?? now,
        attempts: existing?.attempts ?? 0,
        current_slide: existing?.currentSlide ?? 0,
        score: existing?.score ?? null,
      },
      { onConflict: 'user_id,module_id' }
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeTrainingProgress(data);
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

  return normalizeTrainingProgress(data);
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

  return normalizeTrainingProgress(data);
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
        estimated_minutes,
        passing_score
      )
    `
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((row) => ({
    ...normalizeTrainingProgress(row),
    module: normalizeTrainingModule(row.training_modules),
  }));
}

/**
 * Get training statistics for all users (admin)
 */
export async function getTrainingStatistics() {
  const { data, error } = await supabase
    .from('training_progress')
    .select(
      `
      id,
      module_id,
      user_id,
      status,
      score,
      current_slide,
      attempts,
      training_modules!inner (
        title,
        category,
        difficulty,
        passing_score
      ),
      users!inner (
        email,
        id
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // Then fetch user profiles in a separate query to avoid relationship issues
  const userIds = [...new Set((data || []).map(row => row.user_id))];
  let userProfiles = {};
  
  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);
    
    if (!profileError && profiles) {
      userProfiles = Object.fromEntries(profiles.map(p => [p.user_id, p.full_name]));
    }
  }

  return (data || []).map((row) => ({
    ...normalizeTrainingProgress(row),
    userName: userProfiles[row.user_id] || row.users?.email || 'User',
    userEmail: row.users?.email || null,
    moduleTitle: row.training_modules?.title || 'Training Module',
    moduleCategory: row.training_modules?.category || null,
    moduleDifficulty: row.training_modules?.difficulty || null,
    passingScore: row.training_modules?.passing_score ?? 70,
  }));
}

/**
 * Submit quiz answers for a module and finalize progress.
 */
export async function submitTrainingQuiz(userId, moduleId, answers) {
  const module = normalizeTrainingModule(await getTrainingModule(moduleId));
  if (!module?.company_id) {
    throw new Error('Training module not found');
  }
  const existing = await getUserTrainingProgress(userId, moduleId);

  const slides = Array.isArray(module.content) ? module.content : [];
  const quizSlides = slides.filter((slide) => slide.type === 'quiz');

  const totalQuestions = quizSlides.length;
  const correctAnswers = quizSlides.reduce((count, slide, index) => {
    return count + (Number(answers[index] ?? -1) === Number(slide.correctAnswer ?? -2) ? 1 : 0);
  }, 0);

  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 100;
  const passed = score >= Number(module.passingScore ?? 70);

  const payload = {
    company_id: module.company_id,
    user_id: userId,
    module_id: moduleId,
    status: passed ? 'completed' : 'in_progress',
    score,
    completed_at: passed ? new Date().toISOString() : null,
    started_at: existing?.startedAt ?? new Date().toISOString(),
    current_slide: slides.length > 0 ? slides.length - 1 : 0,
    quiz_answers: answers,
    attempts: Number(existing?.attempts ?? 0) + 1,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('training_progress')
    .upsert(payload, { onConflict: 'user_id,module_id' })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  let certificate = null;
  if (passed) {
    try {
      certificate = await getLatestCertificateForModule(userId, moduleId);
    } catch (certificateError) {
      console.warn('Certificate lookup failed after module completion:', certificateError);
    }
  }

  return {
    score,
    passed,
    correctAnswers,
    totalQuestions,
    module,
    progress: normalizeTrainingProgress(data),
    certificate,
  };
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
