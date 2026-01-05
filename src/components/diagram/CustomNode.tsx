// src/components/diagram/CustomNode.tsx
import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow, NodeResizer } from 'reactflow';
import { Trash2 } from 'lucide-react';

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

  // Style for Busbar handles: always visible, styled as connection blocks.
  const busbarHandleStyle = {
    background: '#a3a3a3', // Solid grey background.
    border: '1px solid #717171', // Darker grey border.
    width: 10, // Slightly larger width for easier interaction.
    height: 10, // Slightly larger height.
  };

  // Special rendering logic for the 'Busbar' node.
  if (currentData.label === 'Busbar') {
    // Define a higher number of connection points for a multi-point busbar.
    const numHandles = 10; 
    // Calculate positions for handles to distribute them evenly across the busbar's length.
    const handlePositions = Array.from({ length: numHandles + 2 }).map((_, i) => { 
      const offset = (i + 1) * (100 / (numHandles + 3)); 
      return `${offset}%`;
    });

    // Get the initial busbar height, defaulting to 14px if not specified.
    const busbarHeight = currentData.height || 14;

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
          
          {/* Top and Bottom Handles for Busbar: Always visible connection blocks. */}
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
                  width: currentData.width || 200, 
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
                  {currentData.name || currentData.label}
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

  // Default rendering for other nodes (Grid, Transformer, etc.)
  return (
    <div 
        className={`relative flex flex-col items-center justify-center p-2 rounded-md bg-white dark:bg-slate-900 border-2 transition-all ${selected ? 'border-blue-500 shadow-lg' : 'border-slate-200 dark:border-slate-700'}`}
        style={{ minWidth: '60px', minHeight: '60px' }}
        onDoubleClick={onDoubleClick}
    >
      {/* Conditionally render handles for Grid node. */}
      {currentData.label === 'Grid' ? (
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
      
      {/* Display node label/name */}
      <div className="text-slate-700 dark:text-slate-200 mb-1 font-bold">
        {currentData.name || currentData.label}
      </div>

      {/* Only show bottom handles for non-Grid nodes. */}
      {currentData.label !== 'Grid' && ( 
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