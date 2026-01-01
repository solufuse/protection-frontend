
import { useState, useEffect } from 'react';
import { Icons } from '../icons';
import Toast from '../components/Toast';
import GlobalRoleBadge from '../components/GlobalRoleBadge';

interface ProfileProps { user: any; }

export default function Profile({ user }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'roles' | 'security'>('general');
  const [userGlobalData, setUserGlobalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });

  // [+] Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '', first_name: '', last_name: '' });

  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";
  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });

  const fetchProfile = async () => {
      try {
          if (!user) return;
          const t = await user.getIdToken();
          const res = await fetch(`${API_URL}/users/me`, { headers: { 'Authorization': `Bearer ${t}` } });
          if (res.ok) {
              const data = await res.json();
              setUserGlobalData(data);
              setEditForm({
                  username: data.username || '',
                  bio: data.bio || '',
                  first_name: data.first_name || '',
                  last_name: data.last_name || ''
              });
          }
      } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, [user]);

  const handleSaveProfile = async () => {
      try {
          const t = await user.getIdToken();
          const res = await fetch(`${API_URL}/users/me`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(editForm)
          });
          if (res.ok) {
              const updated = await res.json();
              setUserGlobalData(updated);
              setIsEditing(false);
              notify("Profile Updated!");
          } else {
              const err = await res.json();
              notify(err.detail || "Update failed", "error");
          }
      } catch (e) { notify("Network error", "error"); }
  };

  const dbRole = userGlobalData?.global_role || (user.isAnonymous ? 'guest' : 'user');
  const displayName = userGlobalData?.username || user.displayName || "Anonymous User";
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-6 text-[11px] font-sans h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Account Management</label>
          <h1 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
            <Icons.User className="w-5 h-5 text-blue-600" />
            <span>My Profile</span>
          </h1>
        </div>
        <div className="flex gap-2"><GlobalRoleBadge role={dbRole} /></div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        <div className="w-60 flex flex-col gap-2 flex-shrink-0">
            {['general', 'roles', 'security'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex items-center gap-3 p-3 rounded text-left border transition-all ${activeTab === tab ? 'bg-slate-800 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                    {tab === 'general' && <Icons.User className="w-4 h-4" />}
                    {tab === 'roles' && <Icons.Shield className="w-4 h-4" />}
                    {tab === 'security' && <Icons.Key className="w-4 h-4" />}
                    <div className="flex flex-col"><span className="font-bold uppercase tracking-wide capitalize">{tab}</span></div>
                </button>
            ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {!loading && activeTab === 'general' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* Identity Card */}
                    <div className="bg-white border border-slate-200 rounded shadow-sm p-6 flex items-start gap-6 relative">
                        {/* [+] Edit Button */}
                        <button onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)} className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-colors ${isEditing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600'}`}>
                            {isEditing ? <><Icons.Check className="w-3 h-3" /> SAVE</> : <><Icons.Edit className="w-3 h-3" /> EDIT</>}
                        </button>
                        {isEditing && <button onClick={() => setIsEditing(false)} className="absolute top-4 right-20 mr-2 text-slate-400 hover:text-red-500 font-bold text-[10px]">CANCEL</button>}

                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg text-slate-300 overflow-hidden">
                            {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" alt="avatar" /> : <Icons.User className="w-10 h-10" />}
                        </div>
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="space-y-2 max-w-sm">
                                    <div><label className="text-[9px] font-bold text-slate-400">USERNAME</label><input className="w-full border border-slate-300 rounded p-1.5" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} placeholder="Unique username" /></div>
                                    <div className="flex gap-2">
                                        <div className="flex-1"><label className="text-[9px] font-bold text-slate-400">FIRST NAME</label><input className="w-full border border-slate-300 rounded p-1.5" value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} /></div>
                                        <div className="flex-1"><label className="text-[9px] font-bold text-slate-400">LAST NAME</label><input className="w-full border border-slate-300 rounded p-1.5" value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} /></div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-xl font-black text-slate-800 mb-1">{displayName}</h2>
                                    <p className="text-slate-500 font-mono text-[10px] mb-4">{user.email || "No email linked"}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div className="bg-white border border-slate-200 rounded shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs">About Me</h3>
                        {isEditing ? (
                            <textarea className="w-full border border-slate-300 rounded p-2 h-24 text-[11px]" value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} placeholder="Tell us about yourself..." />
                        ) : (
                            <p className="text-slate-500 italic">{userGlobalData?.bio || "No bio set yet."}</p>
                        )}
                    </div>
                </div>
            )}
            
            {!loading && activeTab !== 'general' && <div className="p-4 text-slate-400 italic">Settings not available in this view.</div>}
        </div>
      </div>
      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
