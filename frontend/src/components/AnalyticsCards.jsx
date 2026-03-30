import React from 'react';
import { Users, GitCommit, Code, Activity } from 'lucide-react';

const AnalyticsCards = ({ summary }) => {
  const cards = [
    {
      title: 'Total Contributors',
      value: summary.totalContributors || 0,
      icon: <Users size={24} color="var(--primary-blue)" />,
      bgColor: 'var(--light-blue)'
    },
    {
      title: 'Total Commits',
      value: summary.totalCommits || 0,
      icon: <GitCommit size={24} color="#10b981" />,
      bgColor: '#ecfdf5'
    },
    {
      title: 'Lines Added',
      value: summary.totalLinesAdded ? `+${summary.totalLinesAdded.toLocaleString()}` : '+0',
      icon: <Code size={24} color="#8b5cf6" />,
      bgColor: '#f5f3ff'
    },
    {
      title: 'Lines Deleted',
      value: summary.totalLinesDeleted ? `-${summary.totalLinesDeleted.toLocaleString()}` : '-0',
      icon: <Activity size={24} color="#ef4444" />,
      bgColor: '#fef2f2'
    }
  ];

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div key={index} className="glass-panel animate-fade-in-up" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', animationDelay: `${index * 0.1}s` }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: card.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {card.icon}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{card.title}</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{card.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsCards;
