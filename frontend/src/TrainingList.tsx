import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Clock, Star, CheckCircle, Play, RotateCcw, Loader2 } from "lucide-react";
import { TrainingModule } from "./TrainingModule";
import authService from "./services/authService";
import { getTrainingModules } from "./services/trainingModuleService";
import { getUserTrainingProgress } from "./services/trainingProgressService";

const categoryColors: Record<string, string> = {
  phishing: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  password: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  social_engineering: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  malware: "bg-red-500/20 text-red-400 border-red-500/30",
  data_protection: "bg-green-500/20 text-green-400 border-green-500/30",
  incident_response: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const difficultyColors: Record<string, string> = {
  beginner: "text-green-400",
  intermediate: "text-yellow-400",
  advanced: "text-red-400",
};

const categoryEmojis: Record<string, string> = {
  phishing: "🎣",
  password: "🔐",
  social_engineering: "🎭",
  malware: "🦠",
  data_protection: "🛡️",
  incident_response: "🚨",
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
        throw new Error("Sign in to access training modules.");
      }

      const [moduleRows, progressRows] = await Promise.all([
        getTrainingModules(),
        getUserTrainingProgress(user.id),
      ]);

      setModules(moduleRows || []);
      setMyProgress(Array.isArray(progressRows) ? progressRows : progressRows ? [progressRows] : []);
    } catch (loadError: any) {
      setError(loadError?.message || "Failed to load training modules.");
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

    runLoad();

    return () => {
      mounted = false;
    };
  }, [loadTrainingData]);

  const progressMap = useMemo(() => {
    return new Map(myProgress.map((p) => [p.moduleId, p]));
  }, [myProgress]);

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
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading training modules...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 text-red-200 rounded-xl p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Training Modules</h2>
        <p className="text-gray-400 text-sm mt-1">Complete all modules to strengthen your cybersecurity skills</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((module) => {
          const progress = progressMap.get(module.id);
          const status = progress?.status ?? "not_started";
          return (
            <div
              key={module.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-700 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{categoryEmojis[module.category] ?? "📚"}</span>
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[module.category] ?? "bg-gray-700 text-gray-300 border-gray-600"}`}>
                      {module.category.replace("_", " ")}
                    </span>
                  </div>
                </div>
                {status === "completed" && (
                  <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                )}
              </div>

              <h3 className="font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                {module.title}
              </h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{module.description}</p>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {module.estimatedMinutes} min
                </span>
                <span className={`flex items-center gap-1 ${difficultyColors[module.difficulty]}`}>
                  <Star size={12} />
                  {module.difficulty}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={12} />
                  {Array.isArray(module.content) ? module.content.length : 0} slides
                </span>
              </div>

              {status === "in_progress" && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{progress?.currentSlide ?? 0}/{Array.isArray(module.content) ? module.content.length : 0}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${Array.isArray(module.content) && module.content.length > 0 ? ((progress?.currentSlide ?? 0) / module.content.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {status === "completed" && progress?.score !== undefined && (
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: `${progress.score}%` }}
                    />
                  </div>
                  <span className="text-xs text-green-400 font-medium">{progress.score}%</span>
                </div>
              )}

              <button
                onClick={() => setActiveModuleId(module.id)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  status === "completed"
                    ? "bg-green-900/30 text-green-400 border border-green-800 hover:bg-green-900/50"
                    : status === "in_progress"
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
              >
                {status === "completed" ? (
                  <><RotateCcw size={14} /> Review</>
                ) : status === "in_progress" ? (
                  <><Play size={14} /> Continue</>
                ) : (
                  <><Play size={14} /> Start</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {modules.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center text-gray-400">
          No training modules are currently available.
        </div>
      )}
    </div>
  );
}

