
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';
import Navbar from './components/Navbar';
import Files from './pages/Files';
import Protection from './pages/Protection';
import Loadflow from './pages/Loadflow';
import Ingestion from './pages/Ingestion';
import Config from './pages/Config';
import Extraction from './pages/Extraction';
import Login from './pages/Login';
import Forum from './pages/Forum';
import Profile from './pages/Profile';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        console.log("No user detected. Signing in as Guest...");
        signInAnonymously(auth).catch((error) => {
            console.error("Auto-Guest failed:", error);
            setLoading(false);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold text-xs">LOADING SYSTEM...</div>;

  return (
    <BrowserRouter>
      {/* Top Navbar Layout */}
      <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
        {user && <Navbar user={user} onLogout={() => auth.signOut()} />}
        
        {/* [FIX] overflow-y-scroll forces scrollbar track visible always (prevents layout shift) */}
        <main className="flex-1 overflow-y-scroll relative flex flex-col w-full">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            
            <Route path="/" element={user ? <Files user={user} /> : <Navigate to="/login" />} />
            <Route path="/files" element={user ? <Files user={user} /> : <Navigate to="/login" />} />
            
            <Route path="/forum" element={user ? <Forum user={user} /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
            
            <Route path="/protection" element={user ? <Protection user={user} /> : <Navigate to="/login" />} />
            <Route path="/loadflow" element={user ? <Loadflow user={user} /> : <Navigate to="/login" />} />
            <Route path="/ingestion" element={user ? <Ingestion /> : <Navigate to="/login" />} />
            <Route path="/config" element={user ? <Config user={user} /> : <Navigate to="/login" />} />
            <Route path="/extraction" element={user ? <Extraction /> : <Navigate to="/login" />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
