import { useState, useEffect } from 'react';
import { Shield, ChevronRight, Settings, SlidersHorizontal } from 'lucide-react';
import { Icons } from '../icons'; // Ensure we have common icons
import Toast from '../components/Toast';
import ProjectsSidebar, { Project } from '../components/ProjectsSidebar';
import GlobalRoleBadge from '../components/GlobalRoleBadge';

export default function Protection({ user }: { user: any }) {
  // --- STATE: PROJECTS ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  
  // --- STATE: UI ---
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });
  const [userGlobalData, setUserGlobalData] = useState<any>(null);

  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";

  // --- HELPERS ---
  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
  };

  const getToken = async () => { if (!user) return null; return await user.getIdToken(); };

  // --- API CALLS (Projects) ---
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

  useEffect(() => {
    if (user) {
      fetchGlobalProfile();
      fetchProjects();
    }
  }, [user]);

  // --- RENDER ---
  return (
    <div className="max-w-7xl mx-auto px-6 py-6 text-[11px] font-sans h-screen flex flex-col">
      
      {/* HEADER (Standardized) */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
            Protection Coordination
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
        <div>
            <button onClick={() => notify("Coordination Saved")} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-bold shadow-sm transition-all text-[10px]">
            <SlidersHorizontal className="w-3.5 h-3.5" /> SAVE SETTINGS
            </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        
        {/* SIDEBAR */}
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

        {/* MAIN CONTENT (Original Protection UI) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white border border-slate-200 rounded shadow-sm p-4">
            
            <div className="grid grid-cols-12 gap-6 text-left h-full">
                {/* LISTE DISJONCTEURS */}
                <div className="col-span-12 lg:col-span-4 space-y-4">
                <div className="bg-white border border-slate-200 rounded shadow-sm p-3">
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b pb-1">Circuit Breakers</h2>
                    <div className="space-y-1.5">
                    {['CB_TX1-A', 'CB_TX1-B', 'CB_TX2-A', 'CB_CPL-A'].map(cb => (
                        <div key={cb} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded hover:border-blue-300 hover:bg-white cursor-pointer transition-all group font-bold">
                        <span className="text-slate-700">{cb}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500" />
                        </div>
                    ))}
                    </div>
                </div>
                </div>

                {/* GRAPH / DETAILS */}
                <div className="col-span-12 lg:col-span-8 bg-slate-50 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-20 text-slate-400 italic font-bold">
                <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                    <Settings className="w-6 h-6 text-slate-200 animate-spin-slow" />
                </div>
                Select a breaker to view curves and time-current coordination
                </div>
            </div>

        </div>
      </div>

      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
