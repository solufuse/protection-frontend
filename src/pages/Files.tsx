import { useEffect, useState, useRef } from 'react';
import { RefreshCw, Upload, FileText, Cloud, Trash2 } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
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

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
  };

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "users", user.uid, "configurations"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFiles(docs);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
      if (error) notify(error, 'error');
      if (step === 'done') notify("Fichier traité avec succès !");
  }, [error, step]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (docId: string) => {
      if(!confirm("Supprimer ce fichier du Cloud ?")) return;
      try {
          // CORRECTION ICI : doc() et non doc.id()
          await deleteDoc(doc(db, "users", user.uid, "configurations", docId));
          notify("Fichier supprimé");
      } catch(e) { notify("Erreur suppression", "error"); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-2 flex-shrink-0 text-[11px]">
        <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-600" />
            <h1 className="text-sm font-bold text-slate-800">Cloud Files</h1>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-mono px-1.5 rounded-full">
                {files.length}
            </span>
        </div>
        <div className="flex gap-2">
           {loading && <span className="text-blue-600 font-bold animate-pulse uppercase text-[10px]">Status: {step}...</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1 overflow-hidden min-h-0">
        <div className="md:col-span-1 flex flex-col h-full">
            <div onClick={() => !loading && fileInputRef.current?.click()} className={`bg-white border border-dashed border-slate-300 rounded h-full max-h-32 md:max-h-full flex flex-col justify-center items-center cursor-pointer transition-colors group ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 hover:bg-blue-50'}`}>
                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".si2s,.mdb,.sqlite" disabled={loading} />
                <div className="mb-1 text-blue-500 group-hover:scale-110 transition-transform">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    {loading ? "Processing..." : "Upload File"}
                </span>
            </div>
        </div>

        <div className="md:col-span-3 bg-white border border-slate-200 rounded flex flex-col overflow-hidden h-full shadow-sm text-[11px]">
            <div className="bg-slate-50 border-b border-slate-200 px-2 py-1 flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase flex-shrink-0">
                <span className="pl-1">File Source</span><span className="pr-8">Action</span>
            </div>
            <div className="overflow-y-auto flex-1 p-0 custom-scrollbar bg-white">
                {files.length > 0 ? (
                    <table className="w-full border-collapse font-bold">
                        <tbody>
                            {files.map((file) => (
                                <tr key={file.id} className="hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 h-8">
                                    <td className="px-2 py-0 align-middle w-full max-w-0">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <FileText className="w-2.5 h-2.5 text-slate-300 flex-shrink-0" />
                                            <span className="text-[10px] text-slate-700 truncate leading-none pt-0.5">
                                                {file.source_type?.toUpperCase() || "UNKNOWN"} 
                                                <span className="text-slate-400 font-normal ml-2">
                                                    {file.created_at?.seconds ? new Date(file.created_at.seconds * 1000).toLocaleDateString() : ""}
                                                </span>
                                            </span>
                                            {file.is_large_file && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1 rounded ml-auto">LARGE</span>}
                                        </div>
                                    </td>
                                    <td className="px-2 py-0 align-middle w-10 text-center">
                                        <button onClick={() => handleDelete(file.id)} className="text-slate-300 hover:text-red-600 transition-colors">
                                            <Trash2 className="w-3 h-3"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <div className="h-full flex flex-col items-center justify-center text-slate-300 uppercase tracking-widest"><p className="text-[10px] font-bold">No Files</p></div>}
            </div>
        </div>
      </div>
      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
