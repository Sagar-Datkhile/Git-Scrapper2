import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Chart as ChartJS, ArcElement, Tooltip as ChartJsTooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, ChartJsTooltip, Legend);

const ChartsSection = ({ contributors, commitsByDate }) => {
  if (!contributors || !commitsByDate) return null;

  // Prepare Pie Chart Data (Contribution Percentage based on commits)
  const topContributors = [...contributors].sort((a, b) => b.commits - a.commits).slice(0, 5);
  const otherCommits = contributors.slice(5).reduce((acc, c) => acc + c.commits, 0);
  
  const pieData = {
    labels: [...topContributors.map(c => c.login), ...(otherCommits > 0 ? ['Others'] : [])],
    datasets: [
      {
        data: [...topContributors.map(c => c.commits), ...(otherCommits > 0 ? [otherCommits] : [])],
        backgroundColor: [
          '#2563eb', // primary blue
          '#3b82f6', // secondary blue
          '#60a5fa',
          '#93c5fd',
          '#bfdbfe',
          '#e5e7eb', // gray for others
        ],
        borderWidth: 1,
        borderColor: '#ffffff',
      },
    ],
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: { family: "'Inter', sans-serif" }
        }
      }
    },
    maintainAspectRatio: false,
  };

  // Prepare Bar Chart Data (Commits per User)
  const barData = topContributors.map(c => ({
    name: c.login,
    commits: c.commits
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-panel animate-fade-in-up" style={{ padding: '2rem', animationDelay: '0.2s' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--dark-blue)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Commit Activity Over Time
        </h3>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={commitsByDate} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary-blue)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--primary-blue)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', boxShadow: 'var(--glass-shadow)' }}
              />
              <Area type="monotone" dataKey="commits" stroke="var(--primary-blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorCommits)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-panel animate-fade-in-up" style={{ padding: '2rem', animationDelay: '0.3s' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--dark-blue)' }}>Commits by User</h3>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--glass-border)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  cursor={{fill: 'rgba(37, 99, 235, 0.05)'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', boxShadow: 'var(--glass-shadow)' }}
                />
                <Bar dataKey="commits" fill="var(--primary-blue)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel animate-fade-in-up" style={{ padding: '2rem', animationDelay: '0.4s' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--dark-blue)' }}>Contribution Percentage</h3>
          <div style={{ height: '250px', width: '100%', position: 'relative' }}>
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
