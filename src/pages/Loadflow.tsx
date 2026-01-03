
// [structure:root]
// LOADFLOW PAGE
// [context:flow] Main UI orchestrator. Connects Sidebar, Toolbar, and Results View.

import { useState } from 'react';
import * as Icons from 'lucide-react'; 
import ProjectsSidebar, { Project } from '../components/ProjectsSidebar';
import GlobalRoleBadge from '../components/GlobalRoleBadge';
import ContextRoleBadge from '../components/ContextRoleBadge';
import { useLoadflow, LoadflowResult } from '../hooks/useLoadflow';

// --- SUB-COMPONENTS (Internal for now, can be extracted later) ---

// 1. TOOLBAR
const LoadflowToolbar = ({ 
    onRun, loading, onlyWinners, setOnlyWinners, count 
}: { 
    onRun: () => void, loading: boolean, onlyWinners: boolean, setOnlyWinners: (v: boolean) => void, count: number 
}) => (
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

// 2. RESULT CARD
const ResultCard = ({ res }: { res: LoadflowResult }) => {
    const [expanded, setExpanded] = useState(false);

    const getStatusIcon = (color: string) => {
        if (color === 'green') return <Icons.CheckCircle className="w-5 h-5 text-green-500" />;
        if (color === 'orange') return <Icons.AlertTriangle className="w-5 h-5 text-orange-500" />;
        return <Icons.XCircle className="w-5 h-5 text-red-500" />;
    };

    return (
        <div className={`bg-white dark:bg-slate-800 border rounded-lg shadow-sm transition-all duration-200 ${
            res.is_winner 
            ? 'border-yellow-400 ring-1 ring-yellow-400/50 dark:border-yellow-600' 
            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
        }`}>
            {/* HEADER - Clickable */}
            <div 
                onClick={() => setExpanded(!expanded)}
                className="p-4 flex items-center justify-between cursor-pointer group select-none"
            >
                <div className="flex items-center gap-4">
                    {getStatusIcon(res.status_color)}
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                                {res.filename}
                            </h3>
                            {res.is_winner && (
                                <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold flex items-center gap-1 border border-yellow-200">
                                    <Icons.Trophy className="w-3 h-3" /> Winner
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1 font-mono">
                                <Icons.Hash className="w-3 h-3" /> {res.study_case?.id || 'N/A'}
                            </span>
                            <span>•</span>
                            <span className="font-mono">{res.study_case?.config || 'Default'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Δ {res.delta_target?.toFixed(2)} MW
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                            Target Gap
                        </div>
                    </div>
                    <div className="text-right w-24">
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                            {res.mw_flow?.toFixed(1)} <span className="text-xs font-normal text-slate-500">MW</span>
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                            Flow @ Swing
                        </div>
                    </div>
                    <Icons.ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* EXPANDABLE REPORT */}
            {expanded && (
                <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-4 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* Summary Block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                            <p><span className="font-semibold">Revision:</span> {res.study_case?.revision}</p>
                            <p><span className="font-semibold">Swing Bus:</span> {res.swing_bus_found?.script || 'Not Found'}</p>
                        </div>
                        {res.victory_reason && (
                            <div className="text-xs bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 p-2 rounded border border-yellow-100 dark:border-yellow-800 flex items-start gap-2">
                                <Icons.Star className="w-3 h-3 mt-0.5" />
                                <div>
                                    <span className="font-bold">Victory Reason:</span> {res.victory_reason}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Transformer Grid */}
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Icons.Zap className="w-3 h-3" /> Transformers Data
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {Object.entries(res.transformers || {}).map(([name, data]) => (
                            <div key={name} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm shadow-sm flex flex-col gap-1 hover:border-blue-200 transition-colors">
                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-1 mb-1">
                                    <span className="font-bold text-slate-700 dark:text-slate-200 truncate" title={name}>{name}</span>
                                    <span className="text-xs bg-blue-50 text-blue-700 px-1.5 rounded font-mono">Tap {data.Tap}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 text-xs">
                                    <span className="text-slate-500">Power:</span>
                                    <span className="text-right font-mono text-slate-800 dark:text-slate-300">{data.LFMW?.toFixed(2)} MW</span>
                                    
                                    <span className="text-slate-500">React:</span>
                                    <span className="text-right font-mono text-slate-800 dark:text-slate-300">{data.LFMvar?.toFixed(2)} Mvar</span>
                                    
                                    <span className="text-slate-500">Volt:</span>
                                    <span className="text-right font-mono text-slate-800 dark:text-slate-300">{data.kV?.toFixed(2)} kV</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---

const Loadflow = () => {
    // UI State
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [onlyWinners, setOnlyWinners] = useState(false); 
    const [showHistory, setShowHistory] = useState(true);

    // Logic Hook
    const { 
        results, loading, error, historyFiles, 
        runAnalysis, loadResultFile 
    } = useLoadflow(currentProject?.id, currentProject?.name);

    // Filter Logic
    const filteredResults = results.filter(r => {
        if (onlyWinners) return r.is_winner;
        return true;
    });

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
            <ProjectsSidebar onSelectProject={setCurrentProject} selectedProjectId={currentProject?.id} />

            <div className="flex-1 flex flex-col min-w-0">
                {/* HEADER */}
                <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <Icons.Activity className="w-6 h-6 text-blue-600" />
                        <div>
                            <h1 className="text-lg font-bold text-slate-800 dark:text-white">Loadflow Analysis</h1>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                {currentProject ? (
                                    <>
                                        <span>{currentProject.name}</span>
                                        <ContextRoleBadge role={currentProject.role} />
                                    </>
                                ) : <span>Select a project</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <GlobalRoleBadge />
                        <button 
                            onClick={() => setShowHistory(!showHistory)}
                            className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-slate-100 dark:bg-slate-700 text-blue-600' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            title="Toggle History"
                        >
                            <Icons.History className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* MAIN CONTENT AREA */}
                    <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                        
                        <LoadflowToolbar 
                            onRun={runAnalysis} 
                            loading={loading}
                            onlyWinners={onlyWinners}
                            setOnlyWinners={setOnlyWinners}
                            count={filteredResults.length}
                        />

                        {/* RESULTS LIST */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <Icons.AlertOctagon className="w-5 h-5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {!loading && results.length === 0 && !error && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Icons.Activity className="w-16 h-16 mb-4 opacity-20" />
                                    <p>Ready to analyze. Press Run to start.</p>
                                </div>
                            )}

                            {filteredResults.map((res, idx) => (
                                <ResultCard key={`${res.filename}-${idx}`} res={res} />
                            ))}
                        </div>
                    </main>

                    {/* HISTORY SIDEBAR */}
                    {showHistory && (
                        <aside className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col shadow-xl z-20">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                <h2 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                    <Icons.Archive className="w-4 h-4" />
                                    Results Archive
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Saved runs for this project
                                </p>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {historyFiles.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        No archives found
                                    </div>
                                ) : (
                                    historyFiles.map((file, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => loadResultFile(file.path || file.name)}
                                            className="w-full text-left p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group border border-transparent hover:border-blue-100 dark:hover:border-slate-600"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icons.FileJson className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate w-full">
                                                    {file.name.replace(/_\d{8}_\d{6}/, '').replace('.json', '')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] text-slate-400 pl-6">
                                                <span>{new Date(file.date).toLocaleDateString()} {new Date(file.date).toLocaleTimeString()}</span>
                                                <Icons.ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Loadflow;
