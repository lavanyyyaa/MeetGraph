import React, { useEffect, useState } from 'react';
import { 
  CheckSquare, 
  AlertTriangle, 
  Network, 
  ArrowRight, 
  Layers, 
  Cpu, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Terminal,
  Activity,
  Calendar
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { OverviewStats, Meeting } from '../types';
import { apiService } from '../services/api';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { LiveGraphSimulator } from '../components/LiveGraphSimulator';

interface OverviewPageProps {
  onNavigateTab: (tab: string, meetingId?: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, meetingsData] = await Promise.all([
          apiService.getOverviewStats(),
          apiService.getMeetings()
        ]);
        setStats(statsData);
        setMeetings(meetingsData);
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      {/* =========================================================================
          HERO SECTION — "EVERY CONVERSATION HAS A STRUCTURE."
          Inspired by HackTheCore monumental typography & HackOnTrack cyber-rail
          ========================================================================= */}
      <section style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1.1fr',
        gap: '2.5rem',
        alignItems: 'center',
        paddingTop: '1rem',
        paddingBottom: '1.5rem'
      }}>
        {/* Left Column: Monumental Typography & CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Metadata Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#38BDF8',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              letterSpacing: '0.06em'
            }}>
              [SYS // GRAPH-NEURAL-NLP]
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              TRANSCRIPT INTELLIGENCE ENGINE
            </span>
          </div>

          {/* Monumental Headline */}
          <div>
            <h1 className="font-display" style={{
              fontSize: 'clamp(2.75rem, 5.5vw, 4.75rem)',
              lineHeight: '0.95',
              letterSpacing: '0.02em',
              color: '#FFFFFF',
              textTransform: 'uppercase'
            }}>
              EVERY CONVERSATION <br />
              <span style={{ 
                background: 'linear-gradient(135deg, #60A5FA 0%, #C084FC 50%, #9DFC3F 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                HAS A STRUCTURE.
              </span>
            </h1>
            
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              marginTop: '1.25rem',
              lineHeight: '1.55',
              maxWidth: '560px'
            }}>
              Turn spoken meeting transcripts into connected intelligence. Extract action items, 
              uncover hidden dependency bottlenecks, and predict cascading task risks with Graph Neural Networks.
            </p>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => onNavigateTab('transcripts')} 
              className="btn-primary"
              style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
            >
              <span>Analyze Meeting Transcript</span>
              <ArrowRight size={18} />
            </button>

            <button 
              onClick={() => onNavigateTab('graph')} 
              className="btn-secondary"
              style={{ padding: '0.85rem 1.5rem', fontSize: '0.95rem' }}
            >
              <Network size={18} color="#60A5FA" />
              <span>Explore Live Graph</span>
            </button>
          </div>

          {/* Contextual Academic Telemetry Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1rem',
            marginTop: '0.5rem'
          }}>
            <div>
              <span style={{ color: '#9DFC3F' }}>86.9%</span> GNN F1-SCORE
            </div>
            <div>•</div>
            <div>
              <span style={{ color: '#38BDF8' }}>10-DIM</span> NODE EMBEDDINGS
            </div>
            <div>•</div>
            <div>
              <span style={{ color: '#C084FC' }}>ZERO</span> GRAPH LEAKAGE
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Graph Simulator */}
        <div>
          <LiveGraphSimulator />
        </div>
      </section>

      {/* =========================================================================
          KEY TELEMETRY METRICS GRID
          ========================================================================= */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          indexTag="01"
          title="Meetings Analysed"
          value={stats?.total_meetings || 0}
          subtitle="Processed transcripts & minutes"
          icon={Layers}
          color="#3B82F6"
        />
        <StatCard
          indexTag="02"
          title="Extracted Tasks"
          value={stats?.total_tasks || 0}
          subtitle={`${stats?.open_tasks || 0} active, ${(stats?.total_tasks || 0) - (stats?.open_tasks || 0)} finished`}
          icon={CheckSquare}
          color="#10B981"
        />
        <StatCard
          indexTag="03"
          title="Blocked Tasks"
          value={stats?.blocked_tasks || 0}
          subtitle="Waiting on upstream tasks"
          icon={AlertTriangle}
          color="#EF4444"
          badge={stats?.blocked_tasks ? 'CRITICAL BOTTLENECK' : undefined}
        />
        <StatCard
          indexTag="04"
          title="GNN At-Risk Tasks"
          value={stats?.at_risk_tasks || 0}
          subtitle="GraphSAGE cascade probability >= 50%"
          icon={Cpu}
          color="#8B5CF6"
          badge="ATML MODEL"
        />
        <StatCard
          indexTag="05"
          title="Graph Dependencies"
          value={stats?.total_dependencies || 0}
          subtitle="A DEPENDS_ON B directed paths"
          icon={Network}
          color="#06B6D4"
        />
      </section>

      {/* =========================================================================
          OPERATIONAL WORKSPACE: ATTENTION FIRST & DEADLINES
          ========================================================================= */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.75rem' }}>
        {/* Tasks Requiring Immediate Attention */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <span className="signal-lamp" style={{ backgroundColor: '#EF4444' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: '#F87171' }}>
                  OPERATIONAL BOTTLENECK RADAR
                </span>
              </div>
              <h2 className="font-display" style={{ fontSize: '1.5rem', letterSpacing: '0.03em', color: '#FFFFFF' }}>
                TASKS REQUIRING IMMEDIATE ATTENTION
              </h2>
            </div>

            <button onClick={() => onNavigateTab('tasks')} className="btn-ghost" style={{ fontSize: '0.8rem' }}>
              <span>View All Tasks</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {stats?.attention_tasks.map((task, idx) => (
              <div 
                key={task.id}
                style={{
                  backgroundColor: 'var(--bg-terminal)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#60A5FA', fontWeight: 700 }}>
                      0{idx + 1}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#FFFFFF' }}>
                      {task.title}
                    </span>
                    <span className={`badge badge-${task.status.toLowerCase()}`}>
                      {task.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                    <span>👤 {task.owner || 'Unknown'}</span>
                    {task.deadline && (
                      <span style={{ color: '#FBBF24', fontFamily: 'var(--font-mono)' }}>
                        📅 Due {task.deadline}
                      </span>
                    )}
                    <EvidenceBadge sentence={task.source_sentence} confidence={task.confidence} />
                  </div>
                </div>

                {/* Scores */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      RULE PRIORITY
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#60A5FA', fontFamily: 'var(--font-mono)' }}>
                      {task.priority_score}/100
                    </div>
                  </div>

                  {task.gnn_risk_prob !== undefined && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        GNN RISK
                      </div>
                      <div style={{ 
                        fontSize: '1rem', 
                        fontWeight: 700, 
                        color: task.gnn_risk_prob >= 0.5 ? '#F87171' : '#34D399', 
                        fontFamily: 'var(--font-mono)' 
                      }}>
                        {Math.round(task.gnn_risk_prob * 100)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {(!stats?.attention_tasks || stats.attention_tasks.length === 0) && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No active tasks found. Run the extraction pipeline on a meeting transcript to start.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deadlines & Recent Meetings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Upcoming Deadlines */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <Calendar size={14} color="#FBBF24" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: '#FCD34D' }}>
                TEMPORAL CALENDAR
              </span>
            </div>
            <h2 className="font-display" style={{ fontSize: '1.35rem', letterSpacing: '0.03em', color: '#FFFFFF', marginBottom: '0.85rem' }}>
              UPCOMING DEADLINES
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {stats?.upcoming_deadlines.map((task) => (
                <div 
                  key={task.id}
                  style={{
                    backgroundColor: 'var(--bg-terminal)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid var(--border-medium)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF' }}>{task.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      👤 {task.owner || 'Unknown'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: '#FBBF24',
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    {task.deadline}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Meetings */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Terminal size={14} color="#60A5FA" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: '#93C5FD' }}>
                  RECENT ANALYSES
                </span>
              </div>
              <button onClick={() => onNavigateTab('transcripts')} className="btn-ghost" style={{ fontSize: '0.75rem' }}>
                + Add Meeting
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {meetings.slice(0, 3).map((m) => (
                <div
                  key={m.id}
                  onClick={() => onNavigateTab('graph', m.id)}
                  style={{
                    backgroundColor: 'var(--bg-terminal)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FFFFFF' }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                      {m.task_count} tasks • {m.dependency_count} dependencies
                    </div>
                  </div>
                  <div style={{ color: '#38BDF8' }}>
                    <ArrowRight size={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
