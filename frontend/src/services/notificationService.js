import { supabase } from './supabaseClient';

/**
 * Get all notifications for current user
 */
export async function getUserNotifications(userId, filters = {}) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId);

  if (filters.isRead !== undefined) {
    query = query.eq('is_read', filters.isRead);
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
}

/**
 * Create a notification
 */
export async function createNotification(notification) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'system',
      related_id: notification.relatedId,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Clear all notifications for a user
 */
export async function clearAllNotifications(userId) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Subscribe to real-time notifications
 */
export function subscribeToNotifications(userId, callback) {
  const subscription = supabase
    .channel(`notifications_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return subscription;
}
