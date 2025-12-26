import { useState } from 'react';
import { Play, Download, Zap, Activity } from 'lucide-react';
import Toast from '../components/Toast';

export default function Loadflow() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
  };

  const handleRunAnalysis = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      notify("Analysis Completed Successfully");
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-4 text-[11px]">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h1 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2 tracking-tight">
          <Zap className="w-4 h-4 text-yellow-500" /> Loadflow Analysis
        </h1>
        <div className="flex gap-2 font-bold">
          <button onClick={handleRunAnalysis} disabled={loading} className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded font-bold transition-all shadow-sm text-[10px]">
            <Play className={`w-3 h-3 ${loading ? 'animate-pulse' : ''}`} /> {loading ? "CALCULATING..." : "RUN LOADFLOW"}
          </button>
          <button onClick={() => notify("PDF Exported")} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded border border-slate-300 font-bold transition-all text-[10px]">
            <Download className="w-3.5 h-3.5" /> EXPORT PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded shadow-sm p-4 h-fit">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b pb-1">
            <Activity className="w-3.5 h-3.5 text-blue-500" /> Convergence Status
          </h2>
          <div className="py-10 text-center text-slate-300 italic font-bold text-[10px]">
            No active simulation. Run loadflow to see results.
          </div>
        </div>
        
        <div className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded p-4 text-green-400 font-mono text-[10px] shadow-lg h-60 overflow-hidden">
          <p className="border-b border-slate-800 pb-1 mb-2 text-slate-500 uppercase font-bold text-[9px] tracking-widest text-left">Real-time Solver Logs</p>
          <p className="text-left font-bold opacity-60">&gt; Waiting for engine init...</p>
        </div>
      </div>

      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
