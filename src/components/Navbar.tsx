
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icons } from '../icons';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const isActive = (path: string) => location.pathname.startsWith(path) 
    ? "bg-slate-900 text-white shadow-md" 
    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900";

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      setShowMenu(false);
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  return (
    <>
      <style>{`
        /* Animation Logo */
        .brand-container:hover .brand-logo {
          transform: scale(1.1) rotate(-5deg);
          filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.3));
        }
        .brand-container:hover .brand-text {
          letter-spacing: 0.05em;
          color: #f97316;
        }
      `}</style>

      {/* NAVBAR BACKGROUND */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90 shadow-sm">
        
        {/* CONTAINER CENTRÉ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* GAUCHE : LOGO + NAVIGATION */}
            <div className="flex items-center gap-8">
              <Link to="/loadflow" className="brand-container flex items-center gap-2 transition-all duration-300">
                  <img 
                    src="/logo.svg" 
                    alt="Solufuse Logo" 
                    className="brand-logo w-9 h-9 object-contain transition-all duration-300 ease-out"
                  />
                  <span className="brand-text font-black text-xl tracking-tighter text-slate-800 uppercase transition-all duration-300 ease-out hidden sm:block">
                    SOLUFUSE
                  </span>
              </Link>

              <div className="hidden lg:flex items-center gap-1">
                <Link to="/files" className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${isActive('/files')}`}>
                  <Icons.Folder className="w-3.5 h-3.5" /> FILES
                </Link>
                <Link to="/loadflow" className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${isActive('/loadflow')}`}>
                  <Icons.Activity className="w-3.5 h-3.5" /> LOADFLOW
                </Link>
                <Link to="/protection" className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${isActive('/protection')}`}>
                  <Icons.Shield className="w-3.5 h-3.5" /> PROTECTION
                </Link>
                <Link to="/config" className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${isActive('/config')}`}>
                  <Icons.Settings className="w-3.5 h-3.5" /> CONFIG
                </Link>
              </div>
            </div>

            {/* DROITE : LIENS + PROFIL */}
            <div className="flex items-center gap-3">
              
              <div className="hidden xl:flex items-center gap-1 mr-2">
                <a href="https://api.solufuse.com/docs" target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1.5 transition-colors">
                  <Icons.FileText className="w-3.5 h-3.5" /> API DOCS
                </a>
                <a href="https://solufuse.com" target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-orange-600 flex items-center gap-1.5 transition-colors">
                  <Icons.Search className="w-3.5 h-3.5" /> ABOUT
                </a>
              </div>

              <div className="w-px h-6 bg-slate-200 hidden xl:block"></div>

              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className={`flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full border transition-all ${user.isAnonymous ? 'bg-slate-50 border-slate-200 hover:border-blue-300' : 'bg-blue-50 border-blue-200 hover:border-blue-300'}`}
                >
                  <div className="text-right hidden md:block">
                    <div className="text-[10px] font-black text-slate-700 leading-tight">
                      {user.isAnonymous ? "GUEST USER" : user.displayName || "PRO MEMBER"}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 leading-tight">
                      {user.isAnonymous ? "Demo Mode" : "Google Account"}
                    </div>
                  </div>
                  
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-white shadow-sm" referrerPolicy="no-referrer" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm ${user.isAnonymous ? 'bg-slate-400' : 'bg-blue-600'}`}>
                        <Icons.User className="w-4 h-4" />
                    </div>
                  )}
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Session</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{user.uid}</p>
                    </div>

                    {/* NEW: LINK TO PROFILE */}
                    <div className="p-2 border-b border-slate-100">
                        <Link to="/profile" onClick={() => setShowMenu(false)} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-blue-600 transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600">
                                <Icons.User className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-[11px] font-bold">My Profile</div>
                                <div className="text-[9px] text-slate-400">Roles & Settings</div>
                            </div>
                        </Link>
                    </div>

                    <div className="p-2 flex flex-col gap-1">
                      {user.isAnonymous ? (
                        <button onClick={handleGoogleLogin} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors group">
                           <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-blue-200">
                               <Icons.User className="w-4 h-4" />
                           </div>
                           <div>
                               <div className="text-[11px] font-bold">Sign in with Google</div>
                               <div className="text-[9px] text-slate-400">Save your work</div>
                           </div>
                        </button>
                      ) : (
                        <div className="px-3 py-2 text-center">
                            <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full flex items-center justify-center gap-1">
                                <Icons.Check className="w-3 h-3"/> Account Connected
                            </span>
                        </div>
                      )}
                    </div>

                    <div className="p-2 border-t border-slate-100">
                      <button onClick={() => { onLogout(); setShowMenu(false); }} className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-red-500 hover:bg-red-50 py-2 rounded-lg transition-colors">
                        <Icons.LogOut className="w-3.5 h-3.5" />
                        {user.isAnonymous ? "EXIT GUEST MODE" : "LOG OUT"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
