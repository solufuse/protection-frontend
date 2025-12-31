import { useState, useEffect } from 'react';
import { 
  Play, Activity, TrendingUp, Zap, Filter, XCircle, Search, Eye
} from 'lucide-react';
import { Icons } from '../icons'; 
import Toast from '../components/Toast';
import ProjectsSidebar, { Project } from '../components/ProjectsSidebar';
import GlobalRoleBadge from '../components/GlobalRoleBadge';

// --- TYPES ---
interface StudyCase {
  id: string;
  config: string;
  revision: string;
}

interface TransformerResult {
  Tap: number;
  LFMW: number;
  LFMvar: number;
  kV: number;
}

interface LoadflowResult {
  filename: string;
  is_valid: boolean;
  mw_flow: number;
  mvar_flow: number;
  delta_target: number;
  is_winner: boolean;
  study_case?: StudyCase;
  transformers: Record<string, TransformerResult>;
}

interface LoadflowResponse {
  status: string;
  results: LoadflowResult[];
}

const LINE_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", 
  "#ec4899", "#6366f1", "#14b8a6", "#f43f5e", "#84cc16"
];

export default function Loadflow({ user }: { user: any }) {
  // --- STATE: PROJECTS ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [userGlobalData, setUserGlobalData] = useState<any>(null);

  // --- STATE: LOADFLOW ---
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LoadflowResult[]>([]);
  const [filterValid, setFilterValid] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<LoadflowResult | null>(null);

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

  // --- LOADFLOW LOGIC ---
  const runLoadflow = async () => {
    setLoading(true);
    setResults([]);
    setSelectedCase(null);
    try {
      const t = await getToken();
      let url = `${API_URL}/loadflow/run_batch?token=${t}`; // Use token param for compatibility or header
      if (activeProjectId) url += `&project_id=${activeProjectId}`;
      
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${t}` } });
      if (!res.ok) throw new Error("Calculation failed");
      
      const data: LoadflowResponse = await res.json();
      setResults(data.results);
      notify(`Calculated ${data.results.length} scenarios`);
    } catch (e) { notify("Error running loadflow", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (user) {
      fetchGlobalProfile();
      fetchProjects();
    }
  }, [user]);

  // Filtering
  const filteredResults = results.filter(r => {
    if (filterValid && !r.is_valid) return false;
    if (searchQuery && !r.filename.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 text-[11px] font-sans h-screen flex flex-col">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
            System Analysis
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
            <button onClick={runLoadflow} disabled={loading} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Icons.Refresh className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4 fill-current" />}
                {loading ? "CALCULATING..." : "RUN BATCH LOADFLOW"}
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

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded shadow-sm overflow-hidden relative">
            
            {/* TOOLBAR */}
            <div className="p-2 border-b border-slate-100 bg-slate-50 flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                     <div className="relative flex-1 max-w-xs">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                        <input type="text" placeholder="Filter scenarios..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:border-blue-400 text-slate-600" />
                    </div>
                    <button onClick={() => setFilterValid(!filterValid)} className={`flex items-center gap-1 px-2 py-1.5 rounded border transition-colors font-bold ${filterValid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                        <Filter className="w-3 h-3" /> Valid Only
                    </button>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {filteredResults.length} Scenarios
                </div>
            </div>

            {/* RESULTS TABLE */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50">
                {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                        <Activity className="w-12 h-12 mb-3 opacity-20" />
                        <span className="font-bold text-lg">No Results</span>
                        <span className="text-[10px]">Run a batch calculation to see data</span>
                    </div>
                ) : (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                         {/* LIST */}
                         <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-250px)]">
                            <div className="overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left font-bold">
                                    <thead className="bg-slate-50 text-[9px] text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                                        <tr>
                                            <th className="p-2 w-8"></th>
                                            <th className="p-2">Scenario</th>
                                            <th className="p-2 text-center">Flow (MW)</th>
                                            <th className="p-2 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredResults.map((res, i) => (
                                            <tr key={i} onClick={() => setSelectedCase(res)} className={`cursor-pointer transition-colors ${selectedCase === res ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                                <td className="p-2 text-center">
                                                    <div className={`w-2 h-2 rounded-full ${res.is_valid ? 'bg-green-500' : 'bg-red-400'}`}></div>
                                                </td>
                                                <td className="p-2">
                                                    <div className="text-[10px] text-slate-700 truncate max-w-[150px]" title={res.filename}>{res.filename}</div>
                                                    {res.study_case && <div className="text-[8.5px] text-slate-400 font-mono">{res.study_case.config} - {res.study_case.revision}</div>}
                                                </td>
                                                <td className="p-2 text-center font-mono text-slate-600">{res.mw_flow.toFixed(1)}</td>
                                                <td className="p-2 text-center">
                                                    {res.is_winner && <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[8px] border border-yellow-200">WINNER</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                         </div>

                         {/* DETAILS */}
                         <div className="bg-white border border-slate-200 rounded shadow-sm p-4 overflow-y-auto">
                            {selectedCase ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <TrendingUp className="w-4 h-4 text-blue-500" />
                                        <h3 className="font-black text-slate-700 uppercase">Scenario Analysis</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="block text-[9px] text-slate-400 uppercase font-bold">Active Power</span>
                                            <span className="text-lg font-mono text-slate-700">{selectedCase.mw_flow.toFixed(2)} MW</span>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="block text-[9px] text-slate-400 uppercase font-bold">Reactive Power</span>
                                            <span className="text-lg font-mono text-slate-700">{selectedCase.mvar_flow.toFixed(2)} MVar</span>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="block text-[9px] text-slate-400 uppercase font-bold">Target Delta</span>
                                            <span className={`text-lg font-mono ${Math.abs(selectedCase.delta_target) < 1 ? 'text-green-600' : 'text-orange-500'}`}>{selectedCase.delta_target.toFixed(3)}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="block text-[9px] text-slate-400 uppercase font-bold mb-2">Transformer Taps</span>
                                        <div className="space-y-1">
                                            {Object.entries(selectedCase.transformers).map(([name, data]) => (
                                                <div key={name} className="flex justify-between items-center text-[10px] p-2 bg-slate-50 border border-slate-100 rounded">
                                                    <span className="font-bold text-slate-600">{name}</span>
                                                    <div className="flex gap-3 font-mono">
                                                        <span className="text-slate-500">Tap: <b className="text-slate-800">{data.Tap}</b></span>
                                                        <span className="text-blue-600">{data.kV.toFixed(1)} kV</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 italic">
                                    <Eye className="w-8 h-8 mb-2 opacity-50" />
                                    Select a scenario to view details
                                </div>
                            )}
                         </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
