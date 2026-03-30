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
      <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div className="skeleton" style={{ width: '80px', height: '40px', borderRadius: '8px' }}></div>
          <div>
            <div className="skeleton" style={{ width: '250px', height: '32px', marginBottom: '8px' }}></div>
            <div className="skeleton" style={{ width: '150px', height: '16px' }}></div>
          </div>
        </div>
        
        {/* Analytics Cards Skeleton */}
        <div className="grid md:grid-cols-4 gap-4" style={{ marginBottom: '2rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="skeleton" style={{ minWidth: '48px', height: '48px', borderRadius: '12px' }}></div>
              <div style={{ flex: 1, width: '100%' }}>
                <div className="skeleton" style={{ width: '60%', height: '14px', marginBottom: '12px' }}></div>
                <div className="skeleton" style={{ width: '40%', height: '24px' }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts & Leaderboard Skeleton */}
        <div className="grid md:grid-cols-3 gap-4" style={{ gap: '2rem' }}>
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Area Chart Skeleton */}
            <div className="glass-panel" style={{ padding: '2rem', height: 'auto', minHeight: '350px' }}>
              <div className="skeleton" style={{ width: '200px', height: '24px', marginBottom: '2rem' }}></div>
              <div className="skeleton" style={{ width: '100%', height: '250px', borderRadius: '8px' }}></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-panel" style={{ padding: '2rem', height: '300px' }}>
                <div className="skeleton" style={{ width: '150px', height: '24px', marginBottom: '2rem' }}></div>
                <div className="skeleton" style={{ width: '100%', height: '200px' }}></div>
              </div>
              <div className="glass-panel" style={{ padding: '2rem', height: '300px' }}>
                <div className="skeleton" style={{ width: '180px', height: '24px', marginBottom: '2rem' }}></div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div className="skeleton" style={{ width: '200px', height: '200px', borderRadius: '50%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Leaderboard Skeleton */}
          <div className="glass-panel" style={{ padding: '2rem', height: '100%' }}>
            <div className="skeleton" style={{ width: '180px', height: '24px', marginBottom: '2rem' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <div className="skeleton" style={{ minWidth: '24px', height: '24px', borderRadius: '50%' }}></div>
                  <div className="skeleton" style={{ minWidth: '40px', height: '40px', borderRadius: '50%' }}></div>
                  <div style={{ flex: 1, width: '100%' }}>
                    <div className="skeleton" style={{ width: '70%', height: '16px', marginBottom: '8px' }}></div>
                    <div className="skeleton" style={{ width: '40%', height: '12px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Animated Loading Text Overlay */}
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', padding: '1rem 1.5rem', borderRadius: '30px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--glass-shadow)', zIndex: 100, animation: 'fadeInUp 0.5s ease-out forwards' }}>
           <Loader2 className="animate-spin" size={24} color="var(--primary-blue)" />
           <div>
             <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 'bold' }}>Analyzing {owner}/{repo}...</h3>
             <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Crunching repository data</p>
           </div>
        </div>
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
          <Leaderboard contributors={data.contributors} owner={owner} repo={repo} summary={data.summary} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
