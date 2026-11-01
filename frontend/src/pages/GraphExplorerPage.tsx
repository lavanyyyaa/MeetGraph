import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Plus, 
  Layers, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Meeting, GraphData } from '../types';
import { apiService } from '../services/api';
import { GraphView } from '../components/GraphView';
import { DependencyModal } from '../components/DependencyModal';

interface GraphExplorerPageProps {
  initialMeetingId?: string;
  onNavigateTab: (tab: string, meetingId?: string) => void;
}

export const GraphExplorerPage: React.FC<GraphExplorerPageProps> = ({ 
  initialMeetingId, 
  onNavigateTab 
}) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(initialMeetingId || '');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDepModal, setShowDepModal] = useState(false);

  // Load meeting list
  useEffect(() => {
    async function fetchMeetings() {
      try {
        const list = await apiService.getMeetings();
        setMeetings(list);
        if (list.length > 0 && !selectedMeetingId) {
          setSelectedMeetingId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load meetings', err);
      }
    }
    fetchMeetings();
  }, []);

  // Load graph for selected meeting
  useEffect(() => {
    if (!selectedMeetingId) return;

    async function loadGraph() {
      setLoading(true);
      try {
        const [gData, meetData] = await Promise.all([
          apiService.getMeetingGraph(selectedMeetingId),
          apiService.getMeeting(selectedMeetingId)
        ]);
        setGraphData(gData);
        setCurrentMeeting(meetData);
      } catch (err) {
        console.error('Failed to load meeting graph', err);
      } finally {
        setLoading(false);
      }
    }
    loadGraph();
  }, [selectedMeetingId]);

  const handleAddDependency = async (depData: any) => {
    await apiService.addDependency(depData);
    if (selectedMeetingId) {
      const updatedGraph = await apiService.getMeetingGraph(selectedMeetingId);
      const updatedMeet = await apiService.getMeeting(selectedMeetingId);
      setGraphData(updatedGraph);
      setCurrentMeeting(updatedMeet);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header & Meeting Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Interactive Dependency Graph
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Visualizing task dependencies, team ownership, and deadline constraints.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Meeting:</span>
            <select
              value={selectedMeetingId}
              onChange={e => setSelectedMeetingId(e.target.value)}
              style={{ width: '280px', height: '38px', fontSize: '0.85rem' }}
            >
              {meetings.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.task_count} tasks)
                </option>
              ))}
            </select>
          </div>

          <button onClick={() => setShowDepModal(true)} className="btn-secondary">
            <Plus size={16} />
            <span>Add Dependency</span>
          </button>
        </div>
      </div>

      {/* Graph Status Pill Ribbon */}
      {graphData && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '0.65rem 1.25rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Nodes: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{graphData.total_nodes}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Edges: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{graphData.total_edges}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Cycles: </span>
            <strong style={{ color: graphData.has_cycle ? '#EF4444' : '#10B981' }}>
              {graphData.has_cycle ? `Loop detected (${graphData.cycles.length})` : 'None (Acyclic DAG)'}
            </strong>
          </div>
          {graphData.critical_paths.length > 0 && (
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Longest Chain: </span>
              <strong style={{ color: '#FBBF24' }}>
                {graphData.critical_paths[0].length} tasks deep
              </strong>
            </div>
          )}
        </div>
      )}

      {/* Main Graph Component */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-muted)' }}>
          Rendering interactive graph topology...
        </div>
      ) : graphData ? (
        <GraphView
          graphData={graphData}
          onSelectTask={(tId) => console.log('Selected task', tId)}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-muted)' }}>
          No graph data available. Please upload a meeting transcript first.
        </div>
      )}

      {/* Add Dependency Modal */}
      {showDepModal && currentMeeting && (
        <DependencyModal
          tasks={currentMeeting.tasks}
          meetingId={currentMeeting.id}
          onClose={() => setShowDepModal(false)}
          onAdd={handleAddDependency}
        />
      )}
    </div>
  );
};
