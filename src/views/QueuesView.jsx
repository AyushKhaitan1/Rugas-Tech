import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal.jsx';

export default function QueuesView({ token, onViewChange }) {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQueueName, setNewQueueName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchQueues = async () => {
    try {
      const res = await fetch('/api/queues', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch queues');
      const data = await res.json();
      setQueues(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, [token]);

  const handleCreateQueue = async (e) => {
    e.preventDefault();
    if (!newQueueName.trim()) return;

    setCreateLoading(true);
    setCreateError('');

    try {
      const res = await fetch('/api/queues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newQueueName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create queue');

      setNewQueueName('');
      setIsModalOpen(false);
      fetchQueues(); // refresh
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteQueue = async (queueId, queueName) => {
    if (!confirm(`Are you sure you want to delete the queue "${queueName}"? All tokens inside this queue will be deleted.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/queues/${queueId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete queue');
      
      fetchQueues(); // refresh
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading queues...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Queue Management</h1>
          <p>Create, monitor, and operate your service lines</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '0.25rem' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create New Queue
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Queues Grid */}
      {queues.length === 0 ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Queues Found</h2>
          <p style={{ fontSize: '0.95rem', marginBottom: '2rem' }}>
            Get started by creating a queue. You can then add customers, manage their order, and track wait times.
          </p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            Create Your First Queue
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {queues.map((q) => (
            <div key={q.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '220px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, wordBreak: 'break-word', paddingRight: '0.5rem' }}>
                  {q.name}
                </h3>
                <button
                  onClick={() => handleDeleteQueue(q.id, q.name)}
                  className="btn-icon"
                  title="Delete Queue"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Created: {new Date(q.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </div>

              {/* Counts row */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flex: 1 }}>
                <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)' }}>
                    {q.waitingCount}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Waiting
                  </span>
                </div>

                <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                    {q.servingCount}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Serving
                  </span>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => onViewChange(`queue_detail_${q.id}`)}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Open Queue Console
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '0.25rem' }}>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Queue Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Queue">
        {createError && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {createError}
          </div>
        )}
        <form onSubmit={handleCreateQueue}>
          <div className="form-group">
            <label className="form-label" htmlFor="queueName">Queue Name</label>
            <input
              type="text"
              id="queueName"
              className="form-control"
              placeholder="e.g., Billing Counter, Customer Support"
              value={newQueueName}
              onChange={(e) => setNewQueueName(e.target.value)}
              disabled={createLoading}
              required
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" disabled={createLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={createLoading}>
              {createLoading ? 'Creating...' : 'Create Queue'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
