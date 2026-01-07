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

import ProjectsSidebar, { Project, UserSummary } from '../components/ProjectsSidebar';
import Toast from '../components/Toast';
import CustomNode from '../components/diagram/CustomNode';
import ContextMenu from '../components/diagram/ContextMenu';
import ElementsSidebar from '../components/diagram/ElementsSidebar';
import ArchiveModal from '../components/Loadflow/ArchiveModal';
import DiagramToolbar from '../components/diagram/DiagramToolbar';
import FileTable from '../components/FileTable';
import FileToolbar from '../components/FileToolbar'; 
import { useFileManager } from '../hooks/useFileManager';

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
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  // Correct type for ArchiveModal props
  const [historyFiles, setHistoryFiles] = useState<{name: string, date: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Changed: No mode, just boolean for show/hide
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Resize State
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";
  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });
  const getToken = async () => { if (!user) return null; return await user.getIdToken(); };

  // File Manager Hook
  const { 
    files, 
    loading: filesLoading, 
    handleDelete, 
    sortConfig, 
    handleSort,
    starredFiles,
    toggleStar,
    refreshFiles 
  } = useFileManager(user, activeProjectId, activeSessionUid, API_URL, notify);

  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  
  // Updated Filter: More permissive to ensure files appear
  const filteredFiles = files.filter(f => {
      // Include standard inputs AND json/csv data files
      const validExtensions = ['.si2s', '.lf1s', '.txt', '.json', '.csv', '.xml'];
      const ext = f.filename.substring(f.filename.lastIndexOf('.')).toLowerCase();
      const isSource = validExtensions.includes(ext);
      
      const matchesSearch = f.filename.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Allow user to find any file if they search, otherwise default filter
      return matchesSearch && (searchTerm ? true : isSource); 
  });

  useEffect(() => {
    if (user) {
        fetchGlobalProfile();
        fetchProjects();
        loadFromSession();
        fetchHistoryFiles();
    }
  }, [user, activeProjectId]);

  // --- Project Management Functions ---
  const fetchGlobalProfile = async () => { try { const t = await getToken(); const res = await fetch(`${API_URL}/users/me`, { headers: { 'Authorization': `Bearer ${t}` } }); if (res.ok) { const data = await res.json(); setUserGlobalData(data); if (['super_admin', 'admin', 'moderator'].includes(data.global_role)) fetchAllUsers(t); } } catch (e) {} };
  const fetchAllUsers = async (token: string) => { try { const res = await fetch(`${API_URL}/admin/users?limit=100`, { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setUsersList(await res.json()); } catch (e) { console.error("Admin List Error", e); } };
  const fetchProjects = async () => { try { const t = await getToken(); const res = await fetch(`${API_URL}/projects/`, { headers: { 'Authorization': `Bearer ${t}` } }); if (res.ok) setProjects(await res.json()); } catch (e) { console.error("Failed to load projects", e); } };
  const createProject = async () => { if (user?.isAnonymous) return notify("Guest users cannot create projects.", "error"); if (!newProjectName.trim()) return; try { const t = await getToken(); const res = await fetch(`${API_URL}/projects/create`, { method: 'POST', headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: newProjectName, name: newProjectName }) }); if (!res.ok) { const err = await res.json(); throw new Error(err.detail); } notify("Project Created"); setNewProjectName(""); setIsCreatingProject(false); fetchProjects(); } catch (e) { notify("Creation failed", "error"); } };
  const deleteProject = async (projId: string, e: React.MouseEvent) => { e.stopPropagation(); if (!confirm(`Delete project "${projId}" permanently?`)) return; try { const t = await getToken(); const res = await fetch(`${API_URL}/projects/${projId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` } }); if (!res.ok) throw new Error(); notify("Project Deleted"); if (activeProjectId === projId) setActiveProjectId(null); fetchProjects(); } catch (e) { notify("Delete failed", "error"); } };
  const handleCopyProjectName = () => { if (!activeProjectId) return; navigator.clipboard.writeText(activeProjectId); notify("Project ID Copied to Clipboard"); };
  const getActiveProjectName = () => { if (!activeProjectId) return null; const proj = projects.find(p => p.id === activeProjectId); return proj ? proj.name : activeProjectId; };

  // --- History Management ---
  const fetchHistoryFiles = async () => {
      if (!user) return;
      try {
          const t = await getToken();
          const pParam = activeProjectId ? `?project_id=${activeProjectId}` : "";
          const res = await fetch(`${API_URL}/files/details${pParam}`, { headers: { 'Authorization': `Bearer ${t}` } });
          if (res.ok) {
              const data = await res.json();
              const files = data.files
                .filter((f: any) => f.filename.includes('diagram_result') && f.filename.endsWith('.json'))
                .map((f: any) => ({
                    name: f.filename,
                    date: f.uploaded_at || new Date().toISOString() // Fallback if no date
                }))
                .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
              setHistoryFiles(files);
          }
      } catch (e) { console.error("Failed to fetch history", e); }
  };

  const handleManualLoad = async (filename: string) => {
      if (!user) return;
      setIsLoading(true);
      try {
          const token = await getToken();
          const dlParam = activeProjectId ? `&project_id=${activeProjectId}` : "";
          const fileRes = await fetch(`${API_URL}/files/download?filename=${encodeURIComponent(filename)}&token=${token}${dlParam}`);
          
          if (!fileRes.ok) throw new Error("Failed to download file");
          
          const blob = await fileRes.blob();
          const text = await blob.text();
          const json = JSON.parse(text);

          if (json.results && json.results.length > 0) {
             const firstRes = json.results[0];
             if(firstRes.diagram) {
                setNodes(firstRes.diagram.nodes || []);
                setEdges(firstRes.diagram.edges || []);
             }
          } else if (json.diagram) {
             setNodes(json.diagram.nodes || []);
             setEdges(json.diagram.edges || []);
          }
          
          notify(`Loaded: ${filename}`);
          setShowHistory(false);
      } catch (e) {
          notify("Failed to load file", "error");
      } finally {
          setIsLoading(false);
      }
  };


  // --- Session Management (Load/Save like Config.tsx) ---
  const loadFromSession = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
          const token = await getToken();
          const pParam = activeProjectId ? `?project_id=${activeProjectId}` : "";
          const listRes = await fetch(`${API_URL}/files/details${pParam}`, { headers: { 'Authorization': `Bearer ${token}` } });
          
          if (!listRes.ok) throw new Error("Failed to list files");
          const listData = await listRes.json();
          
          // Try to find a specific diagram file or default to diagram_config.json
          const configFile = listData.files?.find((f: any) => f.filename.toLowerCase() === 'diagram_config.json' || f.filename.toLowerCase().endsWith('.json'));
          
          if (configFile) {
              const dlParam = activeProjectId ? `&project_id=${activeProjectId}` : "";
              const fileRes = await fetch(`${API_URL}/files/download?filename=${encodeURIComponent(configFile.filename)}&token=${token}${dlParam}`);
              if (!fileRes.ok) throw new Error("Failed to download config");
              
              const blob = await fileRes.blob();
              const text = await blob.text();
              const sessionConfig = JSON.parse(text);

              if (sessionConfig.diagram) {
                  setNodes(sessionConfig.diagram.nodes || []);
                  setEdges(sessionConfig.diagram.edges || []);
              } else if (sessionConfig.diagram_data) {
                  // Legacy support
                  setNodes(sessionConfig.diagram_data.nodes || []);
                  setEdges(sessionConfig.diagram_data.edges || []);
              } else {
                 // Try to see if it's the backend result format directly
                 if (sessionConfig.results && sessionConfig.results.length > 0) {
                     const firstRes = sessionConfig.results[0];
                     if(firstRes.diagram) {
                        setNodes(firstRes.diagram.nodes || []);
                        setEdges(firstRes.diagram.edges || []);
                     }
                 }
              }
              notify("Diagram Loaded from Session");
          } else {
             // Reset if no file found for this project
             setNodes(initialNodes);
             setEdges(initialEdges);
          }
      } catch (err: any) {
          console.error("Sync Error:", err);
          // Don't clear on error, might just be network or no file yet
      } finally {
          setIsLoading(false);
      }
  };

  const handleSaveToSession = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const token = await getToken();
        const config = {
            ...defaultConfig,
            project_name: activeProjectId || "DIAGRAM_PROJECT", 
            diagram: { nodes, edges }, 
        };
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const formData = new FormData();
        formData.append('files', blob, 'diagram_config.json');
        
        const pParam = activeProjectId ? `?project_id=${activeProjectId}` : "";
        const response = await fetch(`${API_URL}/files/upload${pParam}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        if (!response.ok) throw new Error("Backend error");
        notify(`Saved to ${activeProjectId || "Storage"}`);
    } catch (e) {
        notify("Save error", "error");
    } finally {
        setIsLoading(false);
    }
  };

  const handleRunDiagram = () => {
      refreshFiles(); // Ensure we have the latest list
      setShowFileSelector(true);
      setSelectedFiles(new Set()); 
      setSearchTerm(""); 
  };

  const executeRun = async (selectedFilesList: string[]) => {
    if (!user) return;
    setIsLoading(true);
    setShowFileSelector(false);

    try {
        const token = await getToken();
        const pParam = activeProjectId ? `project_id=${activeProjectId}` : "";
        
        notify(`Running Analysis on ${selectedFilesList.length} files...`);

        // Use 'bulk' logic for everything (single or multiple)
        const response1 = await fetch(`${API_URL}/topology/run-and-save/bulk?${pParam}&basename=topology`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(selectedFilesList)
        });

        if (!response1.ok) {
           const err = await response1.json();
           throw new Error(err.detail || "Failed to run topology analysis");
        }

        // Step 2: Generate Diagram from those results
        const response2 = await fetch(`${API_URL}/topology/diagram/save/all?${pParam}&basename=diagram_result`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response2.ok) {
            const err = await response2.json();
            throw new Error(err.detail || "Failed to generate diagram");
        }

        const result = await response2.json();
        
        if (result.filename) {
             notify(`Diagram Generated: ${result.filename}`);
             fetchHistoryFiles(); // Refresh history
             
             // --- AUTO LOAD THE RESULT ---
             // Immediately load the file we just generated
             await handleManualLoad(result.filename);

             // Refresh the file manager list if needed to show new files in sidebar/tables
             if (refreshFiles) refreshFiles();

        } else {
             notify("Diagram Run Complete");
        }

    } catch (e: any) {
        notify(e.message, "error");
    } finally {
        setIsLoading(false);
    }
  };


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
        data: { ...droppedData }, 
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
  const handleDownload = () => {
    const config = {
        ...defaultConfig,
        project_name: activeProjectId || "DIAGRAM_PROJECT", 
        diagram: { nodes, edges }, 
    };

    const jsonConfig = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonConfig], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram_config.json';
    a.click();
    URL.revokeObjectURL(url);
    notify('Diagram downloaded as diagram_config.json');
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
                setNodes(json.diagram.nodes || []);
                setEdges(json.diagram.edges || []);
            } else if (json.diagram_data) {
                setNodes(json.diagram_data.nodes || []);
                setEdges(json.diagram_data.edges || []);
            } else {
                 if (json.results && json.results.length > 0) {
                     const firstRes = json.results[0];
                     if(firstRes.diagram) {
                        setNodes(firstRes.diagram.nodes || []);
                        setEdges(firstRes.diagram.edges || []);
                        notify("Imported from Analysis Result");
                        return;
                     }
                 }
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

  // --- Resizing Sidebar Logic ---
  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        // Adjust these constraints as needed
        const newWidth = mouseMoveEvent.clientX - 24; // Assuming 24px left padding on container
        if (newWidth > 150 && newWidth < 600) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize as any);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize as any);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize as any);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);


  let currentProjectRole = undefined;
  if (activeProjectId) currentProjectRole = projects.find(p => p.id === activeProjectId)?.role;
  else if (activeSessionUid) currentProjectRole = 'admin';

  return (
    <div className="w-full px-6 py-6 text-[11px] font-sans h-full flex flex-col select-none">
        <DiagramToolbar 
            activeProjectId={activeProjectId}
            activeSessionUid={activeSessionUid}
            usersList={usersList}
            userGlobalData={userGlobalData}
            getActiveProjectName={getActiveProjectName}
            handleCopyProjectName={handleCopyProjectName}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            handleImportClick={handleImportClick}
            handleDownload={handleDownload}
            handleSaveToSession={handleSaveToSession}
            handleRunDiagram={handleRunDiagram}
            setShowHistory={setShowHistory}
            isLoading={isLoading}
            API_URL={API_URL}
            currentProjectRole={currentProjectRole}
        />

        <div className="flex flex-1 gap-0 min-h-0 border-t border-slate-200 dark:border-slate-800 pt-2">
            <div style={{ width: sidebarWidth }} className="relative flex-shrink-0 pr-2">
                <ProjectsSidebar
                    user={user} 
                    userGlobalData={userGlobalData} 
                    projects={projects} 
                    usersList={usersList} 
                    activeProjectId={activeProjectId} 
                    setActiveProjectId={setActiveProjectId} 
                    activeSessionUid={activeSessionUid} 
                    setActiveSessionUid={setActiveSessionUid} 
                    isCreatingProject={isCreatingProject} 
                    setIsCreatingProject={setIsCreatingProject} 
                    newProjectName={newProjectName} 
                    setNewProjectName={setNewProjectName} 
                    onCreateProject={createProject} 
                    onDeleteProject={deleteProject}
                    className="w-full"
                />
                 {/* Resize Handle */}
                <div
                    onMouseDown={startResizing}
                    className={`absolute top-0 right-0 w-1 h-full cursor-col-resize z-10 flex justify-center items-center hover:bg-blue-500/10 transition-colors group ${isResizing ? 'bg-blue-500/10' : ''}`}
                >
                    <div className={`w-[1px] h-full bg-slate-200 dark:bg-slate-800 group-hover:bg-blue-400 ${isResizing ? 'bg-blue-500' : ''}`} />
                </div>
            </div>
            
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
        
        {/* File Selection Modal */}
        {showFileSelector && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            Select Source Files for Analysis
                        </h2>
                        <button onClick={() => setShowFileSelector(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            ✕
                        </button>
                    </div>
                    
                    {/* Reusing FileToolbar for Search and Selection Count */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-t-md border-b-0">
                         <FileToolbar
                             searchTerm={searchTerm}
                             setSearchTerm={setSearchTerm}
                             fileCount={filteredFiles.length}
                             selectedCount={selectedFiles.size}
                             readOnly={true} // Switches Toolbar to "Selection Mode" (Hides Upload/Actions)
                         />
                    </div>

                    <div className="flex-1 overflow-auto min-h-0 border border-slate-200 dark:border-slate-700 rounded-b-md border-t-0">
                        {filteredFiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                <p>No compatible files found.</p>
                                <p className="text-xs mt-1">Allowed formats: .si2s, .lf1s, .txt, .json, .csv, .xml</p>
                            </div>
                        ) : (
                             <FileTable
                                files={filteredFiles} // Filtered files passed here
                                loading={filesLoading}
                                selectedFiles={selectedFiles}
                                setSelectedFiles={setSelectedFiles}
                                onDelete={handleDelete} // Required by type, but ignored in ReadOnly
                                sortConfig={sortConfig}
                                onSort={handleSort}
                                starredFiles={starredFiles}
                                onToggleStar={toggleStar}
                                readOnly={true} // Hides per-row actions
                                onRowClick={(file) => {
                                    // Toggle selection for bulk
                                    const newSet = new Set(selectedFiles);
                                    if (newSet.has(file.path || file.filename)) newSet.delete(file.path || file.filename);
                                    else newSet.add(file.path || file.filename);
                                    setSelectedFiles(newSet);
                                }}
                            />
                        )}
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button 
                            onClick={() => setShowFileSelector(false)} 
                            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
                        >
                            CANCEL
                        </button>
                        <button 
                            onClick={() => executeRun(Array.from(selectedFiles))}
                            disabled={selectedFiles.size === 0}
                            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
                        >
                            RUN SELECTED ({selectedFiles.size})
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showHistory && <ArchiveModal historyFiles={historyFiles} onClose={() => setShowHistory(false)} onLoad={handleManualLoad} />}
        {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
