import React from 'react';
import { Icons } from '../icons';

// [context:flow] On réutilise l'interface Project ici ou on l'importe depuis un fichier types.ts commun
export interface Project {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'moderator' | 'editor' | 'viewer' | 'staff_override';
}

interface ProjectsSidebarProps {
  user: any;
  projects: Project[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  isCreatingProject: boolean;
  setIsCreatingProject: (val: boolean) => void;
  newProjectName: string;
  setNewProjectName: (val: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
}

export default function ProjectsSidebar({
  user,
  projects,
  activeProjectId,
  setActiveProjectId,
  isCreatingProject,
  setIsCreatingProject,
  newProjectName,
  setNewProjectName,
  onCreateProject,
  onDeleteProject
}: ProjectsSidebarProps) {
    
  return (
    <div className="w-60 flex flex-col gap-4">
      {/* SECTION: MY SESSION */}
      <div 
        onClick={() => setActiveProjectId(null)} 
        className={`flex items-center gap-3 p-3 rounded cursor-pointer border transition-all ${activeProjectId === null ? 'bg-slate-800 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
      >
        <Icons.HardDrive className="w-4 h-4" />
        <div className="flex flex-col">
          <span className="font-bold uppercase tracking-wide">My Session</span>
          <span className="text-[9px] text-slate-400">Private Storage</span>
        </div>
      </div>

      <div className="border-t border-slate-200 my-1"></div>

      {/* SECTION: HEADER PROJECTS */}
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

      {/* SECTION: INPUT CREATION */}
      {isCreatingProject && (
        <div className="flex gap-1">
          <input 
            className="w-full text-[10px] p-1.5 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
            placeholder="Project ID..." 
            value={newProjectName} 
            onChange={(e) => setNewProjectName(e.target.value.toUpperCase())} 
            onKeyDown={(e) => e.key === 'Enter' && onCreateProject()} 
            autoFocus 
          />
          <button onClick={onCreateProject} className="bg-blue-600 text-white px-2 rounded font-bold text-[9px]">OK</button>
        </div>
      )}

      {/* SECTION: LIST PROJECTS */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 custom-scrollbar pr-1">
        {projects.map(p => (
          <div 
            key={p.id} 
            onClick={() => setActiveProjectId(p.id)} 
            className={`group flex justify-between items-center p-2 rounded cursor-pointer border transition-all ${activeProjectId === p.id ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white text-slate-600 border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {/* OWNER CROWN OR MEMBER USER */}
              {p.role === 'owner' ? <span title="Owner">👑</span> : <Icons.User className={`w-3.5 h-3.5 ${activeProjectId === p.id ? 'text-blue-200' : 'text-slate-300'}`} />}
              <span className="font-bold truncate">{p.id}</span>
            </div>
            {/* DELETE BUTTON */}
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
    </div>
  );
}
