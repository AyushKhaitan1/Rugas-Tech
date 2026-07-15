import React, { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard.jsx';
import { AreaChart, BarChart, ProgressCircle } from '../components/SvgCharts.jsx';

export default function Dashboard({ token, onViewChange }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [queues, setQueues] = useState([]);

  const fetchData = async () => {
    try {
      // Fetch both analytics and queues list
      const [analyticsRes, queuesRes] = await Promise.all([
        fetch('/api/analytics', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/queues', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!analyticsRes.ok || !queuesRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const analyticsData = await analyticsRes.json();
      const queuesData = await queuesRes.json();

      setData(analyticsData);
      setQueues(queuesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh metrics every 15 seconds
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading analytics dashboard...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', maxWidth: '500px', margin: '4rem auto', borderColor: 'rgba(239,68,68,0.2)' }}>
        <h3 style={{ color: '#fca5a5', marginBottom: '0.5rem' }}>Failed to Load Dashboard</h3>
        <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={() => { setLoading(true); fetchData(); }} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  const { summary, queueTrends, hourlyDistribution } = data;

  // Format Avg Wait Time (seconds -> minutes and seconds)
  const formatWaitTime = (seconds) => {
    if (!seconds || seconds <= 0) return '0m 0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const totalTokensEnded = (summary.completedCount || 0) + (summary.cancelledCount || 0);
  const completionRate = totalTokensEnded > 0 
    ? Math.round(((summary.completedCount || 0) / totalTokensEnded) * 100) 
    : 0;

  return (
    <div className="animate-fade-in">
      {/* Page Title Header */}
      <div className="page-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Real-time insights and efficiency metrics across your active queues</p>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchData(); }} 
          className="btn btn-secondary"
          style={{ padding: '0.5rem 1rem' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '0.25rem' }}>
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <MetricCard
          title="Active Queues"
          value={summary.activeQueues}
          trendColor="var(--primary)"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        
        <MetricCard
          title="Waiting Customers"
          value={summary.waitingCount}
          trendColor="var(--warning)"
          trend={summary.waitingCount > 0 ? `${summary.waitingCount} active` : null}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
              <path d="M12 2a10 10 0 0 1 10 10h-10V2z" opacity="0.3" />
            </svg>
          }
        />

        <MetricCard
          title="Avg. Wait Time"
          value={formatWaitTime(summary.avgWaitTimeSeconds)}
          trendColor="var(--success)"
          trend="Created to Served"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        <MetricCard
          title="Busiest Hour"
          value={summary.busiestHour}
          trendColor="var(--info)"
          trend="Peak traffic time"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Weekly Trend Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Weekly Token Traffic</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Number of tokens added (<span style={{ color: 'var(--primary)', fontWeight: 600 }}>Indigo</span>) and served (<span style={{ color: 'var(--success)', fontWeight: 600 }}>Green</span>) over the last 7 days.
            </p>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <AreaChart data={queueTrends} />
          </div>
        </div>

        {/* Hourly Traffic Distribution */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Hourly Load Density</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Customer arrivals grouped by hour of the day (identifies peak load times).
            </p>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <BarChart data={hourlyDistribution} />
          </div>
        </div>
      </div>

      {/* Ratios & Active Queues Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem' }} className="grid-2">
        {/* Ratio Rates Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Queue Resolution Rates</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '1rem 0' }}>
            <ProgressCircle
              percentage={completionRate}
              size={110}
              strokeWidth={8}
              color="var(--success)"
              label="Completed"
            />
            <ProgressCircle
              percentage={summary.cancellationRate}
              size={110}
              strokeWidth={8}
              color="var(--danger)"
              label="Cancelled"
            />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            Total Resolved: <strong>{totalTokensEnded}</strong> tokens (Completed: {summary.completedCount} | Cancelled: {summary.cancelledCount})
          </div>
        </div>

        {/* Queues Status List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Active Queues Status</h3>
            <button onClick={() => onViewChange('queues')} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              Manage All
            </button>
          </div>

          {queues.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: '1rem' }}>No active queues found.</p>
              <button onClick={() => onViewChange('queues')} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                Create Your First Queue
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Queue Name</th>
                    <th>Waiting</th>
                    <th>Serving</th>
                    <th>Completed</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queues.map((q) => (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 600 }}>{q.name}</td>
                      <td>
                        <span className="badge badge-warning" style={{ minWidth: '24px', justifyContent: 'center' }}>
                          {q.waitingCount}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-success" style={{ minWidth: '24px', justifyContent: 'center' }}>
                          {q.servingCount}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{q.completedCount}</td>
                      <td>
                        <button
                          onClick={() => onViewChange(`queue_detail_${q.id}`)}
                          className="btn btn-secondary"
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                          }}
                        >
                          Open Console
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
