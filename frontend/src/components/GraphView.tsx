import React, { useState, useMemo, useEffect } from 'react';
import { 
  GraphData, 
  GraphNode, 
  GraphEdge 
} from '../types';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Filter, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  ArrowRight,
  TrendingUp,
  X,
  Layers,
  ChevronRight
} from 'lucide-react';
import { EvidenceBadge } from './EvidenceBadge';

interface GraphViewProps {
  graphData: GraphData;
  onSelectTask?: (taskId: string) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({ graphData, onSelectTask }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Custom node positions state
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  // Compute layered spatial layout
  useEffect(() => {
    if (!graphData.nodes.length) return;

    const positions: Record<string, { x: number; y: number }> = {};
    const taskNodes = graphData.nodes.filter(n => n.type === 'Task');
    const personNodes = graphData.nodes.filter(n => n.type === 'Person');
    const deadlineNodes = graphData.nodes.filter(n => n.type === 'Deadline');

    // Left Column: People
    personNodes.forEach((p, idx) => {
      positions[p.id] = { x: 90, y: 120 + idx * 110 };
    });

    // Center Stage: Task nodes arranged in clean topological grid
    taskNodes.forEach((t, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      positions[t.id] = { x: 380 + col * 270, y: 100 + row * 160 };
    });

    // Right Column: Deadlines
    deadlineNodes.forEach((d, idx) => {
      positions[d.id] = { x: 1240, y: 120 + idx * 110 };
    });

    setNodePositions(positions);
  }, [graphData]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return graphData.nodes.filter(node => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLabel = node.label.toLowerCase().includes(q);
        const matchesOwner = (node.data.owner || '').toLowerCase().includes(q);
        if (!matchesLabel && !matchesOwner) return false;
      }
      if (statusFilter !== 'ALL' && node.type === 'Task' && node.data.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && node.type !== typeFilter) return false;
      return true;
    });
  }, [graphData.nodes, searchQuery, statusFilter, typeFilter]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return graphData.edges.filter(edge => {
      return filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target);
    });
  }, [graphData.edges, filteredNodeIds]);

  // Selected node details
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return graphData.nodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, graphData.nodes]);

  // Highlighting upstream and downstream connected nodes
  const connectedNodeIds = useMemo(() => {
    const focusId = hoveredNodeId || selectedNodeId;
    if (!focusId) return new Set<string>();
    const ids = new Set<string>();
    ids.add(focusId);

    graphData.edges.forEach(e => {
      if (e.source === focusId) ids.add(e.target);
      if (e.target === focusId) ids.add(e.source);
    });
    return ids;
  }, [selectedNodeId, hoveredNodeId, graphData.edges]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.graph-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (draggedNode) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const newX = (e.clientX - rect.left - pan.x) / zoom;
      const newY = (e.clientY - rect.top - pan.y) / zoom;
      setNodePositions(prev => ({
        ...prev,
        [draggedNode]: { x: newX, y: newY }
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  const getNodeColor = (node: GraphNode) => {
    if (node.type === 'Person') return '#8B5CF6';
    if (node.type === 'Deadline') return '#F59E0B';
    const status = node.data.status;
    if (status === 'COMPLETED') return '#10B981';
    if (status === 'BLOCKED') return '#EF4444';
    if (status === 'IN_PROGRESS') return '#F59E0B';
    return '#3B82F6';
  };

  return (
    <div style={{ display: 'flex', gap: '1.25rem', height: 'calc(100vh - 130px)', minHeight: '640px' }}>
      {/* Main Graph Canvas Container */}
      <div style={{
        flex: 1,
        backgroundColor: '#07090F',
        border: '1px solid var(--border-medium)',
        borderRadius: '14px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-card)'
      }}>
        {/* Top Control Header */}
        <div style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: 'rgba(11, 15, 25, 0.92)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20
        }}>
          {/* Search & Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} color="#64748B" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search nodes, owners..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2rem', height: '34px', fontSize: '0.8rem', backgroundColor: '#07090F' }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ height: '34px', fontSize: '0.8rem', width: '130px', backgroundColor: '#07090F' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ height: '34px', fontSize: '0.8rem', width: '120px', backgroundColor: '#07090F' }}
            >
              <option value="ALL">All Node Types</option>
              <option value="Task">Tasks Only</option>
              <option value="Person">People</option>
              <option value="Deadline">Deadlines</option>
            </select>
          </div>

          {/* Graph Warnings & Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {graphData.has_cycle ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#F87171',
                padding: '0.3rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: '1px solid rgba(239, 68, 68, 0.35)',
                fontFamily: 'var(--font-mono)'
              }}>
                <AlertTriangle size={15} />
                <span>CYCLE WARNING: {graphData.cycles.length} LOOPS</span>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#34D399',
                padding: '0.3rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontFamily: 'var(--font-mono)'
              }}>
                <CheckCircle size={14} />
                <span>VALID DIRECTED ACYCLIC GRAPH</span>
              </div>
            )}

            {/* Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--bg-terminal)', borderRadius: '6px', padding: '0.15rem', border: '1px solid var(--border-medium)' }}>
              <button onClick={() => setZoom(prev => Math.min(prev + 0.15, 2.2))} className="btn-ghost" style={{ padding: '0.35rem' }} title="Zoom In">
                <ZoomIn size={15} />
              </button>
              <button onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.4))} className="btn-ghost" style={{ padding: '0.35rem' }} title="Zoom Out">
                <ZoomOut size={15} />
              </button>
              <button onClick={() => { setZoom(1); setPan({ x: 40, y: 40 }); }} className="btn-ghost" style={{ padding: '0.35rem' }} title="Reset View">
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* SVG Interactive Canvas */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            flex: 1,
            cursor: isDragging ? 'grabbing' : 'grab',
            position: 'relative',
            userSelect: 'none',
            overflow: 'hidden',
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        >
          <svg style={{ width: '100%', height: '100%', transformOrigin: '0 0' }}>
            <defs>
              <marker id="edge-arrow-depends" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#3B82F6" />
              </marker>
              <marker id="edge-arrow-owns" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#8B5CF6" />
              </marker>
              <marker id="edge-arrow-due" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#F59E0B" />
              </marker>
              <marker id="edge-arrow-cycle" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#EF4444" />
              </marker>
            </defs>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Edges */}
              {filteredEdges.map(edge => {
                const srcPos = nodePositions[edge.source];
                const tgtPos = nodePositions[edge.target];
                if (!srcPos || !tgtPos) return null;

                const isConnected = connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target);
                const isCycleEdge = edge.data?.is_in_cycle;

                let strokeColor = '#24324F';
                let markerId = 'edge-arrow-depends';
                if (edge.label === 'OWNS') {
                  strokeColor = '#473673';
                  markerId = 'edge-arrow-owns';
                } else if (edge.label === 'DUE_BY') {
                  strokeColor = '#594423';
                  markerId = 'edge-arrow-due';
                }

                if (isCycleEdge) {
                  strokeColor = '#EF4444';
                  markerId = 'edge-arrow-cycle';
                } else if (isConnected && (selectedNodeId || hoveredNodeId)) {
                  strokeColor = '#38BDF8';
                }

                const dx = tgtPos.x - srcPos.x;
                const dy = tgtPos.y - srcPos.y;
                const midX = (srcPos.x + tgtPos.x) / 2;
                const midY = (srcPos.y + tgtPos.y) / 2 - (dx !== 0 ? 15 : 0);

                return (
                  <g key={edge.id}>
                    <path
                      d={`M ${srcPos.x} ${srcPos.y} Q ${midX} ${midY} ${tgtPos.x} ${tgtPos.y}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isConnected ? 2.5 : 1.5}
                      strokeDasharray={edge.label === 'OWNS' ? '4 3' : 'none'}
                      markerEnd={`url(#${markerId})`}
                    />
                    {/* Edge Label Badge */}
                    <rect
                      x={midX - 32}
                      y={midY - 8}
                      width={64}
                      height={16}
                      rx={3}
                      fill="#070A12"
                      stroke={strokeColor}
                      strokeWidth={0.8}
                    />
                    <text
                      x={midX}
                      y={midY + 3.5}
                      fill="#94A3B8"
                      fontSize="8"
                      fontFamily="var(--font-mono)"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {edge.label}
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {filteredNodes.map(node => {
                const pos = nodePositions[node.id] || { x: 200, y: 200 };
                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isConnected = connectedNodeIds.has(node.id);
                const color = getNodeColor(node);

                return (
                  <g
                    key={node.id}
                    className="graph-node"
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      if (node.type === 'Task' && onSelectTask) onSelectTask(node.id);
                    }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggedNode(node.id);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Task Node */}
                    {node.type === 'Task' && (
                      <g>
                        {/* Glow halo on selection */}
                        {isSelected && (
                          <rect
                            x={-112}
                            y={-42}
                            width={224}
                            height={84}
                            rx={12}
                            fill="none"
                            stroke="#38BDF8"
                            strokeWidth={2.5}
                            opacity={0.8}
                          />
                        )}
                        <rect
                          x={-106}
                          y={-36}
                          width={212}
                          height={72}
                          rx={9}
                          fill="#101728"
                          stroke={node.data.is_in_cycle ? '#EF4444' : isSelected ? '#3B82F6' : '#223254'}
                          strokeWidth={node.data.is_in_cycle ? 2 : 1.5}
                        />
                        {/* Status Rail Line */}
                        <rect
                          x={-106}
                          y={-36}
                          width={6}
                          height={72}
                          rx={3}
                          fill={color}
                        />
                        {/* Title */}
                        <text
                          x={-90}
                          y={-12}
                          fill="#FFFFFF"
                          fontSize="11.5"
                          fontWeight="600"
                          fontFamily="var(--font-sans)"
                        >
                          {node.label.length > 23 ? node.label.slice(0, 23) + '...' : node.label}
                        </text>
                        {/* Owner & Status */}
                        <text
                          x={-90}
                          y={8}
                          fill="#94A3B8"
                          fontSize="9.5"
                          fontFamily="var(--font-sans)"
                        >
                          👤 {node.data.owner || 'Unknown'} • {node.data.status || 'TODO'}
                        </text>
                        {/* GNN Risk Telemetry */}
                        {node.data.gnn_risk_prob !== undefined && (
                          <text
                            x={-90}
                            y={24}
                            fill={node.data.gnn_risk_prob >= 0.5 ? '#F87171' : '#A78BFA'}
                            fontSize="8.5"
                            fontFamily="var(--font-mono)"
                            fontWeight="700"
                          >
                            GNN RISK: {Math.round(node.data.gnn_risk_prob * 100)}%
                          </text>
                        )}
                        {/* Critical Path Badge */}
                        {node.data.is_critical && (
                          <g>
                            <rect
                              x={68}
                              y={-30}
                              width={32}
                              height={14}
                              rx={3}
                              fill="rgba(245, 158, 11, 0.2)"
                              stroke="#F59E0B"
                              strokeWidth={0.8}
                            />
                            <text
                              x={84}
                              y={-20}
                              fill="#FBBF24"
                              fontSize="7.5"
                              fontWeight="700"
                              fontFamily="var(--font-mono)"
                              textAnchor="middle"
                            >
                              CRIT
                            </text>
                          </g>
                        )}
                      </g>
                    )}

                    {/* Person Node */}
                    {node.type === 'Person' && (
                      <g>
                        <rect
                          x={-75}
                          y={-22}
                          width={150}
                          height={44}
                          rx={22}
                          fill="#171A30"
                          stroke={isSelected ? '#C084FC' : '#3E386B'}
                          strokeWidth={1.5}
                        />
                        <text
                          x={-50}
                          y={5}
                          fill="#DDD6FE"
                          fontSize="11"
                          fontWeight="600"
                          fontFamily="var(--font-sans)"
                        >
                          👤 {node.label}
                        </text>
                      </g>
                    )}

                    {/* Deadline Node */}
                    {node.type === 'Deadline' && (
                      <g>
                        <rect
                          x={-70}
                          y={-20}
                          width={140}
                          height={40}
                          rx={6}
                          fill="#241C10"
                          stroke={isSelected ? '#FBBF24' : '#5E4417'}
                          strokeWidth={1.5}
                        />
                        <text
                          x={-55}
                          y={5}
                          fill="#FDE68A"
                          fontSize="10.5"
                          fontWeight="700"
                          fontFamily="var(--font-mono)"
                        >
                          📅 {node.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Bottom Legend Pill Strip */}
          <div style={{
            position: 'absolute',
            bottom: '14px',
            left: '14px',
            backgroundColor: 'rgba(10, 14, 24, 0.94)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            padding: '0.65rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            backdropFilter: 'blur(8px)',
            fontFamily: 'var(--font-mono)'
          }}>
            <span style={{ fontWeight: 700, color: '#FFFFFF' }}>LEGEND:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
              <span>TODO Task</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
              <span>BLOCKED Task</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8B5CF6' }} />
              <span>Person (OWNS)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
              <span>Deadline (DUE_BY)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: '#38BDF8', fontWeight: 700 }}>→</span>
              <span>DEPENDS_ON (A → B)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side Inspector Panel */}
      <div style={{
        width: '390px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: '14px',
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
            <span className="signal-lamp" style={{ backgroundColor: '#38BDF8' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.06em' }}>
              NODE TELEMETRY INSPECTOR
            </span>
          </div>

          <h3 className="font-display" style={{ fontSize: '1.45rem', letterSpacing: '0.02em', color: '#FFFFFF', lineHeight: '1.2' }}>
            {selectedNode ? selectedNode.label : 'SELECT NODE IN GRAPH'}
          </h3>

          {selectedNode && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.35rem' }}>
              ID: {selectedNode.id} • TYPE: {selectedNode.type.toUpperCase()}
            </div>
          )}
        </div>

        {selectedNode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {selectedNode.type === 'Task' && (
              <>
                {/* Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className={`badge badge-${(selectedNode.data.status || 'todo').toLowerCase()}`}>
                    {selectedNode.data.status || 'TODO'}
                  </span>
                  <span className={`badge badge-${(selectedNode.data.risk_label || 'low').toLowerCase()}`}>
                    RISK: {selectedNode.data.risk_label || 'LOW'}
                  </span>
                  {selectedNode.data.is_critical && (
                    <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.18)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      CRITICAL PATH
                    </span>
                  )}
                </div>

                {/* Owner & Deadline */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: 'var(--bg-terminal)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ASSIGNED OWNER</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FFFFFF', marginTop: '0.15rem' }}>
                      {selectedNode.data.owner || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>NORMALIZED DEADLINE</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FBBF24', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                      {selectedNode.data.deadline || selectedNode.data.deadline_raw || 'No date'}
                    </div>
                  </div>
                </div>

                {/* GNN Risk Prediction Score */}
                <div style={{ backgroundColor: 'var(--bg-terminal)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)', borderLeft: '3px solid #8B5CF6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#DDD6FE', fontFamily: 'var(--font-mono)' }}>
                      <Cpu size={14} color="#8B5CF6" />
                      <span>GNN RISK PROBABILITY</span>
                    </div>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: selectedNode.data.gnn_risk_prob && selectedNode.data.gnn_risk_prob >= 0.5 ? '#F87171' : '#34D399', fontFamily: 'var(--font-mono)' }}>
                      {selectedNode.data.gnn_risk_prob !== undefined ? `${Math.round(selectedNode.data.gnn_risk_prob * 100)}%` : 'N/A'}
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '6px', backgroundColor: '#1E293B', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((selectedNode.data.gnn_risk_prob || 0) * 100)}%`, height: '100%', backgroundColor: selectedNode.data.gnn_risk_prob && selectedNode.data.gnn_risk_prob >= 0.5 ? '#EF4444' : '#8B5CF6' }} />
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                    Predicted by GraphSAGE using 2-hop dependency message passing.
                  </div>
                </div>

                {/* Rule Priority Score */}
                <div style={{ backgroundColor: 'var(--bg-terminal)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', borderLeft: '3px solid #3B82F6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93C5FD', fontFamily: 'var(--font-mono)' }}>
                      RULE PRIORITY SCORE
                    </span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#60A5FA', fontFamily: 'var(--font-mono)' }}>
                      {selectedNode.data.priority_score || 0}/100
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {selectedNode.data.rule_reasoning || 'Operational priority based on downstream tasks and blockers.'}
                  </div>
                </div>

                {/* Evidence Sentence */}
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.35rem' }}>
                    TRANSCRIPT GROUNDING EVIDENCE
                  </div>
                  <div style={{
                    padding: '0.85rem',
                    backgroundColor: '#070A12',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontStyle: 'italic',
                    color: '#E2E8F0',
                    lineHeight: '1.45'
                  }}>
                    "{selectedNode.data.source_sentence || 'Extracted from transcript.'}"
                  </div>
                </div>
              </>
            )}

            {selectedNode.type === 'Person' && (
              <div style={{ backgroundColor: 'var(--bg-terminal)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
                <div style={{ fontSize: '0.85rem', color: '#FFFFFF', marginBottom: '0.35rem' }}>
                  Team Member: <strong>{selectedNode.label}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Directed OWNS edges connect this member to their assigned commitments.
                </div>
              </div>
            )}

            {selectedNode.type === 'Deadline' && (
              <div style={{ backgroundColor: 'var(--bg-terminal)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
                <div style={{ fontSize: '0.85rem', color: '#FBBF24', fontFamily: 'var(--font-mono)', marginBottom: '0.35rem' }}>
                  TARGET DEADLINE: {selectedNode.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Normalized ISO date used for critical chain time-slack analysis.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '260px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            gap: '0.85rem'
          }}>
            <Info size={32} opacity={0.4} />
            <div style={{ fontSize: '0.82rem', maxWidth: '280px', lineHeight: '1.5' }}>
              Click any node in the graph to inspect structural properties, GNN risk probabilities, and original transcript evidence.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
