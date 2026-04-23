import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle, Clock, Loader2, Play, RotateCcw, Star } from 'lucide-react';
import { TrainingModule } from './TrainingModule';
import authService from './services/authService';
import { getTrainingModules } from './services/trainingModuleService';
import { getUserTrainingProgress } from './services/trainingProgressService';

const categoryColors: Record<string, string> = {
  phishing:
    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  password:
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  social_engineering:
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  malware:
    'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  data_protection:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  incident_response:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
};

const difficultyColors: Record<string, string> = {
  beginner: 'text-green-700 dark:text-green-400',
  intermediate: 'text-amber-700 dark:text-amber-400',
  advanced: 'text-red-700 dark:text-red-400',
};

const categoryIcons: Record<string, string> = {
  phishing: '🎣',
  password: '🔐',
  social_engineering: '🎭',
  malware: '🦠',
  data_protection: '🛡️',
  incident_response: '🚨',
};

export function TrainingList() {
  const [modules, setModules] = useState<any[]>([]);
  const [myProgress, setMyProgress] = useState<any[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrainingData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { user } = await authService.getCurrentUser();
      if (!user) {
        throw new Error('Sign in to access training modules.');
      }

      const [moduleRows, progressRows] = await Promise.all([
        getTrainingModules(),
        getUserTrainingProgress(user.id),
      ]);

      setModules(moduleRows || []);
      setMyProgress(Array.isArray(progressRows) ? progressRows : progressRows ? [progressRows] : []);
    } catch (loadError: any) {
      setError(loadError?.message || 'Failed to load training modules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const runLoad = async () => {
      if (!mounted) return;
      await loadTrainingData();
    };

    void runLoad();
    return () => {
      mounted = false;
    };
  }, [loadTrainingData]);

  const progressMap = useMemo(() => new Map(myProgress.map((progressRow) => [progressRow.moduleId, progressRow])), [myProgress]);

  if (activeModuleId) {
    return (
      <TrainingModule
        moduleId={activeModuleId}
        onBack={() => {
          setActiveModuleId(null);
          void loadTrainingData();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading training modules...
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200 rounded-xl p-4">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Training Modules</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          Complete all modules to strengthen your cybersecurity skills.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((module) => {
          const progress = progressMap.get(module.id);
          const status = progress?.status ?? 'not_started';
          const moduleSlides = Array.isArray(module.content) ? module.content.length : 0;

          return (
            <div
              key={module.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{categoryIcons[module.category] ?? '📚'}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      categoryColors[module.category] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {String(module.category || '').replace('_', ' ')}
                  </span>
                </div>
                {status === 'completed' ? <CheckCircle size={20} className="text-green-600 dark:text-green-400 flex-shrink-0" /> : null}
              </div>

              <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                {module.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">{module.description}</p>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500 mb-4">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {module.estimatedMinutes} min
                </span>
                <span className={`flex items-center gap-1 ${difficultyColors[module.difficulty] || 'text-slate-600 dark:text-slate-400'}`}>
                  <Star size={12} />
                  {module.difficulty}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={12} />
                  {moduleSlides} slides
                </span>
              </div>

              {status === 'in_progress' ? (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500 mb-1">
                    <span>Progress</span>
                    <span>
                      {progress?.currentSlide ?? 0}/{moduleSlides}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{
                        width: `${moduleSlides > 0 ? ((progress?.currentSlide ?? 0) / moduleSlides) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {status === 'completed' && progress?.score !== undefined ? (
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${progress.score}%` }} />
                  </div>
                  <span className="text-xs text-green-700 dark:text-green-400 font-medium">{progress.score}%</span>
                </div>
              ) : null}

              <button
                onClick={() => setActiveModuleId(module.id)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  status === 'completed'
                    ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/30'
                    : status === 'in_progress'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
                }`}
              >
                {status === 'completed' ? (
                  <>
                    <RotateCcw size={14} /> Review
                  </>
                ) : status === 'in_progress' ? (
                  <>
                    <Play size={14} /> Continue
                  </>
                ) : (
                  <>
                    <Play size={14} /> Start
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {modules.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center text-slate-600 dark:text-slate-400">
          No training modules are currently available.
        </div>
      ) : null}
    </div>
  );
}

