import React, { useState } from 'react';
import { Quote, Check, Copy } from 'lucide-react';

interface EvidenceBadgeProps {
  sentence: string;
  confidence?: number;
  label?: string;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ 
  sentence, 
  confidence, 
  label = "Source Evidence" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-ghost"
        style={{
          fontSize: '0.75rem',
          padding: '0.2rem 0.5rem',
          border: '1px solid var(--border-subtle)',
          backgroundColor: isOpen ? 'var(--bg-tertiary)' : 'transparent',
          color: '#94A3B8'
        }}
        title="Click to view extracted evidence sentence"
      >
        <Quote size={12} color="#60A5FA" />
        <span>{label}</span>
        {confidence !== undefined && (
          <span style={{ 
            fontSize: '0.68rem', 
            opacity: 0.8,
            color: confidence >= 0.85 ? '#34D399' : '#FBBF24' 
          }}>
            ({Math.round(confidence * 100)}%)
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 100,
          backgroundColor: '#0F172A',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '0.85rem',
          width: '320px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
          fontSize: '0.8rem',
          color: '#E2E8F0',
          lineHeight: '1.4'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', borderBottom: '1px solid #1E293B', paddingBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
              NLP Transcript Extraction Evidence
            </span>
            <button 
              onClick={handleCopy}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem' }}
            >
              {copied ? <Check size={12} color="#34D399" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div style={{ fontStyle: 'italic', color: '#CBD5E1', marginBottom: '0.4rem' }}>
            "{sentence}"
          </div>
          {confidence !== undefined && (
            <div style={{ fontSize: '0.7rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
              <span>Extraction Confidence:</span>
              <span style={{ fontWeight: 600, color: confidence >= 0.85 ? '#34D399' : '#FBBF24' }}>
                {Math.round(confidence * 100)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
