import { useEffect, useState, useRef } from 'react';
// Nettoyage de 'Key' qui causait l'erreur de build
import { RefreshCw, Upload, Trash2, FileSpreadsheet, FileCode, XCircle, HardDrive, Eye, X, ToggleLeft, ToggleRight, Zap } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useIngestion } from '../hooks/useIngestion';
import Toast from '../components/Toast';

export default function Files({ user }: { user: any }) {
  const [files, setFiles] = useState<any[]>([]);
  const [cloudEnabled, setCloudEnabled] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState({show: false, msg: '', type: 'success' as 'success'|'error'});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";
  
  const { processFile, loading, step } = useIngestion(user?.uid);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "configurations"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const toggleCloud = async () => {
    const newState = !cloudEnabled;
    setCloudEnabled(newState);
    try {
        await fetch(`${API_URL}/ingestion/toggle-cloud?user_id=${user.uid}&enabled=${newState}`, { method: 'POST' });
        notify(newState ? "Cloud Sync Enabled" : "RAM-Only Mode (Private Dev)", "success");
    } catch (e) { notify("Error toggling cloud", "error"); }
  };

  const handleUpload = (e: any) => {
    if (e.target.files[0]) {
      processFile(e.target.files[0]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePreview = async (fileId: string) => {
      try {
          const res = await fetch(`${API_URL}/ingestion/preview/${fileId}?user_id=${user.uid}`);
          const data = await res.json();
          setPreviewData(data);
          setShowPreview(true);
      } catch (e) { notify("Preview failed", "error"); }
  };

  const handleDownload = (fileId: string, format: 'xlsx' | 'json' | 'raw') => {
      window.open(`${API_URL}/ingestion/download/${fileId}/${format}?user_id=${user.uid}`, '_blank');
  };

  const handleDelete = async (fileId: string) => {
      if (!confirm("Delete this file?")) return;
      try {
          await deleteDoc(doc(db, "users", user.uid, "configurations", fileId));
          notify("File removed");
      } catch (e) { notify("Delete failed", "error"); }
  };

  const handleClearAll = async () => {
    if (files.length === 0 || !confirm("Clear entire session?")) return;
    const batch = writeBatch(db);
    files.forEach(f => batch.delete(doc(db, "users", user.uid, "configurations", f.id)));
    await batch.commit();
    notify("Session cleared");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 h-[calc(100vh-80px)] flex flex-col font-sans relative">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <div className="flex items-center gap-4">
            <h1 className="text-lg font-black text-slate-800 tracking-tighter flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" /> SESSION MANAGER
            </h1>
            <button onClick={toggleCloud} className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${cloudEnabled ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                {cloudEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {cloudEnabled ? "CLOUD SYNC ON" : "RAM ONLY MODE"}
            </button>
        </div>
        <div className="flex gap-2 items-center">
            {loading && <span className="text-[10px] font-bold text-blue-500 animate-pulse uppercase">{step}...</span>}
            <button onClick={handleClearAll} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Clear All">
                <XCircle className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 flex-1 overflow-hidden">
        <div className="col-span-1 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 hover:bg-slate-50 cursor-pointer group transition-all" onClick={() => !loading && fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} />
            {loading ? <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all" />}
            <span className="mt-4 text-[10px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-widest text-center">
                {loading ? "Processing..." : "Drop or Click to Upload"}
            </span>
        </div>

        <div className="col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Files ({files.length})</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status & Actions</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {files.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                        <HardDrive className="w-12 h-12 mb-2" />
                        <span className="text-xs font-bold uppercase">No files in session</span>
                    </div>
                ) : (
                    files.map(f => (
                        <div key={f.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all mb-1">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileCode className="w-5 h-5 text-blue-500" />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-slate-700 truncate">{f.original_name}</span>
                                    <span className="text-[9px] text-slate-400 uppercase font-mono">{f.source_type} • {f.id.substring(0,8)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${f.cloud_synced ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600 animate-pulse'}`}>
                                    {f.cloud_synced ? 'SAVED TO CLOUD' : 'RAM ONLY (SYNCING 5s)'}
                                </span>
                                <div className="flex gap-1 border-l pl-3">
                                    <button onClick={() => handlePreview(f.id)} className="p-1.5 hover:bg-blue-50 rounded text-slate-400 hover:text-blue-600 transition-all" title="View Data"><Eye className="w-4 h-4"/></button>
                                    <button onClick={() => handleDownload(f.id, 'xlsx')} className="p-1.5 hover:bg-green-50 rounded text-slate-400 hover:text-green-600 transition-all" title="Excel"><FileSpreadsheet className="w-4 h-4"/></button>
                                    <button onClick={() => handleDownload(f.id, 'raw')} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800 transition-all" title="Original"><HardDrive className="w-4 h-4"/></button>
                                    <button onClick={() => handleDelete(f.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-all" title="Delete"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden border border-white/20">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Data Preview</span>
                    </div>
                    <button onClick={() => setShowPreview(false)} className="hover:rotate-90 transition-transform p-1"><X className="w-6 h-6 text-slate-400" /></button>
                </div>
                <div className="flex-1 overflow-auto bg-slate-900 p-6 font-mono text-blue-300 text-[11px]">
                    <pre>{JSON.stringify(previewData, null, 2)}</pre>
                </div>
                <div className="p-4 bg-white border-t flex justify-end">
                    <button onClick={() => setShowPreview(false)} className="bg-slate-800 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-black transition-colors">CLOSE INSPECTOR</button>
                </div>
            </div>
        </div>
      )}

      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({...toast, show:false})} />}
    </div>
  );
}
