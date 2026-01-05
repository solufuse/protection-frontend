
// src/components/diagram/ContextMenu.tsx
import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onSelect: (type: string) => void;
}

const electricalBlocks = [
    { type: 'Busbar', icon: ' Minus ' },
    { type: 'Transformer', icon: ' T ' },
    { type: 'Circuit Breaker', icon: ' [ ] ' },
    { type: 'Grid', icon: ' G ' },
  ];

const ContextMenu = ({ x, y, onClose, onSelect }: ContextMenuProps) => {
  return (
    <div 
      style={{ position: 'absolute', top: y, left: x, background: 'white', border: '1px solid #ddd', zIndex: 1000, borderRadius: '8px', padding: '5px' }}
      onMouseLeave={onClose}
    >
      <ul>
        {electricalBlocks.map((block) => (
          <li key={block.type} onClick={() => onSelect(block.type)} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span className="font-mono">{block.icon}</span>
            <span>{block.type}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;
