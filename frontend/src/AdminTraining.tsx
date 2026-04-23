import { useEffect, useMemo, useState } from "react";
import { BookOpen, Users, CheckCircle, Clock, TrendingUp, Award } from "lucide-react";
import authService from "./services/authService";
import { getTrainingModules } from "./services/trainingModuleService";
import { getTrainingStatistics } from "./services/trainingProgressService";

const categoryEmojis: Record<string, string> = {
  phishing: "🎣", password: "🔐", social_engineering: "🎭",
  malware: "🦠", data_protection: "🛡️", incident_response: "🚨",
};

export function AdminTraining() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [allProgress, setAllProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadAdminTraining = async () => {
      setLoading(true);
      setError(null);

      try {
        const { user } = await authService.getCurrentUser();
        if (!user) {
          throw new Error('Sign in to view training analytics.');
        }

        const [moduleRows, progressRows] = await Promise.all([
          getTrainingModules(),
          getTrainingStatistics(),
        ]);

        if (!mounted) return;

        setModules(moduleRows || []);
        setAllProgress(progressRows || []);
      } catch (loadError: any) {
        if (!mounted) return;
        setError(loadError?.message || 'Failed to load training analytics.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAdminTraining();

    return () => {
      mounted = false;
    };
  }, []);

  const overallCompleted = useMemo(() => allProgress.filter((p) => p.status === 'completed').length, [allProgress]);
  const overallInProgress = useMemo(() => allProgress.filter((p) => p.status === 'in_progress').length, [allProgress]);

  const getModuleStats = (moduleId: string) => {
    const progress = allProgress.filter((p) => p.moduleId === moduleId);
    const completed = progress.filter((p) => p.status === "completed");
    const inProgress = progress.filter((p) => p.status === "in_progress");
    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((sum, p) => sum + (p.score ?? 0), 0) / completed.length)
      : 0;
    return { total: progress.length, completed: completed.length, inProgress: inProgress.length, avgScore };
  };

  const selectedModuleProgress = selectedModule
    ? allProgress.filter((p) => p.moduleId === selectedModule)
    : [];

  if (loading) {
    return <div className="text-gray-400">Loading training analytics...</div>;
  }

  if (error) {
    return <div className="bg-red-900/20 border border-red-800 text-red-200 rounded-xl p-4">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Training Management</h2>
        <p className="text-gray-400 text-sm mt-1">Monitor training progress across all employees</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <BookOpen size={20} className="text-indigo-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{modules.length}</div>
          <div className="text-xs text-gray-500">Active Modules</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <CheckCircle size={20} className="text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{overallCompleted}</div>
          <div className="text-xs text-gray-500">Completions</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <Clock size={20} className="text-yellow-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{overallInProgress}</div>
          <div className="text-xs text-gray-500">In Progress</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <TrendingUp size={20} className="text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">
            {allProgress.filter((p) => p.score !== undefined).length > 0
              ? Math.round(
                  allProgress
                    .filter((p) => p.score !== undefined)
                    .reduce((sum, p) => sum + (p.score ?? 0), 0) /
                    allProgress.filter((p) => p.score !== undefined).length
                )
              : 0}%
          </div>
          <div className="text-xs text-gray-500">Avg Score</div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((module) => {
          const stats = getModuleStats(module.id);
          const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          const isSelected = selectedModule === module.id;

          return (
            <div
              key={module.id}
              className={`bg-gray-900 border rounded-xl p-5 cursor-pointer transition-all ${
                isSelected ? "border-indigo-600" : "border-gray-800 hover:border-gray-700"
              }`}
              onClick={() => setSelectedModule(isSelected ? null : module.id)}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">{categoryEmojis[module.category] ?? "📚"}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm">{module.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{module.category.replace("_", " ")} · {module.difficulty}</p>
                </div>
                <span className="text-xs text-gray-500">{module.estimatedMinutes}m</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-sm font-bold text-green-400">{stats.completed}</div>
                  <div className="text-xs text-gray-600">Done</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-sm font-bold text-yellow-400">{stats.inProgress}</div>
                  <div className="text-xs text-gray-600">Active</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-sm font-bold text-indigo-400">{stats.avgScore}%</div>
                  <div className="text-xs text-gray-600">Avg</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Completion Rate</span>
                <span className="text-indigo-400 font-medium">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>

              {/* Expanded: per-user progress */}
              {isSelected && selectedModuleProgress.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1">
                    <Users size={12} /> User Progress
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {selectedModuleProgress.map((p) => (
                      <div key={p.id ?? `${p.moduleId}-${p.userId}`} className="flex items-center justify-between text-xs">
                          <span className="text-gray-400 truncate flex-1">{p.userName ?? p.userEmail ?? "User"}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {p.score !== undefined && (
                            <span className={`font-medium ${p.score >= module.passingScore ? "text-green-400" : "text-red-400"}`}>
                              {p.score}%
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            p.status === "completed" ? "bg-green-500/20 text-green-400" :
                            p.status === "in_progress" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-gray-700 text-gray-400"
                          }`}>
                            {p.status === "completed" ? "✓" : p.status === "in_progress" ? "…" : "—"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isSelected && selectedModuleProgress.length === 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800 text-center">
                  <p className="text-xs text-gray-600">No users have started this module yet</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Top Performers */}
      {allProgress.filter((p) => p.status === "completed" && p.score !== undefined).length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Award size={16} className="text-yellow-400" /> Top Performers
          </h3>
          <div className="space-y-2">
            {allProgress
              .filter((p) => p.status === "completed" && p.score !== undefined)
              .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
              .slice(0, 5)
              .map((p, i) => (
                <div key={p.id ?? `${p.moduleId}-${p.userId}-${i}`} className="flex items-center gap-3 text-sm">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? "bg-yellow-500 text-black" :
                    i === 1 ? "bg-gray-400 text-black" :
                    i === 2 ? "bg-orange-600 text-white" : "bg-gray-700 text-gray-300"
                  }`}>{i + 1}</span>
                  <span className="text-gray-300 flex-1 truncate">{p.userName ?? p.userEmail ?? "User"}</span>
                  <span className="text-xs text-gray-500 truncate hidden sm:block">{p.moduleTitle}</span>
                  <span className="text-green-400 font-bold flex-shrink-0">{p.score}%</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
