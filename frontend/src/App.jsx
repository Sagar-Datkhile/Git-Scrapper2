import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Github, Activity } from 'lucide-react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

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
        </div>
      </nav>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analyze" element={<Dashboard />} />
          <Route path="/dashboard/:owner/:repo" element={<Dashboard />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
