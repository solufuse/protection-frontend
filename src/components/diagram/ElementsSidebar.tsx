import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const CATEGORIES = {
    'Power Sources': ['Incomer'],
    'Conductors': ['Bus', 'Cable'],
    'Transformers': ['Transformer'],
    'Switching': ['Incomer Breaker', 'Coupling'],
    'Loads': ['Load'],
    'Generation': ['SGen'],
};

const NODE_DEFINITIONS = [
    // Power Sources
    { 
        type: 'Incomer', 
        label: 'Incomer', 
        category: 'Power Sources',
        data: { 
            label: 'Incomer', 
            component_type: 'Incomer',
            KV: 225,
            MVA3ph: 7600,
        } 
    },
    
    // Conductors
    { 
        type: 'Bus', 
        label: 'Bus', 
        category: 'Conductors',
        data: { 
            label: 'Bus', 
            component_type: 'Bus',
            NomlkV: 20.5
        } 
    },
    { 
        type: 'Cable', 
        label: 'Cable', 
        category: 'Conductors',
        data: { 
            label: 'Cable', 
            component_type: 'Cable',
            Length: 1.0
        } 
    },

    // Transformers
    { 
        type: 'Transformer', 
        label: 'Transformer', 
        category: 'Transformers',
        data: { 
            label: 'Transformer', 
            component_type: 'Transformer',
            PrimkV: 20,
            SeckV: 0.4,
            MVA: 1.0
        } 
    },

    // Switching
    { 
        type: 'Incomer Breaker', 
        label: 'Incomer Breaker', 
        category: 'Switching',
        data: { 
            label: 'Incomer Breaker', 
            component_type: 'Incomer Breaker',
            Type: 'Tie Breakr'
        } 
    },
    { 
        type: 'Coupling', 
        label: 'Coupling', 
        category: 'Switching',
        data: { 
            label: 'Coupling', 
            component_type: 'Coupling',
            Type: 'Tie Breakr'
        } 
    },

    // Loads (Placeholder)
    { 
        type: 'Load', 
        label: 'Load', 
        category: 'Loads',
        data: { 
            label: 'Load', 
            component_type: 'Load',
        } 
    },

    // Generation (Placeholder)
    { 
        type: 'SGen', 
        label: 'Static Gen', 
        category: 'Generation',
        data: { 
            label: 'Static Gen', 
            component_type: 'SGen',
        } 
    },
];

const ElementsSidebar = () => {
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        'Power Sources': true,
        'Conductors': true,
        'Transformers': true,
        'Switching': true,
        'Loads': false,
        'Generation': false,
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
