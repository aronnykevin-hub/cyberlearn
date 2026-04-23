import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  LayoutDashboard, Users, BookOpen, AlertTriangle,
  Bell, Shield, TrendingUp, Activity, ChevronRight,
  CheckCircle, Clock, XCircle, Search
} from "lucide-react";
import { AdminUsers } from "./AdminUsers";
import { AdminReports } from "./AdminReports";
import { AdminAlerts } from "./AdminAlerts";
import { AdminTraining } from "./AdminTraining";

type Tab = "dashboard" | "users" | "reports" | "alerts" | "training";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const stats = useQuery(api.dashboard.getAdminStats);
  const recentReports = useQuery(api.threats.getAllReports) ?? [];

  const tabs = [
    { id: "dashboard" as Tab, label: "Overview", icon: LayoutDashboard },
    { id: "users" as Tab, label: "Users", icon: Users },
    { id: "reports" as Tab, label: "Reports", icon: AlertTriangle },
    { id: "alerts" as Tab, label: "Alerts", icon: Bell },
    { id: "training" as Tab, label: "Training", icon: BookOpen },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
            <p className="text-gray-400 text-sm mt-1">Real-time security monitoring across your organization</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Users size={20} className="text-purple-400" />} label="Total Users" value={stats?.totalUsers ?? 0} sub={`${stats?.activeUsers ?? 0} active`} color="purple" />
            <StatCard icon={<AlertTriangle size={20} className="text-red-400" />} label="Open Reports" value={stats?.openReports ?? 0} sub={`${stats?.criticalReports ?? 0} critical`} color="red" />
            <StatCard icon={<BookOpen size={20} className="text-indigo-400" />} label="Completions" value={stats?.completedTrainings ?? 0} sub={`${stats?.inProgressTrainings ?? 0} in progress`} color="indigo" />
            <StatCard icon={<Bell size={20} className="text-yellow-400" />} label="Active Alerts" value={stats?.activeAlerts ?? 0} sub={`${stats?.activeModules ?? 0} modules`} color="yellow" />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={16} className="text-green-400" />
                <h3 className="text-sm font-semibold text-white">Report Status</h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Open", value: stats?.openReports ?? 0, color: "bg-blue-500" },
                  { label: "Resolved", value: stats?.resolvedReports ?? 0, color: "bg-green-500" },
                  { label: "Total", value: stats?.totalReports ?? 0, color: "bg-gray-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-gray-400">{item.label}</span>
                    </div>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Training Progress</h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Completed", value: stats?.completedTrainings ?? 0, color: "bg-green-500" },
                  { label: "In Progress", value: stats?.inProgressTrainings ?? 0, color: "bg-yellow-500" },
                  { label: "Modules", value: stats?.activeModules ?? 0, color: "bg-indigo-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-gray-400">{item.label}</span>
                    </div>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-purple-400" />
                <h3 className="text-sm font-semibold text-white">User Breakdown</h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Employees", value: stats?.employees ?? 0, color: "bg-green-500" },
                  { label: "Admins", value: (stats?.totalUsers ?? 0) - (stats?.employees ?? 0), color: "bg-purple-500" },
                  { label: "Active", value: stats?.activeUsers ?? 0, color: "bg-blue-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-gray-400">{item.label}</span>
                    </div>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-400" /> Recent Threat Reports
              </h3>
              <button
                onClick={() => setActiveTab("reports")}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-gray-800">
              {recentReports.slice(0, 5).length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">No reports yet</div>
              ) : (
                recentReports.slice(0, 5).map((r) => (
                  <div key={r._id} className="flex items-center gap-3 p-3 hover:bg-gray-800/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      r.severity === "critical" ? "bg-red-500 animate-pulse" :
                      r.severity === "high" ? "bg-orange-500" :
                      r.severity === "medium" ? "bg-yellow-500" : "bg-green-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{r.title}</p>
                      <p className="text-xs text-gray-500">{r.reporterEmail ?? "Unknown"} · {new Date(r._creationTime).toLocaleDateString()}</p>
                    </div>
                    <ReportStatusBadge status={r.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && <AdminUsers />}
      {activeTab === "reports" && <AdminReports />}
      {activeTab === "alerts" && <AdminAlerts />}
      {activeTab === "training" && <AdminTraining />}
    </div>
  );
}

function ReportStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { color: string; icon: React.ReactNode }> = {
    open: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <Clock size={10} /> },
    investigating: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Search size={10} /> },
    resolved: { color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle size={10} /> },
    dismissed: { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: <XCircle size={10} /> },
  };
  const cfg = configs[status] ?? configs.open;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 flex-shrink-0 ${cfg.color}`}>
      {cfg.icon} {status}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub: string; color: string;
}) {
  const borders: Record<string, string> = {
    purple: "border-purple-800/50",
    red: "border-red-800/50",
    indigo: "border-indigo-800/50",
    yellow: "border-yellow-800/50",
  };
  return (
    <div className={`bg-gray-900 border ${borders[color] ?? "border-gray-800"} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-gray-400">{label}</span></div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
    </div>
  );
}
