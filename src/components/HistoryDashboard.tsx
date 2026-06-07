import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Summary, UserProfile } from '../types';
import { Trash2, Search, BookOpen, AlertCircle, Calendar, GraduationCap } from 'lucide-react';

interface HistoryDashboardProps {
  user: UserProfile | null;
  onSelectSummary: (summary: Summary) => void;
  activeSummaryId?: string;
  refreshTrigger: number;
}

export default function HistoryDashboard({
  user,
  onSelectSummary,
  activeSummaryId,
  refreshTrigger
}: HistoryDashboardProps) {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSummaries([]);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setErrorStatus(null);
      const path = `users/${user.uid}/summaries`;
      try {
        const q = query(
          collection(db, 'users', user.uid, 'summaries'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const items: Summary[] = [];
        querySnapshot.forEach((doc) => {
          items.push(doc.data() as Summary);
        });
        setSummaries(items);
      } catch (err: any) {
        console.error("Error fetching historical summaries:", err);
        // Safely check and handle firestore permission issues using standard handler
        try {
          handleFirestoreError(err, OperationType.LIST, path);
        } catch (wrappedErr: any) {
          setErrorStatus("Impossible de charger l'historique de révision.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, refreshTrigger]);

  const handleDelete = async (e: React.MouseEvent, summaryId: string) => {
    e.stopPropagation(); // Avoid triggering card selection click
    if (!user) return;
    if (!confirm("Voulez-vous vraiment supprimer définitivement cette fiche de révision ?")) return;

    const path = `users/${user.uid}/summaries/${summaryId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'summaries', summaryId));
      setSummaries(prev => prev.filter(item => item.id !== summaryId));
    } catch (err: any) {
      console.error("Delete summary error:", err);
      try {
        handleFirestoreError(err, OperationType.DELETE, path);
      } catch (wrappedErr) {
        alert("Action interdite ou erreur de réseau. Suppression échouée.");
      }
    }
  };

  // Group unique subjects for filter badges
  const availableSubjects = ['All', ...Array.from(new Set(summaries.map(s => s.subject)))] as string[];

  // Filtering logic
  const filteredSummaries = summaries.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.summaryText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubjectFilter === 'All' || s.subject === selectedSubjectFilter;
    return matchesSearch && matchesSubject;
  });

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
        <GraduationCap className="mx-auto h-12 w-12 text-slate-300 mb-2" />
        <h3 className="font-display text-sm font-bold text-slate-800">Historique non connecté</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Connectez-vous via Google ou créez un compte Invité pour stocker et retrouver vos fiches de révisions sur tous vos appareils !
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h2 className="font-display text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-indigo-600" /> Vos Fiches Enregistrées
          </h2>
          <p className="text-[10px] text-slate-400 font-semibold uppercase">{summaries.length} cours répertoriés</p>
        </div>

        {/* Dynamic Inner Text Filter Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une fiche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-60 rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
          />
        </div>
      </div>

      {errorStatus && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg p-2.5 border border-red-100">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorStatus}</span>
        </div>
      )}

      {/* Subject Filter Area */}
      {summaries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4 max-h-[140px] overflow-y-auto">
          {availableSubjects.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubjectFilter(sub)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition whitespace-nowrap ${
                selectedSubjectFilter === sub
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sub === 'All' ? 'TOUTES MATIÈRES' : sub.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Historical cards database lists */}
      {loading ? (
        <div className="space-y-2 py-4">
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
        </div>
      ) : filteredSummaries.length > 0 ? (
        <div className="grid gap-2 max-h-[460px] overflow-y-auto pr-1">
          {filteredSummaries.map((s) => {
            const isActive = activeSummaryId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => onSelectSummary(s)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                  isActive 
                  ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-500/10' 
                  : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {s.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-400 mt-1 font-sans">
                    <span className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded text-[8px] font-bold">
                      {s.subject}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Calendar className="h-2.5 w-2.5" />
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(e, s.id)}
                  id={`btn-delete-course-${s.id}`}
                  className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                  title="Supprimer la fiche"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : summaries.length > 0 ? (
        <div className="text-center py-10 text-xs text-slate-400 font-semibold font-mono">
          Aucune fiche de révision ne correspond à vos filtres.
        </div>
      ) : (
        <div className="text-center py-12 text-xs text-slate-400 font-medium leading-relaxed max-w-[240px] mx-auto border-2 border-dashed border-slate-100 rounded-2xl p-4">
          Vous n'avez pas encore créé de fiche de révision. Importez votre premier cours ci-dessus pour démarrer votre apprentissage !
        </div>
      )}

    </div>
  );
}
