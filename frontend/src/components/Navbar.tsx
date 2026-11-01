import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Network, 
  CheckSquare, 
  Cpu, 
  Radio,
  ArrowUpRight
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  serverOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, serverOnline = true }) => {
  const navItems = [
    { id: 'overview', label: 'OVERVIEW', tag: '01', icon: LayoutDashboard },
    { id: 'transcripts', label: 'NLP EXTRACTOR', tag: '02', icon: FileText },
    { id: 'graph', label: 'DEPENDENCY GRAPH', tag: '03', icon: Network },
    { id: 'tasks', label: 'ACTION & RISK', tag: '04', icon: CheckSquare },
    { id: 'ml-evaluation', label: 'ATML / GNN', tag: '05', icon: Cpu },
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(7, 9, 15, 0.88)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      {/* Top Transit Rail Accent (Reference 2 Inspiration) */}
      <div className="transit-signal-strip" />

      <div style={{
        padding: '0.85rem 2.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1440px',
        margin: '0 auto'
      }}>
        {/* Brand & Identity */}
        <div 
          onClick={() => setActiveTab('overview')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60A5FA'
          }}>
            <Network size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="font-display" style={{ fontSize: '1.45rem', letterSpacing: '0.04em', color: '#FFFFFF' }}>
                MEETGRAPH
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#C084FC',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                letterSpacing: '0.05em'
              }}>
                ATML + NLP
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              GRAPH REPRESENTATION LEARNING SYSTEM
            </div>
          </div>
        </div>

        {/* Central Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.95rem',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.07)' : 'transparent',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ 
                  fontSize: '0.65rem', 
                  fontFamily: 'var(--font-mono)', 
                  color: isActive ? '#60A5FA' : 'var(--text-muted)' 
                }}>
                  {item.tag}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* System Status Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-terminal)',
            border: '1px solid var(--border-medium)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem'
          }}>
            <span 
              className="signal-lamp"
              style={{ backgroundColor: serverOnline ? '#9DFC3F' : '#EF4444' }} 
            />
            <span style={{ color: serverOnline ? '#9DFC3F' : '#F87171', fontWeight: 600 }}>
              {serverOnline ? 'SYS: ONLINE // GNN READY' : 'SYS: DISCONNECTED'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
