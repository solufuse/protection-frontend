
import { useState, useEffect, useCallback } from 'react';
import * as Icons from 'lucide-react'; 
import ProjectsSidebar, { Project, UserSummary } from '../components/ProjectsSidebar';
import GlobalRoleBadge from '../components/GlobalRoleBadge';
import ContextRoleBadge from '../components/ContextRoleBadge';

// --- TYPES ---
interface StudyCase { id: string; config: string; revision: string; }
interface TransformerResult { Tap: number; LFMW: number; LFMvar: number; kV: number; }
interface LoadflowResult {
  filename: string; 
  is_valid: boolean; 
  mw_flow: number; 
  mvar_flow: number; 
  delta_target: number; 
  is_winner: boolean;
  victory_reason?: string;
  status_color: string;
  study_case?: StudyCase; 
  transformers: Record<string, TransformerResult>;
  swing_bus_found?: { script: string };
}
interface LoadflowResponse { 
    status: string; 
    results: LoadflowResult[]; 
    folder?: string;
    filename?: string;
}

const Loadflow = ({ user }: { user: any }) => {
    // --- 1. SIDEBAR & CONTEXT STATE ---
    const [projects, setProjects] = useState<Project[]>([]);
    const [usersList, setUsersList] = useState<UserSummary[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [activeSessionUid, setActiveSessionUid] = useState<string | null>(null);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [userGlobalData, setUserGlobalData] = useState<any>(null);

    // --- 2. PAGE STATE ---
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [results, setResults] = useState<LoadflowResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // UI State
    const [onlyWinners, setOnlyWinners] = useState(false);
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
    const [showHistory, setShowHistory] = useState(true);
    const [historyFiles, setHistoryFiles] = useState<{name: string, date: string}[]>([]);

    // --- 3. API & LOGIC ---
    
    const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        if (!user) return;
        const t = await user.getIdToken();
        const headers = { 
            'Authorization': `Bearer ${t}`,
            'Content-Type': 'application/json',
            ...options.headers 
        };
        const response = await fetch(`https://api.solufuse.com${endpoint}`, { ...options, headers });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'API Error');
        }
        return response.json();
    }, [user]);

    // --- 4. INITIAL DATA LOADING ---
    useEffect(() => {
        const initData = async () => {
            if (!user) return;
            try {
                const t = await user.getIdToken();
                const headers = { Authorization: `Bearer ${t}` };

                // Projects
                const projRes = await fetch("https://api.solufuse.com/projects/", { headers });
                if (projRes.ok) setProjects(await projRes.json());

                // Users (Admin)
                if (['super_admin', 'admin', 'moderator'].includes(user.global_role)) {
                    const usersRes = await fetch("https://api.solufuse.com/users/", { headers });
                    if (usersRes.ok) {
                        const users = await usersRes.json();
                        setUsersList(users);
                        const self = users.find((u: any) => u.uid === user.uid);
                        setUserGlobalData(self || user);
                    }
                } else {
                    setUserGlobalData(user);
                }
            } catch (e) { console.error(e); }
        };
        initData();
    }, [user]);

    // --- 5. SYNC SELECTION ---
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

    // --- 6. LOGIC ---
    
    const refreshFiles = useCallback(async () => {
        if (!activeProjectId && !activeSessionUid) return;
        try {
            let url = `/files/details`;
            if (activeProjectId) url += `?project_id=${activeProjectId}`;
            else if (activeSessionUid) url += `?project_id=${activeSessionUid}`;

            const data = await apiCall(url);

            const archives = (data.files || [])
                .filter((f: any) => f.filename.includes('loadflow_results') || f.filename.match(/_\d{8}_\d{6}\.json$/))
                .map((f: any) => ({ name: f.filename, date: f.uploaded_at }));
            
            setHistoryFiles(prev => {
                const newIds = new Set(archives.map((a: any) => a.name));
                return [...archives, ...prev.filter(p => !newIds.has(p.name))].sort((a, b) => b.name.localeCompare(a.name));
            });

        } catch (err) { console.error(err); }
    }, [activeProjectId, activeSessionUid, apiCall]);

    useEffect(() => {
        if (activeProjectId || activeSessionUid) refreshFiles();
    }, [activeProjectId, activeSessionUid, refreshFiles]);

    const handleRun = async () => {
        if (!activeProjectId && !activeSessionUid) return;
        setLoading(true);
        setError(null);
        setResults([]);
        
        try {
            const basename = (currentProject?.name || 'run').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15) || 'lf_run';
            
            let url = `/loadflow/run-and-save?basename=${basename}`;
            if (activeProjectId) url += `&project_id=${activeProjectId}`;

            const data: LoadflowResponse = await apiCall(url, { method: 'POST' });

            setResults(data.results || []);
            
            if (data.filename) {
                const newEntry = { name: data.filename, date: new Date().toISOString() };
                setHistoryFiles(prev => [newEntry, ...prev]);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadHistory = async (filename: string) => {
        if (!activeProjectId && !activeSessionUid) return;
        setLoading(true);
        try {
            let url = `https://api.solufuse.com/files/download?filename=${filename}`;
            if (!filename.includes('/')) url = `https://api.solufuse.com/files/download?filename=loadflow_results/${filename}`;
            
            if (activeProjectId) url += `&project_id=${activeProjectId}`;
            else if (activeSessionUid) url += `&project_id=${activeSessionUid}`;

            const t = await user.getIdToken();
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${t}` }
            });
            
            if (!response.ok) throw new Error("Impossible de charger l'archive");
            
            const blob = await response.blob();
            const text = await blob.text();
            const json = JSON.parse(text); 
            
            if (Array.isArray(json)) setResults(json);
            else if (json.results) setResults(json.results);
            else if (Array.isArray(json.data)) setResults(json.data); 
            else throw new Error("Format JSON invalide");

        } catch (err: any) {
            setError("Erreur chargement historique: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (filename: string) => {
        setExpandedCards(prev => ({ ...prev, [filename]: !prev[filename] }));
    };

    const filteredResults = results.filter(r => {
        if (onlyWinners) return r.is_winner;
        return true;
    });

    const getStatusIcon = (color: string) => {
        if (color === 'green') return <Icons.CheckCircle className="w-5 h-5 text-green-500" />;
        if (color === 'orange') return <Icons.AlertTriangle className="w-5 h-5 text-orange-500" />;
        return <Icons.XCircle className="w-5 h-5 text-red-500" />;
    };

    const handleCreateProject = () => { alert("Please use Files page to create projects"); setIsCreatingProject(false); };
    const handleDeleteProject = (id: string, e: any) => { e.stopPropagation(); alert(`Go to Files to delete project ${id}`); };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
            <ProjectsSidebar 
                user={user} 
                userGlobalData={userGlobalData}
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

            <div className="flex-1 flex flex-col min-w-0">
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
                                ) : <span>My Session</span>}
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
                    <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                        <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between z-10">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleRun}
                                    disabled={loading || (!activeProjectId && !activeSessionUid)}
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
                                {results.length > 0 && <span>{results.length} scenarios analyzed</span>}
                            </div>
                        </div>

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
                                <div 
                                    key={idx} 
                                    className={`bg-white dark:bg-slate-800 border rounded-lg shadow-sm transition-all duration-200 ${
                                        res.is_winner 
                                        ? 'border-yellow-400 ring-1 ring-yellow-400/50 dark:border-yellow-600' 
                                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                                    }`}
                                >
                                    <div 
                                        onClick={() => toggleExpand(res.filename)}
                                        className="p-4 flex items-center justify-between cursor-pointer group select-none"
                                    >
                                        <div className="flex items-center gap-4">
                                            {getStatusIcon(res.status_color)}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                                                        {res.filename}
                                                    </h3>
                                                    {res.is_winner && (
                                                        <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold flex items-center gap-1 border border-yellow-200">
                                                            <Icons.Trophy className="w-3 h-3" /> Winner
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Icons.Hash className="w-3 h-3" /> {res.study_case?.id || 'N/A'}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="font-mono">{res.study_case?.config || 'Default'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Δ {res.delta_target?.toFixed(2)} MW
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    Target Gap
                                                </div>
                                            </div>
                                            <div className="text-right w-24">
                                                <div className="text-lg font-bold text-slate-900 dark:text-white">
                                                    {res.mw_flow?.toFixed(1)} <span className="text-xs font-normal text-slate-500">MW</span>
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    Flow @ Swing
                                                </div>
                                            </div>
                                            <Icons.ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedCards[res.filename] ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>

                                    {expandedCards[res.filename] && (
                                        <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-4 animate-in slide-in-from-top-2 duration-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                                    <p><span className="font-semibold">Revision:</span> {res.study_case?.revision}</p>
                                                    <p><span className="font-semibold">Swing Bus:</span> {res.swing_bus_found?.script || 'Not Found'}</p>
                                                </div>
                                                {res.victory_reason && (
                                                    <div className="text-xs bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 p-2 rounded border border-yellow-100 dark:border-yellow-800">
                                                        <span className="font-bold">Winning Reason:</span> {res.victory_reason}
                                                    </div>
                                                )}
                                            </div>

                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Transformers Data</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {Object.entries(res.transformers || {}).map(([name, data]) => (
                                                    <div key={name} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm shadow-sm flex flex-col gap-1">
                                                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-1 mb-1">
                                                            <span className="font-bold text-slate-700 dark:text-slate-200">{name}</span>
                                                            <span className="text-xs bg-blue-50 text-blue-700 px-1.5 rounded">Tap {data.Tap}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-x-2 text-xs">
                                                            <span className="text-slate-500">Power:</span>
                                                            <span className="text-right font-mono">{data.LFMW?.toFixed(2)} MW</span>
                                                            <span className="text-slate-500">Reactive:</span>
                                                            <span className="text-right font-mono">{data.LFMvar?.toFixed(2)} Mvar</span>
                                                            <span className="text-slate-500">Voltage:</span>
                                                            <span className="text-right font-mono">{data.kV?.toFixed(2)} kV</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </main>

                    {showHistory && (
                        <aside className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col shadow-xl z-20">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                                <div>
                                    <h2 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                        <Icons.Archive className="w-4 h-4" />
                                        Results Archive
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Click to load previous runs
                                    </p>
                                </div>
                                <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                                    <Icons.X className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {historyFiles.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        No archives found
                                    </div>
                                ) : (
                                    historyFiles.map((file, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleLoadHistory(file.name)}
                                            className="w-full text-left p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group border border-transparent hover:border-blue-100 dark:hover:border-slate-600"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icons.FileJson className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate w-full">
                                                    {file.name.replace('.json', '')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] text-slate-400 pl-6">
                                                <span>{new Date(file.date).toLocaleDateString()}</span>
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
