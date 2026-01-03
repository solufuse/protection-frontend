
// [structure:root] : Files Page Controller
// [context:flow] : Orchestrates Sidebar, File Table and Toolbar using the useFileManager hook.

import { useEffect, useState } from 'react';
import { Icons } from '../icons';
import Toast from '../components/Toast';
import GlobalRoleBadge from '../components/GlobalRoleBadge';
import ContextRoleBadge from '../components/ContextRoleBadge';
import MembersModal from '../components/MembersModal';
import ProjectsSidebar, { Project, UserSummary } from '../components/ProjectsSidebar';
import FileToolbar from '../components/FileToolbar';
import FileTable from '../components/FileTable';
import { useFileManager } from '../hooks/useFileManager'; 
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

export default function Files({ user }: { user: any }) {
  // --- STATE ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSessionUid, setActiveSessionUid] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<UserSummary[]>([]);
  
  // Sidebar State
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  
  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [userGlobalData, setUserGlobalData] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' as 'success' | 'error' });
  
  // Bulk Selection State
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // --- CONFIG ---
  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";
  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });
  const getToken = async () => { if (!user) return null; return await user.getIdToken(); };

  // --- HOOKS ---
  const { 
    files, loading, uploading, sortConfig, 
    handleSort, handleUpload, handleDelete, handleBulkDelete, refreshFiles,
    starredFiles, toggleStar 
  } = useFileManager(user, activeProjectId, activeSessionUid, API_URL, notify);

  // --- EFFECTS ---
  useEffect(() => {
    if (user) {
        fetchGlobalProfile();
        fetchProjects();
    }
  }, [user]);

  // Clear selection when context changes
  useEffect(() => { setSelectedFiles(new Set()); }, [activeProjectId, activeSessionUid]);

  // --- HELPERS ---
  const handleGoogleLogin = async () => { await signInWithPopup(auth, new GoogleAuthProvider()); };
  const handleCopyToken = async () => { const t = await getToken(); if (!t) return notify("No Token", "error"); navigator.clipboard.writeText(t); notify("Token Copied"); };
  const formatBytes = (bytes: number) => { if (bytes === 0) return '0 B'; const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; };

  const fetchGlobalProfile = async () => { try { const t = await getToken(); const res = await fetch(`${API_URL}/users/me`, { headers: { 'Authorization': `Bearer ${t}` } }); if (res.ok) { const data = await res.json(); setUserGlobalData(data); if (['super_admin', 'admin', 'moderator'].includes(data.global_role)) fetchAllUsers(t); } } catch (e) {} };
  const fetchAllUsers = async (token: string) => { try { const res = await fetch(`${API_URL}/admin/users?limit=100`, { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setUsersList(await res.json()); } catch (e) { console.error("Admin List Error", e); } };
  const fetchProjects = async () => { try { const t = await getToken(); const res = await fetch(`${API_URL}/projects/`, { headers: { 'Authorization': `Bearer ${t}` } }); if (res.ok) setProjects(await res.json()); } catch (e) { console.error("Failed to load projects", e); } };

  // Project Management
  const createProject = async () => { if (user?.isAnonymous) return notify("Guest users cannot create projects.", "error"); if (!newProjectName.trim()) return; try { const t = await getToken(); const res = await fetch(`${API_URL}/projects/create`, { method: 'POST', headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: newProjectName, name: newProjectName }) }); if (!res.ok) { const err = await res.json(); throw new Error(err.detail); } notify("Project Created"); setNewProjectName(""); setIsCreatingProject(false); fetchProjects(); } catch (e: any) { notify(e.message || "Failed", "error"); } };
  const deleteProject = async (projId: string, e: React.MouseEvent) => { e.stopPropagation(); if (!confirm(`Delete project "${projId}" permanently?`)) return; try { const t = await getToken(); const res = await fetch(`${API_URL}/projects/${projId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` } }); if (!res.ok) throw new Error(); notify("Project Deleted"); if (activeProjectId === projId) setActiveProjectId(null); fetchProjects(); } catch (e) { notify("Delete failed", "error"); } };

  // --- ACTIONS ---

  // [decision:logic] : Blob Download Method
  // Fetching the file as a blob and creating a local object URL bypasses most popup blockers
  // because the browser sees it as a "save" action initiated by the user, not a "navigation".
  const downloadAsBlob = async (url: string, filename: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename; // This forces the browser to save
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error("Download failed", error);
        notify(`Failed to download ${filename}`, "error");
      }
  };

  const handleOpenLink = async (type: string, filename: string) => { 
      try { 
          const t = await getToken(); 
          let pParam = ""; 
          if (activeProjectId) pParam = `&project_id=${activeProjectId}`; 
          else if (activeSessionUid) pParam = `&project_id=${activeSessionUid}`; 
          const encName = encodeURIComponent(filename); 
          let url = ""; 
          
          if (type === 'raw') url = `${API_URL}/files/download?filename=${encName}&token=${t}${pParam}`; 
          else if (type === 'xlsx') url = `${API_URL}/ingestion/download/xlsx?filename=${encName}&token=${t}${pParam}`; 
          else if (type === 'json') url = `${API_URL}/ingestion/download/json?filename=${encName}&token=${t}${pParam}`; 
          else if (type === 'json_tab') url = `${API_URL}/ingestion/preview?filename=${encName}&token=${t}${pParam}`; 
          
          if (url) {
              if (type === 'json_tab') {
                  // Previews must open in a new tab
                  window.open(url, '_blank');
              } else {
                  // Downloads use the blob method
                  await downloadAsBlob(url, filename);
              }
          }
      } catch (e) { notify("Link Error", "error"); } 
  };

  const handleBulkDownload = async (type: 'raw' | 'xlsx' | 'json') => {
      const filesToDownload = filteredFiles.filter(f => selectedFiles.has(f.path));
      notify(`Preparing ${filesToDownload.length} downloads...`);
      
      for (const file of filesToDownload) {
          if (type !== 'raw' && !/\.(si2s|lf1s|mdb|json)$/i.test(file.filename)) continue;
          
          // [decision:logic] : Sequential processing ensures browser doesn't choke on memory
          // We assume handleOpenLink -> downloadAsBlob handles the fetch/save
          await handleOpenLink(type === 'json' ? 'json' : type, file.filename);
          
          // Small delay is still good practice for UI responsiveness
          await new Promise(r => setTimeout(r, 500));
      }
      setSelectedFiles(new Set());
  };

  const toggleSelect = (path: string) => {
      const newSet = new Set(selectedFiles);
      if (newSet.has(path)) newSet.delete(path);
      else newSet.add(path);
      setSelectedFiles(newSet);
  };
  const selectAll = (checked: boolean) => {
      if (checked) setSelectedFiles(new Set(filteredFiles.map(f => f.path)));
      else setSelectedFiles(new Set());
  };

  const filteredFiles = files.filter(f => f.filename.toLowerCase().includes(searchTerm.toLowerCase()));
  
  let currentProjectRole = undefined;
  if (activeProjectId) currentProjectRole = projects.find(p => p.id === activeProjectId)?.role;
  else if (activeSessionUid) currentProjectRole = 'admin';
  const getActiveProjectName = () => { if (!activeProjectId) return null; const proj = projects.find(p => p.id === activeProjectId); return proj ? proj.name : activeProjectId; };

  return (
    <div className="w-full px-6 py-6 text-[11px] font-sans h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">Workspace {userGlobalData && <GlobalRoleBadge role={userGlobalData.global_role} />}</label>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
                {activeProjectId ? <><Icons.Folder className="w-5 h-5 text-blue-600" /><span>{getActiveProjectName()}</span></> : activeSessionUid ? <><Icons.Shield className="w-5 h-5 text-red-500" /><span className="text-red-600">Session: {usersList.find(u => u.uid === activeSessionUid)?.username || activeSessionUid.slice(0,6)}</span></> : <><Icons.HardDrive className="w-5 h-5 text-slate-600 dark:text-slate-400" /><span>My Session</span><span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">PRIVATE</span></>}
            </h1>
            <ContextRoleBadge role={currentProjectRole} isSession={activeProjectId === null && activeSessionUid === null} />
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

      <div className="flex flex-1 gap-6 min-h-0">
        <ProjectsSidebar user={user} userGlobalData={userGlobalData} projects={projects} usersList={usersList} activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} activeSessionUid={activeSessionUid} setActiveSessionUid={setActiveSessionUid} isCreatingProject={isCreatingProject} setIsCreatingProject={setIsCreatingProject} newProjectName={newProjectName} setNewProjectName={setNewProjectName} onCreateProject={createProject} onDeleteProject={deleteProject} />

        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm overflow-hidden font-bold relative transition-all" onDragOver={(e) => { e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files); }}>
            
            <FileToolbar 
                searchTerm={searchTerm} setSearchTerm={setSearchTerm} fileCount={filteredFiles.length} 
                activeProjectId={activeProjectId || activeSessionUid} onShowMembers={() => setShowMembers(true)} 
                uploading={uploading} onUpload={handleUpload}
                selectedCount={selectedFiles.size} onBulkDownload={handleBulkDownload} onBulkDelete={() => handleBulkDelete(Array.from(selectedFiles)).then(() => setSelectedFiles(new Set()))}
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
