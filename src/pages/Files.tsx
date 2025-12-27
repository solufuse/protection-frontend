import { useEffect, useState, useRef } from 'react';
import { RefreshCw, Upload, Cloud, Trash2, Download, FileJson, FileSpreadsheet, FileArchive, FileCode, Key, XCircle, HardDrive } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useIngestion } from '../hooks/useIngestion';
import Toast from '../components/Toast';

interface FilesProps {
  user: any;
}

export default function Files({ user }: FilesProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success'|'error'}>({ show: false, msg: '', type: 'success' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { processFile, loading, step, error } = useIngestion(user?.uid);
  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "configurations"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
      if (error) notify(error, 'error');
      if (step === 'done') notify("Processing complete!");
  }, [error, step]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (docId: string) => {
      if(!confirm("Are you sure you want to delete this file?")) return;
      try {
          await deleteDoc(doc(db, "users", user.uid, "configurations", docId));
          notify("File deleted");
      } catch(e) { notify("Delete error", "error"); }
  };

  const handleClearAll = async () => {
      if (files.length === 0) return;
      if (!confirm("⚠️ WARNING: Delete ALL files in this session?")) return;
      try {
          const batch = writeBatch(db);
          files.forEach((file) => batch.delete(doc(db, "users", user.uid, "configurations", file.id)));
          await batch.commit();
          notify("🗑️ Session cleared!");
      } catch (e) { notify("Error clearing session", "error"); }
  };

  const handleDownloadGlobal = (format: 'xlsx' | 'json') => {
      if (!user) return;
      notify(`Generating ZIP (${format.toUpperCase()})...`);
      window.location.href = `${API_URL}/ingestion/download-all/${format}?user_id=${user.uid}`;
  };

  const handleDownloadSingle = (fileId: string, format: 'xlsx' | 'json') => {
      if (!user) return;
      window.open(`${API_URL}/ingestion/download/${fileId}/${format}?user_id=${user.uid}`, '_blank');
  };

  const handleCopyToken = async () => {
    if (!user) return;
    try {
        const token = await user.getIdToken(true);
        await navigator.clipboard.writeText(token);
        notify("🔑 Token copied to clipboard!");
    } catch (e) { notify("Token error", "error"); }
  };

  const getIcon = (type: string) => {
      const lower = type?.toLowerCase() || "";
      if (lower.includes('mdb')) return <Cloud className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />;
      if (lower.includes('zip')) return <FileArchive className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />;
      return <FileCode className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 h-[calc(100vh-80px)] flex flex-col font-sans">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-2 flex-shrink-0 text-[11px]">
        <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-600" />
            <h1 className="text-sm font-bold text-slate-800 tracking-tight">Session Manager</h1>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-mono px-1.5 rounded-full">{files.length}</span>
        </div>
        
        <div className="flex gap-2 items-center">
           {loading && <span className="text-blue-600 font-bold animate-pulse uppercase text-[10px] mr-2">Status: {step}...</span>}
           
           {files.length > 0 && (
               <button onClick={handleClearAll} className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-100 text-[10px] font-bold transition-colors shadow-sm mr-2">
                    <XCircle className="w-3.5 h-3.5" /> CLEAR ALL
               </button>
           )}

           <button onClick={handleCopyToken} className="flex items-center gap-1 bg-slate-800 text-white px-2 py-1 rounded hover:bg-slate-700 text-[10px] font-bold transition-colors shadow-sm mr-2">
                <Key className="w-3.5 h-3.5" /> API TOKEN
           </button>

           <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>

           <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">Export All:</span>
           <button onClick={() => handleDownloadGlobal('json')} className="flex items-center gap-1 bg-white border border-slate-300 text-slate-600 px-2 py-1 rounded hover:bg-slate-50 text-[10px] font-bold transition-colors shadow-sm" title="Download all files as JSON ZIP">
                <FileJson className="w-3.5 h-3.5" /> ZIP
           </button>
           <button onClick={() => handleDownloadGlobal('xlsx')} className="flex items-center gap-1 bg-green-600 border border-green-700 text-white px-2 py-1 rounded hover:bg-green-700 text-[10px] font-bold transition-colors shadow-sm" title="Download all files as Excel ZIP">
                <Download className="w-3.5 h-3.5" /> ZIP
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1 overflow-hidden min-h-0">
        
        {/* UPLOAD ZONE */}
        <div className="md:col-span-1 flex flex-col h-full">
            <div onClick={() => !loading && fileInputRef.current?.click()} className={`bg-white border border-dashed border-slate-300 rounded h-full flex flex-col justify-center items-center cursor-pointer transition-colors group ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 hover:bg-blue-50'}`}>
                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".si2s,.mdb,.sqlite,.lf1s,.zip,.json" disabled={loading} />
                <div className="mb-1 text-blue-500 group-hover:scale-110 transition-transform">
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-2">{loading ? "UPLOADING..." : "UPLOAD FILE"}</span>
                <span className="text-[9px] text-slate-400 mt-1">(Drag & Drop or Click)</span>
            </div>
        </div>

        {/* FILE LIST */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded flex flex-col overflow-hidden h-full shadow-sm text-[11px]">
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase flex-shrink-0">
                <span className="pl-1">Filename</span><span className="pr-8">Options</span>
            </div>
            <div className="overflow-y-auto flex-1 p-0 custom-scrollbar bg-white">
                {files.length > 0 ? (
                    <table className="w-full border-collapse font-bold">
                        <tbody>
                            {files.map((file) => (
                                <tr key={file.id} className="hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 h-10">
                                    <td className="px-3 py-0 align-middle w-full max-w-0">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            {getIcon(file.source_type)}
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-bold text-slate-700 truncate leading-tight" title={file.original_name}>{file.original_name}</span>
                                                <span className="text-[9px] text-slate-400 font-normal truncate">{file.source_type?.toUpperCase()} • {file.created_at?.seconds ? new Date(file.created_at.seconds * 1000).toLocaleDateString() : ""}</span>
                                            </div>
                                        </div>
                                    </td>
                                    {/* ACTIONS ZONE */}
                                    <td className="px-3 py-0 align-middle w-auto text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => handleDownloadSingle(file.id, 'json')} className="text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded p-1 transition-colors" title="Download as JSON">
                                                <FileJson className="w-3.5 h-3.5"/>
                                            </button>
                                            <button onClick={() => handleDownloadSingle(file.id, 'xlsx')} className="text-slate-400 hover:text-green-600 hover:bg-green-50 rounded p-1 transition-colors" title="Download as Excel">
                                                <FileSpreadsheet className="w-3.5 h-3.5"/>
                                            </button>
                                            
                                            <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>

                                            <button onClick={() => handleDelete(file.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors" title="Delete File">
                                                <Trash2 className="w-3.5 h-3.5"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 uppercase tracking-widest gap-2">
                        <Cloud className="w-8 h-8 opacity-20" />
                        <p className="text-[10px] font-bold">Empty Session</p>
                    </div>
                )}
            </div>
        </div>
      </div>
      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
