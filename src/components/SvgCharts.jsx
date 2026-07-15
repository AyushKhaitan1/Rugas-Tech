import React, { useState } from 'react';

// --- PROGRESS CIRCLE COMPONENT ---
export function ProgressCircle({ percentage, size = 120, strokeWidth = 10, color = 'var(--primary)', label = '' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        {/* Center label */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{percentage}%</span>
          {label && <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{label}</span>}
        </div>
      </div>
    </div>
  );
}

// --- AREA CHART COMPONENT (WEEKLY TRENDS) ---
export function AreaChart({ data = [], height = 180 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  
  if (data.length === 0) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>;

  const width = 600;
  const padding = { top: 20, right: 30, bottom: 35, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Max value calculation (for scaling)
  const maxVal = Math.max(...data.map(d => Math.max(d.created || 0, d.served || 0)), 5);
  // Round up to nearest nice interval
  const yMax = Math.ceil(maxVal / 5) * 5;

  const getX = (idx) => padding.left + (idx / (data.length - 1)) * chartWidth;
  const getY = (val) => height - padding.bottom - (val / yMax) * chartHeight;

  // Generate paths
  let createdPoints = '';
  let servedPoints = '';
  
  data.forEach((d, idx) => {
    const x = getX(idx);
    const yCreated = getY(d.created || 0);
    const yServed = getY(d.served || 0);

    if (idx === 0) {
      createdPoints = `M ${x} ${yCreated}`;
      servedPoints = `M ${x} ${yServed}`;
    } else {
      createdPoints += ` L ${x} ${yCreated}`;
      servedPoints += ` L ${x} ${yServed}`;
    }
  });

  const createdArea = data.length > 0 
    ? `${createdPoints} L ${getX(data.length - 1)} ${height - padding.bottom} L ${getX(0)} ${height - padding.bottom} Z`
    : '';

  const servedArea = data.length > 0 
    ? `${servedPoints} L ${getX(data.length - 1)} ${height - padding.bottom} L ${getX(0)} ${height - padding.bottom} Z`
    : '';

  // Generate Y axis grids
  const gridLines = [];
  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const val = (yMax / gridCount) * i;
    const y = getY(val);
    gridLines.push(
      <g key={i}>
        <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
        <text x={padding.left - 10} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">{val}</text>
      </g>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        {/* Grids and Y labels */}
        {gridLines}

        {/* Areas */}
        {createdArea && (
          <path
            d={createdArea}
            fill="url(#createdGrad)"
            opacity="0.15"
            style={{ transition: 'all 0.3s ease' }}
          />
        )}
        {servedArea && (
          <path
            d={servedArea}
            fill="url(#servedGrad)"
            opacity="0.15"
            style={{ transition: 'all 0.3s ease' }}
          />
        )}

        {/* Lines */}
        {createdPoints && (
          <path
            d={createdPoints}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {servedPoints && (
          <path
            d={servedPoints}
            fill="none"
            stroke="var(--success)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Interactive Points / Hover bars */}
        {data.map((d, idx) => {
          const x = getX(idx);
          const yCreated = getY(d.created || 0);
          const yServed = getY(d.served || 0);
          const isHovered = hoveredIdx === idx;

          return (
            <g key={idx}>
              {/* Vertical hover guide */}
              {isHovered && (
                <line x1={x} y1={padding.top} x2={x} y2={height - padding.bottom} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              )}
              
              {/* Invisible touch target bar */}
              <rect
                x={x - chartWidth / (data.length * 2)}
                y={padding.top}
                width={chartWidth / data.length}
                height={chartHeight}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />

              {/* Data point circle: Created */}
              <circle
                cx={x}
                cy={yCreated}
                r={isHovered ? 6 : 4}
                fill="var(--bg-main)"
                stroke="var(--primary)"
                strokeWidth="2"
                style={{ transition: 'r 0.15s ease' }}
              />

              {/* Data point circle: Served */}
              <circle
                cx={x}
                cy={yServed}
                r={isHovered ? 6 : 4}
                fill="var(--bg-main)"
                stroke="var(--success)"
                strokeWidth="2"
                style={{ transition: 'r 0.15s ease' }}
              />

              {/* X axis labels */}
              <text
                x={x}
                y={height - padding.bottom + 18}
                fill={isHovered ? 'var(--text-primary)' : 'var(--text-muted)'}
                fontSize="10"
                fontWeight={isHovered ? 600 : 400}
                textAnchor="middle"
                style={{ transition: 'fill 0.15s' }}
              >
                {d.displayDate}
              </text>
            </g>
          );
        })}

        {/* Definitions for Gradients */}
        <defs>
          <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="servedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success)" />
            <stop offset="100%" stopColor="var(--success)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating HTML Tooltip */}
      {hoveredIdx !== null && (
        <div
          style={{
            position: 'absolute',
            top: '0px',
            left: `${(getX(hoveredIdx) / width) * 100}%`,
            transform: 'translateX(-50%) translateY(-100%)',
            backgroundColor: '#1e293b',
            border: '1px solid var(--border-color)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg)',
            pointerEvents: 'none',
            fontSize: '0.75rem',
            zIndex: 10,
            whiteSpace: 'nowrap',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            marginTop: '-10px',
          }}
        >
          <div style={{ fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px', marginBottom: '2px' }}>
            {data[hoveredIdx].displayDate}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span>
            <span>Created: <strong>{data[hoveredIdx].created}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
            <span>Served: <strong>{data[hoveredIdx].served}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

// --- BAR CHART COMPONENT (HOURLY TRAFFIC) ---
export function BarChart({ data = [], height = 150 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (data.length === 0) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>;

  const width = 600;
  const padding = { top: 15, right: 15, bottom: 35, left: 35 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Max value calculations
  const maxVal = Math.max(...data.map(d => d.count), 4);
  const yMax = Math.ceil(maxVal / 2) * 2;

  const getBarHeight = (count) => (count / yMax) * chartHeight;
  const getX = (idx) => padding.left + (idx / data.length) * chartWidth;
  const barWidth = Math.max(4, (chartWidth / data.length) * 0.7);

  // Y axis grids
  const gridLines = [];
  const gridCount = 3;
  for (let i = 0; i <= gridCount; i++) {
    const val = (yMax / gridCount) * i;
    const y = height - padding.bottom - (val / yMax) * chartHeight;
    gridLines.push(
      <g key={i}>
        <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.05)" />
        <text x={padding.left - 8} y={y + 3} fill="var(--text-muted)" fontSize="9" textAnchor="end">{val}</text>
      </g>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        {gridLines}

        {/* Bars */}
        {data.map((d, idx) => {
          const x = getX(idx) + (chartWidth / data.length - barWidth) / 2;
          const barH = getBarHeight(d.count);
          const y = height - padding.bottom - barH;
          const isHovered = hoveredIdx === idx;

          return (
            <g key={idx}>
              {/* Rounded corner bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={Math.min(barWidth / 2, 4)}
                ry={Math.min(barWidth / 2, 4)}
                fill={isHovered ? 'var(--primary)' : 'rgba(99, 102, 241, 0.4)'}
                style={{
                  transition: 'fill 0.15s, y 0.25s, height 0.25s',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />

              {/* X Axis labels */}
              {/* Only show alternating labels to prevent overlap if database has 24 hours */}
              {(idx % Math.ceil(data.length / 8) === 0 || isHovered) && (
                <text
                  x={x + barWidth / 2}
                  y={height - padding.bottom + 16}
                  fill={isHovered ? 'var(--text-primary)' : 'var(--text-muted)'}
                  fontSize="9"
                  fontWeight={isHovered ? 600 : 400}
                  textAnchor="middle"
                  style={{ transition: 'fill 0.15s' }}
                >
                  {d.displayHour.split(' ')[0]} {d.displayHour.split(' ')[1]}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIdx !== null && (
        <div
          style={{
            position: 'absolute',
            top: '0px',
            left: `${((getX(hoveredIdx) + barWidth/2) / width) * 100}%`,
            transform: 'translateX(-50%) translateY(-100%)',
            backgroundColor: '#1e293b',
            border: '1px solid var(--border-color)',
            padding: '0.4rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg)',
            pointerEvents: 'none',
            fontSize: '0.75rem',
            zIndex: 10,
            whiteSpace: 'nowrap',
            marginTop: '-5px',
          }}
        >
          <div>Time: <strong>{data[hoveredIdx].displayHour}</strong></div>
          <div style={{ color: 'var(--primary)' }}>Customers Added: <strong>{data[hoveredIdx].count}</strong></div>
        </div>
      )}
    </div>
  );
}
