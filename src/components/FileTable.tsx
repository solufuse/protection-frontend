
// [structure:root] : Table Component for Files
// [context:flow] : Displays files list with checkboxes, stars, single-line dates, and actions.

import { Fragment } from 'react';
import { Icons } from '../icons';

export interface SessionFile {
  path: string;
  filename: string;
  size: number;
  uploaded_at?: string;
  content_type: string;
}

export type SortKey = 'filename' | 'uploaded_at' | 'size';
export type SortOrder = 'asc' | 'desc';

interface FileTableProps {
  files: SessionFile[];
  loading?: boolean;
  sortConfig: { key: SortKey; order: SortOrder };
  handleSort?: (key: SortKey) => void;
  onSort?: (key: SortKey) => void;
  searchTerm?: string;
  onOpenLink?: (type: string, filename: string) => void;
  onDelete?: (path: string) => void; // Made optional for ReadOnly mode
  onBulkDelete?: (paths: string[]) => void;
  formatBytes?: (bytes: number) => string;
  selectedFiles: Set<string>;
  setSelectedFiles?: (selected: Set<string>) => void;
  onToggleSelect?: (path: string) => void;
  onSelectAll?: (checked: boolean) => void;
  starredFiles: Set<string>;
  toggleStar?: (path: string) => void;
  onToggleStar?: (path: string) => void;
  readOnly?: boolean;
  onRowClick?: (file: SessionFile) => void;
}

