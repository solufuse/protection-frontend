
import { Fragment } from 'react';
import { Icons } from '../icons';
import FilePreview from './FilePreview';

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
  expandedFileId: string | null;
  onTogglePreview: (filename: string) => void;
  previewData: any;
  previewLoading: boolean;
  onOpenLink: (type: string, filename: string) => void;
  onDelete: (path: string) => void;
  formatBytes: (bytes: number) => string;
}

export default function FileTable({
  files, sortConfig, onSort, searchTerm, expandedFileId, onTogglePreview,
  previewData, previewLoading, onOpenLink, onDelete, formatBytes
}: FileTableProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full text-left font-bold border-collapse">
        {/* Header: Darker bg, subtle border */}
        <thead className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-[#161b22]/90 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
          <tr>
            <th className="py-2 px-3 font-bold w-8"></th>
            <th className="py-2 px-3 font-bold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 group" onClick={() => onSort('filename')}>
                <div className="flex items-center gap-1">FILENAME {sortConfig.key === 'filename' && <Icons.ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
            </th>
            <th className="py-2 px-3 font-bold w-32 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={() => onSort('uploaded_at')}>
                 <div className="flex items-center gap-1">DATE {sortConfig.key === 'uploaded_at' && <Icons.ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
            </th>
            <th className="py-2 px-3 w-24 font-bold text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={() => onSort('size')}>
                 <div className="flex items-center justify-center gap-1">SIZE {sortConfig.key === 'size' && <Icons.ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
            </th>
            <th className="py-2 px-3 text-right w-64 font-bold">Actions</th>
          </tr>
        </thead>
        
        {/* [FIX] Here is the fix: dark:divide-slate-800/50 removes the white lines */}
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-[10px]">
          {files.length === 0 ? (
            <tr><td colSpan={5} className="py-20 text-center text-slate-300 dark:text-slate-600 italic"><Icons.Archive className="w-10 h-10 mx-auto mb-3 opacity-50" /><span className="block opacity-70">{searchTerm ? "No matches found" : "No files in this context"}</span></td></tr>
          ) : (
            files.map((file, i) => {
               const isConvertible = /\.(si2s|lf1s|mdb|json)$/i.test(file.filename);
               const isExpanded = expandedFileId === file.filename;
               return (
                <Fragment key={i}>
                    <tr className={`group transition-colors ${isExpanded ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                      <td className="px-3 py-1.5 text-center">{isConvertible && (<button onClick={() => onTogglePreview(file.filename)} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">{isExpanded ? <Icons.ChevronDown className="w-3.5 h-3.5"/> : <Icons.ChevronRight className="w-3.5 h-3.5"/>}</button>)}</td>
                      <td className="px-3 py-1.5"><div className="flex items-center gap-2"><Icons.FileText className={`w-3.5 h-3.5 ${isConvertible ? 'text-blue-500' : 'text-slate-400 dark:text-slate-600'}`} /><span className="truncate max-w-[280px] text-slate-700 dark:text-slate-300" title={file.filename}>{file.filename}</span></div></td>
                      <td className="px-3 py-1.5 text-slate-400 dark:text-slate-500 font-mono text-[9px]"><div className="flex items-center gap-1"><Icons.Calendar className="w-3 h-3 text-slate-300 dark:text-slate-600"/> {file.uploaded_at || "-"}</div></td>
                      <td className="px-3 py-1.5 text-slate-400 dark:text-slate-500 font-mono text-[9px] text-center">{formatBytes(file.size)}</td>
                      <td className="px-3 py-1.5 text-right">
                          <div className="flex justify-end gap-1.5 items-center opacity-80 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => onOpenLink('raw', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700 transition-colors" title="Download Raw"><Icons.FileDown className="w-3 h-3"/> <span className="text-[9px]">RAW</span></button>
                              {isConvertible && (
                              <>
                                <button onClick={() => onOpenLink('xlsx', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 hover:bg-green-100 dark:bg-green-900/10 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded border border-green-200 dark:border-green-900/50 transition-colors" title="Download XLSX"><Icons.FileSpreadsheet className="w-3 h-3"/> <span className="text-[9px]">XLSX</span></button>
                                <button onClick={() => onOpenLink('json', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/10 dark:hover:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded border border-yellow-200 dark:border-yellow-900/50 transition-colors" title="Download JSON"><Icons.FileJson className="w-3 h-3"/> <span className="text-[9px]">JSON</span></button>
                                <button onClick={() => onOpenLink('json_tab', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-900/50 transition-colors" title="Open in new Tab"><Icons.ExternalLink className="w-3 h-3"/> <span className="text-[9px]">OPEN</span></button>
                                <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                                <button onClick={() => onTogglePreview(file.filename)} className={`p-1 rounded transition-colors ${isExpanded ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300' : 'hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400'}`} title="Inline Preview">{isExpanded ? <Icons.Hide className="w-3.5 h-3.5"/> : <Icons.Show className="w-3.5 h-3.5"/>}</button>
                              </>
                              )}
                              <button onClick={() => onDelete(file.path)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 rounded transition-colors ml-1"><Icons.Trash className="w-3.5 h-3.5"/></button>
                          </div>
                      </td>
                    </tr>
                    {isExpanded && <FilePreview data={previewData} loading={previewLoading} />}
                </Fragment>
               );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
