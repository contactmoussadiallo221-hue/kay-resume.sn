import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { BookOpen, LogIn, LogOut, User, GraduationCap, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  onUserChanged: (user: UserProfile | null) => void;
}

export default function Navbar({ onUserChanged }: NavbarProps) {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || "Étudiant",
          createdAt: new Date().toISOString()
        };
        
        // Sync user profile in Firestore
        try {
          await setDoc(doc(db, 'users', user.uid), profile, { merge: true });
        } catch (err) {
          console.error("Failed to sync user profile in DB:", err);
        }
        
        onUserChanged(profile);
      } else {
        setCurrentUser(null);
        onUserChanged(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [onUserChanged]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google Authenticate Error:", err);
      setAuthError("Impossible de se connecter avec Google. Veuillez réessayer.");
    }
  };

  const handleGuestSignIn = async () => {
    setAuthError(null);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error("Anonymous Authenticate Error:", err);
      setAuthError("Impossible de créer un compte invité. Mode hors-ligne activé.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/10">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
              Mon Prof IA 
              <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 font-sans">
                <Sparkles className="h-3 w-3 text-indigo-600" /> Pro
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">Assistant de révision intelligent</p>
          </div>
        </div>

        {/* User Navigation Area */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-full bg-slate-100" />
          ) : currentUser ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800">
                  {currentUser.displayName || "Étudiant"}
                </span>
                <span className="text-[9px] font-mono text-indigo-600">
                  {currentUser.isAnonymous ? "Compte Invité" : currentUser.email}
                </span>
              </div>
              
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || "Avatar"} 
                  className="h-9 w-9 rounded-full object-cover border-2 border-indigo-100"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                  <User className="h-5 w-5" />
                </div>
              )}

              <button
                onClick={handleSignOut}
                id="btn-signout"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Se déconnecter</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleGoogleSignIn}
                id="btn-google-login"
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                <LogIn className="h-4 w-4" />
                <span>Se connecter</span>
              </button>
              
              <button
                onClick={handleGuestSignIn}
                id="btn-guest-login"
                className="hidden sm:inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Accès Invité
              </button>
            </div>
          )}
        </div>
      </div>
      {authError && (
        <div className="bg-red-50 py-1.5 text-center text-xs font-medium text-red-600 border-b border-red-100">
          {authError}
        </div>
      )}
    </header>
  );
}
