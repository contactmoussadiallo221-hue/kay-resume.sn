import { useState } from 'react';
import { Summary, QuizQuestion } from '../types';
import { generateCoursePDF } from '../utils/pdfGenerator';
import { 
  FileDown, BookOpen, Lightbulb, HelpCircle, FileText, 
  CheckCircle2, XCircle, Share2, Clipboard, ArrowRight, Star,
  Copy, Check
} from 'lucide-react';

interface SummaryViewerProps {
  summary: Summary;
  isSavedInCloud: boolean;
}

export default function SummaryViewer({ summary, isSavedInCloud }: SummaryViewerProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'simplification' | 'definitions' | 'quiz'>('summary');
  const [copied, setCopied] = useState(false);
  
  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary.summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };
  
  // Interactive quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const handleSelectOption = (qIndex: number, option: string) => {
    if (quizSubmitted) return; // Locked once evaluated
    setQuizAnswers(prev => ({
      ...prev,
      [qIndex]: option
    }));
  };

  const handleEvaluateQuiz = () => {
    let score = 0;
    summary.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const handleDownloadPDF = () => {
    generateCoursePDF(summary);
  };

  // Niveaux labels for visual helpers
  const levels: Record<string, string> = {
    primary: 'Élémentaire (Primaire)',
    college: 'Collège',
    lycee: 'Lycée',
    uni: 'Université / Supérieur'
  };

  const currentLevelLabel = levels[summary.difficulty] || summary.difficulty;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      
      {/* Upper Title Panel & Action Download Header */}
      <div className="bg-slate-50/50 border-b border-slate-200 px-5 py-6 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
              {summary.subject}
            </span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
              Niveau: {currentLevelLabel}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isSavedInCloud 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              {isSavedInCloud ? "Sauvegardé dans votre historique" : "Fiche locale"}
            </span>
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
            {summary.title}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Généré le {new Date(summary.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 flex-shrink-0 sm:items-center">
          <button
            onClick={handleCopySummary}
            id="btn-copy-summary"
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-700">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-slate-500" />
                <span>Copier le résumé</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPDF}
            id="btn-download-pdf-revision"
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
          >
            <FileDown className="h-4 w-4" />
            <span>Exporter en PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs Menu Navigation Bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'summary', label: 'Résumé', icon: BookOpen },
          { id: 'simplification', label: 'Simplification', icon: Lightbulb },
          { id: 'definitions', label: 'Définitions & Mémos', icon: FileText },
          { id: 'quiz', label: 'Quiz Interactif', icon: HelpCircle }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 py-3.5 border-b-2 font-display text-xs font-bold tracking-tight transition ${
                isActive 
                ? 'border-indigo-600 bg-indigo-50/10 text-indigo-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Displaying Current Tab Content */}
      <div className="p-5 sm:p-6 bg-white min-h-[300px]">
        
        {/* TAB 1: SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="prose max-w-none">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 mb-2 flex items-center gap-1.5">
                Synthèse Générale
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                {summary.summaryText}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 mb-3 block">
                Points Clés de la Leçon
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {summary.keyPoints.map((point, index) => (
                  <div key={index} className="flex gap-2.5 items-start">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <span className="text-xs text-slate-700 leading-relaxed font-medium">
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SIMPLIFICATION */}
        {activeTab === 'simplification' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3 bg-amber-50 rounded-xl p-3 border border-amber-100">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              <div>
                <h4 className="text-xs font-bold text-amber-800">
                  Adaptation Spécifique : {currentLevelLabel}
                </h4>
                <p className="text-[10px] text-amber-600 font-medium">
                  L'explication de ce cours a été restructurée pédagogiquement avec un vocabulaire adapté.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-200 bg-notebook p-5 text-slate-800">
              <div className="highlighter-amber inline-block px-3 py-1 text-xs font-bold text-[#b45309] rounded-md mb-3 font-display">
                Explication intuitive
              </div>
              <p className="text-sm leading-relaxed font-sans whitespace-pre-wrap text-slate-800">
                {summary.simplification}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: DEFINITIONS & MEMOS */}
        {activeTab === 'definitions' && (
          <div className="space-y-6">
            
            {/* Essential Definitions */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3 flex items-center gap-1.5">
                <Clipboard className="h-4 w-4" /> Vocabulaire et Définitions
              </h3>
              {summary.definitions && summary.definitions.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {summary.definitions.map((def, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition">
                      <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-200/60 pb-1 mb-1.5 font-display flex items-center gap-1">
                        <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full" />
                        {def.term}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {def.definition}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 font-semibold font-mono">
                  Aucun terme spécifique à définir défini pour ce cours.
                </div>
              )}
            </div>

            {/* Formulas or dates */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3 flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Fiches Mémos (Dates & Formules)
              </h3>
              {summary.formulasOrDates && summary.formulasOrDates.length > 0 ? (
                <div className="grid gap-2">
                  {summary.formulasOrDates.map((item, idx) => (
                    <div key={idx} className="rounded-xl bg-amber-50/40 border border-amber-100/60 p-3 flex gap-3 items-center">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-[#b45309] text-xs font-mono font-bold">
                        i
                      </div>
                      <span className="text-xs font-bold text-amber-900 font-mono">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 font-semibold font-mono">
                  Aucune formule mathématique ou date historique clé spécifiée.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: QUIZ REVIEW */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Testez votre compréhension</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Quiz rapide d'auto-évaluation</p>
              </div>
              
              {quizSubmitted && (
                <div className="text-right">
                  <span className="text-sm font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    Score: {quizScore} / {summary.quiz.length}
                  </span>
                </div>
              )}
            </div>

            {/* Loop Questions */}
            <div className="space-y-4">
              {summary.quiz.map((q, qIndex) => {
                const selectedAns = quizAnswers[qIndex];
                const isCorrect = selectedAns === q.correctAnswer;
                
                return (
                  <div key={qIndex} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                    <p className="text-xs font-bold text-slate-800 mb-3 flex items-start gap-1.5">
                      <span className="text-indigo-600">Q{qIndex + 1}.</span> {q.question}
                    </p>

                    {/* Choice Options */}
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

                    {/* Correction details inside Quiz once submitted */}
                    {quizSubmitted && (
                      <div className="mt-3 text-[10px] leading-relaxed rounded-lg p-2.5 bg-indigo-50/50 text-indigo-900 border border-indigo-100/50">
                        <strong className="block mb-0.5">Explication :</strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quiz Action Control */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              {quizSubmitted ? (
                <>
                  <div className="text-xs text-slate-500 font-medium font-sans">
                    {quizScore === summary.quiz.length 
                      ? "Félicitations ! Vous maîtrisez parfaitement ce cours ! 🎉" 
                      : "Poursuivez vos efforts, relisez les explications simples pour exceller ! 📚"}
                  </div>
                  <button
                    onClick={handleResetQuiz}
                    id="btn-restart-revision-quiz"
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Recommencer le Quiz
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleEvaluateQuiz}
                  disabled={Object.keys(quizAnswers).length < summary.quiz.length}
                  id="btn-grade-revision-quiz"
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Valider mes réponses ({Object.keys(quizAnswers).length}/{summary.quiz.length})
                </button>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
