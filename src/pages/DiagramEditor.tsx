
// DiagramEditor.tsx
// This component provides a visual editor for creating and manipulating electrical diagrams
// using React Flow. It includes a project sidebar for managing projects, a main canvas
// for the diagram, and an elements sidebar for adding new components via drag-and-drop.

import { useState, useCallback, useEffect, useRef, MouseEvent, DragEvent } from 'react';
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
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Save, Upload } from 'lucide-react';
import ProjectsSidebar, { Project, UserSummary } from '../components/ProjectsSidebar';
import Toast from '../components/Toast';
import CustomNode from '../components/diagram/CustomNode';
import ContextMenu from '../components/diagram/ContextMenu';
import ElementsSidebar from '../components/diagram/ElementsSidebar';
import { Icons } from '../icons';
import GlobalRoleBadge from '../components/GlobalRoleBadge';
import ContextRoleBadge from '../components/ContextRoleBadge';

// Initial nodes and edges for the diagram
const initialNodes: Node[] = [
  { id: '1', type: 'custom', data: { label: 'Grid' }, position: { x: 250, y: 5 } },
  {
    id: '2',
    type: 'custom',
    data: { label: 'Busbar', width: 400, name: "BUS-1", vn_kv: 20 },
    position: { x: 50, y: 100 },
  },
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

const defaultConfig = { project_name: "NEW_PROJECT", settings: { ansi_51: { transformer: { factor_I1: 1.2, time_dial_I1: { value: 0.5, curve: "VIT", comment: "Surcharge Transfo" }, factor_I2: 0.8, time_dial_I2: { value: 0.1, curve: "DT", comment: "Secours Court-Circuit" }, factor_I4: 6.0, time_dial_I4: { value: 0.05, curve: "DT", comment: "High-Set Inst." } }, incomer: { factor_I1: 1.0, time_dial_I1: { value: 0.5, curve: "SIT", comment: "Incomer Std" }, factor_I2: 1.0, time_dial_I2: { value: 0.2, curve: "DT", comment: "Backup" }, factor_I4: 10.0, time_dial_I4: { value: 0.05, curve: "DT", comment: "Inst." } }, coupling: { factor_I1: 1.0, time_dial_I1: { value: 0.5, curve: "SIT", comment: "Cpl Std" }, factor_I2: 1.0, time_dial_I2: { value: 0.2, curve: "DT", comment: "Backup" }, factor_I4: 10.0, time_dial_I4: { value: 0.05, curve: "DT", comment: "Inst." } } } }, transformers: [], links_data: [], loadflow_settings: { target_mw: 0, tolerance_mw: 0.3, swing_bus_id: "" }, plans: [] };

export default function DiagramEditor({ user }: { user: any }) {
  // State for project management
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSessionUid, setActiveSessionUid] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<UserSummary[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [userGlobalData, setUserGlobalData] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' as 'success' | 'error' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Diagram State
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";
  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });
  const getToken = async () => { if (!user) return null; return await user.getIdToken(); };

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
  const handleCopyProjectName = () => { if (!activeProjectId) return; navigator.clipboard.writeText(activeProjectId); notify("Project ID Copied to Clipboard"); };
  const getActiveProjectName = () => { if (!activeProjectId) return null; const proj = projects.find(p => p.id === activeProjectId); return proj ? proj.name : activeProjectId; };

  // --- React Flow Callbacks ---
  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
  const onConnect = useCallback((connection: Connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges]);

  const onPaneContextMenu = useCallback((event: MouseEvent) => {
      event.preventDefault();
      setContextMenu({ x: event.clientX, y: event.clientY });
    },
    []
  );

  const onPaneClick = useCallback(() => setContextMenu(null), []);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeInfoStr = event.dataTransfer.getData('application/reactflow');
      
      if (!nodeInfoStr) return;
      const { label } = JSON.parse(nodeInfoStr);

      // Use nodeType 'custom' for all drag-and-drop nodes based on our sidebar logic
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${label}-${+new Date()}`,
        type: 'custom',
        position,
        data: { label, width: label === 'Busbar' ? 400 : undefined },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const addNode = (type: string) => {
    if (!reactFlowInstance || !contextMenu) return;
    const position = reactFlowInstance.project({ x: contextMenu.x, y: contextMenu.y });
    const newNode: Node = {
      id: `${+new Date()}`,
      type: 'custom',
      data: { label: type, width: type === 'Busbar' ? 400 : undefined },
      position,
    };
    setNodes((nds) => nds.concat(newNode));
    setContextMenu(null);
  };

  // --- Diagram Save and Import ---
  const handleSave = () => {
    // Generate config similar to default config but with diagram data
    const config = {
        ...defaultConfig,
        project_name: activeProjectId || "DIAGRAM_PROJECT", 
        diagram_data: { nodes, edges }, // Save raw diagram data for restore
        transformers: nodes
            .filter(node => node.data.label === 'Transformer')
            .map(node => ({
                name: node.data.name || node.id,
                sn_kva: node.data.sn_kva || 0,
                u_kv: node.data.u_kv || 0,
                ratio_iencl: node.data.ratio_iencl || 8,
                tau_ms: node.data.tau_ms || 400,
            })),
        links_data: edges
            .filter(edge => edge.data) 
            .map(edge => ({
                id: edge.data.id || edge.id,
                length_km: edge.data.length_km || 1.0,
                impedance_zd: edge.data.impedance_zd || "0+j0",
                impedance_z0: edge.data.impedance_z0 || "0+j0",
                bus_from: edge.source,
                bus_to: edge.target
            })),
        loadflow_settings: {
            ...defaultConfig.loadflow_settings,
            swing_bus_id: nodes.find(n => n.data.label === 'Grid')?.id || ""
        },
    };

    const jsonConfig = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonConfig], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram_config.json';
    a.click();
    URL.revokeObjectURL(url);
    notify('Diagram configuration saved!');
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            
            // Try to load raw diagram nodes first if available
            if (json.diagram_data) {
                setNodes(json.diagram_data.nodes || []);
                setEdges(json.diagram_data.edges || []);
            } else {
                // Fallback: reconstruct from transformers/links if raw diagram missing
                const newNodes: Node[] = [];
                const newEdges: Edge[] = [];
                let yPos = 50;
                json.transformers?.forEach((tx: any, index: number) => {
                    const id = `tx-${index + 1}`;
                    newNodes.push({ id, position: { x: 250, y: yPos }, type: 'custom', data: { label: 'Transformer', ...tx } });
                    yPos += 150;
                });
                json.links_data?.forEach((link: any, index: number) => {
                    const id = `edge-${index + 1}`;
                    newEdges.push({ id, source: link.bus_from, target: link.bus_to, data: { ...link } });
                });
                setNodes(newNodes);
                setEdges(newEdges);
            }
            notify("Diagram imported successfully!");
        } catch (err) {
            notify("Invalid JSON file", "error");
        }
    };
    reader.readAsText(file);
  };

  let currentProjectRole = undefined;
  if (activeProjectId) currentProjectRole = projects.find(p => p.id === activeProjectId)?.role;
  else if (activeSessionUid) currentProjectRole = 'admin';

  return (
    <div className="w-full px-6 py-6 text-[11px] font-sans h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <div className="flex flex-col">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">Workspace</label>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
                        {activeProjectId ? <><Icons.Folder className="w-5 h-5 text-blue-600" /><span>{getActiveProjectName()}</span><button onClick={handleCopyProjectName} className="opacity-20 hover:opacity-100 transition-opacity"><Icons.Copy className="w-4 h-4" /></button></> : activeSessionUid ? <><Icons.Shield className="w-5 h-5 text-red-500" /><span className="text-red-600">Session: {usersList.find(u => u.uid === activeSessionUid)?.username || activeSessionUid.slice(0,6)}</span></> : <><Icons.HardDrive className="w-5 h-5 text-slate-600 dark:text-slate-400" /><span>Diagram Editor</span></>}
                    </h1>
                    <ContextRoleBadge role={currentProjectRole} isSession={activeProjectId === null && activeSessionUid === null} />
                    {userGlobalData && userGlobalData.global_role && (
                        <div className="ml-2 scale-110">
                            <GlobalRoleBadge role={userGlobalData.global_role} />
                        </div>
                    )}
                </div>
            </div>
            <div className="flex gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                {userGlobalData && userGlobalData.global_role === 'super_admin' && <button onClick={() => window.open(`${API_URL}/docs`, '_blank')} className="flex items-center gap-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-300 px-3 py-1.5 rounded border border-red-200 dark:border-red-900 text-red-600 font-bold transition-colors"><Icons.Shield className="w-3.5 h-3.5" /> API</button>}
                <button onClick={handleImportClick} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded font-bold transition-all text-[10px]"><Upload className="w-3.5 h-3.5" /> IMPORT</button>
                <button onClick={handleSave} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-bold shadow-sm transition-all text-[10px]">
                    <Save className="w-3.5 h-3.5" />
                    SAVE DIAGRAM
                </button>
            </div>
        </div>

        <div className="flex flex-1 gap-6 min-h-0">
            <ProjectsSidebar user={user} userGlobalData={userGlobalData} projects={projects} usersList={usersList} activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} activeSessionUid={activeSessionUid} setActiveSessionUid={setActiveSessionUid} isCreatingProject={isCreatingProject} setIsCreatingProject={setIsCreatingProject} newProjectName={newProjectName} setNewProjectName={setNewProjectName} onCreateProject={createProject} onDeleteProject={deleteProject} />
            
            <div className="flex-1 flex gap-4 h-full">
                <div ref={reactFlowWrapper} className="flex-1 h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm overflow-hidden relative" onDrop={onDrop} onDragOver={onDragOver}>
                    <ReactFlowProvider>
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
                    </ReactFlowProvider>
                </div>
                
                <ElementsSidebar />
            </div>
        </div>
        
        {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
