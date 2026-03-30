import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import AnalyticsCards from '../components/AnalyticsCards';
import Leaderboard from '../components/Leaderboard';
import ChartsSection from '../components/ChartsSection';

const Dashboard = () => {
  const { owner, repo } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!owner || !repo) {
        setError("Repository owner and name are required.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Setup API endpoint (assuming backend on port 5000)
        const response = await axios.post('http://localhost:5000/api/analyze', { owner, repo });
        setData(response.data);
        
      } catch (err) {
        console.error("Error fetching repository data:", err);
        setError(err.response?.data?.message || err.message || "Failed to analyze repository. Check limits or ensure repository exists.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [owner, repo]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={64} color="var(--primary-blue)" style={{ marginBottom: '1rem' }} />
        <h2 style={{ color: 'var(--text-main)' }}>Analyzing {owner}/{repo}...</h2>
        <p style={{ color: 'var(--text-muted)' }}>This may take a few moments for large repositories.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel animate-fade-in-up" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '4rem auto' }}>
        <AlertCircle size={64} color="var(--danger)" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Analysis Failed</h2>
        <p style={{ color: 'var(--danger)', marginBottom: '2rem' }}>{error}</p>
        <Link to="/" className="btn-primary">
          <ArrowLeft size={18} />
          Back to Home
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel animate-fade-in-up" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '4rem auto' }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>No Repository Selected</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Please enter a repository on the home page.</p>
        <Link to="/" className="btn-primary">
          <ArrowLeft size={18} />
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/" className="btn-primary" style={{ padding: '8px 16px', background: 'var(--light-blue)', color: 'var(--primary-blue)' }}>
          <ArrowLeft size={18} />
          Back
        </Link>
        <div>
          <h1 style={{ color: 'var(--dark-blue)', margin: 0, fontSize: '2rem' }}>{owner} / {repo}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Analytics Overview</p>
        </div>
      </div>
      
      <AnalyticsCards summary={data.summary} />
      
      <div className="grid md:grid-cols-3" style={{ marginTop: '2rem', gap: '2rem' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <ChartsSection contributors={data.contributors} commitsByDate={data.commitsByDate} />
        </div>
        <div>
          <Leaderboard contributors={data.contributors} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
