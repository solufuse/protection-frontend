// src/components/diagram/CustomNode.tsx
import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Trash2, Settings, Zap, Database, MoreHorizontal, Key } from 'lucide-react';

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
  const componentType = currentData.component_type || currentData.label || 'Unknown';
  const isExtractionNode = ['Extraction', 'Formula', 'GetCalculation', 'Data'].some(t => componentType.includes(t));

  // Discrete Design Configuration
  const headerColor = isExtractionNode ? 'bg-orange-500' : 'bg-blue-600';
  const iconColor = isExtractionNode ? 'text-orange-200' : 'text-blue-200';
  
  // Main Container Style - Discrete Dark Card
  const containerStyle = `relative flex flex-col w-[400px] h-[300px] bg-[#1e1e1e] rounded-lg border border-[#333] shadow-lg transition-all ${
    selected ? 'ring-2 ring-blue-500/50 border-transparent' : 'hover:border-[#555]'
  }`;

  const renderProperties = () => {
    return (
        <div className="flex-1 overflow-y-auto py-2 px-0 custom-scrollbar">
            {Object.entries(currentData).map(([k, v], index) => {
                // Filter out internal properties
                if (['id', 'label', 'component_type', 'width', 'height', 'position'].includes(k.toLowerCase())) return null;
                
                return (
                    <div key={k} className="flex justify-between items-center py-2 px-4 border-b border-[#2a2a2a] hover:bg-[#252525] group transition-colors">
                        <div className="flex items-center gap-2 overflow-hidden">
                            {index === 0 ? <Key size={12} className="text-slate-500 min-w-[12px]" /> : <div className="w-[12px]" />}
                            <span className="text-sm font-medium text-slate-300 truncate" title={k}>{k}</span>
                        </div>
                        <span className="text-sm font-mono text-slate-400 truncate max-w-[150px] text-right" title={String(v)}>
                            {String(v)}
                        </span>
                    </div>
                );
            })}
             {/* Add empty rows visualization if needed or just space */}
        </div>
    );
  };

  return (
    <div className={containerStyle} onDoubleClick={onDoubleClick}>
        {/* Header Bar */}
        <div className={`h-10 w-full rounded-t-lg flex items-center justify-between px-4 ${headerColor}`}>
            <div className="flex items-center gap-2">
                {isExtractionNode ? <Database size={16} className={iconColor} /> : <Zap size={16} className={iconColor} />}
                <span className="text-sm font-bold text-white tracking-wide truncate max-w-[250px]">
                    {currentData.ID || currentData.label || componentType}
                </span>
            </div>
            
            {/* Context Actions (Visible on hover/select) */}
            <div className="flex gap-1 opacity-80 hover:opacity-100">
                {selected ? (
                     <>
                        <button className="p-1 hover:bg-black/20 rounded text-white transition-colors" onClick={() => setIsEditing(true)}>
                            <Settings size={14} />
                        </button>
                        <button className="p-1 hover:bg-black/20 rounded text-white transition-colors" onClick={onDelete}>
                            <Trash2 size={14} />
                        </button>
                     </>
                ) : (
                    <MoreHorizontal size={16} className="text-white/50" />
                )}
            </div>
        </div>

        {/* Sub-Header / Type Indicator */}
        <div className="bg-[#252525] px-4 py-1 border-b border-[#333] flex justify-between items-center">
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                {isExtractionNode ? 'EXTRACTION MODULE' : 'COMPONENT PROPERTIES'}
            </span>
            <span className="text-[10px] text-slate-600 font-mono">
                {componentType}
            </span>
        </div>

        {/* Body / Properties List */}
        {renderProperties()}

        {/* Handles - Discrete & Professional */}
        <Handle 
            type="target" 
            position={Position.Left} 
            id="in-left"
            className="!w-3 !h-3 !bg-[#1e1e1e] !border-[3px] !border-slate-400 !rounded-full !-ml-[7px] hover:!border-white hover:!scale-125 transition-all" 
        />
        <Handle 
            type="source" 
            position={Position.Right} 
            id="out-right"
            className="!w-3 !h-3 !bg-[#1e1e1e] !border-[3px] !border-slate-400 !rounded-full !-mr-[7px] hover:!border-white hover:!scale-125 transition-all" 
        />

        {/* Inline Editor Modal */}
        {isEditing && (
            <div className="absolute top-12 left-4 right-4 z-50 bg-[#1e1e1e] border border-[#444] shadow-2xl rounded-md p-3 text-left animate-in fade-in zoom-in duration-100" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-3 border-b border-[#333] pb-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase">Edit Properties</h4>
                    <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white">✕</button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {Object.keys(currentData).map(key => {
                        if (['width', 'height', 'component_type', 'position', 'id'].includes(key.toLowerCase())) return null;
                        return (
                            <div key={key} className="flex flex-col gap-1">
                                <label className="text-[10px] text-slate-500 uppercase font-semibold">{key}</label>
                                <input
                                    className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-xs text-slate-200 focus:border-blue-500 outline-none transition-colors"
                                    value={currentData[key]}
                                    onChange={(e) => handleValueChange(key, e.target.value)}
                                />
                            </div>
                        );
                    })}
                </div>
                <div className="mt-3 flex gap-2">
                    <button onClick={applyChanges} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1.5 rounded transition-colors">SAVE</button>
                </div>
            </div>
        )}
    </div>
  );
};

export default CustomNode;
