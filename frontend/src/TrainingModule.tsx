import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Trophy } from "lucide-react";
import { toast } from "sonner";

interface Props {
  moduleId: Id<"trainingModules">;
  onBack: () => void;
}

export function TrainingModule({ moduleId, onBack }: Props) {
  const module = useQuery(api.training.getModule, { moduleId });
  const progress = useQuery(api.training.getProgressForModule, { moduleId });
  const startModule = useMutation(api.training.startModule);
  const updateProgress = useMutation(api.training.updateProgress);
  const submitQuiz = useMutation(api.training.submitQuiz);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (progress && progress.status !== "not_started") {
      setCurrentSlide(progress.currentSlide ?? 0);
    }
    startModule({ moduleId });
  }, [moduleId]);

  if (!module) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const slides = module.content;
  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;
  const quizSlides = slides.filter((s) => s.type === "quiz");
  const quizSlideIndices = slides.reduce<number[]>((acc, s, i) => {
    if (s.type === "quiz") acc.push(i);
    return acc;
  }, []);
  const currentQuizIndex = quizSlideIndices.indexOf(currentSlide);

  const handleNext = async () => {
    if (slide.type === "quiz" && selectedAnswer === null) {
      toast.error("Please select an answer before continuing.");
      return;
    }
    if (slide.type === "quiz" && !showFeedback) {
      setShowFeedback(true);
      return;
    }
    setShowFeedback(false);
    setSelectedAnswer(null);

    if (isLastSlide) {
      // Submit quiz
      const answers = quizSlideIndices.map((idx) => quizAnswers[idx] ?? 0);
      const result = await submitQuiz({ moduleId, answers });
      setQuizResult(result);
    } else {
      const next = currentSlide + 1;
      setCurrentSlide(next);
      await updateProgress({ moduleId, currentSlide: next });
    }
  };

  const handleAnswerSelect = (idx: number) => {
    if (showFeedback) return;
    setSelectedAnswer(idx);
    if (slide.type === "quiz") {
      setQuizAnswers((prev) => ({ ...prev, [currentSlide]: idx }));
    }
  };

  if (quizResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${quizResult.passed ? "bg-green-500/20" : "bg-red-500/20"}`}>
            {quizResult.passed ? (
              <Trophy size={40} className="text-green-400" />
            ) : (
              <XCircle size={40} className="text-red-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {quizResult.passed ? "Module Completed!" : "Keep Practicing!"}
          </h2>
          <p className="text-gray-400 mb-6">
            {quizResult.passed
              ? `Excellent work! You scored ${quizResult.score}% and passed the module.`
              : `You scored ${quizResult.score}%. You need ${module.passingScore}% to pass. Try again!`}
          </p>
          <div className="w-full bg-gray-800 rounded-full h-4 mb-6">
            <div
              className={`h-4 rounded-full transition-all duration-1000 ${quizResult.passed ? "bg-green-500" : "bg-red-500"}`}
              style={{ width: `${quizResult.score}%` }}
            />
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Modules
            </button>
            {!quizResult.passed && (
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
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="font-semibold text-white">{module.title}</h2>
          <p className="text-xs text-gray-400">Slide {currentSlide + 1} of {slides.length}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>

      {/* Slide Content */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 min-h-64">
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-2 py-1 rounded-full ${slide.type === "quiz" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"}`}>
            {slide.type === "quiz" ? "📝 Quiz" : "📖 Lesson"}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-4">{slide.title}</h3>

        {slide.type === "text" && (
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
            {slide.body.split("\n").map((line, i) => {
              if (line.startsWith("**") && line.endsWith("**")) {
                return <p key={i} className="font-semibold text-white mt-3 mb-1">{line.slice(2, -2)}</p>;
              }
              if (line.startsWith("• ")) {
                return <p key={i} className="ml-4 text-gray-300">• {line.slice(2)}</p>;
              }
              if (line.startsWith("**") && line.includes("**:")) {
                const [bold, rest] = line.split("**:");
                return <p key={i} className="mt-2"><span className="font-semibold text-white">{bold.slice(2)}:</span>{rest}</p>;
              }
              return line ? <p key={i} className="mb-1">{line}</p> : <br key={i} />;
            })}
          </div>
        )}

        {slide.type === "quiz" && (
          <div className="space-y-3">
            <p className="text-gray-300 text-sm mb-4">{slide.body}</p>
            {slide.options?.map((option, idx) => {
              let btnClass = "w-full text-left p-3 rounded-lg border text-sm transition-all ";
              if (showFeedback) {
                if (idx === slide.correctAnswer) {
                  btnClass += "bg-green-500/20 border-green-500 text-green-300";
                } else if (idx === selectedAnswer && idx !== slide.correctAnswer) {
                  btnClass += "bg-red-500/20 border-red-500 text-red-300";
                } else {
                  btnClass += "bg-gray-800 border-gray-700 text-gray-400";
                }
              } else if (selectedAnswer === idx) {
                btnClass += "bg-indigo-500/20 border-indigo-500 text-indigo-300";
              } else {
                btnClass += "bg-gray-800 border-gray-700 text-gray-300 hover:border-indigo-600 hover:bg-gray-700";
              }
              return (
                <button key={idx} className={btnClass} onClick={() => handleAnswerSelect(idx)}>
                  <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {option}
                  {showFeedback && idx === slide.correctAnswer && (
                    <CheckCircle size={16} className="inline ml-2 text-green-400" />
                  )}
                  {showFeedback && idx === selectedAnswer && idx !== slide.correctAnswer && (
                    <XCircle size={16} className="inline ml-2 text-red-400" />
                  )}
                </button>
              );
            })}
            {showFeedback && (
              <div className={`p-3 rounded-lg text-sm ${selectedAnswer === slide.correctAnswer ? "bg-green-500/10 text-green-300 border border-green-800" : "bg-red-500/10 text-red-300 border border-red-800"}`}>
                {selectedAnswer === slide.correctAnswer
                  ? "✅ Correct! Well done."
                  : `❌ Incorrect. The correct answer is: ${slide.options?.[slide.correctAnswer ?? 0]}`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
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
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Previous
        </button>
        <span className="text-xs text-gray-500">{currentSlide + 1} / {slides.length}</span>
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
        >
          {isLastSlide ? "Submit" : slide.type === "quiz" && !showFeedback ? "Check Answer" : "Next"}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

