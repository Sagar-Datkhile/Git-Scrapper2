import React, { useState } from 'react';
import { Trophy, Star, Award, Download, Loader2 } from 'lucide-react';

const Leaderboard = ({ contributors, owner, repo, summary }) => {
  const [downloadingFor, setDownloadingFor] = useState(null);

  const handleDownloadReport = async (contributorObj, rank) => {
    try {
      setDownloadingFor(contributorObj.login);
      const url = `http://localhost:5000/api/report/generate`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          owner,
          repo,
          contributor: contributorObj,
          totalCommits: summary.totalCommits,
          totalContributors: summary.totalContributors,
          rank
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      const rawBlob = await response.blob();
      const blob = new Blob([rawBlob], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `contributor_report_${contributorObj.login}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Failed to generate report. Please try again.');
    } finally {
      setDownloadingFor(null);
    }
  };
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
      case 1: return <Star size={20} color="#e5e7eb" />;
      case 2: return <Award size={20} color="#d97706" />;
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
          <div key={contributor.login} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            {getRankIcon(index)}
            <img src={contributor.avatar_url || `https://ui-avatars.com/api/?name=${contributor.login}&background=random`} alt={contributor.login} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem' }}>{contributor.login}</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {contributor.commits} commits • +{contributor.linesAdded} lines
              </p>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-blue)' }}>{Math.round(contributor.score).toLocaleString()}</span>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Score</p>
              </div>
              
              <button 
                onClick={() => handleDownloadReport(contributor, index + 1)}
                disabled={downloadingFor === contributor.login}
                title="Download PDF Verification Report"
                style={{ 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  border: '1px solid rgba(59, 130, 246, 0.3)', 
                  color: 'var(--primary-blue)',
                  marginTop: '8px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: downloadingFor === contributor.login ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  ...(downloadingFor === contributor.login ? { opacity: 0.7 } : {})
                }}
              >
                {downloadingFor === contributor.login ? <Loader2 size={12} className="animate-spin"/> : <Download size={12} />}
                Report
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
