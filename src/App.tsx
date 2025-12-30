
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';
import Navbar from './components/Navbar';
import Loadflow from './pages/Loadflow';
import Protection from './pages/Protection';
import Files from './pages/Files';
import Config from './pages/Config';
import { Icons } from './icons';

function LoadingScreen() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-4">
      <Icons.Loader className="w-10 h-10 animate-spin text-blue-600" />
      <span className="text-xs font-bold tracking-widest uppercase">Initializing Solufuse...</span>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        console.log("[Auto-Login] No user found, creating Guest session...");
        signInAnonymously(auth)
          .then(() => {
            // Success handled by onAuthStateChanged
          })
          .catch((error) => {
            console.error("[Auto-Login Error]", error);
            setLoading(false);
          });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => auth.signOut();

  if (loading) return <LoadingScreen />;

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        {/* Navbar accepte 'user' -> OK */}
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/files" replace />} />
            
            {/* [FIX] Ces pages ne sont pas encore prêtes à recevoir 'user', on le retire pour l'instant */}
            <Route path="/loadflow" element={<Loadflow />} />
            <Route path="/protection" element={<Protection />} />
            
            {/* Files accepte 'user' -> OK */}
            <Route path="/files" element={<Files user={user} />} />
            
            {/* Config n'est pas prêt -> on retire 'user' */}
            <Route path="/config" element={<Config />} />
            
            <Route path="*" element={<Navigate to="/files" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
