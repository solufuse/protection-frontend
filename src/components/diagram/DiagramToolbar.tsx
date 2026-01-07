
import { RefObject } from 'react';
import { Save, Upload, Zap, Download } from 'lucide-react';
import { Icons } from '../../icons';

interface DiagramToolbarProps {
    fileInputRef: RefObject<HTMLInputElement>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleImportClick: () => void;
    handleDownload: () => void;
    handleSaveToSession: () => void;
    handleRunDiagram: () => void;
    setShowHistory: (show: boolean) => void;
    isLoading: boolean;
    API_URL: string;
}

const DiagramToolbar = ({
    fileInputRef,
    handleFileChange,
    handleImportClick,
    handleDownload,
    handleSaveToSession,
    handleRunDiagram,
    setShowHistory,
    isLoading,
    API_URL,
}: DiagramToolbarProps) => {

    return (
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
                    <Icons.HardDrive className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <span>Diagram Editor</span>
                </h1>
            </div>
            <div className="flex gap-2 relative">
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                
                <button onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded font-bold transition-all text-[10px]">
                    <Icons.Archive className="w-3.5 h-3.5" /> HISTORY
                </button>

                <button 
                    onClick={handleRunDiagram} 
                    disabled={isLoading} 
                    className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded font-bold shadow-sm transition-all text-[10px] disabled:opacity-50"
                >
                    <Zap className="w-3.5 h-3.5" />
                    RUN DIAGRAM
                </button>

                <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                <button onClick={handleImportClick} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded font-bold transition-all text-[10px]">
                    <Upload className="w-3.5 h-3.5" /> IMPORT
                </button>
                <button onClick={handleDownload} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded font-bold transition-all text-[10px]">
                    <Download className="w-3.5 h-3.5" /> EXPORT
                </button>
                <button onClick={handleSaveToSession} disabled={isLoading} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-bold shadow-sm transition-all text-[10px] disabled:opacity-50">
                    <Save className="w-3.5 h-3.5" />
                    {isLoading ? "SAVING..." : "SAVE CLOUD"}
                </button>
            </div>
        </div>
    );
};

export default DiagramToolbar;
