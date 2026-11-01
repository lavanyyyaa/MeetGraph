import React, { useState, useEffect } from 'react';
import { 
  Play, 
  ArrowRight, 
  Cpu, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles,
  RefreshCw,
  Layers
} from 'lucide-react';

export const LiveGraphSimulator: React.FC = () => {
  const [activeStage, setActiveStage] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const stages = [
    { id: 0, title: "RAW TRANSCRIPT", label: "Speech to Text" },
    { id: 1, title: "NLP EXTRACTION", label: "Entities & Modals" },
    { id: 2, title: "GRAPH SYNTHESIS", label: "NetworkX Topology" },
    { id: 3, title: "GNN RISK ANALYSIS", label: "GraphSAGE Propagation" }
  ];

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setActiveStage(prev => (prev + 1) % stages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [autoPlay, stages.length]);

  return (
    <div className="glass-card-elevated" style={{
      position: 'relative',
      overflow: 'hidden',
      padding: '1.75rem',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '14px',
      background: 'linear-gradient(160deg, #12192A 0%, #0A0E18 100%)',
      boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    }}>
      {/* Top Telemetry Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#9DFC3F',
            boxShadow: '0 0 10px #9DFC3F'
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.06em' }}>
            MEETGRAPH PIPELINE TELEMETRY // STAGE 0{activeStage + 1}
          </span>
        </div>

        {/* Step Selector Pills */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {stages.map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setActiveStage(st.id);
                setAutoPlay(false);
              }}
              style={{
                background: activeStage === st.id ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: activeStage === st.id ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeStage === st.id ? '#FFFFFF' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              0{st.id + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Simulator Interactive Display Body */}
      <div style={{ minHeight: '210px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* Stage 0: Raw Text */}
        {activeStage === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60A5FA', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
              <span>TRANSCRIPT INPUT STREAM:</span>
            </div>
            <div style={{
              backgroundColor: '#070A12',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              padding: '1rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              color: '#CBD5E1',
              lineHeight: '1.6'
            }}>
              "Riya will complete the UI by Friday. However, she cannot finish it until Arjun completes the API integration. Arjun is waiting for the database team to finalize the schema by Wednesday."
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ color: '#9DFC3F' }}>●</span> Natural human dialogue ingested via speech-to-text or meeting minutes.
            </div>
          </div>
        )}

        {/* Stage 1: Extracted Entities & Temporal Tokens */}
        {activeStage === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#A78BFA', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
              <span>spaCy NER & TEMPORAL EXTRACTION:</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
              <div style={{ backgroundColor: '#070A12', border: '1px solid #3B82F6', borderRadius: '6px', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.65rem', color: '#93C5FD', fontFamily: 'var(--font-mono)' }}>TASK 01 // OWNER: RIYA</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#FFFFFF', marginTop: '0.2rem' }}>Complete the UI</div>
                <div style={{ fontSize: '0.72rem', color: '#FBBF24', marginTop: '0.2rem' }}>📅 Due Friday</div>
              </div>
              <div style={{ backgroundColor: '#070A12', border: '1px solid #8B5CF6', borderRadius: '6px', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.65rem', color: '#C4B5FD', fontFamily: 'var(--font-mono)' }}>TASK 02 // OWNER: ARJUN</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#FFFFFF', marginTop: '0.2rem' }}>API Integration</div>
                <div style={{ fontSize: '0.72rem', color: '#F87171', marginTop: '0.2rem' }}>⚠️ Status: BLOCKED</div>
              </div>
              <div style={{ backgroundColor: '#070A12', border: '1px solid #10B981', borderRadius: '6px', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.65rem', color: '#6EE7B7', fontFamily: 'var(--font-mono)' }}>TASK 03 // DB TEAM</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#FFFFFF', marginTop: '0.2rem' }}>Finalize Schema</div>
                <div style={{ fontSize: '0.72rem', color: '#FBBF24', marginTop: '0.2rem' }}>📅 Due Wednesday</div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Verbatim source sentences preserved. Unknown entities marked explicitly.
            </div>
          </div>
        )}

        {/* Stage 2: NetworkX Directed Graph */}
        {activeStage === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38BDF8', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
              <span>DIRECTED GRAPH TOPOLOGY (A DEPENDS_ON B):</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#070A12',
              borderRadius: '8px',
              padding: '1.25rem',
              border: '1px solid var(--border-medium)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#60A5FA' }}>Complete UI</div>
                <span className="badge badge-todo" style={{ marginTop: '0.2rem' }}>Downstream</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#38BDF8' }}>
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>DEPENDS_ON</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>→</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#C084FC' }}>API Integration</div>
                <span className="badge badge-blocked" style={{ marginTop: '0.2rem' }}>Intermediate</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#38BDF8' }}>
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>DEPENDS_ON</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>→</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9DFC3F' }}>Finalize Schema</div>
                <span className="badge badge-in_progress" style={{ marginTop: '0.2rem' }}>Root Prereq</span>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Acyclic validation confirmed. Critical path traversal length: 3 tasks deep.
            </div>
          </div>
        )}

        {/* Stage 3: GNN Message Passing & Risk Prediction */}
        {activeStage === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9DFC3F', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
              <Cpu size={14} color="#9DFC3F" />
              <span>GRAPHSAGE NEIGHBORHOOD MESSAGE PASSING:</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.9fr',
              gap: '1rem',
              backgroundColor: '#070A12',
              borderRadius: '8px',
              padding: '1rem',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#DDD6FE', fontWeight: 600 }}>CASCADING DELAY DETECTED:</div>
                <div style={{ fontSize: '0.82rem', color: '#F87171', marginTop: '0.25rem' }}>
                  Root bottleneck <strong>Finalize Schema</strong> propagates risk downstream to <strong>Complete the UI</strong> despite healthy local status.
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-medium)', paddingLeft: '0.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>GNN RISK PROBABILITY:</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#EF4444', fontFamily: 'var(--font-mono)' }}>
                  86.9% <span style={{ fontSize: '0.75rem', color: '#F87171' }}>[AT RISK]</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9DFC3F', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle size={13} />
              <span>GNN outperforms independent baselines by +5.1% F1 via edge message passing.</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Line Indicator */}
      <div style={{
        marginTop: '1.25rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            Active Phase: <strong>{stages[activeStage].label}</strong>
          </span>
        </div>
        <button
          onClick={() => setAutoPlay(!autoPlay)}
          className="btn-ghost"
          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
        >
          <RefreshCw size={12} className={autoPlay ? 'animate-spin' : ''} />
          <span>{autoPlay ? 'Live Cycle (Active)' : 'Resume Cycle'}</span>
        </button>
      </div>
    </div>
  );
};
