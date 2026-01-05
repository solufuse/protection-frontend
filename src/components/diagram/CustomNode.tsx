
// src/components/diagram/CustomNode.tsx
import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow, NodeResizer } from 'reactflow';
import { Trash2 } from 'lucide-react';

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
      <div className={`relative ${selected ? 'selected' : ''}`}>
          <NodeResizer minWidth={100} minHeight={10} color="#4f46e5" isVisible={selected} />
          <Handle type="target" position={Position.Top} style={{ background: '#555', top: '50%' }} />
          <div 
              style={{ width: data.width || 200, height: 20 }}
              className="bg-gray-700 dark:bg-gray-600 border-2 border-gray-800 dark:border-gray-500 rounded-sm flex items-center justify-center text-white font-bold text-xs"
          >
              {data.name || 'BUS'}
          </div>
          <Handle type="source" position={Position.Bottom} style={{ background: '#555', top: '50%' }} />
          {selected && (
              <button
                  className="nodrag absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
                  onClick={onDelete} title="Delete Node"
              >
                  <Trash2 size={12} />
              </button>
          )}
      </div>
    );
  }

  // Default rendering for other nodes
  return (
    <div className={`react-flow__node-default ${selected ? 'selected' : ''}`} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', position: 'relative' }}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      {isEditing ? (
        <div className="flex flex-col gap-2 nodrag">
            {Object.keys(currentData).map(key => (
                <div key={key} className="flex items-center gap-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500">{key}</label>
                    <input
                        type="text"
                        value={currentData[key]}
                        onChange={(e) => handleValueChange(key, e.target.value)}
                        onBlur={applyChanges}
                        onKeyDown={(e) => e.key === 'Enter' && applyChanges()}
                        className="w-full text-center border border-slate-300 rounded-sm px-1 py-0.5"
                    />
                </div>
            ))}
        </div>
      ) : (
        <div style={{ fontWeight: 'bold' }} onDoubleClick={onDoubleClick}>
          {data.label}
        </div>
      )}
      {selected && (
        <button
          className="nodrag"
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            background: 'red',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: '1',
          }}
          onClick={onDelete}
          title="Delete Node"
        >
          <Trash2 size={12} />
        </button>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};

export default CustomNode;
