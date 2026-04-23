import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { AlertTriangle, Search, Filter, CheckCircle, Clock, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";

const severityColors: Record<string, string> = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusConfig: Record<string, { color: string; label: string }> = {
  open: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Open" },
  investigating: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Investigating" },
  resolved: { color: "bg-green-500/20 text-green-400 border-green-500/30", label: "Resolved" },
  dismissed: { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", label: "Dismissed" },
};

const typeEmojis: Record<string, string> = {
  phishing: "🎣", malware: "🦠", suspicious_email: "📧",
  unauthorized_access: "🔓", data_breach: "💾", social_engineering: "🎭", other: "⚠️",
};

export function AdminReports() {
  const reports = useQuery(api.threats.getAllReports) ?? [];
  const updateStatus = useMutation(api.threats.updateReportStatus);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const filtered = reports.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.reporterEmail ?? "").toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchSeverity = severityFilter === "all" || r.severity === severityFilter;
    return matchSearch && matchStatus && matchSeverity;
  });

  const selectedReport = reports.find((r) => r._id === selected);

  const handleUpdateStatus = async (status: "open" | "investigating" | "resolved" | "dismissed") => {
    if (!selected) return;
    setUpdating(true);
    try {
      await updateStatus({
        reportId: selected as Id<"threatReports">,
        status,
        adminNotes: adminNotes || undefined,
      });
      toast.success(`Report marked as ${status}`);
      setSelected(null);
      setAdminNotes("");
    } catch {
      toast.error("Failed to update report");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Threat Reports</h2>
        <p className="text-gray-400 text-sm mt-1">Review and manage all submitted threat reports</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-300 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-gray-300 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Summary Badges */}
      <div className="flex gap-2 flex-wrap">
        {["open", "investigating", "resolved", "dismissed"].map((s) => {
          const count = reports.filter((r) => r.status === s).length;
          const cfg = statusConfig[s];
          return (
            <span key={s} className={`text-xs px-3 py-1 rounded-full border ${cfg.color}`}>
              {cfg.label}: {count}
            </span>
          );
        })}
      </div>

      {/* Reports List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <AlertTriangle size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No reports found</p>
          </div>
        ) : (
          filtered.map((report) => (
            <div
              key={report._id}
              className={`bg-gray-900 border rounded-xl p-4 hover:border-gray-700 transition-colors cursor-pointer ${
                selected === report._id ? "border-indigo-600" : "border-gray-800"
              }`}
              onClick={() => setSelected(selected === report._id ? null : report._id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{typeEmojis[report.type] ?? "⚠️"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColors[report.severity]}`}>
                      {report.severity}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusConfig[report.status]?.color}`}>
                      {statusConfig[report.status]?.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white">{report.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {report.reporterEmail ?? "Unknown"} · {new Date(report._creationTime).toLocaleString()}
                  </p>
                </div>
                <Eye size={16} className={`text-gray-600 flex-shrink-0 mt-1 ${selected === report._id ? "text-indigo-400" : ""}`} />
              </div>

              {selected === report._id && (
                <div className="mt-4 pt-4 border-t border-gray-800 space-y-4" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Description</p>
                    <p className="text-sm text-gray-300">{report.description}</p>
                  </div>
                  {report.affectedSystems && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Affected Systems</p>
                      <p className="text-sm text-gray-300">{report.affectedSystems}</p>
                    </div>
                  )}
                  {report.adminNotes && (
                    <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-lg p-3">
                      <p className="text-xs text-indigo-400 font-medium mb-1">Previous Admin Notes</p>
                      <p className="text-sm text-gray-300">{report.adminNotes}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Admin Notes</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this report..."
                      rows={2}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none resize-none"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(["investigating", "resolved", "dismissed"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleUpdateStatus(s)}
                        disabled={updating || report.status === s}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${
                          s === "resolved" ? "bg-green-700 hover:bg-green-600 text-white" :
                          s === "investigating" ? "bg-yellow-700 hover:bg-yellow-600 text-white" :
                          "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        }`}
                      >
                        {s === "resolved" ? <CheckCircle size={12} /> : s === "investigating" ? <Clock size={12} /> : <XCircle size={12} />}
                        Mark {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
