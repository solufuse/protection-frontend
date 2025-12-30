
import { Link, useLocation } from 'react-router-dom';
import { Icons } from '../icons';

interface NavbarProps { 
  user: any; 
  onLogout: () => void; 
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const location = useLocation();

  // [decision:logic] -> Only keeping logic actually used in the render
  const isActive = (path: string) => 
    location.pathname.startsWith(path) 
      ? "bg-orange-100 text-orange-700 shadow-sm ring-1 ring-orange-200" 
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <div className="flex items-center gap-2">
            <Link to="/loadflow" className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                    <Icons.Shield className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-xl tracking-tighter text-slate-800 uppercase">SOLUFUSE</span>
            </Link>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/loadflow" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/loadflow')}`}>Loadflow</Link>
            <Link to="/protection" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/protection')}`}>Protection</Link>
            <Link to="/files" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/files')}`}>Files</Link>
            <Link to="/config" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/config')}`}>Config</Link>
          </nav>

          {/* USER SECTION */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-slate-50 p-1.5 pr-4 rounded-full border border-slate-200">
              <div className="w-8 h-8 bg-orange-500 rounded-full text-white flex items-center justify-center text-xs font-bold">
                {user?.isAnonymous ? 'G' : (user?.displayName?.[0] || 'U')}
              </div>
              <span className="text-xs font-bold text-slate-700 hidden sm:block">
                {user?.isAnonymous ? 'Guest' : (user?.displayName || 'User')}
              </span>
              <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors ml-1">
                <Icons.LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
