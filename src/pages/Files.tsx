import { useEffect, useState, useRef } from 'react';

interface FilesProps {
  user: any;
}

export default function Files({ user }: FilesProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- GET TOKEN HELPER ---
  // Cette fonction récupère le token Firebase à coup sûr
  const getAuthToken = async () => {
    if (!user) return null;
    // true = Force le rafraîchissement si le token est vieux
    return await user.getIdToken(true);
  };

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

        if (res.ok) {
            await fetchSession();
        } else {
            alert("Erreur lors de l'upload");
        }
    } catch (err) {
        alert("Erreur réseau upload");
    } finally {
        setUploading(false);
        if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (filename: string) => {
      if(!user || !confirm("Supprimer " + filename + " ?")) return;
      try {
        const token = await getAuthToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';
        
        const res = await fetch(`${apiUrl}/session/file/${encodeURIComponent(filename)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if(res.ok) fetchSession();
        else alert("Erreur Backend: " + res.status);
        
      } catch(e) { alert("Erreur suppression: " + e); }
  };

  // --- FONCTION TOUT VIDER CORRIGÉE ---
  const handleClearAll = async () => {
      if(!user || !confirm("Voulez-vous vraiment TOUT supprimer ?")) return;
      
      try {
        // 1. On récupère le TOKEN FIREBASE
        const token = await getAuthToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';
        
        console.log("Envoi requête DELETE /clear avec token...");

        // 2. Appel au Backend
        const res = await fetch(`${apiUrl}/session/clear`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // 3. Gestion des erreurs précise
        if (res.ok) {
            await fetchSession();
            alert("✅ Mémoire vidée avec succès !");
        } else if (res.status === 404) {
            alert("❌ Erreur 404 : La route /session/clear n'existe pas sur le Backend. Il faut mettre à jour le Backend.");
        } else if (res.status === 401) {
            alert("❌ Erreur 401 : Token refusé ou expiré.");
        } else {
            alert("❌ Erreur Backend : " + res.status);
        }

      } catch(e) { 
          alert("Erreur technique : " + e); 
      }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestionnaire de Fichiers</h1>
            <p className="text-slate-500">Mémoire RAM du Backend</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={fetchSession} 
                className="px-4 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 text-sm font-medium"
            >
                {loading ? "..." : "Actualiser"}
            </button>
            
            {data?.files?.length > 0 && (
                <button 
                    onClick={handleClearAll} 
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-bold"
                >
                    Tout Vider
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h2 className="font-bold text-lg mb-4 text-slate-800">Ajouter</h2>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-colors"
                >
                    <input type="file" multiple ref={fileInputRef} onChange={handleUpload} className="hidden" />
                    <span className="text-blue-600 font-bold block mb-2">
                        {uploading ? "Envoi..." : "Cliquez pour uploader"}
                    </span>
                    <span className="text-xs text-slate-400">.zip, .json, .xlsx...</span>
                </div>
            </div>
        </div>

        <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {data?.files && data.files.length > 0 ? (
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nom</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Taille</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {data.files.map((file: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900 break-all">
                                        {file.filename}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-slate-500 font-mono">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => handleDelete(file.filename)}
                                            className="text-red-600 hover:text-red-800 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1 rounded text-xs font-bold uppercase tracking-wide transition-colors"
                                        >
                                            Bin
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center text-slate-500">
                        <p>Aucun fichier en mémoire.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
