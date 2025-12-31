
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { auth } from './firebase'; // Import direct pour le logout
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Icons } from './icons';

// Components
import Navbar from './components/Navbar';
import CookieConsent from './components/CookieConsent';

// Pages
import Files from './pages/Files';
import Loadflow from './pages/Loadflow';
import Protection from './pages/Protection';
import Config from './pages/Config';
import Profile from './pages/Profile';

// --- SCREENS ---

const LoadingScreen = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-4">
    <Icons.Loader className="w-10 h-10 animate-spin text-blue-600" />
    <span className="text-xs font-bold tracking-widest uppercase">Initializing Solufuse...</span>
  </div>
);

const LoginScreen = () => {
    const handleLogin = async () => {
        await signInWithPopup(auth, new GoogleAuthProvider());
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
            <div className="text-center">
                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Solufuse Protection</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Secure File Storage & Analysis</p>
            </div>
            
            <button onClick={handleLogin} className="flex items-center gap-3 bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                <span className="text-slate-600 font-bold text-xs group-hover:text-blue-600">CONTINUE WITH GOOGLE</span>
            </button>
            
            <div className="flex gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-8">
                <span>v2.6.0</span>
                <span>•</span>
                <span>Secure Access</span>
            </div>
            <CookieConsent />
        </div>
    );
};

// --- APP CONTENT (Protected) ---

const AppContent = () => {
  const { user, loading } = useAuth(); // AuthContext gère l'état

  // 1. Loading State
  if (loading) return <LoadingScreen />;

  // 2. Unauthenticated State
  if (!user) return <LoginScreen />;

  // 3. Authenticated State (The Real App)
  const handleLogout = () => auth.signOut();

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        {/* Navbar is back! */}
        <Navbar user={user} onLogout={handleLogout} />
        
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/files" replace />} />
            
            {/* Main Routes */}
            <Route path="/files" element={<Files user={user} />} />
            <Route path="/loadflow" element={<Loadflow user={user} />} />
            <Route path="/config" element={<Config user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            
            {/* Protection page (might not need user prop depending on implementation) */}
            <Route path="/protection" element={<Protection />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/files" replace />} />
          </Routes>
        </main>
        
        <CookieConsent />
      </div>
    </Router>
  );
};

// --- ROOT COMPONENT ---

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
