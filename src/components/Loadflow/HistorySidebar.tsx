
// [structure:component]
// HISTORY SIDEBAR
// [context:flow] Displays list of past runs (archives).

import * as Icons from 'lucide-react';
import { HistoryFile } from '../../hooks/useLoadflow';

interface HistorySidebarProps {
    files: HistoryFile[];
    onLoad: (path: string) => void;
    onClose: () => void;
}

const HistorySidebar = ({ files, onLoad, onClose }: HistorySidebarProps) => {
    return (
        <aside className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col shadow-xl z-20 h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <div>
                    <h2 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Icons.Archive className="w-4 h-4" />
                        Results Archive
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Saved runs for this project
                    </p>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                    <Icons.X className="w-4 h-4 text-slate-500" />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {files.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        No archives found
                    </div>
                ) : (
                    files.map((file, idx) => (
                        <button
                            key={idx}
                            onClick={() => onLoad(file.path || file.name)}
                            className="w-full text-left p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group border border-transparent hover:border-blue-100 dark:hover:border-slate-600"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Icons.FileJson className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate w-full">
                                    {file.name.replace(/_\d{8}_\d{6}/, '').replace('.json', '')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 pl-6">
                                <span>{new Date(file.date).toLocaleDateString()} {new Date(file.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                <Icons.ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </button>
                    ))
                )}
            </div>
        </aside>
    );
};

export default HistorySidebar;
