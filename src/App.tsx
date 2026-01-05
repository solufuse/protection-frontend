
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
import DiagramEditor from './pages/DiagramEditor';
import Extraction from './pages/Extraction';
import Login from './pages/Login';
import Forum from './pages/Forum'; 
import Profile from './pages/Profile'; 

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('solufuse_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
    } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        // If no user, sign in anonymously to provide guest access
        signInAnonymously(auth).catch((error) => {
            console.error("Anonymous sign-in failed:", error);
            setUser(null); // Fallback to no user if anonymous sign in fails
            setLoading(false);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      localStorage.setItem('solufuse_theme', newMode ? 'dark' : 'light');
      if (newMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400">Loading...</div>;

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden">
        
        {user && <Navbar user={user} onLogout={() => auth.signOut()} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}
        
        <main className="flex-1 overflow-y-scroll w-full relative flex flex-col">
          <Routes>
            {/* Redirect to home if a user (including anonymous) exists, otherwise show login */}
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            
            {/* Protect routes - redirect to login if user is null (only if anonymous sign-in fails) */}
            <Route path="/" element={user ? <Files user={user} /> : <Navigate to="/login" />} />
            <Route path="/files" element={user ? <Files user={user} /> : <Navigate to="/login" />} />
            
            <Route path="/forum" element={user ? <Forum user={user} /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
            
            <Route path="/protection" element={user ? <Protection user={user} /> : <Navigate to="/login" />} />
            <Route path="/loadflow" element={user ? <Loadflow user={user} /> : <Navigate to="/login" />} />
            <Route path="/ingestion" element={user ? <Ingestion /> : <Navigate to="/login" />} />
            <Route path="/config" element={user ? <Config user={user} /> : <Navigate to="/login" />} />
            <Route path="/diagram" element={user ? <DiagramEditor /> : <Navigate to="/login" />} />
            <Route path="/extraction" element={user ? <Extraction /> : <Navigate to="/login" />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
