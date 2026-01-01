
import React from 'react';
import { Icons } from '../icons';

export interface Project {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'moderator' | 'editor' | 'viewer' | 'staff_override';
}

export interface UserSummary {
  uid: string;
  email: string;
  username?: string;
  global_role: string;
}

interface ProjectsSidebarProps {
  user: any;
  userGlobalData?: any; // [+] Made Optional (?) to fix build on other pages
  projects: Project[];
  usersList?: UserSummary[]; // [+] Made Optional
  
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  
  activeSessionUid?: string | null; // [+] Made Optional
  setActiveSessionUid?: (uid: string | null) => void; // [+] Made Optional

  isCreatingProject: boolean;
  setIsCreatingProject: (val: boolean) => void;
  newProjectName: string;
  setNewProjectName: (val: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
}

export default function ProjectsSidebar({
  user,
  userGlobalData,
  projects,
  usersList,
  activeProjectId,
  setActiveProjectId,
  activeSessionUid,
  setActiveSessionUid,
  isCreatingProject,
  setIsCreatingProject,
  newProjectName,
  setNewProjectName,
  onCreateProject,
  onDeleteProject
}: ProjectsSidebarProps) {
    
  const handleSelectProject = (id: string) => {
      // [+] Safety check
      if (setActiveSessionUid) setActiveSessionUid(null);
      setActiveProjectId(id);
  };

  const handleSelectMySession = () => {
      if (setActiveSessionUid) setActiveSessionUid(null);
      setActiveProjectId(null);
  };

  const handleSelectUserSession = (uid: string) => {
      setActiveProjectId(null);
      if (setActiveSessionUid) setActiveSessionUid(uid);
  };

  const getOwnerDisplay = (proj: Project) => {
      if (proj.role === 'owner') return "Me";
      if (proj.id.startsWith("PUBLIC_")) return "System / Public";
      if (proj.id.includes("_")) {
          const possibleUid = proj.id.split("_")[0];
          // [+] Safety check for usersList
          const knownUser = (usersList || []).find(u => u.uid === possibleUid);
          if (knownUser) return `By ${knownUser.username || knownUser.email}`;
          return `By ${possibleUid.slice(0, 6)}...`;
      }
      return "Shared";
  };

  // Logic: Allowed Roles: Super Admin, Admin, Moderator
  const canViewSessions = ['super_admin', 'admin', 'moderator'].includes(userGlobalData?.global_role);

  return (
    <div className="w-60 flex flex-col gap-4">
      {/* --- ZONE 1 : MA SESSION --- */}
      <div 
        onClick={handleSelectMySession} 
        className={`flex items-center gap-3 p-3 rounded cursor-pointer border transition-all ${activeProjectId === null && (!activeSessionUid) ? 'bg-slate-800 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
      >
        <Icons.HardDrive className="w-4 h-4" />
        <div className="flex flex-col">
          <span className="font-bold uppercase tracking-wide">My Session</span>
          <span className="text-[9px] text-slate-400">Private Storage</span>
        </div>
      </div>

      <div className="border-t border-slate-200 my-1"></div>

      {/* --- ZONE 2 : PROJETS --- */}
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shared Projects</span>
        <button 
          disabled={user?.isAnonymous} 
          onClick={() => setIsCreatingProject(!isCreatingProject)} 
          className={`p-1 rounded transition-colors ${user?.isAnonymous ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-blue-50 text-blue-600'}`}
        >
          <Icons.Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {isCreatingProject && (
        <div className="flex gap-1">
          <input 
            className="w-full text-[10px] p-1.5 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
            placeholder="Project ID..." 
            value={newProjectName} 
            onChange={(e) => setNewProjectName(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && onCreateProject()} 
            autoFocus 
          />
          <button onClick={onCreateProject} className="bg-blue-600 text-white px-2 rounded font-bold text-[9px]">OK</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto flex flex-col gap-1 custom-scrollbar pr-1 min-h-[100px]">
        {projects.map(p => (
          <div 
            key={p.id} 
            onClick={() => handleSelectProject(p.id)} 
            className={`group flex justify-between items-center p-2 rounded cursor-pointer border transition-all ${activeProjectId === p.id ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {p.role === 'owner' ? <span title="Owner">👑</span> : <Icons.User className={`w-3.5 h-3.5 ${activeProjectId === p.id ? 'text-blue-200' : 'text-slate-300'}`} />}
              <div className="flex flex-col overflow-hidden">
                  <span className="font-bold truncate">{p.name}</span>
                  <span className={`text-[9px] truncate ${activeProjectId === p.id ? 'text-blue-200' : 'text-slate-400'}`}>
                      {getOwnerDisplay(p)}
                  </span>
              </div>
            </div>
            {p.role !== 'moderator' && (
              <button 
                onClick={(e) => onDeleteProject(p.id, e)} 
                className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${activeProjectId === p.id ? 'hover:bg-blue-700 text-white' : 'hover:bg-red-100 text-red-400'}`}
              >
                <Icons.Trash className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* --- ZONE 3 : USER SESSIONS (STAFF) --- */}
      {/* [+] Added safety check: only show if usersList provided */}
      {canViewSessions && usersList && (
        <>
          <div className="border-t border-slate-200 my-1"></div>
          <div className="flex items-center gap-2 px-1 mb-1">
            <Icons.Shield className="w-3 h-3 text-red-500" />
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">User Sessions</span>
          </div>
          
          <div className="flex-1 overflow-y-auto flex flex-col gap-1 custom-scrollbar pr-1 max-h-[200px]">
             {usersList.map(u => (
               <div 
                 key={u.uid}
                 onClick={() => handleSelectUserSession(u.uid)}
                 className={`flex items-center gap-2 p-2 rounded cursor-pointer border transition-all ${activeSessionUid === u.uid ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white text-slate-500 border-transparent hover:bg-slate-50'}`}
               >
                 <div className={`w-2 h-2 rounded-full ${u.global_role === 'super_admin' ? 'bg-red-500' : (u.global_role === 'nitro' ? 'bg-yellow-400' : 'bg-slate-300')}`} />
                 <div className="flex flex-col overflow-hidden">
                    <span className="font-bold truncate text-[10px]">{u.username || "User"}</span>
                    <span className="truncate text-[9px] opacity-70">{u.email}</span>
                 </div>
               </div>
             ))}
          </div>
        </>
      )}
    </div>
  );
}
