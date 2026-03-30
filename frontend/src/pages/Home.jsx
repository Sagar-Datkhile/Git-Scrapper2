import React from 'react';
import RepoInput from '../components/RepoInput';

const Home = () => {
  return (
    <div className="animate-fade-in-up" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="header">
        <h1>GitHub Analytics Dashboard</h1>
        <p>Visualize developer performance metrics effortlessly</p>
      </div>
      <RepoInput />
      
      <div className="grid md:grid-cols-3" style={{ marginTop: '4rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ background: 'var(--light-blue)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <span style={{ fontSize: '1.5rem' }}>📊</span>
          </div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--dark-blue)' }}>Commit Activity</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Track repository activity over time with interactive line charts.</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ background: 'var(--light-blue)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <span style={{ fontSize: '1.5rem' }}>🏆</span>
          </div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--dark-blue)' }}>Leaderboards</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>See top contributors ranked by our custom contribution score algorithm.</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ background: 'var(--light-blue)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
          </div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--dark-blue)' }}>Insights</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Analyze lines added, deleted, and overall impact per user easily.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
