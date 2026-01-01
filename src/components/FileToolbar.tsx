
import { Icons } from '../icons';

interface FileToolbarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  fileCount: number;
  activeProjectId: string | null;
  onShowMembers: () => void;
  onClear: () => void;
  uploading: boolean;
  onUpload: (files: FileList | null) => void;
}

export default function FileToolbar({
  searchTerm, setSearchTerm, fileCount, activeProjectId,
  onShowMembers, onClear, uploading, onUpload
}: FileToolbarProps) {
  return (
    <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap justify-between items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
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
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{fileCount} ITEMS</span>
      </div>

      <div className="flex gap-2">
        {activeProjectId && (
            <button onClick={onShowMembers} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded font-bold transition-all text-[10px]">
                <Icons.Users className="w-3.5 h-3.5" /> MEMBERS
            </button>
        )}
        <button onClick={onClear} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded font-bold transition-all text-[10px]">
            <Icons.Trash className="w-3.5 h-3.5" /> CLEAR
        </button>
        <label className={`flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded font-black shadow-sm cursor-pointer transition-all text-[10px] ${uploading ? 'opacity-50 cursor-wait' : ''}`}>
            <input type="file" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} disabled={uploading} />
            {uploading ? <Icons.Refresh className="w-3.5 h-3.5 animate-spin"/> : <Icons.UploadCloud className="w-3.5 h-3.5 fill-current" />}
            {uploading ? "UPLOADING..." : "UPLOAD"}
        </label>
      </div>
    </div>
  );
}
