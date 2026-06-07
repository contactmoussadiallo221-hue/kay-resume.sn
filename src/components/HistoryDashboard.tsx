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
      <div className="premium-card p-5 text-center premium-shadow bg-white/70 backdrop-blur-sm border-dashed">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100 mb-3">
          <GraduationCap className="h-6 w-6 text-indigo-500" />
        </div>
        <h3 className="font-display text-sm font-bold text-slate-950">Historique localisé</h3>
        <p className="text-[11px] text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed font-medium">
          Connectez-vous via Google ou utilisez le compte Invité pour sauvegarder automatiquement vos fiches de révisions et les retrouver sur tous vos appareils !
        </p>
      </div>
    );
  }

  return (
    <div className="premium-card p-5 premium-shadow bg-white">
      
      <div className="flex flex-col gap-3 border-b border-slate-50 pb-4 mb-4">
        <div>
          <h2 className="font-display text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-indigo-600" /> Vos Fiches Enregistrées
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{summaries.length} cours répertoriés</p>
        </div>

        {/* Dynamic Inner Text Filter Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une fiche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all"
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
        <div className="flex flex-wrap gap-1 mb-4 max-h-[140px] overflow-y-auto pb-1">
          {availableSubjects.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubjectFilter(sub)}
              className={`rounded-lg px-2 py-1 text-[9px] font-extrabold tracking-wide uppercase transition-all duration-150 cursor-pointer ${
                selectedSubjectFilter === sub
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/10'
                : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
              }`}
            >
              {sub === 'All' ? 'Toutes' : sub}
            </button>
          ))}
        </div>
      )}

      {/* Historical cards database lists */}
      {loading ? (
        <div className="space-y-2 py-4">
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-50" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-50" />
        </div>
      ) : filteredSummaries.length > 0 ? (
        <div className="grid gap-2 max-h-[460px] overflow-y-auto pr-1">
          {filteredSummaries.map((s) => {
            const isActive = activeSummaryId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => onSelectSummary(s)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                  isActive 
                  ? 'border-indigo-600 bg-indigo-50/15 ring-1 ring-indigo-600/10 shadow-xs' 
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/30'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {s.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 mt-1 font-sans">
                    <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/30">
                      {s.subject}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Calendar className="h-2.5 w-2.5" />
                      {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(e, s.id)}
                  id={`btn-delete-course-${s.id}`}
                  className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer"
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
          Aucune fiche de révision correspondante.
        </div>
      ) : (
        <div className="text-center py-12 text-[11px] text-slate-400 font-semibold leading-relaxed max-w-[240px] mx-auto border-2 border-dashed border-slate-100 rounded-xl p-4">
          Vous n'avez pas encore créé de fiche de révision. Importez votre premier cours pour commencer !
        </div>
      )}

    </div>
  );
}
