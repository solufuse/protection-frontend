import { Icons } from '../../icons';
import { useState } from 'react';

interface FileToolbarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onUpload: (files: FileList | null) => void;
  onCreateFolder: (name: string) => void;
  onRefresh: () => void;
  onDelete: () => void;
  fileCount: number;
  selectedCount: number;
  hasWriteAccess: boolean;
}

export default function FileToolbar({
  searchTerm, 
  setSearchTerm, 
  onUpload,
  onCreateFolder,
  onRefresh,
  onDelete,
  fileCount,
  selectedCount,
  hasWriteAccess
}: FileToolbarProps) {
  
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState("");

  const handleCreateFolder = () => {
      if(folderName) onCreateFolder(folderName);
      setFolderName("");
      setShowNewFolder(false);
  }

  return (
    <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2 min-h-[50px] bg-slate-50 dark:bg-slate-900/70">
      
      <div className="flex items-center gap-2 flex-1">
        {selectedCount > 0 && hasWriteAccess ? (
            <div className="flex items-center gap-2 animate-in fade-in">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                    {selectedCount} selected
                </span>
                 <button onClick={onDelete} className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/50 rounded text-[10px] font-bold text-red-600 dark:text-red-400 hover:bg-red-200"><Icons.Trash className="w-3 h-3"/> Delete</button>
            </div>
        ) : (
            <div className="relative flex-1 max-w-xs">
                <Icons.Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 dark:text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Filter files..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
            </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{fileCount} items</span>
        <button onClick={onRefresh} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 transition-colors"><Icons.RefreshCw size={14}/></button>
        
        {hasWriteAccess && (
        <>
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            {showNewFolder ? (
                <div className="flex gap-1 animate-in fade-in">
                    <input 
                        type="text" 
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        placeholder="Folder name" 
                        className="px-2 py-1.5 text-xs border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    />
                    <button onClick={handleCreateFolder} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700">Create</button>
                    <button onClick={() => setShowNewFolder(false)} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><Icons.X size={14}/></button>
                </div>
            ) : (
                <button onClick={() => setShowNewFolder(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <Icons.FolderPlus size={14} /> New Folder
                </button>
            )}
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-bold cursor-pointer hover:bg-blue-700 transition-colors">
                <Icons.Upload size={14}/> Upload
                <input type="file" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
            </label>
        </>
        )}
      </div>
    </div>
  );
}