export default function FileTable({
  files, 
  loading = false,
  sortConfig, 
  onSort,
  handleSort,
  searchTerm = "", 
  onOpenLink, 
  onDelete, 
  formatBytes,
  selectedFiles, 
  onToggleSelect, 
  onSelectAll,
  setSelectedFiles,
  starredFiles, 
  onToggleStar,
  toggleStar,
  readOnly = false,
  onRowClick
}: FileTableProps) {
  
  // Normalize Props for backward compatibility
  const _onSort = onSort || handleSort || (() => {});
  const _onToggleStar = onToggleStar || toggleStar || (() => {});
  const _formatBytes = formatBytes || ((bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  });

  // Handle Selection Logic inside if not provided (though props suggest external control)
  const handleToggleSelect = (path: string) => {
      if (onToggleSelect) {
          onToggleSelect(path);
      } else if (setSelectedFiles) {
          const newSet = new Set(selectedFiles);
          if (newSet.has(path)) newSet.delete(path);
          else newSet.add(path);
          setSelectedFiles(newSet);
      }
  };

  const handleSelectAll = (checked: boolean) => {
      if (onSelectAll) {
          onSelectAll(checked);
      } else if (setSelectedFiles) {
          if (checked) setSelectedFiles(new Set(files.map(f => f.path || f.filename)));
          else setSelectedFiles(new Set());
      }
  };
  
  const allSelected = files.length > 0 && files.every(f => selectedFiles.has(f.path || f.filename));

  if (loading) {
      return (
          <div className="flex-1 flex items-center justify-center h-40 text-slate-400">
              <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="text-xs">Loading files...</span>
              </div>
          </div>
      );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full text-left font-bold border-collapse">
        <thead className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-[#161b22]/90 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
          <tr>
            <th className="py-2 px-3 w-8 text-center" onClick={(e) => e.stopPropagation()}>
                <input 
                    type="checkbox" 
                    checked={allSelected} 
                    onChange={(e) => { e.stopPropagation(); handleSelectAll(e.target.checked); }}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
            </th>
            <th className="py-2 px-1 w-6 text-center"></th>
            
            <th className="py-2 px-3 font-bold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 group" onClick={() => _onSort('filename')}>
                <div className="flex items-center gap-1">FILENAME {sortConfig.key === 'filename' && <Icons.ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
            </th>
            <th className="py-2 px-3 font-bold w-32 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={() => _onSort('uploaded_at')}>
                 <div className="flex items-center gap-1">DATE {sortConfig.key === 'uploaded_at' && <Icons.ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
            </th>
            <th className="py-2 px-3 w-24 font-bold text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={() => _onSort('size')}>
                 <div className="flex items-center justify-center gap-1">SIZE {sortConfig.key === 'size' && <Icons.ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
            </th>
            <th className="py-2 px-3 text-right w-64 font-bold">{readOnly ? 'Status' : 'Actions'}</th>
          </tr>
        </thead>
        
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-[10px]">
          {files.length === 0 ? (
            <tr><td colSpan={6} className="py-20 text-center text-slate-300 dark:text-slate-600 italic"><Icons.Archive className="w-10 h-10 mx-auto mb-3 opacity-50" /><span className="block opacity-70">{searchTerm ? "No matches found" : "No files available"}</span></td></tr>
          ) : (
            files.map((file) => {
               // [!] FIX: Removed 'json' from convertible regex. Added 'mdb' as it is a DB format.
               const isConvertible = /\.(si2s|lf1s|mdb)$/i.test(file.filename);
               const uniqueId = file.path || file.filename;
               const isSelected = selectedFiles.has(uniqueId);
               const isStarred = starredFiles.has(uniqueId);
               
               return (
                <Fragment key={uniqueId}>
                    <tr 
                        className={`group transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20' : isStarred ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'} ${onRowClick ? 'cursor-pointer' : ''}`}
                        onClick={() => onRowClick && onRowClick(file)}
                    >
                      <td className="px-3 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={(e) => { e.stopPropagation(); handleToggleSelect(uniqueId); }}
                            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                      </td>

                      <td className="px-1 py-1.5 text-center">
                          <button 
                            onClick={(e) => { e.stopPropagation(); _onToggleStar(uniqueId); }}
                            className={`p-1 rounded-full transition-all ${isStarred ? 'text-yellow-400 hover:text-yellow-500' : 'text-slate-300 dark:text-slate-600 hover:text-yellow-400'}`}
                          >
                             <Icons.Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-current' : ''}`} />
                          </button>
                      </td>
                      
                      <td className="px-3 py-1.5"><div className="flex items-center gap-2"><Icons.FileText className={`w-3.5 h-3.5 ${isConvertible ? 'text-blue-500' : 'text-slate-400 dark:text-slate-600'}`} /><span className="truncate max-w-[280px] text-slate-700 dark:text-slate-300" title={file.filename}>{file.filename}</span></div></td>
                      
                      <td className="px-3 py-1.5 text-slate-400 dark:text-slate-500 font-mono text-[9px] whitespace-nowrap">
                          <div className="flex items-center gap-1"><Icons.Calendar className="w-3 h-3 text-slate-300 dark:text-slate-600"/> {file.uploaded_at || "-"}</div>
                      </td>
                      
                      <td className="px-3 py-1.5 text-slate-400 dark:text-slate-500 font-mono text-[9px] text-center">{_formatBytes(file.size)}</td>
                      
                      <td className="px-3 py-1.5 text-right">
                          {!readOnly && (
                            <div className="flex justify-end gap-1.5 items-center opacity-80 group-hover:opacity-100 transition-opacity">
                                {onOpenLink && (
                                    <button onClick={() => onOpenLink('raw', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700 transition-colors" title="Download Raw"><Icons.FileDown className="w-3 h-3"/> <span className="text-[9px]">RAW</span></button>
                                )}
                                
                                {isConvertible && onOpenLink && (
                                <>
                                    <button onClick={() => onOpenLink('xlsx', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 hover:bg-green-100 dark:bg-green-900/10 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded border border-green-200 dark:border-green-900/50 transition-colors" title="Download XLSX"><Icons.FileSpreadsheet className="w-3 h-3"/> <span className="text-[9px]">XLSX</span></button>
                                    
                                    <button onClick={() => onOpenLink('json', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/10 dark:hover:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded border border-yellow-200 dark:border-yellow-900/50 transition-colors" title="Download JSON"><Icons.FileJson className="w-3 h-3"/> <span className="text-[9px]">JSON</span></button>
                                    
                                    <button onClick={() => onOpenLink('json_tab', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-900/50 transition-colors" title="Open in new Tab"><Icons.ExternalLink className="w-3 h-3"/> <span className="text-[9px]">OPEN</span></button>
                                </>
                                )}
                                
                                {onDelete && (
                                    <button onClick={() => onDelete(file.path)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 rounded transition-colors ml-1"><Icons.Trash className="w-3.5 h-3.5"/></button>
                                )}
                            </div>
                          )}
                          {readOnly && (
                              <span className="text-xs text-slate-400">{isSelected ? 'Selected' : ''}</span>
                          )}
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
