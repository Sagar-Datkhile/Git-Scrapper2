import React from 'react';
import { Trophy, Star, Award } from 'lucide-react';

const Leaderboard = ({ contributors }) => {
  if (!contributors || contributors.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--dark-blue)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>Overall Leaderboard</h3>
        <p style={{ color: 'var(--text-muted)' }}>No contributor data available.</p>
      </div>
    );
  }

  // Sort by score
  const sortedContributors = [...contributors].sort((a, b) => b.score - a.score);
  
  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Trophy size={20} color="#fbbf24" />;
      case 1: return <Star size={20} color="#9ca3af" />;
      case 2: return <Award size={20} color="#b45309" />;
      default: return <span style={{ width: '20px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 'bold' }}>{index + 1}</span>;
    }
  };

  return (
    <div className="glass-panel animate-fade-in-up" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 1rem 0', color: 'var(--dark-blue)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Trophy size={20} />
        Overall Leaderboard
      </h3>
      
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sortedContributors.slice(0, 10).map((contributor, index) => (
          <div key={contributor.login} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            {getRankIcon(index)}
            <img src={contributor.avatar_url || `https://ui-avatars.com/api/?name=${contributor.login}&background=random`} alt={contributor.login} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem' }}>{contributor.login}</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {contributor.commits} commits • +{contributor.linesAdded} lines
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-blue)' }}>{Math.round(contributor.score).toLocaleString()}</span>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Score</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
