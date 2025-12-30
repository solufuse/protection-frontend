
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signOut,
  User 
} from "firebase/auth";
import { Activity, AlertTriangle } from 'lucide-react';

// Ton composant Navbar original
import Navbar from './components/Navbar';

// Tes Pages
import Files from './pages/Files';
import Config from './pages/Config';
import Loadflow from './pages/Loadflow';
import Protection from './pages/Protection';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        const firebaseConfig = {
          apiKey: "AIzaSyAZ-Zi6fOKCH7duGgCnnHX_qB4TI5wTC5g",
          authDomain: "solufuse-5647c.firebaseapp.com",
          projectId: "solufuse-5647c",
          storageBucket: "solufuse-5647c.firebasestorage.app",
          messagingSenderId: "718299136180",
          appId: "1:718299136180:web:fb893609b7f0283c55d7e1",
          measurementId: "G-B1FVSFY4S2"
        };

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const auth = getAuth(app);

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
            setLoading(false);
          } else {
            signInAnonymously(auth).catch((err) => {
               setErrorMsg("Auth Error: " + err.message);
               setLoading(false);
            });
          }
        });
        return () => unsubscribe();
      } catch (err: any) {
        setErrorMsg(err.message || "Init Error");
        setLoading(false);
      }
    };
    initApp();
  }, []);

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Activity className="w-10 h-10 text-blue-600 animate-pulse" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-red-50 p-10">
        <div className="max-w-lg bg-white p-6 rounded shadow-xl border border-red-200">
          <h1 className="text-xl font-black text-red-600 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6" /> SYSTEM ERROR
          </h1>
          <pre className="bg-slate-900 text-red-400 p-4 rounded text-xs">{errorMsg}</pre>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans">
        {/* On remet ta Navbar ici */}
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/loadflow" replace />} />
            <Route path="/loadflow" element={<Loadflow user={user} />} />
            <Route path="/protection" element={<Protection />} />
            <Route path="/config" element={<Config user={user} />} />
            <Route path="/files" element={<Files user={user} />} />
            <Route path="*" element={<Navigate to="/loadflow" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
