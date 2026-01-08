import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Icons } from '../icons';

// Interfaces (no change)
export interface Project {
    id: string;
    name: string;
    role: string;
}

export interface UserSummary {
    uid: string;
    username: string;
    email: string;
    global_role: string;
}

// Props (updated to optional)
interface ProjectsSidebarProps {
    user: User | null;
    userGlobalData?: any;
    projects: Project[];
    usersList?: UserSummary[];
    activeProjectId: string | null;
    setActiveProjectId: (id: string | null) => void;
    activeSessionUid?: string | null;
    setActiveSessionUid?: (uid: string | null) => void;
    isCreatingProject: boolean;
    setIsCreatingProject: (isCreating: boolean) => void;
    newProjectName: string;
    setNewProjectName: (name: string) => void;
    onCreateProject: () => void;
    onDeleteProject: (id: string, e: React.MouseEvent) => void;
    className?: string;
}

// --- Reusable Collapsible Section Component ---
interface CollapsibleSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    action?: React.ReactNode;
    defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, children, action, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mb-1">
            <div 
                className="flex justify-between items-center w-full px-2 py-1.5 rounded-md cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    {isOpen ? <Icons.ChevronDown className="w-4 h-4" /> : <Icons.ChevronRight className="w-4 h-4" />}
                    {icon}
                    <h3 className="font-bold text-slate-700 dark:text-slate-300">{title}</h3>
                </div>
                {action}
            </div>
            {isOpen && (
                <div className="pt-1 pl-5">
                    {children}
                </div>
            )}
        </div>
    );
};

// --- Main ProjectsSidebar Component ---
const ProjectsSidebar = ({ 
    user, userGlobalData, projects, usersList = [],
    activeProjectId, setActiveProjectId, activeSessionUid, setActiveSessionUid,
    isCreatingProject, setIsCreatingProject, newProjectName, setNewProjectName,
    onCreateProject, onDeleteProject, className
}: ProjectsSidebarProps) => {

    const isAdmin = userGlobalData && ['super_admin', 'admin'].includes(userGlobalData.global_role);

    const handleProjectClick = (id: string) => {
        setActiveProjectId(id);
        if (setActiveSessionUid) setActiveSessionUid(null);
    }

    const handleSessionClick = (uid: string | null) => {
        if (setActiveSessionUid) setActiveSessionUid(uid);
        setActiveProjectId(null);
    }

    return (
        <div className={`flex flex-col h-full p-2 text-xs ${className}`}>
            {/* --- Personal Session --- */}
            <div className="mb-3">
                 <button 
                    onClick={() => handleSessionClick(null)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md transition-colors font-semibold text-sm ${!activeProjectId && !activeSessionUid ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                     <Icons.User className="w-4 h-4" /> My Files
                </button>
            </div>

            {/* --- Projects Section --- */}
            <CollapsibleSection
                title="Projects"
                icon={<Icons.Folder className="w-4 h-4 text-slate-500" />}
                defaultOpen={true}
                action={
                    !user?.isAnonymous && (
                         <button onClick={(e) => { e.stopPropagation(); setIsCreatingProject(!isCreatingProject); }} className="text-blue-500 hover:text-blue-700 font-bold text-lg p-1 leading-none">{isCreatingProject ? '×' : '+'}</button>
                    )
                }
            >
                {isCreatingProject && (
                    <div className="flex gap-1 my-2">
                        <input 
                            type="text" 
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="New Project Name..." 
                            className="flex-grow bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button onClick={onCreateProject} className="bg-blue-600 text-white rounded-md px-3 py-1 font-bold">OK</button>
                    </div>
                )}
                <div className="space-y-1 mt-1">
                    {projects.map(p => (
                        <div key={p.id} onClick={() => handleProjectClick(p.id)} className={`group flex justify-between items-center w-full text-left gap-2 pl-3 pr-1 py-1.5 rounded-md cursor-pointer transition-colors font-semibold ${activeProjectId === p.id ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                            <span className="truncate">{p.name}</span>
                            {p.role === 'admin' && (
                                <button onClick={(e) => onDeleteProject(p.id, e)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 rounded-full">
                                    <Icons.Trash className="w-3 h-3"/>
                                </button>
                            )}
                        </div>
                    ))}
                     {projects.length === 0 && !isCreatingProject && <p className='text-slate-400 pl-3 py-1'>No projects yet.</p>}
                </div>
            </CollapsibleSection>
            
            {/* --- Admin: User Sessions Section --- */}
            {isAdmin && usersList && usersList.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
                    <CollapsibleSection
                        title="User Sessions"
                        icon={<Icons.Users className="w-4 h-4 text-slate-500" />}
                    >
                        <div className="space-y-1 mt-1">
                            {usersList.map(u => (
                                <button 
                                    key={u.uid} 
                                    onClick={() => handleSessionClick(u.uid)}
                                    className={`w-full text-left flex items-center gap-2 pl-3 pr-1 py-1.5 rounded-md transition-colors font-semibold ${activeSessionUid === u.uid ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                    <span className="truncate">{u.username}</span>
                                </button>
                            ))}
                        </div>
                    </CollapsibleSection>
                </div>
            )}
        </div>
    );
}

export default ProjectsSidebar;
