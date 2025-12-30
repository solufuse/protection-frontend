
import { useState } from 'react';
import { Shield, ChevronRight, Settings, SlidersHorizontal } from 'lucide-react';
import Toast from '../components/Toast';

// [FIX] Removed '{ user }' because it was unused and caused build error TS6133
export default function Protection() {
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-4 text-[11px]">
      <div className="flex justify-between items-center mb-4 border-b pb-2 text-[11px]">
        <h1 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2 tracking-tight">
          <Shield className="w-4 h-4 text-blue-600" /> Protection Coordination
        </h1>
        <button onClick={() => notify("Coordination Saved")} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-bold shadow-sm transition-all text-[10px]">
          <SlidersHorizontal className="w-3.5 h-3.5" /> SAVE SETTINGS
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 text-left">
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded shadow-sm p-3">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b pb-1">Circuit Breakers</h2>
            <div className="space-y-1.5">
              {['CB_TX1-A', 'CB_TX1-B', 'CB_TX2-A', 'CB_CPL-A'].map(cb => (
                <div key={cb} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded hover:border-blue-300 hover:bg-white cursor-pointer transition-all group font-bold">
                  <span className="text-slate-700">{cb}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-slate-50 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-20 text-slate-400 italic font-bold">
          <div className="bg-white p-3 rounded-full shadow-sm mb-3">
            <Settings className="w-6 h-6 text-slate-200 animate-spin-slow" />
          </div>
          Select a breaker to view curves and time-current coordination
        </div>
      </div>

      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
