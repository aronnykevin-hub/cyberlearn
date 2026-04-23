import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Shield, Clock, CheckCircle, AlertTriangle, FileText, XCircle, Search } from "lucide-react";
import { useState } from "react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: {
    label: "Open",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: <Clock size={12} />,
  },
  investigating: {
    label: "Investigating",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    icon: <Search size={12} />,
  },
  resolved: {
    label: "Resolved",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: <CheckCircle size={12} />,
  },
  dismissed: {
    label: "Dismissed",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    icon: <XCircle size={12} />,
  },
};

const severityColors: Record<string, string> = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

const typeEmojis: Record<string, string> = {
  phishing: "🎣",
  malware: "🦠",
  suspicious_email: "📧",
  unauthorized_access: "🔓",
  data_breach: "💾",
  social_engineering: "🎭",
  other: "⚠️",
};

export function MyReports() {
  const reports = useQuery(api.threats.getMyReports) ?? [];
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">My Threat Reports</h2>
        <p className="text-gray-400 text-sm mt-1">Track the status of your submitted reports</p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <Shield size={48} className="text-gray-700 mx-auto mb-4" />
          <h3 className="text-gray-400 font-medium">No reports yet</h3>
          <p className="text-gray-600 text-sm mt-1">When you submit a threat report, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const status = statusConfig[report.status] ?? statusConfig.open;
            const isExpanded = expanded === report._id;
            return (
              <div
                key={report._id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors"
              >
                <button
                  className="w-full text-left p-4"
                  onClick={() => setExpanded(isExpanded ? null : report._id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-xl flex-shrink-0 mt-0.5">
                        {typeEmojis[report.type] ?? "⚠️"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                          <span className={`text-xs font-semibold uppercase ${severityColors[report.severity]}`}>
                            {report.severity}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white truncate">{report.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(report._creationTime).toLocaleString()} · {report.type.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <FileText size={16} className={`text-gray-600 flex-shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-800 pt-3 space-y-3">
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
                        <p className="text-xs text-indigo-400 font-medium mb-1">Admin Notes</p>
                        <p className="text-sm text-gray-300">{report.adminNotes}</p>
                      </div>
                    )}
                    {report.resolvedAt && (
                      <p className="text-xs text-gray-500">
                        Resolved: {new Date(report.resolvedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
