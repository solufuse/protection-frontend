
import { AuthProvider, useAuth } from './context/AuthContext';
import Files from './pages/Files';
import CookieConsent from './components/CookieConsent';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase'; // [FIX] Import direct

const LoginScreen = () => {
    const handleLogin = async () => {
        // Utilisation de l'instance 'auth' importée
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

const AppContent = () => {
    const { user } = useAuth();
    if (!user) return <LoginScreen />;
    return (
        <>
            <Files user={user} />
            <CookieConsent />
        </>
    );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
