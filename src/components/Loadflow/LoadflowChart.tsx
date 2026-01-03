
import { LoadflowResult } from '../../types/loadflow';

const LINE_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#84cc16"];

interface Props {
    groups: Record<string, LoadflowResult[]>;
    extractLoadNumber: (s: string | undefined) => number;
}

export default function LoadflowChart({ groups, extractLoadNumber }: Props) {
    const keys = Object.keys(groups);
    if (keys.length === 0) return null;

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
    minY -= padY; maxY += padY; 
    const width = 800; const height = 300; 
    
    const getX = (val: number) => ((val - minX) / rangeX) * (width - 40) + 20; 
    const getY = (val: number) => height - ((val - minY) / (maxY - minY)) * (height - 40) - 20;

    return (
      <div className="w-full bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col">
        <div className="flex-1 relative h-[320px]">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                <line x1="20" y1={height-20} x2={width-20} y2={height-20} stroke="#cbd5e1" strokeWidth="1" />
                <line x1="20" y1="20" x2="20" y2={height-20} stroke="#cbd5e1" strokeWidth="1" />
                {[0, 0.25, 0.5, 0.75, 1].map(pct => { 
                    const yPos = 20 + (height - 40) * pct; 
                    const val = maxY - (maxY - minY) * pct; 
                    return (<g key={pct}><line x1="20" y1={yPos} x2={width-20} y2={yPos} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" /><text x="15" y={yPos + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{val.toFixed(0)}</text></g>); 
                })}
                
                {/* Lines & Points */}
                {keys.map((key, kIdx) => { 
                    const group = groups[key]; 
                    const color = LINE_COLORS[kIdx % LINE_COLORS.length]; 
                    const pointsStr = group.map(r => `${getX(extractLoadNumber(r.study_case?.revision))},${getY(Math.abs(r.mw_flow))}`).join(" "); 
                    return ( 
                        <g key={key}> 
                            <polyline points={pointsStr} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" /> 
                            {group.map((r, i) => ( 
                                <g key={i} className="group cursor-pointer"> 
                                    <circle cx={getX(extractLoadNumber(r.study_case?.revision))} cy={getY(Math.abs(r.mw_flow))} r="4" fill={r.is_winner ? "#22c55e" : "white"} stroke={color} strokeWidth="2" className="transition-all hover:r-6"/> 
                                    <title>{`${key}\nRev: ${r.study_case?.revision}\nMW: ${Math.abs(r.mw_flow).toFixed(2)}\nWinner: ${r.is_winner}`}</title> 
                                </g> 
                            ))} 
                        </g> 
                    ); 
                })}
            </svg>
        </div>
        <div className="flex flex-wrap gap-4 mt-2 justify-center">
            {keys.map((key, idx) => (
                <div key={key} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: LINE_COLORS[idx % LINE_COLORS.length] }}></div>{key}
                </div>
            ))}
        </div>
      </div>
    );
}
