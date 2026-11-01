import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, 
  Search, 
  AlertTriangle, 
  Clock, 
  Edit2, 
  Cpu, 
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Meeting, Task, Recommendation } from '../types';
import { apiService } from '../services/api';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { TaskModal } from '../components/TaskModal';

interface ActionItemsPageProps {
  initialMeetingId?: string;
  onNavigateTab: (tab: string, meetingId?: string) => void;
}

export const ActionItemsPage: React.FC<ActionItemsPageProps> = ({ 
  initialMeetingId,
  onNavigateTab
}) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(initialMeetingId || '');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationSummary, setRecommendationSummary] = useState('');
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Edit task modal
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    async function loadMeetings() {
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
    loadMeetings();
  }, []);

  useEffect(() => {
    if (!selectedMeetingId) return;

    async function loadTasksAndRecs() {
      setLoading(true);
      try {
        const [meetingData, recsData] = await Promise.all([
          apiService.getMeeting(selectedMeetingId),
          apiService.getRecommendations(selectedMeetingId)
        ]);
        setTasks(meetingData.tasks);
        setRecommendations(recsData.recommendations);
        setRecommendationSummary(recsData.summary);
      } catch (err) {
        console.error('Failed to load action items and recommendations', err);
      } finally {
        setLoading(false);
      }
    }
    loadTasksAndRecs();
  }, [selectedMeetingId]);

  const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
    try {
      const updated = await apiService.updateTask(task.id, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updated } : t));
      const recsData = await apiService.getRecommendations(selectedMeetingId);
      setRecommendations(recsData.recommendations);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleSaveTask = async (taskId: string, updates: Partial<Task>) => {
    const updated = await apiService.updateTask(taskId, updates);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t));
    const recsData = await apiService.getRecommendations(selectedMeetingId);
    setRecommendations(recsData.recommendations);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesOwner = (t.owner || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesOwner) return false;
      }
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (riskFilter !== 'ALL' && t.risk_label !== riskFilter) return false;
      return true;
    });
  }, [tasks, searchQuery, statusFilter, riskFilter]);

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Page Title & Meeting Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
            <span className="signal-lamp" style={{ backgroundColor: '#F59E0B' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: '#FCD34D', letterSpacing: '0.06em' }}>
              PRIORITIZATION & CASCADE RISK ENGINE
            </span>
          </div>
          <h1 className="font-display" style={{ fontSize: '2.4rem', letterSpacing: '0.02em', color: '#FFFFFF' }}>
            ACTION ITEMS & RISK PRIORITIZATION
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
            Differentiates deterministic rule-based operational urgency from GNN structural cascade risk.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>MEETING:</span>
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
      </div>

      {/* Section 1: Attention & Recommendation Engine */}
      <div className="glass-card" style={{ borderLeft: '4px solid #3B82F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#38BDF8" />
              <h2 className="font-display" style={{ fontSize: '1.45rem', letterSpacing: '0.03em', color: '#FFFFFF' }}>
                PRIORITIZATION & RISK RECOMMENDATIONS
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {recommendationSummary || 'Tasks ranked to unblock downstream teams and prevent cascade delays.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
          {recommendations.slice(0, 3).map((rec) => (
            <div 
              key={rec.task_id}
              style={{
                backgroundColor: 'var(--bg-terminal)',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#FFFFFF' }}>
                  {rec.title}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: rec.attention_category === 'Critical Upstream Blocker' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  color: rec.attention_category === 'Critical Upstream Blocker' ? '#F87171' : '#60A5FA',
                  border: `1px solid ${rec.attention_category === 'Critical Upstream Blocker' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(59, 130, 246, 0.35)'}`,
                  whiteSpace: 'nowrap'
                }}>
                  {rec.attention_category}
                </span>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                {rec.rule_reason}
              </div>

              {rec.downstream_tasks.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#CBD5E1', backgroundColor: '#070A12', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <strong style={{ color: '#94A3B8' }}>Blocks {rec.downstream_impact_count} downstream task(s): </strong>
                  <span>{rec.downstream_tasks.join(', ')}</span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>SOURCE:</span>
                  <span style={{ 
                    color: rec.recommendation_source === 'GNN_MODEL' ? '#C084FC' : rec.recommendation_source === 'HYBRID' ? '#38BDF8' : '#60A5FA',
                    fontWeight: 700 
                  }}>
                    {rec.recommendation_source}
                  </span>
                </div>
                <EvidenceBadge sentence={rec.evidence_sentence} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Dense Filterable Action Items Table */}
      <div className="glass-card">
        {/* Table Filters Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: '240px' }}>
              <Search size={14} color="#64748B" style={{ position: 'absolute', left: '10px', top: '12px' }} />
              <input
                type="text"
                placeholder="Search action items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.82rem' }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: '140px', height: '36px', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>

            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              style={{ width: '130px', height: '36px', fontSize: '0.82rem' }}
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">HIGH Risk</option>
              <option value="MEDIUM">MEDIUM Risk</option>
              <option value="LOW">LOW Risk</option>
            </select>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            SHOWING <strong>{filteredTasks.length}</strong> OF {tasks.length} COMMITMENTS
          </div>
        </div>

        {/* Action Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Task Description</th>
                <th>Owner</th>
                <th>Deadline</th>
                <th>Status (Quick Update)</th>
                <th>Rule Priority</th>
                <th>GNN Risk Prob</th>
                <th>Dependencies</th>
                <th>Grounding Evidence</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600, maxWidth: '240px' }}>
                    <div style={{ color: '#FFFFFF' }}>{t.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t.id}</div>
                  </td>
                  <td>👤 {t.owner || 'Unknown'}</td>
                  <td>
                    {t.deadline ? (
                      <span style={{ color: '#FBBF24', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{t.deadline}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>None</span>
                    )}
                  </td>
                  <td>
                    <select
                      value={t.status}
                      onChange={e => handleStatusChange(t, e.target.value as any)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        height: '30px',
                        width: '125px',
                        backgroundColor: t.status === 'BLOCKED' ? 'rgba(239, 68, 68, 0.18)' : 'var(--bg-terminal)',
                        color: t.status === 'BLOCKED' ? '#F87171' : 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600
                      }}
                    >
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="BLOCKED">BLOCKED</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#60A5FA' }}>
                      {t.priority_score}/100
                    </span>
                  </td>
                  <td>
                    {t.gnn_risk_prob !== undefined ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          color: t.gnn_risk_prob >= 0.5 ? '#F87171' : '#34D399'
                        }}>
                          {Math.round(t.gnn_risk_prob * 100)}%
                        </span>
                        <span style={{
                          fontSize: '0.65rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '3px',
                          backgroundColor: t.gnn_risk_prob >= 0.5 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                          color: t.gnn_risk_prob >= 0.5 ? '#FCA5A5' : '#6EE7B7'
                        }}>
                          {t.gnn_risk_prob >= 0.5 ? 'AT RISK' : 'LOW'}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>N/A</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      <div>↑ {t.upstream_task_ids?.length || 0} prereq(s)</div>
                      <div>↓ {t.downstream_task_ids?.length || 0} dependent(s)</div>
                    </div>
                  </td>
                  <td>
                    <EvidenceBadge sentence={t.source_sentence} confidence={t.confidence} />
                  </td>
                  <td>
                    <button onClick={() => setEditingTask(t)} className="btn-ghost" style={{ padding: '0.25rem 0.5rem' }}>
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
};
