import { Fragment } from 'react';
import { Icons } from '../../icons';

// Add 'type' to SessionFile interface
export interface SessionFile {
  path: string;
  filename: string;
  size: number;
  uploaded_at?: string;
  content_type: string;
  type: 'file' | 'folder'; // NEW: Differentiate between files and folders
}

export type SortKey = 'filename' | 'uploaded_at' | 'size' | 'type';
export type SortOrder = 'asc' | 'desc';

interface FileTableProps {
  files: SessionFile[];
  loading?: boolean;
  error?: string | null;
  sortConfig: { key: SortKey; order: SortOrder };
  onSort: (key: SortKey) => void;
  selectedFiles: Set<string>;
  setSelectedFiles: (selected: Set<string>) => void;
  onPathChange?: (path: string) => void; 
  starredFiles: Set<string>;
  onToggleStar: (path: string) => void;
  hasWriteAccess?: boolean;
  readOnly?: boolean;
  onRowClick?: (file: SessionFile) => void;
}

export default function FileTable({
  files,
  loading = false,
  error = null,
  sortConfig, 
  onSort,
  selectedFiles, 
  setSelectedFiles,
  onPathChange,
  starredFiles, 
  onToggleStar,
  hasWriteAccess = false,
  readOnly = false,
  onRowClick
}: FileTableProps) {
  
    const effectiveWriteAccess = hasWriteAccess && !readOnly;

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

  const handleToggleSelect = (path: string) => {
      const newSet = new Set(selectedFiles);
      if (newSet.has(path)) newSet.delete(path);
      else newSet.add(path);
      setSelectedFiles(newSet);
  };

  const handleSelectAll = (checked: boolean) => {
      if (checked) setSelectedFiles(new Set(files.map(f => f.path)));
      else setSelectedFiles(new Set());
  };

  const handleRowDoubleClick = (file: SessionFile) => {
    if (file.type === 'folder' && onPathChange) {
      onPathChange(file.path);
    }
  };

  const handleRowClick = (file: SessionFile) => {
      if (onRowClick) onRowClick(file);
  }
  
  const allSelected = files.length > 0 && selectedFiles.size === files.length;

  if (loading) {
      return (
          <div className="flex-1 flex items-center justify-center h-40 text-slate-400">
              <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="text-xs">Loading...</span>
              </div>
          </div>
      );
  }

  if (error) {
      return (
           <div className="flex-1 flex items-center justify-center h-40 text-red-500">
              <div className="flex flex-col items-center gap-2">
                  <Icons.AlertTriangle className="w-8 h-8" />
                  <span className="text-xs font-semibold">{error}</span>
              </div>
          </div>
      )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full text-left font-semibold border-collapse">
        <thead className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="py-2 px-3 w-8 text-center">
                <input 
                    type="checkbox" 
                    checked={allSelected} 
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={!effectiveWriteAccess}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                />
            </th>
            <th className="py-2 px-1 w-6 text-center"></th>
            <th className="py-2 px-3 cursor-pointer hover:text-blue-600" onClick={() => onSort('filename')}>Name {sortConfig.key === 'filename' && <Icons.ArrowUpDown size={12} className="inline"/>}</th>
            <th className="py-2 px-3 w-32 cursor-pointer hover:text-blue-600" onClick={() => onSort('uploaded_at')}>Date {sortConfig.key === 'uploaded_at' && <Icons.ArrowUpDown size={12} className="inline"/>}</th>
            <th className="py-2 px-3 w-24 text-center cursor-pointer hover:text-blue-600" onClick={() => onSort('size')}>Size {sortConfig.key === 'size' && <Icons.ArrowUpDown size={12} className="inline"/>}</th>
          </tr>
        </thead>
        
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {files.length === 0 ? (
            <tr><td colSpan={5} className="py-20 text-center text-slate-400 dark:text-slate-600"><Icons.Archive className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>This folder is empty.</p></td></tr>
          ) : (
            files.map((file) => {
               const isSelected = selectedFiles.has(file.path);
               const isStarred = starredFiles.has(file.path);
               
               return (
                <Fragment key={file.path}>
                    <tr 
                        onDoubleClick={() => handleRowDoubleClick(file)}
                        onClick={() => handleRowClick(file)}
                        className={`group transition-colors select-none ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'} ${file.type === 'folder' ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <td className="px-3 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => handleToggleSelect(file.path)}
                            disabled={!effectiveWriteAccess}
                            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                          />
                      </td>

                      <td className="px-1 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => onToggleStar(file.path)}
                            className={`p-1 rounded-full transition-all ${isStarred ? 'text-yellow-400 hover:text-yellow-500' : 'text-slate-300 dark:text-slate-600 opacity-20 group-hover:opacity-100 hover:!opacity-100 hover:text-yellow-400'}`}
                          >
                             <Icons.Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-current' : ''}`} />
                          </button>
                      </td>
                      
                      <td className="px-3 py-1.5 font-semibold">
                        <div className="flex items-center gap-2">
                            {file.type === 'folder' ? <Icons.Folder className="w-4 h-4 text-blue-500" /> : <Icons.File className="w-4 h-4 text-slate-500" />}
                            <span className="truncate max-w-xs text-slate-700 dark:text-slate-300" title={file.filename}>{file.filename}</span>
                        </div>
                      </td>
                      
                      <td className="px-3 py-1.5 text-slate-500 text-[11px]">
                          {file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : '-'}
                      </td>
                      
                      <td className="px-3 py-1.5 text-slate-500 text-[11px] text-center">
                        {file.type === 'file' ? formatBytes(file.size) : ''}
                      </td>
                    </tr>
                </Fragment>
               );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
