import { supabase } from './supabaseClient';

/**
 * Get active alerts for current user
 */
export async function getActiveAlerts(userRole) {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('is_active', true)
    .or(`target_role.eq.all,target_role.eq.${userRole}`)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Get all alerts (admin only)
 */
export async function getAllAlerts(filters = {}) {
  let query = supabase.from('alerts').select('*');

  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  if (filters.severity) {
    query = query.eq('severity', filters.severity);
  }

  if (filters.targetRole) {
    query = query.eq('target_role', filters.targetRole);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Get a specific alert
 */
export async function getAlert(alertId) {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('id', alertId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Create an alert (admin only)
 */
export async function createAlert(userId, alert) {
  const { data, error } = await supabase
    .from('alerts')
    .insert({
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      target_role: alert.targetRole || 'all',
      created_by: userId,
      is_active: alert.isActive !== undefined ? alert.isActive : true,
      expires_at: alert.expiresAt,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Update an alert (admin only)
 */
export async function updateAlert(alertId, updates) {
  const updateData = {};

  if (updates.title) updateData.title = updates.title;
  if (updates.message) updateData.message = updates.message;
  if (updates.severity) updateData.severity = updates.severity;
  if (updates.targetRole) updateData.target_role = updates.targetRole;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
  if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('alerts')
    .update(updateData)
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Delete an alert (admin only)
 */
export async function deleteAlert(alertId) {
  const { error } = await supabase.from('alerts').delete().eq('id', alertId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Deactivate an alert (admin only)
 */
export async function deactivateAlert(alertId) {
  const { data, error } = await supabase
    .from('alerts')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
