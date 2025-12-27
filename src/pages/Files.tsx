import { useEffect, useState, useRef } from 'react';
import { 
  Upload, Trash2, FileText, XCircle, HardDrive, 
  Eye, X, Download, FileJson, FileSpreadsheet, 
  RefreshCw, Archive 
} from 'lucide-react';
import { auth } from '../firebase';
import Toast from '../components/Toast';

// --- TYPES ---
interface SessionFile {
  path: string;
  filename: string;
  size: number;
  content_type: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export default function Files({ user }: { user: any }) {
  // --- STATE MANAGEMENT ---
  const [files, setFiles] = useState<SessionFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [token, setToken] = useState<string>("");
  
  // Toast Notification State
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' as 'success' | 'error' });
  
  // Ref for hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API URL from environment variables
  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";

  // --- HELPERS ---
  const notify = (msg: string, type: 'success' | 'error' = 'success') => 
    setToast({ show: true, msg, type });

  // Format bytes to human readable string (KB, MB)
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --- AUTH & INITIAL FETCH ---
  useEffect(() => {
    const init = async () => {
      if (user) {
        const t = await user.getIdToken();
        setToken(t);
        fetchFiles(t);
      }
    };
    init();
  }, [user]);

  // --- API ACTIONS ---

  /**
   * Fetches the list of files currently in the user's session (RAM/Disk).
   * Endpoint: GET /session/details
   */
  const fetchFiles = async (authToken: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/session/details`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error(error);
      notify("Error loading files", "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Uploads selected files to the backend session.
   * Endpoint: POST /session/upload
   */
  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    if (!token) return notify("Auth missing", "error");

    setUploading(true);
    const formData = new FormData();
    Array.from(fileList).forEach(file => {
      formData.append('files', file);
    });

    try {
      const res = await fetch(`${API_URL}/session/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) throw new Error("Upload failed");
      notify(`${fileList.length} files uploaded`);
      fetchFiles(token); // Refresh list
    } catch (error) {
      notify("Upload error", "error");
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * Deletes a single file from the session.
   * Endpoint: DELETE /session/file/{path}
   */
  const handleDelete = async (path: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      const res = await fetch(`${API_URL}/session/file/${path}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Delete failed");
      
      setFiles(prev => prev.filter(f => f.path !== path));
      notify("File deleted");
    } catch (error) {
      notify("Could not delete file", "error");
    }
  };

  /**
   * Clears the entire session storage for the user.
   * Endpoint: DELETE /session/clear
   */
  const handleClearSession = async () => {
    if (!confirm("This will remove ALL files from your session. Continue?")) return;
    try {
      const res = await fetch(`${API_URL}/session/clear`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Clear failed");
      setFiles([]);
      notify("Session cleared");
    } catch (error) {
      notify("Error clearing session", "error");
    }
  };

  /**
   * Downloads a file converted to specific format or raw.
   * Endpoint: GET /ingestion/download/{format}?filename=...
   */
  const handleDownload = async (filename: string, format: 'xlsx' | 'json') => {
    try {
      const res = await fetch(`${API_URL}/ingestion/download/${format}?filename=${encodeURIComponent(filename)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Download failed");
      }

      // Create blob link to trigger download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Backend handles extension replacement, but we ensure it here
      const cleanName = filename.replace(/\.(si2s|mdb|lf1s)$/i, "");
      a.download = `${cleanName}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      notify(`Downloaded as ${format.toUpperCase()}`);
    } catch (error: any) {
      notify(error.message, "error");
    }
  };

  /**
   * Downloads all supported files as a ZIP archive.
   * Endpoint: GET /ingestion/download-all/{format}
   */
  const handleDownloadAll = async (format: 'xlsx' | 'json') => {
    try {
      const res = await fetch(`${API_URL}/ingestion/download-all/${format}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Batch download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solufuse_export_${format}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      notify("No convertible files found", "error");
    }
  };

  /**
   * Previews the content of a SI2S/DB file.
   * Endpoint: GET /ingestion/preview
   */
  const handlePreview = async (filename: string) => {
    try {
      const res = await fetch(`${API_URL}/ingestion/preview?filename=${encodeURIComponent(filename)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Preview failed");
      }

      const data = await res.json();
      setPreviewData(data);
      setShowPreview(true);
    } catch (error: any) {
      notify(error.message, "error");
    }
  };

  // --- RENDER ---
  return (
    <div className="max-w-7xl mx-auto px-6 py-6 h-[calc(100vh-80px)] flex flex-col font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-blue-600" />
            SESSION MANAGER
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Temporary Storage & Conversion Engine
          </p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => fetchFiles(token)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="Refresh List">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          {files.length > 0 && (
            <>
              <div className="h-8 w-px bg-slate-200 mx-2"></div>
              <button onClick={() => handleDownloadAll('xlsx')} className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors border border-green-200">
                <FileSpreadsheet className="w-4 h-4" /> ZIP XLSX
              </button>
              <button onClick={() => handleDownloadAll('json')} className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg text-xs font-bold transition-colors border border-yellow-200">
                <FileJson className="w-4 h-4" /> ZIP JSON
              </button>
              <div className="h-8 w-px bg-slate-200 mx-2"></div>
              <button onClick={handleClearSession} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors border border-red-200">
                <XCircle className="w-4 h-4" /> CLEAR ALL
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
        
        {/* LEFT COLUMN: UPLOAD ZONE */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <div 
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`
              flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 cursor-pointer transition-all group
              ${uploading ? 'bg-slate-50 border-slate-300 opacity-50' : 'border-blue-200 hover:bg-blue-50/50 hover:border-blue-400'}
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              onChange={(e) => handleUpload(e.target.files)} 
            />
            
            <div className="bg-white p-4 rounded-full shadow-lg mb-4 group-hover:scale-110 transition-transform">
              <Upload className={`w-8 h-8 ${uploading ? 'text-slate-400 animate-bounce' : 'text-blue-600'}`} />
            </div>
            
            <span className="text-sm font-black text-slate-700 uppercase tracking-widest text-center">
              {uploading ? "UPLOADING..." : "UPLOAD FILES"}
            </span>
            <span className="text-[10px] text-slate-400 font-bold mt-2 text-center">
              Support: .SI2S, .LF1S, .MDB, .JSON
            </span>
          </div>
          
          {/* Stats Widget */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Storage Usage</h3>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black">{files.length}</span>
              <span className="text-sm font-medium text-slate-400 mb-1">Files</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(files.length * 5, 100)}%` }}></div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FILE LIST */}
        <div className="col-span-12 lg:col-span-9 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden">
          {/* Table Header */}
          <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <div className="w-6/12">Filename</div>
            <div className="w-2/12">Size</div>
            <div className="w-4/12 text-right">Actions (Convert & Manage)</div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {files.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                <Archive className="w-16 h-16 text-slate-400" />
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Session Empty</span>
              </div>
            ) : (
              files.map((file, idx) => {
                const isConvertible = /\.(si2s|lf1s|mdb)$/i.test(file.filename);
                
                return (
                  <div key={idx} className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-all group border border-transparent hover:border-slate-100 mb-1">
                    
                    {/* Name & Icon */}
                    <div className="w-6/12 flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate" title={file.filename}>
                        {file.filename}
                      </span>
                    </div>

                    {/* Size */}
                    <div className="w-2/12 text-xs font-mono text-slate-400">
                      {formatBytes(file.size)}
                    </div>

                    {/* Actions */}
                    <div className="w-4/12 flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      
                      {/* Conversion Actions (Only if convertible) */}
                      {isConvertible && (
                        <>
                          <button onClick={() => handleDownload(file.filename, 'xlsx')} className="p-1.5 hover:bg-green-100 text-slate-400 hover:text-green-700 rounded transition-colors" title="Convert to Excel">
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDownload(file.filename, 'json')} className="p-1.5 hover:bg-yellow-100 text-slate-400 hover:text-yellow-700 rounded transition-colors" title="Convert to JSON">
                            <FileJson className="w-4 h-4" />
                          </button>
                          <div className="w-px h-4 bg-slate-200 my-auto mx-1"></div>
                        </>
                      )}

                      {/* Standard Actions */}
                      {isConvertible && (
                        <button onClick={() => handlePreview(file.filename)} className="p-1.5 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded transition-colors" title="Preview Data">
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      
                      {!isConvertible && (
                         <button className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded transition-colors" title="Download Raw">
                           <Download className="w-4 h-4" />
                         </button>
                      )}

                      <button onClick={() => handleDelete(file.path)} className="p-1.5 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* --- PREVIEW MODAL --- */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-slate-800 uppercase tracking-tight text-sm">
                  Data Preview: {previewData?.filename}
                </span>
              </div>
              <button onClick={() => setShowPreview(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content (JSON Viewer Style) */}
            <div className="flex-1 overflow-auto p-6 bg-slate-900 text-xs font-mono">
              <pre className="text-green-400 whitespace-pre-wrap">
                {JSON.stringify(previewData?.tables || previewData, null, 2)}
              </pre>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-white flex justify-end gap-2">
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors">
                CLOSE
              </button>
              <button onClick={() => { handleDownload(previewData.filename, 'xlsx'); setShowPreview(false); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors">
                DOWNLOAD XLSX
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
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
