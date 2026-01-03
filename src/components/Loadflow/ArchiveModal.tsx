
import { Icons } from '../../icons';

interface Props {
    historyFiles: {name: string, date: string}[];
    onClose: () => void;
    onLoad: (name: string) => void;
}

export default function ArchiveModal({ historyFiles, onClose, onLoad }: Props) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Icons.Archive className="w-4 h-4 text-blue-600" />
                            Results Archive
                        </h2>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Select a previous run to load</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                        <Icons.X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-white dark:bg-slate-900">
                    {historyFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
                            <Icons.Inbox className="w-8 h-8 mb-2 opacity-20" />
                            No archived results found.
                        </div>
                    ) : (
                        historyFiles.map((file, idx) => (
                            <button
                                key={idx}
                                onClick={() => onLoad(file.name)}
                                className="w-full text-left p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800/50 transition-all group border border-transparent hover:border-blue-100 dark:hover:border-slate-700 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                                        <Icons.FileJson className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{file.name.replace('.json', '')}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                            <Icons.Calendar className="w-3 h-3" />
                                            {new Date(file.date).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <Icons.ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
}
