
import { RefObject } from 'react';
import { Save, Upload, Zap, Download } from 'lucide-react';
import { Icons } from '../../icons';
import GlobalRoleBadge from '../GlobalRoleBadge';
import ContextRoleBadge from '../ContextRoleBadge';

interface DiagramToolbarProps {
    activeProjectId: string | null;
    activeSessionUid: string | null;
    usersList: any[];
    userGlobalData: any;
    getActiveProjectName: () => string | null;
    handleCopyProjectName: () => void;
    fileInputRef: RefObject<HTMLInputElement>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleImportClick: () => void;
    handleDownload: () => void;
    handleSaveToSession: () => void;
    handleRunDiagram: () => void;
    setShowHistory: (show: boolean) => void;
    isLoading: boolean;
    API_URL: string;
    currentProjectRole?: string;
}

const DiagramToolbar = ({
    activeProjectId,
    activeSessionUid,
    usersList,
    userGlobalData,
    getActiveProjectName,
    handleCopyProjectName,
    fileInputRef,
    handleFileChange,
    handleImportClick,
    handleDownload,
    handleSaveToSession,
    handleRunDiagram,
    setShowHistory,
    isLoading,
    API_URL,
    currentProjectRole
}: DiagramToolbarProps) => {

    return (
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <div className="flex flex-col">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">Workspace</label>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
                        {activeProjectId ? (
                            <>
                                <Icons.Folder className="w-5 h-5 text-blue-600" />
                                <span>{getActiveProjectName()}</span>
                                <button onClick={handleCopyProjectName} className="opacity-20 hover:opacity-100 transition-opacity">
                                    <Icons.Copy className="w-4 h-4" />
                                </button>
                            </>
                        ) : activeSessionUid ? (
                            <>
                                <Icons.Shield className="w-5 h-5 text-red-500" />
                                <span className="text-red-600">Session: {usersList.find(u => u.uid === activeSessionUid)?.username || activeSessionUid.slice(0, 6)}</span>
                            </>
                        ) : (
                            <>
                                <Icons.HardDrive className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                <span>Diagram Editor</span>
                            </>
                        )}
                    </h1>
                    <ContextRoleBadge role={currentProjectRole} isSession={activeProjectId === null && activeSessionUid === null} />
                    {userGlobalData && userGlobalData.global_role && (
                        <div className="ml-2 scale-110">
                            <GlobalRoleBadge role={userGlobalData.global_role} />
                        </div>
                    )}
                </div>
            </div>
            <div className="flex gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                {userGlobalData && userGlobalData.global_role === 'super_admin' && (
                    <button onClick={() => window.open(`${API_URL}/docs`, '_blank')} className="flex items-center gap-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-300 px-3 py-1.5 rounded border border-red-200 dark:border-red-900 text-red-600 font-bold transition-colors">
                        <Icons.Shield className="w-3.5 h-3.5" /> API
                    </button>
                )}

                <button onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded font-bold transition-all text-[10px]">
                    <Icons.Archive className="w-3.5 h-3.5" /> HISTORY
                </button>

                <button onClick={handleRunDiagram} disabled={isLoading} className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded font-bold shadow-sm transition-all text-[10px] disabled:opacity-50">
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
