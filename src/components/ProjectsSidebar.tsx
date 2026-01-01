
import React, { useState, useEffect } from 'react';
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
  userGlobalData?: any;
  projects: Project[];
  usersList?: UserSummary[];
  
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  
  activeSessionUid?: string | null;
  setActiveSessionUid?: (uid: string | null) => void;

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
    
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // States for collapsible sections
  const [isSessionsExpanded, setIsSessionsExpanded] = useState(false);
  const [isAdminSectionExpanded, setIsAdminSectionExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('solufuse_favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // Auto-expand logic
  useEffect(() => {
    if (searchTerm.trim() !== "") {
        setIsSessionsExpanded(true);
        setIsAdminSectionExpanded(true);
    } else if (activeSessionUid) {
        setIsSessionsExpanded(true);
    }
  }, [searchTerm, activeSessionUid]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavs = favorites.includes(id) 
      ? favorites.filter(f => f !== id) 
      : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('solufuse_favorites', JSON.stringify(newFavs));
  };

  const handleSelectProject = (id: string) => {
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

  const canViewSessions = ['super_admin', 'admin', 'moderator'].includes(userGlobalData?.global_role);

  // --- SMART GROUPING LOGIC ---
  
  // 1. PUBLIC PROJECTS (Always Top)
  const publicProjects = projects.filter(p => p.id.startsWith("PUBLIC_"));

  // 2. MY WORKSPACE (Favorites + Owned + Not Public)
  const myWorkspaceProjects = projects.filter(p => {
      if (p.id.startsWith("PUBLIC_")) return false;
      // It's mine if I'm owner OR if I starred it
      return p.role === 'owner' || favorites.includes(p.id);
  });

  // 3. OTHER / ADMIN VIEW (Everything else)
  const otherProjects = projects.filter(p => {
      if (p.id.startsWith("PUBLIC_")) return false;
      return p.role !== 'owner' && !favorites.includes(p.id);
  });

  // Filter function for search
  const filterList = (list: Project[]) => {
      return list.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          p.id.toLowerCase().includes(searchTerm.toLowerCase())
      ).sort((a, b) => a.name.localeCompare(b.name));
  };

  const filteredUsers = (usersList || [])
    .filter(u => (u.username || "").toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  // Reusable Project Item Component
  const ProjectItem = ({ p }: { p: Project }) => {
      const isFav = favorites.includes(p.id);
      const isActive = activeProjectId === p.id;
      return (
        <div 
          onClick={() => handleSelectProject(p.id)} 
          className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer border transition-all mb-0.5 ${isActive ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white text-slate-600 border-transparent hover:bg-slate-50'}`}
        >
          <div className="flex items-center gap-2 overflow-hidden truncate">
            {p.id.startsWith("PUBLIC_") ? (
                <Icons.Hash className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-blue-200' : 'text-slate-400'}`} />
            ) : p.role === 'owner' ? (
                <span title="Owner" className="text-[10px]">👑</span>
            ) : (
                <Icons.Folder className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-blue-200' : 'text-slate-300'}`} />
            )}
            <span className="font-bold truncate text-[10px]">{p.name}</span>
          </div>

          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              <button 
                  onClick={(e) => toggleFavorite(p.id, e)}
                  className={`${isFav ? 'opacity-100 text-yellow-400' : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-yellow-400'} transition-opacity`}
              >
                  <Icons.Star className="w-3 h-3 fill-current" />
              </button>

              {p.role !== 'moderator' && (
                <button 
                  onClick={(e) => onDeleteProject(p.id, e)} 
                  className={`p-0.5 rounded transition-opacity ${isActive ? 'text-blue-200 hover:bg-blue-700' : 'opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-400'}`}
                >
                  <Icons.Trash className="w-2.5 h-2.5" />
                </button>
              )}
          </div>
        </div>
      );
  };

  return (
    <div className="w-60 flex flex-col gap-2 h-full">
      
      {/* SEARCH */}
      <div className="relative mb-1">
        <Icons.Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-400" />
        <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded pl-7 pr-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
        />
      </div>

      {/* MY SESSION */}
      <div 
        onClick={handleSelectMySession} 
        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer border transition-all ${activeProjectId === null && (!activeSessionUid) ? 'bg-slate-800 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-transparent hover:bg-slate-50'}`}
      >
        <Icons.HardDrive className="w-3.5 h-3.5" />
        <span className="font-bold text-[10px]">My Session</span>
      </div>

      <div className="border-t border-slate-100 my-1"></div>

      {/* --- SECTION 1: COMMUNITY (Public) --- */}
      <div className="flex justify-between items-center px-1 mb-1">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Community</span>
      </div>
      <div className="flex flex-col">
          {filterList(publicProjects).map(p => <ProjectItem key={p.id} p={p} />)}
      </div>

      {/* --- SECTION 2: MY WORKSPACE (Owner + Favorites) --- */}
      <div className="flex justify-between items-center px-1 mt-3 mb-1 group">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">My Workspace</span>
        <button 
          disabled={user?.isAnonymous} 
          onClick={() => setIsCreatingProject(!isCreatingProject)} 
          className={`p-0.5 rounded transition-colors ${user?.isAnonymous ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-blue-50 text-blue-600'}`}
        >
          <Icons.Plus className="w-3 h-3" />
        </button>
      </div>
      
      {isCreatingProject && (
        <div className="flex gap-1 mb-2">
          <input 
            className="w-full text-[10px] p-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
            placeholder="New Project Name..." 
            value={newProjectName} 
            onChange={(e) => setNewProjectName(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && onCreateProject()} 
            autoFocus 
          />
          <button onClick={onCreateProject} className="bg-blue-600 text-white px-2 rounded font-bold text-[9px]">OK</button>
        </div>
      )}

      <div className="flex flex-col min-h-[50px]">
          {filterList(myWorkspaceProjects).length === 0 && !isCreatingProject && (
              <div className="text-[9px] text-slate-300 px-2 italic">No personal projects</div>
          )}
          {filterList(myWorkspaceProjects).map(p => <ProjectItem key={p.id} p={p} />)}
      </div>

      {/* --- SECTION 3: SHARED / ADMIN (Collapsible) --- */}
      {filterList(otherProjects).length > 0 && (
          <>
            <div className="border-t border-slate-100 my-2"></div>
            <div 
                onClick={() => setIsAdminSectionExpanded(!isAdminSectionExpanded)}
                className="flex items-center justify-between px-1 mb-1 cursor-pointer hover:bg-slate-50 rounded p-0.5"
            >
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Shared / Admin ({filterList(otherProjects).length})
                </span>
                <Icons.ArrowRight className={`w-3 h-3 text-slate-300 transition-transform ${isAdminSectionExpanded ? 'rotate-90' : ''}`} />
            </div>
            
            {isAdminSectionExpanded && (
                <div className="flex flex-col animate-in fade-in slide-in-from-top-1 duration-200">
                    {filterList(otherProjects).map(p => <ProjectItem key={p.id} p={p} />)}
                </div>
            )}
          </>
      )}

      {/* --- SECTION 4: USER SESSIONS (Collapsible Admin) --- */}
      {canViewSessions && filteredUsers && (
        <>
          <div className="border-t border-slate-200 my-2"></div>
          
          <div 
            onClick={() => setIsSessionsExpanded(!isSessionsExpanded)}
            className="flex items-center justify-between px-1 mb-1 cursor-pointer hover:bg-slate-50 rounded p-0.5 select-none"
          >
            <div className="flex items-center gap-2">
                <Icons.Shield className="w-3 h-3 text-red-500" />
                <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">User Sessions ({filteredUsers.length})</span>
            </div>
            <Icons.ArrowRight className={`w-3 h-3 text-slate-300 transition-transform duration-200 ${isSessionsExpanded ? 'rotate-90' : ''}`} />
          </div>
          
          {isSessionsExpanded && (
              <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 custom-scrollbar pr-1 max-h-[150px] animate-in fade-in slide-in-from-top-1 duration-200">
                {filteredUsers.map(u => (
                <div 
                    key={u.uid}
                    onClick={() => handleSelectUserSession(u.uid)}
                    className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer border transition-all ${activeSessionUid === u.uid ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white text-slate-500 border-transparent hover:bg-slate-50'}`}
                >
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${u.global_role === 'super_admin' ? 'bg-red-500' : (u.global_role === 'nitro' ? 'bg-yellow-400' : 'bg-slate-300')}`} />
                    <div className="flex flex-col overflow-hidden w-full">
                        <span className="font-bold truncate text-[10px]">{u.username || "User"}</span>
                        <span className="truncate text-[8px] opacity-70">{u.email}</span>
                    </div>
                </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
