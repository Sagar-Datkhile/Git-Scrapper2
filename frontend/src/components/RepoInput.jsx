import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';

const RepoInput = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    // Parse github URL
    // e.g. https://github.com/facebook/react
    let owner = '';
    let repo = '';
    
    try {
      const urlPattern = /github\.com\/([^/]+)\/([^/]+)/;
      const match = url.match(urlPattern);
      
      if (match) {
        owner = match[1];
        repo = match[2].replace('.git', '');
      } else {
        // Assume format is auto owner/repo
        const parts = url.split('/');
        if (parts.length === 2) {
          owner = parts[0];
          repo = parts[1];
        } else {
          throw new Error('Invalid URL format');
        }
      }
      
      setLoading(true);
      setError(null);
      
      // Navigate to dashboard which handles data fetching
      navigate(`/dashboard/${owner}/${repo}`);
      
    } catch (err) {
      setError('Please enter a valid GitHub repository URL or owner/repo format');
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1rem', color: 'var(--dark-blue)', fontSize: '1.5rem' }}>Analyze Repository</h2>
      <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
        Enter a GitHub repository URL to generate insights, visualize contribution data, and calculate developer performance scores.
      </p>
      
      <form onSubmit={handleAnalyze} style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
          <input
            type="text"
            className="input-glass"
            placeholder="e.g. facebook/react or https://github.com/facebook/react"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" disabled={loading || !url.trim()}>
            {loading ? <Loader2 className="animate-spin" /> : <Search />}
            Analyze
          </button>
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.9rem', textAlign: 'left' }}>{error}</p>}
      </form>
    </div>
  );
};

export default RepoInput;
