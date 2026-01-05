import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const CATEGORIES = {
    'Power Sources': ['Grid'],
    'Conductors': ['Busbar'],
    'Transformers': ['Transformer'],
    'Circuit Protection': ['Circuit Breaker'],
};

const NODE_DEFINITIONS = [
    { type: 'Grid', label: 'Grid', data: { label: 'Grid', name: 'Grid-1', type: 'ext_grid', vm_pu: 1.0, va_degree: 0.0 } },
    { type: 'Busbar', label: 'Busbar', data: { label: 'Busbar', name: 'BUS-1', type: 'bus', vm_pu: 1.0, va_degree: 0.0 } },
    { type: 'Transformer', label: 'Transformer', data: { label: 'Transformer', name: 'TX-1', type: 'trafo', sn_kva: 1000, vn_hv_kv: 10, vn_lv_kv: 0.4 } },
    { type: 'Circuit Breaker', label: 'Circuit Breaker', data: { label: 'Circuit Breaker', name: 'CB-1', type: 'switch', closed: true } },
];

const ElementsSidebar = () => {
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        'Power Sources': true,
        'Conductors': true,
        'Transformers': true,
        'Circuit Protection': true,
    });

    const onDragStart = (event: React.DragEvent, nodeType: string, label: string, data: any) => {
        const nodeInfo = JSON.stringify({ nodeType, label, data });
        event.dataTransfer.setData('application/reactflow', nodeInfo);
        event.dataTransfer.effectAllowed = 'move';
    };

    const toggleCategory = (category: string) => {
        setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    return (
        <aside className="w-48 bg-slate-50 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 p-2 overflow-y-auto">
            <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-200 px-2">Elements</h3>
            {Object.entries(CATEGORIES).map(([category, nodeTypes]) => (
                <div key={category} className="mb-2">
                    <button
                        className="flex items-center justify-between w-full p-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        onClick={() => toggleCategory(category)}
                    >
                        {category}
                        {openCategories[category] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {openCategories[category] && (
                        <div className="grid grid-cols-1 gap-2 p-2">
                            {nodeTypes.map(nodeType => {
                                const node = NODE_DEFINITIONS.find(def => def.type === nodeType);
                                if (!node) return null;
                                return (
                                    <div
                                        key={node.type}
                                        onDragStart={(event) => onDragStart(event, 'custom', node.label, node.data)}
                                        draggable
                                        className="flex flex-col items-center p-2 border border-slate-300 dark:border-slate-600 rounded-md cursor-grab bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-center"
                                    >
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{node.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </aside>
    );
};

export default ElementsSidebar;
