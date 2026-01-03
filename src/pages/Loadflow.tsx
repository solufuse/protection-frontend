
import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react'; 
import ProjectsSidebar, { Project, UserSummary } from '../components/ProjectsSidebar';
import GlobalRoleBadge from '../components/GlobalRoleBadge';
import ContextRoleBadge from '../components/ContextRoleBadge';
import { useLoadflow } from '../hooks/useLoadflow';
import ResultCard from '../components/Loadflow/ResultCard'; // Maintaining component for cleanliness but layout is original

const Loadflow = ({ user }: { user: any }) => {
    // --- SIDEBAR STATE (Mandatory for compatibility) ---
    const [projects, setProjects] = useState<Project[]>([]);
    const [usersList, setUsersList] = useState<UserSummary[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [activeSessionUid, setActiveSessionUid] = useState<string | null>(null);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    
    // --- PAGE STATE ---
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [onlyWinners, setOnlyWinners] = useState(false); 
    const [showHistory, setShowHistory] = useState(true);
    const [runName, setRunName] = useState(""); // [!] Feature request: Naming
    
    // --- LOGIC HOOK ---
    const { 
        results, loading, error, historyFiles, 
        runAnalysis, loadResultFile 
    } = useLoadflow(activeProjectId, activeSessionUid, currentProject?.name);

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const headers = { Authorization: `Bearer ${token}` };
                
                const projRes = await fetch("https://api.solufuse.com/projects/", { headers });
                if (projRes.ok) setProjects(await projRes.json());

                if (['super_admin', 'admin', 'moderator'].includes(user.global_role)) {
                    const usersRes = await fetch("https://api.solufuse.com/users/", { headers });
                    if (usersRes.ok) setUsersList(await usersRes.json());
                }
            } catch (e) { console.error(e); }
        };
        fetchData();
    }, [user]);

    // --- SELECTION SYNC ---
    useEffect(() => {
        if (activeProjectId) {
            const p = projects.find(proj => proj.id === activeProjectId);
            if (p) setCurrentProject(p);
            if (activeSessionUid) setActiveSessionUid(null);
        } else if (activeSessionUid) {
            const u = usersList.find(usr => usr.uid === activeSessionUid);
            setCurrentProject({ 
                id: 'SESSION', 
                name: u ? `${u.username || 'User'}'s Session` : 'User Session', 
                role: 'viewer' 
            });
            if (activeProjectId) setActiveProjectId(null);
        } else {
            setCurrentProject(null);
        }
    }, [activeProjectId, activeSessionUid, projects, usersList]);

    // --- ACTIONS ---
    const handleRun = () => runAnalysis(runName);
    
    // Stub handlers for Sidebar
    const handleCreate = () => { alert("Please use Files page"); setIsCreatingProject(false); };
    const handleDelete = (id: string, e: any) => { e.stopPropagation(); alert(`Go to Files to delete ${id}`); };

    const filteredResults = results.filter(r => {
        if (onlyWinners) return r.is_winner;
        return true;
    });

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* SIDEBAR (Must use new props to work) */}
            <ProjectsSidebar 
                user={user} userGlobalData={user}
                projects={projects} usersList={usersList}
                activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId}
                activeSessionUid={activeSessionUid} setActiveSessionUid={setActiveSessionUid}
                isCreatingProject={isCreatingProject} setIsCreatingProject={setIsCreatingProject}
                newProjectName={newProjectName} setNewProjectName={setNewProjectName}
                onCreateProject={handleCreate} onDeleteProject={handleDelete}
            />

            <div className="flex-1 flex flex-col min-w-0">
                {/* --- HEADER (Restored Original Design) --- */}
                <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <Icons.Activity className="w-6 h-6 text-blue-600" />
                        <div>
                            <h1 className="text-lg font-bold text-slate-800 dark:text-white">Loadflow Analysis</h1>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                {currentProject ? (
                                    <>
                                        <span>{currentProject.name}</span>
                                        <ContextRoleBadge role={currentProject.role} />
                                    </>
                                ) : <span>Select a project</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <GlobalRoleBadge role={user?.global_role} />
                        <button 
                            onClick={() => setShowHistory(!showHistory)}
                            className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-slate-100 dark:bg-slate-700 text-blue-600' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            title="Toggle History"
                        >
                            <Icons.History className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* --- MAIN CONTENT --- */}
                    <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                        {/* --- TOOLBAR (Original Layout + Run Name Input) --- */}
                        <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between z-10">
                            <div className="flex items-center gap-2">
                                {/* [!] Added Input for Filename */}
                                <input 
                                    type="text" 
                                    placeholder="Run Name..." 
                                    value={runName}
                                    onChange={(e) => setRunName(e.target.value)}
                                    className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 sm:w-48"
                                    maxLength={20}
                                />

                                <button
                                    onClick={handleRun}
                                    disabled={loading || !currentProject}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    {loading ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Play className="w-4 h-4" />}
                                    Run Analysis & Save
                                </button>
                                
                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                                
                                <button
                                    onClick={() => setOnlyWinners(!onlyWinners)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                                        onlyWinners 
                                        ? 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-400' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <Icons.Trophy className="w-4 h-4" />
                                    {onlyWinners ? 'Winners Only' : 'Show All Candidates'}
                                </button>
                            </div>
                            
                            <div className="text-sm text-slate-500">
                                {filteredResults.length > 0 && <span>{filteredResults.length} scenarios analyzed</span>}
                            </div>
                        </div>

                        {/* --- RESULTS LIST --- */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <Icons.AlertOctagon className="w-5 h-5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {!loading && results.length === 0 && !error && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Icons.Activity className="w-16 h-16 mb-4 opacity-20" />
                                    <p>Ready to analyze. Press Run to start.</p>
                                </div>
                            )}

                            {filteredResults.map((res, idx) => (
                                <ResultCard key={`${res.filename}-${idx}`} res={res} />
                            ))}
                        </div>
                    </main>

                    {/* --- HISTORY SIDEBAR (Restored Original Position) --- */}
                    {showHistory && (
                        <aside className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col shadow-xl z-20">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                                <div>
                                    <h2 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                        <Icons.Archive className="w-4 h-4" />
                                        Results Archive
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1">Saved runs for this project</p>
                                </div>
                                <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                                    <Icons.X className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {historyFiles.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm">No archives found</div>
                                ) : (
                                    historyFiles.map((file, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => loadResultFile(file.path || file.name)}
                                            className="w-full text-left p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group border border-transparent hover:border-blue-100 dark:hover:border-slate-600"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icons.FileJson className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate w-full">
                                                    {file.name.replace(/_\d{8}_\d{6}/, '').replace('.json', '')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] text-slate-400 pl-6">
                                                <span>{new Date(file.date).toLocaleDateString()} {new Date(file.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                <Icons.ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Loadflow;
