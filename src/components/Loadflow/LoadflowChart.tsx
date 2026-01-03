
import { useState } from 'react';
import { LoadflowResult } from '../../types/loadflow';
import { Icons } from '../../icons';

const LINE_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#84cc16"
];

interface Props {
    groups: Record<string, LoadflowResult[]>;
    extractLoadNumber: (s: string | undefined) => number;
}

export default function LoadflowChart({ groups, extractLoadNumber }: Props) {
    const [showCapaComparison, setShowCapaComparison] = useState(true);
    const [isGridView, setIsGridView] = useState(false);
    const [zoomedGroup, setZoomedGroup] = useState<string | null>(null);

    const keys = Object.keys(groups);
    if (keys.length === 0) return null;

    // --- 1. GLOBAL SCALING ---
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    Object.values(groups).forEach(group => { 
        group.forEach(r => { 
            const x = extractLoadNumber(r.study_case?.revision); 
            const y = Math.abs(r.mw_flow); 
            if (x < minX) minX = x; if (x > maxX) maxX = x; 
            if (y < minY) minY = y; if (y > maxY) maxY = y; 
        }); 
    });

    const rangeX = maxX - minX || 1; 
    const rangeY = maxY - minY || 1; 
    const padY = rangeY * 0.1; 
    const plotMinY = Math.max(0, minY - padY); 
    const plotMaxY = maxY + padY;

    // --- 2. GROUPING LOGIC ---
    const baseColorMap: Record<string, string> = {};
    const uniqueBaseKeys = new Set<string>();
    const sortedKeys = [...keys].sort();
    let colorIndex = 0;

    sortedKeys.forEach(key => {
        const baseKey = key.replace(/_CAPA$/i, '').trim();
        uniqueBaseKeys.add(baseKey);
        if (!baseColorMap[baseKey]) {
            baseColorMap[baseKey] = LINE_COLORS[colorIndex % LINE_COLORS.length];
            colorIndex++;
        }
    });

    const sortedBaseKeys = Array.from(uniqueBaseKeys).sort();

    // --- HELPER: RENDER SINGLE SVG ---
    const renderChartSvg = (targetBaseKeys: string[], width: string | number, height: string | number, hideAxisLabels = false) => {
        // Dynamic SVG Scaling
        const vW = 800; 
        const vH = 300;
        
        const mapX = (val: number) => ((val - minX) / rangeX) * (vW - 40) + 20;
        const mapY = (val: number) => vH - ((val - plotMinY) / (plotMaxY - plotMinY)) * (vH - 40) - 20;

        return (
            <svg viewBox={`0 0 ${vW} ${vH}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="20" y1={vH-20} x2={vW-20} y2={vH-20} stroke="#cbd5e1" strokeWidth="1" />
                <line x1="20" y1="20" x2="20" y2={vH-20} stroke="#cbd5e1" strokeWidth="1" />
                {[0, 0.25, 0.5, 0.75, 1].map(pct => { 
                    const yPos = 20 + (vH - 40) * pct; 
                    const val = plotMaxY - (plotMaxY - plotMinY) * pct; 
                    return (
                        <g key={pct}>
                            <line x1="20" y1={yPos} x2={vW-20} y2={yPos} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                            {!hideAxisLabels && (
                                <text x="15" y={yPos + 3} textAnchor="end" fontSize="10" fill="#94a3b8" className="font-mono">{val.toFixed(0)}</text>
                            )}
                        </g>
                    ); 
                })}

                {/* Data Lines */}
                {sortedKeys.map((key) => {
                    const baseKey = key.replace(/_CAPA$/i, '').trim();
                    if (!targetBaseKeys.includes(baseKey)) return null;

                    const group = groups[key];
                    const isCapa = key.toUpperCase().endsWith('_CAPA');
                    const color = baseColorMap[baseKey];
                    
                    const dashArray = (showCapaComparison && isCapa) ? "5,5" : "none";
                    const opacity = (showCapaComparison && isCapa) ? 0.7 : 1;
                    const strokeWidth = isCapa ? 2 : 3;

                    const pointsStr = group.map(r => `${mapX(extractLoadNumber(r.study_case?.revision))},${mapY(Math.abs(r.mw_flow))}`).join(" ");

                    return (
                        <g key={key}>
                            <polyline 
                                points={pointsStr} 
                                fill="none" 
                                stroke={color} 
                                strokeWidth={strokeWidth} 
                                strokeDasharray={dashArray} 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                opacity={opacity} 
                            />
                            {group.map((r, i) => (
                                <circle 
                                    key={i}
                                    cx={mapX(extractLoadNumber(r.study_case?.revision))} 
                                    cy={mapY(Math.abs(r.mw_flow))} 
                                    r={isCapa ? 3 : 4} 
                                    fill={r.is_winner ? "#22c55e" : "white"} 
                                    stroke={color} 
                                    strokeWidth={2} 
                                />
                            ))}
                        </g>
                    );
                })}
            </svg>
        );
    };

    return (
      <div className="flex flex-col gap-4">
        
        {/* GLOBAL TOOLBAR */}
        <div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm px-4 py-3 flex flex-wrap justify-between items-center">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-xs uppercase flex items-center gap-2">
                <Icons.TrendingUp className="w-4 h-4 text-blue-500" /> 
                Load Analysis
            </h3>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setShowCapaComparison(!showCapaComparison)}
                    className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors flex items-center gap-1 ${
                        showCapaComparison 
                        ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' 
                        : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600'
                    }`}
                >
                    <Icons.Filter className="w-3 h-3" />
                    {showCapaComparison ? 'Group CAPA' : 'Ungrouped'}
                </button>

                <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1"></div>

                <button onClick={() => setIsGridView(false)} className={`p-1.5 rounded border transition-colors ${!isGridView ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-800 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`} title="Combined View">
                    <Icons.Maximize className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setIsGridView(true)} className={`p-1.5 rounded border transition-colors ${isGridView ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-800 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`} title="Grid View">
                    <Icons.Grid className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>

        {/* CHART CONTENT AREA */}
        {isGridView ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedBaseKeys.map((baseKey) => (
                    <div 
                        key={baseKey} 
                        onClick={() => setZoomedGroup(baseKey)} 
                        className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm p-3 flex flex-col h-[200px] cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group relative"
                    >
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 dark:bg-slate-700 p-1 rounded">
                            <Icons.Maximize className="w-3 h-3 text-slate-500" />
                        </div>
                        
                        <div className="flex justify-between items-center mb-2 border-b border-slate-100 dark:border-slate-700 pb-1">
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate" style={{ color: baseColorMap[baseKey] }}>
                                {baseKey}
                            </span>
                            {showCapaComparison && (
                                <div className="flex gap-1">
                                    <div className="w-3 h-0 border-t-2 border-solid opacity-100" style={{ borderColor: baseColorMap[baseKey] }} title="Base"></div>
                                    <div className="w-3 h-0 border-t-2 border-dashed opacity-60" style={{ borderColor: baseColorMap[baseKey] }} title="CAPA"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 w-full relative">
                            {renderChartSvg([baseKey], 400, 160, true)}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="w-full bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col">
                <div className="relative h-[320px] w-full">
                    {renderChartSvg(sortedBaseKeys, 800, 300)}
                </div>
                {/* Expanded Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 justify-center px-4">
                    {sortedKeys.map((key) => {
                        const isCapa = key.toUpperCase().endsWith('_CAPA');
                        const baseKey = key.replace(/_CAPA$/i, '').trim();
                        const color = baseColorMap[baseKey];
                        
                        return (
                            <div key={key} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                                <div className="w-4 h-0" style={{ 
                                    borderTop: isCapa && showCapaComparison ? `2px dashed ${color}` : `2px solid ${color}`,
                                    opacity: isCapa && showCapaComparison ? 0.7 : 1
                                }}></div>
                                {key}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* ZOOM MODAL */}
        {zoomedGroup && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-200" onClick={() => setZoomedGroup(null)}>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl h-[60vh] flex flex-col p-6 relative border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span style={{ color: baseColorMap[zoomedGroup] }}>{zoomedGroup}</span>
                            <span className="text-sm font-normal text-slate-400">Detailed Analysis</span>
                        </h2>
                        <button onClick={() => setZoomedGroup(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <Icons.X className="w-6 h-6 text-slate-500" />
                        </button>
                    </div>
                    
                    <div className="flex-1 w-full relative bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700 p-4">
                         {renderChartSvg([zoomedGroup], "100%", "100%")}
                    </div>

                    <div className="mt-4 flex gap-4 justify-center">
                         <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                            <div className="w-6 h-0 border-t-4 border-solid" style={{ borderColor: baseColorMap[zoomedGroup] }}></div>
                            Base Scenario
                         </div>
                         <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                            <div className="w-6 h-0 border-t-4 border-dashed opacity-60" style={{ borderColor: baseColorMap[zoomedGroup] }}></div>
                            With CAPA
                         </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    );
}
