
import { useState, useEffect, useRef } from 'react';
import { 
  Save, Trash2, Settings, Zap, Download, Activity, 
  ChevronDown, ChevronRight, Upload, ShieldCheck,
  Folder, HardDrive, Plus, Key, Link as LinkIcon
} from 'lucide-react';
import Toast from '../components/Toast';

interface Project {
  project_id: string;
  role: 'owner' | 'member';
}

export default function Config({ user }: { user: any }) {
  // --- STATE ---
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Sections
  const [openSections, setOpenSections] = useState({ 
    inrush: true, 
    links: true, 
    loadflow: true, 
    protection: true, 
    coordination: true 
  });
  
  // Navigation
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
  };

  // --- DEFAULT CONFIGURATION ---
  const defaultConfig = {
    project_name: "NEW_PROJECT",
    settings: {
      ansi_51: {
        transformer: { factor_I1: 1.2, factor_I2: 0.8, factor_I4: 6.0 },
        incomer: { factor_I1: 1.0, factor_I2: 1.0, factor_I4: 10.0 },
        coupling: { factor_I1: 1.0, factor_I2: 1.0, factor_I4: 10.0 }
      }
    },
    transformers: [],
    links_data: [], 
    loadflow_settings: { target_mw: 0, tolerance_mw: 0.3, swing_bus_id: "" },
    plans: []
  };

  // --- API HELPER ---
  const getToken = async () => {
    if (!user) return null;
    return await user.getIdToken(true); 
  };

  // --- PROJECT MANAGEMENT ---
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

  // --- CONFIG SYNC ---
  const loadFromSession = async () => {
    if (!user) return;
    setLoading(true);
    try {
        const token = await getToken();
        const pParam = activeProjectId ? `?project_id=${activeProjectId}` : "";
        
        // 1. Check file existence
        const listRes = await fetch(`${apiUrl}/session/details${pParam}`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        if (!listRes.ok) throw new Error("Failed to list files");
        const listData = await listRes.json();
        const configFile = listData.files?.find((f: any) => f.filename.toLowerCase() === 'config.json');
        
        if (configFile) {
            // 2. Download
            const dlParam = activeProjectId ? `&project_id=${activeProjectId}` : "";
            const fileRes = await fetch(`${apiUrl}/session/download?filename=${encodeURIComponent(configFile.filename)}&token=${token}${dlParam}`);
            
            if (!fileRes.ok) throw new Error("Failed to download config");

            const blob = await fileRes.blob();
            const text = await blob.text();
            try {
                const sessionConfig = JSON.parse(text);
                if (sessionConfig && (sessionConfig.settings || sessionConfig.transformers)) {
                    setConfig({ ...defaultConfig, ...sessionConfig });
                } else {
                    throw new Error("Invalid structure");
                }
            } catch (e) { throw new Error("Invalid JSON"); }
        } else {
            setConfig(defaultConfig);
        }
    } catch (err: any) {
        console.error("Sync Error:", err);
        setConfig(defaultConfig);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveToSession = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getToken();
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const formData = new FormData();
      formData.append('files', blob, 'config.json');
      
      const pParam = activeProjectId ? `?project_id=${activeProjectId}` : "";
      const response = await fetch(`${apiUrl}/session/upload${pParam}`, { 
          method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData 
      });
      
      if (!response.ok) throw new Error("Backend error");
      notify(`Saved to ${activeProjectId || "Session"}`);
    } catch (e) { notify("Save error", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (user) {
        fetchProjects();
        loadFromSession();
    }
  }, [user, activeProjectId]);

  // --- UI ACTIONS ---
  const toggleSection = (s: string) => setOpenSections(p => ({ ...p, [s]: !p[s as keyof typeof p] }));

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'config.json';
    a.click(); URL.revokeObjectURL(url);
    notify("Downloaded !");
  };

  const handleImportClick = () => fileInputRef.current?.click();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setConfig({ ...defaultConfig, ...json });
        notify("Imported (Not saved yet)");
      } catch (err) { notify("Invalid JSON", "error"); }
    };
    reader.readAsText(file);
  };

  const handleCopyToken = async () => {
    const t = await getToken();
    if (t) { navigator.clipboard.writeText(t); notify("Token Copied"); }
  };

  if (!config) return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading Configuration...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 text-[11px] font-sans h-screen flex flex-col">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Configuration</label>
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
        <div className="flex gap-2">
          <button onClick={handleCopyToken} className="flex items-center gap-1 bg-white hover:bg-yellow-50 px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:text-yellow-600 font-bold transition-colors">
            <Key className="w-3.5 h-3.5" /> TOKEN
          </button>
          
          <div className="w-px bg-slate-200 mx-1"></div>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
          <button onClick={handleImportClick} className="flex items-center gap-1 bg-white hover:bg-slate-50 px-3 py-1.5 rounded border border-slate-300 text-slate-600 font-bold"><Upload className="w-3.5 h-3.5" /> IMPORT</button>
          <button onClick={handleDownload} className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded border border-slate-300 text-slate-600 font-bold"><Download className="w-3.5 h-3.5" /> EXPORT</button>
          <button onClick={handleSaveToSession} disabled={loading} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-bold shadow-sm disabled:opacity-50">
            <Save className="w-3.5 h-3.5" /> {loading ? "SAVING..." : "SAVE CLOUD"}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        
        {/* SIDEBAR */}
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
                    <span className={`text-[9px] ${activeProjectId === null ? 'text-slate-400' : 'text-slate-400'}`}>Private Config</span>
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

        {/* RIGHT: CONFIG FORM AREA */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-12 gap-6 pb-10">
                    
                    {/* LEFT COLUMN: FORMS */}
                    <div className="col-span-12 lg:col-span-8 space-y-4">
                    
                        {/* 1. INRUSH SECTION */}
                        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden font-bold">
                            <div className="flex justify-between items-center p-2 bg-slate-50 cursor-pointer" onClick={() => toggleSection('inrush')}>
                            <h2 className="font-bold flex items-center gap-1.5 text-slate-700 uppercase">{openSections.inrush ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <Activity className="w-3.5 h-3.5 text-orange-500" /> Transformers (Inrush)</h2>
                            {openSections.inrush && <button onClick={e => { e.stopPropagation(); setConfig({...config, transformers: [...(config.transformers || []), {name: "TX-NEW", sn_kva: 0, u_kv: 0, ratio_iencl: 8, tau_ms: 400}]})}} className="text-[9px] font-bold bg-white text-orange-600 px-2 py-0.5 rounded border border-orange-200 hover:bg-orange-50 transition-colors">+ ADD TX</button>}
                            </div>
                            {openSections.inrush && (
                            <div className="p-2 border-t border-slate-100">
                                <table className="w-full text-left font-bold">
                                <thead className="text-[9px] text-slate-400 uppercase tracking-widest"><tr><th className="py-1 px-1">Name</th><th className="text-center">Sn (kVA)</th><th className="text-center">Un (kV)</th><th className="text-center">Ratio</th><th className="text-center">Tau (ms)</th><th className="w-5"></th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(config.transformers || []).map((tx: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50 group">
                                        <td className="px-1"><input value={tx.name} onChange={e => { const n = [...config.transformers]; n[i].name = e.target.value; setConfig({...config, transformers: n}); }} className="w-full bg-transparent text-blue-600 outline-none focus:border-b focus:border-blue-300"/></td>
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

                        {/* 2. LINKS SECTION (NEW) */}
                        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden font-bold">
                            <div className="flex justify-between items-center p-2 bg-slate-50 cursor-pointer" onClick={() => toggleSection('links')}>
                            <h2 className="font-bold flex items-center gap-1.5 text-slate-700 uppercase">{openSections.links ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <LinkIcon className="w-3.5 h-3.5 text-green-600" /> Network Links / Cables</h2>
                            {openSections.links && <button onClick={e => { e.stopPropagation(); setConfig({...config, links_data: [...(config.links_data || []), {id: "LINK-1", length_km: 1.0, impedance_zd: "0+j0", impedance_z0: "0+j0"}]})}} className="text-[9px] font-bold bg-white text-green-600 px-2 py-0.5 rounded border border-green-200 hover:bg-green-50 transition-colors">+ ADD LINK</button>}
                            </div>
                            {openSections.links && (
                            <div className="p-2 border-t border-slate-100">
                                <table className="w-full text-left font-bold">
                                <thead className="text-[9px] text-slate-400 uppercase tracking-widest"><tr><th className="py-1 px-1">ID</th><th className="text-center">Len (km)</th><th className="text-center">Zd (Ohm/km)</th><th className="text-center">Z0 (Ohm/km)</th><th className="w-5"></th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(config.links_data || []).map((l: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50 group">
                                        <td className="px-1"><input value={l.id} onChange={e => { const n = [...config.links_data]; n[i].id = e.target.value; setConfig({...config, links_data: n}); }} className="w-full bg-transparent text-green-700 outline-none focus:border-b focus:border-green-300"/></td>
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

                        {/* 3. LOADFLOW SECTION */}
                        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden font-bold">
                            <div className="flex justify-between items-center p-2 bg-slate-50 cursor-pointer" onClick={() => toggleSection('loadflow')}>
                            <h2 className="font-bold flex items-center gap-1.5 text-slate-700 uppercase">{openSections.loadflow ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <Zap className="w-3.5 h-3.5 text-yellow-500" /> Loadflow Analysis</h2>
                            </div>
                            {openSections.loadflow && (
                            <div className="p-3 border-t border-slate-100 grid grid-cols-3 gap-4">
                                <div><label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Target (MW)</label><input type="number" value={config.loadflow_settings?.target_mw} onChange={e => setConfig({...config, loadflow_settings: {...config.loadflow_settings, target_mw: parseFloat(e.target.value)}})} className="w-full p-1.5 bg-slate-50 border rounded outline-none focus:ring-1 focus:ring-yellow-500 font-bold"/></div>
                                <div><label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Tolerance</label><input type="number" value={config.loadflow_settings?.tolerance_mw} onChange={e => setConfig({...config, loadflow_settings: {...config.loadflow_settings, tolerance_mw: parseFloat(e.target.value)}})} className="w-full p-1.5 bg-slate-50 border rounded outline-none focus:ring-1 focus:ring-yellow-500 font-bold"/></div>
                                <div><label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Swing Bus ID</label><input type="text" value={config.loadflow_settings?.swing_bus_id} onChange={e => setConfig({...config, loadflow_settings: {...config.loadflow_settings, swing_bus_id: e.target.value}})} className="w-full p-1.5 bg-slate-50 border rounded outline-none focus:ring-1 focus:ring-yellow-500 font-bold"/></div>
                            </div>
                            )}
                        </div>

                        {/* 4. PROTECTION SETTINGS (Refactored) */}
                        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden font-bold">
                            <div className="flex justify-between items-center p-2 bg-slate-50 cursor-pointer" onClick={() => toggleSection('protection')}>
                            <h2 className="font-bold flex items-center gap-1.5 text-slate-700 uppercase">{openSections.protection ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Protection Settings (ANSI 51)</h2>
                            </div>
                            {openSections.protection && config.settings?.ansi_51 && (
                            <div className="p-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                                {['transformer', 'incomer', 'coupling'].map(category => {
                                    const settings = config.settings.ansi_51[category] || {};
                                    return (
                                        <div key={category} className="bg-slate-50 p-2 rounded border border-slate-200">
                                            <h3 className="text-[10px] font-black text-slate-600 uppercase mb-2 border-b border-slate-200 pb-1">{category}</h3>
                                            <div className="space-y-2">
                                                <div>
                                                    <label className="text-[9px] text-slate-400 block">Overload (I1)</label>
                                                    <input type="number" step="0.1" value={settings.factor_I1} onChange={e => {
                                                        const newVal = {...config.settings.ansi_51, [category]: {...settings, factor_I1: parseFloat(e.target.value)}};
                                                        setConfig({...config, settings: {...config.settings, ansi_51: newVal}});
                                                    }} className="w-full p-1 bg-white border rounded text-[10px] font-bold text-center"/>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-slate-400 block">Backup (I2)</label>
                                                    <input type="number" step="0.1" value={settings.factor_I2} onChange={e => {
                                                        const newVal = {...config.settings.ansi_51, [category]: {...settings, factor_I2: parseFloat(e.target.value)}};
                                                        setConfig({...config, settings: {...config.settings, ansi_51: newVal}});
                                                    }} className="w-full p-1 bg-white border rounded text-[10px] font-bold text-center"/>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-slate-400 block">High-Set (I4)</label>
                                                    <input type="number" step="0.1" value={settings.factor_I4} onChange={e => {
                                                        const newVal = {...config.settings.ansi_51, [category]: {...settings, factor_I4: parseFloat(e.target.value)}};
                                                        setConfig({...config, settings: {...config.settings, ansi_51: newVal}});
                                                    }} className="w-full p-1 bg-white border rounded text-[10px] font-bold text-center"/>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            )}
                        </div>

                        {/* 5. COORDINATION PLANS */}
                        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden font-bold">
                            <div className="flex justify-between items-center p-2 bg-slate-50 cursor-pointer" onClick={() => toggleSection('coordination')}>
                            <h2 className="font-bold flex items-center gap-1.5 text-slate-700 uppercase">{openSections.coordination ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <Settings className="w-3.5 h-3.5 text-indigo-500" /> Coordination Plans</h2>
                            {openSections.coordination && <button onClick={e => { e.stopPropagation(); setConfig({...config, plans: [...(config.plans || []), {id: "ID_NEW", title: "New Plan", type: "TRANSFORMER", ct_primary: "CT 0/1 A", related_source: "TX-1", active_functions: ["51"]}]})}} className="text-[9px] font-bold bg-white text-indigo-600 px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-50 font-bold">+ ADD PLAN</button>}
                            </div>
                            {openSections.coordination && (
                            <div className="p-1 border-t border-slate-100 font-bold">
                                <table className="w-full text-left border-collapse">
                                <thead className="text-[8px] text-slate-400 uppercase tracking-widest border-b">
                                    <tr><th className="py-1 px-1">ID</th><th className="px-1">Type</th><th className="px-1">From/To</th><th className="px-1">CT</th><th className="px-1">ANSI</th><th className="w-5"></th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(config.plans || []).map((p: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50 group">
                                        <td className="py-1 px-1 font-bold text-slate-800"><input value={p.id} onChange={e => { const n = [...config.plans]; n[i].id = e.target.value; setConfig({...config, plans: n}); }} className="w-full bg-transparent outline-none focus:border-b focus:border-indigo-300"/></td>
                                        <td>
                                        <select value={p.type} onChange={e => { const n = [...config.plans]; n[i].type = e.target.value; setConfig({...config, plans: n}); }} className="bg-transparent outline-none text-[9px]">
                                            <option value="TRANSFORMER">TX</option><option value="INCOMER">INC</option><option value="COUPLING">CPL</option>
                                        </select>
                                        </td>
                                        <td>
                                            <div className="flex gap-1">
                                                <input placeholder="From" value={p.bus_from || ""} onChange={e => { const n = [...config.plans]; n[i].bus_from = e.target.value; setConfig({...config, plans: n}); }} className="w-1/2 bg-transparent border-b border-dashed border-slate-200 focus:border-indigo-300 outline-none text-[9px] text-center"/>
                                                <input placeholder="To" value={p.bus_to || ""} onChange={e => { const n = [...config.plans]; n[i].bus_to = e.target.value; setConfig({...config, plans: n}); }} className="w-1/2 bg-transparent border-b border-dashed border-slate-200 focus:border-indigo-300 outline-none text-[9px] text-center"/>
                                            </div>
                                        </td>
                                        <td><input value={p.ct_primary} onChange={e => { const n = [...config.plans]; n[i].ct_primary = e.target.value; setConfig({...config, plans: n}); }} className="w-full bg-transparent outline-none focus:border-b focus:border-indigo-300"/></td>
                                        <td><input value={p.active_functions?.join(', ')} onChange={e => { const n = [...config.plans]; n[i].active_functions = e.target.value.split(',').map(s => s.trim()); setConfig({...config, plans: n}); }} className="w-full bg-transparent text-indigo-600 outline-none font-bold focus:border-b focus:border-indigo-300"/></td>
                                        <td><button onClick={() => setConfig({...config, plans: config.plans.filter((_:any,idx:number)=>idx!==i)})} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3"/></button></td>
                                    </tr>
                                    ))}
                                </tbody>
                                </table>
                            </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: JSON PREVIEW */}
                    <div className="col-span-12 lg:col-span-4">
                        <div className="bg-slate-900 rounded border border-slate-800 p-3 sticky top-0 shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex justify-between">
                                <span>Preview config.json</span>
                                <span className="text-blue-400">{activeProjectId || "USER_SESSION"}</span>
                            </h3>
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
