import React, { useState, useEffect } from 'react';

export default function QueueDetail({ queueId, token, onViewChange }) {
  const [queue, setQueue] = useState(null);
  const [tokens, setTokens] = useState({ waiting: [], serving: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add token form state
  const [personName, setPersonName] = useState('');
  const [notes, setNotes] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // History tabs state
  const [historyTab, setHistoryTab] = useState('all'); // 'all', 'completed', 'cancelled'

  // Live timer tick
  const [now, setNow] = useState(new Date());

  const fetchQueueDetail = async () => {
    try {
      const res = await fetch(`/api/queues/${queueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch queue details');
      const data = await res.json();
      setQueue({ id: data.id, name: data.name, createdAt: data.createdAt });
      setTokens(data.tokens || { waiting: [], serving: [], history: [] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueDetail();
    // Refresh queue data every 5 seconds
    const interval = setInterval(fetchQueueDetail, 5000);
    return () => clearInterval(interval);
  }, [queueId, token]);

  // Live timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddToken = async (e) => {
    e.preventDefault();
    if (!personName.trim()) return;

    setAddLoading(true);
    setAddError('');

    try {
      const res = await fetch(`/api/queues/${queueId}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ personName, notes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add token');

      setPersonName('');
      setNotes('');
      fetchQueueDetail(); // refresh
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleServeToken = async (tokenId) => {
    try {
      const res = await fetch(`/api/tokens/${tokenId}/serve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to serve token');
      }
      fetchQueueDetail();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCompleteToken = async (tokenId) => {
    try {
      const res = await fetch(`/api/tokens/${tokenId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to complete service');
      }
      fetchQueueDetail();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCancelToken = async (tokenId) => {
    try {
      const res = await fetch(`/api/tokens/${tokenId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel token');
      }
      fetchQueueDetail();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleMoveToken = async (tokenId, direction) => {
    try {
      const res = await fetch(`/api/tokens/${tokenId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ direction }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to move token');
      }
      fetchQueueDetail();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Helper to format duration in MM:SS or HH:MM:SS
  const formatDuration = (ms) => {
    if (ms < 0) ms = 0;
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const pad = (num) => String(num).padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const getWaitTime = (createdAt) => {
    const elapsed = now - new Date(createdAt);
    return formatDuration(elapsed);
  };

  const getServingTime = (servedAt) => {
    const elapsed = now - new Date(servedAt);
    return formatDuration(elapsed);
  };

  const getStaticDuration = (start, end) => {
    if (!start || !end) return '-';
    const elapsed = new Date(end) - new Date(start);
    return formatDuration(elapsed);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading queue details...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !queue) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', maxWidth: '500px', margin: '4rem auto', borderColor: 'rgba(239,68,68,0.2)' }}>
        <h3 style={{ color: '#fca5a5', marginBottom: '0.5rem' }}>Failed to Load Queue</h3>
        <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error || 'Queue details could not be found.'}</p>
        <button onClick={() => onViewChange('queues')} className="btn btn-primary">Back to Queues</button>
      </div>
    );
  }

  // Filter history based on selected tab
  const filteredHistory = tokens.history.filter((item) => {
    if (historyTab === 'completed') return item.status === 'completed';
    if (historyTab === 'cancelled') return item.status === 'cancelled';
    return true;
  });

  return (
    <div className="animate-fade-in">
      {/* Back navigation & Page title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => onViewChange('queues')}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', marginBottom: '1rem' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '0.25rem' }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Queues
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ marginBottom: '0.25rem' }}>{queue.name}</h1>
            <p style={{ fontSize: '0.85rem' }}>
              Console ID: <code>{queue.id}</code> • Created: {new Date(queue.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Console Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }} className="grid-2">
        
        {/* Left Side: Operations Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Active Serving Card */}
          <div className="card" style={{ borderColor: 'var(--success-glow)', borderLeft: '4px solid var(--success)', position: 'relative' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', animation: 'pulse-glow 2s infinite' }}></span>
              Now Serving
            </h3>

            {tokens.serving.length === 0 ? (
              <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>No customers currently in service</p>
                {tokens.waiting.length > 0 && (
                  <button
                    onClick={() => handleServeToken(tokens.waiting[0].id)}
                    className="btn btn-success"
                    style={{ marginTop: '0.75rem' }}
                  >
                    Serve Next Customer ({tokens.waiting[0].tokenNumber})
                  </button>
                )}
              </div>
            ) : (
              <div>
                {tokens.serving.map((t) => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {t.tokenNumber}
                        </span>
                        <span className="badge badge-success">IN SERVICE</span>
                      </div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 600, marginTop: '0.25rem' }}>
                        {t.personName}
                      </h4>
                      {t.notes && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                          Note: {t.notes}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Service Duration
                        </span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--success)' }}>
                          {getServingTime(t.servedAt)}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleCancelToken(t.id)}
                          className="btn btn-secondary"
                          style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleCompleteToken(t.id)}
                          className="btn btn-success"
                        >
                          Complete Service
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Waiting Queue List */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Waiting Line</h3>
                <p style={{ fontSize: '0.8rem' }}>Total in line: <strong>{tokens.waiting.length}</strong> customers</p>
              </div>

              {tokens.waiting.length > 0 && (
                <button
                  onClick={() => handleServeToken(tokens.waiting[0].id)}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  Serve Top Customer
                </button>
              )}
            </div>

            {tokens.waiting.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px', flexDirection: 'column', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                <p>Waiting queue is empty</p>
                <p style={{ fontSize: '0.75rem' }}>Add customers on the right panel to populate the line</p>
              </div>
            ) : (
              <div className="table-container" style={{ flex: 1 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Token</th>
                      <th>Customer Name</th>
                      <th>Waiting Time</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Move</th>
                      <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.waiting.map((t, idx) => (
                      <tr key={t.id} style={{ transition: 'all var(--transition-fast)' }}>
                        <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                          {t.tokenNumber}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{t.personName}</div>
                          {t.notes && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t.notes}
                            </span>
                          )}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>
                            {getWaitTime(t.createdAt)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
                            <button
                              onClick={() => handleMoveToken(t.id, 'up')}
                              disabled={idx === 0}
                              className="btn-icon"
                              title="Move Up"
                              style={{ width: '28px', height: '28px' }}
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => handleMoveToken(t.id, 'down')}
                              disabled={idx === tokens.waiting.length - 1}
                              className="btn-icon"
                              title="Move Down"
                              style={{ width: '28px', height: '28px' }}
                            >
                              ▼
                            </button>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                            <button
                              onClick={() => handleCancelToken(t.id)}
                              className="btn btn-secondary btn-danger"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px' }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleServeToken(t.id)}
                              className="btn btn-success"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px' }}
                            >
                              Serve
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Control Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Add Customer Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Add Customer to Line</h3>
            
            {addError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleAddToken}>
              <div className="form-group">
                <label className="form-label" htmlFor="personName">Customer Name</label>
                <input
                  type="text"
                  id="personName"
                  className="form-control"
                  placeholder="e.g., Alice Vance"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  disabled={addLoading}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="notes">Notes / Purpose (Optional)</label>
                <textarea
                  id="notes"
                  className="form-control"
                  placeholder="e.g., Account issues, Cash deposit"
                  rows="3"
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={addLoading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={addLoading}
              >
                {addLoading ? 'Adding...' : 'Generate Token & Add'}
              </button>
            </form>
          </div>

          {/* History / Resolved Panel */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Resolution Log</h3>
            
            {/* History Tabs */}
            <div className="tabs" style={{ marginBottom: '1rem' }}>
              <button
                onClick={() => setHistoryTab('all')}
                className={`tab-btn ${historyTab === 'all' ? 'active' : ''}`}
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
              >
                All
              </button>
              <button
                onClick={() => setHistoryTab('completed')}
                className={`tab-btn ${historyTab === 'completed' ? 'active' : ''}`}
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
              >
                Served
              </button>
              <button
                onClick={() => setHistoryTab('cancelled')}
                className={`tab-btn ${historyTab === 'cancelled' ? 'active' : ''}`}
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
              >
                Cancelled
              </button>
            </div>

            {filteredHistory.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No records found
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '350px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredHistory.map((h) => {
                  const isCompleted = h.status === 'completed';
                  return (
                    <div
                      key={h.id}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.4)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{h.tokenNumber}</span>
                        <span className={`badge ${isCompleted ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                          {isCompleted ? 'SERVED' : 'CANCELLED'}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600 }}>{h.personName}</div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.25rem' }}>
                        <span>Wait Time: <strong>{getStaticDuration(h.createdAt, h.servedAt || h.endedAt)}</strong></span>
                        {isCompleted && (
                          <span>Served: <strong>{getStaticDuration(h.servedAt, h.endedAt)}</strong></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 8px var(--success); }
        }
      `}</style>
    </div>
  );
}
