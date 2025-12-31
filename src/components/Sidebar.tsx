import { NavLink } from 'react-router-dom';
import { Icons } from '../icons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

// [FIX] Added 'user' to the interface to satisfy App.tsx
interface SidebarProps {
  user: any;
}

export default function Sidebar({ user }: SidebarProps) {
  
  const handleLogout = () => signOut(auth);

  const links = [
    { to: "/files", icon: Icons.HardDrive, label: "Files" },
    { to: "/ingestion", icon: Icons.UploadCloud, label: "Ingestion" },
    { to: "/loadflow", icon: Icons.Activity, label: "Loadflow" },
    { to: "/protection", icon: Icons.Shield, label: "Protection" },
    { to: "/config", icon: Icons.Settings, label: "Config" },
    { to: "/extraction", icon: Icons.FileDown, label: "Extraction" },
  ];

  return (
    <aside className="w-16 bg-slate-900 flex flex-col items-center py-4 border-r border-slate-800 z-50">
      <div className="mb-6">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-black text-white text-xs">SF</div>
      </div>

      <nav className="flex-1 flex flex-col gap-2 w-full px-2">
        {links.map(link => (
          <NavLink 
            key={link.to} 
            to={link.to}
            className={({ isActive }) => `flex flex-col items-center justify-center p-2 rounded-lg transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            <link.icon className="w-5 h-5" />
            <span className="text-[9px] font-bold mt-1 opacity-80">{link.label.substring(0, 3)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-4 items-center">
        {user && (
            <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} 
                className="w-8 h-8 rounded-full border-2 border-slate-700" 
                title={user.email} 
                alt="User"
            />
        )}
        <button onClick={handleLogout} className="text-slate-600 hover:text-red-500 transition-colors">
            <Icons.LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
