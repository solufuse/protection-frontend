
// [structure:root]
// LOADFLOW PAGE
// [context:flow] Main entry point. Updated to match Files.tsx layout strictly.

import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react'; 
import ProjectsSidebar, { Project } from '../components/ProjectsSidebar';
import { useLoadflow } from '../hooks/useLoadflow';

// Imported Modular Components
import LoadflowToolbar from '../components/Loadflow/LoadflowToolbar';
import ResultCard from '../components/Loadflow/ResultCard';
import HistorySidebar from '../components/Loadflow/HistorySidebar';

const Loadflow = ({ user }: { user: any }) => {
    // --- SIDEBAR STATE ---
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    
    // UI State
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [onlyWinners, setOnlyWinners] = useState(false); 
    const [showHistory, setShowHistory] = useState(true);

    // Logic Hook
    const { 
        results, loading, error, historyFiles, 
        runAnalysis, loadResultFile 
    } = useLoadflow(currentProject?.id, currentProject?.name);

    // --- EFFECTS ---
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

    useEffect(() => {
        if (activeProjectId) {
            const p = projects.find(proj => proj.id === activeProjectId);
            if (p) setCurrentProject(p);
        } else {
            setCurrentProject(null);
        }
    }, [activeProjectId, projects]);

    const handleCreateProject = () => { alert("Create project via Files page"); setIsCreatingProject(false); };
    // [FIX] Used 'id' to satisfy unused variable check
    const handleDeleteProject = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        alert(`Please delete project ${id} from the Files Dashboard.`);
    };

    const filteredResults = results.filter(r => {
        if (onlyWinners) return r.is_winner;
        return true;
    });

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* 1. SIDEBAR (Same as Files) */}
            <ProjectsSidebar 
                user={user}
                userGlobalData={user}
                projects={projects}
                activeProjectId={activeProjectId}
                setActiveProjectId={setActiveProjectId}
                activeSessionUid={null}
                setActiveSessionUid={() => {}} 
                isCreatingProject={isCreatingProject}
                setIsCreatingProject={setIsCreatingProject}
                newProjectName={newProjectName}
                setNewProjectName={setNewProjectName}
                onCreateProject={handleCreateProject}
                onDeleteProject={handleDeleteProject}
            />

            {/* 2. MAIN CONTENT (No Top Header, Toolbar is first element) */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                
                <LoadflowToolbar 
                    onRun={runAnalysis} 
                    loading={loading}
                    onlyWinners={onlyWinners}
                    setOnlyWinners={setOnlyWinners}
                    count={filteredResults.length}
                    project={currentProject}
                    showHistory={showHistory}
                    onToggleHistory={() => setShowHistory(!showHistory)}
                />

                <div className="flex-1 flex overflow-hidden">
                    <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-900/50">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <Icons.AlertOctagon className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        {!loading && results.length === 0 && !error && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Icons.Activity className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">Ready to analyze</p>
                                <p className="text-[10px] mt-1">Select a project and press Run</p>
                            </div>
                        )}

                        {filteredResults.map((res, idx) => (
                            <ResultCard key={`${res.filename}-${idx}`} res={res} />
                        ))}
                    </main>

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
