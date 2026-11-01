import {
  Meeting,
  Task,
  Dependency,
  GraphData,
  RecommendationResponse,
  OverviewStats,
  ModelEvaluationComparison
} from '../types';

const API_BASE = '/api';

export const apiService = {
  // Stats
  async getOverviewStats(): Promise<OverviewStats> {
    const res = await fetch(`${API_BASE}/stats/overview`);
    if (!res.ok) throw new Error('Failed to load overview stats');
    return res.json();
  },

  // Meetings
  async getMeetings(): Promise<Meeting[]> {
    const res = await fetch(`${API_BASE}/meetings`);
    if (!res.ok) throw new Error('Failed to load meetings');
    return res.json();
  },

  async getMeeting(id: string): Promise<Meeting> {
    const res = await fetch(`${API_BASE}/meetings/${id}`);
    if (!res.ok) throw new Error(`Failed to load meeting ${id}`);
    return res.json();
  },

  async deleteMeeting(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/meetings/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete meeting ${id}`);
  },

  // Transcripts
  async processTranscriptText(title: string, transcript: string, meeting_date?: string): Promise<Meeting> {
    const res = await fetch(`${API_BASE}/transcripts/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, transcript, meeting_date })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to process transcript');
    }
    return res.json();
  },

  async uploadTranscriptFile(file: File, title?: string, meeting_date?: string): Promise<Meeting> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (meeting_date) formData.append('meeting_date', meeting_date);

    const res = await fetch(`${API_BASE}/transcripts/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload transcript file');
    }
    return res.json();
  },

  // Graph
  async getMeetingGraph(meetingId: string): Promise<GraphData> {
    const res = await fetch(`${API_BASE}/meetings/${meetingId}/graph`);
    if (!res.ok) throw new Error(`Failed to load graph for meeting ${meetingId}`);
    return res.json();
  },

  // Recommendations
  async getRecommendations(meetingId: string): Promise<RecommendationResponse> {
    const res = await fetch(`${API_BASE}/meetings/${meetingId}/recommendations`);
    if (!res.ok) throw new Error(`Failed to load recommendations for meeting ${meetingId}`);
    return res.json();
  },

  // Tasks
  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(`Failed to update task ${taskId}`);
    return res.json();
  },

  // Dependencies
  async addDependency(dep: {
    source_task_id: string;
    target_task_id: string;
    relation_type?: string;
    evidence_sentence?: string;
    meeting_id?: string;
  }): Promise<Dependency> {
    const res = await fetch(`${API_BASE}/dependencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...dep,
        evidence_sentence: dep.evidence_sentence || 'Manually declared dependency.',
        confidence: 1.0
      })
    });
    if (!res.ok) throw new Error('Failed to create dependency');
    return res.json();
  },

  async deleteDependency(depId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/dependencies/${depId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete dependency ${depId}`);
  },

  // ML Evaluation
  async getModelEvaluation(): Promise<ModelEvaluationComparison> {
    const res = await fetch(`${API_BASE}/ml/evaluation`);
    if (!res.ok) throw new Error('Failed to load ML evaluation report');
    return res.json();
  },

  async triggerTraining(): Promise<ModelEvaluationComparison> {
    const res = await fetch(`${API_BASE}/ml/train`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to execute model training');
    return res.json();
  }
};
