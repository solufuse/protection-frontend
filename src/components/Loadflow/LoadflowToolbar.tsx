
// [structure:component]
// LOADFLOW TOOLBAR
// [context:flow] Controls for running analysis with naming support.

import * as Icons from 'lucide-react';
import ContextRoleBadge from '../ContextRoleBadge';
import { Project } from '../ProjectsSidebar';

interface LoadflowToolbarProps {
    onRun: () => void;
    loading: boolean;
    onlyWinners: boolean;
    setOnlyWinners: (v: boolean) => void;
    count: number;
    project: Project | null;
    onToggleHistory: () => void;
    showHistory: boolean;
    // [+] New Props for Naming
    runName: string;
    setRunName: (v: string) => void;
}

const LoadflowToolbar = ({ 
    onRun, loading, onlyWinners, setOnlyWinners, count,
    project, onToggleHistory, showHistory,
    runName, setRunName
}: LoadflowToolbarProps) => {
    return (
        <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap justify-between items-center gap-4 min-h-[50px]">
            
            {/* LEFT: Context & Status */}
            <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                    <Icons.Activity className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Loadflow</span>
                 </div>

                 {project && (
                    <>
                        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide truncate max-w-[150px]">
                                {project.name}
                            </span>
                            <ContextRoleBadge role={project.role} />
                        </div>
                    </>
                 )}

                 {count > 0 && (
                    <>
                        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {count} Scenarios
                        </span>
                    </>
                 )}
            </div>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-2">
                
                {/* [+] Run Name Input */}
                <div className="relative group">
                    <input 
                        type="text" 
                        placeholder="Run Name..." 
                        value={runName}
                        onChange={(e) => setRunName(e.target.value)}
                        className="w-32 pl-2 pr-2 py-1.5 text-[10px] font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
                        maxLength={20}
                    />
                </div>

                {/* Filter Toggle */}
                <button
                    onClick={() => setOnlyWinners(!onlyWinners)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-bold transition-all text-[10px] border ${
                        onlyWinners 
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-400' 
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                >
                    <Icons.Trophy className="w-3.5 h-3.5" />
                    {onlyWinners ? 'WINNERS' : 'ALL'}
                </button>

                {/* Run Button */}
                <button
                    onClick={onRun}
                    disabled={loading || !project}
                    className={`flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded font-black shadow-sm cursor-pointer transition-all text-[10px] ${
                        (loading || !project) ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                    }`}
                >
                    {loading ? <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icons.Play className="w-3.5 h-3.5" />}
                    RUN
                </button>

                {/* History Toggle */}
                <button 
                    onClick={onToggleHistory}
                    className={`p-1.5 rounded border transition-colors ${
                        showHistory 
                        ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' 
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                    title="History Archive"
                >
                    <Icons.History className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

export default LoadflowToolbar;
