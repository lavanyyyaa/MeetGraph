import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Play, 
  Check, 
  AlertCircle, 
  Edit2, 
  Plus, 
  Network, 
  Sparkles,
  Trash2,
  Terminal,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { Meeting, Task, Dependency } from '../types';
import { apiService } from '../services/api';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { TaskModal } from '../components/TaskModal';
import { DependencyModal } from '../components/DependencyModal';

const PRESET_TRANSCRIPTS = [
  {
    name: 'Canonical Standup (Prompt Example)',
    tag: 'PRESET 01',
    title: 'Sprint 42 Daily Standup',
    text: `Riya will complete the UI by Friday. However, she cannot finish it until Arjun completes the API integration. Arjun is waiting for the database team to finalize the schema by Wednesday. Testing will begin once the UI and API are ready.`
  },
  {
    name: 'Sprint Planning (E-Commerce Platform)',
    tag: 'PRESET 02',
    title: 'Sprint Planning - E-Commerce Platform',
    text: `Sarah will build the user authentication microservice by Tuesday.
Liam will implement the payment webhook handler by Thursday.
Liam cannot finish the payment webhook handler until Sarah completes the user authentication microservice.
Riya will complete the frontend checkout interface by Friday.
However, she cannot finish it until Liam completes the payment webhook handler.
QA Team is waiting for the frontend checkout interface to begin end-to-end integration tests.
Deployment will commence once the integration tests and payment webhook handler are ready.`
  },
  {
    name: 'Incident Postmortem (Latency Spike)',
    tag: 'PRESET 03',
    title: 'Incident Review - API Latency Spike',
    text: `DevOps will optimize the Docker container memory limits by tomorrow.
Database Team will execute the cache layer invalidation by Wednesday.
Arjun will patch the SSL handshake timeout by Thursday.
Arjun cannot finish the SSL handshake timeout until Database Team finishes the cache layer invalidation.
Sarah will prepare the release note documentation by Friday.
Staging verification will begin once the SSL handshake timeout and Docker container optimization are ready.`
  }
];

interface TranscriptUploadPageProps {
  onNavigateTab: (tab: string, meetingId?: string) => void;
}

