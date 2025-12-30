
import { useEffect, useState } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  User 
} from "firebase/auth";
import { Activity, LogOut, LayoutGrid, Settings, FileText, Zap } from 'lucide-react';

// Pages
import Files from './pages/Files';
import Config from './pages/Config';
import Loadflow from './pages/Loadflow';

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'files' | 'config' | 'loadflow'>('files');

  // --- AUTH LOGIC ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Utilisateur trouvé (Google ou Anonyme)
        setUser(currentUser);
        setLoading(false);
      } else {
        // [!] MAGIE ICI : Si personne n'est connecté, on connecte en ANONYME automatiquement
        console.log("No user detected, signing in anonymously...");
        signInAnonymously(auth).catch((error) => {
            console.error("Auto-login failed:", error);
            // Si l'anonyme échoue, on arrête le chargement pour montrer le bouton manuel au pire
            setLoading(false); 
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Fonction pour se connecter "vraiment" avec Google si l'utilisateur le veut plus tard
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  // --- LOADING SCREEN ---
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-10 h-10 text-blue-600 animate-pulse" />
          <span className="text-slate-400 font-bold tracking-widest text-xs">INITIALIZING APP...</span>
        </div>
      </div>
    );
  }

  // --- APP LAYOUT (Toujours visible grâce à l'auth anonyme) ---
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      
      {/* NAVBAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg">S</div>
            <span className="font-black text-lg tracking-tight text-slate-700">SOLUFUSE <span className="text-blue-600">APP</span></span>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setActiveTab('files')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${activeTab === 'files' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <FileText className="w-3.5 h-3.5" /> FILES
            </button>
            <button onClick={() => setActiveTab('config')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${activeTab === 'config' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Settings className="w-3.5 h-3.5" /> CONFIG
            </button>
            <button onClick={() => setActiveTab('loadflow')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${activeTab === 'loadflow' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Zap className="w-3.5 h-3.5" /> SIMULATION
            </button>
        </div>

        {/* USER PROFILE */}
        <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
                <div className="text-[10px] font-bold text-slate-900">{user?.isAnonymous ? "Guest User" : user?.displayName}</div>
                <div className="text-[9px] text-slate-400 font-mono">{user?.uid.substring(0,8)}...</div>
            </div>
            
            {user?.isAnonymous ? (
                <button onClick={handleGoogleLogin} className="bg-slate-900 text-white px-3 py-1.5 rounded text-[10px] font-bold hover:bg-slate-700 transition-colors">
                    LINK GOOGLE
                </button>
            ) : (
                <button onClick={handleLogout} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors" title="Logout">
                    <LogOut className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'files' && <Files user={user} />}
        {activeTab === 'config' && <Config user={user} />}
        {activeTab === 'loadflow' && <Loadflow user={user} />}
      </div>

    </div>
  );
}
