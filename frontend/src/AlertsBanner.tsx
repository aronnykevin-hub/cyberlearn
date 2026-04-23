import { useState } from "react";
import { AlertTriangle, X, Info, Zap, ShieldAlert } from "lucide-react";

interface Alert {
  _id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "danger" | "critical";
  targetRole: string;
}

interface Props {
  alerts: Alert[];
}

const severityConfig = {
  info: {
    bg: "bg-blue-950/60 border-blue-700",
    icon: <Info size={16} className="text-blue-400 flex-shrink-0" />,
    badge: "bg-blue-500/20 text-blue-300",
    text: "text-blue-200",
  },
  warning: {
    bg: "bg-yellow-950/60 border-yellow-700",
    icon: <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />,
    badge: "bg-yellow-500/20 text-yellow-300",
    text: "text-yellow-200",
  },
  danger: {
    bg: "bg-orange-950/60 border-orange-700",
    icon: <ShieldAlert size={16} className="text-orange-400 flex-shrink-0" />,
    badge: "bg-orange-500/20 text-orange-300",
    text: "text-orange-200",
  },
  critical: {
    bg: "bg-red-950/60 border-red-700",
    icon: <Zap size={16} className="text-red-400 flex-shrink-0 animate-pulse" />,
    badge: "bg-red-500/20 text-red-300",
    text: "text-red-200",
  },
};

export function AlertsBanner({ alerts }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = alerts.filter((a) => !dismissed.has(a._id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {visible.map((alert) => {
        const cfg = severityConfig[alert.severity] ?? severityConfig.info;
        return (
          <div
            key={alert._id}
            className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.bg}`}
          >
            {cfg.icon}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${cfg.badge}`}>
                  {alert.severity}
                </span>
                <span className={`text-sm font-semibold ${cfg.text}`}>{alert.title}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{alert.message}</p>
            </div>
            <button
              onClick={() => setDismissed((prev) => new Set([...prev, alert._id]))}
              className="text-gray-500 hover:text-gray-300 flex-shrink-0 p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
