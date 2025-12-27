import { useState, useEffect, useRef } from 'react';
import { Save, Trash2, Settings, Zap, Download, Activity, ChevronDown, ChevronRight, Upload, ShieldCheck } from 'lucide-react';
import Toast from '../components/Toast';

export default function Config({ user }: { user: any }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState({ inrush: true, loadflow: true, protection: true, coordination: true });
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
  };

  // --- INITIALIZATION & SYNC (UID DEPENDENT) ---
  useEffect(() => {
    const initConfig = async () => {
        // 1. Define Default Config
        const defaultConfig = {
          project_name: "NEW_PROJECT",
          settings: {
            std_51: { coeff_stab_max: 1.2, coeff_backup_min: 0.8, coeff_sensibilite: 0.8, coeff_inrush_margin: 1.15, selectivity_adder: 0, backup_strategy: "REMOTE_FLOOR" },
            selectivity: { margin_amperemetric: 300, coeff_amperemetric: 1.2 }
          },
          transformers: [],
          loadflow_settings: { target_mw: 0, tolerance_mw: 0, swing_bus_id: "" },
          plans: []
        };

        // 2. Try to fetch existing config.json from Session Storage using Token (UID)
        if (user) {
            try {
                const token = await user.getIdToken();
                // List files in user's session
                const listRes = await fetch(`${apiUrl}/session/details`, { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                
                if (listRes.ok) {
                    const listData = await listRes.json();
                    // Check if config.json exists (case insensitive)
                    const configFile = listData.files?.find((f: any) => f.filename.toLowerCase() === 'config.json');
                    
                    if (configFile) {
                        // Fetch the content securely
                        const fileRes = await fetch(`${apiUrl}/ingestion/preview?filename=${configFile.filename}`, {
                             headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        if (fileRes.ok) {
                            const sessionConfig = await fileRes.json();
                            setConfig(sessionConfig);
                            console.log("✅ Configuration loaded from user storage (UID based)");
                            return; 
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to sync with session config:", err);
            }
        }

        // 3. Fallback to default if no remote config found
        setConfig(defaultConfig);
    };

    initConfig();
  }, [user]);

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
        setConfig(json);
        notify("Config Imported locally");
      } catch (err) { notify("Invalid JSON", "error"); }
    };
    reader.readAsText(file);
  };

  const handleSaveToSession = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const formData = new FormData();
      // We force the name 'config.json' so it persists as the main config
      formData.append('files', blob, 'config.json');
      
      const response = await fetch(`${apiUrl}/session/upload`, { 
          method: 'POST', 
          headers: { 'Authorization': `Bearer ${token}` }, 
          body: formData 
      });
      
      if (!response.ok) throw new Error("Backend error");
      notify("Saved to User Session !");
    } catch (e) { 
        notify("Save error", "error"); 
        console.error(e);
    }
    finally { setLoading(false); }
  };

  if (!config) return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading Configuration...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-4 text-[11px] font-sans">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <div className="flex flex-col">
          <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Project Name</label>
          <input className="text-lg font-bold text-slate-800 uppercase bg-transparent border-none outline-none p-0 focus:ring-0" value={config.project_name} onChange={e => setConfig({...config, project_name: e.target.value})} />
        </div>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
          <button onClick={handleImportClick} className="flex items-center gap-1 bg-white hover:bg-slate-50 px-3 py-1.5 rounded border border-slate-300 text-slate-600 font-bold"><Upload className="w-3.5 h-3.5" /> IMPORT</button>
          <button onClick={handleDownload} className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded border border-slate-300 text-slate-600 font-bold"><Download className="w-3.5 h-3.5" /> DOWNLOAD</button>
          <button onClick={handleSaveToSession} disabled={loading} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-bold shadow-sm disabled:opacity-50"><Save className="w-3.5 h-3.5" /> {loading ? "SAVING..." : "SAVE SESSION"}</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          
          {/* INRUSH SECTION */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden font-bold">
            <div className="flex justify-between items-center p-2 bg-slate-50 cursor-pointer" onClick={() => toggleSection('inrush')}>
              <h2 className="font-bold flex items-center gap-1.5 text-slate-700 uppercase">{openSections.inrush ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <Activity className="w-3.5 h-3.5 text-orange-500" /> Inrush</h2>
              {openSections.inrush && <button onClick={e => { e.stopPropagation(); setConfig({...config, transformers: [...(config.transformers || []), {name: "TX-NEW", sn_kva: 0, u_kv: 0, ratio_iencl: 0, tau_ms: 0}]})}} className="text-[9px] font-bold bg-white text-orange-600 px-2 py-0.5 rounded border border-orange-200">+ ADD TX</button>}
            </div>
            {openSections.inrush && (
              <div className="p-2 border-t border-slate-100 max-h-40 overflow-y-auto">
                <table className="w-full text-left font-bold">
                  <thead className="text-[9px] text-slate-400 uppercase tracking-widest"><tr><th className="py-1 px-1">Name</th><th className="text-center">Sn (kVA)</th><th className="text-center">Un (kV)</th><th className="text-center">Ratio</th><th className="text-center">Tau (ms)</th><th className="w-5"></th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {(config.transformers || []).map((tx: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-1"><input value={tx.name} onChange={e => { const n = [...config.transformers]; n[i].name = e.target.value; setConfig({...config, transformers: n}); }} className="w-full bg-transparent text-blue-600 outline-none"/></td>
                        <td><input type="number" value={tx.sn_kva} onChange={e => { const n = [...config.transformers]; n[i].sn_kva = parseFloat(e.target.value); setConfig({...config, transformers: n}); }} className="w-full text-center bg-transparent outline-none"/></td>
                        <td><input type="number" value={tx.u_kv} onChange={e => { const n = [...config.transformers]; n[i].u_kv = parseFloat(e.target.value); setConfig({...config, transformers: n}); }} className="w-full text-center bg-transparent outline-none"/></td>
                        <td><input type="number" value={tx.ratio_iencl} onChange={e => { const n = [...config.transformers]; n[i].ratio_iencl = parseFloat(e.target.value); setConfig({...config, transformers: n}); }} className="w-full text-center bg-transparent outline-none"/></td>
                        <td><input type="number" value={tx.tau_ms} onChange={e => { const n = [...config.transformers]; n[i].tau_ms = parseFloat(e.target.value); setConfig({...config, transformers: n}); }} className="w-full text-center bg-transparent outline-none"/></td>
                        <td><button onClick={() => setConfig({...config, transformers: config.transformers.filter((_:any,idx:number)=>idx!==i)})} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3"/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* LOADFLOW SECTION */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden font-bold">
            <div className="flex justify-between items-center p-2 bg-slate-50 cursor-pointer" onClick={() => toggleSection('loadflow')}>
              <h2 className="font-bold flex items-center gap-1.5 text-slate-700 uppercase">{openSections.loadflow ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <Zap className="w-3.5 h-3.5 text-yellow-500" /> Loadflow</h2>
            </div>
            {openSections.loadflow && (
              <div className="p-3 border-t border-slate-100 grid grid-cols-3 gap-4">
                <div><label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Target (MW)</label><input type="number" value={config.loadflow_settings?.target_mw} onChange={e => setConfig({...config, loadflow_settings: {...config.loadflow_settings, target_mw: parseFloat(e.target.value)}})} className="w-full p-1.5 bg-slate-50 border rounded outline-none focus:ring-1 focus:ring-yellow-500 font-bold"/></div>
                <div><label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Tolerance</label><input type="number" value={config.loadflow_settings?.tolerance_mw} onChange={e => setConfig({...config, loadflow_settings: {...config.loadflow_settings, tolerance_mw: parseFloat(e.target.value)}})} className="w-full p-1.5 bg-slate-50 border rounded outline-none focus:ring-1 focus:ring-yellow-500 font-bold"/></div>
                <div><label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Swing Bus ID</label><input type="text" value={config.loadflow_settings?.swing_bus_id} onChange={e => setConfig({...config, loadflow_settings: {...config.loadflow_settings, swing_bus_id: e.target.value}})} className="w-full p-1.5 bg-slate-50 border rounded outline-none focus:ring-1 focus:ring-yellow-500 font-bold"/></div>
              </div>
            )}
          </div>

          {/* PROTECTION SECTION */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden font-bold">
            <div className="flex justify-between items-center p-2 bg-slate-50 cursor-pointer" onClick={() => toggleSection('protection')}>
              <h2 className="font-bold flex items-center gap-1.5 text-slate-700 uppercase">{openSections.protection ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Protection</h2>
            </div>
            {openSections.protection && (
              <div className="p-3 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {['coeff_stab_max', 'coeff_backup_min', 'coeff_inrush_margin'].map(k => (
                    <div key={k}><label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">{k.replace(/_/g,' ')}</label>
                      <input type="number" step="0.05" value={config.settings.std_51?.[k]} onChange={e => setConfig({...config, settings: {...config.settings, std_51: {...config.settings.std_51, [k]: parseFloat(e.target.value)}}})} className="w-full p-1 bg-slate-50 border rounded outline-none focus:ring-1 focus:ring-blue-500 font-bold"/>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COORDINATION SECTION */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden font-bold">
            <div className="flex justify-between items-center p-2 bg-slate-50 cursor-pointer" onClick={() => toggleSection('coordination')}>
              <h2 className="font-bold flex items-center gap-1.5 text-slate-700 uppercase">{openSections.coordination ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <Settings className="w-3.5 h-3.5 text-indigo-500" /> Coordination</h2>
              {openSections.coordination && <button onClick={e => { e.stopPropagation(); setConfig({...config, plans: [...(config.plans || []), {id: "ID_NEW", title: "New Plan", type: "TRANSFORMER", ct_primary: "CT 0/1 A", related_source: "TX-1", active_functions: ["51"]}]})}} className="text-[9px] font-bold bg-white text-indigo-600 px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-50 font-bold">+ ADD PLAN</button>}
            </div>
            {openSections.coordination && (
              <div className="p-1 border-t border-slate-100 max-h-80 overflow-y-auto font-bold">
                <table className="w-full text-left border-collapse">
                  <thead className="text-[8px] text-slate-400 uppercase tracking-widest border-b">
                    <tr><th className="py-1 px-1">ID</th><th className="px-1">Title</th><th className="px-1">Type</th><th className="px-1">CT Primary</th><th className="px-1">ANSI</th><th className="w-5"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(config.plans || []).map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 group">
                        <td className="py-1 px-1 font-bold text-slate-800"><input value={p.id} onChange={e => { const n = [...config.plans]; n[i].id = e.target.value; setConfig({...config, plans: n}); }} className="w-full bg-transparent outline-none focus:border-b focus:border-indigo-300"/></td>
                        <td><input value={p.title} onChange={e => { const n = [...config.plans]; n[i].title = e.target.value; setConfig({...config, plans: n}); }} className="w-full bg-transparent outline-none focus:border-b focus:border-indigo-300"/></td>
                        <td>
                          <select value={p.type} onChange={e => { const n = [...config.plans]; n[i].type = e.target.value; setConfig({...config, plans: n}); }} className="bg-transparent outline-none text-[9px]">
                            <option value="TRANSFORMER">TX</option><option value="INCOMER">INC</option><option value="COUPLING">CPL</option>
                          </select>
                        </td>
                        <td><input value={p.ct_primary} onChange={e => { const n = [...config.plans]; n[i].ct_primary = e.target.value; setConfig({...config, plans: n}); }} className="w-full bg-transparent outline-none focus:border-b focus:border-indigo-300"/></td>
                        <td><input value={p.active_functions?.join(', ')} onChange={e => { const n = [...config.plans]; n[i].active_functions = e.target.value.split(',').map(s => s.trim()); setConfig({...config, plans: n}); }} className="w-full bg-transparent text-indigo-600 outline-none font-bold focus:border-b focus:border-indigo-300"/></td>
                        <td><button onClick={() => setConfig({...config, plans: config.plans.filter((_:any,idx:number)=>idx!==i)})} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3"/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="bg-slate-900 rounded border border-slate-800 p-3 h-full sticky top-4 shadow-xl">
            <pre className="text-[9px] text-green-500 font-mono leading-tight max-h-[600px] overflow-auto custom-scrollbar">{JSON.stringify(config, null, 2)}</pre>
          </div>
        </div>
      </div>

      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
