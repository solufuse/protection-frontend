
import { useEffect, useState, useRef, Fragment } from 'react';
import { Icons } from '../icons';
import Toast from '../components/Toast';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

// --- TYPES ---
interface SessionFile {
  path: string;
  filename: string;
  size: number;
  uploaded_at?: string;
  content_type: string;
}

interface Project {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'moderator' | 'editor' | 'viewer' | 'staff_override';
}

interface Member {
    uid: string;
    email: string | null;
    role: string;
    global_role: string;
}

type SortKey = 'filename' | 'uploaded_at' | 'size';
type SortOrder = 'asc' | 'desc';

// --- COMPONENTS ---

// 1. Secret Badge for Global Roles (Visible in Header and Member List)
const GlobalRoleBadge = ({ role }: { role: string }) => {
    if (!role || role === 'user' || role === 'guest') return null; // Hidden for standard users
    
    let color = "bg-gray-100 text-gray-500";
    let icon = <Icons.User className="w-3 h-3" />;
    let label = role;

    if (['super_admin', 'admin'].includes(role)) {
        color = "bg-red-50 text-red-600 border-red-100";
        icon = <Icons.Shield className="w-3 h-3" />;
        label = "ADMIN";
    } else if (role === 'moderator') {
        color = "bg-blue-50 text-blue-600 border-blue-100";
        icon = <Icons.CheckCircle className="w-3 h-3" />;
        label = "MOD";
    } else if (role === 'nitro') {
        color = "bg-purple-50 text-purple-600 border-purple-100";
        icon = <Icons.Zap className="w-3 h-3" />;
        label = "NITRO";
    }

    return (
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${color}`} title={`Global Rank: ${role}`}>
            {icon}
            <span>{label}</span>
        </div>
    );
};

// 2. Team Management Modal
const MembersModal = ({ projectId, currentUserUID, onClose, apiUrl, getToken, notify }: any) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [inviteInput, setInviteInput] = useState("");
    const [loading, setLoading] = useState(false);

    const loadMembers = async () => {
        setLoading(true);
        try {
            const t = await getToken();
            const res = await fetch(`${apiUrl}/projects/${projectId}/members`, { headers: { 'Authorization': `Bearer ${t}` } });
            if (res.ok) setMembers(await res.json());
        } catch (e) { notify("Failed to load members", "error"); } 
        finally { setLoading(false); }
    };

    const handleInvite = async () => {
        if (!inviteInput) return;
        try {
            const t = await getToken();
            const isEmail = inviteInput.includes("@");
            const body = isEmail ? { email: inviteInput, role: "viewer" } : { user_id: inviteInput, role: "viewer" };
            
            const res = await fetch(`${apiUrl}/projects/${projectId}/members`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            if (!res.ok) throw new Error();
            notify("Member invited!");
            setInviteInput("");
            loadMembers();
        } catch (e) { notify("Invite failed (User not found?)", "error"); }
    };

    const handleKick = async (uid: string) => {
        if (!confirm("Kick this user?")) return;
        try {
            const t = await getToken();
            const res = await fetch(`${apiUrl}/projects/${projectId}/members/${uid}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${t}` }
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Error");
            }
            notify("User kicked");
            loadMembers();
        } catch (e: any) { notify(e.message || "Kick failed", "error"); }
    };

    useEffect(() => { loadMembers(); }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-96 overflow-hidden flex flex-col max-h-[500px]">
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Icons.Users className="w-4 h-4 text-blue-500" /> Project Members
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded text-slate-500"><Icons.X className="w-4 h-4"/></button>
                </div>
                
                <div className="p-3 border-b border-slate-100 flex gap-2">
                    <input 
                        className="flex-1 text-[10px] p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-500"
                        placeholder="Invite by Email or UID..."
                        value={inviteInput}
                        onChange={(e) => setInviteInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                    />
                    <button onClick={handleInvite} className="bg-blue-600 text-white px-3 rounded font-bold text-[10px] hover:bg-blue-700">INVITE</button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loading ? <div className="text-center p-4 text-slate-400 text-xs">Loading...</div> : members.map(m => (
                        <div key={m.uid} className="flex justify-between items-center p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-100 group">
                            <div className="flex items-center gap-2 overflow-hidden">
                                {/* Role Icon */}
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${m.role === 'owner' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {m.role === 'owner' ? '👑' : '👤'}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-bold text-slate-700 truncate">{m.email || "Guest User"}</span>
                                    <div className="flex gap-1 items-center">
                                        <span className={`text-[8px] uppercase px-1 rounded ${m.role === 'owner' ? 'bg-yellow-50 text-yellow-600' : 'bg-slate-100 text-slate-400'}`}>{m.role}</span>
                                        {/* Global Badge in Member List */}
                                        {['admin', 'moderator', 'nitro'].includes(m.global_role) && (
                                            <span className="text-[8px] text-purple-500 font-bold bg-purple-50 px-1 rounded">{m.global_role.toUpperCase()}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Kick Button: Only if not self and (I am Owner/Mod) */}
                            {m.uid !== currentUserUID && m.role !== 'owner' && (
                                <button onClick={() => handleKick(m.uid)} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Kick Member">
                                    <Icons.UserMinus className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

export default function Files({ user }: { user: any }) {
  // --- STATE ---
  const [files, setFiles] = useState<SessionFile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  
  // Data States
  const [newProjectName, setNewProjectName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [userGlobalData, setUserGlobalData] = useState<any>(null); // To store current user's global role
  
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'uploaded_at', order: 'desc' });
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' as 'success' | 'error' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";

  // --- HELPERS ---
  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const getToken = async () => { if (!user) return null; return await user.getIdToken(true); };
  const handleGoogleLogin = async () => { const auth = getAuth(); await signInWithPopup(auth, new GoogleAuthProvider()); };
  const handleCopyToken = async () => { const t = await getToken(); if (!t) return notify("No Token", "error"); navigator.clipboard.writeText(t); notify("Token Copied"); };

  // --- API ---
  const fetchGlobalProfile = async () => {
     try {
         const t = await getToken();
         const res = await fetch(`${API_URL}/admin/me`, { headers: { 'Authorization': `Bearer ${t}` } });
         if (res.ok) setUserGlobalData(await res.json());
     } catch (e) {}
  };

  const fetchProjects = async () => {
    try {
      const t = await getToken();
      const res = await fetch(`${API_URL}/projects/`, { headers: { 'Authorization': `Bearer ${t}` } });
      if (res.ok) setProjects(await res.json());
    } catch (e) { console.error("Failed to load projects", e); }
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const t = await getToken();
      let url = `${API_URL}/files/details`;
      if (activeProjectId) url += `?project_id=${activeProjectId}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${t}` } });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setFiles(data.files || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (user) {
      fetchGlobalProfile();
      fetchProjects();
      fetchFiles();
    }
  }, [user, activeProjectId]);

  // --- HANDLERS ---
  const createProject = async () => {
    if (user?.isAnonymous) return notify("Guest users cannot create projects.", "error");
    if (!newProjectName.trim()) return;
    try {
      const t = await getToken();
      const res = await fetch(`${API_URL}/projects/create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newProjectName, name: newProjectName })
      });
      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail); // Show Backend error (e.g. "Upgrade to Nitro")
      }
      notify("Project Created");
      setNewProjectName("");
      setIsCreatingProject(false);
      fetchProjects();
    } catch (e: any) { notify(e.message || "Failed", "error"); }
  };

  const deleteProject = async (projId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete project "${projId}" permanently?`)) return;
    try {
      const t = await getToken();
      const res = await fetch(`${API_URL}/projects/${projId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` } });
      if (!res.ok) throw new Error();
      notify("Project Deleted");
      if (activeProjectId === projId) setActiveProjectId(null);
      fetchProjects();
    } catch (e) { notify("Delete failed", "error"); }
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || !user) return;
    
    // Guest Zip Restriction (UX Only)
    if (user.isAnonymous) {
        for (let i = 0; i < fileList.length; i++) {
            if (fileList[i].name.toLowerCase().match(/\.(zip|rar|7z)$/)) return notify("Guests cannot upload archives. Create account.", "error");
        }
    }

    setUploading(true);
    const formData = new FormData();
    const optimisticFiles: SessionFile[] = [];
    Array.from(fileList).forEach(f => {
        formData.append('files', f);
        optimisticFiles.push({ filename: f.name, path: f.name, size: f.size, content_type: f.type, uploaded_at: new Date().toISOString() });
    });

    try {
      const t = await getToken();
      let url = `${API_URL}/files/upload`;
      if (activeProjectId) url += `?project_id=${activeProjectId}`;
      const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${t}` }, body: formData });
      if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Upload Failed" }));
          throw new Error(err.detail);
      }
      notify(`${fileList.length} Uploaded`);
      setFiles(prev => [...optimisticFiles, ...prev]);
      setTimeout(() => fetchFiles(), 500); 
    } catch (e: any) { notify(e.message || "Upload Failed", "error"); } 
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDelete = async (path: string) => {
    if (!confirm("Delete file?")) return;
    try {
      const t = await getToken();
      let url = `${API_URL}/files/file/${path}`;
      if (activeProjectId) url += `?project_id=${activeProjectId}`;
      await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` } });
      setFiles(p => p.filter(f => f.path !== path));
      notify("Deleted");
    } catch (e) { notify("Error", "error"); }
  };

  const handleClear = async () => {
    if (!confirm("Clear all files?")) return;
    try {
      const t = await getToken();
      let url = `${API_URL}/files/clear`;
      if (activeProjectId) url += `?project_id=${activeProjectId}`;
      const res = await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` } });
      if(!res.ok) throw new Error((await res.json()).detail);
      setFiles([]);
      setExpandedFileId(null);
      notify("Cleared");
    } catch (e: any) { notify(e.message || "Error", "error"); }
  };

  const togglePreview = async (filename: string) => {
    if (expandedFileId === filename) { setExpandedFileId(null); return; }
    setExpandedFileId(filename);
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const t = await getToken();
      const pParam = activeProjectId ? `&project_id=${activeProjectId}` : "";
      const res = await fetch(`${API_URL}/ingestion/preview?filename=${encodeURIComponent(filename)}&token=${t}${pParam}`);
      if (!res.ok) throw new Error("Preview unavailable");
      setPreviewData(await res.json());
    } catch (e) { setExpandedFileId(null); notify("Preview Error", "error"); } 
    finally { setPreviewLoading(false); }
  };

  const handleOpenLink = async (type: string, filename: string) => {
      try {
          const t = await getToken();
          const pParam = activeProjectId ? `&project_id=${activeProjectId}` : "";
          let url = "";
          const encName = encodeURIComponent(filename);
          if (type === 'raw') url = `${API_URL}/files/download?filename=${encName}&token=${t}${pParam}`;
          else if (type === 'xlsx') url = `${API_URL}/ingestion/download/xlsx?filename=${encName}&token=${t}${pParam}`;
          else if (type === 'json') url = `${API_URL}/ingestion/download/json?filename=${encName}&token=${t}${pParam}`;
          else if (type === 'json_tab') url = `${API_URL}/ingestion/preview?filename=${encName}&token=${t}${pParam}`;
          if (url) window.open(url, '_blank');
      } catch (e) { notify("Link Error", "error"); }
  };

  const handleSort = (key: SortKey) => { setSortConfig(current => ({ key, order: current.key === key && current.order === 'asc' ? 'desc' : 'asc' })); };
  const filteredFiles = files.filter(f => f.filename.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => {
      let aVal: any = a[sortConfig.key]; let bVal: any = b[sortConfig.key];
      if (sortConfig.key === 'size') { aVal = a.size; bVal = b.size; }
      else if (sortConfig.key === 'uploaded_at') { aVal = new Date(a.uploaded_at || 0).getTime(); bVal = new Date(b.uploaded_at || 0).getTime(); }
      else { aVal = aVal?.toString().toLowerCase() || ""; bVal = bVal?.toString().toLowerCase() || ""; }
      if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 text-[11px] font-sans h-screen flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
            Workspace
            {userGlobalData && <GlobalRoleBadge role={userGlobalData.global_role} />}
          </label>
          <h1 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
            {activeProjectId ? (
                <>
                    <Icons.Folder className="w-5 h-5 text-blue-600" />
                    <span>{activeProjectId}</span>
                    <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200">PROJECT</span>
                </>
            ) : (
                <>
                    <Icons.HardDrive className="w-5 h-5 text-slate-600" />
                    <span>My Session</span>
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">RAM</span>
                </>
            )}
          </h1>
        </div>
        <div className="flex gap-2">
          {userGlobalData && userGlobalData.global_role === 'super_admin' && (
              <button onClick={() => window.open(`${API_URL}/docs`, '_blank')} className="flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded border border-red-200 text-red-600 font-bold transition-colors">
                <Icons.Shield className="w-3.5 h-3.5" /> API
              </button>
          )}
          <button onClick={handleCopyToken} className="flex items-center gap-1 bg-white hover:bg-yellow-50 px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:text-yellow-600 font-bold transition-colors">
            <Icons.Key className="w-3.5 h-3.5" /> TOKEN
          </button>
          <button onClick={() => fetchFiles()} className="flex items-center gap-1 bg-white hover:bg-slate-50 px-3 py-1.5 rounded border border-slate-300 text-slate-600 font-bold transition-colors">
            <Icons.Refresh className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> REFRESH
          </button>
        </div>
      </div>

      {user?.isAnonymous && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0"><Icons.Alert className="w-4 h-4" /></div>
                <div><h3 className="font-bold text-blue-900 text-xs">Guest Mode (Demo)</h3><p className="text-blue-700 text-[10px] mt-0.5">Limits: Max 10 files. Projects disabled.</p></div>
            </div>
            <button onClick={handleGoogleLogin} className="whitespace-nowrap px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2">GO UNLIMITED <Icons.ArrowRight className="w-3 h-3" /></button>
        </div>
      )}

      <div className="flex flex-1 gap-6 min-h-0">
        {/* SIDEBAR PROJECTS */}
        <div className="w-60 flex flex-col gap-4">
            <div onClick={() => setActiveProjectId(null)} className={`flex items-center gap-3 p-3 rounded cursor-pointer border transition-all ${activeProjectId === null ? 'bg-slate-800 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                <Icons.HardDrive className="w-4 h-4" />
                <div className="flex flex-col"><span className="font-bold uppercase tracking-wide">My Session</span><span className="text-[9px] text-slate-400">Private Storage</span></div>
            </div>
            <div className="border-t border-slate-200 my-1"></div>
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shared Projects</span>
                <button disabled={user?.isAnonymous} onClick={() => setIsCreatingProject(!isCreatingProject)} className={`p-1 rounded transition-colors ${user?.isAnonymous ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-blue-50 text-blue-600'}`}><Icons.Plus className="w-3.5 h-3.5" /></button>
            </div>
            {isCreatingProject && (
                <div className="flex gap-1">
                    <input className="w-full text-[10px] p-1.5 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Project ID..." value={newProjectName} onChange={(e) => setNewProjectName(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && createProject()} autoFocus />
                    <button onClick={createProject} className="bg-blue-600 text-white px-2 rounded font-bold text-[9px]">OK</button>
                </div>
            )}
            <div className="flex-1 overflow-y-auto flex flex-col gap-1 custom-scrollbar pr-1">
                {projects.map(p => (
                    <div key={p.id} onClick={() => setActiveProjectId(p.id)} className={`group flex justify-between items-center p-2 rounded cursor-pointer border transition-all ${activeProjectId === p.id ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:border-slate-200'}`}>
                        <div className="flex items-center gap-2 overflow-hidden">
                            {/* OWNER CROWN OR MEMBER USER */}
                            {p.role === 'owner' ? <span title="Owner">👑</span> : <Icons.User className={`w-3.5 h-3.5 ${activeProjectId === p.id ? 'text-blue-200' : 'text-slate-300'}`} />}
                            <span className="font-bold truncate">{p.id}</span>
                        </div>
                        {/* DELETE BUTTON */}
                        {p.role !== 'moderator' && (
                            <button onClick={(e) => deleteProject(p.id, e)} className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${activeProjectId === p.id ? 'hover:bg-blue-700 text-white' : 'hover:bg-red-100 text-red-400'}`}>
                                <Icons.Trash className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded shadow-sm overflow-hidden font-bold relative transition-all"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} 
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }} 
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files); }}
        >
            {isDragging && <div className="absolute inset-0 z-50 bg-blue-50/90 border-2 border-dashed border-blue-500 rounded flex flex-col items-center justify-center pointer-events-none"><Icons.UploadCloud className="w-12 h-12 text-blue-600 mb-2" /><span className="text-lg font-black text-blue-700 uppercase tracking-widest">Drop files to upload</span></div>}
            
            <div className="flex justify-between items-center p-2 bg-slate-50 border-b border-slate-100 gap-4">
              <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 max-w-xs">
                    <Icons.Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                    <input type="text" placeholder="Search files..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:border-blue-400 text-slate-600" />
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold">{filteredFiles.length} FILES</span>
                  
                  {/* MEMBERS BUTTON (Only if in a Project) */}
                  {activeProjectId && (
                      <button onClick={() => setShowMembers(true)} className="flex items-center gap-1 ml-2 bg-white hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-500 hover:text-blue-600 font-bold transition-colors">
                          <Icons.Users className="w-3.5 h-3.5" /> TEAM
                      </button>
                  )}
              </div>
              <div className="flex gap-2">
                 <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => handleUpload(e.target.files)} />
                 <button onClick={handleClear} className="flex items-center gap-1 bg-white hover:bg-red-50 px-2 py-1 rounded border border-slate-200 text-slate-500 hover:text-red-500 font-bold transition-colors"><Icons.Trash className="w-3 h-3" /> CLEAR</button>
                 <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1 text-[9px] font-bold bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors shadow-sm">{uploading ? <Icons.Refresh className="w-3 h-3 animate-spin"/> : <Icons.UploadCloud className="w-3 h-3"/>} {uploading ? "UPLOADING..." : "UPLOAD"}</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left font-bold border-collapse">
                <thead className="text-[9px] text-slate-400 uppercase tracking-widest bg-slate-50/50 sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-3 border-b border-slate-100 font-bold w-8"></th>
                    <th className="py-2 px-3 border-b border-slate-100 font-bold cursor-pointer hover:text-blue-600 group" onClick={() => handleSort('filename')}>
                        <div className="flex items-center gap-1">FILENAME {sortConfig.key === 'filename' && <Icons.ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
                    </th>
                    <th className="py-2 px-3 border-b border-slate-100 font-bold w-32 cursor-pointer hover:text-blue-600" onClick={() => handleSort('uploaded_at')}>
                         <div className="flex items-center gap-1">DATE {sortConfig.key === 'uploaded_at' && <Icons.ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
                    </th>
                    <th className="py-2 px-3 border-b border-slate-100 w-24 font-bold text-center cursor-pointer hover:text-blue-600" onClick={() => handleSort('size')}>
                         <div className="flex items-center justify-center gap-1">SIZE {sortConfig.key === 'size' && <Icons.ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
                    </th>
                    <th className="py-2 px-3 border-b border-slate-100 text-right w-64 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredFiles.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-slate-300 italic"><Icons.Archive className="w-10 h-10 mx-auto mb-3 opacity-50" /><span className="block opacity-70">{searchTerm ? "No matches found" : "No files in this context"}</span></td></tr>
                  ) : (
                    filteredFiles.map((file, i) => {
                       const isConvertible = /\.(si2s|lf1s|mdb|json)$/i.test(file.filename);
                       const isExpanded = expandedFileId === file.filename;
                       return (
                        <Fragment key={i}>
                            <tr className={`group transition-colors ${isExpanded ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                            <td className="px-3 py-1 text-center">{isConvertible && (<button onClick={() => togglePreview(file.filename)} className="text-slate-400 hover:text-blue-600">{isExpanded ? <Icons.ChevronDown className="w-3.5 h-3.5"/> : <Icons.ChevronRight className="w-3.5 h-3.5"/>}</button>)}</td>
                            <td className="px-3 py-1"><div className="flex items-center gap-2"><Icons.FileText className={`w-3.5 h-3.5 ${isConvertible ? 'text-blue-500' : 'text-slate-400'}`} /><span className="truncate max-w-[280px] text-slate-700 text-[10px]" title={file.filename}>{file.filename}</span></div></td>
                            <td className="px-3 py-1 text-slate-400 font-mono text-[9px]"><div className="flex items-center gap-1"><Icons.Calendar className="w-3 h-3 text-slate-300"/> {file.uploaded_at || "-"}</div></td>
                            <td className="px-3 py-1 text-slate-400 font-mono text-[9px] text-center">{formatBytes(file.size)}</td>
                            <td className="px-3 py-1 text-right">
                                <div className="flex justify-end gap-1.5 items-center">
                                    <button onClick={() => handleOpenLink('raw', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 transition-colors" title="Download Raw"><Icons.FileDown className="w-3 h-3"/> <span className="text-[9px]">RAW</span></button>
                                    {isConvertible && (
                                    <>
                                    <button onClick={() => handleOpenLink('xlsx', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 hover:bg-green-100 text-green-700 rounded border border-green-200 transition-colors" title="Download XLSX"><Icons.FileSpreadsheet className="w-3 h-3"/> <span className="text-[9px]">XLSX</span></button>
                                    <button onClick={() => handleOpenLink('json', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded border border-yellow-200 transition-colors" title="Download JSON"><Icons.FileJson className="w-3 h-3"/> <span className="text-[9px]">JSON</span></button>
                                    <button onClick={() => handleOpenLink('json_tab', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 transition-colors" title="Open in new Tab"><Icons.ExternalLink className="w-3 h-3"/> <span className="text-[9px]">OPEN</span></button>
                                    <div className="w-px h-3 bg-slate-300 mx-1"></div>
                                    <button onClick={() => togglePreview(file.filename)} className={`p-1 rounded transition-colors ${isExpanded ? 'text-blue-600 bg-blue-100' : 'hover:bg-blue-100 text-blue-600'}`} title="Inline Preview">{isExpanded ? <Icons.Hide className="w-3.5 h-3.5"/> : <Icons.Show className="w-3.5 h-3.5"/>}</button>
                                    </>
                                    )}
                                    <button onClick={() => handleDelete(file.path)} className="p-1 hover:bg-red-100 text-red-500 rounded transition-colors ml-1"><Icons.Trash className="w-3.5 h-3.5"/></button>
                                </div>
                            </td>
                            </tr>
                            {isExpanded && previewData && (<tr><td colSpan={5} className="bg-slate-900 p-0"><div className="max-h-60 overflow-auto custom-scrollbar p-4 text-[10px] font-mono text-green-400">{previewLoading ? (<div className="flex items-center gap-2 text-slate-400 animate-pulse"><Icons.Refresh className="w-3 h-3 animate-spin"/> Loading...</div>) : (<pre>{JSON.stringify(previewData.tables || previewData, null, 2)}</pre>)}</div></td></tr>)}
                        </Fragment>
                       );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>
      
      {/* MEMBERS MODAL */}
      {showMembers && activeProjectId && (
          <MembersModal 
             projectId={activeProjectId} 
             currentUserUID={user.uid}
             onClose={() => setShowMembers(false)}
             apiUrl={API_URL}
             getToken={getToken}
             notify={notify}
          />
      )}

      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
