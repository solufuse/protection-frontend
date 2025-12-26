import Toast from '../components/Toast';\nimport { useState, useRef } from 'react';
import ConfigGenerator from '../components/ConfigGenerator';
import { Upload, FileText, Download, Loader2 } from 'lucide-react';

interface LoadflowProps {
  user: any;
}

\n  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });\nexport default function Loadflow({ user }: LoadflowProps) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [finalConfigJson, setFinalConfigJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRun = async () => {
    if (!files || !finalConfigJson || !user) return;
    setLoading(true);
    setDownloadUrl(null);

    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));
    formData.append('config', finalConfigJson);

    try {
        const token = await user.getIdToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.solufuse.com';
        
        // 1. Run Analysis (Winners Only logic)
        const runRes = await fetch(`${apiUrl}/loadflow/run-win`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        if (!runRes.ok) throw new Error("Erreur lors de l'analyse Loadflow");
        
        // 2. Download L1Fs Export
        const zipRes = await fetch(`${apiUrl}/loadflow/export-l1fs`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!zipRes.ok) throw new Error("Erreur lors du téléchargement");

        const blob = await zipRes.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);
        
    } catch (e) {
        alert("Une erreur est survenue: " + e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Loadflow Analysis</h1>
        <p className="text-slate-500">Optimisation et calcul de flux de charge pour réseaux HTA/BT.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
          {/* Zone Upload */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
             <h2 className="font-bold text-xl mb-6 flex items-center gap-2">
               <Upload className="w-6 h-6 text-blue-600" /> 1. Fichiers Sources
             </h2>
             
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group"
             >
               <input type="file" multiple ref={fileInputRef} onChange={(e) => setFiles(e.target.files)} className="hidden" />
               <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                 <FileText className="w-8 h-8" />
               </div>
               <p className="text-slate-600 font-medium">Glissez vos fichiers ou cliquez ici</p>
             </div>

             {files && files.length > 0 && (
               <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
                 <p className="text-sm font-bold text-slate-700 mb-2">{files.length} fichier(s) sélectionné(s)</p>
                 <ul className="max-h-32 overflow-y-auto space-y-1 pr-2">
                   {Array.from(files).map((f, i) => (
                     <li key={i} className="text-xs text-slate-500 flex justify-between">
                       <span className="truncate">{f.name}</span>
                       <span className="whitespace-nowrap ml-2 text-slate-300">{(f.size/1024).toFixed(0)}KB</span>
                     </li>
                   ))}
                 </ul>
               </div>
             )}
          </div>

          {/* Bouton Action */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
              <button 
                  onClick={handleRun}
                  disabled={loading || !files}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
              >
                  {loading ? (<><Loader2 className="animate-spin" /> Analyse...</>) : (<> 🚀 Lancer Loadflow </>)}
              </button>

              {downloadUrl && (
                  <div className="mt-6 animate-fade-in">
                      <a href={downloadUrl} download="loadflow_result.zip" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-md">
                          <Download className="w-5 h-5" /> Télécharger Résultats (.ZIP)
                      </a>
                  </div>
              )}
          </div>
        </div>

        {/* Configurateur */}
        <ConfigGenerator onConfigChange={setFinalConfigJson} />
      </div>
    
      {toast.show && (
        <Toast 
          message={toast.msg} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })} 
        />
      )}
    </div>
  );
}
