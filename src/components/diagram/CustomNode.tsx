// src/components/diagram/CustomNode.tsx
import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow, NodeResizer } from 'reactflow';
import { Trash2 } from 'lucide-react';

// SVG Contents from files for different components.
const GridSvg = `<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg"><g stroke="black" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect x="20" y="10" width="60" height="60" /><line x1="20" y1="10" x2="80" y2="70" /> <line x1="80" y1="10" x2="20" y2="70" /> <polygon points="50,10 80,40 50,70 20,40" /><line x1="50" y1="70" x2="50" y2="140" /></g></svg>`;
const TransformerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 165"><line x1="30" y1="0" x2="30" y2="25" stroke="black" stroke-width="4" /><circle cx="30" cy="53" r="28" stroke="black" stroke-width="4" fill="none" /><circle cx="30" cy="85" r="28" stroke="black" stroke-width="4" fill="none" /><line x1="30" y1="113" x2="30" y2="138" stroke="black" stroke-width="4" /></svg>`;
const CircuitBreakerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 160"><g stroke="black" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"><line x1="30" y1="0" x2="30" y2="40" /><line x1="20" y1="30" x2="40" y1="50" /><line x1="40" y1="30" x2="20" y1="50" /><line x1="15" y1="55" x2="30" y1="105" /><line x1="30" y1="105" x2="30" y1="160" /></g></svg>`;

// Map component labels to their corresponding SVG React components.
const SvgComponents: { [key: string]: React.FC<{width?: string, height?: string}> } = {
  Grid: ({ width = "40px", height = "40px" }) => <div style={{width, height}} dangerouslySetInnerHTML={{ __html: GridSvg }} />,
  Transformer: ({ width = "40px", height = "60px" }) => <div style={{width, height}} dangerouslySetInnerHTML={{ __html: TransformerSvg }} />,
  'Circuit Breaker': ({ width = "40px", height = "40px" }) => <div style={{width, height}} dangerouslySetInnerHTML={{ __html: CircuitBreakerSvg }} />,
  // Default fallback icon for any unhandled type.
  Default: ({ width = "40px", height = "40px" }) => <div style={{width, height}} dangerouslySetInnerHTML={{ __html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" /></svg>' }} />
};

// CustomNode component definition.
const CustomNode = ({ id, data, selected }: NodeProps) => {
  const { setNodes } = useReactFlow(); // Hook to interact with the React Flow instance.
  const [isEditing, setIsEditing] = useState(false); // State to control edit mode for node properties.
  const [currentData, setCurrentData] = useState(data); // State to hold current node data, allowing local edits.

  // Update currentData when the prop 'data' changes.
  useEffect(() => {
    setCurrentData(data);
  }, [data]);

  // Handler for deleting a node.
  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling to parent elements.
    setNodes((nodes) => nodes.filter((n) => n.id !== id)); // Remove the node from the flow.
  };

  // Handler for updating a property in the node's data.
  const handleValueChange = (key: string, value: any) => {
    setCurrentData({ ...currentData, [key]: value });
  };

  // Apply changes made in the edit popover to the node data.
  const applyChanges = () => {
    setIsEditing(false); // Exit edit mode.
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: currentData, // Update node data with current local state.
          };
        }
        return node;
      })
    );
  };

  // Enable edit mode on double click.
  const onDoubleClick = () => {
    setIsEditing(true);
  };

  // Style for Busbar handles: invisible by default, slightly visible when selected.
  const busbarHandleStyle = {
    background: selected ? '#a3a3a3' : 'transparent', // Grey when selected, transparent otherwise.
    opacity: selected ? 0.3 : 0, // 30% visible when selected, invisible otherwise.
    width: 8, // Fixed width for discreet appearance.
    height: 8, // Fixed height for discreet appearance.
    transition: 'opacity 0.2s ease-in-out, background 0.2s ease-in-out', // Smooth transition for opacity and background.
  };

  // Special rendering logic for the 'Busbar' node.
  if (data.label === 'Busbar') {
    // Define a higher number of connection points for a multi-point busbar.
    const numHandles = 10; 
    // Calculate positions for handles to distribute them evenly across the busbar's length.
    const handlePositions = Array.from({ length: numHandles + 2 }).map((_, i) => { 
      const offset = (i + 1) * (100 / (numHandles + 3)); 
      return `${offset}%`;
    });

    // Get the initial busbar height, defaulting to 14px if not specified.
    const busbarHeight = data.height || 14;

    return (
      <div 
        className={`relative group ${selected ? 'selected' : ''}`}
        style={{
          minWidth: '50px',
          minHeight: `${busbarHeight}px`,
          zIndex: 10, // Ensure busbar is always rendered above edges
        }}
      > 
          {/* NodeResizer for controlling resize behavior. */}
          <NodeResizer 
            minWidth={50} 
            minHeight={busbarHeight} // Fix height for X-axis stretching only.
            maxHeight={busbarHeight} // Fix height for X-axis stretching only.
            isVisible={selected} 
            lineStyle={{ border: '1px solid #4f46e5' }} 
            handleStyle={{ opacity: 0, width: 0, height: 0 }} // Make resizing handles invisible.
            onResizeEnd={(_event, { width }) => {
              // Update node width while keeping height fixed.
              setNodes((nds) =>
                nds.map((node) => {
                  if (node.id === id) {
                    return {
                      ...node,
                      style: { ...node.style, width, height: busbarHeight },
                      data: { ...node.data, width, height: busbarHeight },
                    };
                  }
                  return node;
                })
              );
            }}
          />
          
          {/* Top and Bottom Handles for Busbar: These are the actual connection points, now invisible by default, but slightly visible on selection. */}
          {handlePositions.map((pos, index) => (
            <React.Fragment key={`busbar-handle-${index}`}>
              <Handle type="target" position={Position.Top} style={{ ...busbarHandleStyle, left: pos, top: 0 }} />
              <Handle type="source" position={Position.Top} style={{ ...busbarHandleStyle, left: pos, top: 0 }} />
              <Handle type="target" position={Position.Bottom} style={{ ...busbarHandleStyle, left: pos, bottom: 0, top: 'auto' }} />
              <Handle type="source" position={Position.Bottom} style={{ ...busbarHandleStyle, left: pos, bottom: 0, top: 'auto' }} />
            </React.Fragment>
          ))}

          {/* Main Busbar Body */}
          <div 
              style={{
                  width: data.width || 200, 
                  height: busbarHeight,
                  backgroundColor: '#374151', // Dark grey background.
                  border: selected ? '2px solid #4f46e5' : '2px solid #1f2937', // Border color based on selection.
                  borderRadius: 2,
                  position: 'relative', // Essential for z-index to work correctly on children if needed
                  zIndex: 1, // Ensures this div is above its own handles (though handles are typically children of the outer div)
              }}
              className="flex items-center justify-center transition-all"
              onDoubleClick={onDoubleClick}
          >
              <span className="text-[9px] text-white font-bold select-none px-1 overflow-hidden whitespace-nowrap">
                  {currentData.name || data.label}
              </span>
          </div>

          {/* Contextual Delete Button */}
          {selected && (
              <button
                  className="nodrag absolute -top-5 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer shadow-sm z-50 transition-colors"
                  onClick={onDelete} title="Delete Node"
              >
                  <Trash2 size={12} />
              </button>
          )}

          {/* Edit Popover for Busbar properties */}
          {isEditing && (
            <div className="absolute top-6 left-0 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-xl rounded p-2 min-w-[150px]">
                <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Properties</div>
                {Object.keys(currentData).map(key => {
                    // Skip internal properties like width, height, and label from being edited directly.
                    if (key === 'width' || key === 'height' || key === 'label') return null; 
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

  // Get the icon component based on the node's label, or use a default fallback.
  const IconComponent = SvgComponents[data.label as keyof typeof SvgComponents] || SvgComponents.Default;

  // Default rendering for other nodes (Grid, Transformer, etc.) using SVG Icons.
  return (
    <div 
        className={`relative flex flex-col items-center justify-center p-2 rounded-md bg-white dark:bg-slate-900 border-2 transition-all ${selected ? 'border-blue-500 shadow-lg' : 'border-slate-200 dark:border-slate-700'}`}
        style={{ minWidth: '60px', minHeight: '60px' }}
        onDoubleClick={onDoubleClick}
    >
      {/* Conditionally render handles for Grid node. */}
      {data.label === 'Grid' ? (
        <>
          {/* Grid as an incomer, source handle at the bottom. */}
          <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3" />
        </>
      ) : (
        <>
          {/* Default handles for other nodes (top target and source). */}
          <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-3 !h-3" />
          <Handle type="source" position={Position.Top} className="!bg-slate-400 !w-3 !h-3" />
        </>
      )}
      
      <div className="text-slate-700 dark:text-slate-200 mb-1">
        <IconComponent />
      </div>
      
      <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight">
        {currentData.name || data.label}
      </div>

      {/* Only show bottom handles for non-Grid nodes. */}
      {data.label !== 'Grid' && ( 
        <>
          <Handle type="target" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3" />
          <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3" />
        </>
      )}

      {selected && (
        <button
          className="nodrag absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer shadow-sm z-50 transition-colors"
          onClick={onDelete}
          title="Delete Node"
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* Edit Popover for general components. */}
      {isEditing && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-xl rounded p-2 min-w-[160px]">
            <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Properties</div>
            {Object.keys(currentData).map(key => {
                if (key === 'label') return null; // Skip label from being edited directly.
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