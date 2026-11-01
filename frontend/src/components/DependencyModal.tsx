import React, { useState } from 'react';
import { X, Plus, AlertCircle, ArrowRight } from 'lucide-react';
import { Task, Dependency } from '../types';

interface DependencyModalProps {
  tasks: Task[];
  meetingId: string;
  onClose: () => void;
  onAdd: (dep: {
    source_task_id: string;
    target_task_id: string;
    relation_type: string;
    evidence_sentence?: string;
    meeting_id: string;
  }) => Promise<void>;
}

export const DependencyModal: React.FC<DependencyModalProps> = ({
  tasks,
  meetingId,
  onClose,
  onAdd
}) => {
  const [sourceId, setSourceId] = useState(tasks[0]?.id || '');
  const [targetId, setTargetId] = useState(tasks[1]?.id || tasks[0]?.id || '');
  const [relationType, setRelationType] = useState('DEPENDS_ON');
  const [evidence, setEvidence] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceId === targetId) {
      setError('A task cannot depend on itself (self-loop).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onAdd({
        source_task_id: sourceId,
        target_task_id: targetId,
        relation_type: relationType,
        evidence_sentence: evidence || 'Manually added by user in Dependency Manager.',
        meeting_id: meetingId
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add dependency');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Declare Task Dependency</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Convention: Downstream Task DEPENDS_ON Upstream Prerequisite
            </span>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            borderRadius: '6px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#F87171',
            marginBottom: '1rem',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Downstream Task (Waiting / Blocked Task)
            </label>
            <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.owner || 'Unknown'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#60A5FA', fontSize: '0.8rem', padding: '0.25rem 0' }}>
            <span style={{ fontWeight: 600 }}>DEPENDS ON</span>
            <ArrowRight size={16} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Upstream Task (Prerequisite that must finish first)
            </label>
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.owner || 'Unknown'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Relationship Evidence / Rationale
            </label>
            <input 
              type="text" 
              placeholder="e.g., Cannot proceed until database schema is approved."
              value={evidence} 
              onChange={(e) => setEvidence(e.target.value)} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              <Plus size={16} />
              <span>{loading ? 'Adding...' : 'Add Dependency'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
