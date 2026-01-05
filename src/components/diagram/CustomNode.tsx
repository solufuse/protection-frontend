
// src/components/diagram/CustomNode.tsx
import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow, NodeResizer } from 'reactflow';
import { Trash2 } from 'lucide-react';

// SVG Icons for Electrical Components
const Icons = {
  Grid: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" />
      <path d="M2 12h20" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  Transformer: () => (
    <svg width="40" height="60" viewBox="0 0 40 60" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="20" cy="15" r="12" />
      <circle cx="20" cy="45" r="12" />
    </svg>
  ),
  'Circuit Breaker': () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M6 6l12 12" />
      <path d="M18 6l-12 12" />
    </svg>
  ),
  // Default fallback icon
  Default: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" />
    </svg>
  )
};

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
          return {
            ...node,
            data: currentData,
          };
        }
        return node;
      })
    );
  };

  const onDoubleClick = () => {
    setIsEditing(true);
  };

  // Special rendering for Busbar
  if (data.label === 'Busbar') {
    return (
      <div className={`relative group ${selected ? 'selected' : ''}`} style={{ minWidth: '50px' }}>
          <NodeResizer 
            minWidth={50} 
            minHeight={10} 
            isVisible={selected} 
            lineStyle={{ border: '1px solid #4f46e5' }} 
            handleStyle={{ width: 8, height: 8, borderRadius: '50%' }}
          />
          
          <Handle type="target" position={Position.Top} style={{ background: '#555', top: 0, width: 8, height: 8 }} />
          
          {/* Main Busbar Body */}
          <div 
              style={{ 
                  width: data.width || 200, 
                  height: 14,
                  backgroundColor: '#374151', // Dark grey bg
                  border: selected ? '2px solid #4f46e5' : '2px solid #1f2937',
                  borderRadius: 2
              }}
              className="flex items-center justify-center transition-all"
              onDoubleClick={onDoubleClick}
          >
              <span className="text-[9px] text-white font-bold select-none px-1 overflow-hidden whitespace-nowrap">
                  {currentData.name || data.label}
              </span>
          </div>

          <Handle type="source" position={Position.Bottom} style={{ background: '#555', bottom: 0, top: 'auto', width: 8, height: 8 }} />
          
          {/* Contextual Delete Button */}
          {selected && (
              <button
                  className="nodrag absolute -top-5 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer shadow-sm z-50 transition-colors"
                  onClick={onDelete} title="Delete Node"
              >
                  <Trash2 size={12} />
              </button>
          )}

          {/* Edit Popover */}
          {isEditing && (
            <div className="absolute top-6 left-0 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-xl rounded p-2 min-w-[150px]">
                <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Properties</div>
                {Object.keys(currentData).map(key => {
                    if (key === 'width' || key === 'label') return null; // Skip internal props
                    return (
                        <div key={key} className="mb-1">
                            <label className="text-[9px] block text-slate-500">{key}</label>
                            <input
                                type="text"
                                value={currentData[key]}
                                onChange={(e) => handleValueChange(key, e.target.value)}
                                onBlur={applyChanges}
                                onKeyDown={(e) => e.key === 'Enter' && applyChanges()}
                                className="w-full text-xs border border-slate-300 rounded px-1 py-0.5"
                            />
                        </div>
                    );
                })}
                <button onClick={applyChanges} className="w-full mt-1 bg-blue-600 text-white text-[10px] py-0.5 rounded">Done</button>
            </div>
          )}
      </div>
    );
  }

  // Get the icon component based on label or use fallback
  const IconComponent = Icons[data.label as keyof typeof Icons] || Icons.Default;

  // Default rendering for other nodes (Grid, Transformer, etc.) using SVG Icons
  return (
    <div 
        className={`relative flex flex-col items-center justify-center p-2 rounded-md bg-white dark:bg-slate-900 border-2 transition-all ${selected ? 'border-blue-500 shadow-lg' : 'border-slate-200 dark:border-slate-700'}`}
        style={{ minWidth: '60px', minHeight: '60px' }}
        onDoubleClick={onDoubleClick}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-3 !h-3" />
      
      <div className="text-slate-700 dark:text-slate-200 mb-1">
        <IconComponent />
      </div>
      
      <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight">
        {currentData.name || data.label}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3" />

      {selected && (
        <button
          className="nodrag absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer shadow-sm z-50 transition-colors"
          onClick={onDelete}
          title="Delete Node"
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* Edit Popover for Components */}
      {isEditing && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-xl rounded p-2 min-w-[160px]">
            <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Properties</div>
            {Object.keys(currentData).map(key => {
                if (key === 'label') return null;
                return (
                    <div key={key} className="mb-1">
                        <label className="text-[9px] block text-slate-500">{key}</label>
                        <input
                            type="text"
                            value={currentData[key]}
                            onChange={(e) => handleValueChange(key, e.target.value)}
                            onBlur={applyChanges}
                            onKeyDown={(e) => e.key === 'Enter' && applyChanges()}
                            className="w-full text-xs border border-slate-300 rounded px-1 py-0.5"
                        />
                    </div>
                );
            })}
            <button onClick={applyChanges} className="w-full mt-1 bg-blue-600 text-white text-[10px] py-0.5 rounded">Done</button>
        </div>
      )}
    </div>
  );
};

export default CustomNode;
