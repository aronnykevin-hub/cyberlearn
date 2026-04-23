import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Bell, Plus, X, AlertTriangle, Info, Zap, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";

const severityConfig = {
  info: { icon: <Info size={14} />, color: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Info" },
  warning: { icon: <AlertTriangle size={14} />, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Warning" },
  danger: { icon: <ShieldAlert size={14} />, color: "bg-orange-500/20 text-orange-400 border-orange-500/30", label: "Danger" },
  critical: { icon: <Zap size={14} />, color: "bg-red-500/20 text-red-400 border-red-500/30", label: "Critical" },
};

export function AdminAlerts() {
  const alerts = useQuery(api.alerts.getAllAlerts) ?? [];
  const createAlert = useMutation(api.alerts.createAlert);
  const dismissAlert = useMutation(api.alerts.dismissAlert);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"info" | "warning" | "danger" | "critical">("warning");
  const [targetRole, setTargetRole] = useState<"all" | "employee" | "admin">("all");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) { toast.error("Please fill in all fields."); return; }
    setSubmitting(true);
    try {
      await createAlert({ title, message, severity, targetRole });
      toast.success("Alert created and users notified!");
      setTitle(""); setMessage(""); setSeverity("warning"); setTargetRole("all");
      setShowForm(false);
    } catch {
      toast.error("Failed to create alert.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = async (alertId: Id<"alerts">) => {
    try {
      await dismissAlert({ alertId });
      toast.success("Alert dismissed");
    } catch {
      toast.error("Failed to dismiss alert");
    }
  };

  const active = alerts.filter((a) => a.isActive);
  const inactive = alerts.filter((a) => !a.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Security Alerts</h2>
          <p className="text-gray-400 text-sm mt-1">Broadcast security alerts to users in real-time</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New Alert
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-gray-900 border border-purple-800/50 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Bell size={16} className="text-purple-400" /> Create Security Alert
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Alert Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Active Phishing Campaign Detected"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the threat and what users should do..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Severity</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["info", "warning", "danger", "critical"] as const).map((s) => {
                    const cfg = severityConfig[s];
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSeverity(s)}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-all ${
                          severity === s ? cfg.color : "border-gray-700 bg-gray-800 text-gray-400"
                        }`}
                      >
                        {cfg.icon} {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Target Audience</label>
                <div className="space-y-1.5">
                  {(["all", "employee", "admin"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTargetRole(r)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg border text-xs transition-all capitalize ${
                        targetRole === r
                          ? "border-purple-500 bg-purple-500/20 text-purple-300"
                          : "border-gray-700 bg-gray-800 text-gray-400"
                      }`}
                    >
                      {r === "all" ? "🌐 All Users" : r === "admin" ? "🛡️ Admins Only" : "👤 Employees Only"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Bell size={14} /> {submitting ? "Sending..." : "Send Alert"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Alerts */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Active Alerts ({active.length})
        </h3>
        {active.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <Bell size={32} className="text-gray-700 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No active alerts</p>
          </div>
        ) : (
          <div className="space-y-2">
            {active.map((alert) => {
              const cfg = severityConfig[alert.severity as keyof typeof severityConfig] ?? severityConfig.info;
              return (
                <div key={alert._id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg border ${cfg.color} flex-shrink-0`}>{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-xs text-gray-500 capitalize">→ {alert.targetRole}</span>
                      </div>
                      <p className="text-sm font-medium text-white">{alert.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{alert.message}</p>
                      <p className="text-xs text-gray-600 mt-1">{new Date(alert._creationTime).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => handleDismiss(alert._id as Id<"alerts">)}
                      className="text-gray-500 hover:text-red-400 p-1 flex-shrink-0 transition-colors"
                      title="Dismiss alert"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Alerts */}
      {inactive.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Past Alerts ({inactive.length})
          </h3>
          <div className="space-y-2">
            {inactive.slice(0, 5).map((alert) => (
              <div key={alert._id} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-3 opacity-60">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400 border border-gray-600">
                    {alert.severity}
                  </span>
                  <p className="text-sm text-gray-400 truncate">{alert.title}</p>
                  <span className="text-xs text-gray-600 ml-auto flex-shrink-0">Dismissed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
