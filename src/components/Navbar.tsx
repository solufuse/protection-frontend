import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Activity, FileText, Server, LogOut, Shield, Menu, X } from 'lucide-react';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const currentPath = location ? location.pathname : '/';

  // [decision:style] -> Using Orange brand colors for active states
  const isActive = (path: string) => 
    currentPath.startsWith(path) 
      ? "bg-orange-100 text-orange-700 shadow-sm ring-1 ring-orange-200" 
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* LOGO BRANDING */}
          <div className="flex items-center gap-2">
            <Link to="/loadflow" className="flex items-center gap-3 group" onClick={closeMenu}>
                {/* NEW LOGO ASSET */}
                <img 
                    src="/logo.svg" 
                    alt="Solufuse" 
                    className="w-9 h-9 transition-transform group-hover:scale-110 duration-200" 
                />
                <span className="text-xl font-extrabold text-slate-900 tracking-tight group-hover:text-orange-600 transition-colors">
                    Solufuse
                </span>
            </Link>
          </div>

          {/* MENU DESKTOP */}
          <nav className="hidden md:flex space-x-2">
            <Link to="/loadflow" className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200 ${isActive('/loadflow')}`}>
              <Activity className="w-4 h-4" /> Loadflow
            </Link>
            <Link to="/protection" className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200 ${isActive('/protection')}`}>
              <Shield className="w-4 h-4" /> Protection
            </Link>
            <Link to="/files" className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200 ${isActive('/files')}`}>
              <FileText className="w-4 h-4" /> Files
            </Link>
            <a href="https://api.solufuse.com/docs" target="_blank" rel="noopener noreferrer" 
               className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors">
              <Server className="w-4 h-4" /> API Docs
            </a>
            <Link to="/config" className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200 ${isActive('/config')}`}>
                <Settings className="w-4 h-4" /> Config
            </Link>
      </nav>

          {/* USER INFO & LOGOUT (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full pr-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
              </div>
              <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                {user.displayName}
              </span>
            </div>
            <button 
                onClick={onLogout} 
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all duration-200" 
                title="Déconnexion"
            >
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
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden transition-opacity"
            onClick={closeMenu}
        ></div>
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
            <div className="h-16 flex items-center px-6 border-b border-slate-100 justify-between bg-slate-50/50">
                <span className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
                    Solufuse
                </span>
                <button onClick={closeMenu} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                <Link to="/loadflow" onClick={closeMenu} className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/loadflow')}`}>
                    <Activity className="w-5 h-5 mr-3" /> Loadflow
                </Link>
                <Link to="/protection" onClick={closeMenu} className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/protection')}`}>
                    <Shield className="w-5 h-5 mr-3" /> Protection
                </Link>
                <Link to="/files" onClick={closeMenu} className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/files')}`}>
                    <FileText className="w-5 h-5 mr-3" /> Files
                </Link>
                <a href="https://api.solufuse.com/docs" target="_blank" rel="noopener noreferrer" 
                   className="flex items-center px-4 py-3 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <Server className="w-5 h-5 mr-3" /> API Docs
                </a>
                <Link to="/config" onClick={closeMenu} className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/config')}`}>
                    <Settings className="w-5 h-5 mr-3" /> Config
                </Link>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3 mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 bg-orange-500 rounded-full text-white flex items-center justify-center font-bold shadow-md">
                        {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate">{user.displayName}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                </div>
                <button 
                    onClick={() => { closeMenu(); onLogout(); }}
                    className="w-full flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-200 font-medium transition-all shadow-sm"
                >
                    <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                </button>
            </div>
        </div>
      </div>
    </header>
  );
}
