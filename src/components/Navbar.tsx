import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icons } from '../icons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface NavbarProps {
  user: any;
}

export default function Navbar({ user }: NavbarProps) {
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => signOut(auth);

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

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getLinkClass = (path: string) => `
    flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all
    ${isActive(path) 
      ? "bg-slate-900 text-white shadow-md" 
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}
  `;

  const links = [
    { to: "/files", icon: Icons.HardDrive, label: "FILES" },
    { to: "/ingestion", icon: Icons.UploadCloud, label: "INGESTION" },
    { to: "/loadflow", icon: Icons.Activity, label: "LOADFLOW" },
    { to: "/protection", icon: Icons.Shield, label: "PROTECTION" },
    { to: "/config", icon: Icons.Settings, label: "CONFIG" },
    { to: "/extraction", icon: Icons.FileDown, label: "EXTRACTION" },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 h-14 px-6 flex items-center justify-between shrink-0 z-50 relative">
      {/* LEFT: LOGO */}
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xs shadow-sm group-hover:bg-blue-700 transition-colors">
            SF
          </div>
          <span className="font-black text-slate-800 text-lg tracking-tight group-hover:text-blue-600 transition-colors">
            SOLUFUSE
          </span>
        </Link>

        {/* CENTER: NAVIGATION */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(link => (
            <Link key={link.to} to={link.to} className={getLinkClass(link.to)}>
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* RIGHT: USER PROFILE */}
      <div className="relative" ref={menuRef}>
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 p-1 pr-3 rounded-full border border-slate-200 hover:bg-slate-50 transition-all bg-white"
        >
          {user ? (
             <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} 
                className="w-7 h-7 rounded-full bg-slate-100 object-cover" 
                alt="Profile"
             />
          ) : (
             <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                <Icons.User className="w-4 h-4 text-slate-400" />
             </div>
          )}
          <span className="text-[10px] font-bold text-slate-600 max-w-[100px] truncate hidden sm:block">
            {user?.email || "Guest"}
          </span>
          <Icons.ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* DROPDOWN MENU */}
        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-2 animate-in fade-in slide-in-from-top-2">
            <div className="px-3 py-2 border-b border-slate-50 mb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Account</p>
              <p className="text-xs font-bold text-slate-800 truncate">{user?.email}</p>
            </div>
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Icons.LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
