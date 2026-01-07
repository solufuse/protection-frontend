
// DiagramEditor.tsx
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
  MarkerType,
  MiniMap,
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
const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

const nodeTypes = {
    custom: CustomNode,
};

const defaultConfig = { project_name: "NEW_PROJECT", settings: { ansi_51: { transformer: { factor_I1: 1.2, time_dial_I1: { value: 0.5, curve: "VIT", comment: "Surcharge Transfo" }, factor_I2: 0.8, time_dial_I2: { value: 0.1, curve: "DT", comment: "Secours Court-Circuit" }, factor_I4: 6.0, time_dial_I4: { value: 0.05, curve: "DT", comment: "High-Set Inst." } }, incomer: { factor_I1: 1.0, time_dial_I1: { value: 0.5, curve: "SIT", comment: "Incomer Std" }, factor_I2: 1.0, time_dial_I2: { value: 0.2, curve: "DT", comment: "Backup" }, factor_I4: 10.0, time_dial_I4: { value: 0.05, curve: "DT", comment: "Inst." } }, coupling: { factor_I1: 1.0, time_dial_I1: { value: 0.5, curve: "SIT", comment: "Cpl Std" }, factor_I2: 1.0, time_dial_I2: { value: 0.2, curve: "DT", comment: "Backup" }, factor_I4: 10.0, time_dial_I4: { value: 0.05, curve: "DT", comment: "Inst." } } } }, transformers: [], links_data: [], loadflow_settings: { target_mw: 0, tolerance_mw: 0.3, swing_bus_id: "" }, plans: [] };

export default function DiagramEditor({ user }: { user: any }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

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
  const createProject = async () => { if (user?.isAnonymous) return notify("Guest users cannot create projects.", "error"); if (!newProjectName.trim()) return; try { const t = await getToken(); const res = await fetch(`${API_URL}/projects/create`, { method: 'POST', headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: newProjectName, name: newProjectName }) }); if (!res.ok) { const err = await res.json(); throw new Error(err.detail); } notify("Project Created"); setNewProjectName(""); setIsCreatingProject(false); fetchProjects(); } catch (e) { notify("Creation failed", "error"); } };
  const deleteProject = async (projId: string, e: React.MouseEvent) => { e.stopPropagation(); if (!confirm(`Delete project "${projId}" permanently?`)) return; try { const t = await getToken(); const res = await fetch(`${API_URL}/projects/${projId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` } }); if (!res.ok) throw new Error(); notify("Project Deleted"); if (activeProjectId === projId) setActiveProjectId(null); fetchProjects(); } catch (e) { notify("Delete failed", "error"); } };
  const handleCopyProjectName = () => { if (!activeProjectId) return; navigator.clipboard.writeText(activeProjectId); notify("Project ID Copied to Clipboard"); };
  const getActiveProjectName = () => { if (!activeProjectId) return null; const proj = projects.find(p => p.id === activeProjectId); return proj ? proj.name : activeProjectId; };

  // --- React Flow Callbacks ---
  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
  const onConnect = useCallback((connection: Connection) => setEdges((eds) => addEdge({ ...connection, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, eds)), [setEdges]);

  const onEdgeDoubleClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
      const newLabel = prompt("Enter connection name:", edge.label as string || "");
      if (newLabel !== null) {
          setEdges((eds) => eds.map((e) => {
              if (e.id === edge.id) {
                  return { ...e, label: newLabel };
              }
              return e;
          }));
      }
  }, []);

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
      const { label, data: droppedData } = JSON.parse(nodeInfoStr);

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${label}-${+new Date()}`,
        type: 'custom',
        position,
        data: { ...droppedData }, // Use the data from the sidebar (contains component_type etc.)
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const addNode = (type: string) => {
    if (!reactFlowInstance || !contextMenu) return;
    const position = reactFlowInstance.project({ x: contextMenu.x, y: contextMenu.y });
    
    // Provide default data for context menu additions
    let defaultData: any = { label: type, component_type: type };
    if (type === 'Bus') {
        defaultData = { ...defaultData, component_type: 'Bus', NomlkV: 20.5, width: 350 };
    } else if (type === 'Incomer') {
        defaultData = { ...defaultData, component_type: 'Incomer', KV: 225 };
    } else if (type === 'Transformer') {
        defaultData = { ...defaultData, component_type: 'Transformer', PrimkV: 20, SeckV: 0.4 };
    } else if (type === 'Cable') {
        defaultData = { ...defaultData, component_type: 'Cable', Length: 1 };
    }

    const newNode: Node = {
      id: `${type}-${+new Date()}`,
      type: 'custom',
      data: defaultData,
      position,
    };
    setNodes((nds) => nds.concat(newNode));
    setContextMenu(null);
  };

  // --- Diagram Save and Import ---
  const handleSave = () => {
    const config = {
        ...defaultConfig,
        project_name: activeProjectId || "DIAGRAM_PROJECT", 
        diagram: { nodes, edges }, // Save full diagram data as received from backend
    };

    const jsonConfig = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonConfig], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram_config.json';
    a.click();
    URL.revokeObjectURL(url);
    notify('Diagram saved as diagram_config.json');
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            
            if (json.diagram) {
                // If the structure matches the backend response
                setNodes(json.diagram.nodes || []);
                setEdges(json.diagram.edges || []);
            } else if (json.diagram_data) {
                // Legacy support
                setNodes(json.diagram_data.nodes || []);
                setEdges(json.diagram_data.edges || []);
            } else {
                // Fallback logic for very old or different formats if needed
                notify("Unknown file format", "error");
                return;
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
                        onEdgeDoubleClick={onEdgeDoubleClick}
                        nodeTypes={nodeTypes}
                        onInit={setReactFlowInstance}
                        fitView
                    >
                        <Controls />
                        <Background />
                        <MiniMap 
                            nodeStrokeColor={(n: Node) => {
                                if (n.type === 'custom') return '#0041d0';
                                return '#eee';
                            }}
                            nodeColor={(n: Node) => {
                                if (n.data?.component_type === 'Bus' || n.data?.label === 'Busbar') return '#374151';
                                return '#fff';
                            }}
                            nodeBorderRadius={2}
                            maskColor="rgba(200, 200, 200, 0.6)"
                        />
                    </ReactFlow>
                    {contextMenu && <ContextMenu {...contextMenu} onClose={() => setContextMenu(null)} onSelect={addNode} />}
                </ReactFlowProvider>
            </div>
            
            <ElementsSidebar />
        </div>
        
        {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
