import Toast from '../components/Toast';
import { useEffect, useState, useRef } from 'react';
import { RefreshCw, Upload, FileText, Database } from 'lucide-react';

interface FilesProps {
  user: any;
}

export default function Files({ user }: FilesProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
  };

  const getAuthToken = async () => {
    if (!user) return null;
    return await user.getIdToken(true);
  };

  const copyToken = async () => {
      const token = await getAuthToken();
      if(token) {
          navigator.clipboard.writeText(token);
          notify("Token copied !");
      }
  };

  const testApi = async () => {
      const token = await getAuthToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';
      try {
          const res = await fetch(`${apiUrl}/session/details`, {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          if(res.ok) notify("✅ API Connected");
          else notify(`❌ Error: ${res.status}`, "error");
      } catch(e) { notify("❌ API Unreachable", "error"); }
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
            notify("Upload Successful");
        }
        else notify("Upload Error", "error");
    } catch (err) { notify("Network Error", "error"); } 
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
        notify("File Deleted");
      } catch(e) { notify("Error", "error"); }
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
        if(res.ok) {
            fetchSession();
            notify("Session Cleared");
        }
        else notify("Error", "error");
      } catch(e) { notify("Error", "error"); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-2 flex-shrink-0 text-[11px]">
        <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h1 className="text-sm font-bold text-slate-800">RAM Manager</h1>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-mono px-1.5 rounded-full">
                {data?.file_count || 0}
            </span>
        </div>
        <div className="flex gap-2">
            <button onClick={testApi} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold border border-indigo-100 uppercase">Test API</button>
            <button onClick={copyToken} className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-[10px] font-bold border border-slate-200 uppercase tracking-tighter">Token</button>
            <button onClick={fetchSession} className="px-2 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-50 text-[10px] font-bold text-slate-600">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {data?.files?.length > 0 && (
                <button onClick={handleClearAll} className="px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 text-[10px] font-bold uppercase">VIDER</button>
            )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1 overflow-hidden min-h-0">
        <div className="md:col-span-1 flex flex-col h-full">
            <div onClick={() => fileInputRef.current?.click()} className="bg-white border border-dashed border-slate-300 rounded h-full max-h-32 md:max-h-full flex flex-col justify-center items-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                <input type="file" multiple ref={fileInputRef} onChange={handleUpload} className="hidden" />
                <div className="mb-1 text-blue-500 group-hover:scale-110 transition-transform">{uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}</div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Add Files</span>
            </div>
        </div>
        <div className="md:col-span-3 bg-white border border-slate-200 rounded flex flex-col overflow-hidden h-full shadow-sm text-[11px]">
            <div className="bg-slate-50 border-b border-slate-200 px-2 py-1 flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase flex-shrink-0">
                <span className="pl-1">File Name</span><span className="pr-8">Action</span>
            </div>
            <div className="overflow-y-auto flex-1 p-0 custom-scrollbar bg-white">
                {data?.files && data.files.length > 0 ? (
                    <table className="w-full border-collapse font-bold">
                        <tbody>
                            {data.files.map((file: any, idx: number) => (
                                <tr key={idx} className="hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 h-5">
                                    <td className="px-2 py-0 align-middle w-full max-w-0">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <FileText className="w-2.5 h-2.5 text-slate-300 flex-shrink-0" />
                                            <span className="text-[10px] text-slate-700 truncate leading-none pt-0.5" title={file.filename || file.name}>{file.filename || file.name}</span>
                                            <span className="text-[9px] text-slate-400 font-mono ml-auto whitespace-nowrap pl-2">{file.size ? (file.size / 1024).toFixed(0) + "KB" : ""}</span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-0 align-middle w-10 text-center">
                                        <button onClick={() => handleDelete(file.filename || file.name)} className="text-[9px] font-bold text-slate-300 hover:text-red-600 transition-colors leading-none">BIN</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <div className="h-full flex flex-col items-center justify-center text-slate-300 uppercase tracking-widest"><p className="text-[10px] font-bold">Empty</p></div>}
            </div>
        </div>
      </div>
      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
