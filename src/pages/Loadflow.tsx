
import { useState, useEffect } from 'react';
import { 
  Play, Activity, Folder, HardDrive, 
  Plus, Key, Trash2, CheckCircle, AlertTriangle, BarChart3, TrendingUp
} from 'lucide-react';
import Toast from '../components/Toast';

// --- TYPES ---
interface Project {
  project_id: string;
  role: 'owner' | 'member';
}

interface LoadflowResult {
  filename: string;
  is_valid: boolean;
  mw_flow: number;
  mvar_flow: number;
  delta_target: number;
  is_winner: boolean;
  transformers: Record<string, any>;
}

interface LoadflowResponse {
  status: string;
  best_file: string | null;
  results: LoadflowResult[];
}

export default function Loadflow({ user }: { user: any }) {
  // --- STATE: NAVIGATION ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  // --- STATE: DATA & UI ---
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LoadflowResponse | null>(null);
  const [baseName, setBaseName] = useState("lf_results");
  
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });
  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
  };

  // --- API HELPER ---
  const getToken = async () => {
    if (!user) return null;
    return await user.getIdToken(true); 
  };

  // --- NAVIGATION LOGIC ---
  const fetchProjects = async () => {
    try {
      const t = await getToken();
      const res = await fetch(`${apiUrl}/session/projects`, { headers: { 'Authorization': `Bearer ${t}` } });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) { console.error("Failed to load projects", e); }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const t = await getToken();
      const res = await fetch(`${apiUrl}/session/project/create?project_id=${encodeURIComponent(newProjectName)}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${t}` }
      });
      if (!res.ok) throw new Error();
      notify("Project Created");
      setNewProjectName("");
      setIsCreatingProject(false);
      fetchProjects();
    } catch (e) { notify("Creation failed", "error"); }
  };

  const deleteProject = async (projId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete project "${projId}"?`)) return;
    try {
      const t = await getToken();
      const res = await fetch(`${apiUrl}/session/project?project_id=${projId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` }
      });
      if (!res.ok) throw new Error();
      notify("Project Deleted");
      if (activeProjectId === projId) setActiveProjectId(null);
      fetchProjects();
    } catch (e) { notify("Delete failed", "error"); }
  };

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  // --- LOADFLOW LOGIC ---

  const handleRunAnalysis = async () => {
    if (!user) return;
    setLoading(true);
    setResults(null); // Clear previous results
    try {
      const t = await getToken();
      const pParam = activeProjectId ? `&project_id=${activeProjectId}` : "";
      
      // 1. RUN AND SAVE
      const runRes = await fetch(`${apiUrl}/loadflow/run-and-save?basename=${baseName}${pParam}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}` }
      });

      if (!runRes.ok) throw new Error("Calculation Failed");
      
      // 2. FETCH THE SAVED JSON DATA
      // We look for the file we just saved to display it
      const jsonFilename = `${baseName}.json`;
      const dataRes = await fetch(`${apiUrl}/ingestion/preview?filename=${jsonFilename}&token=${t}${pParam}`);
      
      if (!dataRes.ok) throw new Error("Could not retrieve results");
      
      const jsonData: LoadflowResponse = await dataRes.json();
      
      // Sort by MW Flow for the ramp-up visualization
      jsonData.results.sort((a, b) => Math.abs(a.mw_flow) - Math.abs(b.mw_flow));
      
      setResults(jsonData);
      notify(`Analysis Complete: ${jsonData.results.length} scenarios processed`);

    } catch (e) { 
      notify("Error during analysis cycle", "error"); 
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = async () => {
    const t = await getToken();
    if (t) { navigator.clipboard.writeText(t); notify("Token Copied"); }
  };

  // --- CHART COMPONENT (Natif Tailwind) ---
  const ResultsChart = ({ data }: { data: LoadflowResult[] }) => {
    if (!data || data.length === 0) return null;
    const maxFlow = Math.max(...data.map(d => Math.abs(d.mw_flow)));
    
    return (
      <div className="w-full h-48 flex items-end gap-1 pt-6 pb-2">
        {data.map((r, i) => {
          const height = (Math.abs(r.mw_flow) / (maxFlow || 1)) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[9px] p-1 rounded whitespace-nowrap z-10 pointer-events-none transition-opacity">
                {r.filename} | {r.mw_flow.toFixed(1)} MW
              </div>
              
              {/* Bar */}
              <div 
                style={{ height: `${height}%` }} 
                className={`w-full rounded-t transition-all duration-500 ${r.is_winner ? 'bg-green-500 hover:bg-green-400' : 'bg-slate-300 hover:bg-blue-400'}`}
              ></div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 text-[11px] font-sans h-screen flex flex-col">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Simulation</label>
          <h1 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
            {activeProjectId ? (
                <>
                    <Folder className="w-5 h-5 text-blue-600" />
                    <span>{activeProjectId}</span>
                    <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200">PROJECT</span>
                </>
            ) : (
                <>
                    <HardDrive className="w-5 h-5 text-slate-600" />
                    <span>My Session</span>
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">RAM</span>
                </>
            )}
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <input 
            value={baseName} 
            onChange={(e) => setBaseName(e.target.value)} 
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 w-32 text-right font-bold text-slate-600 focus:ring-1 focus:ring-yellow-500 outline-none"
            placeholder="Filename..."
          />
          <span className="text-slate-400 font-bold">.json</span>
          
          <div className="w-px h-6 bg-slate-200 mx-2"></div>

          <button onClick={handleCopyToken} className="flex items-center gap-1 bg-white hover:bg-yellow-50 px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:text-yellow-600 font-bold transition-colors">
            <Key className="w-3.5 h-3.5" /> TOKEN
          </button>
          <button onClick={handleRunAnalysis} disabled={loading} className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1.5 rounded font-black shadow-sm disabled:opacity-50 transition-all">
            {loading ? <Activity className="w-3.5 h-3.5 animate-spin"/> : <Play className="w-3.5 h-3.5 fill-current" />}
            {loading ? "CALCULATING..." : "RUN LOADFLOW"}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        
        {/* SIDEBAR (Navigation) */}
        <div className="w-60 flex flex-col gap-4 flex-shrink-0 overflow-y-auto custom-scrollbar">
            {/* User Session */}
            <div 
                onClick={() => setActiveProjectId(null)}
                className={`flex items-center gap-3 p-3 rounded cursor-pointer border transition-all ${activeProjectId === null 
                    ? 'bg-slate-800 text-white border-slate-900 shadow-md' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
                <HardDrive className="w-4 h-4" />
                <div className="flex flex-col">
                    <span className="font-bold uppercase tracking-wide">My Session</span>
                    <span className={`text-[9px] ${activeProjectId === null ? 'text-slate-400' : 'text-slate-400'}`}>Private Sandbox</span>
                </div>
            </div>

            <div className="border-t border-slate-200 my-1"></div>

            {/* Projects Header */}
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shared Projects</span>
                <button 
                    onClick={() => setIsCreatingProject(!isCreatingProject)}
                    className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Create Input */}
            {isCreatingProject && (
                <div className="flex gap-1">
                    <input 
                        className="w-full text-[10px] p-1.5 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Project ID..."
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && createProject()}
                        autoFocus
                    />
                    <button onClick={createProject} className="bg-blue-600 text-white px-2 rounded font-bold text-[9px]">OK</button>
                </div>
            )}

            {/* Project List */}
            <div className="flex-1 flex flex-col gap-1">
                {projects.map(p => (
                    <div 
                        key={p.project_id}
                        onClick={() => setActiveProjectId(p.project_id)}
                        className={`group flex justify-between items-center p-2 rounded cursor-pointer border transition-all ${activeProjectId === p.project_id 
                            ? 'bg-blue-600 text-white border-blue-700 shadow-sm' 
                            : 'bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Folder className={`w-3.5 h-3.5 ${activeProjectId === p.project_id ? 'text-blue-200' : 'text-slate-400'}`} />
                            <span className="font-bold truncate">{p.project_id}</span>
                        </div>
                        {p.role === 'owner' && (
                            <button 
                                onClick={(e) => deleteProject(p.project_id, e)}
                                className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${activeProjectId === p.project_id ? 'hover:bg-blue-700 text-white' : 'hover:bg-red-100 text-red-400'}`}
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* RIGHT: DASHBOARD AREA */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-2">
            
            {!results ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 border-2 border-dashed border-slate-100 rounded bg-slate-50/50">
                    <Activity className={`w-16 h-16 ${loading ? 'animate-pulse text-yellow-400' : ''}`} />
                    <span className="font-black uppercase tracking-widest">
                        {loading ? "Simulating Scenarios..." : "Ready to Simulate"}
                    </span>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    
                    {/* TOP METRICS */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Scenarios</div>
                            <div className="text-2xl font-black text-slate-700">{results.results.length}</div>
                        </div>
                        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Valid Solutions</div>
                            <div className="text-2xl font-black text-green-600">
                                {results.results.filter(r => r.is_winner).length}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Best Candidate</div>
                            <div className="text-sm font-bold text-blue-600 truncate" title={results.best_file || "-"}>
                                {results.best_file || "None"}
                            </div>
                        </div>
                    </div>

                    {/* CHART SECTION */}
                    <div className="bg-white border border-slate-200 rounded shadow-sm p-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                            <h2 className="font-black text-slate-700 uppercase flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-500" /> Load Ramp-up Analysis (MW Flow)
                            </h2>
                            <div className="flex items-center gap-2 text-[9px]">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Winner</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-300 rounded-full"></div> Valid</span>
                            </div>
                        </div>
                        <ResultsChart data={results.results} />
                    </div>

                    {/* DETAILED TABLE */}
                    <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-black text-slate-700 uppercase flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-slate-400" /> Detailed Results
                        </div>
                        <table className="w-full text-left font-bold">
                            <thead className="bg-slate-50 text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-4 py-2">Status</th>
                                    <th className="px-4 py-2">Filename / Scenario</th>
                                    <th className="px-4 py-2 text-right">MW Flow</th>
                                    <th className="px-4 py-2 text-right">MVar Flow</th>
                                    <th className="px-4 py-2 text-right">Delta Target</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {results.results.map((r, i) => (
                                    <tr key={i} className={`hover:bg-slate-50 ${r.is_winner ? 'bg-green-50/50' : ''}`}>
                                        <td className="px-4 py-2">
                                            {r.is_winner ? 
                                                <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : 
                                                <AlertTriangle className="w-3.5 h-3.5 text-slate-300" />
                                            }
                                        </td>
                                        <td className="px-4 py-2 font-mono text-[10px] text-slate-600 truncate max-w-xs" title={r.filename}>
                                            {r.filename}
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono text-blue-600">
                                            {r.mw_flow.toFixed(2)} MW
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono text-slate-400">
                                            {r.mvar_flow.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono">
                                            <span className={`px-1.5 py-0.5 rounded ${Math.abs(r.delta_target) < 0.5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {r.delta_target.toFixed(3)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            )}
        </div>
      </div>

      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
