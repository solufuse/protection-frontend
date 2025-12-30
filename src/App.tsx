
import { useEffect, useState } from 'react';
import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  User 
} from "firebase/auth";
import { Activity, LogOut, Settings, FileText, Zap, AlertTriangle } from 'lucide-react';

// Pages
import Files from './pages/Files';
import Config from './pages/Config';
import Loadflow from './pages/Loadflow';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'files' | 'config' | 'loadflow'>('loadflow'); // Default to Loadflow
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- 1. SAFE INITIALIZATION & AUTH ---
  useEffect(() => {
    const initApp = async () => {
      try {
        const firebaseConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
          measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
        };

        // Check if config exists
        if (!firebaseConfig.apiKey) {
          throw new Error("Missing Firebase Configuration. Check Dokploy Environment Variables.");
        }

        // Initialize Firebase (Singleton pattern)
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const auth = getAuth(app);

        // Auth Listener
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser) {
            console.log("User authenticated:", currentUser.uid);
            setUser(currentUser);
            setLoading(false);
          } else {
            console.log("No user. Attempting Anonymous Login...");
            signInAnonymously(auth).catch((err) => {
               console.error("Auto-login failed:", err);
               setErrorMsg("Anonymous Login Failed: " + err.message);
               setLoading(false);
            });
          }
        });

        return () => unsubscribe();

      } catch (err: any) {
        console.error("Critical Init Error:", err);
        setErrorMsg(err.message || "App Initialization Failed");
        setLoading(false);
      }
    };

    initApp();
  }, []);

  // --- ACTIONS ---
  const handleGoogleLogin = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) { console.error(error); }
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth);
  };

  // --- RENDER: LOADING ---
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-10 h-10 text-blue-600 animate-pulse" />
          <span className="text-slate-400 font-bold tracking-widest text-xs">STARTING SOLUFUSE...</span>
        </div>
      </div>
    );
  }

  // --- RENDER: ERROR ---
  if (errorMsg) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-red-50 p-10">
        <div className="max-w-lg bg-white p-6 rounded shadow-xl border border-red-200">
          <h1 className="text-xl font-black text-red-600 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6" /> SYSTEM ERROR
          </h1>
          <div className="bg-slate-900 text-red-400 p-4 rounded text-xs font-mono overflow-auto mb-4">
            {errorMsg}
          </div>
          <p className="text-xs text-slate-500">Please check your environment variables in Dokploy.</p>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN APP ---
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      
      {/* NAVBAR */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        
        {/* LOGO */}
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-blue-200 shadow-lg">S</div>
            <span className="font-black text-lg tracking-tight text-slate-700 hidden md:block">SOLUFUSE <span className="text-blue-600">APP</span></span>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setActiveTab('files')} className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-md text-[10px] md:text-[11px] font-bold transition-all ${activeTab === 'files' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <FileText className="w-3.5 h-3.5" /> FILES
            </button>
            <button onClick={() => setActiveTab('config')} className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-md text-[10px] md:text-[11px] font-bold transition-all ${activeTab === 'config' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Settings className="w-3.5 h-3.5" /> CONFIG
            </button>
            <button onClick={() => setActiveTab('loadflow')} className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-md text-[10px] md:text-[11px] font-bold transition-all ${activeTab === 'loadflow' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Zap className="w-3.5 h-3.5" /> SIMULATION
            </button>
        </div>

        {/* USER */}
        <div className="flex items-center gap-4">
            <div className="text-right hidden lg:block">
                <div className="text-[10px] font-bold text-slate-900">{user?.isAnonymous ? "Guest Mode" : user?.displayName}</div>
                <div className="text-[9px] text-slate-400 font-mono">{user?.uid.substring(0,6)}...</div>
            </div>
            
            {user?.isAnonymous ? (
                <button onClick={handleGoogleLogin} className="bg-slate-900 text-white px-3 py-1.5 rounded text-[10px] font-bold hover:bg-slate-700 transition-colors shadow-lg">
                    LINK GOOGLE
                </button>
            ) : (
                <button onClick={handleLogout} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors" title="Logout">
                    <LogOut className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'files' && <Files user={user} />}
        {activeTab === 'config' && <Config user={user} />}
        {activeTab === 'loadflow' && <Loadflow user={user} />}
      </div>

    </div>
  );
}
