import { useEffect, useState } from 'react';
import { Icons } from '../icons';
import Toast from '../components/Toast';
import GlobalRoleBadge from '../components/GlobalRoleBadge';
import ContextRoleBadge from '../components/ContextRoleBadge';
import MembersModal from '../components/MembersModal';
import ProjectsSidebar, { Project } from '../components/ProjectsSidebar';
import FileToolbar from '../components/FileToolbar';
import FileTable, { SessionFile, SortKey, SortOrder } from '../components/FileTable';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

export default function Files({ user }: { user: any }) {
  const [files, setFiles] = useState<SessionFile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  
  const [newProjectName, setNewProjectName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [userGlobalData, setUserGlobalData] = useState<any>(null);
  
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'uploaded_at', order: 'desc' });
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' as 'success' | 'error' });
  
  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";

  const currentProjectRole = activeProjectId 
    ? projects.find(p => p.id === activeProjectId)?.role 
    : undefined;

  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getToken = async () => { if (!user) return null; return await user.getIdToken(); };
  const handleGoogleLogin = async () => { await signInWithPopup(auth, new GoogleAuthProvider()); };
  const handleCopyToken = async () => { const t = await getToken(); if (!t) return notify("No Token", "error"); navigator.clipboard.writeText(t); notify("Token Copied"); };

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
          throw new Error(err.detail);
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
    finally { setUploading(false); }
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
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
            Workspace
            {userGlobalData && <GlobalRoleBadge role={userGlobalData.global_role} />}
          </label>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
                {activeProjectId ? (
                    <>
                        <Icons.Folder className="w-5 h-5 text-blue-600" />
                        <span>{activeProjectId}</span>
                    </>
                ) : (
                    <>
                        <Icons.HardDrive className="w-5 h-5 text-slate-600" />
                        <span>My Session</span>
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">RAM</span>
                    </>
                )}
            </h1>
            <ContextRoleBadge role={currentProjectRole} isSession={activeProjectId === null} />
          </div>
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
        <ProjectsSidebar 
          user={user}
          projects={projects}
          activeProjectId={activeProjectId}
          setActiveProjectId={setActiveProjectId}
          isCreatingProject={isCreatingProject}
          setIsCreatingProject={setIsCreatingProject}
          newProjectName={newProjectName}
          setNewProjectName={setNewProjectName}
          onCreateProject={createProject}
          onDeleteProject={deleteProject}
        />

        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded shadow-sm overflow-hidden font-bold relative transition-all"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} 
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }} 
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files); }}
        >
            {isDragging && <div className="absolute inset-0 z-50 bg-blue-50/90 border-2 border-dashed border-blue-500 rounded flex flex-col items-center justify-center pointer-events-none"><Icons.UploadCloud className="w-12 h-12 text-blue-600 mb-2" /><span className="text-lg font-black text-blue-700 uppercase tracking-widest">Drop files to upload</span></div>}
            
            <FileToolbar 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              fileCount={filteredFiles.length}
              activeProjectId={activeProjectId}
              onShowMembers={() => setShowMembers(true)}
              onClear={handleClear}
              uploading={uploading}
              onUpload={handleUpload}
            />
            
            <FileTable
              files={filteredFiles}
              sortConfig={sortConfig}
              onSort={handleSort}
              searchTerm={searchTerm}
              expandedFileId={expandedFileId}
              onTogglePreview={togglePreview}
              previewData={previewData}
              previewLoading={previewLoading}
              onOpenLink={handleOpenLink}
              onDelete={handleDelete}
              formatBytes={formatBytes}
            />
          </div>
      </div>
      
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
