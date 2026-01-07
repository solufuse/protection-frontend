import { useEffect, useState } from 'react';
import { Icons } from '../../icons';
import Toast from '../Toast';
import GlobalRoleBadge from '../GlobalRoleBadge';
import ContextRoleBadge from '../ContextRoleBadge';
import MembersModal from '../MembersModal';
import ProjectsSidebar, { Project, UserSummary } from '../ProjectsSidebar';
import FileToolbar from './FileToolbar';
import FileTable from './FileTable';
import Breadcrumbs from './Breadcrumbs'; // NEW: Import Breadcrumbs
import { useFileManager } from '../../hooks/useFileManager'; 
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase';

export default function FileManager({ user }: { user: any }) {
    const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' as 'success' | 'error' });
    const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });
    const getToken = async () => user ? await user.getIdToken() : null;

    // Project & Session Management
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [activeSessionUid, setActiveSessionUid] = useState<string | null>(null);
    const [usersList, setUsersList] = useState<UserSummary[]>([]);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [userGlobalData, setUserGlobalData] = useState<any>(null);
    const [showMembersModal, setShowMembersModal] = useState(false);

    // UPDATED: Destructure new functions from useFileManager
    const { files, loading, error, refreshFiles, handleDelete, handleUpload, handleCreateFolder, sortConfig, handleSort, starredFiles, toggleStar, currentPath, setCurrentPath } = useFileManager(user, activeProjectId, activeSessionUid, API_URL, notify);
    
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");

    // Clear selection when path or files change
    useEffect(() => {
        setSelectedFiles(new Set());
    }, [currentPath, files]);

    const filteredFiles = files.filter(f => f.filename.toLowerCase().includes(searchTerm.toLowerCase()));

    // --- Project & User Functions (no changes) ---
    const fetchGlobalProfile = async () => { try { const t = await getToken(); if(!t) return; const res = await fetch(`${API_URL}/users/me`, { headers: { 'Authorization': `Bearer ${t}` } }); if (res.ok) { const data = await res.json(); setUserGlobalData(data); if (['super_admin', 'admin'].includes(data.global_role)) fetchAllUsers(t); } } catch (e) { console.error("Profile fetch error", e)} };
    const fetchAllUsers = async (token: string) => { try { const res = await fetch(`${API_URL}/admin/users?limit=100`, { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setUsersList(await res.json()); } catch (e) { console.error("Admin user list error", e); } };
    const fetchProjects = async () => { try { const t = await getToken(); if(!t) return; const res = await fetch(`${API_URL}/projects/`, { headers: { 'Authorization': `Bearer ${t}` } }); if (res.ok) setProjects(await res.json()); } catch (e) { console.error("Failed to load projects", e); } };
    const createProject = async () => { if (user?.isAnonymous) { notify("Sign in with Google to create projects.", "error"); return; } if (!newProjectName.trim()) return; try { const t = await getToken(); const res = await fetch(`${API_URL}/projects/create`, { method: 'POST', headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: newProjectName, name: newProjectName }) }); if (!res.ok) throw new Error((await res.json()).detail); notify("Project Created"); setNewProjectName(""); setIsCreatingProject(false); fetchProjects(); } catch (e: any) { notify(`Creation failed: ${e.message}`, "error"); } };
    const deleteProject = async (projId: string, e: React.MouseEvent) => { e.stopPropagation(); if (!confirm(`Delete project "${projId}" and all its files permanently?`)) return; try { const t = await getToken(); const res = await fetch(`${API_URL}/projects/${projId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` } }); if (!res.ok) throw new Error(); notify("Project Deleted"); if (activeProjectId === projId) setActiveProjectId(null); fetchProjects(); } catch (e) { notify("Delete failed", "error"); } };
    const handleCopyProjectId = () => { if (!activeProjectId) return; navigator.clipboard.writeText(activeProjectId); notify("Project ID Copied"); };
    const handleGoogleSignIn = async () => { try { await signInWithPopup(auth, new GoogleAuthProvider()); window.location.reload(); } catch (e) { notify("Google Sign-In failed", "error"); } };

    useEffect(() => {
        if (user) {
            fetchGlobalProfile();
            fetchProjects();
        }
    }, [user]);

    const activeProject = projects.find(p => p.id === activeProjectId);
    let currentContextRole = 'viewer';
    if (activeProject) currentContextRole = activeProject.role;
    else if (!activeProjectId && !activeSessionUid) currentContextRole = 'admin';
    else if (activeSessionUid && userGlobalData?.global_role === 'super_admin') currentContextRole = 'admin';
    
    return (
        <div className="w-full h-full flex flex-col text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
            {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}

            <div className="flex-shrink-0 flex justify-between items-center p-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2">
                        {activeProjectId ? <Icons.FolderOpen className="w-5 h-5 text-blue-600" /> : <Icons.User className="w-5 h-5 text-slate-500" />}
                        <h2 className="text-lg font-bold truncate">
                            {activeProject ? activeProject.name : (activeSessionUid ? `${usersList.find(u=>u.uid === activeSessionUid)?.username || 'User'}'s Session` : "My Files")}
                        </h2>
                        {activeProjectId && <button onClick={handleCopyProjectId} className="text-slate-400 hover:text-slate-600"><Icons.Copy size={16} /></button>}
                    </div>
                    <ContextRoleBadge role={currentContextRole} isSession={!activeProjectId} />
                    {userGlobalData?.global_role && <GlobalRoleBadge role={userGlobalData.global_role} />}
                </div>
                <div className="flex items-center gap-2">
                    {activeProjectId && <button onClick={() => setShowMembersModal(true)} className="font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-md">Members</button>}
                    {user?.isAnonymous && <button onClick={handleGoogleSignIn} className="font-bold text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-md">Sign in with Google</button>}
                </div>
            </div>

            <div className="flex flex-1 gap-0 min-h-0">
                <div className="w-72 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 h-full flex flex-col">
                     <ProjectsSidebar 
                        user={user} userGlobalData={userGlobalData} projects={projects} usersList={usersList} 
                        activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} 
                        activeSessionUid={activeSessionUid} setActiveSessionUid={setActiveSessionUid} 
                        isCreatingProject={isCreatingProject} setIsCreatingProject={setIsCreatingProject} 
                        newProjectName={newProjectName} setNewProjectName={setNewProjectName} 
                        onCreateProject={createProject} onDeleteProject={deleteProject} 
                        className="w-full h-full"
                    />
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    <FileToolbar
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        onUpload={handleUpload}
                        onCreateFolder={handleCreateFolder}
                        onRefresh={refreshFiles}
                        onDelete={() => handleDelete(Array.from(selectedFiles))}
                        fileCount={filteredFiles.length}
                        selectedCount={selectedFiles.size}
                        hasWriteAccess={currentContextRole === 'admin' || currentContextRole === 'editor'}
                    />
                    {/* NEW: Breadcrumbs component added */}
                    <Breadcrumbs path={currentPath} onPathChange={setCurrentPath} />

                    <FileTable
                        files={filteredFiles}
                        loading={loading}
                        error={error}
                        selectedFiles={selectedFiles}
                        setSelectedFiles={setSelectedFiles}
                        onDelete={handleDelete}
                        onPathChange={setCurrentPath} // Connect path changes
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        starredFiles={starredFiles}
                        onToggleStar={toggleStar}
                        hasWriteAccess={currentContextRole === 'admin' || currentContextRole === 'editor'}
                    />
                </div>
            </div>

            {showMembersModal && activeProjectId && <MembersModal projectId={activeProjectId} userRole={activeProject?.role || 'viewer'} onClose={() => setShowMembersModal(false)} API_URL={API_URL} getToken={getToken} />}
        </div>
    );
}
