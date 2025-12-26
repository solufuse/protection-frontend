import { useEffect, useState, useRef } from 'react';
import { RefreshCw, Upload, Cloud, Trash2, Download, FileJson, FileSpreadsheet, Eye, FileArchive } from 'lucide-react';
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
  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";

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
      if (step === 'done') notify("Traitement terminé avec succès !");
  }, [error, step]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (docId: string) => {
      if(!confirm("Supprimer définitivement ce fichier ?")) return;
      try {
          await deleteDoc(doc(db, "users", user.uid, "configurations", docId));
          notify("Fichier supprimé");
      } catch(e) { notify("Erreur suppression", "error"); }
  };

  const handleDownloadZip = (format: 'xlsx' | 'json') => {
      if (!user) return;
      notify(`Génération du ZIP (${format.toUpperCase()})...`);
      window.location.href = `${API_URL}/ingestion/download-all/${format}?user_id=${user.uid}`;
  };

  const handlePreview = (file: any) => {
      alert(`Fichier: ${file.source_type}\nID: ${file.id}\nCréé le: ${new Date(file.created_at.seconds * 1000).toLocaleString()}`);
  };

  // Helper pour l'icône selon le type
  const getIcon = (type: string) => {
      if (type?.includes('mdb')) return <Cloud className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />;
      if (type?.includes('zip')) return <FileArchive className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />;
      return <FileSpreadsheet className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 h-[calc(100vh-80px)] flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-2 flex-shrink-0 text-[11px]">
        <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-600" />
            <h1 className="text-sm font-bold text-slate-800">Gestion de Session (Cloud)</h1>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-mono px-1.5 rounded-full">
                {files.length}
            </span>
        </div>
        
        <div className="flex gap-2 items-center">
           {loading && <span className="text-blue-600 font-bold animate-pulse uppercase text-[10px] mr-2">Status: {step}...</span>}
           
           <button onClick={() => handleDownloadZip('json')} className="flex items-center gap-1 bg-white border border-slate-300 text-slate-600 px-2 py-1 rounded hover:bg-slate-50 text-[10px] font-bold transition-colors shadow-sm" title="Sauvegarder la session en JSON">
                <FileJson className="w-3.5 h-3.5" /> ZIP JSON
           </button>
           <button onClick={() => handleDownloadZip('xlsx')} className="flex items-center gap-1 bg-green-600 border border-green-700 text-white px-2 py-1 rounded hover:bg-green-700 text-[10px] font-bold transition-colors shadow-sm" title="Tout exporter en Excel">
                <Download className="w-3.5 h-3.5" /> ZIP EXCEL
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1 overflow-hidden min-h-0">
        
        {/* COLONNE GAUCHE : UPLOAD */}
        <div className="md:col-span-1 flex flex-col h-full">
            <div onClick={() => !loading && fileInputRef.current?.click()} className={`bg-white border border-dashed border-slate-300 rounded h-full max-h-32 md:max-h-full flex flex-col justify-center items-center cursor-pointer transition-colors group ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 hover:bg-blue-50'}`}>
                {/* AJOUT DE .zip DANS ACCEPT */}
                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".si2s,.mdb,.sqlite,.lf1s,.zip" disabled={loading} />
                <div className="mb-1 text-blue-500 group-hover:scale-110 transition-transform">
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-2">
                    {loading ? "Traitement..." : "Importer un fichier"}
                </span>
                <span className="text-[9px] text-slate-400 mt-1">(SI2S, MDB, ZIP)</span>
            </div>
        </div>

        {/* COLONNE DROITE : LISTE */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded flex flex-col overflow-hidden h-full shadow-sm text-[11px]">
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase flex-shrink-0">
                <span className="pl-1">Fichiers en Session</span><span className="pr-8">Actions</span>
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
                                                <span className="text-[10px] text-slate-700 truncate leading-tight">
                                                    {file.source_type?.toUpperCase() || "FICHIER INCONNU"}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-normal truncate">
                                                    {file.created_at?.seconds ? new Date(file.created_at.seconds * 1000).toLocaleString() : ""}
                                                </span>
                                            </div>
                                            {file.is_large_file && <span className="text-[8px] bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded ml-auto flex-shrink-0">HEAVY</span>}
                                        </div>
                                    </td>
                                    <td className="px-3 py-0 align-middle w-20 text-right whitespace-nowrap">
                                        <button onClick={() => handlePreview(file)} className="text-slate-400 hover:text-blue-600 transition-colors p-1" title="Voir infos">
                                            <Eye className="w-3.5 h-3.5"/>
                                        </button>
                                        <button onClick={() => handleDelete(file.id)} className="text-slate-400 hover:text-red-600 transition-colors p-1" title="Supprimer">
                                            <Trash2 className="w-3.5 h-3.5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 uppercase tracking-widest gap-2">
                        <Cloud className="w-8 h-8 opacity-20" />
                        <p className="text-[10px] font-bold">Session Vide</p>
                    </div>
                )}
            </div>
        </div>
      </div>
      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
