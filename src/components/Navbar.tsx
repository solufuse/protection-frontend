
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Icons } from '../icons';

interface NavbarProps { user: any; onLogout: () => void; }

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const auth = getAuth();

  const isActive = (path: string) => location.pathname.startsWith(path) ? "bg-orange-100 text-orange-700 shadow-sm ring-1 ring-orange-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
        <Link to="/loadflow" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg"><Icons.Shield className="w-5 h-5 text-white" /></div>
          <span className="font-black text-xl text-slate-800">SOLUFUSE</span>
        </Link>
        <nav className="hidden md:flex gap-1">
          <Link to="/loadflow" className={`px-4 py-2 rounded-lg text-sm font-bold ${isActive('/loadflow')}`}>Loadflow</Link>
          <Link to="/protection" className={`px-4 py-2 rounded-lg text-sm font-bold ${isActive('/protection')}`}>Protection</Link>
          <Link to="/files" className={`px-4 py-2 rounded-lg text-sm font-bold ${isActive('/files')}`}>Files</Link>
          <Link to="/config" className={`px-4 py-2 rounded-lg text-sm font-bold ${isActive('/config')}`}>Config</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-3 bg-slate-50 p-1.5 pr-4 rounded-full border border-slate-200">
              <div className="w-8 h-8 bg-orange-500 rounded-full text-white flex items-center justify-center text-xs font-bold">{user.isAnonymous ? 'G' : 'U'}</div>
              <button onClick={onLogout} className="text-slate-400 hover:text-red-500"><Icons.LogOut className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
