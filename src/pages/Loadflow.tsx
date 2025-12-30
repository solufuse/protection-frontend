
import { useState, useEffect } from 'react';
import { 
  Play, Activity, Folder, HardDrive, 
  Plus, Key, Trash2, CheckCircle, AlertTriangle, TrendingUp, Zap, Search
} from 'lucide-react';
import Toast from '../components/Toast';

// --- TYPES ---
interface Project {
  project_id: string;
  role: 'owner' | 'member';
}

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

export default function Loadflow({ user }: { user: any }) {
  // --- STATE ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LoadflowResponse | null>(null);
  const [baseName, setBaseName] = useState("lf_results");
  
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });
  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
  };

  const getToken = async () => {
    if (!user) return null;
    return await user.getIdToken(true); 
  };

  // --- NAVIGATION ---
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

  useEffect(() => { if (user) fetchProjects(); }, [user]);

  // --- LOADFLOW ACTIONS ---

  const extractLoadNumber = (rev: string | undefined) => {
      if (!rev) return 999999;
      const match = rev.match(/(\d+)/);
      return match ? parseInt(match[0]) : 0;
  };

  const processAndSetResults = (data: LoadflowResponse) => {
      if (data.results) {
          data.results.sort((a, b) => {
              const valA = extractLoadNumber(a.study_case?.revision);
              const valB = extractLoadNumber(b.study_case?.revision);
              return valA - valB;
          });
      }
      setResults(data);
  };

  const handleLoadResults = async () => {
    if (!user) return;
    setLoading(true);
    setResults(null);
    try {
        const t = await getToken();
        const pParam = activeProjectId ? `&project_id=${activeProjectId}` : "";
        const jsonFilename = `${baseName}.json`;

        const dataRes = await fetch(`${apiUrl}/ingestion/preview?filename=${jsonFilename}&token=${t}${pParam}`);
        if (!dataRes.ok) throw new Error("No previous results found.");
        
        const jsonData: LoadflowResponse = await dataRes.json();
        processAndSetResults(jsonData);
        notify(`Loaded: ${jsonData.results.length} scenarios`);
    } catch (e: any) { notify(e.message, "error"); } 
    finally { setLoading(false); }
  };

  const handleRunAnalysis = async () => {
    if (!user) return;
    setLoading(true);
    setResults(null); 
    try {
      const t = await getToken();
      const pParam = activeProjectId ? `&project_id=${activeProjectId}` : "";
      
      const runRes = await fetch(`${apiUrl}/loadflow/run-and-save?basename=${baseName}${pParam}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${t}` }
      });
      if (!runRes.ok) throw new Error("Calculation Failed");
      
      const jsonFilename = `${baseName}.json`;
      const dataRes = await fetch(`${apiUrl}/ingestion/preview?filename=${jsonFilename}&token=${t}${pParam}`);
      if (!dataRes.ok) throw new Error("Result file missing");
      
      const jsonData: LoadflowResponse = await dataRes.json();
      processAndSetResults(jsonData);
      notify("Analysis Freshly Computed");
    } catch (e) { notify("Error during analysis", "error"); } 
    finally { setLoading(false); }
  };

  const handleCopyToken = async () => {
    const t = await getToken();
    if (t) { navigator.clipboard.writeText(t); notify("Token Copied"); }
  };

  // --- CHART: EXCEL STYLE LINE CHART ---
  const LineChart = ({ data }: { data: LoadflowResult[] }) => {
    if (!data || data.length === 0) return null;

    const flows = data.map(d => Math.abs(d.mw_flow));
    const minVal = Math.min(...flows) * 0.95;
    const maxVal = Math.max(...flows) * 1.05;
    const range = maxVal - minVal;
    
    const width = 800;
    const height = 200;
    const stepX = width / (data.length > 1 ? data.length - 1 : 1);

    const points = data.map((d, i) => {
        const x = i * stepX;
        const y = height - ((Math.abs(d.mw_flow) - minVal) / (range || 1)) * height;
        return { x, y, data: d };
    });

    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(" ");

    return (
      <div className="w-full h-72 bg-white rounded border border-slate-200 shadow-sm p-4 flex flex-col">
        <div className="flex-1 relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <line x1="0" y1="0" x2={width} y2="0" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                <line x1="0" y1={height} x2={width} y2={height} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />

                <polyline 
                    points={polylinePoints} 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                />

                {points.map((p, i) => {
                    let fillColor = "#94a3b8";
                    let radius = 4;
                    if (p.data.is_winner) { fillColor = "#22c55e"; radius = 6; } 
                    else if (p.data.is_valid) { fillColor = "#ef4444"; }

                    return (
                        <g key={i} className="group cursor-pointer">
                            <circle cx={p.x} cy={p.y} r="10" fill="transparent" />
                            <circle cx={p.x} cy={p.y} r={radius} fill={fillColor} stroke="white" strokeWidth="2" className="transition-all duration-200 group-hover:r-6 shadow-sm"/>
                            <text x={p.x} y={height + 15} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="bold">{p.data.study_case?.revision || `S${i}`}</text>
                            <title>{`${p.data.study_case?.config || p.data.filename}\nMW: ${p.data.mw_flow.toFixed(2)}\nWinner: ${p.data.is_winner ? 'YES' : 'NO'}`}</title>
                        </g>
                    );
                })}
            </svg>
        </div>
        
        <div className="h-6 flex items-center justify-center gap-4 text-[9px] font-bold text-slate-500 uppercase mt-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Winner</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Valid (Rejected)</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"></div> Invalid</div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 text-[11px] font-sans h-screen flex flex-col">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Simulation Dashboard</label>
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
          <input value={baseName} onChange={(e) => setBaseName(e.target.value)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 w-32 text-right font-bold text-slate-600 focus:ring-1 focus:ring-yellow-500 outline-none" placeholder="Result Filename"/>
          <span className="text-slate-400 font-bold">.json</span>
          <div className="w-px h-6 bg-slate-200 mx-2"></div>
          <button onClick={handleCopyToken} className="flex items-center gap-1 bg-white hover:bg-yellow-50 px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:text-yellow-600 font-bold transition-colors"><Key className="w-3.5 h-3.5" /> TOKEN</button>
          <button onClick={handleLoadResults} disabled={loading} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-1.5 rounded font-bold shadow-sm disabled:opacity-50 transition-all border border-slate-300"><Search className="w-3.5 h-3.5" /> LOAD EXISTING</button>
          <button onClick={handleRunAnalysis} disabled={loading} className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1.5 rounded font-black shadow-sm disabled:opacity-50 transition-all">
            {loading ? <Activity className="w-3.5 h-3.5 animate-spin"/> : <Play className="w-3.5 h-3.5 fill-current" />} {loading ? "CALCULATING..." : "RUN ANALYSIS"}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        
        {/* SIDEBAR */}
        <div className="w-60 flex flex-col gap-4 flex-shrink-0 overflow-y-auto custom-scrollbar">
            <div onClick={() => setActiveProjectId(null)} className={`flex items-center gap-3 p-3 rounded cursor-pointer border transition-all ${activeProjectId === null ? 'bg-slate-800 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                <HardDrive className="w-4 h-4" />
                <div className="flex flex-col"><span className="font-bold uppercase tracking-wide">My Session</span><span className={`text-[9px] ${activeProjectId === null ? 'text-slate-400' : 'text-slate-400'}`}>Private Sandbox</span></div>
            </div>
            <div className="border-t border-slate-200 my-1"></div>
            <div className="flex justify-between items-center px-1"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shared Projects</span><button onClick={() => setIsCreatingProject(!isCreatingProject)} className="p-1 hover:bg-blue-50 text-blue-600 rounded"><Plus className="w-3.5 h-3.5" /></button></div>
            {isCreatingProject && (
                <div className="flex gap-1">
                    <input className="w-full text-[10px] p-1.5 border border-blue-300 rounded focus:outline-none" placeholder="Project ID..." value={newProjectName} onChange={(e) => setNewProjectName(e.target.value.toUpperCase())} />
                    <button onClick={createProject} className="bg-blue-600 text-white px-2 rounded font-bold text-[9px]">OK</button>
                </div>
            )}
            <div className="flex-1 flex flex-col gap-1">
                {projects.map(p => (
                    <div key={p.project_id} onClick={() => setActiveProjectId(p.project_id)} className={`group flex justify-between items-center p-2 rounded cursor-pointer border transition-all ${activeProjectId === p.project_id ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-2 overflow-hidden"><Folder className="w-3.5 h-3.5" /><span className="font-bold truncate">{p.project_id}</span></div>
                        {p.role === 'owner' && <button onClick={(e) => deleteProject(p.project_id, e)} className="opacity-0 group-hover:opacity-100 hover:bg-red-400 hover:text-white p-1 rounded"><Trash2 className="w-3 h-3" /></button>}
                    </div>
                ))}
            </div>
        </div>

        {/* DASHBOARD */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-2">
            {!results ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 border-2 border-dashed border-slate-100 rounded bg-slate-50/50">
                    <Activity className={`w-16 h-16 ${loading ? 'animate-pulse text-yellow-400' : ''}`} />
                    <span className="font-black uppercase tracking-widest">{loading ? "Simulating Scenarios..." : "Ready to Simulate"}</span>
                </div>
            ) : (
                <div className="flex flex-col gap-6 pb-10">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex justify-between items-center">
                            <div><div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Scenarios</div><div className="text-2xl font-black text-slate-700">{results.results.length}</div></div>
                            <Activity className="w-8 h-8 text-slate-200" />
                        </div>
                        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex justify-between items-center">
                            <div><div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Winners</div><div className="text-2xl font-black text-green-600">{results.results.filter(r => r.is_winner).length}</div></div>
                            <CheckCircle className="w-8 h-8 text-green-100" />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2"><h2 className="font-black text-slate-700 uppercase flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> Power Ramp-up Curve</h2></div>
                        <LineChart data={results.results} />
                    </div>

                    <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-black text-slate-700 uppercase flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> Detailed Results</div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-bold min-w-[900px]">
                                <thead className="bg-slate-50 text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-2 w-10">St</th>
                                        <th className="px-4 py-2">Load Step (Revision)</th>
                                        <th className="px-4 py-2 text-right">MW Flow</th>
                                        <th className="px-4 py-2 text-right">MVar Flow</th>
                                        <th className="px-4 py-2">Transformers Detail (Tap | MW | MVar)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {results.results.map((r, i) => (
                                        <tr key={i} className={`hover:bg-slate-50 ${r.is_winner ? 'bg-green-50/30' : ''}`}>
                                            <td className="px-4 py-3">
                                                {r.is_winner ? <CheckCircle className="w-4 h-4 text-green-500" /> : r.is_valid ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <AlertTriangle className="w-4 h-4 text-slate-300" />}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[10px] text-slate-600">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-800">{r.study_case?.revision || "-"}</span>
                                                    <span className="text-[9px] text-slate-400">{r.study_case?.config || r.filename}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-blue-600 text-[10px]">{Math.abs(r.mw_flow).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-400 text-[10px]">{Math.abs(r.mvar_flow).toFixed(2)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(r.transformers || {}).map(([name, data]) => (
                                                        <div key={name} className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded px-2 py-1 text-[9px]">
                                                            <span className="font-black text-slate-700">{name}</span>
                                                            <div className="h-3 w-px bg-slate-300"></div>
                                                            <span className="text-slate-500">Tap: <b className="text-slate-700">{data.Tap}</b></span>
                                                            <span className="text-blue-600">{data.LFMW.toFixed(1)} MW</span>
                                                            <span className="text-slate-400">{data.LFMvar.toFixed(1)} MVar</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
