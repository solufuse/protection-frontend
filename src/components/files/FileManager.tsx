import { useEffect, useState, useCallback, useRef, MouseEvent } from 'react';
import { Icons } from '../../icons';
import Toast from '../Toast';
import GlobalRoleBadge from '../GlobalRoleBadge';
import ContextRoleBadge from '../ContextRoleBadge';
import MembersModal from '../MembersModal';
import ProjectsSidebar, { Project, UserSummary } from '../ProjectsSidebar';
import FileToolbar from './FileToolbar';
import FileTable from './FileTable';
import { useFileManager } from '../../hooks/useFileManager'; 
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase';

export default function FileManager({ user }: { user: any }) {
  // --- STATE ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSessionUid, setActiveSessionUid] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<UserSummary[]>([]);
  
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [userGlobalData, setUserGlobalData] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' as 'success' | 'error' });
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Resize State
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);

  // --- CONFIG ---
  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";
  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });
  const getToken = async () => { if (!user) return null; return await user.getIdToken(); };

  // --- HOOKS ---
  const { 
    files, loading, uploading, sortConfig, 
    handleSort, handleUpload, handleDelete, handleBulkDelete, handleBulkDownload, refreshFiles,
    starredFiles, toggleStar 
  } = useFileManager(user, activeProjectId, activeSessionUid, API_URL, notify);

  // --- EFFECTS ---
  useEffect(() => {
    if (user) {
        fetchGlobalProfile();
        fetchProjects();
    }
  }, [user]);

  useEffect(() => { setSelectedFiles(new Set()); }, [activeProjectId, activeSessionUid]);

  // --- RESIZE HANDLERS ---
  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX - 24; // 24px padding-left of container
        if (newWidth > 150 && newWidth < 600) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize as any);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize as any);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize as any);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // --- HELPERS ---
  const handleGoogleLogin = async () => { await signInWithPopup(auth, new GoogleAuthProvider()); };
  const handleCopyToken = async () => { const t = await getToken(); if (!t) return notify("No Token", "error"); navigator.clipboard.writeText(t); notify("Token Copied"); };
  const handleCopyProjectName = () => { if (!activeProjectId) return; navigator.clipboard.writeText(activeProjectId); notify("Project ID Copied to Clipboard"); };
  const formatBytes = (bytes: number) => { if (bytes === 0) return '0 B'; const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; };

  const fetchGlobalProfile = async () => { try { const t = await getToken(); const res = await fetch(`${API_URL}/users/me`, { headers: { 'Authorization': `Bearer ${t}` } }); if (res.ok) { const data = await res.json(); setUserGlobalData(data); if (['super_admin', 'admin', 'moderator'].includes(data.global_role)) fetchAllUsers(t); } } catch (e) {} };
  const fetchAllUsers = async (token: string) => { try { const res = await fetch(`${API_URL}/admin/users?limit=100`, { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setUsersList(await res.json()); } catch (e) { console.error("Admin List Error", e); } };
  const fetchProjects = async () => { try { const t = await getToken(); const res = await fetch(`${API_URL}/projects/`, { headers: { 'Authorization': `Bearer ${t}` } }); if (res.ok) setProjects(await res.json()); } catch (e) { console.error("Failed to load projects", e); } };

  const createProject = async () => { if (user?.isAnonymous) return notify("Guest users cannot create projects.", "error"); if (!newProjectName.trim()) return; try { const t = await getToken(); const res = await fetch(`${API_URL}/projects/create`, { method: 'POST', headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: newProjectName, name: newProjectName }) }); if (!res.ok) { const err = await res.json(); throw new Error(err.detail); } notify("Project Created"); setNewProjectName(""); setIsCreatingProject(false); fetchProjects(); } catch (e: any) { notify(e.message || "Failed", "error"); } };
  const deleteProject = async (projId: string, e: React.MouseEvent) => { e.stopPropagation(); if (!confirm(`Delete project "${projId}" permanently?`)) return; try { const t = await getToken(); const res = await fetch(`${API_URL}/projects/${projId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` } }); if (!res.ok) throw new Error(); notify("Project Deleted"); if (activeProjectId === projId) setActiveProjectId(null); fetchProjects(); } catch (e) { notify("Delete failed", "error"); } };

  // --- ACTIONS ---
  const fetchAndOpen = async (url: string, filename: string, mode: 'download' | 'open') => {
      try {
          const t = await getToken();
          notify(mode === 'open' ? "Opening..." : "Downloading...");
          const res = await fetch(url, { headers: { 'Authorization': `Bearer ${t}` } });
          if (!res.ok) throw new Error("Request failed");
          const blob = await res.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          if (mode === 'open') { window.open(blobUrl, '_blank'); } else { const link = document.createElement('a'); link.href = blobUrl; link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); }
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
      } catch (e) { console.error(e); notify("Action failed", "error"); }
  };

  const handleOpenLink = async (type: string, filename: string) => { 
      try { 
          let pParam = ""; 
          if (activeProjectId) pParam = `&project_id=${activeProjectId}`; 
          else if (activeSessionUid) pParam = `&project_id=${activeSessionUid}`; 
          const encName = encodeURIComponent(filename); 
          let url = ""; 
          let mode: 'download' | 'open' = 'download';
          let downloadName = filename;

          if (type === 'raw') { url = `${API_URL}/files/download?filename=${encName}${pParam}`; } 
          else if (type === 'xlsx') { url = `${API_URL}/ingestion/download/xlsx?filename=${encName}${pParam}`; downloadName = filename.replace(/\.[^/.]+$/, "") + ".xlsx"; } 
          else if (type === 'json') { url = `${API_URL}/ingestion/download/json?filename=${encName}${pParam}`; downloadName = filename.replace(/\.[^/.]+$/, "") + ".json"; } 
          else if (type === 'json_tab') { url = `${API_URL}/ingestion/preview?filename=${encName}${pParam}`; mode = 'open'; }
          if (url) await fetchAndOpen(url, downloadName, mode);
      } catch (e) { notify("Link Error", "error"); } 
  };

  const onBulkDownloadTrigger = async (type: 'raw' | 'xlsx' | 'json') => {
      if (type === 'raw') { await handleBulkDownload(selectedFiles, type); setSelectedFiles(new Set()); } 
      else {
         const filesToDownload = filteredFiles.filter(f => selectedFiles.has(f.path));
         notify(`Processing ${filesToDownload.length} conversions...`);
         for (const file of filesToDownload) {
             if (!/\.(si2s|lf1s|mdb)$/i.test(file.filename)) continue;
             await handleOpenLink(type === 'json' ? 'json' : type, file.filename);
             await new Promise(r => setTimeout(r, 750));
         }
         setSelectedFiles(new Set());
      }
  };

  const toggleSelect = (path: string) => { const newSet = new Set(selectedFiles); if (newSet.has(path)) newSet.delete(path); else newSet.add(path); setSelectedFiles(newSet); };
  const selectAll = (checked: boolean) => { if (checked) setSelectedFiles(new Set(filteredFiles.map(f => f.path))); else setSelectedFiles(new Set()); };

  const filteredFiles = files.filter(f => f.filename.toLowerCase().includes(searchTerm.toLowerCase()));
  
  let currentProjectRole = undefined;
  if (activeProjectId) currentProjectRole = projects.find(p => p.id === activeProjectId)?.role;
  else if (activeSessionUid) currentProjectRole = 'admin';
  const getActiveProjectName = () => { if (!activeProjectId) return null; const proj = projects.find(p => p.id === activeProjectId); return proj ? proj.name : activeProjectId; };

  return (
    <div className="w-full px-6 py-6 text-[11px] font-sans h-full flex flex-col select-none">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">Workspace</label>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
                {activeProjectId ? <><Icons.Folder className="w-5 h-5 text-blue-600" /><span>{getActiveProjectName()}</span><button onClick={handleCopyProjectName} className="opacity-20 hover:opacity-100 transition-opacity"><Icons.Copy className="w-4 h-4" /></button></> : activeSessionUid ? <><Icons.Shield className="w-5 h-5 text-red-500" /><span className="text-red-600">Session: {usersList.find(u => u.uid === activeSessionUid)?.username || activeSessionUid.slice(0,6)}</span></> : <><Icons.HardDrive className="w-5 h-5 text-slate-600 dark:text-slate-400" /><span>My Session</span><span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">PRIVATE</span></>}
            </h1>
            <ContextRoleBadge role={currentProjectRole} isSession={activeProjectId === null && activeSessionUid === null} />
            {userGlobalData && userGlobalData.global_role && (
                <div className="ml-2 scale-110"><GlobalRoleBadge role={userGlobalData.global_role} /></div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {userGlobalData && userGlobalData.global_role === 'super_admin' && <button onClick={() => window.open(`${API_URL}/docs`, '_blank')} className="flex items-center gap-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-300 px-3 py-1.5 rounded border border-red-200 dark:border-red-900 text-red-600 font-bold transition-colors"><Icons.Shield className="w-3.5 h-3.5" /> API</button>}
          <button onClick={handleCopyToken} className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-yellow-600 font-bold transition-colors"><Icons.Key className="w-3.5 h-3.5" /> TOKEN</button>
          <button onClick={() => refreshFiles()} className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold transition-colors"><Icons.Refresh className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> REFRESH</button>
        </div>
      </div>

      {user?.isAnonymous && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-xl p-3 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm flex-shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center shrink-0"><Icons.Alert className="w-4 h-4" /></div>
                <div><h3 className="font-bold text-blue-900 dark:text-blue-300 text-xs">Guest Mode (Demo)</h3><p className="text-blue-700 dark:text-blue-400 text-[10px] mt-0.5">Limits: Max 10 files. Projects disabled.</p></div>
            </div>
            <button onClick={handleGoogleLogin} className="whitespace-nowrap px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2">GO UNLIMITED <Icons.ArrowRight className="w-3 h-3" /></button>
        </div>
      )}

      <div className="flex flex-1 gap-0 min-h-0">
         {/* Resizable Sidebar Container */}
        <div style={{ width: sidebarWidth }} className="relative flex-shrink-0 pr-2">
            <ProjectsSidebar 
                user={user} userGlobalData={userGlobalData} projects={projects} usersList={usersList} 
                activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} 
                activeSessionUid={activeSessionUid} setActiveSessionUid={setActiveSessionUid} 
                isCreatingProject={isCreatingProject} setIsCreatingProject={setIsCreatingProject} 
                newProjectName={newProjectName} setNewProjectName={setNewProjectName} 
                onCreateProject={createProject} onDeleteProject={deleteProject} 
                className="w-full"
            />
            {/* Handle */}
            <div
                onMouseDown={startResizing}
                className={`absolute top-0 right-0 w-1 h-full cursor-col-resize z-10 flex justify-center items-center hover:bg-blue-500/10 transition-colors group ${isResizing ? 'bg-blue-500/10' : ''}`}
            >
                <div className={`w-[1px] h-full bg-slate-200 dark:bg-slate-800 group-hover:bg-blue-400 ${isResizing ? 'bg-blue-500' : ''}`} />
            </div>
        </div>

        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm overflow-hidden font-bold relative transition-all" onDragOver={(e) => { e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files as any); }}>
            
            <FileToolbar 
                searchTerm={searchTerm} setSearchTerm={setSearchTerm} fileCount={filteredFiles.length} 
                activeProjectId={activeProjectId || activeSessionUid} onShowMembers={() => setShowMembers(true)} 
                uploading={uploading} onUpload={handleUpload}
                selectedCount={selectedFiles.size} onBulkDownload={onBulkDownloadTrigger} onBulkDelete={() => handleBulkDelete(Array.from(selectedFiles)).then(() => setSelectedFiles(new Set()))}
            />
            
            <FileTable 
                files={filteredFiles} sortConfig={sortConfig} onSort={handleSort} 
                searchTerm={searchTerm} 
                onOpenLink={handleOpenLink} onDelete={handleDelete} formatBytes={formatBytes}
                selectedFiles={selectedFiles} onToggleSelect={toggleSelect} onSelectAll={selectAll}
                starredFiles={starredFiles} onToggleStar={toggleStar}
            />
        </div>
      </div>
      
      {showMembers && activeProjectId && <MembersModal projectId={activeProjectId} currentUserUID={user.uid} onClose={() => setShowMembers(false)} apiUrl={API_URL} getToken={getToken} notify={notify} />}
      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
