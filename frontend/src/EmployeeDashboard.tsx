import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  LayoutDashboard, BookOpen, AlertTriangle, User,
  CheckCircle, Clock, TrendingUp, Shield
} from "lucide-react";
import { TrainingList } from "./TrainingList";
import { ThreatReportForm } from "./ThreatReportForm";
import { MyReports } from "./MyReports";
import { AlertsBanner } from "./AlertsBanner";
import { EmployeeProfile } from "./EmployeeProfile";

type Tab = "dashboard" | "training" | "report" | "my-reports" | "profile";

export function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const stats = useQuery(api.dashboard.getEmployeeStats);
  const alerts = useQuery(api.alerts.getActiveAlerts) ?? [];

  const tabs = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "training" as Tab, label: "Training", icon: BookOpen },
    { id: "report" as Tab, label: "Report Threat", icon: AlertTriangle },
    { id: "my-reports" as Tab, label: "My Reports", icon: Shield },
    { id: "profile" as Tab, label: "Profile", icon: User },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Active Alerts Banner */}
      {alerts.length > 0 && <AlertsBanner alerts={alerts} />}

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
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Security Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Track your cybersecurity training and threat reports</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<CheckCircle size={20} className="text-green-400" />}
              label="Completed"
              value={stats?.completed ?? 0}
              sub={`of ${stats?.totalModules ?? 0} modules`}
              color="green"
            />
            <StatCard
              icon={<Clock size={20} className="text-yellow-400" />}
              label="In Progress"
              value={stats?.inProgress ?? 0}
              sub="modules"
              color="yellow"
            />
            <StatCard
              icon={<TrendingUp size={20} className="text-indigo-400" />}
              label="Avg Score"
              value={`${stats?.avgScore ?? 0}%`}
              sub="quiz average"
              color="indigo"
            />
            <StatCard
              icon={<Shield size={20} className="text-red-400" />}
              label="Reports"
              value={stats?.totalReports ?? 0}
              sub={`${stats?.openReports ?? 0} open`}
              color="red"
            />
          </div>

          {/* Completion Progress */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Training Completion</h3>
              <span className="text-indigo-400 font-bold">{stats?.completionRate ?? 0}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats?.completionRate ?? 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{stats?.completed ?? 0} completed</span>
              <span>{stats?.notStarted ?? 0} remaining</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab("training")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-5 text-left transition-colors group"
            >
              <BookOpen size={24} className="mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold">Continue Training</h3>
              <p className="text-indigo-200 text-sm mt-1">
                {stats?.inProgress ? `${stats.inProgress} module(s) in progress` : "Start a new module"}
              </p>
            </button>
            <button
              onClick={() => setActiveTab("report")}
              className="bg-red-900/50 hover:bg-red-900/70 border border-red-800 text-white rounded-xl p-5 text-left transition-colors group"
            >
              <AlertTriangle size={24} className="mb-3 text-red-400 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold">Report a Threat</h3>
              <p className="text-gray-400 text-sm mt-1">Spotted something suspicious? Report it fast.</p>
            </button>
          </div>
        </div>
      )}

      {activeTab === "training" && <TrainingList />}
      {activeTab === "report" && <ThreatReportForm onSuccess={() => setActiveTab("my-reports")} />}
      {activeTab === "my-reports" && <MyReports />}
      {activeTab === "profile" && <EmployeeProfile />}
    </div>
  );
}

function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  const borders: Record<string, string> = {
    green: "border-green-800/50",
    yellow: "border-yellow-800/50",
    indigo: "border-indigo-800/50",
    red: "border-red-800/50",
  };
  return (
    <div className={`bg-gray-900 border ${borders[color] ?? "border-gray-800"} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-gray-400">{label}</span></div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
    </div>
  );
}

