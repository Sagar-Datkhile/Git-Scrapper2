import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Github, Activity, ShieldCheck } from 'lucide-react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import VerifyReport from './pages/VerifyReport';

function App() {
  return (
    <Router>
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <Github color="var(--primary-blue)" />
          GitHub Analytics
        </Link>
        <div className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/analyze">Dashboard</Link>
          <Link to="/verify" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} />
            Verify
          </Link>
        </div>
      </nav>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analyze" element={<Dashboard />} />
          <Route path="/dashboard/:owner/:repo" element={<Dashboard />} />
          <Route path="/verify" element={<VerifyReport />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
