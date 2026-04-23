import { useEffect, useMemo, useState } from 'react';
import { Bell, X, Check, CheckCheck, FlaskConical } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToNotifications,
} from './services/notificationService';

interface Props {
  onClose: () => void;
}

const typeColors: Record<string, string> = {
  alert: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  training: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  report: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  system: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
};

const typeIcons: Record<string, string> = {
  alert: 'Alert',
  training: 'Training',
  report: 'Report',
  system: 'System',
};

export function NotificationsPanel({ onClose }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.is_read !== true).length,
    [notifications],
  );

  useEffect(() => {
    let mounted = true;
    let channel: { unsubscribe?: () => void } | null = null;

    const load = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const nextUserId = authData?.user?.id || null;
        if (!mounted) return;
        setUserId(nextUserId);

        if (!nextUserId) {
          setNotifications([]);
          return;
        }

        const rows = await getUserNotifications(nextUserId);
        if (!mounted) return;
        setNotifications(rows || []);

        channel = subscribeToNotifications(nextUserId, async () => {
          const latest = await getUserNotifications(nextUserId);
          if (mounted) {
            setNotifications(latest || []);
          }
        });
      } catch (error) {
        if (mounted) {
          setNotifications([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
      channel?.unsubscribe?.();
    };
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId
            ? { ...item, is_read: true, updated_at: new Date().toISOString() }
            : item,
        ),
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: true,
          updated_at: new Date().toISOString(),
        })),
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={onClose}>
      <div
        className="w-full max-w-sm h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Notifications</h2>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
              {unreadCount} unread
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void handleMarkAllAsRead()}
              className="text-xs text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 flex items-center gap-1"
            >
              <CheckCheck size={14} />
              All read
            </button>
            <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-600 dark:text-slate-400">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-500">
              <Bell size={40} className="opacity-40" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {notifications.map((item) => {
                const isSimulation =
                  /\[simulation/i.test(item.title || '') ||
                  /\bsimulated?\b/i.test(item.message || '');

                return (
                  <div
                    key={item.id}
                    className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                      item.is_read ? '' : 'bg-indigo-50/60 dark:bg-indigo-900/10'
                    }`}
                    onClick={() => {
                      if (!item.is_read) {
                        void handleMarkAsRead(item.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {isSimulation ? (
                          <FlaskConical size={16} className="text-fuchsia-500" />
                        ) : (
                          <Bell size={16} className="text-indigo-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full border ${
                              typeColors[item.type] || typeColors.system
                            }`}
                          >
                            {typeIcons[item.type] || 'System'}
                          </span>
                          {isSimulation && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full border border-fuchsia-300 text-fuchsia-700 bg-fuchsia-50 dark:bg-fuchsia-900/20 dark:text-fuchsia-300 dark:border-fuchsia-700">
                              Simulation
                            </span>
                          )}
                          {!item.is_read && <span className="w-2 h-2 bg-indigo-500 rounded-full" />}
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-3">{item.message}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>

                      {!item.is_read && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleMarkAsRead(item.id);
                          }}
                          className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

