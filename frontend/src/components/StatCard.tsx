import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  indexTag?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  indexTag = "01",
  title,
  value,
  subtitle,
  icon: Icon,
  color = '#3B82F6',
  badge
}) => {
  return (
    <div className="glass-card" style={{
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '135px'
    }}>
      {/* Top Telemetry Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            fontWeight: 700
          }}>
            [{indexTag} // {title.toUpperCase()}]
          </span>
        </div>

        {badge && (
          <span style={{
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            padding: '0.15rem 0.45rem',
            borderRadius: '3px',
            backgroundColor: `${color}18`,
            color: color,
            border: `1px solid ${color}45`
          }}>
            {badge}
          </span>
        )}
      </div>

      {/* Primary Value & Subtitle */}
      <div style={{ margin: '0.65rem 0' }}>
        <div className="font-display" style={{
          fontSize: '2.5rem',
          lineHeight: '1',
          color: '#FFFFFF',
          letterSpacing: '0.02em',
          textShadow: `0 0 20px ${color}30`
        }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Decorative Bottom Line Accent */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, ${color} 0%, transparent 80%)`,
        opacity: 0.6
      }} />
    </div>
  );
};
