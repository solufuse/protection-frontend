
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

// Composant de chargement simple (Spinner)
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
    // Écouteur d'état Firebase
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // 1. Utilisateur connecté (Google ou Guest existant)
        setUser(currentUser);
        setLoading(false);
      } else {
        // 2. Pas d'utilisateur ? -> ON CRÉE UN GUEST AUTOMATIQUEMENT
        console.log("[Auto-Login] No user found, creating Guest session...");
        signInAnonymously(auth)
          .then(() => {
            // La réussite déclenchera à nouveau onAuthStateChanged avec le user
          })
          .catch((error) => {
            console.error("[Auto-Login Error]", error);
            setLoading(false); // On arrête le chargement même en cas d'erreur pour ne pas bloquer
          });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => auth.signOut();

  // Tant qu'on charge (ou qu'on connecte le guest en arrière-plan), on affiche le spinner
  if (loading) return <LoadingScreen />;

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        {/* On affiche la Navbar seulement si on a un user (ce qui sera toujours le cas après chargement) */}
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/files" replace />} />
            <Route path="/loadflow" element={<Loadflow user={user} />} />
            <Route path="/protection" element={<Protection user={user} />} />
            <Route path="/files" element={<Files user={user} />} />
            <Route path="/config" element={<Config user={user} />} />
            {/* Catch all : redirection vers files */}
            <Route path="*" element={<Navigate to="/files" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
