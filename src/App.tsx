import { useState, useRef } from 'react';
import ConfigGenerator from './components/ConfigGenerator';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { Upload, FileText, Download, LogOut, Loader2, Zap } from 'lucide-react';

function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [files, setFiles] = useState<FileList | null>(null);
  const [finalConfigJson, setFinalConfigJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  auth.onAuthStateChanged((u) => setUser(u));

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (error) { console.error("Erreur login", error); }
  };

  const handleLogout = () => auth.signOut();

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
        
        // Etape 1: Lancer le calcul
        const runRes = await fetch(`${apiUrl}/loadflow/run-win`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        if (!runRes.ok) throw new Error("Erreur lors de l'analyse");
        
        // Etape 2: Télécharger le ZIP
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

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold mb-8 text-slate-800 flex items-center justify-center gap-3">
            <Zap className="w-10 h-10 text-blue-600" /> Solufuse
          </h1>
          <button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center gap-3 mx-auto">
            <span className="bg-white text-blue-600 font-bold px-2 rounded">G</span>
            Se connecter avec Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold flex items-center gap-2 text-slate-900">
            <Zap className="w-8 h-8 text-blue-600 fill-blue-600" /> Solufuse Loadflow
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-full">
              <div className="w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold text-sm">
                {user.displayName ? user.displayName[0] : 'U'}
              </div>
              <span className="text-sm font-medium text-slate-600 hidden sm:block">{user.displayName}</span>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
               <h2 className="font-bold text-xl mb-6 flex items-center gap-2">
                 <Upload className="w-6 h-6 text-blue-600" /> 1. Fichiers Sources
               </h2>
               
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group"
               >
                 <input 
                   type="file" 
                   multiple 
                   ref={fileInputRef}
                   onChange={(e) => setFiles(e.target.files)} 
                   className="hidden" 
                 />
                 <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                   <FileText className="w-8 h-8" />
                 </div>
                 <p className="text-slate-600 font-medium">Cliquez pour ajouter vos fichiers</p>
               </div>

               {files && files.length > 0 && (
                 <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
                   <p className="text-sm font-bold text-slate-700 mb-2">{files.length} fichier(s)</p>
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

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
                <button 
                    onClick={handleRun}
                    disabled={loading || !files}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
                >
                    {loading ? (
                        <> <Loader2 className="animate-spin" /> Analyse en cours... </>
                    ) : (
                        <> 🚀 Lancer l'Analyse & Télécharger ZIP </>
                    )}
                </button>

                {downloadUrl && (
                    <div className="mt-6 animate-fade-in">
                        <p className="text-green-600 font-bold mb-3 flex items-center justify-center gap-2">
                            <span className="bg-green-100 p-1 rounded-full">✅</span> Succès !
                        </p>
                        <a 
                            href={downloadUrl} 
                            download="gagnants_loadflow.zip"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-md"
                        >
                            <Download className="w-5 h-5" /> Télécharger (.ZIP)
                        </a>
                    </div>
                )}
            </div>
          </div>

          <ConfigGenerator onConfigChange={setFinalConfigJson} />

        </div>
      </main>
    </div>
  );
}

export default App;
