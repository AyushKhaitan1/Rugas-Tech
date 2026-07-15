import React from 'react';

export default function Sidebar({ currentView, onViewChange, username, onLogout }) {
  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '2rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px var(--primary-glow)',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </div>
        <div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em', background: 'linear-gradient(to right, #ffffff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Q-Flow
          </span>
          <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '-2px' }}>
            Manager Console
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '1.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <button
          onClick={() => onViewChange('dashboard')}
          className="btn"
          style={{
            justifyContent: 'flex-start',
            backgroundColor: currentView === 'dashboard' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            border: 'none',
            color: currentView === 'dashboard' ? 'var(--primary)' : 'var(--text-secondary)',
            padding: '0.75rem 1rem',
            textAlign: 'left',
            width: '100%',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: '0.75rem', opacity: currentView === 'dashboard' ? 1 : 0.7 }}
          >
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
          Dashboard
        </button>

        <button
          onClick={() => onViewChange('queues')}
          className="btn"
          style={{
            justifyContent: 'flex-start',
            backgroundColor: currentView === 'queues' || currentView.startsWith('queue_detail_') ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            border: 'none',
            color: currentView === 'queues' || currentView.startsWith('queue_detail_') ? 'var(--primary)' : 'var(--text-secondary)',
            padding: '0.75rem 1rem',
            textAlign: 'left',
            width: '100%',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: '0.75rem', opacity: currentView === 'queues' || currentView.startsWith('queue_detail_') ? 1 : 0.7 }}
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Manage Queues
        </button>
      </nav>

      {/* User Session Info & Logout */}
      <div
        style={{
          padding: '1.25rem',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'rgba(15, 23, 42, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {username ? username[0].toUpperCase() : 'M'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {username}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
              Queue Manager
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="btn btn-secondary"
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '0.8rem',
            justifyContent: 'center',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: '0.25rem' }}
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log Out
        </button>
      </div>
    </aside>
  );
}
