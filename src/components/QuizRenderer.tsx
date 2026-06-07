import React, { useState, useEffect } from 'react';
import { Summary, QuizQuestion } from '../types';
import { 
  HelpCircle, Sparkles, CheckCircle2, XCircle, RefreshCw, 
  BrainCircuit, ArrowRight, RotateCcw, AlertCircle, Sparkle 
} from 'lucide-react';

interface QuizRendererProps {
  summary: Summary;
}

export default function QuizRenderer({ summary }: QuizRendererProps) {
  // Store quiz questions in state so we can regenerate them on-demand
  const [questions, setQuestions] = useState<QuizQuestion[]>(summary.quiz || []);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  
  // Custom generation state
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync questions if the active summary changes
  useEffect(() => {
    setQuestions(summary.quiz || []);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setCustomPrompt('');
    setErrorMessage(null);
  }, [summary]);

  const handleSelectOption = (qIndex: number, option: string) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [qIndex]: option
    }));
  };

  const handleEvaluateQuiz = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setErrorMessage(null);
  };

  const handleGenerateNewQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/gemini/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summaryText: summary.summaryText,
          subject: summary.subject,
          difficulty: summary.difficulty,
          customPrompt: customPrompt.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue lors de la génération du quiz.");
      }

      const data = await response.json();
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        setSelectedAnswers({});
        setQuizSubmitted(false);
        setQuizScore(0);
      } else {
        throw new Error("Format de quiz invalide reçu du serveur.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "Impossible de se connecter au serveur IA. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Quiz Custom Focus Settings Form */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4">
        <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 mb-2 font-display">
          <BrainCircuit className="h-4 w-4 text-indigo-600" />
          Générer un Quiz personnalisé par IA
        </h4>
        <p className="text-[11px] text-indigo-800 leading-relaxed mb-3">
          Vous souhaitez cibler un chapitre en particulier ? Précisez une notion spécifique (ex: les conflits du XXe siècle, les calculs de fractions...) ou laissez vide pour un quiz général.
        </p>

        <form onSubmit={handleGenerateNewQuiz} className="flex gap-2 flex-col sm:flex-row">
          <input
            type="text"
            placeholder="Axe ou thème particulier (Facultatif)..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            disabled={isGenerating}
            id="input-quiz-custom-focus"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-60 transition"
          />
          <button
            type="submit"
            disabled={isGenerating}
            id="btn-quiz-trigger-regeneration"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-55 flex items-center justify-center gap-1.5 transition whitespace-nowrap shadow-sm shadow-indigo-600/10"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Création du quiz...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                <span>Générer le Quiz</span>
              </>
            )}
          </button>
        </form>
      </div>

      {errorMessage && (
        <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Questions View Area */}
      {isGenerating ? (
        /* Loading skeleton screen */
        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <div className="h-4 w-1/3 rounded-md bg-slate-100 animate-pulse" />
            <div className="h-16 w-full rounded-xl bg-slate-50 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-1/4 rounded-md bg-slate-100 animate-pulse" />
            <div className="h-16 w-full rounded-xl bg-slate-50 animate-pulse" />
          </div>
        </div>
      ) : questions.length > 0 ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {questions.length} questions interactives
            </p>
            {quizSubmitted && (
              <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                Score : {quizScore} / {questions.length}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {questions.map((q, qIndex) => {
              const selectedAns = selectedAnswers[qIndex];
              const isCorrect = selectedAns === q.correctAnswer;

              return (
                <div key={qIndex} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                  <p className="text-xs font-bold text-slate-800 mb-3 flex items-start gap-1.5 leading-relaxed">
                    <span className="text-indigo-600 font-mono">Q{qIndex + 1}.</span> {q.question}
                  </p>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt, oIndex) => {
                      const isOptionSelected = selectedAns === opt;
                      const isThisCorrect = opt === q.correctAnswer;

                      let optStyle = "border-slate-200 text-slate-700 bg-white hover:bg-slate-50";
                      if (isOptionSelected) {
                        optStyle = "border-indigo-600 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500/10 font-medium";
                      }

                      if (quizSubmitted) {
                        if (isThisCorrect) {
                          optStyle = "border-green-600 bg-green-50 text-green-800 font-bold ring-2 ring-green-500/10";
                        } else if (isOptionSelected && !isCorrect) {
                          optStyle = "border-red-600 bg-red-50 text-red-800 ring-2 ring-red-500/10";
                        } else {
                          optStyle = "opacity-60 border-slate-200 text-slate-400 bg-white";
                        }
                      }

                      return (
                        <button
                          key={oIndex}
                          type="button"
                          onClick={() => handleSelectOption(qIndex, opt)}
                          disabled={quizSubmitted}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition ${optStyle}`}
                        >
                          <span>{opt}</span>
                          {quizSubmitted && isThisCorrect && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 ml-1.5" />
                          )}
                          {quizSubmitted && isOptionSelected && !isCorrect && (
                            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 ml-1.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Correction Explications */}
                  {quizSubmitted && (
                    <div className="mt-3 text-[10px] leading-relaxed rounded-lg p-2.5 bg-indigo-50/50 text-indigo-950 border border-indigo-100/50">
                      <strong className="block mb-0.5 text-indigo-900">Explication :</strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action buttons panel */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            {quizSubmitted ? (
              <>
                <div className="text-[11px] text-slate-500 font-medium font-sans">
                  {quizScore === questions.length 
                    ? "Parfait ! Vous excellez sur cette leçon ! 🎉" 
                    : "Excellent entraînement ! Poursuivez pour obtenir la note maximale ! 📚"}
                </div>
                <button
                  type="button"
                  onClick={handleResetQuiz}
                  id="btn-quiz-reset-score"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 flex items-center gap-1 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                  <span>Recommencer</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleEvaluateQuiz}
                disabled={Object.keys(selectedAnswers).length < questions.length}
                id="btn-quiz-validate-answers"
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Valider mes réponses ({Object.keys(selectedAnswers).length}/{questions.length})
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-xs text-slate-400 font-semibold font-mono">
          Aucun quiz disponible pour ce cours. Utilisez le bouton ci-dessus pour en créer un instantanément !
        </div>
      )}

    </div>
  );
}
