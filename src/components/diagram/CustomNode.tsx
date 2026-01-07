// src/components/diagram/CustomNode.tsx
import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Trash2, Settings, Activity, Database, Zap, FileText } from 'lucide-react';

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

  // Determine Node Category (Backend/Electrical vs Extraction/Formula)
  const isExtractionNode = ['Extraction', 'Formula', 'GetCalculation', 'Data'].some(t => componentType.includes(t));
  
  // Color Schemes
  // Blue Fluo for Backend/Electrical Diagram
  const blueStyle = "border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] bg-slate-900/90 text-cyan-50";
  const blueHeader = "bg-cyan-500/20 border-b border-cyan-500/30 text-cyan-300";
  
  // Red/Orange for Extraction/Specific Data
  const redStyle = "border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)] bg-slate-900/90 text-orange-50";
  const redHeader = "bg-orange-500/20 border-b border-orange-500/30 text-orange-300";

  const activeStyle = isExtractionNode ? redStyle : blueStyle;
  const headerStyle = isExtractionNode ? redHeader : blueHeader;

  const containerStyle = `relative flex flex-col w-[400px] h-[300px] rounded-lg border-2 transition-all ${activeStyle} ${
    selected ? 'ring-2 ring-white/50' : ''
  }`;

  // Render content based on type
  const renderContent = () => {
    // Electrical Components
    if (!isExtractionNode) {
        return (
            <div className="flex flex-col h-full p-4 space-y-4">
               <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-white/5">
                        <Zap size={24} className={isExtractionNode ? "text-orange-400" : "text-cyan-400"} />
                    </div>
                    <div>
                        <div className="text-sm opacity-70 uppercase tracking-wider">Component</div>
                        <div className="text-xl font-bold">{currentData.ID || currentData.label || componentType}</div>
                    </div>
               </div>

               <div className="flex-1 bg-black/20 rounded border border-white/5 p-3 font-mono text-sm overflow-auto">
                    {/* Display key properties dynamically */}
                    {Object.entries(currentData).map(([k, v]) => {
                        if (['id', 'label', 'component_type', 'width', 'height', 'position'].includes(k.toLowerCase())) return null;
                        return (
                            <div key={k} className="flex justify-between border-b border-white/5 py-1 last:border-0">
                                <span className="opacity-50">{k}:</span>
                                <span className="font-semibold">{String(v)}</span>
                            </div>
                        );
                    })}
               </div>
               
               <div className="flex justify-between items-center text-xs opacity-60">
                    <span>BACKEND CALCULATED</span>
                    <Activity size={14} />
               </div>
            </div>
        );
    }

    // Extraction / Formula Components
    return (
        <div className="flex flex-col h-full p-4 space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-white/5">
                    <Database size={24} className="text-orange-400" />
                </div>
                <div>
                    <div className="text-sm opacity-70 uppercase tracking-wider">Extraction Module</div>
                    <div className="text-xl font-bold">{currentData.ID || currentData.label || "Data Extractor"}</div>
                </div>
           </div>
           
           <div className="flex-1 flex items-center justify-center bg-orange-500/5 rounded border border-orange-500/20 border-dashed">
                <div className="text-center opacity-70">
                    <FileText size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Formula / Data Config</p>
                </div>
           </div>
        </div>
    );
  };

  return (
    <div 
        className={containerStyle}
        onDoubleClick={onDoubleClick}
    >
        {/* Header/Title Bar */}
        <div className={`h-8 w-full rounded-t flex items-center justify-between px-3 ${headerStyle}`}>
            <span className="text-[10px] font-bold tracking-widest uppercase">{componentType}</span>
            <div className="flex gap-2">
                 {selected && (
                    <>
                        <button className="hover:text-white transition-colors" onClick={() => setIsEditing(true)}>
                            <Settings size={12} />
                        </button>
                        <button className="hover:text-red-400 transition-colors" onClick={onDelete}>
                            <Trash2 size={12} />
                        </button>
                    </>
                )}
            </div>
        </div>

        {/* 
            Connection Handles:
            - Left: Input (Target) -> Main Flow
            - Right: Output (Source) -> Main Flow
            - Top: Accessory Input/Output (Target/Source) -> For attaching modules
            - Bottom: Accessory Input/Output (Target/Source) -> For attaching modules
        */}

        {/* Main Flow (Left to Right) */}
        <Handle 
            type="target" 
            position={Position.Left} 
            id="in-left"
            className="!w-4 !h-4 !bg-slate-200 !border-2 !border-slate-800 !rounded-full !-ml-2 hover:!bg-white transition-colors" 
        />
        <Handle 
            type="source" 
            position={Position.Right} 
            id="out-right"
            className="!w-4 !h-4 !bg-slate-200 !border-2 !border-slate-800 !rounded-full !-mr-2 hover:!bg-white transition-colors" 
        />

        {/* Accessory Flow (Top/Bottom) for Plug & Play Modules */}
        <Handle 
            type="target" 
            position={Position.Top} 
            id="in-top"
            className="!w-3 !h-3 !bg-slate-500 !border-2 !border-slate-900 !rounded-sm !-mt-1.5 opacity-50 hover:opacity-100 transition-opacity" 
        />
        <Handle 
            type="source" 
            position={Position.Bottom} 
            id="out-bottom"
            className="!w-3 !h-3 !bg-slate-500 !border-2 !border-slate-900 !rounded-sm !-mb-1.5 opacity-50 hover:opacity-100 transition-opacity" 
        />

        {/* Content */}
        {renderContent()}

        {/* Editor Modal */}
        {isEditing && (
            <div className="absolute top-10 left-10 z-50 bg-slate-800 border border-slate-600 shadow-2xl rounded p-4 w-64 text-left" onClick={e => e.stopPropagation()}>
                <h4 className="text-sm font-bold text-slate-300 mb-3 border-b border-slate-700 pb-2">Properties</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {Object.keys(currentData).map(key => {
                        if (['width', 'height', 'component_type', 'position', 'id'].includes(key.toLowerCase())) return null;
                        return (
                            <div key={key}>
                                <label className="block text-[10px] text-slate-500 uppercase mb-1">{key}</label>
                                <input
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:border-blue-500 outline-none"
                                    value={currentData[key]}
                                    onChange={(e) => handleValueChange(key, e.target.value)}
                                />
                            </div>
                        );
                    })}
                </div>
                <div className="mt-3 flex gap-2">
                    <button onClick={applyChanges} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 rounded">Save</button>
                    <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs py-1.5 rounded">Cancel</button>
                </div>
            </div>
        )}
    </div>
  );
};

export default CustomNode;
