import { useEffect, useState, useRef, DragEvent } from 'react';
import { 
  Trash2, FileText, HardDrive, 
  FileSpreadsheet, FileJson, FileDown,
  RefreshCw, Archive, Key, UploadCloud, Eye, EyeOff, ChevronDown, ChevronRight
} from 'lucide-react';
import Toast from '../components/Toast';

interface SessionFile {
  path: string;
  filename: string;
  size: number;
  content_type: string;
}

export default function Files({ user }: { user: any }) {
  const [files, setFiles] = useState<SessionFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Gestion de l'affichage inline (Accordion)
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [token, setToken] = useState<string>("");
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' as 'success' | 'error' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";

  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    if (user) user.getIdToken().then((t: string) => { setToken(t); fetchFiles(t); });
  }, [user]);

  const fetchFiles = async (authToken: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/session/details`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setFiles(data.files || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || !token) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(fileList).forEach(f => formData.append('files', f));

    try {
      const res = await fetch(`${API_URL}/session/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      if (!res.ok) throw new Error();
      notify(`${fileList.length} Fichier(s) uploadé(s)`);
      fetchFiles(token);
    } catch (e) { notify("Echec Upload", "error"); } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDelete = async (path: string) => {
    if (!confirm("Supprimer ce fichier ?")) return;
    try {
      await fetch(`${API_URL}/session/file/${path}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      setFiles(p => p.filter(f => f.path !== path));
      if (expandedFileId === path.split('/').pop()) setExpandedFileId(null);
      notify("Fichier supprimé");
    } catch (e) { notify("Erreur suppression", "error"); }
  };

  const handleClear = async () => {
    if (!confirm("Tout supprimer ?")) return;
    try {
      await fetch(`${API_URL}/session/clear`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      setFiles([]);
      setExpandedFileId(null);
      notify("Session vidée");
    } catch (e) { notify("Erreur", "error"); }
  };

  // --- DOWNLOAD HANDLERS ---

  const handleDownloadRaw = async (filename: string) => {
    try {
        const res = await fetch(`${API_URL}/session/download?filename=${encodeURIComponent(filename)}`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (!res.ok) throw new Error("Fichier introuvable");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        a.click();
        notify("Téléchargement RAW lancé");
    } catch (e) { notify("Erreur Download RAW", "error"); }
  };

  const handleDownloadConverted = async (filename: string, format: 'xlsx' | 'json') => {
    try {
      const res = await fetch(`${API_URL}/ingestion/download/${format}?filename=${encodeURIComponent(filename)}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error("Conversion impossible");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = filename.replace(/\.(si2s|mdb|lf1s)$/i, "");
      a.download = `${cleanName}.${format}`;
      a.click();
      notify(`Téléchargement ${format.toUpperCase()} lancé`);
    } catch (e) { notify("Erreur Conversion", "error"); }
  };

  // --- INLINE PREVIEW LOGIC ---

  const togglePreview = async (filename: string) => {
    // Si déjà ouvert, on ferme
    if (expandedFileId === filename) {
        setExpandedFileId(null);
        setPreviewData(null);
        return;
    }

    // Sinon, on ouvre et on charge
    setExpandedFileId(filename);
    setPreviewLoading(true);
    setPreviewData(null);

    try {
      const res = await fetch(`${API_URL}/ingestion/preview?filename=${encodeURIComponent(filename)}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error("Preview indisponible");
      const data = await res.json();
      setPreviewData(data);
    } catch (e) { 
        notify("Impossible de prévisualiser ce fichier", "error");
        setExpandedFileId(null); // On referme si erreur
    } finally {
        setPreviewLoading(false);
    }
  };
  
  const handleCopyToken = () => {
    if (!token) return notify("Token indisponible", "error");
    navigator.clipboard.writeText(token);
    notify("Token copié !");
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const onDrop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files); };

  return (
    <div className="max-w-6xl mx-auto px-6 py-4 text-[11px] font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
        <div className="flex flex-col">
          <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Session Manager</label>
          <h1 className="text-lg font-bold text-slate-800 uppercase flex items-center gap-2">
            RAM STORAGE <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-200">{files.length} ITEMS</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopyToken} className="flex items-center gap-1 bg-white hover:bg-yellow-50 px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:text-yellow-600 font-bold transition-colors">
            <Key className="w-3.5 h-3.5" /> TOKEN
          </button>
          <button onClick={() => fetchFiles(token)} className="flex items-center gap-1 bg-white hover:bg-slate-50 px-3 py-1.5 rounded border border-slate-300 text-slate-600 font-bold transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> REFRESH
          </button>
          <button onClick={handleClear} className="flex items-center gap-1 bg-white hover:bg-red-50 px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:text-red-600 font-bold transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> CLEAR ALL
          </button>
        </div>
      </div>

      <div className="w-full">
          <div 
            className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden font-bold relative transition-all"
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          >
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-blue-50/90 border-2 border-dashed border-blue-500 rounded flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-200">
                    <UploadCloud className="w-12 h-12 text-blue-600 mb-2" />
                    <span className="text-lg font-black text-blue-700 uppercase tracking-widest">Drop files here to upload</span>
                </div>
            )}

            <div className="flex justify-between items-center p-2 bg-slate-50 border-b border-slate-100">
              <h2 className="font-bold flex items-center gap-1.5 text-slate-700 uppercase">
                 <HardDrive className="w-3.5 h-3.5 text-blue-600" /> Active Files
              </h2>
              <div className="flex gap-2">
                 <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => handleUpload(e.target.files)} />
                 <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-[9px] font-bold bg-white text-blue-600 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-50 transition-colors">
                    {uploading ? "UPLOADING..." : "+ UPLOAD FILES"}
                 </button>
              </div>
            </div>
            
            <div className="p-0 min-h-[300px] max-h-[70vh] overflow-y-auto">
              <table className="w-full text-left font-bold border-collapse">
                <thead className="text-[9px] text-slate-400 uppercase tracking-widest bg-slate-50/50 sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-3 border-b border-slate-100 font-bold w-8"></th>
                    <th className="py-2 px-3 border-b border-slate-100 font-bold">Filename</th>
                    <th className="py-2 px-3 border-b border-slate-100 w-24 font-bold text-center">Size</th>
                    <th className="py-2 px-3 border-b border-slate-100 text-right w-64 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {files.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-slate-300 italic">
                        <Archive className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <span className="block opacity-70">Session is empty</span>
                        <span className="text-[9px] font-normal opacity-50">Drag files here to start</span>
                      </td>
                    </tr>
                  ) : (
                    files.map((file, i) => {
                       const isConvertible = /\.(si2s|lf1s|mdb)$/i.test(file.filename);
                       const isExpanded = expandedFileId === file.filename;
                       
                       return (
                        <>
                        <tr key={i} className={`group transition-colors ${isExpanded ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                          <td className="px-3 py-1 text-center">
                             {isConvertible && (
                                <button onClick={() => togglePreview(file.filename)} className="text-slate-400 hover:text-blue-600">
                                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
                                </button>
                             )}
                          </td>
                          <td className="px-3 py-1">
                            <div className="flex items-center gap-2">
                               <FileText className={`w-3.5 h-3.5 ${isConvertible ? 'text-blue-500' : 'text-slate-400'}`} />
                               <span className="truncate max-w-[300px] text-slate-700 text-[10px]" title={file.filename}>
                                 {file.filename}
                               </span>
                            </div>
                          </td>
                          <td className="px-3 py-1 text-slate-400 font-mono text-[9px] text-center">{formatBytes(file.size)}</td>
                          <td className="px-3 py-1 text-right">
                            <div className="flex justify-end gap-1.5 items-center">
                              
                              <button onClick={() => handleDownloadRaw(file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 transition-colors" title="Download Original">
                                <FileDown className="w-3 h-3"/> <span className="text-[9px]">RAW</span>
                              </button>

                              {isConvertible && (
                                <>
                                  <button onClick={() => handleDownloadConverted(file.filename, 'xlsx')} className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 hover:bg-green-100 text-green-700 rounded border border-green-200 transition-colors" title="Export to Excel">
                                    <FileSpreadsheet className="w-3 h-3"/> <span className="text-[9px]">XLSX</span>
                                  </button>
                                  <button onClick={() => handleDownloadConverted(file.filename, 'json')} className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded border border-yellow-200 transition-colors" title="Export to JSON">
                                    <FileJson className="w-3 h-3"/> <span className="text-[9px]">JSON</span>
                                  </button>
                                  
                                  {/* Bouton Preview (Oeil) */}
                                  <button onClick={() => togglePreview(file.filename)} className={`p-1 rounded transition-colors ${isExpanded ? 'text-blue-600 bg-blue-100' : 'hover:bg-blue-100 text-blue-600'}`} title="Preview Data">
                                    {isExpanded ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                                  </button>
                                </>
                              )}
                              
                              <button onClick={() => handleDelete(file.path)} className="p-1 hover:bg-red-100 text-red-500 rounded transition-colors ml-1" title="Delete">
                                <Trash2 className="w-3.5 h-3.5"/>
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* INLINE DATA PREVIEW ROW */}
                        {isExpanded && (
                            <tr>
                                <td colSpan={4} className="bg-slate-900 p-0">
                                    <div className="max-h-60 overflow-auto custom-scrollbar p-4 text-[10px] font-mono text-green-400">
                                        {previewLoading ? (
                                            <div className="flex items-center gap-2 text-slate-400 animate-pulse">
                                                <RefreshCw className="w-3 h-3 animate-spin"/> Loading data structure...
                                            </div>
                                        ) : previewData ? (
                                            <pre>{JSON.stringify(previewData.tables, null, 2)}</pre>
                                        ) : (
                                            <span className="text-red-400">Failed to load preview.</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                        </>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>

      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
