
// [structure:component]
// RESULT CARD & REPORT
// [context:flow] Displays a single loadflow scenario result. Expands to show details.

import { useState } from 'react';
import * as Icons from 'lucide-react';
import { LoadflowResult } from '../../hooks/useLoadflow';

interface ResultCardProps {
    res: LoadflowResult;
}

// Helper: Visual bar for values
const ProgressBar = ({ value, max, colorClass }: { value: number, max: number, colorClass: string }) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full ${colorClass}`} style={{ width: `${pct}%` }}></div>
        </div>
    );
};

const ResultCard = ({ res }: ResultCardProps) => {
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
            {/* --- HEADER (Summary) --- */}
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
                    {/* Visual Delta Indicator */}
                    <div className="text-right hidden sm:block min-w-[100px]">
                         <div className="flex justify-end items-baseline gap-1 mb-1">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Δ {res.delta_target?.toFixed(2)}</span>
                            <span className="text-[10px] text-slate-400">MW</span>
                        </div>
                        <ProgressBar value={res.delta_target || 0} max={10} colorClass={res.delta_target < 1 ? "bg-green-500" : "bg-orange-400"} />
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

            {/* --- BODY (Detailed Report) --- */}
            {expanded && (
                <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-4 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* 1. Context Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h5 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Simulation Context</h5>
                            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                <p className="flex justify-between"><span>Revision:</span> <span className="font-mono text-slate-900 dark:text-slate-200">{res.study_case?.revision}</span></p>
                                <p className="flex justify-between"><span>Swing Bus Script:</span> <span className="font-mono text-slate-900 dark:text-slate-200">{res.swing_bus_found?.script || 'Not Found'}</span></p>
                                <p className="flex justify-between"><span>Power Factor:</span> <span className="font-mono text-slate-900 dark:text-slate-200">{(res.mw_flow / Math.sqrt(res.mw_flow**2 + res.mvar_flow**2)).toFixed(2)}</span></p>
                            </div>
                        </div>

                        {res.victory_reason && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded border border-yellow-100 dark:border-yellow-800 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-1 text-yellow-800 dark:text-yellow-400">
                                    <Icons.Star className="w-4 h-4" />
                                    <span className="font-bold text-sm">Why is this the winner?</span>
                                </div>
                                <p className="text-xs text-yellow-700 dark:text-yellow-500 ml-6">
                                    {res.victory_reason}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 2. Transformers Data Grid */}
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Icons.Zap className="w-3 h-3" /> Transformers Configuration & Load
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(res.transformers || {}).map(([name, data]) => (
                            <div key={name} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm shadow-sm flex flex-col gap-2 hover:border-blue-300 transition-colors">
                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                                    <span className="font-bold text-slate-700 dark:text-slate-200 truncate" title={name}>{name}</span>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold font-mono">Tap {data.Tap}</span>
                                </div>
                                
                                <div className="space-y-2">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500">Active Power</span>
                                            <span className="font-mono text-slate-700 dark:text-slate-300">{data.LFMW?.toFixed(2)} MW</span>
                                        </div>
                                        <ProgressBar value={data.LFMW} max={res.mw_flow * 1.2} colorClass="bg-blue-500" />
                                    </div>
                                    
                                    <div className="flex justify-between text-xs pt-1 border-t border-slate-50 dark:border-slate-700">
                                        <span className="text-slate-500">Reactive</span>
                                        <span className="font-mono text-slate-600 dark:text-slate-400">{data.LFMvar?.toFixed(2)} Mvar</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Voltage</span>
                                        <span className="font-mono text-slate-600 dark:text-slate-400">{data.kV?.toFixed(2)} kV</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultCard;
