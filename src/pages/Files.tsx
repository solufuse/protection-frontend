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
          alert("Token copié dans le presse-papier !");
      }
  };

  const testApi = async () => {
      const token = await getAuthToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';
      try {
          const res = await fetch(`${apiUrl}/session/details`, {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          if(res.ok) alert("✅ API Connectée (Status 200)");
          else alert(`❌ Erreur API: ${res.status} ${res.statusText}`);
      } catch(e) { alert("❌ API Injoignable (Network Error)"); }
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
        
        console.log(`DELETE ${apiUrl}/session/clear`); // Debug
        
        const res = await fetch(`${apiUrl}/session/clear`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if(res.ok) {
            fetchSession();
        } else {
            alert(`Erreur Backend ${res.status} : La route /session/clear ne semble pas fonctionner.`);
        }
      } catch(e) { alert("Erreur technique: " + e); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      
      {/* HEADER & OUTILS */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-800">Gestionnaire RAM</h1>
        </div>
        
        <div className="flex flex-wrap gap-2">
            {/* Outils Admin */}
            <button onClick={testApi} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-bold flex items-center gap-1 hover:bg-indigo-100">
                <ShieldCheck className="w-3 h-3" /> Test API
            </button>
            <button onClick={copyToken} className="px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded text-xs font-bold flex items-center gap-1 hover:bg-slate-100">
                <Copy className="w-3 h-3" /> Token
            </button>
            
            <div className="w-px h-6 bg-slate-300 mx-2 hidden md:block"></div>

            {/* Actions Fichiers */}
            <button onClick={fetchSession} className="px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-1">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Actu.
            </button>
            
            {data?.files?.length > 0 && (
                <button onClick={handleClearAll} className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-bold flex items-center gap-1 shadow-sm">
                    <Trash2 className="w-3 h-3" /> TOUT VIDER
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* UPLOAD (Compact) */}
        <div className="md:col-span-1">
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white border-2 border-dashed border-slate-300 rounded-lg h-32 flex flex-col justify-center items-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
                <input type="file" multiple ref={fileInputRef} onChange={handleUpload} className="hidden" />
                <div className="mb-2 p-2 bg-blue-100 rounded-full group-hover:scale-110 transition-transform">
                    {uploading ? <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" /> : <Upload className="w-4 h-4 text-blue-600" />}
                </div>
                <span className="text-xs font-bold text-slate-600">Ajouter Fichiers</span>
                <span className="text-[9px] text-slate-400 mt-1">.zip, .xlsx, .json</span>
            </div>
        </div>

        {/* TABLEAU ULTRA COMPACT */}
        <div className="md:col-span-3">
            <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Fichiers en Session</span>
                    <span className="text-[10px] font-mono bg-slate-200 px-1.5 rounded text-slate-600">{data?.file_count || 0}</span>
                </div>
                
                {data?.files && data.files.length > 0 ? (
                    <table className="min-w-full divide-y divide-slate-100">
                        <tbody className="divide-y divide-slate-50">
                            {data.files.map((file: any, idx: number) => (
                                <tr key={idx} className="hover:bg-blue-50 transition-colors group">
                                    {/* ICONE + NOM */}
                                    <td className="px-3 py-1 text-xs text-slate-700 font-medium w-full flex items-center gap-2">
                                        <FileText className="w-3 h-3 text-slate-400" />
                                        <span className="truncate max-w-[200px] sm:max-w-xs" title={file.filename}>
                                            {file.filename || file.name}
                                        </span>
                                    </td>
                                    
                                    {/* TAILLE */}
                                    <td className="px-3 py-1 text-right text-[10px] text-slate-400 font-mono whitespace-nowrap">
                                        {file.size ? (file.size / 1024).toFixed(1) + " KB" : "-"}
                                    </td>
                                    
                                    {/* ACTION */}
                                    <td className="px-2 py-1 text-right w-10">
                                        <button 
                                            onClick={() => handleDelete(file.filename || file.name)}
                                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-8 text-center">
                        <p className="text-xs text-slate-400">Aucune donnée.</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
