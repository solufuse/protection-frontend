
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Protection from './pages/Protection';
import Loadflow from './pages/Loadflow';
import Ingestion from './pages/Ingestion';
import Config from './pages/Config';
import DiagramEditor from './pages/DiagramEditor';
import Extraction from './pages/Extraction';
import Login from './pages/Login';
import Forum from './pages/Forum'; 
import Profile from './pages/Profile'; 
import FileManager from './components/files/FileManager';
import { ReactFlowProvider } from 'reactflow';
import { X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

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
        signInAnonymously(auth).catch((error) => {
            console.error("Anonymous sign-in failed:", error);
            setUser(null);
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
      <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        
        {user && (
          <Sidebar 
            user={user} 
            onLogout={() => auth.signOut()} 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme} 
            onToggleFileManager={() => setIsFileManagerOpen(!isFileManagerOpen)}
            isFileManagerOpen={isFileManagerOpen}
            isSidebarExpanded={isSidebarExpanded}
            setIsSidebarExpanded={setIsSidebarExpanded}
          />
        )}
        
        <main className="flex-1 overflow-y-auto w-full relative">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            
            <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/forum" element={user ? <Forum user={user} /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
            
            <Route path="/protection" element={user ? <Protection user={user} /> : <Navigate to="/login" />} />
            <Route path="/loadflow" element={user ? <Loadflow user={user} /> : <Navigate to="/login" />} />
            <Route path="/ingestion" element={user ? <Ingestion /> : <Navigate to="/login" />} />
            <Route path="/config" element={user ? <Config user={user} /> : <Navigate to="/login" />} />
            <Route path="/diagram" element={user ? <ReactFlowProvider><DiagramEditor user={user} /></ReactFlowProvider> : <Navigate to="/login" />} />
            <Route path="/extraction" element={user ? <Extraction /> : <Navigate to="/login" />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {isFileManagerOpen && user && (
          <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
            <div className="w-[95%] h-[95%] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
              <button onClick={() => setIsFileManagerOpen(false)} className="absolute top-4 right-4 z-10 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
              <FileManager user={user} />
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}
