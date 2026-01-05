
import { useState, useCallback } from 'react';
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

import { Save } from 'lucide-react';

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

const defaultConfig = { project_name: "NEW_PROJECT", settings: { ansi_51: { transformer: { factor_I1: 1.2, time_dial_I1: { value: 0.5, curve: "VIT", comment: "Surcharge Transfo" }, factor_I2: 0.8, time_dial_I2: { value: 0.1, curve: "DT", comment: "Secours Court-Circuit" }, factor_I4: 6.0, time_dial_I4: { value: 0.05, curve: "DT", comment: "High-Set Inst." } }, incomer: { factor_I1: 1.0, time_dial_I1: { value: 0.5, curve: "SIT", comment: "Incomer Std" }, factor_I2: 1.0, time_dial_I2: { value: 0.2, curve: "DT", comment: "Backup" }, factor_I4: 10.0, time_dial_I4: { value: 0.05, curve: "DT", comment: "Inst." } }, coupling: { factor_I1: 1.0, time_dial_I1: { value: 0.5, curve: "SIT", comment: "Cpl Std" }, factor_I2: 1.0, time_dial_I2: { value: 0.2, curve: "DT", comment: "Backup" }, factor_I4: 10.0, time_dial_I4: { value: 0.05, curve: "DT", comment: "Inst." } } } }, transformers: [], links_data: [], loadflow_settings: { target_mw: 0, tolerance_mw: 0.3, swing_bus_id: "" }, plans: [] };

export default function DiagramEditor() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

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

  return (
    <div className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 px-6 pt-6">
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase">Diagram Editor</h1>
            <div className="flex gap-2">
                <button onClick={handleSave} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-bold shadow-sm transition-all text-[10px]">
                    <Save className="w-3.5 h-3.5" />
                    SAVE DIAGRAM
                </button>
            </div>
        </div>
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
  );
}
