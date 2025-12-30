
import { Link, useLocation } from 'react-router-dom';
import { Icons } from '../icons';

interface NavbarProps { 
  user: any; 
  onLogout: () => void; 
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const location = useLocation();

  const isActive = (path: string) => 
    location.pathname.startsWith(path) 
      ? "bg-orange-100 text-orange-700 shadow-sm ring-1 ring-orange-200" 
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

  return (
    <>
      <style>{`
        html { overflow-y: scroll; } 
        body { padding-right: 0 !important; }
        
        /* Animation réactive du Logo SVG */
        .brand-container:hover .brand-logo {
          transform: scale(1.1) rotate(-5deg);
          filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.3));
        }
        .brand-container:hover .brand-text {
          letter-spacing: 0.05em;
          color: #f97316;
        }
      `}</style>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* LOGO SVG & NOM */}
            <div className="flex items-center gap-2">
              <Link to="/loadflow" className="brand-container flex items-center gap-3 transition-all duration-300">
                  <img 
                    src="/logo.svg" 
                    alt="Solufuse Logo" 
                    className="brand-logo w-9 h-9 object-contain transition-all duration-300 ease-out"
                  />
                  <span className="brand-text font-black text-xl tracking-tighter text-slate-800 uppercase transition-all duration-300 ease-out">
                    SOLUFUSE
                  </span>
              </Link>
            </div>

            {/* NAVIGATION */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link to="/loadflow" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/loadflow')}`}>Loadflow</Link>
              <Link to="/protection" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/protection')}`}>Protection</Link>
              <Link to="/files" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/files')}`}>Files</Link>
              <Link to="/config" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/config')}`}>Config</Link>
              
              <div className="w-px h-4 bg-slate-200 mx-2"></div>

              <a href="https://api.solufuse.com/docs" target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1.5 transition-colors">
                <Icons.FileText className="w-3.5 h-3.5" /> API DOCS
              </a>
              <a href="https://solufuse.com" target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-orange-600 flex items-center gap-1.5 transition-colors">
                <Icons.Search className="w-3.5 h-3.5" /> ABOUT
              </a>
            </nav>

            {/* PROFIL */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-full border border-slate-200 pr-4 hover:border-orange-200 transition-all">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full border border-white shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 bg-orange-500 rounded-full text-white flex items-center justify-center text-xs font-bold">
                    {user?.isAnonymous ? 'G' : (user?.displayName?.[0] || 'U')}
                  </div>
                )}
                
                <div className="flex flex-col hidden sm:flex">
                  <span className="text-[10px] font-black text-slate-700 leading-none">
                    {user?.isAnonymous ? 'Guest Mode' : (user?.displayName || 'User')}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {user?.uid.substring(0,6)}
                  </span>
                </div>

                <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors ml-2">
                  <Icons.LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </header>
    </>
  );
}
