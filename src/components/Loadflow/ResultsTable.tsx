
import { useState } from 'react';
import { Icons } from '../../icons';
import { LoadflowResult } from '../../types/loadflow';

interface Props {
    results: LoadflowResult[];
    filterSearch: string;
    setFilterSearch: (s: string) => void;
    filterWinner: boolean;
    setFilterWinner: (b: boolean) => void;
    filterValid: boolean;
    setFilterValid: (b: boolean) => void;
    onSelectCase: (r: LoadflowResult) => void;
}

export default function ResultsTable({ results, filterSearch, setFilterSearch, filterWinner, setFilterWinner, filterValid, setFilterValid, onSelectCase }: Props) {
    
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const toggleRow = (idx: number) => { 
        const newSet = new Set(expandedRows); 
        if (newSet.has(idx)) newSet.delete(idx); 
        else newSet.add(idx); 
        setExpandedRows(newSet); 
    };

    // --- ACTIONS HANDLERS ---
    const handleResetFilters = () => {
        setFilterSearch("");
        setFilterWinner(false);
        setFilterValid(false);
    };

    const handleTextFilterClick = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        setFilterSearch(text);
    };

    const handleStatusClick = (e: React.MouseEvent, type: 'winner' | 'valid') => {
        e.stopPropagation();
        if (type === 'winner') setFilterWinner(!filterWinner);
        if (type === 'valid') setFilterValid(!filterValid);
    };

    // --- SMART SEARCH LOGIC ---
    const filteredData = results.filter(r => { 
        // 1. Boolean Filters
        if (filterWinner && !r.is_winner) return false; 
        if (filterValid && !r.is_valid) return false; 
        
        // 2. Text Search (Enhanced)
        if (filterSearch === "") return true;

        const searchLower = filterSearch.toLowerCase().replace(/\s*\/\s*/g, '/'); // Normalize input "LF/Normal" -> "lf/normal"
        
        // Construct searchable strings
        const rawId = r.study_case?.id || "";
        const rawConfig = r.study_case?.config || r.filename;
        const rawRev = r.study_case?.revision || "";
        
        // Allow matching "LF_198/Normal" by creating a combined string without spaces
        const combinedTight = `${rawId}/${rawConfig}`.toLowerCase();
        // Allow matching standard fields
        const standardMatch = 
            rawId.toLowerCase().includes(searchLower) || 
            rawConfig.toLowerCase().includes(searchLower) || 
            rawRev.toLowerCase().includes(searchLower) ||
            r.filename.toLowerCase().includes(searchLower);

        return standardMatch || combinedTight.includes(searchLower);
    });

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm overflow-hidden flex flex-col h-auto w-full">
            
            {/* Toolbar */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                     <div className="relative flex-1 max-w-xs group">
                        <Icons.Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Filter (e.g. LF_198/Normal)..." 
                            value={filterSearch} 
                            onChange={(e) => setFilterSearch(e.target.value)} 
                            className="w-full pl-8 pr-8 py-1.5 text-[10px] border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded focus:outline-none focus:border-blue-400 text-slate-600 dark:text-slate-300 transition-all placeholder:text-slate-400" 
                        />
                        {filterSearch && (
                            <button onClick={() => setFilterSearch("")} className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <Icons.X className="w-3.5 h-3.5" />
                            </button>
                        )}
                     </div>
                    
                    <button onClick={() => setFilterWinner(!filterWinner)} className={`flex items-center gap-1 px-2 py-1.5 rounded border transition-colors font-bold ${filterWinner ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-300'}`}>
                        <Icons.CheckCircle className="w-3 h-3" /> Winner
                    </button>
                    
                    <button onClick={() => setFilterValid(!filterValid)} className={`flex items-center gap-1 px-2 py-1.5 rounded border transition-colors font-bold ${filterValid ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-300'}`}>
                        <Icons.Filter className="w-3 h-3" /> Valid
                    </button>

                    {(filterSearch || filterWinner || filterValid) && (
                        <button onClick={handleResetFilters} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Reset Filters">
                            <Icons.RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{filteredData.length} Scenarios</div>
            </div>

            {/* Sticky Table Header */}
            <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-700 font-black text-slate-700 dark:text-slate-300 uppercase flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10">
                <div className="flex items-center gap-2"><Icons.Zap className="w-4 h-4 text-yellow-500" /> Detailed Results</div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left font-bold min-w-[900px]">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-[9px] text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                        <tr>
                            <th className="px-2 py-2 w-10 text-center">St</th>
                            <th className="px-2 py-2">Scenario (ID / Config)</th>
                            <th className="px-2 py-2">Revision</th>
                            <th className="px-2 py-2 text-right">MW Flow</th>
                            <th className="px-2 py-2 text-right">MVar Flow</th>
                            <th className="px-2 py-2 text-right">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700 text-[9px]">
                        {filteredData.map((r, i) => {
                            const isExpanded = expandedRows.has(i);
                            const idStr = r.study_case?.id || "-";
                            const configStr = r.study_case?.config || r.filename;

                            return (
                                <div key={i} style={{ display: 'contents' }}>
                                    <tr className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${r.is_winner ? 'bg-green-50/30 dark:bg-green-900/20' : ''} ${!r.is_valid ? 'opacity-70' : ''}`} onClick={() => onSelectCase(r)}>
                                        {/* Clickable Status Icon */}
                                        <td className="px-2 py-1 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors" onClick={(e) => handleStatusClick(e, r.is_winner ? 'winner' : 'valid')}>
                                            {r.is_winner ? <Icons.Check className="w-3.5 h-3.5 text-green-500 mx-auto" /> : r.is_valid ? <Icons.AlertTriangle className="w-3.5 h-3.5 text-red-400 mx-auto" /> : <Icons.AlertTriangle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 mx-auto" />}
                                        </td>
                                        
                                        {/* Clickable ID and Config */}
                                        <td className="px-2 py-1 font-mono text-slate-600 dark:text-slate-300">
                                            <span 
                                                className="font-black text-slate-800 dark:text-slate-100 hover:text-blue-500 hover:underline cursor-pointer"
                                                onClick={(e) => handleTextFilterClick(e, idStr)}
                                                title="Filter by this ID"
                                            >
                                                {idStr}
                                            </span>
                                            <span className="text-slate-400 mx-1">/</span>
                                            <span 
                                                className="text-slate-500 dark:text-slate-400 hover:text-blue-500 hover:underline cursor-pointer"
                                                onClick={(e) => handleTextFilterClick(e, configStr)}
                                                title="Filter by this Config"
                                            >
                                                {configStr}
                                            </span>
                                        </td>

                                        <td className="px-2 py-1 font-mono font-black text-blue-600 dark:text-blue-400">{r.study_case?.revision}</td>
                                        <td className="px-2 py-1 text-right font-mono text-slate-700 dark:text-slate-300">{Math.abs(r.mw_flow).toFixed(2)}</td>
                                        <td className="px-2 py-1 text-right font-mono text-slate-400 dark:text-slate-500">{Math.abs(r.mvar_flow).toFixed(2)}</td>
                                        <td className="px-2 py-1 text-right"><button onClick={(e) => {e.stopPropagation(); toggleRow(i);}} className={`p-0.5 rounded ${isExpanded ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400'}`}>{isExpanded ? <Icons.EyeOff className="w-3.5 h-3.5"/> : <Icons.Eye className="w-3.5 h-3.5"/>}</button></td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                                            <td colSpan={6} className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(r.transformers || {}).map(([name, data]) => (
                                                        <div key={name} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-[8.5px] shadow-sm">
                                                            <span className="font-black text-slate-700 dark:text-slate-300">{name}</span>
                                                            <div className="h-2 w-px bg-slate-200 dark:bg-slate-600"></div>
                                                            <span className="text-slate-500 dark:text-slate-400">Tap: <b className="text-slate-800 dark:text-slate-200">{data.Tap}</b></span>
                                                            <span className="text-blue-600 dark:text-blue-400 font-bold">{data.LFMW.toFixed(1)} MW</span>
                                                            <span className="text-slate-400 dark:text-slate-500">{data.LFMvar.toFixed(1)} MVar</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </div>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
