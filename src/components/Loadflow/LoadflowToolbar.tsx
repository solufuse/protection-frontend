
// [structure:component]
// LOADFLOW TOOLBAR
// [context:flow] Controls for running analysis and filtering results.

import * as Icons from 'lucide-react';

interface LoadflowToolbarProps {
    onRun: () => void;
    loading: boolean;
    onlyWinners: boolean;
    setOnlyWinners: (v: boolean) => void;
    count: number;
}

const LoadflowToolbar = ({ onRun, loading, onlyWinners, setOnlyWinners, count }: LoadflowToolbarProps) => {
    return (
        <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-2">
                <button
                    onClick={onRun}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
                >
                    {loading ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Play className="w-4 h-4" />}
                    Run Analysis & Save
                </button>
                
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                
                <button
                    onClick={() => setOnlyWinners(!onlyWinners)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                        onlyWinners 
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-400' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                    }`}
                >
                    <Icons.Trophy className="w-4 h-4" />
                    {onlyWinners ? 'Winners Only' : 'Show All Candidates'}
                </button>
            </div>
            
            <div className="text-sm text-slate-500 font-mono">
                {count > 0 && <span>{count} scenarios</span>}
            </div>
        </div>
    );
};

export default LoadflowToolbar;
