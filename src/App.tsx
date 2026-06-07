import { useState, useCallback } from 'react';
import Navbar from './components/Navbar';
import CourseUploader from './components/CourseUploader';
import SummaryViewer from './components/SummaryViewer';
import HistoryDashboard from './components/HistoryDashboard';
import { Summary, UserProfile } from './types';
import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Sparkles, AlertCircle, HelpCircle, ArrowRight, RefreshCw, Star, GraduationCap, Compass, BookOpen } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeSummary, setActiveSummary] = useState<Summary | null>(null);
  
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [isSavedInCloud, setIsSavedInCloud] = useState(false);
  
  // Refresher flag for history updates
  const [refreshHistoryFlag, setRefreshHistoryFlag] = useState(0);
  const [appError, setAppError] = useState<string | null>(null);

  // Handle user updates from Navbar
  const handleUserChanged = useCallback((user: UserProfile | null) => {
    setCurrentUser(user);
    // If user shifts, keep original active summary but clear active states or save on transition
    if (user && activeSummary && !isSavedInCloud) {
       // Autocatch and save if user logs in after creation
       saveSummaryToCloud(activeSummary, user.uid);
    }
  }, [activeSummary, isSavedInCloud]);

  // Firestore automatic saver
  const saveSummaryToCloud = async (summary: Summary, userId: string) => {
    const path = `users/${userId}/summaries/${summary.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'summaries', summary.id), summary);
      setIsSavedInCloud(true);
      setRefreshHistoryFlag(prev => prev + 1);
    } catch (err: any) {
      console.error("Failed to automatically back up summary:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch (wrapped) {
        // Soft fallback for guest error boundaries or missing permissions
        setIsSavedInCloud(false);
      }
    }
  };

  const handleSummarizeStarted = () => {
    setIsAnalysing(true);
    setAppError(null);
  };

  const handleSummaryGenerated = (generatedSummary: Summary) => {
    setActiveSummary(generatedSummary);
    setIsAnalysing(false);
    setIsSavedInCloud(false);

    // Save automatically to cloud storage if student is authenticated
    if (currentUser) {
      saveSummaryToCloud(generatedSummary, currentUser.uid);
    }
  };

  const handleSummaryError = (errMessage: string) => {
    setAppError(errMessage);
    setIsAnalysing(false);
  };

  const handleSelectHistorySummary = (selected: Summary) => {
    setActiveSummary(selected);
    setIsSavedInCloud(true); // Since it was loaded from cloud, it is cloud-backed
    setAppError(null);
  };

  const handleCreateNewFile = () => {
    setActiveSummary(null);
    setIsSavedInCloud(false);
    setAppError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top sticky student control navbar */}
      <Navbar onUserChanged={handleUserChanged} />

      {/* Main Study Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* Academic greeting with positive study tips */}
        {!activeSummary && !isAnalysing && (
          <div className="mb-8 text-center sm:text-left max-w-3xl">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Préparez vos examens sans stress
            </h2>
            <p className="text-sm font-medium text-slate-600 mt-2 leading-relaxed">
              Importez un chapitre complexe, une photo d'un exercice ou un cours sous format PDF. Résumé et Étude extrait
              le texte important, génère un résumé par niveau d'étude, formule des mémos, et dresse un quiz thématique interactif !
            </p>
          </div>
        )}

        {appError && (
          <div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="space-y-1">
              <span className="font-bold">Une erreur s'est produite :</span>
              <p className="font-medium text-red-600/90">{appError}</p>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3 items-start">
          
          {/* LEFT 2 COLS: Active creation space OR summary display card */}
          <div className="lg:col-span-2 space-y-6">
            {isAnalysing ? (
              /* Loading student analysis workspace */
              <div className="premium-card p-8 text-center premium-shadow py-16 bg-white">
                <div className="relative mx-auto h-20 w-20 flex items-center justify-center rounded-2xl bg-indigo-50/50 text-indigo-600 mb-6 border border-indigo-100/60">
                  <RefreshCw className="h-10 w-10 animate-spin text-indigo-600" />
                  <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-500 fill-amber-400 animate-pulse" />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Lecture et Simplification en Cours...
                </h3>
                <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed font-semibold">
                  Le robot extrait les caractères (OCR) de votre document, synthétise les mémos et notions clés,
                  adapte les explications à votre cycle d'études et façonne vos questionnaires interactifs.
                </p>
                
                {/* Visual loading metrics */}
                <div className="mt-8 max-w-xs mx-auto space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-bold tracking-wider text-slate-400">
                    <span>NUMÉRISATION ACCÉLÉRÉE</span>
                    <span className="text-indigo-600 font-extrabold uppercase">En action</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-indigo-600 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ) : activeSummary ? (
              /* Displaying Generated Card */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleCreateNewFile}
                    id="btn-app-back-to-creation"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-3xs cursor-pointer"
                  >
                    ← Créer une autre fiche
                  </button>
                  
                  <span className="text-[11px] font-bold text-slate-400 font-mono">
                    FICHE ID #{activeSummary.id.split('_')[1]?.substring(0, 5) || "1"}
                  </span>
                </div>

                <SummaryViewer 
                  summary={activeSummary} 
                  isSavedInCloud={isSavedInCloud}
                />
              </div>
            ) : (
              /* Workspace: Import new course files */
              <CourseUploader
                onSummarizeStarted={handleSummarizeStarted}
                onSummaryGenerated={handleSummaryGenerated}
                onSummaryError={handleSummaryError}
                isProcessing={isAnalysing}
              />
            )}

            {/* General study suggestions visual layout */}
            {!activeSummary && !isAnalysing && (
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { title: "OCR Intelligent", desc: "Glissez vos photos de tableau ou de cahier d'exercices.", icon: Compass },
                  { title: "Modulation de Niveau", desc: "Du primaire à la faculté d'université, ajustez la complexité en un clic.", icon: Star },
                  { title: "Fiches Prêtes à Imprimer", desc: "Parfaitement formaté pour être partagé ou imprimé chez vous.", icon: BookOpen }
                ].map((tip, idx) => {
                  const Icon = tip.icon;
                  return (
                    <div key={idx} className="premium-card p-4.5 bg-white flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200 shadow-3xs">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100/30 text-indigo-600 mb-3.5">
                        <Icon className="h-4.5 w-4.5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 font-display">{tip.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">{tip.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: History dashboard list */}
          <div className="lg:col-span-1 space-y-6">
            <HistoryDashboard
              user={currentUser}
              onSelectSummary={handleSelectHistorySummary}
              activeSummaryId={activeSummary?.id}
              refreshTrigger={refreshHistoryFlag}
            />
            
            {/* Quick Helper guidelines board */}
            <div className="premium-card bg-slate-50/75 border border-slate-100 p-5 font-sans">
              <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 mb-2.5 font-display">
                <HelpCircle className="h-4 w-4 text-indigo-600" /> Guide de révision
              </h4>
              <ul className="text-[10px] leading-relaxed font-semibold space-y-2 list-disc pl-4 text-slate-500">
                <li>Activez la caméra pour photographier sur l'instant un cours sur papier.</li>
                <li>Choisissez la matière pour aider le robot enseignant à mieux cibler le cours de biologie, math, etc.</li>
                <li>Faites un zoom sur les explications simples si un théorème de votre cours vous semble obscur.</li>
                <li>Mémorisez plus vite en effectuant le quiz interactif de 3 questions !</li>
              </ul>
            </div>
          </div>

        </div>

      </main>

      {/* Humble study card credits */}
      <footer className="mt-12 border-t border-slate-100 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <p className="text-[10px] text-slate-400 font-bold font-mono tracking-wider">
            RÉSUMÉ ET ÉTUDE © {new Date().getFullYear()} • CONSTRUIT DE MANIÈRE ÉCORESPONSABLE ET ENTIÈREMENT SÉCURISÉE
          </p>
        </div>
      </footer>
    </div>
  );
}
