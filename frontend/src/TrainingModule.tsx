import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Trophy, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import authService from './services/authService';
import {
  getUserTrainingProgress,
  startTrainingModule,
  submitTrainingQuiz,
  updateTrainingProgress,
} from './services/trainingProgressService';
import { getTrainingModule } from './services/trainingModuleService';

interface Props {
  moduleId: string;
  onBack: () => void;
}

export function TrainingModule({ moduleId, onBack }: Props) {
  const [module, setModule] = useState<any | null>(null);
  const [progress, setProgress] = useState<any | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; certificate?: any | null } | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadModule = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const { user } = await authService.getCurrentUser();
        if (!user) throw new Error('Sign in to access training modules.');

        const [loadedModule, loadedProgress] = await Promise.all([
          getTrainingModule(moduleId),
          getUserTrainingProgress(user.id, moduleId),
        ]);
        if (!mounted) return;

        setUserId(user.id);
        setModule(loadedModule);

        const progressRecord = Array.isArray(loadedProgress) ? loadedProgress[0] : loadedProgress;
        if (progressRecord) {
          setProgress(progressRecord);
          setCurrentSlide(
            Math.min(progressRecord.currentSlide ?? 0, Math.max((loadedModule?.content?.length ?? 1) - 1, 0)),
          );

          if (progressRecord.status === 'completed' && typeof progressRecord.score === 'number') {
            setQuizResult({
              score: progressRecord.score,
              passed: progressRecord.score >= Number(loadedModule?.passingScore ?? 70),
              certificate: null,
            });
          }
        } else {
          const started = await startTrainingModule(user.id, moduleId);
          if (!mounted) return;
          setProgress(started);
        }
      } catch (error: any) {
        if (!mounted) return;
        setLoadError(error?.message || 'Failed to load training module.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadModule();
    return () => {
      mounted = false;
    };
  }, [moduleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError || !module) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200 rounded-xl p-4">
        {loadError || 'Training module not found.'}
      </div>
    );
  }

  const slides = Array.isArray(module.content) ? module.content : [];
  const slide = slides[currentSlide];
  if (!slide) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200 rounded-xl p-4">
        This training module has no slides yet.
      </div>
    );
  }

  const isLastSlide = currentSlide === slides.length - 1;
  const quizSlideIndices = slides.reduce<number[]>((acc, item, index) => {
    if (item.type === 'quiz') acc.push(index);
    return acc;
  }, []);

  const handleNext = async () => {
    if (slide.type === 'quiz' && selectedAnswer === null) {
      toast.error('Please select an answer before continuing.');
      return;
    }
    if (slide.type === 'quiz' && !showFeedback) {
      setShowFeedback(true);
      return;
    }

    setShowFeedback(false);
    setSelectedAnswer(null);

    if (isLastSlide) {
      const answers = quizSlideIndices.map((index) => quizAnswers[index] ?? 0);
      if (!userId) {
        toast.error('Training session is missing user context.');
        return;
      }

      const result = await submitTrainingQuiz(userId, moduleId, answers);
      setQuizResult({
        score: result.score,
        passed: result.passed,
        certificate: result.certificate,
      });
      setProgress(result.progress);
      return;
    }

    const next = currentSlide + 1;
    setCurrentSlide(next);
    if (userId) {
      const updated = await updateTrainingProgress(userId, moduleId, { currentSlide: next });
      setProgress(updated);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
    if (slide.type === 'quiz') {
      setQuizAnswers((prev) => ({ ...prev, [currentSlide]: index }));
    }
  };

  if (quizResult && progress?.status === 'completed') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              quizResult.passed ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
            }`}
          >
            {quizResult.passed ? (
              <Trophy size={40} className="text-green-600 dark:text-green-400" />
            ) : (
              <XCircle size={40} className="text-red-600 dark:text-red-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {quizResult.passed ? 'Module Completed!' : 'Keep Practicing'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {quizResult.passed
              ? `You scored ${quizResult.score}% and passed this module.`
              : `You scored ${quizResult.score}%. You need ${module.passingScore}% to pass.`}
          </p>
          {quizResult.passed ? (
            <div className="mb-6 text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-800 rounded-lg px-4 py-3">
              {quizResult.certificate?.certificateNumber
                ? `Certificate issued: ${quizResult.certificate.certificateNumber}`
                : 'Certificate is being issued for this completed module.'}
            </div>
          ) : null}
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-4 mb-6">
            <div
              className={`h-4 rounded-full transition-all duration-1000 ${quizResult.passed ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${quizResult.score}%` }}
            />
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Back to Modules
            </button>
            {!quizResult.passed ? (
              <button
                onClick={() => {
                  setCurrentSlide(0);
                  setQuizAnswers({});
                  setQuizResult(null);
                }}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-900 dark:text-white">{module.title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Slide {currentSlide + 1} of {slides.length}
          </p>
        </div>
      </div>

      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 min-h-64">
        <div className="flex items-center gap-2 mb-4">
          <span
            className={`text-xs px-2 py-1 rounded-full border ${
              slide.type === 'quiz'
                ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
                : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
            }`}
          >
            {slide.type === 'quiz' ? 'Quiz' : 'Lesson'}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{slide.title}</h3>

        {slide.type === 'text' ? (
          <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
            {String(slide.body || '')
              .split('\n')
              .map((line: string, index: number) =>
                line ? (
                  <p key={index} className="mb-1">
                    {line}
                  </p>
                ) : (
                  <br key={index} />
                ),
              )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-slate-700 dark:text-slate-300 text-sm mb-4">{slide.body}</p>
            {slide.options?.map((option: string, index: number) => {
              let btnClass =
                'w-full text-left p-3 rounded-lg border text-sm transition-all ';
              if (showFeedback) {
                if (index === slide.correctAnswer) {
                  btnClass +=
                    'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300';
                } else if (index === selectedAnswer && index !== slide.correctAnswer) {
                  btnClass +=
                    'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300';
                } else {
                  btnClass += 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';
                }
              } else if (selectedAnswer === index) {
                btnClass +=
                  'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-300';
              } else {
                btnClass +=
                  'bg-slate-100 border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-slate-700';
              }

              return (
                <button key={index} className={btnClass} onClick={() => handleAnswerSelect(index)}>
                  <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                  {option}
                  {showFeedback && index === slide.correctAnswer ? (
                    <CheckCircle size={16} className="inline ml-2 text-green-600 dark:text-green-400" />
                  ) : null}
                  {showFeedback && index === selectedAnswer && index !== slide.correctAnswer ? (
                    <XCircle size={16} className="inline ml-2 text-red-600 dark:text-red-400" />
                  ) : null}
                </button>
              );
            })}

            {showFeedback ? (
              <div
                className={`p-3 rounded-lg text-sm ${
                  selectedAnswer === slide.correctAnswer
                    ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                    : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                }`}
              >
                {selectedAnswer === slide.correctAnswer
                  ? 'Correct answer.'
                  : `Incorrect. Correct answer: ${slide.options?.[slide.correctAnswer ?? 0]}`}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (currentSlide > 0) {
              setCurrentSlide(currentSlide - 1);
              setShowFeedback(false);
              setSelectedAnswer(null);
            }
          }}
          disabled={currentSlide === 0}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Previous
        </button>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {currentSlide + 1} / {slides.length}
        </span>
        <button
          onClick={() => void handleNext()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
        >
          {isLastSlide ? 'Submit' : slide.type === 'quiz' && !showFeedback ? 'Check Answer' : 'Next'}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

