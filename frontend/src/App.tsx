import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewPage } from './pages/OverviewPage';
import { TranscriptUploadPage } from './pages/TranscriptUploadPage';
import { GraphExplorerPage } from './pages/GraphExplorerPage';
import { ActionItemsPage } from './pages/ActionItemsPage';
import { MLEvaluationPage } from './pages/MLEvaluationPage';
import { apiService } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | undefined>(undefined);
  const [serverOnline, setServerOnline] = useState<boolean>(true);

  // Health check on mount and interval
  useEffect(() => {
    async function checkHealth() {
      try {
        const stats = await apiService.getOverviewStats();
        setServerOnline(true);
      } catch (err) {
        setServerOnline(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (tab: string, meetingId?: string) => {
    if (meetingId) {
      setSelectedMeetingId(meetingId);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          serverOnline={serverOnline} 
        />

        <main style={{ minHeight: 'calc(100vh - 70px)' }}>
          {activeTab === 'overview' && (
            <OverviewPage onNavigateTab={handleNavigate} />
          )}

          {activeTab === 'transcripts' && (
            <TranscriptUploadPage onNavigateTab={handleNavigate} />
          )}

          {activeTab === 'graph' && (
            <GraphExplorerPage 
              initialMeetingId={selectedMeetingId} 
              onNavigateTab={handleNavigate} 
            />
          )}

          {activeTab === 'tasks' && (
            <ActionItemsPage 
              initialMeetingId={selectedMeetingId} 
              onNavigateTab={handleNavigate} 
            />
          )}

          {activeTab === 'ml-evaluation' && (
            <MLEvaluationPage />
          )}
        </main>

        <footer style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.25rem 2rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto'
        }}>
          <div>
            <strong>MeetGraph</strong> — NLP Action Dependency & Graph Representation Learning System
          </div>
          <div>
            University Master's ATML + NLP Research Project • Powered by spaCy, NetworkX, PyTorch & GraphSAGE
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
