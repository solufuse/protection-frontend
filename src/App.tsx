
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, User, signInWithPopup, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
import { Icons } from './icons';

import Navbar from './components/Navbar';
import Files from './pages/Files';
import Config from './pages/Config';
import Loadflow from './pages/Loadflow';
import Protection from './pages/Protection';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Icons.Activity className="animate-pulse text-orange-500" /></div>;

  if (!user) {
    return (
      <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Icons.Shield className="w-8 h-8" /></div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">SOLUFUSE</h1>
          <button onClick={() => signInWithPopup(getAuth(), new GoogleAuthProvider())} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm mb-3 hover:bg-slate-800 transition-all">Google Login</button>
          <button onClick={() => signInAnonymously(getAuth())} className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">Guest Access</button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar user={user} onLogout={() => signOut(getAuth())} />
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
