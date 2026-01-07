import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icons } from '../icons';
import { Sun, Moon, LogOut, ChevronsLeft, ChevronsRight, Files, FolderKanban } from 'lucide-react';
import { User } from 'firebase/auth';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onToggleFileManager: () => void;
  isFileManagerOpen: boolean;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (isExpanded: boolean) => void;
}

export default function Sidebar({ 
  user, 
  onLogout, 
  isDarkMode, 
  toggleTheme, 
  onToggleFileManager, 
  isFileManagerOpen, 
  isSidebarExpanded, 
  setIsSidebarExpanded 
}: SidebarProps) {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const navLinks = [
    { to: "/", label: "Dashboard", icon: Icons.LayoutDashboard },
    { to: "/protection", label: "Protection", icon: Icons.Shield },
    { to: "/loadflow", label: "Loadflow", icon: Icons.GitBranch },
    { to: "/diagram", label: "Diagram", icon: FolderKanban },
    { to: "/forum", label: "Forum", icon: Icons.MessageSquare },
  ];

  return (
    <aside className={`flex flex-col bg-white dark:bg-[#1e1e1e] border-r border-slate-200 dark:border-[#333] transition-all duration-300 ${isSidebarExpanded ? 'w-60' : 'w-16'}`}>
      <div className="flex items-center justify-center h-16 border-b border-slate-200 dark:border-[#333]">
        <img src={isDarkMode ? "/logo-dark.png" : "/logo.png"} alt="Logo" className={`transition-all duration-300 ${isSidebarExpanded ? 'h-8' : 'h-7'}`} />
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        <button 
          onClick={onToggleFileManager} 
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${isFileManagerOpen ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
          <Files className="w-5 h-5" />
          {isSidebarExpanded && <span>Files</span>}
        </button>

        {navLinks.map(link => (
          <Link key={link.to} to={link.to} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${isActive(link.to) ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
            <link.icon className="w-5 h-5" />
            {isSidebarExpanded && <span>{link.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-200 dark:border-[#333]">
        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-full flex items-center gap-3">
            <img src={user.photoURL || '/user-placeholder.png'} alt="User" className="w-9 h-9 rounded-full" />
            {isSidebarExpanded && <span className="text-sm font-bold truncate">{user.displayName || 'Guest User'}</span>}
          </button>
          {showUserMenu && (
            <div ref={menuRef} className="absolute bottom-12 left-0 w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"> <Icons.User className="w-4 h-4" /> Profile</Link>
                <button onClick={toggleTheme} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button onClick={onLogout} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </div>
          )}
        </div>
        <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="absolute bottom-2 right-2 text-slate-400 hover:text-slate-600">
            {isSidebarExpanded ? <ChevronsLeft size={20}/> : <ChevronsRight size={20}/>}
        </button>
      </div>
    </aside>
  );
}
