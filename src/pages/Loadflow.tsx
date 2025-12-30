
import { useState, useEffect } from 'react';
import { 
  Play, Activity, Folder, HardDrive, 
  Plus, Key, Trash2, CheckCircle, AlertTriangle, TrendingUp, Zap, Search,
  Eye, EyeOff, Filter, XCircle
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

// Helper to extract revision number (CH195 -> 195)
const extractLoadNumber = (rev: string | undefined) => {
    if (!rev) return 0;
    const match = rev.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
};

// Distinct colors for scenarios
const LINE_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#84cc16"
];

export default function Loadflow({ user }: { user: any }) {
  // --- STATE ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LoadflowResponse | null>(null);
  const [baseName, setBaseName] = useState("lf_results");
  
  const [scenarioGroups, setScenarioGroups] = useState<Record<string, LoadflowResult[]>>({});
  
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [filterSearch, setFilterSearch] = useState("");
  const [filterWinner, setFilterWinner] = useState(false);
  const [filterValid, setFilterValid] = useState(false);

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

  // --- PROCESSING ---
  const processResults = (data: LoadflowResponse) => {
      if (!data.results) return;

      const groups: Record<string, LoadflowResult[]> = {};
      data.results.forEach(r => {
          const key = r.study_case ? `${r.study_case.id} / ${r.study_case.config}` : "Unknown Scenario";
          if (!groups[key]) groups[key] = [];
          groups[key].push(r);
      });

      Object.keys(groups).forEach(k => {
          groups[k].sort((a, b) => extractLoadNumber(a.study_case?.revision) - extractLoadNumber(b.study_case?.revision));
      });

      setScenarioGroups(groups);
      
      data.results.sort((a, b) => {
          const keyA = a.study_case ? `${a.study_case.id}_${a.study_case.config}` : a.filename;
          const keyB = b.study_case ? `${b.study_case.id}_${b.study_case.config}` : b.filename;
          if (keyA < keyB) return -1;
          if (keyA > keyB) return 1;
          return extractLoadNumber(a.study_case?.revision) - extractLoadNumber(b.study_case?.revision);
      });

      setResults(data);
  };

  const handleLoadResults = async () => {
    if (!user) return;
    setLoading(true);
    setResults(null);
    setScenarioGroups({});
    try {
        const t = await getToken();
        const pParam = activeProjectId ? `&project_id=${activeProjectId}` : "";
        const jsonFilename = `${baseName}.json`;

        const dataRes = await fetch(`${apiUrl}/ingestion/preview?filename=${jsonFilename}&token=${t}${pParam}`);
        if (!dataRes.ok) throw new Error("No results found.");
        
        const jsonData: LoadflowResponse = await dataRes.json();
        processResults(jsonData);
        notify(`Loaded: ${jsonData.results.length} files`);
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
      processResults(jsonData);
      notify("Analysis Computed");
    } catch (e) { notify("Error during analysis", "error"); } 
    finally { setLoading(false); }
  };

  const handleCopyToken = async () => {
    const t = await getToken();
    if (t) { navigator.clipboard.writeText(t); notify("Token Copied"); }
  };

  const toggleRow = (idx: number) => {
      const newSet = new Set(expandedRows);
      if (newSet.has(idx)) newSet.delete(idx); else newSet.add(idx);
      setExpandedRows(newSet);
  };

  const getFilteredResults = () => {
      if (!results?.results) return [];
      return results.results.filter(r => {
          const searchLower = filterSearch.toLowerCase();
          const matchesSearch = 
            filterSearch === "" ||
            r.filename.toLowerCase().includes(searchLower) ||
            r.study_case?.id.toLowerCase().includes(searchLower) ||
            r.study_case?.config.toLowerCase().includes(searchLower) ||
            r.study_case?.revision.toLowerCase().includes(searchLower);
          
          if (!matchesSearch) return false;
          if (filterWinner && !r.is_winner) return false;
          if (filterValid && !r.is_valid) return false;
          return true;
      });
  };

  const MultiScenarioChart = ({ groups }: { groups: Record<string, LoadflowResult[]> }) => {
    const keys = Object.keys(groups);
    if (keys.length === 0) return null;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    Object.values(groups).forEach(group => {
        group.forEach(r => {
            const x = extractLoadNumber(r.study_case?.revision);
            const y = Math.abs(r.mw_flow);
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        });
    });

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const padY = rangeY * 0.1;
    minY -= padY; maxY += padY;

    const width = 800;
    const height = 300;

    const getX = (val: number) => ((val - minX) / rangeX) * (width - 40) + 20;
    const getY = (val: number) => height - ((val - minY) / (maxY - minY)) * (height - 40) - 20;

    return (
      <div className="w-full bg-white rounded border border-slate-200 shadow-sm p-4 flex flex-col">
        <div className="flex-1 relative h-[320px]">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <line x1="20" y1={height-20} x2={width-20} y2={height-20} stroke="#cbd5e1" strokeWidth="1" />
                <line x1="20" y1="20" x2="20" y2={height-20} stroke="#cbd5e1" strokeWidth="1" />
                
                {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                    const yPos = 20 + (height - 40) * pct;
                    const val = maxY - (maxY - minY) * pct;
                    return (
                        <g key={pct}>
                            <line x1="20" y1={yPos} x2={width-20} y2={yPos} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                            <text x="15" y={yPos + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{val.toFixed(0)}</text>
                        </g>
                    );
                })}

                {keys.map((key, kIdx) => {
                    const group = groups[key];
                    const color = LINE_COLORS[kIdx % LINE_COLORS.length];
                    const pointsStr = group.map(r => {
                        const x = getX(extractLoadNumber(r.study_case?.revision));
                        const y = getY(Math.abs(r.mw_flow));
                        return `${x},${y}`;
                    }).join(" ");

                    return (
                        <g key={key}>
                            <polyline points={pointsStr} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                            {group.map((r, i) => {
                                const x = getX(extractLoadNumber(r.study_case?.revision));
                                const y = getY(Math.abs(r.mw_flow));
                                return (
                                    <g key={i} className="group cursor-pointer">
                                        <circle cx={x} cy={y} r="4" fill={r.is_winner ? "#22c55e" : "white"} stroke={color} strokeWidth="2" className="transition-all hover:r-6"/>
                                        <title>{`${key}\nRev: ${r.study_case?.revision}\nMW: ${Math.abs(r.mw_flow).toFixed(2)}\nWinner: ${r.is_winner}`}</title>
                                    </g>
                                );
                            })}
                        </g>
                    );
                })}
            </svg>
        </div>
        <div className="flex flex-wrap gap-4 mt-2 justify-center">
            {keys.map((key, idx) => (
                <div key={key} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 uppercase bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: LINE_COLORS[idx % LINE_COLORS.length] }}></div>
                    {key}
                </div>
            ))}
        </div>
      </div>
    );
  };

  const filteredData = getFilteredResults();

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 text-[11px] font-sans h-screen flex flex-col">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Simulation Dashboard</label>
          <h1 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
            {activeProjectId ? (
                <><Folder className="w-5 h-5 text-blue-600" /><span>{activeProjectId}</span><span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200">PROJECT</span></>
            ) : (
                <><HardDrive className="w-5 h-5 text-slate-600" /><span>My Session</span><span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">RAM</span></>
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

      {/* MAIN CONTENT */}
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
                    
                    {/* CHART */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="font-black text-slate-700 uppercase flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> Scenario Load Curves</h2>
                        </div>
                        <MultiScenarioChart groups={scenarioGroups} />
                    </div>

                    {/* DETAILED TABLE (COMPACT) */}
                    <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-black text-slate-700 uppercase flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-500" /> Detailed Results
                                <span className="ml-2 bg-slate-200 text-slate-600 text-[9px] px-2 py-0.5 rounded-full">{filteredData.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Filter className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
                                    <input value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="Search..." className="pl-7 pr-2 py-1 text-[10px] border border-slate-300 rounded bg-white outline-none focus:border-blue-500 w-32" />
                                    {filterSearch && <button onClick={() => setFilterSearch("")} className="absolute right-1 top-1.5 text-slate-400 hover:text-red-500"><XCircle className="w-3 h-3" /></button>}
                                </div>
                                <button onClick={() => setFilterWinner(!filterWinner)} className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${filterWinner ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'}`}><CheckCircle className="w-3 h-3" /> Winner</button>
                                <button onClick={() => setFilterValid(!filterValid)} className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${filterValid ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'}`}><CheckCircle className="w-3 h-3" /> Valid</button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-bold min-w-[900px]">
                                <thead className="bg-slate-50 text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-2 py-1 w-10 text-center">St</th>
                                        <th className="px-2 py-1">Scenario (ID / Config)</th>
                                        <th className="px-2 py-1">Revision</th>
                                        <th className="px-2 py-1 text-right">MW Flow</th>
                                        <th className="px-2 py-1 text-right">MVar Flow</th>
                                        <th className="px-2 py-1 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-[9px]">
                                    {filteredData.map((r, i) => {
                                        const isExpanded = expandedRows.has(i);
                                        return (
                                        <>
                                        <tr key={i} className={`hover:bg-slate-50 ${r.is_winner ? 'bg-green-50/30' : ''} ${!r.is_valid ? 'opacity-70' : ''}`}>
                                            <td className="px-2 py-1 text-center">
                                                {r.is_winner ? <CheckCircle className="w-3.5 h-3.5 text-green-500 mx-auto" /> : r.is_valid ? <AlertTriangle className="w-3.5 h-3.5 text-red-400 mx-auto" /> : <AlertTriangle className="w-3.5 h-3.5 text-slate-300 mx-auto" />}
                                            </td>
                                            <td className="px-2 py-1 font-mono text-slate-600">
                                                <span className="font-black text-slate-800">{r.study_case?.id || "-"}</span>
                                                <span className="text-slate-400 mx-1">/</span>
                                                <span className="text-slate-500">{r.study_case?.config || r.filename}</span>
                                            </td>
                                            <td className="px-2 py-1 font-mono font-black text-blue-600">
                                                {r.study_case?.revision}
                                            </td>
                                            <td className="px-2 py-1 text-right font-mono text-slate-700">{Math.abs(r.mw_flow).toFixed(2)}</td>
                                            <td className="px-2 py-1 text-right font-mono text-slate-400">{Math.abs(r.mvar_flow).toFixed(2)}</td>
                                            <td className="px-2 py-1 text-right">
                                                <button onClick={() => toggleRow(i)} className={`p-0.5 rounded ${isExpanded ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-400'}`}>
                                                    {isExpanded ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                                                </button>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-slate-50/50">
                                                <td colSpan={6} className="px-4 py-2 border-b border-slate-100">
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(r.transformers || {}).map(([name, data]) => (
                                                            <div key={name} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[8.5px] shadow-sm">
                                                                <span className="font-black text-slate-700">{name}</span>
                                                                <div className="h-2 w-px bg-slate-200"></div>
                                                                <span className="text-slate-500">Tap: <b className="text-slate-800">{data.Tap}</b></span>
                                                                <span className="text-blue-600 font-bold">{data.LFMW.toFixed(1)} MW</span>
                                                                <span className="text-slate-400">{data.LFMvar.toFixed(1)} MVar</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </>
                                    )})}
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
