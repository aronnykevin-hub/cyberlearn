import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { Id } from "../convex/_generated/dataModel";

interface Props {
  onClose: () => void;
}

const typeColors: Record<string, string> = {
  alert: "bg-red-500/20 text-red-400 border-red-500/30",
  training: "bg-green-500/20 text-green-400 border-green-500/30",
  report: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  system: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const typeIcons: Record<string, string> = {
  alert: "🚨",
  training: "📚",
  report: "⚠️",
  system: "🔔",
};

export function NotificationsPanel({ onClose }: Props) {
  const notifications = useQuery(api.notifications.getMyNotifications) ?? [];
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-indigo-400" />
            <h2 className="font-semibold text-white">Notifications</h2>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
              {notifications.filter((n) => !n.isRead).length} unread
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => markAllAsRead({})}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <CheckCheck size={14} />
              All read
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
              <Bell size={40} className="opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer ${!n.isRead ? "bg-indigo-950/20" : ""}`}
                  onClick={() => !n.isRead && markAsRead({ notificationId: n._id as Id<"notifications"> })}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{typeIcons[n.type] ?? "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${typeColors[n.type] ?? typeColors.system}`}>
                          {n.type}
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-white truncate">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(n._creationTime).toLocaleString()}
                      </p>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead({ notificationId: n._id as Id<"notifications"> });
                        }}
                        className="text-gray-500 hover:text-indigo-400 flex-shrink-0"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

