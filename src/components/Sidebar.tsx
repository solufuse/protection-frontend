import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Zap, 
  Shield, 
  Database, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  userEmail: string;
}

export default function Sidebar({ onLogout, userEmail }: SidebarProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // État pour ouvrir/fermer sur mobile

  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { name: 'Loadflow', path: '/loadflow', icon: Zap },
    { name: 'Protection', path: '/protection', icon: Shield },
    { name: 'Files (RAM)', path: '/files', icon: Database },
    { name: 'API Docs', path: '/docs', icon: FileText },
  ];

  return (
    <>
      {/* --- 1. BARRE MOBILE (Visible uniquement sur petits écrans) --- */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2 font-bold text-slate-800">
            <Zap className="w-5 h-5 text-blue-600" />
            <span>Solufuse</span>
        </div>
        <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-2 text-slate-600 hover:bg-slate-100 rounded"
        >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* --- 2. SIDEBAR (Le menu principal) --- */}
      {/* Sur mobile : il glisse ou apparaît. Sur PC : il est toujours là. */}
      <div className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        md:translate-x-0 md:static md:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
            
            {/* Logo (Visible sur PC uniquement, car déjà en haut sur mobile) */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
                <Zap className="w-6 h-6 text-blue-400 mr-2" />
                <span className="text-xl font-bold tracking-wide">Solufuse</span>
            </div>

            {/* Liens de navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)} // Ferme le menu quand on clique (mobile)
                        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                            isActive(item.path)
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="font-medium">{item.name}</span>
                    </Link>
                ))}
            </nav>

            {/* Pied de page (Utilisateur + Logout) */}
            <div className="p-4 border-t border-slate-800 bg-slate-950">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                        {userEmail.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{userEmail}</p>
                        <p className="text-xs text-slate-500">Utilisateur</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                </button>
            </div>
        </div>
      </div>

      {/* --- 3. OVERLAY (Fond sombre quand menu ouvert sur mobile) --- */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-0 md:hidden"
            onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}
