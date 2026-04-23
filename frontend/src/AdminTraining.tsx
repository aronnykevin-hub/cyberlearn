import { useEffect, useMemo, useState } from 'react';
import { Award, BookOpen, CheckCircle, Clock, TrendingUp, Users } from 'lucide-react';
import authService from './services/authService';
import { getTrainingModules } from './services/trainingModuleService';
import { getTrainingStatistics } from './services/trainingProgressService';

const categoryIcons: Record<string, string> = {
  phishing: '🎣',
  password: '🔐',
  social_engineering: '🎭',
  malware: '🦠',
  data_protection: '🛡️',
  incident_response: '🚨',
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
        if (!user) throw new Error('Sign in to view training analytics.');

        const [moduleRows, progressRows] = await Promise.all([getTrainingModules(), getTrainingStatistics()]);
        if (!mounted) return;

        setModules(moduleRows || []);
        setAllProgress(progressRows || []);
      } catch (loadError: any) {
        if (!mounted) return;
        setError(loadError?.message || 'Failed to load training analytics.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadAdminTraining();
    return () => {
      mounted = false;
    };
  }, []);

  const overallCompleted = useMemo(() => allProgress.filter((p) => p.status === 'completed').length, [allProgress]);
  const overallInProgress = useMemo(() => allProgress.filter((p) => p.status === 'in_progress').length, [allProgress]);
  const scoredRows = useMemo(() => allProgress.filter((p) => p.score !== undefined && p.score !== null), [allProgress]);

  const averageScore = useMemo(() => {
    if (scoredRows.length === 0) return 0;
    const total = scoredRows.reduce((sum, row) => sum + (row.score ?? 0), 0);
    return Math.round(total / scoredRows.length);
  }, [scoredRows]);

  const getModuleStats = (moduleId: string) => {
    const progress = allProgress.filter((row) => row.moduleId === moduleId);
    const completed = progress.filter((row) => row.status === 'completed');
    const inProgress = progress.filter((row) => row.status === 'in_progress');
    const avgScore =
      completed.length > 0
        ? Math.round(completed.reduce((sum, row) => sum + (row.score ?? 0), 0) / completed.length)
        : 0;
    return { total: progress.length, completed: completed.length, inProgress: inProgress.length, avgScore };
  };

  const selectedModuleProgress = selectedModule ? allProgress.filter((row) => row.moduleId === selectedModule) : [];

  if (loading) {
    return <div className="text-slate-600 dark:text-slate-400">Loading training analytics...</div>;
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200 rounded-xl p-4">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Training Analytics</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          Monitor module adoption, completion, and quiz outcomes across your team.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
          <BookOpen size={20} className="text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{modules.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Active Modules</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
          <CheckCircle size={20} className="text-green-600 dark:text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{overallCompleted}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Completions</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
          <Clock size={20} className="text-amber-600 dark:text-amber-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{overallInProgress}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">In Progress</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
          <TrendingUp size={20} className="text-purple-600 dark:text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{averageScore}%</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Average Score</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((module) => {
          const stats = getModuleStats(module.id);
          const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          const isSelected = selectedModule === module.id;

          return (
            <div
              key={module.id}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-5 cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-400 dark:border-indigo-700'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              onClick={() => setSelectedModule(isSelected ? null : module.id)}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">{categoryIcons[module.category] ?? '📚'}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{module.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
                    {module.category.replace('_', ' ')} · {module.difficulty}
                  </p>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{module.estimatedMinutes}m</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-2">
                  <div className="text-sm font-bold text-green-700 dark:text-green-400">{stats.completed}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Done</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-2">
                  <div className="text-sm font-bold text-amber-700 dark:text-amber-400">{stats.inProgress}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Active</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-2">
                  <div className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{stats.avgScore}%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Average</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Completion Rate</span>
                <span className="text-indigo-600 dark:text-indigo-300 font-medium">{completionRate}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
              </div>

              {isSelected ? (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2 flex items-center gap-1">
                    <Users size={12} /> User Progress
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {selectedModuleProgress.length > 0 ? (
                      selectedModuleProgress.map((row) => (
                        <div key={row.id ?? `${row.moduleId}-${row.userId}`} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{row.userName ?? row.userEmail ?? 'User'}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {row.score !== undefined && row.score !== null ? (
                              <span className={`font-medium ${(row.score ?? 0) >= module.passingScore ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                {row.score}%
                              </span>
                            ) : null}
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs ${
                                row.status === 'completed'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                  : row.status === 'in_progress'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {row.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">No users have started this module yet.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {scoredRows.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Award size={16} className="text-yellow-500" /> Top Performers
          </h3>
          <div className="space-y-2">
            {scoredRows
              .filter((row) => row.status === 'completed')
              .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
              .slice(0, 5)
              .map((row, index) => (
                <div key={row.id ?? `${row.moduleId}-${row.userId}-${index}`} className="flex items-center gap-3 text-sm">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      index === 0
                        ? 'bg-yellow-400 text-black'
                        : index === 1
                        ? 'bg-slate-300 text-black'
                        : index === 2
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 flex-1 truncate">{row.userName ?? row.userEmail ?? 'User'}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">{row.moduleTitle}</span>
                  <span className="text-green-700 dark:text-green-400 font-bold flex-shrink-0">{row.score}%</span>
                </div>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

