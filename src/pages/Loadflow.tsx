import { useState, useEffect, useCallback } from 'react';
import * as Icons from 'lucide-react'; 
import Toast from '../components/Toast';
import ProjectsSidebar, { Project, UserSummary } from '../components/ProjectsSidebar';
import GlobalRoleBadge from '../components/GlobalRoleBadge';
import ContextRoleBadge from '../components/ContextRoleBadge';

const MAX_HISTORY = 5;

interface StudyCase { id: string; config: string; revision: string; }
interface TransformerResult { Tap: number; LFMW: number; LFMvar: number; kV: number; }
interface LoadflowResult {
  filename: string; is_valid: boolean; mw_flow: number; mvar_flow: number; delta_target: number; is_winner: boolean;
  study_case?: StudyCase; transformers: Record<string, TransformerResult>;
}
interface LoadflowResponse { 
    status: string; 
    results: LoadflowResult[]; 
    filename?: string; 
}

const extractLoadNumber = (rev: string | undefined) => {
    if (!rev) return 0;
    const match = rev.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
};

const LINE_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#84cc16"];

export default function Loadflow({ user }: { user: any }) {
  // --- STATE ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSessionUid, setActiveSessionUid] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<UserSummary[]>([]);
  
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [userGlobalData, setUserGlobalData] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LoadflowResponse | null>(null);
  const [baseName, setBaseName] = useState("lf_results");
  const [scenarioGroups, setScenarioGroups] = useState<Record<string, LoadflowResult[]>>({});
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  const [filterSearch, setFilterSearch] = useState("");
  const [filterWinner, setFilterWinner] = useState(false);
  const [filterValid, setFilterValid] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LoadflowResult | null>(null);
  
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });
  
  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";
  
  const currentProjectRole = activeProjectId 
      ? projects.find(p => p.id === activeProjectId)?.role 
      : 'owner';

  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });
  const getToken = async () => { if (!user) return null; return await user.getIdToken(); };

  // --- DATA LOADING ---
  const fetchGlobalProfile = async () => { 
      try { 
          const t = await getToken(); 
          if (['super_admin', 'admin', 'moderator'].includes(user.global_role)) {
             const res = await fetch(`${API_URL}/users/`, { headers: { 'Authorization': `Bearer ${t}` } });
             if (res.ok) {
                 const users = await res.json();
                 setUsersList(users);
                 const me = users.find((u: any) => u.uid === user.uid);
                 setUserGlobalData(me || user);
             }
          } else {
             setUserGlobalData(user);
          }
      } catch (e) {} 
  };

  const fetchProjects = async () => { 
      try { 
          const t = await getToken(); 
          const res = await fetch(`${API_URL}/projects/`, { headers: { 'Authorization': `Bearer ${t}` } }); 
          if (res.ok) setProjects(await res.json()); 
      } catch (e) {} 
  };

  // --- ACTIONS ---
  const createProject = async () => { notify("Please use the Files Dashboard to create projects.", "error"); setIsCreatingProject(false); };
  
  // [FIX] Used projId in the string
  const deleteProject = async (projId: string, e: React.MouseEvent) => { 
      e.stopPropagation(); 
      notify(`Please use the Files Dashboard to delete project: ${projId}`, "error"); 
  };
  
  const handleCopyToken = async () => { const t = await getToken(); if (t) { navigator.clipboard.writeText(t); notify("Token Copied"); } else { notify("No token available", "error"); } };

  const cleanOldScenarios = async (rootName: string) => { 
      if (!activeProjectId && !activeSessionUid) return; 
      try { 
          const t = await getToken(); 
          let url = `${API_URL}/files/details`;
          if (activeProjectId) url += `?project_id=${activeProjectId}`;
          else if (activeSessionUid) url += `?project_id=${activeSessionUid}`;

          const listRes = await fetch(url, { headers: { 'Authorization': `Bearer ${t}` } }); 
          if (!listRes.ok) return; 
          
          const listData = await listRes.json(); 
          const historyFiles = (listData.files || []).filter((f: any) => f.filename.startsWith(rootName + "_") && f.filename.endsWith(".json")); 
          historyFiles.sort((a: any, b: any) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()); 
          
          if (historyFiles.length > MAX_HISTORY) { 
              const filesToDelete = historyFiles.slice(MAX_HISTORY); 
              for (const file of filesToDelete) { 
                  let delUrl = `${API_URL}/files/file/${file.filename}`;
                  if (activeProjectId) delUrl += `?project_id=${activeProjectId}`;
                  else if (activeSessionUid) delUrl += `?project_id=${activeSessionUid}`;
                  
                  await fetch(delUrl, { method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` } }); 
              } 
          } 
      } catch (e) {} 
  };

  const processResults = (data: LoadflowResponse) => { 
      if (!data.results) return; 
      const groups: Record<string, LoadflowResult[]> = {}; 
      data.results.forEach(r => { 
          const key = r.study_case ? `${r.study_case.id} / ${r.study_case.config}` : "Unknown Scenario"; 
          if (!groups[key]) groups[key] = []; 
          groups[key].push(r); 
      }); 
      Object.keys(groups).forEach(k => { groups[k].sort((a, b) => extractLoadNumber(a.study_case?.revision) - extractLoadNumber(b.study_case?.revision)); }); 
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
  
  const detectAndLoadResults = useCallback(async () => { 
      if (!user) return; 
      if (!activeProjectId && !activeSessionUid) return; 
      setLoading(true); 
      setResults(null); 
      try { 
          const t = await getToken(); 
          let url = `${API_URL}/files/details`;
          if (activeProjectId) url += `?project_id=${activeProjectId}`;
          else if (activeSessionUid) url += `?project_id=${activeSessionUid}`;

          const listRes = await fetch(url, { headers: { 'Authorization': `Bearer ${t}` } }); 
          if (!listRes.ok) throw new Error("Failed to list files"); 
          
          const listData = await listRes.json(); 
          const files = listData.files || []; 
          const jsonFiles = files.filter((f: any) => f.filename.toLowerCase().endsWith('.json') && f.filename.toLowerCase() !== 'config.json'); 
          
          if (jsonFiles.length === 0) { setLoading(false); return; } 
          
          jsonFiles.sort((a: any, b: any) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()); 
          
          for (const candidate of jsonFiles) { 
              try { 
                  let prevUrl = `${API_URL}/ingestion/preview?filename=${encodeURIComponent(candidate.filename)}&token=${t}`;
                  if (activeProjectId) prevUrl += `&project_id=${activeProjectId}`;
                  else if (activeSessionUid) prevUrl += `&project_id=${activeSessionUid}`;

                  const dataRes = await fetch(prevUrl); 
                  if (dataRes.ok) { 
                      const jsonData = await dataRes.json(); 
                      if (jsonData && Array.isArray(jsonData.results) && jsonData.results.length > 0) { 
                          const firstItem = jsonData.results[0]; 
                          if (firstItem.mw_flow !== undefined || firstItem.transformers !== undefined) { 
                              const rawName = candidate.filename.split('/').pop().replace('.json', ''); 
                              const cleanName = rawName.replace(/_\d{8}_\d{6}$/, ""); 
                              setBaseName(cleanName); 
                              processResults(jsonData as LoadflowResponse); 
                              notify(`Auto-loaded: ${rawName}`); 
                              break; 
                          } 
                      } 
                  } 
              } catch (err) { } 
          } 
      } catch (e: any) { console.warn("Auto-load failed", e); } finally { setLoading(false); } 
  }, [user, activeProjectId, activeSessionUid, API_URL]);

  useEffect(() => {
      if (activeProjectId && activeSessionUid) setActiveSessionUid(null);
  }, [activeProjectId]);
  
  useEffect(() => {
      if (activeSessionUid && activeProjectId) setActiveProjectId(null);
  }, [activeSessionUid]);

  useEffect(() => { 
      let mounted = true; 
      if (user && mounted) { 
          if (activeProjectId || activeSessionUid) detectAndLoadResults(); 
      } 
      return () => { mounted = false; }; 
  }, [activeProjectId, activeSessionUid, user]); 
  
  const handleManualLoad = async (overrideName?: string) => { 
      if (!user) return; 
      setLoading(true); 
      try { 
          const t = await getToken(); 
          let targetName = overrideName || baseName;
          let jsonFilename = targetName;
          if (!jsonFilename.endsWith('.json')) jsonFilename += '.json';
          
          let url = `${API_URL}/ingestion/preview?filename=${encodeURIComponent(jsonFilename)}&token=${t}`;
          if (activeProjectId) url += `&project_id=${activeProjectId}`;
          else if (activeSessionUid) url += `&project_id=${activeSessionUid}`;

          const dataRes = await fetch(url); 
          if (!dataRes.ok) throw new Error("No results found."); 
          const jsonData: LoadflowResponse = await dataRes.json(); 
          processResults(jsonData); 
          notify(`Loaded: ${jsonData.results.length} files`); 
      } catch (e: any) { notify(e.message, "error"); } finally { setLoading(false); } 
  };

  const handleRunAnalysis = async () => { 
      if (!user) return; 
      if (!activeProjectId && !activeSessionUid) return notify("Select a context first", "error");
      
      setLoading(true); 
      setResults(null); 
      setSelectedCase(null); 
      
      try { 
          const t = await getToken(); 
          const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 20) || "lf_run"; 
          
          let url = `${API_URL}/loadflow/run-and-save?basename=${cleanBaseName}`;
          if (activeProjectId) url += `&project_id=${activeProjectId}`;

          const runRes = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${t}` } }); 
          
          if (!runRes.ok) throw new Error("Calculation Failed"); 
          
          const runData: LoadflowResponse = await runRes.json();
          
          if (runData.filename) {
              await handleManualLoad(runData.filename);
              if (activeProjectId || activeSessionUid) cleanOldScenarios(cleanBaseName);
              notify("Analysis Computed & Saved");
          } else {
              throw new Error("No filename returned from backend");
          }

      } catch (e: any) { notify(e.message || "Error during analysis", "error"); } finally { setLoading(false); } 
  };

  useEffect(() => { if (user) { fetchGlobalProfile(); fetchProjects(); } }, [user]);

  const filteredData = (results?.results || []).filter(r => { const searchLower = filterSearch.toLowerCase(); const matchesSearch = filterSearch === "" || r.filename.toLowerCase().includes(searchLower) || r.study_case?.id.toLowerCase().includes(searchLower) || r.study_case?.config.toLowerCase().includes(searchLower) || r.study_case?.revision.toLowerCase().includes(searchLower); if (!matchesSearch) return false; if (filterWinner && !r.is_winner) return false; if (filterValid && !r.is_valid) return false; return true; });

  const MultiScenarioChart = ({ groups }: { groups: Record<string, LoadflowResult[]> }) => {
    const keys = Object.keys(groups);
    if (keys.length === 0) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    Object.values(groups).forEach(group => { group.forEach(r => { const x = extractLoadNumber(r.study_case?.revision); const y = Math.abs(r.mw_flow); if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }); });
    const rangeX = maxX - minX || 1; const rangeY = maxY - minY || 1; const padY = rangeY * 0.1; minY -= padY; maxY += padY; const width = 800; const height = 300; const getX = (val: number) => ((val - minX) / rangeX) * (width - 40) + 20; const getY = (val: number) => height - ((val - minY) / (maxY - minY)) * (height - 40) - 20;
    return (
      <div className="w-full bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col">
        <div className="flex-1 relative h-[320px]">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <line x1="20" y1={height-20} x2={width-20} y2={height-20} stroke="#cbd5e1" strokeWidth="1" />
                <line x1="20" y1="20" x2="20" y2={height-20} stroke="#cbd5e1" strokeWidth="1" />
                {[0, 0.25, 0.5, 0.75, 1].map(pct => { const yPos = 20 + (height - 40) * pct; const val = maxY - (maxY - minY) * pct; return (<g key={pct}><line x1="20" y1={yPos} x2={width-20} y2={yPos} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" /><text x="15" y={yPos + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{val.toFixed(0)}</text></g>); })}
                {keys.map((key, kIdx) => { const group = groups[key]; const color = LINE_COLORS[kIdx % LINE_COLORS.length]; const pointsStr = group.map(r => `${getX(extractLoadNumber(r.study_case?.revision))},${getY(Math.abs(r.mw_flow))}`).join(" "); return ( <g key={key}> <polyline points={pointsStr} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" /> {group.map((r, i) => ( <g key={i} className="group cursor-pointer"> <circle cx={getX(extractLoadNumber(r.study_case?.revision))} cy={getY(Math.abs(r.mw_flow))} r="4" fill={r.is_winner ? "#22c55e" : "white"} stroke={color} strokeWidth="2" className="transition-all hover:r-6"/> <title>{`${key}\nRev: ${r.study_case?.revision}\nMW: ${Math.abs(r.mw_flow).toFixed(2)}\nWinner: ${r.is_winner}`}</title> </g> ))} </g> ); })}
            </svg>
        </div>
        <div className="flex flex-wrap gap-4 mt-2 justify-center">{keys.map((key, idx) => (<div key={key} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: LINE_COLORS[idx % LINE_COLORS.length] }}></div>{key}</div>))}</div>
      </div>
    );
  };

  const toggleRow = (idx: number) => { const newSet = new Set(expandedRows); if (newSet.has(idx)) newSet.delete(idx); else newSet.add(idx); setExpandedRows(newSet); };

  return (
    <div className="w-full px-6 py-6 text-[11px] font-sans h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">System Analysis {userGlobalData && <GlobalRoleBadge role={userGlobalData.global_role} />}</label>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">{activeProjectId ? <><Icons.Folder className="w-5 h-5 text-blue-600" /><span>{activeProjectId}</span></> : <><Icons.HardDrive className="w-5 h-5 text-slate-600 dark:text-slate-400" /><span>My Session</span></>}</h1>
            <ContextRoleBadge role={currentProjectRole} isSession={activeProjectId === null} />
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <input value={baseName} onChange={(e) => setBaseName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleManualLoad()} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 w-40 text-right font-bold text-slate-600 dark:text-slate-200 focus:ring-1 focus:ring-yellow-500 outline-none" placeholder="Analysis Name"/>
          
          <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wide mr-2">_TIMESTAMP.json</span>
          
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
          <button onClick={handleCopyToken} className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-yellow-600 font-bold transition-colors"><Icons.Key className="w-3.5 h-3.5" /> TOKEN</button>
          <button onClick={() => handleManualLoad()} disabled={loading} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 px-4 py-1.5 rounded font-bold shadow-sm disabled:opacity-50 transition-all border border-slate-300 dark:border-slate-600"><Icons.Search className="w-3.5 h-3.5" /> LOAD</button>
          <button onClick={handleRunAnalysis} disabled={loading} className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1.5 rounded font-black shadow-sm disabled:opacity-50 transition-all">{loading ? <Icons.Activity className="w-3.5 h-3.5 animate-spin"/> : <Icons.Play className="w-3.5 h-3.5 fill-current" />} {loading ? "CALCULATING..." : "RUN"}</button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        <ProjectsSidebar 
            user={user} userGlobalData={userGlobalData}
            projects={projects} usersList={usersList}
            activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId}
            activeSessionUid={activeSessionUid} setActiveSessionUid={setActiveSessionUid}
            isCreatingProject={isCreatingProject} setIsCreatingProject={setIsCreatingProject} 
            newProjectName={newProjectName} setNewProjectName={setNewProjectName} 
            onCreateProject={createProject} onDeleteProject={deleteProject} 
        />
        
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm overflow-hidden relative">
            <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                     <div className="relative flex-1 max-w-xs"><Icons.Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" /><input type="text" placeholder="Filter scenarios..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-[10px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded focus:outline-none focus:border-blue-400 text-slate-600 dark:text-slate-300" /></div>
                    <button onClick={() => setFilterWinner(!filterWinner)} className={`flex items-center gap-1 px-2 py-1.5 rounded border transition-colors font-bold ${filterWinner ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-300'}`}><Icons.CheckCircle className="w-3 h-3" /> Winner</button>
                    <button onClick={() => setFilterValid(!filterValid)} className={`flex items-center gap-1 px-2 py-1.5 rounded border transition-colors font-bold ${filterValid ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-300'}`}><Icons.Filter className="w-3 h-3" /> Valid</button>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{filteredData.length} Scenarios</div>
            </div>
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-2">
                {!results ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-4 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded bg-slate-50/50 dark:bg-slate-900/50"><Icons.Activity className={`w-16 h-16 ${loading ? 'animate-pulse text-yellow-400' : ''}`} /><span className="font-black uppercase tracking-widest">{loading ? "Simulating Scenarios..." : "Ready to Simulate"}</span></div>
                ) : (
                    <div className="flex flex-col gap-6 pb-10 p-4">
                        <div><div className="flex justify-between items-center mb-2"><h2 className="font-black text-slate-700 dark:text-slate-300 uppercase flex items-center gap-2"><Icons.TrendingUp className="w-4 h-4 text-blue-500" /> Scenario Load Curves</h2></div><MultiScenarioChart groups={scenarioGroups} /></div>
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm overflow-hidden">
                            <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-700 font-black text-slate-700 dark:text-slate-300 uppercase flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Icons.Zap className="w-4 h-4 text-yellow-500" /> Detailed Results</div></div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left font-bold min-w-[900px]">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700"><tr><th className="px-2 py-1 w-10 text-center">St</th><th className="px-2 py-1">Scenario (ID / Config)</th><th className="px-2 py-1">Revision</th><th className="px-2 py-1 text-right">MW Flow</th><th className="px-2 py-1 text-right">MVar Flow</th><th className="px-2 py-1 text-right">Details</th></tr></thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700 text-[9px]">
                                        {filteredData.map((r, i) => {
                                            const isExpanded = expandedRows.has(i);
                                            return (<div key={i} style={{ display: 'contents' }}>
                                                <tr className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${r.is_winner ? 'bg-green-50/30 dark:bg-green-900/20' : ''} ${!r.is_valid ? 'opacity-70' : ''}`} onClick={() => setSelectedCase(r)}>
                                                    <td className="px-2 py-1 text-center">{r.is_winner ? <Icons.Check className="w-3.5 h-3.5 text-green-500 mx-auto" /> : r.is_valid ? <Icons.AlertTriangle className="w-3.5 h-3.5 text-red-400 mx-auto" /> : <Icons.AlertTriangle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 mx-auto" />}</td>
                                                    <td className="px-2 py-1 font-mono text-slate-600 dark:text-slate-300"><span className="font-black text-slate-800 dark:text-slate-100">{r.study_case?.id || "-"}</span><span className="text-slate-400 mx-1">/</span><span className="text-slate-500 dark:text-slate-400">{r.study_case?.config || r.filename}</span></td>
                                                    <td className="px-2 py-1 font-mono font-black text-blue-600 dark:text-blue-400">{r.study_case?.revision}</td>
                                                    <td className="px-2 py-1 text-right font-mono text-slate-700 dark:text-slate-300">{Math.abs(r.mw_flow).toFixed(2)}</td>
                                                    <td className="px-2 py-1 text-right font-mono text-slate-400 dark:text-slate-500">{Math.abs(r.mvar_flow).toFixed(2)}</td>
                                                    <td className="px-2 py-1 text-right"><button onClick={(e) => {e.stopPropagation(); toggleRow(i);}} className={`p-0.5 rounded ${isExpanded ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400'}`}>{isExpanded ? <Icons.EyeOff className="w-3.5 h-3.5"/> : <Icons.Eye className="w-3.5 h-3.5"/>}</button></td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className="bg-slate-50/50 dark:bg-slate-900/50"><td colSpan={6} className="px-4 py-2 border-b border-slate-100 dark:border-slate-700"><div className="flex flex-wrap gap-2">{Object.entries(r.transformers || {}).map(([name, data]) => (<div key={name} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-[8.5px] shadow-sm"><span className="font-black text-slate-700 dark:text-slate-300">{name}</span><div className="h-2 w-px bg-slate-200 dark:bg-slate-600"></div><span className="text-slate-500 dark:text-slate-400">Tap: <b className="text-slate-800 dark:text-slate-200">{data.Tap}</b></span><span className="text-blue-600 dark:text-blue-400 font-bold">{data.LFMW.toFixed(1)} MW</span><span className="text-slate-400 dark:text-slate-500">{data.LFMvar.toFixed(1)} MVar</span></div>))}</div></td></tr>
                                                )}
                                            </div>);
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
      {selectedCase && <div className="hidden">Selected Case for Debug: {selectedCase.filename}</div>}
      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
