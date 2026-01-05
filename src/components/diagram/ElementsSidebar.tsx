
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const CATEGORIES = {
    'Power Sources': ['Grid'],
    'Conductors': ['Busbar'],
    'Transformers': ['Transformer'],
    'Circuit Protection': ['Circuit Breaker'],
};

const NODE_DEFINITIONS = [
    { type: 'Grid', label: 'Grid', icon: `<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg"><g stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"><rect x="20" y="10" width="60" height="60" /><line x1="20" y1="10" x2="80" y2="70" /> <line x1="80" y1="10" x2="20" y2="70" /> <polygon points="50,10 80,40 50,70 20,40" /><line x1="50" y1="70" x2="50" y2="140" /></g></svg>` },
    { type: 'Busbar', label: 'Busbar', icon: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="14" width="32" height="4" fill="black" /></svg>` },
    { type: 'Transformer', label: 'Transformer', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 165"><line x1="30" y1="0" x2="30" y2="25" stroke="black" strokeWidth="4" /><circle cx="30" cy="53" r="28" stroke="black" strokeWidth="4" fill="none" /><circle cx="30" cy="85" r="28" stroke="black" strokeWidth="4" fill="none" /><line x1="30" y1="113" x2="30" y2="138" stroke="black" strokeWidth="4" /></svg>` },
    { type: 'Circuit Breaker', label: 'Circuit Breaker', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 160"><g stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"><line x1="30" y1="0" x2="30" y2="40" /><line x1="20" y1="30" x2="40" y2="50" /><line x1="40" y1="30" x2="20" y1="50" /><line x1="15" y1="55" x2="30" y1="105" /><line x1="30" y1="105" x2="30" y1="160" /></g></svg>` },
];

const ElementsSidebar = () => {
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        'Power Sources': true,
        'Conductors': true,
        'Transformers': true,
        'Circuit Protection': true,
    });

    const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
        const nodeInfo = JSON.stringify({ nodeType, label });
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
                        <div className="grid grid-cols-2 gap-2 p-2">
                            {nodeTypes.map(nodeType => {
                                const node = NODE_DEFINITIONS.find(def => def.type === nodeType);
                                if (!node) return null;
                                return (
                                    <div
                                        key={node.type}
                                        onDragStart={(event) => onDragStart(event, 'custom', node.label)}
                                        draggable
                                        className="flex flex-col items-center p-2 border border-slate-300 dark:border-slate-600 rounded-md cursor-grab bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-center"
                                    >
                                        {node.icon && (
                                            <div
                                                className="w-10 h-10 mb-1 flex items-center justify-center text-blue-600 dark:text-blue-300"
                                                dangerouslySetInnerHTML={{ __html: node.icon }}
                                            />
                                        )}
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
