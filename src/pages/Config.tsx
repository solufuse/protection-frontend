
import { useState, useEffect } from 'react';
import { Save, Trash2, Settings, Zap, ShieldCheck, Download } from 'lucide-react';

export default function Config({ user }: { user: any }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';

  useEffect(() => {
    setConfig({
      project_name: "NEW_PROJECT",
      settings: {
        std_51: { coeff_stab_max: 0, coeff_backup_min: 0, coeff_sensibilite: 0, coeff_inrush_margin: 0, selectivity_adder: 0, backup_strategy: "REMOTE_FLOOR" },
        selectivity: { margin_amperemetric: 0, coeff_amperemetric: 0 }
      },
      transformers: [],
      loadflow_settings: { target_mw: 0, tolerance_mw: 0, swing_bus_id: "" },
      plans: []
    });
  }, []);

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'config.json';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleSaveToSession = async () => {
    if (!user) return;
    setLoading(true); setMessage("");
    try {
      const token = await user.getIdToken();
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const formData = new FormData();
      formData.append('files', blob, 'config.json');
      const res = await fetch(`${apiUrl}/session/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      if (res.ok) setMessage("✅ Configuration updated in RAM!");
      else setMessage("❌ Error.");
    } catch (e) { setMessage("❌ Connection error."); }
    finally { setLoading(false); }
  };

  if (!config) return null;

  return (
    <div className="max-w-full mx-auto px-4 py-2 text-[11px]">
      <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-1">
        <input 
          className="text-sm font-bold text-slate-800 uppercase tracking-tight bg-transparent border-none outline-none focus:ring-0"
          value={config.project_name}
          onChange={(e) => setConfig({...config, project_name: e.target.value})}
        />
        <div className="flex gap-1.5">
          <button onClick={handleDownload} className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border border-slate-300 font-bold transition-all text-slate-600">
            <Download className="w-3 h-3" /> DOWNLOAD
          </button>
          <button onClick={handleSaveToSession} disabled={loading} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded font-bold shadow-sm disabled:opacity-50">
            <Save className="w-3 h-3" /> {loading ? "SENDING..." : "SAVE SESSION"}
          </button>
        </div>
      </div>

      {message && <div className="mb-2 p-1 px-2 bg-green-50 text-green-700 border border-green-200 rounded font-bold">{message}</div>}

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 lg:col-span-9 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-2 border border-slate-200 rounded shadow-sm">
              <h2 className="font-bold mb-2 flex items-center gap-1.5 border-b pb-1 text-slate-700"><ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Protection Settings</h2>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[9px] text-slate-400 font-bold uppercase">Stab Max</label>
                  <input type="number" step="0.1" value={config.settings.std_51.coeff_stab_max} onChange={e => setConfig({...config, settings: {...config.settings, std_51: {...config.settings.std_51, coeff_stab_max: parseFloat(e.target.value)}}})} className="w-full p-1 bg-slate-50 border rounded outline-none focus:ring-1 focus:ring-blue-500"/>
                </div>
                <div><label className="text-[9px] text-slate-400 font-bold uppercase">Inrush Margin</label>
                  <input type="number" step="0.05" value={config.settings.std_51.coeff_inrush_margin} onChange={e => setConfig({...config, settings: {...config.settings, std_51: {...config.settings.std_51, coeff_inrush_margin: parseFloat(e.target.value)}}})} className="w-full p-1 bg-slate-50 border rounded outline-none focus:ring-1 focus:ring-blue-500"/>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 border border-slate-200 rounded shadow-sm">
              <h2 className="font-bold mb-2 flex items-center gap-1.5 border-b pb-1 text-slate-700"><Zap className="w-3.5 h-3.5 text-yellow-500" /> Loadflow Analysis</h2>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[9px] text-slate-400 font-bold uppercase">Target (MW)</label>
                  <input type="number" value={config.loadflow_settings.target_mw} onChange={e => setConfig({...config, loadflow_settings: {...config.loadflow_settings, target_mw: parseFloat(e.target.value)}})} className="w-full p-1 bg-slate-50 border rounded outline-none focus:ring-1 focus:ring-blue-500"/>
                </div>
                <div><label className="text-[9px] text-slate-400 font-bold uppercase">Tolerance</label>
                  <input type="number" value={config.loadflow_settings.tolerance_mw} onChange={e => setConfig({...config, loadflow_settings: {...config.loadflow_settings, tolerance_mw: parseFloat(e.target.value)}})} className="w-full p-1 bg-slate-50 border rounded outline-none focus:ring-1 focus:ring-blue-500"/>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-2 border border-slate-200 rounded shadow-sm">
            <div className="flex justify-between items-center mb-1 border-b pb-1">
              <h2 className="font-bold flex items-center gap-1.5 text-slate-700"><Settings className="w-3.5 h-3.5 text-indigo-500" /> Transformer Fleet</h2>
              <button onClick={() => setConfig({...config, transformers: [...config.transformers, {name: "TX-NEW", sn_kva: 0, u_kv: 0, ratio_iencl: 0, tau_ms: 0}]})} className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2 rounded border border-indigo-100 hover:bg-indigo-100">+ ADD TX</button>
            </div>
            <div className="max-h-32 overflow-y-auto pr-1 custom-scrollbar">
              <table className="w-full text-left">
                <thead className="text-[9px] text-slate-400 uppercase">
                  <tr><th className="py-1">Name</th><th className="text-center">Sn (kVA)</th><th className="text-center">Un (kV)</th><th className="text-center">Ratio</th><th className="text-center">Tau (ms)</th><th className="w-5"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {config.transformers.map((tx: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-1"><input value={tx.name} onChange={e => { const n = [...config.transformers]; n[idx].name = e.target.value; setConfig({...config, transformers: n}); }} className="w-full bg-transparent font-bold text-blue-600 outline-none"/></td>
                      <td><input type="number" value={tx.sn_kva} onChange={e => { const n = [...config.transformers]; n[idx].sn_kva = parseFloat(e.target.value); setConfig({...config, transformers: n}); }} className="w-full text-center bg-transparent outline-none"/></td>
                      <td><input type="number" value={tx.u_kv} onChange={e => { const n = [...config.transformers]; n[idx].u_kv = parseFloat(e.target.value); setConfig({...config, transformers: n}); }} className="w-full text-center bg-transparent outline-none"/></td>
                      <td><input type="number" value={tx.ratio_iencl} onChange={e => { const n = [...config.transformers]; n[idx].ratio_iencl = parseFloat(e.target.value); setConfig({...config, transformers: n}); }} className="w-full text-center bg-transparent outline-none"/></td>
                      <td><input type="number" value={tx.tau_ms} onChange={e => { const n = [...config.transformers]; n[idx].tau_ms = parseFloat(e.target.value); setConfig({...config, transformers: n}); }} className="w-full text-center bg-transparent outline-none"/></td>
                      <td><button onClick={() => setConfig({...config, transformers: config.transformers.filter((_:any,i:number)=>i!==idx)})} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3"/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-2 border border-slate-200 rounded shadow-sm">
             <div className="flex justify-between items-center mb-1 border-b pb-1">
              <h2 className="font-bold flex items-center gap-1.5 text-slate-700 uppercase text-[10px]">Protection Plans</h2>
              <button onClick={() => setConfig({...config, plans: [...config.plans, {id: "NEW_ID", title: "New Plan", type: "TRANSFORMER", ct_primary: "CT 0/1 A", related_source: "TX-1", active_functions: ["51"]}]})} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 rounded border border-slate-300 hover:bg-slate-200">+ ADD PLAN</button>
            </div>
            <div className="max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {config.plans.map((p: any, idx: number) => (
                  <div key={idx} className="p-1.5 bg-slate-50 border border-slate-100 rounded flex items-center justify-between group">
                    <div>
                      <input className="font-bold text-slate-700 bg-transparent outline-none border-b border-transparent focus:border-slate-300" value={p.id} onChange={(e) => { const n = [...config.plans]; n[idx].id = e.target.value; setConfig({...config, plans: n}); }} />
                      <span className="ml-2 text-[8px] bg-slate-200 px-1 rounded text-slate-500 uppercase">{p.type}</span>
                      <p className="text-[9px] text-slate-400">{p.title} • {p.ct_primary}</p>
                    </div>
                    <button onClick={() => setConfig({...config, plans: config.plans.filter((_:any,i:number)=>i!==idx)})} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3">
          <div className="bg-slate-900 rounded border border-slate-800 p-2 h-full">
            <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Live JSON Preview</p>
            <pre className="text-[9px] text-green-500 font-mono leading-tight max-h-[500px] overflow-auto custom-scrollbar">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
