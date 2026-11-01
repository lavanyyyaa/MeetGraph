import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  BarChart2, 
  Table, 
  BookOpen, 
  ShieldAlert, 
  Info,
  GitBranch,
  Terminal,
  Activity
} from 'lucide-react';
import { ModelEvaluationComparison } from '../types';
import { apiService } from '../services/api';

export const MLEvaluationPage: React.FC = () => {
  const [evaluation, setEvaluation] = useState<ModelEvaluationComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [trainMessage, setTrainMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadEval() {
      try {
        const data = await apiService.getModelEvaluation();
        setEvaluation(data);
      } catch (err) {
        console.error('Failed to load evaluation', err);
      } finally {
        setLoading(false);
      }
    }
    loadEval();
  }, []);

  const handleRetrain = async () => {
    setTraining(true);
    setTrainMessage('Retraining GraphSAGE and non-graph baseline across 130 disjoint meeting graphs...');
    try {
      const data = await apiService.triggerTraining();
      setEvaluation(data);
      setTrainMessage('Training complete! PyTorch weights and evaluation results updated.');
      setTimeout(() => setTrainMessage(null), 5000);
    } catch (err: any) {
      setTrainMessage(`Retraining failed: ${err.message}`);
    } finally {
      setTraining(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading ATML model evaluation metrics...</div>
      </div>
    );
  }

  const gnn = evaluation?.gnn_metrics;
  const baseline = evaluation?.baseline_metrics;
  const stats = evaluation?.dataset_stats;

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
            <span className="signal-lamp" style={{ backgroundColor: '#C084FC' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: '#C084FC', letterSpacing: '0.06em' }}>
              ADVANCED TOPICS IN MACHINE LEARNING // ATML EXPERIMENT
            </span>
          </div>
          <h1 className="font-display" style={{ fontSize: '2.4rem', letterSpacing: '0.02em', color: '#FFFFFF' }}>
            GRAPHSAGE VS. NON-GRAPH BASELINE EVALUATION
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
            Empirical validation of graph representation learning for cascading task-risk classification.
          </p>
        </div>

        <button 
          onClick={handleRetrain} 
          disabled={training}
          className="btn-primary"
          style={{ background: 'linear-gradient(180deg, #8B5CF6 0%, #6D28D9 100%)', borderColor: 'rgba(255, 255, 255, 0.3)' }}
        >
          <RefreshCw size={16} className={training ? 'animate-spin' : ''} />
          <span>{training ? 'Training Network...' : 'Retrain Experiment (Fixed Seed 42)'}</span>
        </button>
      </div>

      {trainMessage && (
        <div style={{
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          backgroundColor: trainMessage.includes('failed') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          color: trainMessage.includes('failed') ? '#F87171' : '#34D399',
          border: `1px solid ${trainMessage.includes('failed') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          fontSize: '0.875rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600
        }}>
          {trainMessage}
        </div>
      )}

      {/* Formal Research Question Card (HackTheCore Editorial Style) */}
      <div className="glass-card" style={{ borderLeft: '4px solid #8B5CF6', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
          <BookOpen size={16} color="#C084FC" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: '#C084FC', letterSpacing: '0.06em' }}>
            FORMAL ATML RESEARCH QUESTION
          </span>
        </div>

        <div className="font-serif-italic" style={{
          fontSize: '1.45rem',
          color: '#FFFFFF',
          lineHeight: '1.4',
          margin: '0.5rem 0',
          letterSpacing: '-0.01em'
        }}>
          "{evaluation?.research_question}"
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.55', marginTop: '0.5rem' }}>
          Traditional task tracking inspects action items in isolation (deadline proximity, local status). 
          However, real project delays cascade along upstream dependencies (e.g. an unannounced database schema delay holding up an API, 
          which in turn blocks frontend integration testing). Graph representation learning propagates structural neighbor signals across directed edges, 
          enabling the network to detect non-local bottleneck risks before deadlines are missed.
        </p>
      </div>

      {/* Comparative Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            [01 // F1-SCORE (PRIMARY)]
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginTop: '0.5rem' }}>
            <span className="font-display" style={{ fontSize: '2.5rem', color: '#C084FC', letterSpacing: '0.02em' }}>
              {gnn ? (gnn.f1_score * 100).toFixed(1) + '%' : 'N/A'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              vs {baseline ? (baseline.f1_score * 100).toFixed(1) + '%' : 'N/A'} (Baseline)
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9DFC3F', marginTop: '0.35rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {gnn && baseline ? `+${((gnn.f1_score - baseline.f1_score) * 100).toFixed(1)}% ABSOLUTE LIFT VIA GNN` : ''}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            [02 // CLASSIFICATION ACCURACY]
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginTop: '0.5rem' }}>
            <span className="font-display" style={{ fontSize: '2.5rem', color: '#38BDF8', letterSpacing: '0.02em' }}>
              {gnn ? (gnn.accuracy * 100).toFixed(1) + '%' : 'N/A'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              vs {baseline ? (baseline.accuracy * 100).toFixed(1) + '%' : 'N/A'} (Baseline)
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34D399', marginTop: '0.35rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {gnn && baseline ? `+${((gnn.accuracy - baseline.accuracy) * 100).toFixed(1)}% OVERALL ACCURACY` : ''}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            [03 // AT-RISK RECALL]
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginTop: '0.5rem' }}>
            <span className="font-display" style={{ fontSize: '2.5rem', color: '#9DFC3F', letterSpacing: '0.02em' }}>
              {gnn ? (gnn.recall * 100).toFixed(1) + '%' : 'N/A'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              vs {baseline ? (baseline.recall * 100).toFixed(1) + '%' : 'N/A'} (Baseline)
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            High sensitivity to upstream delays
          </div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            [04 // RISK PRECISION]
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginTop: '0.5rem' }}>
            <span className="font-display" style={{ fontSize: '2.5rem', color: '#FBBF24', letterSpacing: '0.02em' }}>
              {gnn ? (gnn.precision * 100).toFixed(1) + '%' : 'N/A'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              vs {baseline ? (baseline.precision * 100).toFixed(1) + '%' : 'N/A'} (Baseline)
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34D399', marginTop: '0.35rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {gnn && baseline ? `+${((gnn.precision - baseline.precision) * 100).toFixed(1)}% FEWER FALSE ALARMS` : ''}
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Table and Confusion Matrices */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr', gap: '1.75rem' }}>
        {/* Quantitative Table */}
        <div className="glass-card">
          <h2 className="font-display" style={{ fontSize: '1.35rem', letterSpacing: '0.02em', color: '#FFFFFF', marginBottom: '0.85rem' }}>
            TEST SET METRICS (HELD-OUT MEETINGS)
          </h2>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Model Architecture</th>
                  <th>Accuracy</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1-Score</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                  <td style={{ fontWeight: 600, color: '#DDD6FE' }}>
                    GraphSAGE GNN (2-layer)
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {gnn ? (gnn.accuracy * 100).toFixed(1) + '%' : 'N/A'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {gnn ? (gnn.precision * 100).toFixed(1) + '%' : 'N/A'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {gnn ? (gnn.recall * 100).toFixed(1) + '%' : 'N/A'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#C084FC' }}>
                    {gnn ? (gnn.f1_score * 100).toFixed(1) + '%' : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    Logistic Regression (Baseline)
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {baseline ? (baseline.accuracy * 100).toFixed(1) + '%' : 'N/A'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {baseline ? (baseline.precision * 100).toFixed(1) + '%' : 'N/A'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {baseline ? (baseline.recall * 100).toFixed(1) + '%' : 'N/A'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {baseline ? (baseline.f1_score * 100).toFixed(1) + '%' : 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.85rem' }}>
            * Evaluated on {stats?.num_test_graphs || 25} completely disjoint test meeting graphs ({stats?.num_test_nodes || 179} tasks) with zero leakage.
          </div>
        </div>

        {/* Confusion Matrix Visualizer */}
        <div className="glass-card">
          <h2 className="font-display" style={{ fontSize: '1.35rem', letterSpacing: '0.02em', color: '#FFFFFF', marginBottom: '0.85rem' }}>
            2×2 CONFUSION MATRIX BREAKDOWN
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* GraphSAGE Matrix */}
            <div style={{ backgroundColor: 'var(--bg-terminal)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#DDD6FE', marginBottom: '0.75rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                GRAPHSAGE GNN
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34D399' }}>
                    {gnn?.confusion_matrix?.[0]?.[0] ?? 0}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>TRUE LOW RISK</div>
                </div>
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F87171' }}>
                    {gnn?.confusion_matrix?.[0]?.[1] ?? 0}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>FALSE ALARM</div>
                </div>
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F87171' }}>
                    {gnn?.confusion_matrix?.[1]?.[0] ?? 0}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>MISSED DELAY</div>
                </div>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34D399' }}>
                    {gnn?.confusion_matrix?.[1]?.[1] ?? 0}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>TRUE AT RISK</div>
                </div>
              </div>
            </div>

            {/* Baseline Matrix */}
            <div style={{ backgroundColor: 'var(--bg-terminal)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                NON-GRAPH BASELINE
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem 0.5rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#CBD5E1' }}>
                    {baseline?.confusion_matrix?.[0]?.[0] ?? 0}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>TRUE LOW RISK</div>
                </div>
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem 0.5rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F87171' }}>
                    {baseline?.confusion_matrix?.[0]?.[1] ?? 0}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>FALSE ALARM</div>
                </div>
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem 0.5rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F87171' }}>
                    {baseline?.confusion_matrix?.[1]?.[0] ?? 0}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>MISSED DELAY</div>
                </div>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem 0.5rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#CBD5E1' }}>
                    {baseline?.confusion_matrix?.[1]?.[1] ?? 0}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>TRUE AT RISK</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Architecture & Feature Vectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.75rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
            <Layers size={16} color="#06B6D4" />
            <h2 className="font-display" style={{ fontSize: '1.35rem', letterSpacing: '0.02em', color: '#FFFFFF' }}>
              10-DIMENSIONAL TASK NODE EMBEDDINGS
            </h2>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.85rem' }}>
            {stats?.feature_names?.map((f, i) => (
              <div 
                key={i} 
                style={{
                  backgroundColor: 'var(--bg-terminal)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '6px',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#93C5FD'
                }}
              >
                <span style={{ color: '#64748B' }}>[F{i}]</span> {f}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1.25rem', backgroundColor: 'var(--bg-terminal)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TRAINING SET</div>
              <div style={{ fontWeight: 700, color: '#FFFFFF', marginTop: '0.15rem' }}>{stats?.num_train_graphs} graphs ({stats?.num_train_nodes} nodes)</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>VALIDATION SET</div>
              <div style={{ fontWeight: 700, color: '#FFFFFF', marginTop: '0.15rem' }}>{stats?.num_val_graphs} graphs ({stats?.num_val_nodes} nodes)</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>HELD-OUT TEST SET</div>
              <div style={{ fontWeight: 700, color: '#FFFFFF', marginTop: '0.15rem' }}>{stats?.num_test_graphs} graphs ({stats?.num_test_nodes} nodes)</div>
            </div>
          </div>
        </div>

        {/* Limitations & Academic Ethics */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
            <ShieldAlert size={16} color="#F59E0B" />
            <h2 className="font-display" style={{ fontSize: '1.35rem', letterSpacing: '0.02em', color: '#FFFFFF' }}>
              ACADEMIC LIMITATIONS & ETHICS
            </h2>
          </div>

          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {evaluation?.limitations?.map((lim, idx) => (
              <li key={idx} style={{ lineHeight: '1.45' }}>
                {lim}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
