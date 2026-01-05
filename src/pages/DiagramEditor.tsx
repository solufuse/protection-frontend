
// DiagramEditor.tsx
// This component provides a visual editor for creating and manipulating electrical diagrams
// using React Flow. It includes a project sidebar for managing projects, a main canvas
// for the diagram, and a right sidebar for adding and managing electrical blocks.

import { useState, useCallback, useEffect, useRef } from 'react';
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

import { Save, Plus, Trash2, Upload } from 'lucide-react';
import ProjectsSidebar, { Project, UserSummary } from '../components/ProjectsSidebar';
import { useFileManager } from '../hooks/useFileManager';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import Toast from '../components/Toast';

// Initial nodes and edges for the diagram
const initialNodes: Node[] = [
  { id: '1', type: 'input', data: { label: 'Grid' }, position: { x: 250, y: 5 } },
  { id: '2', data: { label: 'Busbar' }, position: { x: 250, y: 100 } },
  { id: '3', data: { label: 'Transformer', name: 'TX-1', sn_kva: 1000, u_kv: 20, ratio_iencl: 8, tau_ms: 400 }, position: { x: 100, y: 200 } },
  { id: '4', data: { label: 'Circuit Breaker' }, position: { x: 400, y: 200 } },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3', data: { id: 'LINK-1', length_km: 1.0, impedance_zd: "0+j0", impedance_z0: "0+j0" } },
    { id: 'e2-4', source: '2', target: '4' },
];

// Default configuration for a new project
const defaultConfig = { project_name: "NEW_PROJECT", settings: { ansi_51: { transformer: { factor_I1: 1.2, time_dial_I1: { value: 0.5, curve: "VIT", comment: "Surcharge Transfo" }, factor_I2: 0.8, time_dial_I2: { value: 0.1, curve: "DT", comment: "Secours Court-Circuit" }, factor_I4: 6.0, time_dial_I4: { value: 0.05, curve: "DT", comment: "High-Set Inst." } }, incomer: { factor_I1: 1.0, time_dial_I1: { value: 0.5, curve: "SIT", comment: "Incomer Std" }, factor_I2: 1.0, time_dial_I2: { value: 0.2, curve: "DT", comment: "Backup" }, factor_I4: 10.0, time_dial_I4: { value: 0.05, curve: "DT", comment: "Inst." } }, coupling: { factor_I1: 1.0, time_dial_I1: { value: 0.5, curve: "SIT", comment: "Cpl Std" }, factor_I2: 1.0, time_dial_I2: { value: 0.2, curve: "DT", comment: "Backup" }, factor_I4: 10.0, time_dial_I4: { value: 0.05, curve: "DT", comment: "Inst." } } } }, transformers: [], links_data: [], loadflow_settings: { target_mw: 0, tolerance_mw: 0.3, swing_bus_id: "" }, plans: [] };

export default function DiagramEditor({ user }: { user: any }) {
  // State for React Flow nodes and edges
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

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

  // --- Diagram Save and Import/Export ---

  // Saves the current diagram to a JSON config object
  const handleSave = () => {
    const config = {
        ...defaultConfig,
        project_name: "DIAGRAM_PROJECT", 
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
    console.log(jsonConfig);
    alert('Diagram configuration generated! Check the developer console.');
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
            const json = JSON.parse(event.target?.result as string);
            
            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];

            let yPos = 50;
            json.transformers?.forEach((tx: any, index: number) => {
                const id = `tx-${index + 1}`;
                newNodes.push({ 
                    id, 
                    position: { x: 250, y: yPos }, 
                    data: { label: 'Transformer', ...tx },
                });
                yPos += 150;
            });

            json.links_data?.forEach((link: any, index: number) => {
                const id = `edge-${index + 1}`;
                newEdges.push({ 
                    id, 
                    source: link.bus_from, 
                    target: link.bus_to, 
                    data: { ...link },
                });
            });
            
            setNodes(newNodes);
            setEdges(newEdges);
            notify("Configuration imported successfully!");

        } catch (err) {
            notify("Invalid JSON file", "error");
        }
    };
    reader.readAsText(file);
  };

  // --- UI Configuration ---

  // List of available electrical blocks for the right sidebar
  const electricalBlocks = [
    { type: 'Busbar', icon: ' Minus ' },
    { type: 'Transformer', icon: ' T ' },
    { type: 'Circuit Breaker', icon: ' [ ] ' },
    { type: 'Grid', icon: ' G ' },
  ];

  return (
    <div className="w-full px-6 py-6 text-[11px] font-sans h-full flex flex-col">
        {/* Header section with title and action buttons */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase">Diagram Editor</h1>
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
                <div style={{ width: '100%', height: '100%' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                    >
                        <Controls />
                        <Background />
                    </ReactFlow>
                </div>
            </div>

            {/* Right sidebar for electrical blocks and properties */}
            <div className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm p-4 flex flex-col gap-4">
                <h2 className="font-bold text-lg">Electrical Blocks</h2>
                <div className="flex flex-col gap-2">
                    {electricalBlocks.map((block, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="font-mono">{block.icon}</span>
                            <span>{block.type}</span>
                            <button className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                                <Plus size={16} />
                            </button>
                        </div>
                    ))}
                </div>
                <h2 className="font-bold text-lg mt-4">Selected Block</h2>
                <div className="flex flex-col gap-2 p-2 border rounded">
                    <p>No block selected</p>
                </div>
            </div>
        </div>
        
        {/* Toast component for notifications */}
        {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
