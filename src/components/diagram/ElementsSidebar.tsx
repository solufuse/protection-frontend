
// src/components/diagram/ElementsSidebar.tsx
import React from 'react';

const DRAGGABLE_NODES = [
    { type: 'Grid', label: 'Grid' },
    { type: 'Busbar', label: 'Busbar' },
    { type: 'Transformer', label: 'Transformer' },
    { type: 'Circuit Breaker', label: 'Circuit Breaker' },
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
                        {/* You can add icons here later */}
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{node.label}</span>
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default ElementsSidebar;
