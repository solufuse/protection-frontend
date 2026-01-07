
import { Icons } from '../icons';

interface FileToolbarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  fileCount: number;
  activeProjectId?: string | null;
  onShowMembers?: () => void;
  uploading?: boolean;
  onUpload?: (files: FileList | null) => void;
  // [!] [CRITICAL] : New Props for Bulk Actions
  selectedCount: number;
  onBulkDownload?: (type: 'raw' | 'xlsx' | 'json') => void;
  onBulkDelete?: () => void;
  readOnly?: boolean; // New prop for read-only mode (selector)
}

export default function FileToolbar({
  searchTerm, setSearchTerm, fileCount, activeProjectId,
  onShowMembers, uploading = false, onUpload,
  selectedCount, onBulkDownload, onBulkDelete,
  readOnly = false
}: FileToolbarProps) {
  return (
    <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap justify-between items-center gap-4 min-h-[50px]">
      
      {/* LEFT: Search or Bulk Status */}
      <div className="flex items-center gap-2 flex-1">
        {selectedCount > 0 && !readOnly ? (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2">
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800">
                    {selectedCount} SELECTED
                </span>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
                
                {onBulkDownload && (
                <div className="flex gap-1">
                    <button onClick={() => onBulkDownload('raw')} className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600"><Icons.FileDown className="w-3 h-3"/> RAW</button>
                    <button onClick={() => onBulkDownload('xlsx')} className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-green-600"><Icons.FileSpreadsheet className="w-3 h-3"/> XLSX</button>
                    <button onClick={() => onBulkDownload('json')} className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-yellow-600"><Icons.FileJson className="w-3 h-3"/> JSON</button>
                </div>
                )}
                
                {onBulkDelete && (
                <button onClick={onBulkDelete} className="ml-2 flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded text-[10px] font-bold text-red-600 dark:text-red-400 hover:bg-red-100"><Icons.Trash className="w-3 h-3"/> DELETE</button>
                )}
            </div>
        ) : (
            <>
                <div className="relative flex-1 max-w-md">
                <Icons.Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Filter files..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full pl-8 pr-2 py-1.5 text-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded focus:outline-none focus:border-blue-400 text-slate-600 dark:text-slate-300 placeholder-slate-400" 
                />
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{fileCount} ITEMS {readOnly && selectedCount > 0 ? `(${selectedCount} selected)` : ''}</span>
            </>
        )}
      </div>

      {/* RIGHT: Actions */}
      {!readOnly && (
      <div className="flex gap-2">
        {activeProjectId && onShowMembers && (
            <button onClick={onShowMembers} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded font-bold transition-all text-[10px]">
                <Icons.Users className="w-3.5 h-3.5" /> MEMBERS
            </button>
        )}
        {onUpload && (
        <label className={`flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded font-black shadow-sm cursor-pointer transition-all text-[10px] ${uploading ? 'opacity-50 cursor-wait' : ''}`}>
            <input type="file" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} disabled={uploading} />
            {uploading ? <Icons.Refresh className="w-3.5 h-3.5 animate-spin"/> : <Icons.Upload className="w-3.5 h-3.5" />}
            {uploading ? "UPLOADING..." : "UPLOAD"}
        </label>
        )}
      </div>
      )}
    </div>
  );
}
