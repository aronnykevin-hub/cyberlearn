import { supabase } from './supabaseClient';

/**
 * Get all threat reports for current user
 */
export async function getUserThreatReports(userId, filters = {}) {
  let query = supabase
    .from('threat_reports')
    .select('*')
    .eq('reporter_id', userId);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.severity) {
    query = query.eq('severity', filters.severity);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Get all threat reports (admin only)
 */
export async function getAllThreatReports(filters = {}) {
  let query = supabase.from('threat_reports').select('*');

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.severity) {
    query = query.eq('severity', filters.severity);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Get a specific threat report
 */
export async function getThreatReport(reportId) {
  const { data, error } = await supabase
    .from('threat_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Create a threat report
 */
export async function createThreatReport(userId, report) {
  const { data, error } = await supabase
    .from('threat_reports')
    .insert({
      reporter_id: userId,
      type: report.type,
      severity: report.severity,
      title: report.title,
      description: report.description,
      affected_systems: report.affectedSystems,
      status: 'open',
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Update a threat report
 */
export async function updateThreatReport(reportId, updates) {
  const updateData = {};

  if (updates.type) updateData.type = updates.type;
  if (updates.severity) updateData.severity = updates.severity;
  if (updates.title) updateData.title = updates.title;
  if (updates.description) updateData.description = updates.description;
  if (updates.affectedSystems) updateData.affected_systems = updates.affectedSystems;
  if (updates.status) updateData.status = updates.status;
  if (updates.adminNotes) updateData.admin_notes = updates.adminNotes;
  if (updates.status === 'resolved') {
    updateData.resolved_at = new Date().toISOString();
    if (updates.resolvedBy) updateData.resolved_by = updates.resolvedBy;
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('threat_reports')
    .update(updateData)
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Delete a threat report (only if still open)
 */
export async function deleteThreatReport(reportId) {
  const { error } = await supabase
    .from('threat_reports')
    .delete()
    .eq('id', reportId)
    .eq('status', 'open');

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get threat statistics (admin)
 */
export async function getThreatStatistics() {
  const { data, error } = await supabase
    .from('threat_reports')
    .select('type, severity, status, created_at');

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
