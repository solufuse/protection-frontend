import { useEffect, useState, useRef } from 'react';
import { Copy, ShieldCheck, Trash2, RefreshCw, Upload, FileText, Database } from 'lucide-react';

interface FilesProps {
  user: any;
}

export default function Files({ user }: FilesProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- TOOLS ---
  const getAuthToken = async () => {
    if (!user) return null;
    return await user.getIdToken(true);
  };

  const copyToken = async () => {
      const token = await getAuthToken();
      if(token) {
          navigator.clipboard.writeText(token);
          alert("Token copié !");
      }
  };

  const testApi = async () => {
      const token = await getAuthToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';
      try {
          const res = await fetch(`${apiUrl}/session/details`, {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          if(res.ok) alert("✅ API Connectée");
          else alert(`❌ Erreur API: ${res.status}`);
      } catch(e) { alert("❌ API Injoignable"); }
  };

  // --- ACTIONS ---
  const fetchSession = async () => {
    if (!user) return;
    setLoading(true);
    try {
        const token = await getAuthToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';
        const res = await fetch(`${apiUrl}/session/details`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) setData(await res.json());
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSession(); }, [user]);

  const handleUpload = async (e: any) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((file: any) => formData.append('files', file));

    try {
        const token = await getAuthToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';
        const res = await fetch(`${apiUrl}/session/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (res.ok) await fetchSession();
        else alert("Erreur upload");
    } catch (err) { alert("Erreur réseau"); } 
    finally {
        setUploading(false);
        if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (filename: string) => {
      if(!user || !confirm(`Supprimer ${filename} ?`)) return;
      try {
        const token = await getAuthToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';
        await fetch(`${apiUrl}/session/file/${encodeURIComponent(filename)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchSession();
      } catch(e) { alert("Erreur: " + e); }
  };

  const handleClearAll = async () => {
      if(!user || !confirm("TOUT supprimer ?")) return;
      try {
        const token = await getAuthToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';
        const res = await fetch(`${apiUrl}/session/clear`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) fetchSession();
        else alert(`Erreur Backend ${res.status}`);
      } catch(e) { alert("Erreur: " + e); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 h-[calc(100vh-80px)] flex flex-col">
      
      {/* HEADER FIXE */}
      <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-800">RAM Manager</h1>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded-full">
                {data?.file_count || 0} fichiers
            </span>
        </div>
        
        <div className="flex gap-2">
            <button onClick={testApi} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold flex items-center gap-1 border border-indigo-100">
                <ShieldCheck className="w-3 h-3" /> API
            </button>
            <button onClick={copyToken} className="px-2 py-1 bg-slate-50 text-slate-600 rounded text-[10px] font-bold flex items-center gap-1 border border-slate-200">
                <Copy className="w-3 h-3" /> Token
            </button>
            <button onClick={fetchSession} className="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 text-[10px] font-bold text-slate-600 flex items-center gap-1">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {data?.files?.length > 0 && (
                <button onClick={handleClearAll} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-[10px] font-bold flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> VIDER
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 overflow-hidden min-h-0">
        
        {/* COLONNE GAUCHE : UPLOAD (Fixe) */}
        <div className="md:col-span-1 flex flex-col h-full">
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white border-2 border-dashed border-slate-300 rounded-lg h-full max-h-40 md:max-h-full flex flex-col justify-center items-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
                <input type="file" multiple ref={fileInputRef} onChange={handleUpload} className="hidden" />
                <div className="mb-2 p-2 bg-blue-100 rounded-full group-hover:scale-110 transition-transform">
                    {uploading ? <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" /> : <Upload className="w-5 h-5 text-blue-600" />}
                </div>
                <span className="text-xs font-bold text-slate-600">Ajouter</span>
                <span className="text-[10px] text-slate-400 mt-1">.zip, .xlsx...</span>
            </div>
        </div>

        {/* COLONNE DROITE : LISTE (Scrollable) */}
        <div className="md:col-span-3 bg-white rounded border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
            
            {/* EN-TÊTE TABLEAU (Fixe) */}
            <div className="bg-slate-50 border-b border-slate-200 px-2 py-1.5 grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase flex-shrink-0">
                <div className="col-span-9">Nom du fichier</div>
                <div className="col-span-2 text-right">Taille</div>
                <div className="col-span-1 text-center">Act.</div>
            </div>

            {/* CORPS TABLEAU (Scrollable) */}
            <div className="overflow-y-auto flex-1 p-0 custom-scrollbar">
                {data?.files && data.files.length > 0 ? (
                    <table className="min-w-full">
                        <tbody className="divide-y divide-slate-50">
                            {data.files.map((file: any, idx: number) => (
                                <tr key={idx} className="hover:bg-blue-50 transition-colors group">
                                    {/* NOM */}
                                    <td className="w-[75%] px-2 py-0.5 text-[11px] text-slate-700 font-medium truncate max-w-0" title={file.filename || file.name}>
                                        <div className="flex items-center gap-1.5">
                                            <FileText className="w-3 h-3 text-slate-300 flex-shrink-0" />
                                            <span className="truncate">{file.filename || file.name}</span>
                                        </div>
                                    </td>
                                    
                                    {/* TAILLE */}
                                    <td className="w-[16%] px-2 py-0.5 text-right text-[10px] text-slate-400 font-mono">
                                        {file.size ? (file.size / 1024).toFixed(1) + " KB" : "-"}
                                    </td>
                                    
                                    {/* BIN */}
                                    <td className="w-[9%] px-1 py-0.5 text-center">
                                        <button 
                                            onClick={() => handleDelete(file.filename || file.name)}
                                            className="text-[9px] font-bold text-slate-300 hover:text-red-500 hover:bg-red-50 px-1.5 py-0.5 rounded transition-all"
                                        >
                                            BIN
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <p className="text-xs">Aucun fichier.</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
