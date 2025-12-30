
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
      `}</style>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            <div className="flex items-center gap-2">
              <Link to="/loadflow" className="flex items-center gap-3">
                  {/* ON REMPLACE L'ICONE PAR TON IMAGE */}
                  <img 
                    src="/favicon.ico" 
                    alt="Logo" 
                    className="w-9 h-9 object-contain"
                  />
                  <span className="font-black text-xl tracking-tighter text-slate-800 uppercase">SOLUFUSE</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <Link to="/loadflow" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/loadflow')}`}>Loadflow</Link>
              <Link to="/protection" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/protection')}`}>Protection</Link>
              <Link to="/files" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/files')}`}>Files</Link>
              <Link to="/config" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive('/config')}`}>Config</Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-full border border-slate-200 pr-4">
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
                
                <div className="flex flex-col">
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
