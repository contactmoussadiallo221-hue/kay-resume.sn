import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, FileText, AlertCircle, RefreshCw, Sparkles, BookOpen, Layers } from 'lucide-react';

interface CourseUploaderProps {
  onSummarizeStarted: () => void;
  onSummaryGenerated: (summary: any) => void;
  onSummaryError: (err: string) => void;
  isProcessing: boolean;
}

export default function CourseUploader({
  onSummarizeStarted,
  onSummaryGenerated,
  onSummaryError,
  isProcessing
}: CourseUploaderProps) {
  const [subject, setSubject] = useState('Mathématiques');
  const [difficulty, setDifficulty] = useState('college');
  const [textNotes, setTextNotes] = useState('');
  
  // File upload state variables
  const [uploadedFile, setUploadedFile] = useState<{ name: string; type: string; data: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera integration state variables
  const [useCamera, setUseCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Clean up camera stream if unmounted
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Handle camera activation
  const startCamera = async () => {
    setCameraError(null);
    setUseCamera(true);
    setUploadedFile(null); // Clear previous files
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions de votre appareil.");
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setUploadedFile({
          name: `capture_prof_ia_${Date.now()}.jpg`,
          type: 'image/jpeg',
          data: dataUrl
        });
        stopCamera();
      }
    }
  };

  // Drag and Drop core handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    
    // Validate correct file types: PDF or images
    const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!isValidType) {
      onSummaryError("Format de fichier non supporté. Veuillez insérer un PDF ou une image (PNG, JPEG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedFile({
        name: file.name,
        type: file.type,
        data: result
      });
      setUseCamera(false); // Disable camera if user uploads file
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!uploadedFile && !textNotes.trim()) {
      onSummaryError("Veuillez téléverser un cours (photo/PDF) ou saisir des notes écrites dans le champ.");
      return;
    }

    onSummarizeStarted();

    try {
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textNotes,
          fileData: uploadedFile?.data || null,
          mimeType: uploadedFile?.type || null,
          subject,
          difficulty
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Une erreur est survenue lors de l'exécution de l'OCR ou du résumé.");
      }

      const summaryResult = await response.json();
      
      // Inject details to match fully initialized types
      const summaryWithMetadata = {
        ...summaryResult,
        id: `summary_${Date.now()}`,
        subject,
        difficulty,
        originalText: textNotes || uploadedFile?.name || "Cours importé",
        createdAt: new Date().toISOString()
      };

      onSummaryGenerated(summaryWithMetadata);
    } catch (err: any) {
      console.error(err);
      onSummaryError(err?.message || "Échec de la connexion avec le robot IA. Réessayez.");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          Importer ou Saisir votre Cours
        </h2>
        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1 font-mono">
          <Sparkles className="h-3.5 w-3.5" /> Professeur Connecté
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Side: Parameters & Input Choices */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              Matière du cours
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
            >
              <option value="Mathématiques">Mathématiques</option>
              <option value="Physique-Chimie">Physique-Chimie</option>
              <option value="SVT / Biologie">SVT / Biologie</option>
              <option value="Histoire-Géographie">Histoire-Géographie</option>
              <option value="Français / Philosophie">Français / Philosophie</option>
              <option value="Informatique / Technologie">Informatique / Technologie</option>
              <option value="Autre">Autre Matière</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Niveau de simplification désiré
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { id: 'primary', label: 'Élémentaire', sub: 'Primaire' },
                { id: 'college', label: 'Collège', sub: '6e - 3e' },
                { id: 'lycee', label: 'Lycée', sub: '2de - Term' },
                { id: 'uni', label: 'Université', sub: 'Supérieur' }
              ].map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setDifficulty(level.id)}
                  className={`flex flex-col items-center justify-center rounded-xl p-2.5 border text-center transition ${
                    difficulty === level.id 
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-2 ring-indigo-600/10' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-xs font-bold">{level.label}</span>
                  <span className="text-[9px] font-medium text-slate-400 mt-0.5">{level.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Texte du cours ou directives (Facultatif)
            </label>
            <textarea
              value={textNotes}
              onChange={(e) => setTextNotes(e.target.value)}
              placeholder="Collez ici le contenu brut de votre leçon, ou ajoutez des instructions spécifiques pour l'IA (ex: Insiste bien sur les lois d'addition)..."
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition resize-none font-sans"
            />
          </div>
        </div>

        {/* Right Side: Media upload and camera Capture */}
        <div className="flex flex-col">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Prendre en photo ou Téléverser un cours (PDF, JPEG, PNG)
          </label>

          {useCamera ? (
            /* Camera Live Feed View */
            <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-xl bg-slate-900 border border-slate-950 min-h-[220px]">
              <video 
                ref={videoRef}
                playsInline
                className="h-full w-full object-cover max-h-[260px]"
              />
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  id="btn-trigger-capture"
                  className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
                >
                  Capturer l'image
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  id="btn-cancel-capture"
                  className="rounded-full bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            /* Standard Upload / Drop Area */
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
                dragActive 
                ? 'border-indigo-600 bg-indigo-50/10' 
                : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/20'
              } min-h-[220px]`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-input-field"
              />

              {uploadedFile ? (
                /* Uploaded File success state preview */
                <div className="space-y-3 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    {uploadedFile.type === "application/pdf" ? (
                      <FileText className="h-6 w-6" />
                    ) : (
                      <img 
                        src={uploadedFile.data} 
                        alt="Aperçu" 
                        className="h-full w-full object-cover rounded-xl"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate" title={uploadedFile.name}>
                      {uploadedFile.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold font-mono space-x-1.5">
                      <span>{uploadedFile.type.toUpperCase().split('/')[1] || "DOC"}</span>
                      <span>•</span>
                      <button 
                        onClick={() => setUploadedFile(null)} 
                        className="text-red-500 hover:text-red-600 hover:underline"
                        id="btn-clear-uploaded-file"
                      >
                        Retirer
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                /* Prompt state */
                <div className="space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Glissez votre cours ou cliquez pour téléverser
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1">
                      PDF, PNG ou JPEG jusqu'à 20 Mo
                    </p>
                  </div>
                </div>
              )}

              {/* Take a Photo shortcut */}
              {!uploadedFile && (
                <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={startCamera}
                    id="btn-lens-access"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100/80 transition"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Utiliser l'appareil photo / WebCam
                  </button>
                </div>
              )}
            </div>
          )}

          {cameraError && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-red-600">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Action Analyzer Button */}
      <div className="mt-6 border-t border-slate-100 pt-5 flex items-center justify-end">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isProcessing || (!uploadedFile && !textNotes.trim())}
          id="btn-run-summary-analysis"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Analyse et Simplification en cours...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Transformer en Fiche de Révision</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
