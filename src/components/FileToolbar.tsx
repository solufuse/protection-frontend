import { useRef } from 'react';
import { Icons } from '../icons';

interface FileToolbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fileCount: number;
  activeProjectId: string | null;
  onShowMembers: () => void;
  onClear: () => void;
  uploading: boolean;
  onUpload: (files: FileList | null) => void;
}

export default function FileToolbar({
  searchTerm,
  setSearchTerm,
  fileCount,
  activeProjectId,
  onShowMembers,
  onClear,
  uploading,
  onUpload
}: FileToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex justify-between items-center p-2 bg-slate-50 border-b border-slate-100 gap-4">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative flex-1 max-w-xs">
          <Icons.Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search files..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-8 pr-2 py-1.5 text-[10px] border border-slate-200 rounded focus:outline-none focus:border-blue-400 text-slate-600" 
          />
        </div>
        <span className="text-[9px] text-slate-400 font-bold">{fileCount} FILES</span>
        {activeProjectId && (
          <button onClick={onShowMembers} className="flex items-center gap-1 ml-2 bg-white hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-500 hover:text-blue-600 font-bold transition-colors">
            <Icons.Users className="w-3.5 h-3.5" /> TEAM
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          onChange={(e) => onUpload(e.target.files)} 
        />
        <button onClick={onClear} className="flex items-center gap-1 bg-white hover:bg-red-50 px-2 py-1 rounded border border-slate-200 text-slate-500 hover:text-red-500 font-bold transition-colors">
          <Icons.Trash className="w-3 h-3" /> CLEAR
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={uploading} 
          className="flex items-center gap-1 text-[9px] font-bold bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors shadow-sm"
        >
          {uploading ? <Icons.Refresh className="w-3 h-3 animate-spin"/> : <Icons.UploadCloud className="w-3 h-3"/>} 
          {uploading ? "UPLOADING..." : "UPLOAD"}
        </button>
      </div>
    </div>
  );
}
