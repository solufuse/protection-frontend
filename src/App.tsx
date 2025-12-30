
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
        // [!] AUTO-GUEST LOGIN
        console.log("[Auto-Login] No user found, creating Guest session...");
        signInAnonymously(auth)
          .then(() => {
            // Listener will fire again with the new user
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

  // Show spinner only while waiting for initial auth check or auto-login
  if (loading) return <LoadingScreen />;

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        {/* Navbar handles the login menu now */}
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/files" replace />} />
            
            {/* Pages requiring user props */}
            <Route path="/loadflow" element={<Loadflow user={user} />} />
            <Route path="/files" element={<Files user={user} />} />
            <Route path="/config" element={<Config user={user} />} />
            
            {/* Page NOT requiring user props */}
            <Route path="/protection" element={<Protection />} />
            
            <Route path="*" element={<Navigate to="/files" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
