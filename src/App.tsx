import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { Zap } from 'lucide-react';

// Composants
import Navbar from './components/Navbar';
import Loadflow from './pages/Loadflow';
import Protection from './pages/Protection';
import Files from './pages/Files';

function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(true);

  // Gestion Globale de l'Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (error) { console.error("Erreur login", error); }
  };

  const handleLogout = () => auth.signOut();

  // Écran de chargement initial
  if (authLoading) {
      return <div className="h-screen flex items-center justify-center bg-slate-50"><Zap className="w-10 h-10 text-slate-300 animate-pulse" /></div>;
  }

  // Écran de Login (Si pas connecté)
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold mb-8 text-slate-800 flex items-center justify-center gap-3">
            <Zap className="w-10 h-10 text-blue-600" /> Solufuse
          </h1>
          <button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center gap-3 mx-auto">
            <span className="bg-white text-blue-600 font-bold px-2 rounded">G</span>
            Se connecter avec Google
          </button>
        </div>
      </div>
    );
  }

  // Application Principale (Avec Router)
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar user={user} onLogout={handleLogout} />
        
        <Routes>
          <Route path="/" element={<Navigate to="/loadflow" replace />} />
          <Route path="/loadflow" element={<Loadflow user={user} />} />
          <Route path="/protection" element={<Protection />} />
          <Route path="/files" element={<Files user={user} />} />
          {/* Redirection par défaut si route inconnue */}
          <Route path="*" element={<Navigate to="/loadflow" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
