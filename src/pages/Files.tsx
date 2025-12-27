import { useEffect, useState, useRef } from 'react';
import { 
  Upload, Trash2, FileCode, XCircle, HardDrive, 
  Eye, X, ToggleLeft, ToggleRight, Zap, Cloud, 
  Key, User, Copy, Terminal 
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useIngestion } from '../hooks/useIngestion';
import Toast from '../components/Toast';

export default function Files({ user }: { user: any }) {
  const [files, setFiles] = useState<any[]>([]);
  const [token, setToken] = useState("");
  const [cloudEnabled, setCloudEnabled] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState({show: false, msg: '', type: 'success' as 'success'|'error'});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";
  const { processFile, loading, step } = useIngestion(user?.uid);

  // 1. Récupération du Token pour ton usage perso (Debug)
  useEffect(() => {
    if (user) {
      user.getIdToken().then((t: string) => setToken(t));
    }
  }, [user]);

  // 2. Synchronisation en temps réel (Cloud + RAM)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "configurations"), orderBy("created_at", "desc"));
    return onSnapshot(q, (snap) => {
      setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => 
    setToast({ show: true, msg, type });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    notify(`${label} copié !`);
  };

  const handleClearAll = async () => {
    if (files.length === 0 || !confirm("Vider RAM + Cloud ?")) return;
    try {
        const idToken = await user.getIdToken();
        // Appel au backend pour vider la RAM
        await fetch(`${API_URL}/session/clear`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        // Nettoyage Firestore
        const batch = writeBatch(db);
        files.forEach(f => batch.delete(doc(db, "users", user.uid, "configurations", f.id)));
        await batch.commit();
        notify("Session réinitialisée");
    } catch (e) { notify("Erreur clearing", "error"); }
  };

  const handleDelete = async (fileId: string) => {
    try {
        const idToken = await user.getIdToken();
        // Supprime en RAM d'abord
        await fetch(`${API_URL}/session/file/${fileId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        // Supprime en Cloud
        await deleteDoc(doc(db, "users", user.uid, "configurations", fileId));
        notify("Fichier supprimé");
    } catch (e) { notify("Erreur suppression", "error"); }
  };

  const handlePreview = async (fileId: string) => {
    try {
      const res = await fetch(`${API_URL}/ingestion/preview/${fileId}?user_id=${user.uid}`);
      const data = await res.json();
      setPreviewData(data);
      setShowPreview(true);
    } catch (e) { notify("Erreur preview", "error"); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 h-[calc(100vh-80px)] flex flex-col font-sans relative">
      
      {/* --- SECTION DEBUG : TES IDENTIFIANTS --- */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <User className="w-4 h-4 text-blue-400" />
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">User UID</span>
              <span className="text-[10px] font-mono text-slate-300 truncate">{user?.uid}</span>
            </div>
          </div>
          <button onClick={() => copyToClipboard(user?.uid || "", "UID")} className="p-2 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg transition-all"><Copy className="w-3.5 h-3.5"/></button>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <Key className="w-4 h-4 text-yellow-500" />
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Auth Token (JWT)</span>
              <span className="text-[10px] font-mono text-slate-300 truncate">{token}</span>
            </div>
          </div>
          <button onClick={() => copyToClipboard(token, "Token")} className="p-2 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg transition-all"><Copy className="w-3.5 h-3.5"/></button>
        </div>
      </div>

      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-black text-slate-800 tracking-tighter flex items-center gap-2 italic">
                <Terminal className="w-6 h-6 text-slate-800" /> SOLUFUSE <span className="text-blue-600 underline">ENGINE</span>
            </h1>
            <button onClick={() => setCloudEnabled(!cloudEnabled)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-sm ${cloudEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {cloudEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {cloudEnabled ? "CLOUD SYNC ACTIVE" : "RAM ONLY MODE"}
            </button>
        </div>
        <div className="flex gap-4 items-center">
            {loading && <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full"><Zap className="w-3 h-3 text-blue-500 animate-pulse"/><span className="text-[10px] font-bold text-blue-500 uppercase">{step}</span></div>}
            <button onClick={handleClearAll} className="text-slate-300 hover:text-red-500 transition-colors p-1"><XCircle className="w-6 h-6" /></button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 flex-1 overflow-hidden">
        {/* DROPZONE */}
        <div className="col-span-1 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-6 hover:bg-slate-50 cursor-pointer group transition-all" onClick={() => !loading && fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => e.target.files && processFile(e.target.files[0])} />
            <div className="p-4 bg-slate-100 rounded-full group-hover:bg-blue-100 transition-all"><Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all" /></div>
            <span className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Inyect in RAM</span>
        </div>

        {/* FILE LIST */}
        <div className="col-span-3 bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-slate-50/50 px-8 py-4 border-b flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                <div className="w-1/2">Live Memory Files</div>
                <div className="w-1/4 text-center">Sync Status</div>
                <div className="w-1/4 text-right">Actions</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {files.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-10 italic">
                        <HardDrive className="w-16 h-16 mb-4" />
                        <span className="text-sm font-bold uppercase tracking-[0.3em]">Buffer empty</span>
                    </div>
                ) : (
                    files.map(f => (
                        <div key={f.id} className="flex items-center p-4 hover:bg-slate-50/80 rounded-2xl border border-transparent hover:border-slate-100 transition-all mb-3 shadow-sm bg-white">
                            <div className="w-1/2 flex items-center gap-4 min-w-0">
                                <div className="p-3 bg-slate-900 rounded-xl flex-shrink-0 shadow-lg"><FileCode className="w-5 h-5 text-blue-400" /></div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold text-slate-800 truncate tracking-tight">{f.original_name}</span>
                                    <span className="text-[9px] text-slate-400 font-mono uppercase font-bold">Memory Address: <span className="text-blue-500">{f.id.substring(0,8)}</span></span>
                                </div>
                            </div>
                            <div className="w-1/4 flex justify-center">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${f.cloud_synced ? 'bg-green-50 border-green-100 text-green-600' : 'bg-yellow-50 border-yellow-100 text-yellow-600 animate-pulse'}`}>
                                    {f.cloud_synced ? <Cloud className="w-3 h-3"/> : <Zap className="w-3 h-3"/>}
                                    <span className="text-[8px] font-black uppercase tracking-tighter">{f.cloud_synced ? 'Secure Cloud' : 'RAM Only (Sync 5s)'}</span>
                                </div>
                            </div>
                            <div className="w-1/4 flex justify-end gap-2 pr-2">
                                <button onClick={() => handlePreview(f.id)} className="p-2.5 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-xl text-slate-400 transition-all shadow-sm"><Eye className="w-4 h-4"/></button>
                                <button onClick={() => handleDelete(f.id)} className="p-2.5 bg-slate-50 hover:bg-red-600 hover:text-white rounded-xl text-slate-400 transition-all shadow-sm"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      {/* INSPECTOR MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-12">
            <div className="bg-[#0d1117] rounded-[2rem] shadow-2xl w-full max-w-6xl h-full flex flex-col overflow-hidden border border-slate-800">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"/>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"/>
                      <div className="w-3 h-3 bg-green-500 rounded-full"/>
                      <span className="ml-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
                        <Terminal className="w-4 h-4"/> Memory Inspector // {previewData?.source_file}
                      </span>
                    </div>
                    <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-500 hover:text-white"><X className="w-8 h-8" /></button>
                </div>
                <div className="flex-1 overflow-auto p-10 font-mono text-blue-300 text-[12px] leading-relaxed custom-scrollbar selection:bg-blue-500/30">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(previewData, null, 2)}</pre>
                </div>
            </div>
        </div>
      )}

      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({...toast, show:false})} />}
    </div>
  );
}
