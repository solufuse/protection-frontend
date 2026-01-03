
// [structure:root]
// LOADFLOW PAGE
// [context:flow] Main entry point. Composes Logic (Hook) and UI (Components).

import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react'; 
import ProjectsSidebar, { Project } from '../components/ProjectsSidebar';
import GlobalRoleBadge from '../components/GlobalRoleBadge';
import ContextRoleBadge from '../components/ContextRoleBadge';
import { useLoadflow } from '../hooks/useLoadflow';

// Imported Modular Components
import LoadflowToolbar from '../components/Loadflow/LoadflowToolbar';
import ResultCard from '../components/Loadflow/ResultCard';
import HistorySidebar from '../components/Loadflow/HistorySidebar';

const Loadflow = ({ user }: { user: any }) => {
    // --- SIDEBAR STATE (STRICT COMPLIANCE) ---
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    
    // UI State
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [onlyWinners, setOnlyWinners] = useState(false); 
    const [showHistory, setShowHistory] = useState(true);

    // Logic Hook (Brain)
    const { 
        results, loading, error, historyFiles, 
        runAnalysis, loadResultFile 
    } = useLoadflow(currentProject?.id, currentProject?.name);

    // --- EFFECTS ---

    // 1. Fetch Projects on Mount (Required for Sidebar)
    useEffect(() => {
        const fetchProjects = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch("https://api.solufuse.com/projects/", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setProjects(data);
                }
            } catch (e) { console.error("Failed to load projects", e); }
        };
        fetchProjects();
    }, [user]);

    // 2. Sync Sidebar Selection with Local State
    useEffect(() => {
        if (activeProjectId) {
            const p = projects.find(proj => proj.id === activeProjectId);
            if (p) {
                setCurrentProject(p);
            }
        } else {
            setCurrentProject(null);
        }
    }, [activeProjectId, projects]);

    // --- HANDLERS (SIDEBAR PLACEHOLDERS) ---
    // Note: Create/Delete is managed fully in Files.tsx. 
    
    const handleCreateProject = () => { 
        alert("Please create projects from the Files Dashboard.");
        setIsCreatingProject(false);
    };
    
    // [FIX] Used 'id' in the alert string to satisfy TS6133 (unused variable)
    const handleDeleteProject = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        alert(`Please delete project ${id} from the Files Dashboard.`);
    };

    // Filter Logic
    const filteredResults = results.filter(r => {
        if (onlyWinners) return r.is_winner;
        return true;
    });

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* STRICT SIDEBAR IMPLEMENTATION */}
            <ProjectsSidebar 
                user={user}
                userGlobalData={user} // Pass user as global data
                projects={projects}
                // Selection Props
                activeProjectId={activeProjectId}
                setActiveProjectId={setActiveProjectId}
                // Session Props (Optional but good to pass null explicitly)
                activeSessionUid={null}
                setActiveSessionUid={() => {}} 
                // Creation Props
                isCreatingProject={isCreatingProject}
                setIsCreatingProject={setIsCreatingProject}
                newProjectName={newProjectName}
                setNewProjectName={setNewProjectName}
                onCreateProject={handleCreateProject}
                // Deletion Props
                onDeleteProject={handleDeleteProject}
            />

            <div className="flex-1 flex flex-col min-w-0">
                {/* HEADER */}
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
                    {/* MAIN CONTENT AREA */}
                    <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                        
                        <LoadflowToolbar 
                            onRun={runAnalysis} 
                            loading={loading}
                            onlyWinners={onlyWinners}
                            setOnlyWinners={setOnlyWinners}
                            count={filteredResults.length}
                        />

                        {/* RESULTS LIST */}
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

                    {/* HISTORY SIDEBAR */}
                    {showHistory && (
                        <HistorySidebar 
                            files={historyFiles} 
                            onLoad={loadResultFile} 
                            onClose={() => setShowHistory(false)} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Loadflow;
