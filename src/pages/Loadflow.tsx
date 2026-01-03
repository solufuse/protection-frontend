
import { useState, useEffect } from 'react';
import { Icons } from '../icons';
import Toast from '../components/Toast';
import ProjectsSidebar, { Project, UserSummary } from '../components/ProjectsSidebar';
import GlobalRoleBadge from '../components/GlobalRoleBadge';
import ContextRoleBadge from '../components/ContextRoleBadge';

// Hooks & Components
import { useLoadflow } from '../hooks/useLoadflow';
import LoadflowChart from '../components/Loadflow/LoadflowChart';
import ResultsTable from '../components/Loadflow/ResultsTable';
import ArchiveModal from '../components/Loadflow/ArchiveModal';
import { LoadflowResult } from '../types/loadflow';

export default function Loadflow({ user }: { user: any }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [usersList, setUsersList] = useState<UserSummary[]>([]);
  const [userGlobalData, setUserGlobalData] = useState<any>(null);
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSessionUid, setActiveSessionUid] = useState<string | null>(null);
  
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  
  const [filterSearch, setFilterSearch] = useState("");
  const [filterWinner, setFilterWinner] = useState(false);
  const [filterValid, setFilterValid] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LoadflowResult | null>(null);

  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });
  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });

  const { 
      loading, results, scenarioGroups, baseName, setBaseName, historyFiles, 
      handleManualLoad, runAnalysis, extractLoadNumber 
  } = useLoadflow(user, activeProjectId, activeSessionUid, notify);

  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";
  const currentProjectRole = activeProjectId ? projects.find(p => p.id === activeProjectId)?.role : 'owner';

  const getToken = async () => { if (!user) return null; return await user.getIdToken(); };
  
  // --- DATA INIT ---
  useEffect(() => {
      const initData = async () => {
          if (!user) return;
          try {
              const t = await getToken();
              
              // 1. Projects
              try {
                  const pRes = await fetch(`${API_URL}/projects/`, { headers: { 'Authorization': `Bearer ${t}` } });
                  if (pRes.ok) setProjects(await pRes.json());
              } catch (e) {}

              // 2. User Data (Global Role)
              // [FIX] Always attempt to fetch users list. 
              // If backend allows it (200 OK), we are admin -> Set Badge.
              // If backend denies it (403), we are user -> No Badge.
              try {
                  const uRes = await fetch(`${API_URL}/users/`, { headers: { 'Authorization': `Bearer ${t}` } });
                  if (uRes.ok) {
                      const list = await uRes.json();
                      setUsersList(list);
                      const me = list.find((u: any) => u.uid === user.uid);
                      setUserGlobalData(me || user);
                  } else {
                      // 403 Forbidden or other error -> Standard User
                      setUserGlobalData(user);
                  }
              } catch (e) {
                  setUserGlobalData(user);
              }
          } catch (e) {}
      };
      initData();
  }, [user]);

  useEffect(() => { if (activeProjectId && activeSessionUid) setActiveSessionUid(null); }, [activeProjectId]);
  useEffect(() => { if (activeSessionUid && activeProjectId) setActiveProjectId(null); }, [activeSessionUid]);

  const getDisplayName = (fullId: string | null) => {
      if (!fullId) return "My Session";
      const project = projects.find(p => p.id === fullId);
      if (project) return project.name;
      const parts = fullId.split('_');
      if (parts.length > 1) return parts.slice(1).join('_'); 
      return fullId;
  };

  const handleCopyToken = async () => { const t = await getToken(); if (t) { navigator.clipboard.writeText(t); notify("Token Copied"); } };
  const createProjectWrapper = () => { notify("Please use Files Dashboard", "error"); setIsCreatingProject(false); };
  const deleteProjectWrapper = (id: string, e: any) => { e.stopPropagation(); notify(`Go to Files to delete ${id}`, "error"); };

  return (
    <div className="w-full px-6 py-6 text-[11px] font-sans flex flex-col relative min-h-full">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
              System Analysis
          </label>
          
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
                {activeProjectId ? (
                    <>
                        <Icons.Folder className="w-5 h-5 text-blue-600" />
                        <span>{getDisplayName(activeProjectId)}</span>
                    </>
                ) : (
                    <>
                        <Icons.HardDrive className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <span>My Session</span>
                    </>
                )}
            </h1>
            
            {/* Context Role (Owner/Viewer) */}
            <ContextRoleBadge role={currentProjectRole} isSession={activeProjectId === null} />
            
            {/* Global Role (Admin/User) - Now Fetched Correctly */}
            {userGlobalData && userGlobalData.global_role && (
                <div className="ml-2 scale-110">
                    <GlobalRoleBadge role={userGlobalData.global_role} />
                </div>
            )}
          </div>
        </div>
        
        {/* TOOLBAR */}
        <div className="flex gap-2 items-center">
          <input value={baseName} onChange={(e) => setBaseName(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 w-40 text-right font-bold text-slate-600 dark:text-slate-200 focus:ring-1 focus:ring-yellow-500 outline-none" placeholder="Analysis Name"/>
          <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wide mr-2">_TIMESTAMP.json</span>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
          <button onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded border font-bold transition-all text-[10px] bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
            <Icons.Archive className="w-3.5 h-3.5" /> RESULTS ARCHIVE
          </button>
          <button onClick={handleCopyToken} className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-yellow-600 font-bold transition-colors"><Icons.Key className="w-3.5 h-3.5" /> TOKEN</button>
          <button onClick={() => handleManualLoad(baseName)} disabled={loading} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 px-4 py-1.5 rounded font-bold shadow-sm disabled:opacity-50 transition-all border border-slate-300 dark:border-slate-600"><Icons.Search className="w-3.5 h-3.5" /> LOAD</button>
          <button onClick={runAnalysis} disabled={loading} className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1.5 rounded font-black shadow-sm disabled:opacity-50 transition-all">{loading ? <Icons.Activity className="w-3.5 h-3.5 animate-spin"/> : <Icons.Play className="w-3.5 h-3.5 fill-current" />} {loading ? "CALCULATING..." : "RUN"}</button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        <ProjectsSidebar 
            user={user} userGlobalData={userGlobalData || user} 
            projects={projects} usersList={usersList}
            activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId}
            activeSessionUid={activeSessionUid} setActiveSessionUid={setActiveSessionUid}
            isCreatingProject={isCreatingProject} setIsCreatingProject={setIsCreatingProject} 
            newProjectName={newProjectName} setNewProjectName={setNewProjectName} 
            onCreateProject={createProjectWrapper} onDeleteProject={deleteProjectWrapper} 
        />
        
        <div className="flex-1 flex flex-col gap-4 min-w-0">
             {results.length === 0 && !loading ? (
                 <div className="h-96 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-4 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded bg-slate-50/50 dark:bg-slate-900/50">
                    <Icons.Activity className="w-16 h-16" />
                    <span className="font-black uppercase tracking-widest">Ready to Simulate</span>
                 </div>
             ) : (
                 <>
                    <div className="w-full">
                        <LoadflowChart groups={scenarioGroups} extractLoadNumber={extractLoadNumber} />
                    </div>
                    <div className="w-full pb-10">
                        <ResultsTable 
                            results={results} 
                            filterSearch={filterSearch} setFilterSearch={setFilterSearch}
                            filterWinner={filterWinner} setFilterWinner={setFilterWinner}
                            filterValid={filterValid} setFilterValid={setFilterValid}
                            onSelectCase={setSelectedCase}
                        />
                    </div>
                 </>
             )}
        </div>
      </div>

      {showHistory && <ArchiveModal historyFiles={historyFiles} onClose={() => setShowHistory(false)} onLoad={handleManualLoad} />}
      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
      {selectedCase && <div className="hidden">Debug: {selectedCase.filename}</div>}
    </div>
  );
}
