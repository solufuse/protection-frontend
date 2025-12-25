import { useEffect, useState, useRef } from 'react';

interface FilesProps {
  user: any;
}

export default function Files({ user }: FilesProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- TOKEN HELPER ---
  const getAuthToken = async () => {
    if (!user) return null;
    return await user.getIdToken(true);
  };

  // --- FETCH DATA ---
  const fetchSession = async () => {
    if (!user) return;
    setLoading(true);
    try {
        const token = await getAuthToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';
        
        const res = await fetch(`${apiUrl}/session/details`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if(res.ok) {
            const jsonData = await res.json();
            console.log("Données reçues du Backend:", jsonData); // Pour debug dans la console F12
            setData(jsonData);
        }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSession(); }, [user]);

  // --- UPLOAD ---
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

  // --- DELETE ---
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

  // --- CLEAR ALL ---
  const handleClearAll = async () => {
      if(!user || !confirm("Tout vider ?")) return;
      try {
        const token = await getAuthToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';
        await fetch(`${apiUrl}/session/clear`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchSession();
      } catch(e) { alert("Erreur: " + e); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      
      {/* HEADER COMPACT */}
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h1 className="text-xl font-bold text-slate-800">Gestionnaire de Fichiers</h1>
        <div className="flex gap-2">
            <button 
                onClick={fetchSession} 
                className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 text-xs font-bold uppercase text-slate-600"
            >
                {loading ? "..." : "Actualiser"}
            </button>
            {data?.files?.length > 0 && (
                <button 
                    onClick={handleClearAll} 
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-bold uppercase"
                >
                    Tout Vider
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* ZONE UPLOAD (GAUCHE - PLUS PETITE) */}
        <div className="md:col-span-1">
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-colors h-full flex flex-col justify-center items-center"
            >
                <input type="file" multiple ref={fileInputRef} onChange={handleUpload} className="hidden" />
                <span className="text-blue-600 font-bold text-sm block mb-1">
                    {uploading ? "..." : "+ Ajouter"}
                </span>
                <span className="text-[10px] text-slate-400">.zip, .xlsx, .json</span>
            </div>
        </div>

        {/* LISTE FICHIERS (DROITE - TABLEAU COMPACT) */}
        <div className="md:col-span-3">
            <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
                {data?.files && data.files.length > 0 ? (
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Nom</th>
                                <th className="px-4 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Taille</th>
                                <th className="px-4 py-2 text-center text-[10px] font-bold text-slate-500 uppercase w-20">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {data.files.map((file: any, idx: number) => (
                                <tr key={idx} className="hover:bg-blue-50 transition-colors">
                                    {/* NOM DU FICHIER */}
                                    <td className="px-4 py-1.5 text-xs font-medium text-slate-700 break-all">
                                        {file.filename || file.name || "Sans nom"}
                                    </td>
                                    
                                    {/* TAILLE (Gestion du NaN) */}
                                    <td className="px-4 py-1.5 text-right text-xs text-slate-500 font-mono">
                                        {file.size ? (file.size / 1024).toFixed(1) + " KB" : "0 KB"}
                                    </td>
                                    
                                    {/* BOUTON BIN */}
                                    <td className="px-4 py-1.5 text-center">
                                        <button 
                                            onClick={() => handleDelete(file.filename || file.name)}
                                            className="text-[10px] font-bold text-red-500 hover:text-red-700 border border-red-200 bg-red-50 px-2 py-0.5 rounded"
                                        >
                                            BIN
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-8 text-center text-sm text-slate-400">
                        Aucun fichier en mémoire.
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
