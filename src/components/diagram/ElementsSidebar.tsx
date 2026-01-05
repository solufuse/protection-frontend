
// src/components/diagram/ElementsSidebar.tsx
import React from 'react';

const GridSvg = `<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg"><g stroke="black" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect x="20" y="10" width="60" height="60" /><line x1="20" y1="10" x2="80" y2="70" /> <line x1="80" y1="10" x2="20" y2="70" /> <polygon points="50,10 80,40 50,70 20,40" /><line x1="50" y1="70" x2="50" y2="140" /></g></svg>`;
const TransformerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 165"><line x1="30" y1="0" x2="30" y2="25" stroke="black" stroke-width="4" /><circle cx="30" cy="53" r="28" stroke="black" stroke-width="4" fill="none" /><circle cx="30" cy="85" r="28" stroke="black" stroke-width="4" fill="none" /><line x1="30" y1="113" x2="30" y2="138" stroke="black" stroke-width="4" /></svg>`;
const CircuitBreakerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 160"><g stroke="black" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"><line x1="30" y1="0" x2="30" y2="40" /><line x1="20" y1="30" x2="40" y2="50" /><line x1="40" y1="30" x2="20" y2="50" /><line x1="15" y1="55" x2="30" y2="105" /><line x1="30" y1="105" x2="30" y2="160" /></g></svg>`;

const DRAGGABLE_NODES = [
    { type: 'Grid', label: 'Grid', icon: GridSvg },
    { type: 'Busbar', label: 'Busbar', icon: '<svg viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="8" width="100" height="4" fill="black" /></svg>'},
    { type: 'Transformer', label: 'Transformer', icon: TransformerSvg },
    { type: 'Circuit Breaker', label: 'Circuit Breaker', icon: CircuitBreakerSvg },
];

const ElementsSidebar = () => {

    const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
        const nodeInfo = JSON.stringify({ nodeType, label });
        event.dataTransfer.setData('application/reactflow', nodeInfo);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-48 bg-slate-50 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 p-4">
            <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">Elements</h3>
            <div className="grid grid-cols-2 gap-4">
                {DRAGGABLE_NODES.map((node) => (
                    <div
                        key={node.type}
                        onDragStart={(event) => onDragStart(event, 'custom', node.label)}
                        draggable
                        className="flex flex-col items-center p-2 border border-slate-300 dark:border-slate-600 rounded-md cursor-grab bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                        {node.icon && <div className="w-8 h-8 mb-1" dangerouslySetInnerHTML={{ __html: node.icon }} />}
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{node.label}</span>
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default ElementsSidebar;
