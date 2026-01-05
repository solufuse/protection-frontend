
// src/components/diagram/CustomNode.tsx
import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Trash2 } from 'lucide-react';

const CustomNode = ({ id, data, selected }: NodeProps) => {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  useEffect(() => {
    setLabel(data.label);
  }, [data.label]);

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nodes) => nodes.filter((n) => n.id !== id));
  };

  const handleLabelChange = () => {
    setIsEditing(false);
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: label,
            },
          };
        }
        return node;
      })
    );
  };

  const onDoubleClick = () => {
    setIsEditing(true);
  };

  return (
    <div className={`react-flow__node-default ${selected ? 'selected' : ''}`} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', position: 'relative' }}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      {isEditing ? (
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleLabelChange}
          onKeyDown={(e) => e.key === 'Enter' && handleLabelChange()}
          autoFocus
          className="nodrag"
          style={{ width: '100%', textAlign: 'center', border: '1px solid #777', borderRadius: '4px' }}
        />
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
