
// [structure:root]
// LOADFLOW PAGE
// [context:flow] Main entry point.

import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react'; 
import ProjectsSidebar, { Project, UserSummary } from '../components/ProjectsSidebar';
import { useLoadflow } from '../hooks/useLoadflow';

// Imported Modular Components
import LoadflowToolbar from '../components/Loadflow/LoadflowToolbar';
import ResultCard from '../components/Loadflow/ResultCard';
import HistorySidebar from '../components/Loadflow/HistorySidebar';

const Loadflow = ({ user }: { user: any }) => {
    // --- SIDEBAR STATE ---
    const [projects, setProjects] = useState<Project[]>([]);
    const [usersList, setUsersList] = useState<UserSummary[]>([]);
    
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [activeSessionUid, setActiveSessionUid] = useState<string | null>(null);
    
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    
    // UI State
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [onlyWinners, setOnlyWinners] = useState(false); 
    const [showHistory, setShowHistory] = useState(true);
    
    // [+] Run Name State
    const [runName, setRunName] = useState("");

    // Logic Hook
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

                // 1. Fetch Projects
                const projRes = await fetch("https://api.solufuse.com/projects/", { headers });
                if (projRes.ok) setProjects(await projRes.json());

                // 2. Fetch Users (If Admin/Staff)
                if (['super_admin', 'admin', 'moderator'].includes(user.global_role)) {
                    const usersRes = await fetch("https://api.solufuse.com/users/", { headers });
                    if (usersRes.ok) setUsersList(await usersRes.json());
                }

            } catch (e) { console.error("Failed to load sidebar data", e); }
        };
        fetchData();
    }, [user]);

    // --- SELECTION LOGIC ---
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

    const handleCreateProject = () => { alert("Create project via Files page"); setIsCreatingProject(false); };
    const handleDeleteProject = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        alert(`Please delete project ${id} from the Files Dashboard.`);
    };

    // [+] WRAPPER TO PASS NAME
    const handleRunClick = () => {
        runAnalysis(runName);
    };

    const filteredResults = results.filter(r => {
        if (onlyWinners) return r.is_winner;
        return true;
    });

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
            <ProjectsSidebar 
                user={user}
                userGlobalData={user}
                projects={projects}
                usersList={usersList}
                
                activeProjectId={activeProjectId}
                setActiveProjectId={setActiveProjectId}
                
                activeSessionUid={activeSessionUid}
                setActiveSessionUid={setActiveSessionUid}
                
                isCreatingProject={isCreatingProject}
                setIsCreatingProject={setIsCreatingProject}
                newProjectName={newProjectName}
                setNewProjectName={setNewProjectName}
                onCreateProject={handleCreateProject}
                onDeleteProject={handleDeleteProject}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                
                <LoadflowToolbar 
                    onRun={handleRunClick} 
                    loading={loading}
                    onlyWinners={onlyWinners}
                    setOnlyWinners={setOnlyWinners}
                    count={filteredResults.length}
                    project={currentProject} 
                    showHistory={showHistory}
                    onToggleHistory={() => setShowHistory(!showHistory)}
                    // [+] Pass Naming Props
                    runName={runName}
                    setRunName={setRunName}
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
                                <p className="text-xs font-bold uppercase tracking-widest">
                                    {currentProject ? `Ready to analyze ${currentProject.name}` : "Ready to analyze Session"}
                                </p>
                                <p className="text-[10px] mt-1">Enter a name and press Run</p>
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