export const TranscriptUploadPage: React.FC<TranscriptUploadPageProps> = ({ onNavigateTab }) => {
  const [title, setTitle] = useState('Sprint 42 Daily Standup');
  const [transcript, setTranscript] = useState(PRESET_TRANSCRIPTS[0].text);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedMeeting, setProcessedMeeting] = useState<Meeting | null>(null);

  // Modals state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDepModal, setShowDepModal] = useState(false);

  const handleProcess = async () => {
    if (!transcript.trim()) {
      setError('Please provide transcript text to process.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.processTranscriptText(title, transcript);
      setProcessedMeeting(result);
    } catch (err: any) {
      setError(err.message || 'Failed to process transcript');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      setError('Please upload a plain text (.txt) file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setTranscript(text);
      setTitle(file.name.replace('.txt', ''));
    };
    reader.readAsText(file);
  };

  const handleSaveTask = async (taskId: string, updates: Partial<Task>) => {
    const updated = await apiService.updateTask(taskId, updates);
    if (processedMeeting) {
      setProcessedMeeting({
        ...processedMeeting,
        tasks: processedMeeting.tasks.map(t => t.id === taskId ? { ...t, ...updated } : t)
      });
    }
  };

  const handleAddDependency = async (depData: any) => {
    const newDep = await apiService.addDependency(depData);
    if (processedMeeting) {
      setProcessedMeeting({
        ...processedMeeting,
        dependencies: [...processedMeeting.dependencies, newDep],
        dependency_count: processedMeeting.dependency_count + 1
      });
    }
  };

  const handleDeleteDependency = async (depId: string) => {
    await apiService.deleteDependency(depId);
    if (processedMeeting) {
      setProcessedMeeting({
        ...processedMeeting,
        dependencies: processedMeeting.dependencies.filter(d => d.id !== depId),
        dependency_count: processedMeeting.dependency_count - 1
      });
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Page Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
          <span className="signal-lamp" style={{ backgroundColor: '#38BDF8' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.06em' }}>
            NLP INFORMATION EXTRACTION PIPELINE
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: '2.4rem', letterSpacing: '0.02em', color: '#FFFFFF' }}>
          MEETING TRANSCRIPT INGESTION & DECOMPOSITION
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.2rem', maxWidth: '780px' }}>
          Extract candidate commitments, assign owners via named entities, normalize relative deadlines, 
          and synthesize directed dependency edges with verbatim evidence preservation.
        </p>
      </div>

      {/* Preset Pickers & Main Input Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '1.75rem' }}>
        {/* Left Column: Form & Presets */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#FFFFFF' }}>Transcript Input Stream</h2>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              TEXT OR .TXT UPLOAD
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
              BENCHMARK TEST PRESETS (1-CLICK LOAD):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {PRESET_TRANSCRIPTS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTitle(preset.title);
                    setTranscript(preset.text);
                  }}
                  style={{
                    backgroundColor: transcript === preset.text ? 'rgba(59, 130, 246, 0.18)' : 'var(--bg-terminal)',
                    border: transcript === preset.text ? '1px solid #3B82F6' : '1px solid var(--border-medium)',
                    borderRadius: '6px',
                    padding: '0.6rem 0.75rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: transcript === preset.text ? '#60A5FA' : 'var(--text-muted)' }}>
                    {preset.tag}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#FFFFFF', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {preset.name.split('(')[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
              MEETING TITLE
            </label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Sprint 42 Daily Standup" 
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                TRANSCRIPT TEXT (RAW NATURAL LANGUAGE)
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {transcript.length} CHARS • {transcript.split(/\s+/).filter(Boolean).length} WORDS
              </span>
            </div>
            <textarea
              rows={8}
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Paste raw conversation transcript or meeting notes here..."
              style={{ resize: 'vertical', lineHeight: '1.6', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
            />
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#F87171',
              fontSize: '0.85rem',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <label style={{ cursor: 'pointer' }} className="btn-secondary">
              <Upload size={16} />
              <span>Upload .txt Transcript</span>
              <input type="file" accept=".txt" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>

            <button onClick={handleProcess} disabled={loading} className="btn-primary">
              <Play size={16} />
              <span>{loading ? 'Running Extraction...' : 'Execute NLP Pipeline'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Active Extraction Rules Reference */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
            <BookOpen size={16} color="#60A5FA" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#FFFFFF' }}>Pipeline Extraction Specifications</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.82rem' }}>
            <div style={{ backgroundColor: 'var(--bg-terminal)', padding: '0.85rem', borderRadius: '8px', borderLeft: '3px solid #3B82F6', border: '1px solid var(--border-medium)' }}>
              <strong style={{ color: '#93C5FD' }}>1. Action Item & Modal Verbs:</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Detects future intent markers ("will complete", "is waiting for", "to finalize", "will begin").
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-terminal)', padding: '0.85rem', borderRadius: '8px', borderLeft: '3px solid #F59E0B', border: '1px solid var(--border-medium)' }}>
              <strong style={{ color: '#FCD34D' }}>2. Temporal Normalization:</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Converts colloquial relative weekdays ("by Friday", "by Wednesday", "tomorrow") into standardized ISO-8601 calendar dates.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-terminal)', padding: '0.85rem', borderRadius: '8px', borderLeft: '3px solid #8B5CF6', border: '1px solid var(--border-medium)' }}>
              <strong style={{ color: '#C084FC' }}>3. Cross-Sentence Dependency Linking:</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Resolves pronoun references ("she cannot finish it until Arjun...") and maps prerequisite tasks to downstream tasks.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-terminal)', padding: '0.85rem', borderRadius: '8px', borderLeft: '3px solid #10B981', border: '1px solid var(--border-medium)' }}>
              <strong style={{ color: '#6EE7B7' }}>4. Verbatim Evidence Grounding:</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Every extracted task, assignee, and edge links to its verbatim sentence. Missing data is represented as unknown.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Extraction Results Tables */}
      {processedMeeting && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Succeeded Banner */}
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34D399', fontWeight: 700, fontSize: '1.15rem' }}>
                <Check size={20} />
                <span>EXTRACTION COMPLETED: "{processedMeeting.title.toUpperCase()}"</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Successfully synthesized {processedMeeting.tasks.length} action items and {processedMeeting.dependencies.length} directed dependency relationships.
              </p>
            </div>

            <button onClick={() => onNavigateTab('graph', processedMeeting.id)} className="btn-primary">
              <Network size={16} />
              <span>Inspect in Dependency Graph</span>
            </button>
          </div>

          {/* Action Items Table */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="font-display" style={{ fontSize: '1.4rem', letterSpacing: '0.02em', color: '#FFFFFF' }}>
                  EXTRACTED ACTION ITEMS ({processedMeeting.tasks.length})
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Human-in-the-loop: Click Edit to correct title, owner, or status
                </span>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Task Description</th>
                    <th>Assigned Owner</th>
                    <th>Normalized Deadline</th>
                    <th>Status</th>
                    <th>NLP Confidence</th>
                    <th>Grounding Evidence</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processedMeeting.tasks.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.title}</td>
                      <td>👤 {t.owner || 'Unknown'}</td>
                      <td>
                        {t.deadline ? (
                          <span style={{ color: '#FBBF24', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                            {t.deadline}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>None</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${t.status.toLowerCase()}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: t.confidence >= 0.85 ? '#34D399' : '#FBBF24' }}>
                          {Math.round(t.confidence * 100)}%
                        </span>
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

          {/* Dependencies Table */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="font-display" style={{ fontSize: '1.4rem', letterSpacing: '0.02em', color: '#FFFFFF' }}>
                  EXTRACTED DEPENDENCY CHAINS ({processedMeeting.dependencies.length})
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  EDGE CONVENTION: Downstream Task DEPENDS_ON Upstream Prerequisite
                </p>
              </div>

              <button onClick={() => setShowDepModal(true)} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                <Plus size={14} />
                <span>Declare Dependency</span>
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Downstream Task (Waiting)</th>
                    <th>Relation Type</th>
                    <th>Upstream Prerequisite (Must Finish First)</th>
                    <th>Source Evidence</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processedMeeting.dependencies.map(d => {
                    const srcTask = processedMeeting.tasks.find(t => t.id === d.source_task_id);
                    const tgtTask = processedMeeting.tasks.find(t => t.id === d.target_task_id);
                    return (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 600 }}>{srcTask?.title || d.source_task_id}</td>
                        <td>
                          <span style={{
                            color: '#38BDF8',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            backgroundColor: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            {d.relation_type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#DDD6FE' }}>
                          {tgtTask?.title || d.target_task_id}
                        </td>
                        <td>
                          <EvidenceBadge sentence={d.evidence_sentence} confidence={d.confidence} />
                        </td>
                        <td>
                          <button 
                            onClick={() => handleDeleteDependency(d.id)} 
                            className="btn-ghost" 
                            style={{ color: '#F87171', padding: '0.25rem 0.5rem' }}
                            title="Delete Dependency"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}
        />
      )}

      {/* Add Dependency Modal */}
      {showDepModal && processedMeeting && (
        <DependencyModal
          tasks={processedMeeting.tasks}
          meetingId={processedMeeting.id}
          onClose={() => setShowDepModal(false)}
          onAdd={handleAddDependency}
        />
      )}
    </div>
  );
};
