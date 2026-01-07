// DiagramEditor.tsx
import { useState, useCallback, useEffect, useRef, DragEvent } from 'react';
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

import Toast from '../components/Toast';
import CustomNode from '../components/diagram/CustomNode';
import ContextMenu from '../components/diagram/ContextMenu';
import ElementsSidebar from '../components/diagram/ElementsSidebar';
import ArchiveModal from '../components/Loadflow/ArchiveModal';
import DiagramToolbar from '../components/diagram/DiagramToolbar';
import FileTable from '../components/files/FileTable';
import FileToolbar from '../components/files/FileToolbar'; 
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

  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' as 'success' | 'error' });
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyFiles, setHistoryFiles] = useState<{name: string, date: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";
  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });
  const getToken = async () => { if (!user) return null; return await user.getIdToken(); };

  // Using null for projectId and sessionId as this editor is now project-agnostic
  const { 
    files, 
    loading: filesLoading, 
    handleDelete, 
    sortConfig, 
    handleSort,
    starredFiles,
    toggleStar,
    refreshFiles 
  } = useFileManager(user, null, null, API_URL, notify);

  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  
  const filteredFiles = files.filter(f => {
      const validExtensions = ['.si2s', '.lf1s', '.txt', '.json', '.csv', '.xml'];
      const ext = f.filename.substring(f.filename.lastIndexOf('.')).toLowerCase();
      const isSource = validExtensions.includes(ext);
      const matchesSearch = f.filename.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch && (searchTerm ? true : isSource); 
  });

  useEffect(() => {
    if (user) {
        loadFromSession();
        fetchHistoryFiles();
    }
  }, [user]);

  // --- History Management ---
  const fetchHistoryFiles = async () => {
      if (!user) return;
      try {
          const t = await getToken();
          // Fetch from user's session, not a project
          const res = await fetch(`${API_URL}/files/details`, { headers: { 'Authorization': `Bearer ${t}` } });
          if (res.ok) {
              const data = await res.json();
              const files = data.files
                .filter((f: any) => f.filename.includes('diagram_result') && f.filename.endsWith('.json'))
                .map((f: any) => ({
                    name: f.filename,
                    date: f.uploaded_at || new Date().toISOString()
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
          // Load from user's session
          const fileRes = await fetch(`${API_URL}/files/download?filename=${encodeURIComponent(filename)}&token=${token}`);
          
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

  // --- Session Management (Load/Save) ---
  const loadFromSession = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
          const token = await getToken();
          // Load from user session, not project
          const listRes = await fetch(`${API_URL}/files/details`, { headers: { 'Authorization': `Bearer ${token}` } });
          
          if (!listRes.ok) throw new Error("Failed to list files");
          const listData = await listRes.json();
          
          const configFile = listData.files?.find((f: any) => f.filename.toLowerCase() === 'diagram_config.json');
          
          if (configFile) {
              const fileRes = await fetch(`${API_URL}/files/download?filename=${encodeURIComponent(configFile.filename)}&token=${token}`);
              if (!fileRes.ok) throw new Error("Failed to download config");
              
              const blob = await fileRes.blob();
              const text = await blob.text();
              const sessionConfig = JSON.parse(text);

              if (sessionConfig.diagram) {
                  setNodes(sessionConfig.diagram.nodes || []);
                  setEdges(sessionConfig.diagram.edges || []);
              } else {
                 // Fallback checks
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
             setNodes(initialNodes);
             setEdges(initialEdges);
          }
      } catch (err: any) {
          console.error("Sync Error:", err);
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
            diagram: { nodes, edges }, 
        };
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const formData = new FormData();
        formData.append('files', blob, 'diagram_config.json');
        
        // Save to user session
        const response = await fetch(`${API_URL}/files/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        if (!response.ok) throw new Error("Backend error");
        notify(`Saved to your personal storage`);
    } catch (e) {
        notify("Save error", "error");
    } finally {
        setIsLoading(false);
    }
  };

  const handleRunDiagram = () => {
      refreshFiles();
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
        notify(`Running Analysis on ${selectedFilesList.length} files...`);

        const response1 = await fetch(`${API_URL}/topology/run-and-save/bulk?basename=topology`, {
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

        const response2 = await fetch(`${API_URL}/topology/diagram/save/all?basename=diagram_result`, {
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
             fetchHistoryFiles(); 
             await handleManualLoad(result.filename);
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
          setEdges((eds) => eds.map((e) => e.id === edge.id ? { ...e, label: newLabel } : e));
      }
  }, []);

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
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
    
    let defaultData: any = { label: type, component_type: type };
    // Default data for different node types...

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
            } else if (json.results && json.results.length > 0) {
                 const firstRes = json.results[0];
                 if(firstRes.diagram) {
                    setNodes(firstRes.diagram.nodes || []);
                    setEdges(firstRes.diagram.edges || []);
                    notify("Imported from Analysis Result");
                    return;
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

  return (
    <div className="w-full px-6 py-6 text-[11px] font-sans h-full flex flex-col select-none">
        <DiagramToolbar 
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            handleImportClick={handleImportClick}
            handleDownload={handleDownload}
            handleSaveToSession={handleSaveToSession}
            handleRunDiagram={handleRunDiagram}
            setShowHistory={setShowHistory}
            isLoading={isLoading}
            API_URL={API_URL}
        />

        <div className="flex flex-1 gap-0 min-h-0 border-t border-slate-200 dark:border-slate-800 pt-2">
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
                        <MiniMap nodeColor={(n: Node) => n.data?.component_type === 'Bus' ? '#374151' : '#fff'} />
                    </ReactFlow>
                    {contextMenu && <ContextMenu {...contextMenu} onClose={() => setContextMenu(null)} onSelect={addNode} />}
                </ReactFlowProvider>
            </div>
            
            <ElementsSidebar />
        </div>
        
        {showFileSelector && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Select Source Files</h2>
                        <button onClick={() => setShowFileSelector(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    
                    <div className="border border-slate-200 dark:border-slate-700 rounded-t-md border-b-0">
                         <FileToolbar
                             searchTerm={searchTerm}
                             setSearchTerm={setSearchTerm}
                             fileCount={filteredFiles.length}
                             selectedCount={selectedFiles.size}
                             readOnly={true}
                         />
                    </div>

                    <div className="flex-1 overflow-auto min-h-0 border border-slate-200 dark:border-slate-700 rounded-b-md border-t-0">
                        {filteredFiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400"><p>No compatible files found.</p></div>
                        ) : (
                             <FileTable
                                files={filteredFiles}
                                loading={filesLoading}
                                selectedFiles={selectedFiles}
                                setSelectedFiles={setSelectedFiles}
                                onDelete={() => {}}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                                starredFiles={starredFiles}
                                onToggleStar={toggleStar}
                                readOnly={true}
                                onRowClick={(file) => {
                                    const newSet = new Set(selectedFiles);
                                    if (newSet.has(file.path || file.filename)) newSet.delete(file.path || file.filename);
                                    else newSet.add(file.path || file.filename);
                                    setSelectedFiles(newSet);
                                }}
                            />
                        )}
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button onClick={() => setShowFileSelector(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded">CANCEL</button>
                        <button onClick={() => executeRun(Array.from(selectedFiles))} disabled={selectedFiles.size === 0} className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50">RUN ({selectedFiles.size})</button>
                    </div>
                </div>
            </div>
        )}

        {showHistory && <ArchiveModal historyFiles={historyFiles} onClose={() => setShowHistory(false)} onLoad={handleManualLoad} />}
        {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
