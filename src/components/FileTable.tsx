
// [structure:root] : Table Component for Files
// [context:flow] : Displays files list with checkboxes, single-line dates, and actions.

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
  sortConfig: { key: SortKey; order: SortOrder };
  onSort: (key: SortKey) => void;
  searchTerm: string;
  onOpenLink: (type: string, filename: string) => void;
  onDelete: (path: string) => void;
  formatBytes: (bytes: number) => string;
  selectedFiles: Set<string>;
  onToggleSelect: (path: string) => void;
  onSelectAll: (checked: boolean) => void;
}

export default function FileTable({
  files, sortConfig, onSort, searchTerm, 
  onOpenLink, onDelete, formatBytes,
  selectedFiles, onToggleSelect, onSelectAll
}: FileTableProps) {
  
  // [decision:logic] : Determine if all visible files are selected
  const allSelected = files.length > 0 && files.every(f => selectedFiles.has(f.path));

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full text-left font-bold border-collapse">
        {/* Header */}
        <thead className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-[#161b22]/90 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
          <tr>
            {/* [decision:logic] : Master Checkbox (Select All) */}
            <th className="py-2 px-3 w-8 text-center" onClick={(e) => e.stopPropagation()}>
                <input 
                    type="checkbox" 
                    checked={allSelected} 
                    onChange={(e) => { e.stopPropagation(); onSelectAll(e.target.checked); }}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
            </th>
            <th className="py-2 px-3 font-bold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 group" onClick={() => onSort('filename')}>
                <div className="flex items-center gap-1">FILENAME {sortConfig.key === 'filename' && <Icons.ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
            </th>
            <th className="py-2 px-3 font-bold w-32 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={() => onSort('uploaded_at')}>
                 <div className="flex items-center gap-1">DATE {sortConfig.key === 'uploaded_at' && <Icons.ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
            </th>
            <th className="py-2 px-3 w-24 font-bold text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={() => onSort('size')}>
                 <div className="flex items-center justify-center gap-1">SIZE {sortConfig.key === 'size' && <Icons.ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
            </th>
            <th className="py-2 px-3 text-right w-48 font-bold">Actions</th>
          </tr>
        </thead>
        
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-[10px]">
          {files.length === 0 ? (
            <tr><td colSpan={5} className="py-20 text-center text-slate-300 dark:text-slate-600 italic"><Icons.Archive className="w-10 h-10 mx-auto mb-3 opacity-50" /><span className="block opacity-70">{searchTerm ? "No matches found" : "No files in this context"}</span></td></tr>
          ) : (
            files.map((file) => { // [!] FIX: Removed unused 'i' argument
               const isConvertible = /\.(si2s|lf1s|mdb|json)$/i.test(file.filename);
               // [!] [CRITICAL] : Fallback to filename if path is missing to ensure unique ID
               const uniqueId = file.path || file.filename;
               const isSelected = selectedFiles.has(uniqueId);
               
               return (
                <Fragment key={uniqueId}>
                    <tr className={`group transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                      {/* Checkbox Row */}
                      <td className="px-3 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={(e) => { e.stopPropagation(); onToggleSelect(uniqueId); }}
                            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                      </td>
                      
                      <td className="px-3 py-1.5"><div className="flex items-center gap-2"><Icons.FileText className={`w-3.5 h-3.5 ${isConvertible ? 'text-blue-500' : 'text-slate-400 dark:text-slate-600'}`} /><span className="truncate max-w-[280px] text-slate-700 dark:text-slate-300" title={file.filename}>{file.filename}</span></div></td>
                      
                      {/* [FIX] Whitespace-nowrap enforces single line for dates */}
                      <td className="px-3 py-1.5 text-slate-400 dark:text-slate-500 font-mono text-[9px] whitespace-nowrap">
                          <div className="flex items-center gap-1"><Icons.Calendar className="w-3 h-3 text-slate-300 dark:text-slate-600"/> {file.uploaded_at || "-"}</div>
                      </td>
                      
                      <td className="px-3 py-1.5 text-slate-400 dark:text-slate-500 font-mono text-[9px] text-center">{formatBytes(file.size)}</td>
                      
                      <td className="px-3 py-1.5 text-right">
                          <div className="flex justify-end gap-1.5 items-center opacity-80 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => onOpenLink('raw', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700 transition-colors" title="Download Raw"><Icons.FileDown className="w-3 h-3"/> <span className="text-[9px]">RAW</span></button>
                              {isConvertible && (
                              <>
                                <button onClick={() => onOpenLink('xlsx', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 hover:bg-green-100 dark:bg-green-900/10 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded border border-green-200 dark:border-green-900/50 transition-colors" title="Download XLSX"><Icons.FileSpreadsheet className="w-3 h-3"/> <span className="text-[9px]">XLSX</span></button>
                                <button onClick={() => onOpenLink('json_tab', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-900/50 transition-colors" title="Open in new Tab"><Icons.ExternalLink className="w-3 h-3"/> <span className="text-[9px]">OPEN</span></button>
                              </>
                              )}
                              <button onClick={() => onDelete(file.path)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 rounded transition-colors ml-1"><Icons.Trash className="w-3.5 h-3.5"/></button>
                          </div>
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
