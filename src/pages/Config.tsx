
import { useState, useEffect, useRef } from 'react';
import { 
  Save, Trash2, Settings, Zap, Download, Activity, 
  ChevronDown, ChevronRight, Upload, ShieldCheck,
  Folder, HardDrive, Key, Link as LinkIcon, Clock, FileSignature
} from 'lucide-react';
import Toast from '../components/Toast';
import ProjectsSidebar, { Project } from '../components/ProjectsSidebar';
import GlobalRoleBadge from '../components/GlobalRoleBadge';
import ContextRoleBadge from '../components/ContextRoleBadge';

export default function Config({ user }: { user: any }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [openSections, setOpenSections] = useState({ 
    info: true, inrush: true, links: true, loadflow: true, protection: true, coordination: true 
  });
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [userGlobalData, setUserGlobalData] = useState<any>(null);

  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';
  const currentProjectRole = activeProjectId ? projects.find(p => p.id === activeProjectId)?.role : undefined;
  const notify = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ show: true, msg, type }); };

  const defaultConfig = {
    project_name: "NEW_PROJECT",
    settings: {
      ansi_51: {
        transformer: { factor_I1: 1.2, time_dial_I1: { value: 0.5, curve: "VIT", comment: "Surcharge Transfo" }, factor_I2: 0.8, time_dial_I2: { value: 0.1, curve: "DT", comment: "Secours Court-Circuit" }, factor_I4: 6.0, time_dial_I4: { value: 0.05, curve: "DT", comment: "High-Set Inst." } },
        incomer: { factor_I1: 1.0, time_dial_I1: { value: 0.5, curve: "SIT", comment: "Incomer Std" }, factor_I2: 1.0, time_dial_I2: { value: 0.2, curve: "DT", comment: "Backup" }, factor_I4: 10.0, time_dial_I4: { value: 0.05, curve: "DT", comment: "Inst." } },
        coupling: { factor_I1: 1.0, time_dial_I1: { value: 0.5, curve: "SIT", comment: "Cpl Std" }, factor_I2: 1.0, time_dial_I2: { value: 0.2, curve: "DT", comment: "Backup" }, factor_I4: 10.0, time_dial_I4: { value: 0.05, curve: "DT", comment: "Inst." } }
      }
    },
    transformers: [], links_data: [], loadflow_settings: { target_mw: 0, tolerance_mw: 0.3, swing_bus_id: "" }, plans: []
  };

  const getToken = async () => { if (!user) return null; return await user.getIdToken(true); };
  const fetchGlobalProfile = async () => { try { const t = await getToken(); const res = await fetch(`${apiUrl}/admin/me`, { headers: { 'Authorization': `Bearer ${t}` } }); if (res.ok) setUserGlobalData(await res.json()); } catch (e) {} };
  const fetchProjects = async () => { try { const t = await getToken(); const res = await fetch(`${apiUrl}/projects/`, { headers: { 'Authorization': `Bearer ${t}` } }); if (res.ok) { const data = await res.json(); setProjects(data); } } catch (e) { console.error("Failed to load projects", e); } };
  const createProject = async () => { if (!newProjectName.trim()) return; try { const t = await getToken(); const res = await fetch(`${apiUrl}/projects/create`, { method: 'POST', headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: newProjectName, name: newProjectName }) }); if (!res.ok) throw new Error(); notify("Project Created"); setNewProjectName(""); setIsCreatingProject(false); fetchProjects(); } catch (e) { notify("Creation failed", "error"); } };
  const deleteProject = async (projId: string, e: React.MouseEvent) => { e.stopPropagation(); if (!confirm(`Delete project "${projId}"?`)) return; try { const t = await getToken(); const res = await fetch(`${apiUrl}/projects/${projId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` } }); if (!res.ok) throw new Error(); notify("Project Deleted"); if (activeProjectId === projId) setActiveProjectId(null); fetchProjects(); } catch (e) { notify("Delete failed", "error"); } };

  const loadFromSession = async () => {
    if (!user) return; setLoading(true);
    try {
        const token = await getToken(); const pParam = activeProjectId ? `?project_id=${activeProjectId}` : "";
        const listRes = await fetch(`${apiUrl}/files/details${pParam}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!listRes.ok) throw new Error("Failed to list files");
        const listData = await listRes.json();
        const configFile = listData.files?.find((f: any) => f.filename.toLowerCase() === 'config.json');
        if (configFile) {
            const dlParam = activeProjectId ? `&project_id=${activeProjectId}` : "";
            const fileRes = await fetch(`${apiUrl}/files/download?filename=${encodeURIComponent(configFile.filename)}&token=${token}${dlParam}`);
            if (!fileRes.ok) throw new Error("Failed to download config");
            const blob = await fileRes.blob(); const text = await blob.text();
            try {
                const sessionConfig = JSON.parse(text);
                if (sessionConfig && sessionConfig.settings) {
                    setConfig({ ...defaultConfig, ...sessionConfig, project_name: activeProjectId || sessionConfig.project_name || "NEW_PROJECT", settings: { ...defaultConfig.settings, ...sessionConfig.settings, ansi_51: { ...defaultConfig.settings.ansi_51, ...(sessionConfig.settings.ansi_51 || {}) } } });
                } else { setConfig(defaultConfig); }
            } catch (e) { throw new Error("Invalid JSON"); }
        } else { const startConfig = { ...defaultConfig }; if (activeProjectId) startConfig.project_name = activeProjectId; setConfig(startConfig); }
    } catch (err: any) { console.error("Sync Error:", err); setConfig(defaultConfig); } finally { setLoading(false); }
  };

  const handleSaveToSession = async () => {
    if (!user) return; setLoading(true);
    try {
      const token = await getToken(); const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const formData = new FormData(); formData.append('files', blob, 'config.json');
      const pParam = activeProjectId ? `?project_id=${activeProjectId}` : "";
      const response = await fetch(`${apiUrl}/files/upload${pParam}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      if (!response.ok) throw new Error("Backend error"); notify(`Saved to ${activeProjectId || "Storage"}`);
    } catch (e) { notify("Save error", "error"); } finally { setLoading(false); }
  };

  useEffect(() => { if (user) { fetchGlobalProfile(); fetchProjects(); loadFromSession(); } }, [user, activeProjectId]);

  const toggleSection = (s: string) => setOpenSections(p => ({ ...p, [s]: !p[s as keyof typeof p] }));
  const handleDownload = () => { const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'config.json'; a.click(); URL.revokeObjectURL(url); notify("Downloaded !"); };
  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (event) => { try { const json = JSON.parse(event.target?.result as string); setConfig({ ...defaultConfig, ...json }); notify("Imported (Not saved yet)"); } catch (err) { notify("Invalid JSON", "error"); } }; reader.readAsText(file); };
  const handleCopyToken = async () => { const t = await getToken(); if (t) { navigator.clipboard.writeText(t); notify("Token Copied"); } };
  const updateProtection = (category: string, threshold: string, field: string, value: any) => { const currentSettings = config.settings.ansi_51; const currentCategory = currentSettings[category] || {}; if (field.startsWith('factor')) { const newCategory = { ...currentCategory, [field]: parseFloat(value) }; setConfig({ ...config, settings: { ...config.settings, ansi_51: { ...currentSettings, [category]: newCategory } } }); } else { const timeDialKey = `time_dial_${threshold}`; const currentTimeDial = currentCategory[timeDialKey] || { value: 0.1, curve: "DT", comment: "" }; const newTimeDial = { ...currentTimeDial, [field]: field === 'value' ? parseFloat(value) : value }; const newCategory = { ...currentCategory, [timeDialKey]: newTimeDial }; setConfig({ ...config, settings: { ...config.settings, ansi_51: { ...currentSettings, [category]: newCategory } } }); } };

  if (!config) return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading Configuration...</div>;

  return (
    <div className="w-full px-6 py-6 text-[11px] font-sans h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">System Configuration {userGlobalData && <GlobalRoleBadge role={userGlobalData.global_role} />}</label>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
                {activeProjectId ? <><Folder className="w-5 h-5 text-blue-600" /><span>{activeProjectId}</span></> : <><HardDrive className="w-5 h-5 text-slate-600 dark:text-slate-400" /><span>My Session</span><span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">PRIVATE</span></>}
            </h1>
            <ContextRoleBadge role={currentProjectRole} isSession={activeProjectId === null} />
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={handleCopyToken} className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-yellow-600 font-bold transition-colors"><Key className="w-3.5 h-3.5" /> TOKEN</button>
            <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
            <button onClick={handleImportClick} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded font-bold transition-all text-[10px]"><Upload className="w-3.5 h-3.5" /> IMPORT</button>
            <button onClick={handleDownload} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold"><Download className="w-3.5 h-3.5" /> EXPORT</button>
            <button onClick={handleSaveToSession} disabled={loading} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-bold shadow-sm transition-all text-[10px] disabled:opacity-50"><Save className="w-3.5 h-3.5" /> {loading ? "SAVING..." : "SAVE CLOUD"}</button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        <ProjectsSidebar user={user} projects={projects} activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} isCreatingProject={isCreatingProject} setIsCreatingProject={setIsCreatingProject} newProjectName={newProjectName} setNewProjectName={setNewProjectName} onCreateProject={createProject} onDeleteProject={deleteProject} />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-12 gap-6 pb-10">
                    <div className="col-span-12 lg:col-span-8 space-y-4">
                        
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm p-3 flex items-center gap-4">
                            <FileSignature className="w-5 h-5 text-slate-400" />
                            <div className="flex-1">
                                <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Internal Project Name / Case ID</label>
                                <input type="text" value={config.project_name || ""} onChange={e => setConfig({...config, project_name: e.target.value})} className="w-full text-lg font-black text-slate-800 dark:text-white bg-transparent outline-none border-b border-transparent hover:border-slate-200 dark:hover:border-slate-600 focus:border-blue-500 placeholder-slate-300" placeholder="PROJECT_NAME" />
                            </div>
                        </div>

                        {/* TRANSFORMERS */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm overflow-hidden font-bold">
                            <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 cursor-pointer" onClick={() => toggleSection('inrush')}>
                            <h2 className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300 uppercase">{openSections.inrush ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <Activity className="w-3.5 h-3.5 text-orange-500" /> Transformers (Inrush)</h2>
                            {openSections.inrush && <button onClick={e => { e.stopPropagation(); setConfig({...config, transformers: [...(config.transformers || []), {name: "TX-NEW", sn_kva: 0, u_kv: 0, ratio_iencl: 8, tau_ms: 400}]})}} className="text-[9px] font-bold bg-white dark:bg-slate-800 text-orange-600 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-900 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors">+ ADD TX</button>}
                            </div>
                            {openSections.inrush && (
                            <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                                <table className="w-full text-left font-bold">
                                <thead className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest"><tr><th className="py-1 px-1">Name</th><th className="text-center">Sn (kVA)</th><th className="text-center">Un (kV)</th><th className="text-center">Ratio</th><th className="text-center">Tau (ms)</th><th className="w-5"></th></tr></thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                                    {(config.transformers || []).map((tx: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 group">
                                        <td className="px-1"><input value={tx.name} onChange={e => { const n = [...config.transformers]; n[i].name = e.target.value; setConfig({...config, transformers: n}); }} className="w-full bg-transparent text-blue-600 dark:text-blue-400 outline-none focus:border-b focus:border-blue-300"/></td>
                                        <td><input type="number" value={tx.sn_kva} onChange={e => { const n = [...config.transformers]; n[i].sn_kva = parseFloat(e.target.value); setConfig({...config, transformers: n}); }} className="w-full text-center bg-transparent outline-none focus:border-b focus:border-blue-300"/></td>
                                        <td><input type="number" value={tx.u_kv} onChange={e => { const n = [...config.transformers]; n[i].u_kv = parseFloat(e.target.value); setConfig({...config, transformers: n}); }} className="w-full text-center bg-transparent outline-none focus:border-b focus:border-blue-300"/></td>
                                        <td><input type="number" value={tx.ratio_iencl} onChange={e => { const n = [...config.transformers]; n[i].ratio_iencl = parseFloat(e.target.value); setConfig({...config, transformers: n}); }} className="w-full text-center bg-transparent outline-none focus:border-b focus:border-blue-300"/></td>
                                        <td><input type="number" value={tx.tau_ms} onChange={e => { const n = [...config.transformers]; n[i].tau_ms = parseFloat(e.target.value); setConfig({...config, transformers: n}); }} className="w-full text-center bg-transparent outline-none focus:border-b focus:border-blue-300"/></td>
                                        <td><button onClick={() => setConfig({...config, transformers: config.transformers.filter((_:any,idx:number)=>idx!==i)})} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3"/></button></td>
                                    </tr>
                                    ))}
                                </tbody>
                                </table>
                            </div>
                            )}
                        </div>

                        {/* LINKS */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm overflow-hidden font-bold">
                            <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 cursor-pointer" onClick={() => toggleSection('links')}>
                            <h2 className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300 uppercase">{openSections.links ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <LinkIcon className="w-3.5 h-3.5 text-green-600" /> Network Links / Cables</h2>
                            {openSections.links && <button onClick={e => { e.stopPropagation(); setConfig({...config, links_data: [...(config.links_data || []), {id: "LINK-1", length_km: 1.0, impedance_zd: "0+j0", impedance_z0: "0+j0"}]})}} className="text-[9px] font-bold bg-white dark:bg-slate-800 text-green-600 px-2 py-0.5 rounded border border-green-200 dark:border-green-900 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">+ ADD LINK</button>}
                            </div>
                            {openSections.links && (
                            <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                                <table className="w-full text-left font-bold">
                                <thead className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest"><tr><th className="py-1 px-1">ID</th><th className="text-center">Len (km)</th><th className="text-center">Zd (Ohm/km)</th><th className="text-center">Z0 (Ohm/km)</th><th className="w-5"></th></tr></thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                                    {(config.links_data || []).map((l: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 group">
                                        <td className="px-1"><input value={l.id} onChange={e => { const n = [...config.links_data]; n[i].id = e.target.value; setConfig({...config, links_data: n}); }} className="w-full bg-transparent text-green-700 dark:text-green-400 outline-none focus:border-b focus:border-green-300"/></td>
                                        <td><input type="number" value={l.length_km} onChange={e => { const n = [...config.links_data]; n[i].length_km = parseFloat(e.target.value); setConfig({...config, links_data: n}); }} className="w-full text-center bg-transparent outline-none focus:border-b focus:border-green-300"/></td>
                                        <td><input value={l.impedance_zd} onChange={e => { const n = [...config.links_data]; n[i].impedance_zd = e.target.value; setConfig({...config, links_data: n}); }} className="w-full text-center bg-transparent outline-none focus:border-b focus:border-green-300"/></td>
                                        <td><input value={l.impedance_z0} onChange={e => { const n = [...config.links_data]; n[i].impedance_z0 = e.target.value; setConfig({...config, links_data: n}); }} className="w-full text-center bg-transparent outline-none focus:border-b focus:border-green-300"/></td>
                                        <td><button onClick={() => setConfig({...config, links_data: config.links_data.filter((_:any,idx:number)=>idx!==i)})} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3"/></button></td>
                                    </tr>
                                    ))}
                                </tbody>
                                </table>
                            </div>
                            )}
                        </div>

                        {/* LOADFLOW */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm overflow-hidden font-bold">
                            <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 cursor-pointer" onClick={() => toggleSection('loadflow')}>
                            <h2 className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300 uppercase">{openSections.loadflow ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <Zap className="w-3.5 h-3.5 text-yellow-500" /> Loadflow Analysis</h2>
                            </div>
                            {openSections.loadflow && (
                            <div className="p-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-4">
                                <div><label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Target (MW)</label><input type="number" value={config.loadflow_settings?.target_mw} onChange={e => setConfig({...config, loadflow_settings: {...config.loadflow_settings, target_mw: parseFloat(e.target.value)}})} className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border dark:border-slate-600 rounded outline-none focus:ring-1 focus:ring-yellow-500 font-bold dark:text-white"/></div>
                                <div><label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Tolerance</label><input type="number" value={config.loadflow_settings?.tolerance_mw} onChange={e => setConfig({...config, loadflow_settings: {...config.loadflow_settings, tolerance_mw: parseFloat(e.target.value)}})} className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border dark:border-slate-600 rounded outline-none focus:ring-1 focus:ring-yellow-500 font-bold dark:text-white"/></div>
                                <div><label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Swing Bus ID</label><input type="text" value={config.loadflow_settings?.swing_bus_id} onChange={e => setConfig({...config, loadflow_settings: {...config.loadflow_settings, swing_bus_id: e.target.value}})} className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border dark:border-slate-600 rounded outline-none focus:ring-1 focus:ring-yellow-500 font-bold dark:text-white"/></div>
                            </div>
                            )}
                        </div>

                        {/* PROTECTION */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm overflow-hidden font-bold">
                            <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 cursor-pointer" onClick={() => toggleSection('protection')}>
                            <h2 className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300 uppercase">{openSections.protection ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Protection Settings (ANSI 51)</h2>
                            </div>
                            {openSections.protection && config.settings?.ansi_51 && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-6">
                                {['transformer', 'incomer', 'coupling'].map(category => {
                                    const catData = config.settings.ansi_51[category] || {};
                                    return (
                                        <div key={category} className="border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
                                            <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
                                                <Clock className="w-3.5 h-3.5 text-slate-400"/> {category}
                                            </div>
                                            <div className="p-0">
                                                <div className="grid grid-cols-12 gap-1 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-1 border-b border-slate-100 dark:border-slate-700 text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                                                    <div className="col-span-1">Lvl</div><div className="col-span-2 text-center">Factor (xIn)</div><div className="col-span-2 text-center">Time (s)</div><div className="col-span-2 text-center">Curve</div><div className="col-span-5">Comment (User Info)</div>
                                                </div>
                                                {['I1', 'I2', 'I4'].map((threshold, idx) => {
                                                    const factorKey = `factor_${threshold}`; const timeDialKey = `time_dial_${threshold}`; const factorValue = catData[factorKey] ?? 1.0; const timeDialData = catData[timeDialKey] || { value: 0.1, curve: "DT", comment: "" }; const isLast = idx === 2;
                                                    return (
                                                        <div key={threshold} className={`grid grid-cols-12 gap-2 items-center px-3 py-2 ${!isLast ? 'border-b border-slate-50 dark:border-slate-700' : ''} hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors`}>
                                                            <div className="col-span-1"><span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${threshold==='I1'?'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400': threshold==='I2'?'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400':'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>{threshold}</span></div>
                                                            <div className="col-span-2"><input type="number" step="0.1" value={factorValue} onChange={e => updateProtection(category, threshold, factorKey, e.target.value)} className="w-full text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded p-1 text-[10px] font-bold focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"/></div>
                                                            <div className="col-span-2"><input type="number" step="0.05" value={timeDialData.value} onChange={e => updateProtection(category, threshold, 'value', e.target.value)} className="w-full text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded p-1 text-[10px] font-bold focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"/></div>
                                                            <div className="col-span-2"><input type="text" value={timeDialData.curve} onChange={e => updateProtection(category, threshold, 'curve', e.target.value)} className="w-full text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded p-1 text-[10px] font-bold uppercase focus:ring-1 focus:ring-blue-500 outline-none dark:text-white"/></div>
                                                            <div className="col-span-5"><input type="text" value={timeDialData.comment || ""} onChange={e => updateProtection(category, threshold, 'comment', e.target.value)} placeholder="Description..." className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded p-1 px-2 text-[10px] text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-300 dark:placeholder-slate-500"/></div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            )}
                        </div>
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm overflow-hidden font-bold">
                            <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 cursor-pointer" onClick={() => toggleSection('coordination')}>
                            <h2 className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300 uppercase">{openSections.coordination ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <Settings className="w-3.5 h-3.5 text-indigo-500" /> Coordination Plans</h2>
                            {openSections.coordination && <button onClick={e => { e.stopPropagation(); setConfig({...config, plans: [...(config.plans || []), {id: "ID_NEW", title: "New Plan", type: "TRANSFORMER", ct_primary: "CT 0/1 A", related_source: "TX-1", active_functions: ["51"]}]})}} className="text-[9px] font-bold bg-white dark:bg-slate-800 text-indigo-600 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-bold">+ ADD PLAN</button>}
                            </div>
                            {openSections.coordination && (
                            <div className="p-1 border-t border-slate-100 dark:border-slate-700 font-bold">
                                <table className="w-full text-left border-collapse">
                                <thead className="text-[8px] text-slate-400 uppercase tracking-widest border-b dark:border-slate-700"><tr><th className="py-1 px-1">ID</th><th className="px-1">Type</th><th className="px-1">From/To</th><th className="px-1">CT</th><th className="px-1">ANSI</th><th className="w-5"></th></tr></thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                                    {(config.plans || []).map((p: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 group">
                                        <td className="py-1 px-1 font-bold text-slate-800 dark:text-slate-200"><input value={p.id} onChange={e => { const n = [...config.plans]; n[i].id = e.target.value; setConfig({...config, plans: n}); }} className="w-full bg-transparent outline-none focus:border-b focus:border-indigo-300"/></td>
                                        <td><select value={p.type} onChange={e => { const n = [...config.plans]; n[i].type = e.target.value; setConfig({...config, plans: n}); }} className="bg-transparent outline-none text-[9px] dark:bg-slate-800"><option value="TRANSFORMER">TX</option><option value="INCOMER">INC</option><option value="COUPLING">CPL</option></select></td>
                                        <td><div className="flex gap-1"><input placeholder="From" value={p.bus_from || ""} onChange={e => { const n = [...config.plans]; n[i].bus_from = e.target.value; setConfig({...config, plans: n}); }} className="w-1/2 bg-transparent border-b border-dashed border-slate-200 dark:border-slate-600 focus:border-indigo-300 outline-none text-[9px] text-center"/><input placeholder="To" value={p.bus_to || ""} onChange={e => { const n = [...config.plans]; n[i].bus_to = e.target.value; setConfig({...config, plans: n}); }} className="w-1/2 bg-transparent border-b border-dashed border-slate-200 dark:border-slate-600 focus:border-indigo-300 outline-none text-[9px] text-center"/></div></td>
                                        <td><input value={p.ct_primary} onChange={e => { const n = [...config.plans]; n[i].ct_primary = e.target.value; setConfig({...config, plans: n}); }} className="w-full bg-transparent outline-none focus:border-b focus:border-indigo-300"/></td>
                                        <td><input value={p.active_functions?.join(', ')} onChange={e => { const n = [...config.plans]; n[i].active_functions = e.target.value.split(',').map(s => s.trim()); setConfig({...config, plans: n}); }} className="w-full bg-transparent text-indigo-600 dark:text-indigo-400 outline-none font-bold focus:border-b focus:border-indigo-300"/></td>
                                        <td><button onClick={() => setConfig({...config, plans: config.plans.filter((_:any,idx:number)=>idx!==i)})} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3"/></button></td>
                                    </tr>
                                    ))}
                                </tbody>
                                </table>
                            </div>
                            )}
                        </div>
                    </div>
                    <div className="col-span-12 lg:col-span-4">
                        <div className="bg-slate-900 rounded border border-slate-800 p-3 sticky top-0 shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex justify-between"><span>Preview config.json</span><span className="text-blue-400">{activeProjectId || "USER_SESSION"}</span></h3>
                            <pre className="text-[9px] text-green-500 font-mono leading-tight overflow-auto custom-scrollbar flex-1">{JSON.stringify(config, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
