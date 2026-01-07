
// src/components/diagram/CustomNode.tsx
import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Trash2, Settings, Info } from 'lucide-react';

// CustomNode component definition.
const CustomNode = ({ id, data, selected }: NodeProps) => {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [currentData, setCurrentData] = useState(data);

  useEffect(() => {
    setCurrentData(data);
  }, [data]);

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nodes) => nodes.filter((n) => n.id !== id));
  };

  const handleValueChange = (key: string, value: any) => {
    setCurrentData({ ...currentData, [key]: value });
  };

  const applyChanges = () => {
    setIsEditing(false);
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: currentData };
        }
        return node;
      })
    );
  };

  const onDoubleClick = () => setIsEditing(true);

  // Helper to determine component type
  const componentType = currentData.component_type || currentData.label;

  // Common styles for the "text diagram" look
  const containerStyle = `relative flex flex-col items-center justify-center p-2 rounded-sm border-2 transition-all bg-white dark:bg-slate-900 ${
    selected ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-300 dark:border-slate-600'
  }`;
  
  const labelStyle = "font-bold text-xs text-slate-800 dark:text-slate-100 text-center select-none";
  const subLabelStyle = "text-[9px] text-slate-500 dark:text-slate-400 font-mono text-center mt-0.5 select-none";

  // Render content based on type
  const renderContent = () => {
    if (componentType === 'Bus') {
        const voltage = currentData.NomlkV || currentData.KV || currentData.vn_kv || '?';
        return (
            <>
                <div className={labelStyle}>{currentData.IDBus || currentData.label}</div>
                <div className={subLabelStyle}>{voltage} kV</div>
            </>
        );
    }
    
    if (componentType === 'Transformer') {
        const primV = currentData.PrimkV || '?';
        const secV = currentData.SeckV || '?';
        const mva = currentData.MVA || '?';
        return (
            <>
                <div className={labelStyle}>{currentData.ID || currentData.label}</div>
                <div className={subLabelStyle}>{mva} MVA</div>
                <div className="text-[8px] text-slate-400 mt-0.5">{primV}/{secV} kV</div>
            </>
        );
    }

    if (componentType === 'Incomer' || componentType === 'Grid') {
        return (
            <>
                <div className={labelStyle}>{currentData.ID || currentData.label}</div>
                <div className={subLabelStyle}>{currentData.KV || '?'} kV</div>
                <div className="text-[8px] text-slate-400 mt-0.5 uppercase tracking-wider">SOURCE</div>
            </>
        );
    }

    if (componentType.includes('Breaker') || componentType === 'Coupling' || componentType === 'Switch') {
        const isClosed = currentData.closed !== false;
        return (
            <>
                <div className={labelStyle}>{currentData.ID || currentData.label}</div>
                <div className={`text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded ${isClosed ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                    {isClosed ? 'CLOSED' : 'OPEN'}
                </div>
            </>
        );
    }

    // Default
    return (
        <>
            <div className={labelStyle}>{currentData.ID || currentData.label}</div>
            <div className={subLabelStyle}>{componentType}</div>
        </>
    );
  };

  // Dimensions based on type
  let width = 100;
  let height = 50;
  
  if (componentType === 'Bus') {
      width = currentData.width || 120;
      height = currentData.height || 40;
  } else if (componentType === 'Transformer') {
      height = 60;
  } else if (componentType.includes('Breaker')) {
      width = 80;
      height = 50;
  }

  return (
    <div 
        className={containerStyle}
        style={{ minWidth: width, minHeight: height }}
        onDoubleClick={onDoubleClick}
    >
        {/* Handles */}
        <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2 !rounded-sm" />
        <Handle type="source" position={Position.Top} className="!bg-slate-400 !w-2 !h-2 !rounded-sm" />
        <Handle type="target" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2 !rounded-sm" />
        <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2 !rounded-sm" />

        {/* Content */}
        {renderContent()}

        {/* Action Buttons */}
        {selected && (
            <div className="absolute -top-3 -right-3 flex gap-1 nodrag z-50">
                <button className="bg-white dark:bg-slate-700 text-slate-500 hover:text-blue-500 border border-slate-200 dark:border-slate-600 rounded-full p-1 shadow-sm transition-colors" onClick={() => setIsEditing(true)}>
                    <Settings size={12} />
                </button>
                <button className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm transition-colors" onClick={onDelete}>
                    <Trash2 size={12} />
                </button>
            </div>
        )}

        {/* Editor */}
        {isEditing && (
            <NodePropertiesEditor 
                data={currentData} 
                onChange={handleValueChange} 
                onSave={applyChanges} 
                onClose={() => setIsEditing(false)} 
            />
        )}
    </div>
  );
};

// Sub-component for editing properties
const NodePropertiesEditor = ({ data, onChange, onSave, onClose }: { data: any, onChange: (k: string, v: any) => void, onSave: () => void, onClose: () => void }) => {
    return (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-xl rounded-lg p-3 min-w-[200px] max-h-[300px] overflow-y-auto cursor-default text-left" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Settings size={10} /> Properties</span>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="space-y-2">
                {Object.keys(data).map(key => {
                    // Skip internal fields
                    if (['width', 'height', 'component_type', 'position', 'id'].includes(key.toLowerCase())) return null;
                    return (
                        <div key={key} className="flex flex-col gap-0.5">
                            <label className="text-[9px] font-semibold text-slate-500 uppercase truncate" title={key}>{key}</label>
                            <input
                                type="text"
                                value={data[key]}
                                onChange={(e) => onChange(key, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && onSave()}
                                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none dark:text-slate-200"
                            />
                        </div>
                    );
                })}
            </div>
            <button onClick={onSave} className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 rounded transition-colors">SAVE</button>
        </div>
    );
}

export default CustomNode;
