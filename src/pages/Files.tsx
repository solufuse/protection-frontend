
import { useState, useEffect } from 'react';
import { Icons } from '../icons';
import { useDropzone } from 'react-dropzone';
import GlobalRoleBadge from '../components/GlobalRoleBadge';
import ProjectsSidebar, { Project, UserSummary } from '../components/ProjectsSidebar';
import FileList from '../components/FileList';
import FilePreviewModal from '../components/FilePreviewModal';
import Toast from '../components/Toast';

export default function Files({ user }: { user: any }) {
  // --- STATE ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [usersList, setUsersList] = useState<UserSummary[]>([]);
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSessionUid, setActiveSessionUid] = useState<string | null>(null);
  
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userGlobalData, setUserGlobalData] = useState<any>(null);
  const [previewFile, setPreviewFile] = useState<any>(null);

  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });
  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });

  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";

  // --- HELPERS ---
  const getToken = async () => { if (!user) return null; return await user.getIdToken(); };

  // --- DATA FETCHING ---
  const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
          const t = await getToken();
          const headers = { 'Authorization': `Bearer ${t}` };

          // 1. Fetch User Data (Me)
          try {
              const meRes = await fetch(`${API_URL}/users/me`, { headers });
              if (meRes.ok) {
                  const meData = await meRes.json();
                  setUserGlobalData(meData);
                  
                  // If Admin, fetch all users for sidebar
                  if (['super_admin', 'admin', 'moderator'].includes(meData.global_role)) {
                       const usersRes = await fetch(`${API_URL}/users/`, { headers });
                       if (usersRes.ok) setUsersList(await usersRes.json());
                  }
              } else {
                  setUserGlobalData(user);
              }
          } catch (e) { setUserGlobalData(user); }

          // 2. Fetch Projects
          try {
              const pRes = await fetch(`${API_URL}/projects/`, { headers });
              if (pRes.ok) setProjects(await pRes.json());
          } catch (e) {}

          // 3. Fetch Files
          const targetId = activeProjectId || activeSessionUid || user.uid;
          const fRes = await fetch(`${API_URL}/files/details?project_id=${targetId}`, { headers });
          if (fRes.ok) {
              const fData = await fRes.json();
              setFiles(fData.files || []);
          } else {
              setFiles([]);
          }

      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => { fetchData(); }, [user, activeProjectId, activeSessionUid]);

  // Sidebar Logic
  useEffect(() => { if (activeProjectId && activeSessionUid) setActiveSessionUid(null); }, [activeProjectId]);
  useEffect(() => { if (activeSessionUid && activeProjectId) setActiveProjectId(null); }, [activeSessionUid]);

  // --- ACTIONS ---
  const handleCreateProject = async () => {
      if (!newProjectName.trim()) return;
      try {
          const t = await getToken();
          const res = await fetch(`${API_URL}/projects/`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: newProjectName, description: "Created via Frontend" })
          });
          if (res.ok) {
              notify("Project created!");
              setNewProjectName("");
              setIsCreatingProject(false);
              fetchData();
          } else notify("Failed to create project", "error");
      } catch (e) { notify("Error creating project", "error"); }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm("Delete this project? Files will be lost.")) return;
      try {
          const t = await getToken();
          const res = await fetch(`${API_URL}/projects/${projectId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${t}` }
          });
          if (res.ok) {
              notify("Project deleted");
              if (activeProjectId === projectId) setActiveProjectId(null);
              fetchData();
          } else notify("Failed to delete", "error");
      } catch (e) { notify("Error deleting", "error"); }
  };

  const handleDeleteFile = async (filename: string) => {
      if (!confirm(`Delete ${filename}?`)) return;
      try {
          const t = await getToken();
          const targetId = activeProjectId || activeSessionUid || user.uid;
          const res = await fetch(`${API_URL}/files/file/${filename}?project_id=${targetId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${t}` }
          });
          if (res.ok) {
              notify("File deleted");
              setFiles(prev => prev.filter(f => f.filename !== filename));
          } else notify("Failed to delete file", "error");
      } catch (e) { notify("Error deleting file", "error"); }
  };

  const onDrop = async (acceptedFiles: File[]) => {
      setUploading(true);
      try {
          const t = await getToken();
          const targetId = activeProjectId || activeSessionUid || user.uid;
          
          for (const file of acceptedFiles) {
              const formData = new FormData();
              formData.append('file', file);
              
              const res = await fetch(`${API_URL}/files/upload?project_id=${targetId}`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${t}` },
                  body: formData
              });
              if (!res.ok) throw new Error(`Failed to upload ${file.name}`);
          }
          notify("Upload successful");
          fetchData();
      } catch (e) { notify("Upload failed", "error"); } 
      finally { setUploading(false); }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="w-full px-6 py-6 text-[11px] font-sans flex flex-col relative min-h-full">
      
      {/* HEADER - Updated Badge Position */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Files Dashboard
            </label>
            {/* [MOVED] Badge is now here, next to the label */}
            {userGlobalData && <GlobalRoleBadge role={userGlobalData.global_role} />}
          </div>
          
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2 mt-1">
             {activeProjectId ? <Icons.Folder className="w-5 h-5 text-blue-600" /> : <Icons.HardDrive className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
             <span>{activeProjectId ? projects.find(p => p.id === activeProjectId)?.name : "Repository"}</span>
          </h1>
        </div>
        
        <div className="flex gap-2">
             <div {...getRootProps()} className={`cursor-pointer border-2 border-dashed rounded px-4 py-1.5 font-bold transition-all flex items-center gap-2 ${isDragActive ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-300 dark:border-slate-600 text-slate-500 hover:border-blue-400 hover:text-blue-500'}`}>
                <input {...getInputProps()} />
                <Icons.UploadCloud className="w-4 h-4" />
                <span>{uploading ? "Uploading..." : "Upload File"}</span>
             </div>
             <button onClick={fetchData} className="p-2 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Icons.RotateCw className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`} />
             </button>
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
            onCreateProject={handleCreateProject} onDeleteProject={handleDeleteProject} 
        />
        
        <div className="flex-1 min-w-0">
             <FileList 
                files={files} 
                loading={loading} 
                onPreview={setPreviewFile} 
                onDelete={handleDeleteFile}
                currentUserId={user.uid}
             />
        </div>
      </div>

      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
