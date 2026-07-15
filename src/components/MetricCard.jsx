import React from 'react';

export default function MetricCard({ title, value, icon, trend, trendColor = 'var(--primary)' }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background radial glow */}
      <div 
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '80px',
          height: '80px',
          borderRadius: 'var(--radius-full)',
          background: `radial-gradient(circle, ${trendColor} 0%, transparent 70%)`,
          opacity: 0.1,
          pointerEvents: 'none'
        }}
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title}
        </span>
        <div style={{ color: trendColor, opacity: 0.8 }}>
          {icon}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.25rem' }}>
        <span style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          {value}
        </span>
        {trend && (
          <span style={{ fontSize: '0.75rem', color: trendColor, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
