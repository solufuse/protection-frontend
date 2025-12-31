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
  files,
  sortConfig,
  onSort,
  searchTerm,
  expandedFileId,
  onTogglePreview,
  previewData,
  previewLoading,
  onOpenLink,
  onDelete,
  formatBytes
}: FileTableProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full text-left font-bold border-collapse">
        <thead className="text-[9px] text-slate-400 uppercase tracking-widest bg-slate-50/50 sticky top-0 z-10">
          <tr>
            <th className="py-2 px-3 border-b border-slate-100 font-bold w-8"></th>
            <th className="py-2 px-3 border-b border-slate-100 font-bold cursor-pointer hover:text-blue-600 group" onClick={() => onSort('filename')}>
                <div className="flex items-center gap-1">FILENAME {sortConfig.key === 'filename' && <Icons.ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
            </th>
            <th className="py-2 px-3 border-b border-slate-100 font-bold w-32 cursor-pointer hover:text-blue-600" onClick={() => onSort('uploaded_at')}>
                 <div className="flex items-center gap-1">DATE {sortConfig.key === 'uploaded_at' && <Icons.ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
            </th>
            <th className="py-2 px-3 border-b border-slate-100 w-24 font-bold text-center cursor-pointer hover:text-blue-600" onClick={() => onSort('size')}>
                 <div className="flex items-center justify-center gap-1">SIZE {sortConfig.key === 'size' && <Icons.ArrowUpDown className="w-3 h-3 text-blue-500" />}</div>
            </th>
            <th className="py-2 px-3 border-b border-slate-100 text-right w-64 font-bold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {files.length === 0 ? (
            <tr><td colSpan={5} className="py-20 text-center text-slate-300 italic"><Icons.Archive className="w-10 h-10 mx-auto mb-3 opacity-50" /><span className="block opacity-70">{searchTerm ? "No matches found" : "No files in this context"}</span></td></tr>
          ) : (
            files.map((file, i) => {
               const isConvertible = /\.(si2s|lf1s|mdb|json)$/i.test(file.filename);
               const isExpanded = expandedFileId === file.filename;
               return (
                <Fragment key={i}>
                    <tr className={`group transition-colors ${isExpanded ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-3 py-1 text-center">{isConvertible && (<button onClick={() => onTogglePreview(file.filename)} className="text-slate-400 hover:text-blue-600">{isExpanded ? <Icons.ChevronDown className="w-3.5 h-3.5"/> : <Icons.ChevronRight className="w-3.5 h-3.5"/>}</button>)}</td>
                      <td className="px-3 py-1"><div className="flex items-center gap-2"><Icons.FileText className={`w-3.5 h-3.5 ${isConvertible ? 'text-blue-500' : 'text-slate-400'}`} /><span className="truncate max-w-[280px] text-slate-700 text-[10px]" title={file.filename}>{file.filename}</span></div></td>
                      <td className="px-3 py-1 text-slate-400 font-mono text-[9px]"><div className="flex items-center gap-1"><Icons.Calendar className="w-3 h-3 text-slate-300"/> {file.uploaded_at || "-"}</div></td>
                      <td className="px-3 py-1 text-slate-400 font-mono text-[9px] text-center">{formatBytes(file.size)}</td>
                      <td className="px-3 py-1 text-right">
                          <div className="flex justify-end gap-1.5 items-center">
                              <button onClick={() => onOpenLink('raw', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 transition-colors" title="Download Raw"><Icons.FileDown className="w-3 h-3"/> <span className="text-[9px]">RAW</span></button>
                              {isConvertible && (
                              <>
                                <button onClick={() => onOpenLink('xlsx', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 hover:bg-green-100 text-green-700 rounded border border-green-200 transition-colors" title="Download XLSX"><Icons.FileSpreadsheet className="w-3 h-3"/> <span className="text-[9px]">XLSX</span></button>
                                <button onClick={() => onOpenLink('json', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded border border-yellow-200 transition-colors" title="Download JSON"><Icons.FileJson className="w-3 h-3"/> <span className="text-[9px]">JSON</span></button>
                                <button onClick={() => onOpenLink('json_tab', file.filename)} className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 transition-colors" title="Open in new Tab"><Icons.ExternalLink className="w-3 h-3"/> <span className="text-[9px]">OPEN</span></button>
                                <div className="w-px h-3 bg-slate-300 mx-1"></div>
                                <button onClick={() => onTogglePreview(file.filename)} className={`p-1 rounded transition-colors ${isExpanded ? 'text-blue-600 bg-blue-100' : 'hover:bg-blue-100 text-blue-600'}`} title="Inline Preview">{isExpanded ? <Icons.Hide className="w-3.5 h-3.5"/> : <Icons.Show className="w-3.5 h-3.5"/>}</button>
                              </>
                              )}
                              <button onClick={() => onDelete(file.path)} className="p-1 hover:bg-red-100 text-red-500 rounded transition-colors ml-1"><Icons.Trash className="w-3.5 h-3.5"/></button>
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
