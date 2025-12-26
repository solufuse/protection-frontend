
import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Settings, Zap, ShieldCheck } from 'lucide-react';

export default function Config({ user }: { user: any }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';

  useEffect(() => {
    setConfig({
      project_name: "Nouveau Projet",
      settings: {
        std_51: { coeff_stab_max: 1.2, coeff_backup_min: 0.8, coeff_sensibilite: 0.8, coeff_inrush_margin: 1.15, selectivity_adder: 0, backup_strategy: "REMOTE_FLOOR" },
        selectivity: { margin_amperemetric: 300, coeff_amperemetric: 1.2 }
      },
      transformers: [
        { name: "TX1", sn_kva: 1000, u_kv: 20, ratio_iencl: 8.0, tau_ms: 400 }
      ],
      loadflow_settings: { target_mw: -80.0, tolerance_mw: 0.3, swing_bus_id: "" }
    });
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setMessage("");
    try {
      const token = await user.getIdToken();
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const formData = new FormData();
      formData.append('files', blob, 'config.json');

      const res = await fetch(`${apiUrl}/session/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) setMessage("✅ config.json mis à jour en RAM !");
      else setMessage("❌ Erreur lors de l'envoi au serveur.");
    } catch (e) { setMessage("❌ Erreur de connexion."); }
    finally { setLoading(false); }
  };

  if (!config) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Paramètres JSON</h1>
          <p className="text-slate-500 text-sm">Configure ton projet sans toucher au code.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg"
        >
          {loading ? "Envoi..." : <><Save className="w-5 h-5" /> Sauvegarder en Session</>}
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${message.includes('✅') ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 border-b pb-4">
              <ShieldCheck className="w-5 h-5 text-blue-600" /> Réglages de Protection (ANSI 51)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Coeff Stab Max</label>
                <input type="number" step="0.1" value={config.settings.std_51.coeff_stab_max} 
                  onChange={e => setConfig({...config, settings: {...config.settings, std_51: {...config.settings.std_51, coeff_stab_max: parseFloat(e.target.value)}}})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Marge Inrush</label>
                <input type="number" step="0.05" value={config.settings.std_51.coeff_inrush_margin} 
                  onChange={e => setConfig({...config, settings: {...config.settings, std_51: {...config.settings.std_51, coeff_inrush_margin: parseFloat(e.target.value)}}})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-500" /> Parc Transformateurs
              </h2>
              <button 
                onClick={() => setConfig({...config, transformers: [...config.transformers, {name: "TX-NEW", sn_kva: 1000, u_kv: 20, ratio_iencl: 8, tau_ms: 400}]})}
                className="flex items-center gap-1 text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
            
            <div className="space-y-4">
              {config.transformers.map((tx: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap md:flex-nowrap items-center gap-4 group">
                  <input type="text" value={tx.name} 
                    onChange={e => {
                      const newTx = [...config.transformers];
                      newTx[idx].name = e.target.value;
                      setConfig({...config, transformers: newTx});
                    }}
                    className="w-full md:w-32 p-2 font-bold text-blue-600 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Sn (kVA)</span>
                      <input type="number" value={tx.sn_kva} onChange={e => {
                        const newTx = [...config.transformers]; newTx[idx].sn_kva = parseFloat(e.target.value); setConfig({...config, transformers: newTx});
                      }} className="w-full bg-transparent border-b border-slate-200 text-sm outline-none focus:border-blue-500"/>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Un (kV)</span>
                      <input type="number" value={tx.u_kv} onChange={e => {
                        const newTx = [...config.transformers]; newTx[idx].u_kv = parseFloat(e.target.value); setConfig({...config, transformers: newTx});
                      }} className="w-full bg-transparent border-b border-slate-200 text-sm outline-none focus:border-blue-500"/>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Ratio Inrush</span>
                      <input type="number" value={tx.ratio_iencl} onChange={e => {
                        const newTx = [...config.transformers]; newTx[idx].ratio_iencl = parseFloat(e.target.value); setConfig({...config, transformers: newTx});
                      }} className="w-full bg-transparent border-b border-slate-200 text-sm outline-none focus:border-blue-500"/>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Tau (ms)</span>
                      <input type="number" value={tx.tau_ms} onChange={e => {
                        const newTx = [...config.transformers]; newTx[idx].tau_ms = parseFloat(e.target.value); setConfig({...config, transformers: newTx});
                      }} className="w-full bg-transparent border-b border-slate-200 text-sm outline-none focus:border-blue-500"/>
                    </div>
                  </div>

                  <button 
                    onClick={() => setConfig({...config, transformers: config.transformers.filter((_: any, i: number) => i !== idx)})}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 rounded-2xl p-6 shadow-xl sticky top-24 border border-slate-800">
             <div className="flex items-center gap-2 mb-4 text-slate-400">
               <Zap className="w-4 h-4" />
               <span className="text-xs font-bold uppercase tracking-widest">Aperçu config.json</span>
             </div>
             <pre className="text-[10px] text-green-400 font-mono overflow-auto max-h-[500px]">
               {JSON.stringify(config, null, 2)}
             </pre>
           </div>
        </div>
      </div>
    </div>
  );
}
