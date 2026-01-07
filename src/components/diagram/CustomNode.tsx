
// src/components/diagram/CustomNode.tsx
import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow, NodeResizer } from 'reactflow';
import { Trash2, Settings, AlertCircle, Info } from 'lucide-react';

// CustomNode component definition.
const CustomNode = ({ id, data, selected }: NodeProps) => {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [currentData, setCurrentData] = useState(data);

  // Update currentData when the prop 'data' changes, which happens if updated externally.
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

  // Helper: determine the component type or fallback to label
  const componentType = currentData.component_type || currentData.label;

  // Render logic based on component type
  
  // --- BUS ---
  if (componentType === 'Bus') {
    const busbarHeight = currentData.height || 14;
    // We can show key electrical info directly
    const voltage = currentData.NomlkV || currentData.KV || currentData.vn_kv || '?';
    
    return (
      <div 
        className={`relative group ${selected ? 'selected' : ''}`}
        style={{
          minWidth: '50px',
          minHeight: `${busbarHeight}px`,
          zIndex: 10,
        }}
      > 
          <NodeResizer 
            minWidth={50} 
            minHeight={busbarHeight} 
            maxHeight={busbarHeight}
            isVisible={selected} 
            lineStyle={{ border: '1px solid #4f46e5' }} 
            handleStyle={{ opacity: 0, width: 0, height: 0 }} 
            onResizeEnd={(_event, { width }) => {
              setNodes((nds) => nds.map((node) => node.id === id ? { ...node, style: { ...node.style, width, height: busbarHeight }, data: { ...node.data, width, height: busbarHeight } } : node));
            }}
          />
          
          {/* Multiple Handles for Busbar distributed along top/bottom */}
          {[10, 30, 50, 70, 90].map((pos) => (
             <React.Fragment key={pos}>
                <Handle type="target" position={Position.Top} style={{ left: `${pos}%`, top: -4, background: '#a3a3a3', width: 8, height: 8, borderRadius: 2 }} id={`t-${pos}`} />
                <Handle type="source" position={Position.Top} style={{ left: `${pos}%`, top: -4, background: '#a3a3a3', width: 8, height: 8, borderRadius: 2 }} id={`s-${pos}`} />
                <Handle type="target" position={Position.Bottom} style={{ left: `${pos}%`, bottom: -4, top: 'auto', background: '#a3a3a3', width: 8, height: 8, borderRadius: 2 }} id={`tb-${pos}`} />
                <Handle type="source" position={Position.Bottom} style={{ left: `${pos}%`, bottom: -4, top: 'auto', background: '#a3a3a3', width: 8, height: 8, borderRadius: 2 }} id={`sb-${pos}`} />
             </React.Fragment>
          ))}

          <div 
              style={{
                  width: currentData.width || 350, 
                  height: busbarHeight,
                  backgroundColor: '#374151',
                  border: selected ? '2px solid #4f46e5' : '2px solid #1f2937',
                  borderRadius: 2,
                  position: 'relative', 
                  zIndex: 1, 
              }}
              className="flex items-center justify-center transition-all px-2 overflow-hidden"
              onDoubleClick={onDoubleClick}
          >
              <div className="flex justify-between w-full text-[9px] text-white font-bold select-none whitespace-nowrap">
                  <span>{currentData.IDBus || currentData.label}</span>
                  <span className="opacity-70">{voltage} kV</span>
              </div>
          </div>
          
          {selected && (
            <div className="absolute -top-6 -right-0 flex gap-1 nodrag">
                <button className="bg-white dark:bg-slate-700 text-slate-500 hover:text-blue-500 border border-slate-200 dark:border-slate-600 rounded p-1 shadow-sm" onClick={() => setIsEditing(true)}><Settings size={12} /></button>
                <button className="bg-red-500 hover:bg-red-600 text-white rounded p-1 shadow-sm" onClick={onDelete}><Trash2 size={12} /></button>
            </div>
          )}

          {isEditing && <NodePropertiesEditor data={currentData} onChange={handleValueChange} onSave={applyChanges} onClose={() => setIsEditing(false)} />}
      </div>
    );
  }

  // --- TRANSFORMER ---
  if (componentType === 'Transformer') {
      const primV = currentData.PrimkV || '?';
      const secV = currentData.SeckV || '?';
      const mva = currentData.MVA || '?';
      
      return (
        <div className={`relative flex flex-col items-center p-1 ${selected ? 'ring-2 ring-blue-500 rounded' : ''}`} onDoubleClick={onDoubleClick} style={{ width: 80 }}>
            {/* Top Handle */}
            <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-3 !h-3" />
            <Handle type="source" position={Position.Top} className="!bg-slate-500 !w-3 !h-3" />

            {/* Transformer Icon - Two Circles */}
            <div className="flex flex-col items-center -space-y-2">
                 <div className="w-10 h-10 rounded-full border-2 border-slate-700 bg-white flex items-center justify-center z-10 text-[8px] font-bold text-slate-500">{primV}</div>
                 <div className="w-10 h-10 rounded-full border-2 border-slate-700 bg-white flex items-center justify-center text-[8px] font-bold text-slate-500">{secV}</div>
            </div>

            <div className="mt-1 text-center">
                <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">{currentData.ID || currentData.label}</div>
                <div className="text-[8px] text-slate-500">{mva} MVA</div>
            </div>

            {/* Bottom Handle */}
            <Handle type="target" position={Position.Bottom} className="!bg-slate-500 !w-3 !h-3" />
            <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-3 !h-3" />

            {selected && (
                <div className="absolute -top-4 -right-4 flex gap-1 nodrag">
                    <button className="bg-white dark:bg-slate-700 text-slate-500 hover:text-blue-500 border border-slate-200 dark:border-slate-600 rounded-full p-1 shadow-sm" onClick={() => setIsEditing(true)}><Settings size={12} /></button>
                    <button className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm" onClick={onDelete}><Trash2 size={12} /></button>
                </div>
            )}
             {isEditing && <NodePropertiesEditor data={currentData} onChange={handleValueChange} onSave={applyChanges} onClose={() => setIsEditing(false)} />}
        </div>
      );
  }

  // --- INCOMER / GRID ---
  if (componentType === 'Incomer' || componentType === 'Grid') {
      return (
          <div className={`relative flex flex-col items-center p-1 ${selected ? 'ring-2 ring-blue-500 rounded' : ''}`} onDoubleClick={onDoubleClick} style={{ width: 80 }}>
              <div className="w-14 h-14 border-2 border-slate-800 bg-slate-100 flex items-center justify-center relative">
                  <div className="text-xl font-bold">~</div>
              </div>
              
              <div className="mt-1 text-center">
                  <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">{currentData.ID || currentData.label}</div>
                  <div className="text-[8px] text-slate-500">{currentData.KV} kV</div>
              </div>

              <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-3 !h-3" />

              {selected && (
                <div className="absolute -top-4 -right-4 flex gap-1 nodrag">
                    <button className="bg-white dark:bg-slate-700 text-slate-500 hover:text-blue-500 border border-slate-200 dark:border-slate-600 rounded-full p-1 shadow-sm" onClick={() => setIsEditing(true)}><Settings size={12} /></button>
                    <button className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm" onClick={onDelete}><Trash2 size={12} /></button>
                </div>
              )}
               {isEditing && <NodePropertiesEditor data={currentData} onChange={handleValueChange} onSave={applyChanges} onClose={() => setIsEditing(false)} />}
          </div>
      )
  }

  // --- BREAKER / COUPLING ---
  if (componentType.includes('Breaker') || componentType === 'Coupling' || componentType === 'Switch') {
      const isClosed = currentData.closed !== false; // Default true/closed?
      return (
          <div className={`relative flex flex-col items-center p-1 ${selected ? 'ring-2 ring-blue-500 rounded' : ''}`} onDoubleClick={onDoubleClick} style={{ width: 60 }}>
              <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2" />
              
              <div className="w-8 h-8 border-2 border-slate-800 bg-white flex items-center justify-center">
                  {isClosed ? <div className="w-2 h-2 bg-slate-800 rounded-full"/> : <div className="w-2 h-2 border border-slate-800 rounded-full"/>}
              </div>

              <div className="mt-1 text-center">
                  <div className="text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate w-full">{currentData.ID || currentData.label}</div>
              </div>

              <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-2 !h-2" />

              {selected && (
                <div className="absolute -top-4 -right-4 flex gap-1 nodrag">
                    <button className="bg-white dark:bg-slate-700 text-slate-500 hover:text-blue-500 border border-slate-200 dark:border-slate-600 rounded-full p-1 shadow-sm" onClick={() => setIsEditing(true)}><Settings size={12} /></button>
                    <button className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm" onClick={onDelete}><Trash2 size={12} /></button>
                </div>
              )}
               {isEditing && <NodePropertiesEditor data={currentData} onChange={handleValueChange} onSave={applyChanges} onClose={() => setIsEditing(false)} />}
          </div>
      )
  }

  // --- DEFAULT FALLBACK ---
  return (
    <div 
        className={`relative flex flex-col items-center justify-center p-2 rounded bg-white dark:bg-slate-900 border-2 transition-all ${selected ? 'border-blue-500 shadow-lg' : 'border-slate-200 dark:border-slate-700'}`}
        style={{ minWidth: '80px', minHeight: '50px' }}
        onDoubleClick={onDoubleClick}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-3 !h-3 !rounded-sm" />
      <Handle type="source" position={Position.Top} className="!bg-slate-400 !w-3 !h-3 !rounded-sm" />

      <div className="text-slate-700 dark:text-slate-200 mb-0.5 font-bold text-xs text-center">
        {currentData.ID || currentData.label}
      </div>
      
      <div className="text-[9px] text-slate-400 uppercase tracking-wider text-center flex items-center gap-1 justify-center">
         {componentType !== currentData.label && <Info size={10}/>} {componentType}
      </div>

      <Handle type="target" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3 !rounded-sm" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3 !rounded-sm" />

      {selected && (
        <div className="absolute -top-3 -right-3 flex gap-1 nodrag">
             <button className="bg-white dark:bg-slate-700 text-slate-500 hover:text-blue-500 border border-slate-200 dark:border-slate-600 rounded-full p-1 shadow-sm" onClick={() => setIsEditing(true)}><Settings size={12} /></button>
             <button className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm" onClick={onDelete}><Trash2 size={12} /></button>
        </div>
      )}

      {isEditing && <NodePropertiesEditor data={currentData} onChange={handleValueChange} onSave={applyChanges} onClose={() => setIsEditing(false)} />}
    </div>
  );
};

// Sub-component for editing properties
const NodePropertiesEditor = ({ data, onChange, onSave, onClose }: { data: any, onChange: (k: string, v: any) => void, onSave: () => void, onClose: () => void }) => {
    return (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-xl rounded p-3 min-w-[220px] max-h-[300px] overflow-y-auto cursor-default text-left" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Settings size={10} /> Properties</span>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="space-y-2">
                {Object.keys(data).map(key => {
                    // Skip internal fields
                    if (['width', 'height', 'component_type', 'position'].includes(key)) return null;
                    return (
                        <div key={key} className="flex flex-col gap-0.5">
                            <label className="text-[9px] font-semibold text-slate-500 uppercase">{key}</label>
                            <input
                                type="text"
                                value={data[key]}
                                onChange={(e) => onChange(key, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && onSave()}
                                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 focus:ring-1 focus:ring-blue-500 outline-none dark:text-slate-200"
                            />
                        </div>
                    );
                })}
            </div>
            <button onClick={onSave} className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1 rounded transition-colors">SAVE CHANGES</button>
        </div>
    );
}

export default CustomNode;
