
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, getAuth } from 'firebase/auth';
import { Icons } from '../icons';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    // Cette fonction écoute le "Cookie" Firebase automatiquement
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // On arrête de charger une fois qu'on sait si tu es connecté ou non
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {loading ? (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-400 gap-2">
            <Icons.Loader className="w-6 h-6 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Loading Session...</span>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
