
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
    ? "bg-slate-900 text-white shadow-md dark:bg-blue-600" 
    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100";

  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); setShowMenu(false); } catch (e) { console.error("Login failed", e); }
  };

  const navLinks = [
    { to: "/files", icon: Icons.Folder, label: "FILES" },
    { to: "/forum", icon: Icons.MessageSquare, label: "FORUM" },
    { to: "/loadflow", icon: Icons.Activity, label: "LOADFLOW" },
    { to: "/protection", icon: Icons.Shield, label: "PROTECTION" },
    { to: "/config", icon: Icons.Settings, label: "CONFIG" },
  ];

  return (
    <>
      <style>{`
        .brand-container:hover .brand-logo { transform: scale(1.1) rotate(-5deg); filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.3)); }
        .brand-container:hover .brand-text { letter-spacing: 0.05em; color: #f97316; }
      `}</style>

      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 shadow-sm transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            
            {/* LEFT */}
            <div className="flex items-center gap-4 lg:gap-6">
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                {showMobileMenu ? <Icons.X className="w-5 h-5" /> : <Icons.Menu className="w-5 h-5" />}
              </button>

              <Link to="/loadflow" className="brand-container flex items-center gap-2 transition-all duration-300">
                  {/* [FIX] Reduced Size: w-6 h-6 (mobile) / w-7 h-7 (desktop) */}
                  <img src="/logo.svg" alt="Solufuse Logo" className="brand-logo w-6 h-6 lg:w-7 lg:h-7 object-contain transition-all duration-300 ease-out"/>
                  {/* [FIX] Reduced Text Size: text-base (mobile) / text-lg (desktop) */}
                  <span className="brand-text font-black text-base lg:text-lg tracking-tighter text-slate-800 dark:text-white uppercase transition-all duration-300 ease-out hidden sm:block">SOLUFUSE</span>
              </Link>

              <div className="hidden lg:flex items-center gap-1">
                {navLinks.map(link => (
                    <Link key={link.to} to={link.to} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${isActive(link.to)}`}>
                        <link.icon className="w-3.5 h-3.5" /> {link.label}
                    </Link>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2">
              <div className="hidden xl:flex items-center gap-1 mr-2">
                <a href="https://api.solufuse.com/docs" target="_blank" rel="noopener noreferrer" className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"><Icons.FileText className="w-3 h-3" /> API</a>
                <a href="https://solufuse.com" target="_blank" rel="noopener noreferrer" className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-orange-600 dark:text-slate-500 dark:hover:text-orange-400 flex items-center gap-1 transition-colors"><Icons.Search className="w-3 h-3" /> ABOUT</a>
              </div>

              {toggleTheme && (
                  <button onClick={toggleTheme} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-yellow-500 dark:hover:bg-slate-800 dark:hover:text-yellow-400 transition-all" title="Toggle Theme">
                      {isDarkMode ? <Icons.Sun className="w-4 h-4" /> : <Icons.Moon className="w-4 h-4" />}
                  </button>
              )}

              <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 hidden xl:block"></div>

              <div className="relative" ref={menuRef}>
                <button onClick={() => setShowMenu(!showMenu)} className={`flex items-center gap-2 pl-1.5 pr-1.5 lg:pl-2.5 lg:py-1 rounded-full border transition-all ${user.isAnonymous ? 'bg-slate-50 border-slate-200 hover:border-blue-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-500' : 'bg-blue-50 border-blue-200 hover:border-blue-300 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:border-blue-600'}`}>
                  <div className="text-right hidden md:block">
                    <div className="text-[9px] font-black text-slate-700 dark:text-slate-200 leading-tight">{user.isAnonymous ? "GUEST" : user.displayName?.split(' ')[0] || "PRO"}</div>
                  </div>
                  {user.photoURL ? <img src={user.photoURL} alt="Profile" className="w-6 h-6 rounded-full border border-white dark:border-slate-600 shadow-sm" referrerPolicy="no-referrer" /> : <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm ${user.isAnonymous ? 'bg-slate-400' : 'bg-blue-600'}`}><Icons.User className="w-3 h-3" /></div>}
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-10 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="p-3 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Session ID</p>
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">{user.uid}</p>
                    </div>
                    <div className="p-1 border-b border-slate-100 dark:border-slate-700">
                        <Link to="/profile" onClick={() => setShowMenu(false)} className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                            <Icons.User className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                            <span className="text-[10px] font-bold">My Profile</span>
                        </Link>
                    </div>
                    <div className="p-1 flex flex-col gap-0.5">
                      {user.isAnonymous ? (
                        <button onClick={handleGoogleLogin} className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-700 transition-colors">
                           <Icons.LogIn className="w-3.5 h-3.5 text-slate-400" />
                           <span className="text-[10px] font-bold">Sign In</span>
                        </button>
                      ) : (
                        <div className="px-2 py-1 text-center"><span className="text-[9px] text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center justify-center gap-1"><Icons.Check className="w-2.5 h-2.5"/> Connected</span></div>
                      )}
                    </div>
                    <div className="p-1 border-t border-slate-100 dark:border-slate-700">
                      <button onClick={() => { onLogout(); setShowMenu(false); }} className="w-full flex items-center justify-center gap-1 text-[9px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-1.5 rounded transition-colors"><Icons.LogOut className="w-3 h-3" />{user.isAnonymous ? "EXIT" : "LOGOUT"}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {showMobileMenu && (
            <div ref={mobileMenuRef} className="lg:hidden absolute top-14 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl z-40 animate-in slide-in-from-top-2">
                <div className="p-3 flex flex-col gap-1">
                    {navLinks.map(link => <Link key={link.to} to={link.to} onClick={() => setShowMobileMenu(false)} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${isActive(link.to)}`}><link.icon className="w-3.5 h-3.5" /> {link.label}</Link>)}
                </div>
            </div>
        )}
      </nav>
    </>
  );
}
