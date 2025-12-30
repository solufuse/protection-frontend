
import { useState } from 'react';
import { 
  User, Shield, Key, Settings, 
  CheckCircle, AlertTriangle, Crown
} from 'lucide-react';
import Toast from '../components/Toast';

interface ProfileProps {
  user: any;
}

export default function Profile({ user }: ProfileProps) {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'general' | 'roles' | 'security'>('general');
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });

  // --- MOCK ROLES (Simulation) ---
  // On force le type 'string' pour éviter que TypeScript ne verrouille sur "GUEST"|"ADMIN"|"USER"
  const userRole: string = user.isAnonymous ? "GUEST" : (user.email?.includes('admin') ? "ADMIN" : "USER");
  
  const permissions = [
    { name: "Access Loadflow", allowed: true },
    { name: "Create Projects", allowed: !user.isAnonymous },
    { name: "Delete Projects", allowed: userRole === "ADMIN" || !user.isAnonymous },
    { name: "Manage Users (Admin)", allowed: userRole === "ADMIN" },
    { name: "System Config (Mod)", allowed: userRole === "ADMIN" || userRole === "MODERATOR" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 text-[11px] font-sans h-screen flex flex-col">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Account Management</label>
          <h1 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>My Profile</span>
          </h1>
        </div>
        <div className="flex gap-2">
           <div className={`px-3 py-1.5 rounded-full font-bold text-[10px] flex items-center gap-2 border ${userRole === 'GUEST' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
              {userRole === 'ADMIN' && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
              {userRole === 'GUEST' && <User className="w-3.5 h-3.5" />}
              <span>ROLE: {userRole}</span>
           </div>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="w-60 flex flex-col gap-2 flex-shrink-0">
            <button 
                onClick={() => setActiveTab('general')}
                className={`flex items-center gap-3 p-3 rounded text-left border transition-all ${activeTab === 'general' ? 'bg-slate-800 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
                <User className="w-4 h-4" />
                <div className="flex flex-col">
                    <span className="font-bold uppercase tracking-wide">General</span>
                    <span className="text-[9px] opacity-70">Identity & Info</span>
                </div>
            </button>

            <button 
                onClick={() => setActiveTab('roles')}
                className={`flex items-center gap-3 p-3 rounded text-left border transition-all ${activeTab === 'roles' ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
                <Shield className="w-4 h-4" />
                <div className="flex flex-col">
                    <span className="font-bold uppercase tracking-wide">Roles & Permissions</span>
                    <span className="text-[9px] opacity-70">Admin / Mod / User</span>
                </div>
            </button>

            <button 
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-3 p-3 rounded text-left border transition-all ${activeTab === 'security' ? 'bg-slate-800 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
                <Key className="w-4 h-4" />
                <div className="flex flex-col">
                    <span className="font-bold uppercase tracking-wide">Security</span>
                    <span className="text-[9px] opacity-70">Password & API</span>
                </div>
            </button>
        </div>

        {/* RIGHT: CONTENT AREA */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            
            {/* --- TAB: GENERAL --- */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    {/* Identity Card */}
                    <div className="bg-white border border-slate-200 rounded shadow-sm p-6 flex items-start gap-6">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg text-slate-300">
                            {user.photoURL ? <img src={user.photoURL} className="w-full h-full rounded-full" alt="avatar" /> : <User className="w-10 h-10" />}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-black text-slate-800 mb-1">{user.displayName || "Guest User"}</h2>
                            <p className="text-slate-500 font-mono text-[10px] mb-4">{user.email || "No email linked (Anonymous Session)"}</p>
                            
                            <div className="grid grid-cols-2 gap-4 max-w-md">
                                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                    <span className="block text-[9px] font-bold text-slate-400 uppercase">User ID (UID)</span>
                                    <span className="font-mono text-xs text-blue-600 truncate block" title={user.uid}>{user.uid}</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Provider</span>
                                    <span className="font-bold text-slate-700">{user.isAnonymous ? "Temporary Session" : "Google Auth"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: ROLES --- */}
            {activeTab === 'roles' && (
                <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-blue-800 text-sm uppercase">System Role: {userRole}</h3>
                            <p className="text-blue-600 text-[10px]">Your permissions are determined by this role globally.</p>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-bold text-slate-500 uppercase text-[10px]">
                            Effective Permissions
                        </div>
                        <div className="divide-y divide-slate-100">
                            {permissions.map((perm, idx) => (
                                <div key={idx} className="flex justify-between items-center px-4 py-3 hover:bg-slate-50">
                                    <span className="font-bold text-slate-700">{perm.name}</span>
                                    {perm.allowed ? (
                                        <span className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full text-[9px] border border-green-100">
                                            <CheckCircle className="w-3 h-3" /> ALLOWED
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full text-[9px] border border-red-100">
                                            <AlertTriangle className="w-3 h-3" /> RESTRICTED
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {userRole === 'GUEST' && (
                        <div className="p-4 border-2 border-dashed border-orange-200 rounded bg-orange-50 text-center">
                            <p className="text-orange-800 font-bold mb-2">Want more power?</p>
                            <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-bold shadow-sm transition-all">
                                Upgrade Account
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- TAB: SECURITY --- */}
            {activeTab === 'security' && (
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded shadow-sm p-6 opacity-70">
                        <div className="flex items-center gap-2 mb-4 text-slate-400">
                            <Settings className="w-5 h-5" />
                            <h3 className="font-bold uppercase">Security Settings</h3>
                        </div>
                        <p className="text-slate-400 italic">Security settings are managed via your Google Account provider.</p>
                    </div>
                </div>
            )}

        </div>
      </div>

      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
