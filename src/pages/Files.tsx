import { useEffect, useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';

interface FilesProps {
  user: any;
}

export default function Files({ user }: FilesProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSession = async () => {
    if (!user) return;
    setLoading(true);
    try {
        const token = await user.getIdToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';
        const res = await fetch(`${apiUrl}/session/details`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) setData(await res.json());
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSession(); }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestion des Fichiers</h1>
            <p className="text-slate-500">Fichiers actuellement chargés dans votre session RAM Backend.</p>
        </div>
        <button onClick={fetchSession} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {data?.files && data.files.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nom du fichier</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Taille</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {data.files.map((file: any, idx: number) => (
                        <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 flex items-center gap-3">
                                <FileText className="w-4 h-4 text-blue-500" /> {file.filename}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">{file.content_type}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : (
            <div className="p-12 text-center text-slate-500">
                <p>Aucun fichier en mémoire.</p>
                <p className="text-sm mt-2">Allez dans "Loadflow" pour en uploader.</p>
            </div>
        )}
      </div>
    </div>
  );
}
