
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';
import Navbar from './components/Navbar';
import Loadflow from './pages/Loadflow';
import Protection from './pages/Protection';
import Files from './pages/Files';
import Config from './pages/Config';
import { Icons } from './icons';

// --- LOGIN SCREEN (Page d'accueil) ---
function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } 
    catch (e) { console.error(e); setLoading(false); }
  };

  const handleGuest = async () => {
    setLoading(true);
    try { await signInAnonymously(auth); } 
    catch (e) { console.error(e); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Icons.Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">SOLUFUSE</h1>
        <p className="text-slate-400 text-sm mb-8 font-medium">Protection & Loadflow Analysis</p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleGoogle} 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
          >
            {loading ? <Icons.Loader className="w-4 h-4 animate-spin" /> : <Icons.User className="w-4 h-4" />} 
            Google Login
          </button>
          <button 
            onClick={handleGuest} 
            disabled={loading}
            className="w-full bg-white text-slate-600 font-bold py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Icons.Loader className="w-4 h-4 animate-spin text-slate-400" /> : <Icons.Shield className="w-4 h-4" />} 
            Guest Access
          </button>
        </div>
      </div>
    </div>
  );
}

// --- LOADING SPINNER ---
function LoadingScreen() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-4">
      <Icons.Loader className="w-10 h-10 animate-spin text-blue-600" />
      <span className="text-xs font-bold tracking-widest uppercase">Loading Solufuse...</span>
    </div>
  );
}

// --- MAIN APP ---
function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => auth.signOut();

  // 1. Si chargement -> Spinner
  if (loading) return <LoadingScreen />;

  // 2. Si pas d'utilisateur -> Écran de connexion (Login Screen)
  if (!user) return <LoginScreen />;

  // 3. Si utilisateur -> L'Application
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/files" replace />} />
            
            {/* Pages qui acceptent 'user' (selon tes fichiers) */}
            <Route path="/loadflow" element={<Loadflow user={user} />} />
            <Route path="/files" element={<Files user={user} />} />
            <Route path="/config" element={<Config user={user} />} />
            
            {/* Page qui n'accepte PAS 'user' (selon ton fichier Protection.tsx) */}
            <Route path="/protection" element={<Protection />} />
            
            <Route path="*" element={<Navigate to="/files" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
