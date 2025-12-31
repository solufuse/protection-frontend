import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { Icons } from '../icons';

export default function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center max-w-sm w-full">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <Icons.User className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-xl font-black text-slate-800 mb-2">Welcome Back</h1>
        <p className="text-slate-500 text-sm mb-6">Sign in to access your protection studies.</p>
        
        <button 
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Icons.Key className="w-4 h-4" /> Sign in with Google
        </button>
      </div>
    </div>
  );
}
