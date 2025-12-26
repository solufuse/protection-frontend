
import { useState, useEffect, useRef } from 'react';
import { Save, Trash2, Settings, Zap, Download, Activity, ChevronDown, ChevronRight, Upload } from 'lucide-react';

export default function Config({ user }: { user: any }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState({ inrush: true, loadflow: true, protection: true, coordination: true });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';

  useEffect(() => {
    setConfig({
      project_name: "NEW_PROJECT",
      settings: {
        std_51: { coeff_stab_max: 1.2, coeff_backup_min: 0.8, coeff_sensibilite: 0.8, coeff_inrush_margin: 1.15, selectivity_adder: 0, backup_strategy: "REMOTE_FLOOR" },
        selectivity: { margin_amperemetric: 300, coeff_amperemetric: 1.2 }
      },
      transformers: [],
      loadflow_settings: { target_mw: 0, tolerance_mw: 0, swing_bus_id: "" },
      plans: []
    });
  }, []);

  const toggleSection = (s: string) => setOpenSections(p => ({ ...p, [s]: !p[s as keyof typeof p] }));

  // FONCTION : Télécharger le JSON
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'config.json';
    a.click(); URL.revokeObjectURL(url);
  };

  // FONCTION : Importer un JSON existant
  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setConfig(json);
      } catch (err) { alert("❌ Invalid JSON file"); }
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
      formData.append('files', blob, 'config.json');
      await fetch(`${apiUrl}/session/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      alert("✅ Saved to session!");
    } catch (e) { alert("❌ Error."); }
    finally { setLoading(false); }
  };

  if (!config) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-4 text-[11px]">
      {/* 1. HEADER AVEC IMPORT/EXPORT */}
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <div className="flex flex-col">
          <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Project Name</label>
          <input className="text-lg font-bold text-slate-800 uppercase bg-transparent border-none outline-none p-0 focus:ring-0" value={config.project_name} onChange={e => setConfig({...config, project_name: e.target.value})} />
        </div>
        <div className="flex gap-2 font-bold">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
          <button onClick={handleImportClick} className="flex items-center gap-1 bg-white hover:bg-slate-50 px-3 py-1.5 rounded border border-slate-300 text-slate-600 transition-all">
            <Upload className="w-3.5 h-3.5" /> IMPORT
          </button>
          <button onClick={handleDownload} className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded border border-slate-300 text-slate-600 transition-all">
            <Download className="w-3.5 h-3.5" /> DOWNLOAD
          </button>
          <button onClick={handleSaveToSession} disabled={loading} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded shadow-sm disabled:opacity-50 transition-all">
            <Save className="w-3.5 h-3.5" /> {loading ? "SAVING..." : "SAVE SESSION"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          
          {/* 2. INRUSH */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden font-bold">
            <div className="flex justify-between items-center p-2 bg-slate-50 cursor-pointer" onClick={() => toggleSection('inrush')}>
              <h2 className="font-bold flex items-center gap-1.5 text-slate-700 uppercase">{openSections.inrush ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <Activity className="w-3.5 h-3.5 text-orange-500" /> Inrush</h2>
              {openSections.inrush && <button onClick={e => { e.stopPropagation(); setConfig({...config, transformers: [...(config.transformers || []), {name: "TX-NEW", sn_kva: 0, u_kv: 0, ratio_iencl: 0, tau_ms: 0}]})}} className="text-[9px] font-bold bg-white text-orange-600 px-2 py-0.5 rounded border border-orange-200">+ ADD TX</button>}
            </div>
            {openSections.inrush && (
              <div className="p-2 border-t border-slate-100 max-h-40 overflow-y-auto">
                <table className="w-full text-left font-bold">
                  <thead className="text-[9px] text-slate-400 uppercase tracking-widest"><tr><th className="py-1">Name</th><th className="text-center">Sn (kVA)</th><th className="text-center">Un (kV)</th><th className="text-center">Ratio</th><th className="text-center">Tau (ms)</th><th className="w-5"></th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {(config.transformers || []).map((tx: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td><input value={tx.name} onChange={e => { const n = [...config.transformers]; n[i].name = e.target.value; setConfig({...config, transformers: n}); }} className="w-full bg-transparent text-blue-600 outline-none"/></td>
                        <td><input type="number" value={tx.sn_kva} onChange={e => { const n = [...config.transformers]; n[i].sn_kva = parseFloat(e.target.value); setConfig({...config, transformers: n}); }} className="w-full text-center bg-transparent outline-none"/></td>
                        <td><input type="number" value={tx.u_kv} onChange={e => { const n = [...config.transformers]; n[i].u_kv = parseFloat(e.target.value); setConfig({...config, transformers: n}); }} className="w-full text-center bg-transparent outline-none"/></td>
                        <td><input type="number" value={tx.ratio_iencl} onChange={e => { const n = [...config.transformers]; n[i].ratio_iencl = parseFloat(e.target.value); setConfig({...config, transformers: n}); }} className="w-full text-center bg-transparent outline-none"/></td>
                        <td><input type="number" value={tx.tau_ms} onChange={e => { const n = [...config.transformers]; n[i].tau_ms = parseFloat(e.target.value); setConfig({...config, transformers: n}); }} className="w-full text-center bg-transparent outline-none"/></td>
                        <td><button onClick={() => setConfig({...config, transformers: config.transformers.filter((_:any,idx:number)=>idx!==i)})} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3"/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. LOADFLOW */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden font-bold">
            <div className="flex justify-between items-center p-2 bg-slate-50 cursor-pointer" onClick={() => toggleSection('loadflow')}>
              <h2 className="font-bold flex items-center gap-1.5 text-slate-700 uppercase">{openSections.loadflow ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <Zap className="w-3.5 h-3.5 text-yellow-500" /> Loadflow</h2>
            </div>
            {openSections.loadflow && (
              <div className="p-3 border-t border-slate-100 grid grid-cols-3 gap-4">
                <div><label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Target (MW)</label><input type="number" value={config.loadflow_settings?.target_mw} onChange={e => setConfig({...config, loadflow_settings: {...config.loadflow_settings, target_mw: parseFloat(e.target.value)}})} className="w-full p-1.5 bg-slate-50 border rounded outline-none focus:ring-1 focus:ring-yellow-500"/></div>
                <div><label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Tolerance</label><input type="number" value={config.loadflow_settings?.tolerance_mw} onChange={e => setConfig({...config, loadflow_settings: {...config.loadflow_settings, tolerance_mw: parseFloat(e.target.value)}})} className="w-full p-1.5 bg-slate-50 border rounded outline-none focus:ring-1 focus:ring-yellow-500"/></div>
                <div><label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Swing Bus ID</label><input type="text" value={config.loadflow_settings?.swing_bus_id} onChange={e => setConfig({...config, loadflow_settings: {...config.loadflow_settings, swing_bus_id: e.target.value}})} className="w-full p-1.5 bg-slate-50 border rounded outline-none focus:ring-1 focus:ring-yellow-500"/></div>
              </div>
            )}
          </div>

          {/* 4. PROTECTION */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden font-bold">
            <div className="flex justify-between items-center p-2 bg-slate-50 cursor-pointer" onClick={() => toggleSection('protection')}>
              <h2 className="font-bold flex items-center gap-1.5 text-slate-700 uppercase">{openSections.protection ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <Settings className="w-3.5 h-3.5 text-blue-600" /> Protection 51</h2>
            </div>
            {openSections.protection && (
              <div className="p-3 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {['coeff_stab_max', 'coeff_backup_min', 'coeff_inrush_margin'].map(k => (
                    <div key={k}><label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">{k.replace(/_/g,' ')}</label>
                      <input type="number" step="0.05" value={config.settings.std_51?.[k]} onChange={e => setConfig({...config, settings: {...config.settings, std_51: {...config.settings.std_51, [k]: parseFloat(e.target.value)}}})} className="w-full p-1 bg-slate-50 border rounded outline-none focus:ring-1 focus:ring-blue-500"/>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                   <p className="text-[9px] text-slate-400 font-bold uppercase mb-2">Selectivity Settings</p>
                   <div className="grid grid-cols-2 gap-3 font-bold">
                     <div><label className="text-[9px] text-slate-500 uppercase block mb-1 font-bold">Margin (A)</label><input type="number" value={config.settings.selectivity?.margin_amperemetric} onChange={e => setConfig({...config, settings: {...config.settings, selectivity: {...config.settings.selectivity, margin_amperemetric: parseFloat(e.target.value)}}})} className="w-full p-1 bg-white border rounded outline-none focus:ring-1 focus:ring-blue-400"/></div>
                     <div><label className="text-[9px] text-slate-500 uppercase block mb-1 font-bold">Coeff Amp</label><input type="number" step="0.1" value={config.settings.selectivity?.coeff_amperemetric} onChange={e => setConfig({...config, settings: {...config.settings, selectivity: {...config.settings.selectivity, coeff_amperemetric: parseFloat(e.target.value)}}})} className="w-full p-1 bg-white border rounded outline-none focus:ring-1 focus:ring-blue-400"/></div>
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. COORDINATION (FULL ROWS) */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden font-bold">
            <div className="flex justify-between items-center p-2 bg-slate-50 cursor-pointer" onClick={() => toggleSection('coordination')}>
              <h2 className="font-bold flex items-center gap-1.5 text-slate-700 uppercase">{openSections.coordination ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>} <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Protection Coordination</h2>
              {openSections.coordination && <button onClick={e => { e.stopPropagation(); setConfig({...config, plans: [...(config.plans || []), {id: "ID_NEW", title: "New Plan", type: "TRANSFORMER", ct_primary: "CT 0/1 A", related_source: "TX-1", active_functions: ["51"]}]})}} className="text-[9px] font-bold bg-white text-indigo-600 px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-50">+ ADD PLAN</button>}
            </div>
            {openSections.coordination && (
              <div className="p-1 border-t border-slate-100 max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="text-[8px] text-slate-400 uppercase tracking-widest border-b">
                    <tr><th className="py-1 px-1">ID</th><th className="px-1">Title</th><th className="px-1">Type</th><th className="px-1">CT Primary</th><th className="px-1">Source</th><th className="px-1">ANSI</th><th className="w-5"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-[10px]">
                    {(config.plans || []).map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 group">
                        <td className="py-1 px-1"><input value={p.id} onChange={e => { const n = [...config.plans]; n[i].id = e.target.value; setConfig({...config, plans: n}); }} className="w-full bg-transparent text-slate-800 outline-none border-b border-transparent focus:border-indigo-300 font-bold"/></td>
                        <td className="px-1"><input value={p.title} onChange={e => { const n = [...config.plans]; n[i].title = e.target.value; setConfig({...config, plans: n}); }} className="w-full bg-transparent outline-none border-b border-transparent focus:border-indigo-300"/></td>
                        <td className="px-1">
                          <select value={p.type} onChange={e => { const n = [...config.plans]; n[i].type = e.target.value; setConfig({...config, plans: n}); }} className="bg-transparent outline-none text-[9px] text-slate-500 border-none">
                            <option value="TRANSFORMER">TRANSFORMER</option><option value="INCOMER">INCOMER</option><option value="COUPLING">COUPLING</option>
                          </select>
                        </td>
                        <td className="px-1"><input value={p.ct_primary} onChange={e => { const n = [...config.plans]; n[i].ct_primary = e.target.value; setConfig({...config, plans: n}); }} className="w-full bg-transparent outline-none border-b border-transparent focus:border-indigo-300 font-bold"/></td>
                        <td className="px-1"><input value={p.related_source} onChange={e => { const n = [...config.plans]; n[i].related_source = e.target.value; setConfig({...config, plans: n}); }} className="w-full bg-transparent outline-none border-b border-transparent focus:border-indigo-300"/></td>
                        <td className="px-1">
                          <input list="ansi-codes" value={p.active_functions?.join(', ')} onChange={e => { const n = [...config.plans]; n[i].active_functions = e.target.value.split(',').map(s => s.trim()); setConfig({...config, plans: n}); }} className="w-full bg-transparent text-indigo-600 font-bold outline-none border-b border-transparent focus:border-indigo-300" placeholder="51, 67..."/>
                        </td>
                        <td><button onClick={() => setConfig({...config, plans: config.plans.filter((_:any,idx:number)=>idx!==i)})} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3"/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* JSON PREVIEW */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-slate-900 rounded border border-slate-800 p-3 h-full sticky top-4 shadow-xl">
            <pre className="text-[9px] text-green-500 font-mono leading-tight max-h-[600px] overflow-auto custom-scrollbar">{JSON.stringify(config, null, 2)}</pre>
          </div>
        </div>
      </div>
      
      <datalist id="ansi-codes">
        <option value="50">50 - Instantaneous Overcurrent</option>
        <option value="51">51 - AC Time Overcurrent</option>
        <option value="67">67 - AC Directional Overcurrent</option>
        <option value="87T">87T - Transformer Differential</option>
        <option value="27">27 - Undervoltage</option>
        <option value="59">59 - Overvoltage</option>
        <option value="81">81 - Frequency Relay</option>
      </datalist>
    </div>
  );
}
