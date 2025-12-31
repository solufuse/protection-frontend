import { useState, useEffect, useRef } from 'react';
import { Save, Upload, Download, FileSignature, AlertTriangle, CheckCircle } from 'lucide-react';
import { Icons } from '../icons';
import Toast from '../components/Toast';
import ProjectsSidebar, { Project } from '../components/ProjectsSidebar';
import GlobalRoleBadge from '../components/GlobalRoleBadge';

export default function Config({ user }: { user: any }) {
  // --- STATE: PROJECTS ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [userGlobalData, setUserGlobalData] = useState<any>(null);

  // --- STATE: CONFIG ---
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });
  
  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";

  // --- HELPERS ---
  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });
  const getToken = async () => { if (!user) return null; return await user.getIdToken(); };

  // --- API CALLS ---
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
      if (!res.ok) throw new Error((await res.json()).detail);
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

  // --- CONFIG LOGIC ---
  const fetchConfig = async () => {
    setLoading(true);
    try {
      const t = await getToken();
      let url = `${API_URL}/files/download?filename=config.json`;
      if (activeProjectId) url += `&project_id=${activeProjectId}`;
      
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${t}` } });
      if (res.ok) {
          const data = await res.json();
          setConfig(data);
      } else {
          setConfig(null); // No config found
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      const t = await getToken();
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const formData = new FormData();
      formData.append('files', blob, 'config.json');
      
      let url = `${API_URL}/files/upload`;
      if (activeProjectId) url += `?project_id=${activeProjectId}`;

      const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${t}` }, body: formData });
      if (res.ok) notify("Config Saved");
      else throw new Error();
    } catch (e) { notify("Save Failed", "error"); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.[0]) return;
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (ev) => {
          try {
              const json = JSON.parse(ev.target?.result as string);
              setConfig(json);
              notify("Config Loaded from File");
          } catch (err) { notify("Invalid JSON", "error"); }
      };
      reader.readAsText(file);
  };

  useEffect(() => {
    if (user) {
      fetchGlobalProfile();
      fetchProjects();
      fetchConfig();
    }
  }, [user, activeProjectId]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 text-[11px] font-sans h-screen flex flex-col">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
            System Configuration
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
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded font-bold transition-all text-[10px]">
                <Upload className="w-3.5 h-3.5" /> IMPORT
            </button>
            <button onClick={handleSaveConfig} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-bold shadow-sm transition-all text-[10px]">
                <Save className="w-3.5 h-3.5" /> SAVE CONFIG
            </button>
        </div>
      </div>

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

        {/* MAIN EDITOR AREA */}
        <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded shadow-inner overflow-hidden relative">
            <div className="bg-slate-950 p-2 border-b border-slate-800 flex justify-between items-center">
                <span className="text-slate-400 font-mono text-[10px]">config.json</span>
                <span className={`text-[9px] px-2 py-0.5 rounded ${config ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {config ? 'LOADED' : 'NOT FOUND'}
                </span>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar p-4">
                {config ? (
                    <textarea 
                        value={JSON.stringify(config, null, 2)} 
                        onChange={(e) => {
                            try { setConfig(JSON.parse(e.target.value)); } 
                            catch(err) { /* Allow typing invalid JSON temporarily */ } 
                        }}
                        className="w-full h-full bg-transparent text-green-400 font-mono text-[11px] focus:outline-none resize-none"
                        spellCheck={false}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600">
                        <FileSignature className="w-10 h-10 mb-2 opacity-50" />
                        <span>No configuration file found.</span>
                        <button onClick={() => setConfig({})} className="mt-2 text-blue-500 hover:underline">Create Empty</button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
