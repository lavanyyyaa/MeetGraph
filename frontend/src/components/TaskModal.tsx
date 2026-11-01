import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Task } from '../types';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSave }) => {
  const [title, setTitle] = useState(task.title);
  const [owner, setOwner] = useState(task.owner || 'Unknown');
  const [deadline, setDeadline] = useState(task.deadline || '');
  const [status, setStatus] = useState<Task['status']>(task.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(task.id, {
        title,
        owner,
        deadline: deadline || undefined,
        status
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Edit Extracted Action Item</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {task.id}</span>
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
              Task Title
            </label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Assigned Owner
              </label>
              <input 
                type="text" 
                value={owner} 
                onChange={(e) => setOwner(e.target.value)} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Normalized Deadline
              </label>
              <input 
                type="date" 
                value={deadline} 
                onChange={(e) => setDeadline(e.target.value)} 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Execution Status
            </label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="TODO">TODO (Unstarted)</option>
              <option value="IN_PROGRESS">IN_PROGRESS (Active)</option>
              <option value="BLOCKED">BLOCKED (Waiting on Prerequisite)</option>
              <option value="COMPLETED">COMPLETED (Finished)</option>
            </select>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-tertiary)',
            padding: '0.75rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            borderLeft: '3px solid var(--accent-blue)'
          }}>
            <div style={{ fontWeight: 600, fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              ORIGINAL TRANSCRIPT EVIDENCE
            </div>
            <div style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>
              "{task.source_sentence}"
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Corrections'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
