import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Activity, FileText, Server, LogOut, Shield, Menu, X } from 'lucide-react';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const currentPath = location ? location.pathname : '/';

  const isActive = (path: string) => 
    currentPath.startsWith(path) ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-50";

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* LOGO */}
          <div className="flex items-center gap-2">
            <Link to="/loadflow" className="flex items-center gap-2" onClick={closeMenu}>
                <Zap className="w-8 h-8 text-blue-600 fill-blue-600" />
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">Solufuse</span>
            </Link>
          </div>

          {/* MENU DESKTOP */}
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
            <Link to="/config" className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${isActive('/config')}`}><Settings className="w-4 h-4" /> Config</Link>
      </nav>

          {/* USER INFO & LOGOUT (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-100 px-3 py-1.5 rounded-full">
              <div className="w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold text-sm">
                {user.displayName ? user.displayName[0] : 'U'}
              </div>
              <span className="text-sm font-medium text-slate-600 truncate max-w-[100px]">
                {user.displayName}
              </span>
            </div>
            <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2" title="Déconnexion">
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* BOUTON HAMBURGER (Mobile) */}
          <div className="flex items-center md:hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg focus:outline-none"
            >
                {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* --- MENU MOBILE (SIDEBAR) --- */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeMenu}
        ></div>
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
            <div className="h-16 flex items-center px-6 border-b border-slate-100 justify-between">
                <span className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Zap className="w-6 h-6 text-blue-600 fill-blue-600" /> Solufuse
                </span>
                <button onClick={closeMenu} className="text-slate-400">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                <Link to="/loadflow" onClick={closeMenu} className={`flex items-center px-4 py-3 rounded-lg font-medium ${isActive('/loadflow')}`}>
                    <Activity className="w-5 h-5 mr-3" /> Loadflow
                </Link>
                <Link to="/protection" onClick={closeMenu} className={`flex items-center px-4 py-3 rounded-lg font-medium ${isActive('/protection')}`}>
                    <Shield className="w-5 h-5 mr-3" /> Protection
                </Link>
                <Link to="/files" onClick={closeMenu} className={`flex items-center px-4 py-3 rounded-lg font-medium ${isActive('/files')}`}>
                    <FileText className="w-5 h-5 mr-3" /> Files
                </Link>
                <a href="https://api.solufuse.com/docs" target="_blank" rel="noopener noreferrer" 
                   className="flex items-center px-4 py-3 rounded-lg font-medium text-slate-600 hover:bg-slate-50">
                    <Server className="w-5 h-5 mr-3" /> API Docs
                </a>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold">
                        {user.displayName ? user.displayName[0] : 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate">{user.displayName}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                </div>
                <button 
                    onClick={() => { closeMenu(); onLogout(); }}
                    className="w-full flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-red-600 rounded-lg hover:bg-red-50 font-medium"
                >
                    <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                </button>
            </div>
        </div>
      </div>
    </header>
  );
}
