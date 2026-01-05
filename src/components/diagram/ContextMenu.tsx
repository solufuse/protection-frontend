
// src/components/diagram/ContextMenu.tsx
import { MouseEvent } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onSelect: (type: string) => void;
}

const CONTEXT_MENU_ITEMS = ['Grid', 'Busbar', 'Transformer', 'Circuit Breaker'];

const ContextMenu = ({ x, y, onClose, onSelect }: ContextMenuProps) => {
  const handleSelect = (e: MouseEvent, type: string) => {
    e.stopPropagation();
    onSelect(type);
    onClose();
  };

  return (
    <div
      style={{ top: y, left: x }}
      // Use position: fixed to position relative to the viewport
      className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg text-xs font-semibold"
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
    >
      <ul className="py-1">
        {CONTEXT_MENU_ITEMS.map((item) => (
          <li key={item}>
            <a
              href="#"
              className="block px-4 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={(e) => handleSelect(e, item)}
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;
