import { Link, useLocation } from 'react-router-dom';
import { Zap, Activity, FileText, Server, LogOut, Shield } from 'lucide-react';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const location = useLocation();
  // Vérification de sécurité si pathname est undefined
  const currentPath = location ? location.pathname : '/';

  const isActive = (path: string) => 
    currentPath.startsWith(path) ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-50";

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <Link to="/loadflow" className="flex items-center gap-2">
                <Zap className="w-8 h-8 text-blue-600 fill-blue-600" />
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">Solufuse</span>
            </Link>
          </div>
          <nav className="hidden md:flex space-x-2">
            <Link to="/loadflow" className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${isActive('/loadflow')}`}>
              <Activity className="w-4 h-4" /> Loadflow
            </Link>
            <Link to="/protection" className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${isActive('/protection')}`}>
              <Shield className="w-4 h-4" /> Protection
            </Link>
            <Link to="/files" className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${isActive('/files')}`}>
              <FileText className="w-4 h-4" /> Files
            </Link>
            <a href="https://api.solufuse.com/docs" target="_blank" rel="noopener noreferrer" 
               className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors">
              <Server className="w-4 h-4" /> API Docs
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-full">
              <div className="w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold text-sm">
                {user.displayName ? user.displayName[0] : 'U'}
              </div>
              <span className="text-sm font-medium text-slate-600 hidden sm:block truncate max-w-[100px]">
                {user.displayName}
              </span>
            </div>
            <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2" title="Déconnexion">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
