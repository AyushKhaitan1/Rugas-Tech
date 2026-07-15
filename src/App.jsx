import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import AuthView from './views/AuthView.jsx';
import Dashboard from './views/Dashboard.jsx';
import QueuesView from './views/QueuesView.jsx';
import QueueDetail from './views/QueueDetail.jsx';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('qflow_token') || null);
  const [username, setUsername] = useState(localStorage.getItem('qflow_username') || '');
  const [currentView, setCurrentView] = useState('dashboard');
  const [verifying, setVerifying] = useState(false);

  // Validate session on mount
  useEffect(() => {
    const verifySession = async () => {
      if (!token) return;
      
      setVerifying(true);
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          // Token is expired or invalid
          handleLogout();
        }
      } catch (error) {
        console.error('Session verification failed:', error);
      } finally {
        setVerifying(false);
      }
    };

    verifySession();
  }, [token]);

  const handleLoginSuccess = (newToken, newUsername) => {
    localStorage.setItem('qflow_token', newToken);
    localStorage.setItem('qflow_username', newUsername);
    setToken(newToken);
    setUsername(newUsername);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('qflow_token');
    localStorage.removeItem('qflow_username');
    setToken(null);
    setUsername('');
    setCurrentView('dashboard');
  };

  // If not logged in, render the Auth view
  if (!token) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  // Session loader spinner
  if (verifying) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0b0f19', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Verifying session...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Router dispatcher
  const renderView = () => {
    if (currentView === 'dashboard') {
      return <Dashboard token={token} onViewChange={setCurrentView} />;
    }
    
    if (currentView === 'queues') {
      return <QueuesView token={token} onViewChange={setCurrentView} />;
    }
    
    if (currentView.startsWith('queue_detail_')) {
      const queueId = currentView.replace('queue_detail_', '');
      return <QueueDetail queueId={queueId} token={token} onViewChange={setCurrentView} />;
    }

    // Fallback
    return <Dashboard token={token} onViewChange={setCurrentView} />;
  };

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        username={username}
        onLogout={handleLogout}
      />
      
      {/* Main Content Pane */}
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}
