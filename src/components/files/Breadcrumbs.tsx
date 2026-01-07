import { Icons } from '../../icons';

interface BreadcrumbsProps {
  path: string;
  onPathChange: (newPath: string) => void;
}

export default function Breadcrumbs({ path, onPathChange }: BreadcrumbsProps) {
  const parts = path ? path.split('/') : [];

  const handleCrumbClick = (index: number) => {
    if (index < 0) {
      onPathChange(''); // Go to root
    } else {
      const newPath = parts.slice(0, index + 1).join('/');
      onPathChange(newPath);
    }
  };

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
      <button 
        onClick={() => handleCrumbClick(-1)} 
        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 rounded-md -ml-1 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Icons.Home size={14} />
      </button>
      {parts.length > 0 && <Icons.ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />}
      
      {parts.map((part, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <button 
            onClick={() => handleCrumbClick(index)}
            disabled={index === parts.length - 1}
            className="px-2 py-1 rounded-md transition-colors disabled:cursor-default disabled:text-slate-700 dark:disabled:text-slate-300 enabled:hover:bg-slate-100 dark:enabled:hover:bg-slate-800 enabled:hover:text-blue-600"
          >
            {part}
          </button>
          {index < parts.length - 1 && <Icons.ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />}
        </div>
      ))}
    </div>
  );
}
