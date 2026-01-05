
// DiagramEditor.tsx
// This component provides a visual editor for creating and manipulating electrical diagrams
// using React Flow. It includes a project sidebar for managing projects and a main canvas
// for the diagram with context menu and direct node deletion.

import { useState, useCallback, useEffect, useRef, MouseEvent } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Save, Upload } from 'lucide-react';
import ProjectsSidebar, { Project, UserSummary } from '../components/ProjectsSidebar';
import Toast from '../components/Toast';
import CustomNode from '../components/diagram/CustomNode';
import ContextMenu from '../components/diagram/ContextMenu';

// Initial nodes and edges for the diagram
const initialNodes: Node[] = [
  { id: '1', type: 'custom', data: { label: 'Grid' }, position: { x: 250, y: 5 } },
  { id: '2', type: 'custom', data: { label: 'Busbar' }, position: { x: 250, y: 100 } },
  { id: '3', type: 'custom', data: { label: 'Transformer', name: 'TX-1', sn_kva: 1000, u_kv: 20, ratio_iencl: 8, tau_ms: 400 }, position: { x: 100, y: 200 } },
  { id: '4', type: 'custom', data: { label: 'Circuit Breaker' }, position: { x: 400, y: 200 } },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3', data: { id: 'LINK-1', length_km: 1.0, impedance_zd: "0+j0", impedance_z0: "0+j0" } },
    { id: 'e2-4', source: '2', target: '4' },
];

const nodeTypes = {
    custom: CustomNode,
};


export default function DiagramEditor({ user }: { user: any }) {
  // State for React Flow nodes and edges
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  // State for project management from ProjectsSidebar
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSessionUid, setActiveSessionUid] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<UserSummary[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [userGlobalData, setUserGlobalData] = useState<any>(null);

  // State for toast notifications and file input
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' as 'success' | 'error' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API and utility functions
  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";
  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });
  const getToken = async () => { if (!user) return null; return await user.getIdToken(); };

  // Fetch user profile and projects on user change
  useEffect(() => {
    if (user) {
        fetchGlobalProfile();
        fetchProjects();
    }
  }, [user]);

  // --- Project Management Functions ---
  const fetchGlobalProfile = async () => { try { const t = await getToken(); const res = await fetch(`${API_URL}/users/me`, { headers: { 'Authorization': `Bearer ${t}` } }); if (res.ok) { const data = await res.json(); setUserGlobalData(data); if (['super_admin', 'admin', 'moderator'].includes(data.global_role)) fetchAllUsers(t); } } catch (e) {} };
  const fetchAllUsers = async (token: string) => { try { const res = await fetch(`${API_URL}/admin/users?limit=100`, { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setUsersList(await res.json()); } catch (e) { console.error("Admin List Error", e); } };
  const fetchProjects = async () => { try { const t = await getToken(); const res = await fetch(`${API_URL}/projects/`, { headers: { 'Authorization': `Bearer ${t}` } }); if (res.ok) setProjects(await res.json()); } catch (e) { console.error("Failed to load projects", e); } };
  const createProject = async () => { if (user?.isAnonymous) return notify("Guest users cannot create projects.", "error"); if (!newProjectName.trim()) return; try { const t = await getToken(); const res = await fetch(`${API_URL}/projects/create`, { method: 'POST', headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: newProjectName, name: newProjectName }) }); if (!res.ok) { const err = await res.json(); throw new Error(err.detail); } notify("Project Created"); setNewProjectName(""); setIsCreatingProject(false); fetchProjects(); } catch (e: any) { notify(e.message || "Failed", "error"); } };
  const deleteProject = async (projId: string, e: React.MouseEvent) => { e.stopPropagation(); if (!confirm(`Delete project "${projId}" permanently?`)) return; try { const t = await getToken(); const res = await fetch(`${API_URL}/projects/${projId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` } }); if (!res.ok) throw new Error(); notify("Project Deleted"); if (activeProjectId === projId) setActiveProjectId(null); fetchProjects(); } catch (e) { notify("Delete failed", "error"); } };

  // --- React Flow Callbacks ---
  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
  const onConnect = useCallback((connection: Connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges]);

  const onPaneContextMenu = useCallback((event: MouseEvent) => {
      event.preventDefault();
      setContextMenu({ x: event.clientX, y: event.clientY });
    },
    [setContextMenu]
  );

  const onPaneClick = useCallback(() => setContextMenu(null), [setContextMenu]);

  // --- Block Management ---
  const addNode = (type: string) => {
    if (!reactFlowInstance || !contextMenu) return;
    const position = reactFlowInstance.project({ x: contextMenu.x, y: contextMenu.y });
    const newNode: Node = {
      id: `${+new Date()}`,
      type: 'custom',
      data: { label: type },
      position,
    };
    setNodes((nds) => nds.concat(newNode));
    setContextMenu(null);
  };


  // --- Diagram Save and Import/Export ---

  const handleSave = () => {
    const diagram = {
      nodes: nodes,
      edges: edges,
    };
    const jsonDiagram = JSON.stringify(diagram, null, 2);
    const blob = new Blob([jsonDiagram], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.json';
    a.click();
    URL.revokeObjectURL(url);
    notify('Diagram saved as diagram.json');
  };

  // Triggers the hidden file input for JSON import
  const handleImportClick = () => fileInputRef.current?.click();

  // Handles the file change event for JSON import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const { nodes, edges } = JSON.parse(event.target?.result as string);
            setNodes(nodes || []);
            setEdges(edges || []);
            notify("Diagram imported successfully!");
        } catch (err) {
            notify("Invalid JSON file", "error");
        }
    };
    reader.readAsText(file);
  };

  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeRole = activeProject?.role || 'admin';

  return (
    <div className="w-full px-6 py-6 text-[11px] font-sans h-full flex flex-col">
        {/* Header section with title and action buttons */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase">Diagram Editor</h1>
                {activeProject && (
                    <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded">{activeProject.id}</span>
                        <span className="font-semibold text-slate-500 dark:text-slate-400">{activeRole}</span>
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                <button onClick={handleImportClick} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded font-bold transition-all text-[10px]"><Upload className="w-3.5 h-3.5" /> IMPORT</button>
                <button onClick={handleSave} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-bold shadow-sm transition-all text-[10px]">
                    <Save className="w-3.5 h-3.5" />
                    SAVE DIAGRAM
                </button>
            </div>
        </div>

        {/* Main content area with a three-column layout */}
        <div className="flex flex-1 gap-6 min-h-0">
            {/* Left sidebar for project management */}
            <ProjectsSidebar user={user} userGlobalData={userGlobalData} projects={projects} usersList={usersList} activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} activeSessionUid={activeSessionUid} setActiveSessionUid={setActiveSessionUid} isCreatingProject={isCreatingProject} setIsCreatingProject={setIsCreatingProject} newProjectName={newProjectName} setNewProjectName={setNewProjectName} onCreateProject={createProject} onDeleteProject={deleteProject} />
            
            {/* Center column for the React Flow diagram canvas */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm overflow-hidden relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onPaneClick={onPaneClick}
                    onPaneContextMenu={onPaneContextMenu}
                    nodeTypes={nodeTypes}
                    onInit={setReactFlowInstance}
                    fitView
                >
                    <Controls />
                    <Background />
                </ReactFlow>
                {contextMenu && <ContextMenu {...contextMenu} onClose={() => setContextMenu(null)} onSelect={addNode} />}
            </div>
        </div>
        
        {/* Toast component for notifications */}
        {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
