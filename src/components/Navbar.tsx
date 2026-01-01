
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icons } from '../icons';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export default function Navbar({ user, onLogout, isDarkMode, toggleTheme }: NavbarProps) {
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) setShowMobileMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef, mobileMenuRef]);

  const isActive = (path: string) => location.pathname.startsWith(path) 
    ? "bg-slate-200 dark:bg-[#2d2d2d] text-slate-900 dark:text-white font-black" 
    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#9ca3af] dark:hover:bg-[#2d2d2d] dark:hover:text-white font-medium";

  // [FIX] This function was unused. Now used in the dropdown below.
  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); setShowMenu(false); } catch (e) { console.error("Login failed", e); }
  };

  const navLinks = [
    { to: "/files", icon: Icons.Folder, label: "Files" },
    { to: "/forum", icon: Icons.MessageSquare, label: "Forum" },
    { to: "/loadflow", icon: Icons.Activity, label: "Loadflow" },
    { to: "/protection", icon: Icons.Shield, label: "Protection" },
    { to: "/config", icon: Icons.Settings, label: "Config" },
  ];

  return (
    <>
      <style>{`
        .brand-container:hover .brand-text { color: #f97316; }
      `}</style>

      <nav className="bg-white dark:bg-[#1e1e1e] border-b border-slate-200 dark:border-[#333] sticky top-0 z-50 select-none">
        <div className="w-full px-4">
          <div className="flex justify-between h-12 items-center">
            
            {/* GAUCHE: Logo + Liens */}
            <div className="flex items-center gap-6">
              
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="lg:hidden p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2d2d2d] rounded-md">
                {showMobileMenu ? <Icons.X className="w-4 h-4" /> : <Icons.Menu className="w-4 h-4" />}
              </button>

              <Link to="/loadflow" className="brand-container flex items-center gap-2 group">
                  <img src="/logo.svg" alt="Solufuse" className="w-6 h-6 object-contain grayscale group-hover:grayscale-0 transition-all opacity-80 group-hover:opacity-100"/>
                  <span className="font-bold text-sm tracking-tight text-slate-700 dark:text-slate-200 group-hover:text-orange-500 transition-colors hidden sm:block">
                    Solufuse
                  </span>
              </Link>

              <div className="hidden lg:flex items-center gap-1">
                {navLinks.map(link => (
                    <Link key={link.to} to={link.to} className={`px-3 py-1.5 rounded-md text-[11px] transition-all flex items-center gap-2 ${isActive(link.to)}`}>
                        <link.icon className="w-3.5 h-3.5 opacity-80" /> {link.label}
                    </Link>
                ))}
              </div>
            </div>

            {/* DROITE: Tools + Profile */}
            <div className="flex items-center gap-3">
              <div className="hidden xl:flex items-center gap-1">
                <a href="https://api.solufuse.com/docs" target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded text-[10px] font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"><Icons.FileText className="w-3 h-3" /> API</a>
                <a href="https://solufuse.com" target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded text-[10px] font-bold text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-1 transition-colors"><Icons.Search className="w-3 h-3" /> About</a>
              </div>

              {toggleTheme && (
                  <button onClick={toggleTheme} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-yellow-500 dark:hover:bg-[#2d2d2d] dark:hover:text-yellow-400 transition-all" title="Switch Theme">
                      {isDarkMode ? <Icons.Sun className="w-4 h-4" /> : <Icons.Moon className="w-4 h-4" />}
                  </button>
              )}

              <div className="w-px h-4 bg-slate-200 dark:bg-[#333] hidden xl:block"></div>

              <div className="relative" ref={menuRef}>
                <button onClick={() => setShowMenu(!showMenu)} className={`flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full border transition-all ${user.isAnonymous ? 'bg-slate-100 border-transparent hover:bg-slate-200 dark:bg-[#2d2d2d] dark:text-slate-400' : 'bg-transparent border-slate-200 hover:border-slate-300 dark:border-[#333] dark:hover:border-[#555] dark:text-slate-200'}`}>
                  {user.photoURL ? (
                      <img src={user.photoURL} alt="User" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-400 flex items-center justify-center text-white text-[9px] font-bold">
                          {user.displayName ? user.displayName[0] : <Icons.User className="w-3 h-3" />}
                      </div>
                  )}
                  <span className="text-[10px] font-bold hidden md:block max-w-[80px] truncate">
                      {user.isAnonymous ? "Guest" : user.displayName}
                  </span>
                  <Icons.ChevronDown className="w-3 h-3 opacity-50" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-10 w-56 bg-white dark:bg-[#252526] rounded-xl shadow-xl border border-slate-100 dark:border-[#333] overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-50 origin-top-right">
                    <div className="p-3 border-b border-slate-50 dark:border-[#333]">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Session ID</p>
                      <p className="text-[10px] font-mono text-slate-600 dark:text-slate-300 truncate">{user.uid}</p>
                    </div>
                    <div className="p-1">
                        <Link to="/profile" onClick={() => setShowMenu(false)} className="flex items-center gap-2 w-full text-left px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#2d2d2d] text-slate-700 dark:text-slate-300 transition-colors">
                            <Icons.User className="w-3.5 h-3.5 opacity-70" />
                            <span className="text-[11px] font-bold">My Profile</span>
                        </Link>
                        
                        {/* [FIX] Restored Sign In button for Guests to use handleGoogleLogin */}
                        {user.isAnonymous && (
                            <button onClick={handleGoogleLogin} className="flex items-center gap-2 w-full text-left px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#2d2d2d] text-slate-700 dark:text-slate-300 transition-colors">
                                <Icons.LogIn className="w-3.5 h-3.5 opacity-70" />
                                <span className="text-[11px] font-bold">Sign In with Google</span>
                            </button>
                        )}
                    </div>
                    <div className="p-1 border-t border-slate-50 dark:border-[#333]">
                      <button onClick={() => { onLogout(); setShowMenu(false); }} className="w-full flex items-center gap-2 px-2 py-2 text-[11px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                        <Icons.LogOut className="w-3.5 h-3.5" />
                        {user.isAnonymous ? "Exit Guest Mode" : "Sign Out"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showMobileMenu && (
            <div ref={mobileMenuRef} className="lg:hidden absolute top-12 left-0 w-full bg-white dark:bg-[#1e1e1e] border-b border-slate-200 dark:border-[#333] shadow-lg z-40 animate-in slide-in-from-top-2">
                <div className="p-2 space-y-1">
                    {navLinks.map(link => (
                        <Link key={link.to} to={link.to} onClick={() => setShowMobileMenu(false)} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-3 ${isActive(link.to)}`}>
                            <link.icon className="w-4 h-4" /> {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        )}
      </nav>
    </>
  );
}
