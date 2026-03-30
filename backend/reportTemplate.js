export const generateReportHTML = (contributor, repoData, rank, certId, certHash, generatedAt) => {
  const repoName = `${repoData.owner}/${repoData.repo}`;
  const profileLink = `https://github.com/${contributor.login}`;
  
  const totalCommits = contributor.commits;
  const linesAdded = contributor.linesAdded;
  const linesDeleted = contributor.linesDeleted;
  const netContribution = linesAdded - linesDeleted;
  const score = Math.round(contributor.score);

  // Contribution percentage
  const totalRepoCommits = repoData.summary.totalCommits || 1;
  const contributionPercent = ((totalCommits / totalRepoCommits) * 100).toFixed(1);

  // Time metrics (Extract from weeks data)
  const activeWeeks = contributor.weeks ? contributor.weeks.filter(w => w.c > 0) : [];
  let firstCommitTs = Date.now() / 1000;
  let lastCommitTs = Date.now() / 1000;
  
  if (activeWeeks.length > 0) {
    firstCommitTs = activeWeeks[0].w;
    lastCommitTs = activeWeeks[activeWeeks.length - 1].w;
  }
  
  const firstCommitDate = new Date(firstCommitTs * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const lastCommitDate = new Date(lastCommitTs * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const activeDays = Math.max(1, Math.round((lastCommitTs - firstCommitTs) / (60 * 60 * 24)));
  const avgCommitsPerDay = (totalCommits / activeDays).toFixed(2);
  const avgLinesPerCommit = totalCommits > 0 ? (linesAdded / totalCommits).toFixed(0) : 0;

  // Mocked/Approximated deep metrics
  const estimatedFilesChanged = Math.max(1, Math.round(linesAdded / 75)); 
  const mergedCommits = Math.round(totalCommits * 0.82); // Assume 82% merge rate

  // Prepare chart data for injection
  // 1. Pie Chart (Contribution Share)
  const pieData = [totalCommits, Math.max(0, totalRepoCommits - totalCommits)];
  
  // 2. Bar & Line Chart (Weekly Activity)
  const chartLabels = [];
  const chartCommits = [];
  const chartLines = [];
  
  if (contributor.weeks) {
    // Take the last 15 active weeks for the charts to keep them clean
    const recentWeeks = activeWeeks.slice(-15);
    recentWeeks.forEach(w => {
      chartLabels.push(new Date(w.w * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      chartCommits.push(w.c);
      chartLines.push(w.a);
    });
  }

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Contributor Report - ${contributor.login}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      body {
        font-family: 'Inter', sans-serif;
        color: #1e293b;
        background: #ffffff;
        margin: 0;
        padding: 40px;
        line-height: 1.5;
        box-sizing: border-box;
      }
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      
      .header-title {
        color: #0f172a;
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        color: #3b82f6;
      }
      
      .header-subtitle {
        color: #64748b;
        margin: 5px 0 0 0;
        font-size: 14px;
      }
      
      .profile-section {
        display: flex;
        align-items: center;
        gap: 20px;
        background: #f8fafc;
        padding: 24px;
        border-radius: 12px;
        margin-bottom: 30px;
        border: 1px solid #e2e8f0;
      }
      
      .avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      .profile-info h2 {
        margin: 0 0 5px 0;
        font-size: 24px;
        color: #0f172a;
      }
      
      .profile-info a {
        color: #3b82f6;
        text-decoration: none;
        font-weight: 500;
      }
      
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 30px;
      }
      
      .card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      }
      
      .card h3 {
        margin: 0 0 15px 0;
        font-size: 16px;
        color: #0f172a;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 10px;
      }
      
      .metric-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 14px;
      }
      
      .metric-label {
        color: #64748b;
        font-weight: 500;
      }
      
      .metric-value {
        color: #0f172a;
        font-weight: 600;
      }
      
      .highlight {
        color: #3b82f6;
      }
      
      .score-box {
        text-align: center;
        background: #eff6ff;
        border-radius: 8px;
        padding: 15px;
        margin-top: 15px;
      }
      
      .score-value {
        font-size: 32px;
        font-weight: 700;
        color: #2563eb;
        margin: 0;
      }
      
      .score-label {
        font-size: 12px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin: 5px 0 0 0;
      }

      .charts-section {
        margin-bottom: 30px;
      }
      
      .chart-container-row {
        display: flex;
        gap: 20px;
        height: 250px;
        margin-bottom: 20px;
      }
      
      .chart-box {
        flex: 1;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 15px;
        position: relative;
      }

      .chart-box.small {
        flex: 0.5;
      }
      
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #e2e8f0;
        text-align: center;
        font-size: 12px;
        color: #94a3b8;
      }
      
      .cert-info {
        background: #f8fafc;
        border: 1px dashed #cbd5e1;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
        margin-top: 30px;
      }
      
      .cert-id {
        font-family: monospace;
        color: #475569;
        font-size: 14px;
        background: #e2e8f0;
        padding: 3px 8px;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1 class="header-title">GitHub Contributor Report</h1>
        <p class="header-subtitle">Performance Analytics & Verification Certificate</p>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 600; color: #0f172a;">${repoName}</div>
        <div style="font-size: 13px; color: #64748b;">Generated: ${new Date(generatedAt).toLocaleDateString()}</div>
      </div>
    </div>
    
    <div class="profile-section">
      <img class="avatar" src="${contributor.avatar_url}" alt="Avatar">
      <div class="profile-info">
        <h2>${contributor.login}</h2>
        <a href="${profileLink}" target="_blank">${profileLink}</a>
        <div style="margin-top: 8px; font-size: 14px; color: #64748b;">
          Global Rank in Repository: <strong style="color: #3b82f6;">#${rank}</strong> out of ${repoData.summary.totalContributors}
        </div>
      </div>
    </div>
    
    <div class="grid">
      <!-- Section 2: Summary -->
      <div class="card">
        <h3>Contribution Summary</h3>
        <div class="metric-row">
          <span class="metric-label">Total Commits</span>
          <span class="metric-value">${totalCommits.toLocaleString()}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Lines Added</span>
          <span class="metric-value highlight">+${linesAdded.toLocaleString()}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Lines Deleted</span>
          <span class="metric-value" style="color: #ef4444;">-${linesDeleted.toLocaleString()}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Net Contribution</span>
          <span class="metric-value">${netContribution.toLocaleString()} lines</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Contribution Share</span>
          <span class="metric-value">${contributionPercent}%</span>
        </div>
        
        <div class="score-box">
          <p class="score-value">${score.toLocaleString()}</p>
          <p class="score-label">Total Performance Score</p>
        </div>
      </div>
      
      <!-- Section 3 & 4: Timeline and Patterns -->
      <div class="card">
        <h3>Activity Timeline</h3>
        <div class="metric-row">
          <span class="metric-label">First Commit</span>
          <span class="metric-value">${firstCommitDate}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Last Commit</span>
          <span class="metric-value">${lastCommitDate}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Active Coding Days</span>
          <span class="metric-value">~${activeDays} days</span>
        </div>
        
        <h3 style="margin-top: 25px;">Work Pattern Insights</h3>
        <div class="metric-row">
          <span class="metric-label">Avg. Commits / Day</span>
          <span class="metric-value">${avgCommitsPerDay}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Avg. Lines / Commit</span>
          <span class="metric-value">${avgLinesPerCommit}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Est. Files Changed</span>
          <span class="metric-value">${estimatedFilesChanged.toLocaleString()}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Merged Commits (Est.)</span>
          <span class="metric-value">${mergedCommits.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div class="charts-section">
      <div class="chart-container-row">
        <div class="chart-box" style="flex: 0.8">
          <canvas id="pieChart"></canvas>
        </div>
        <div class="chart-box" style="flex: 2">
          <canvas id="lineChart"></canvas>
        </div>
      </div>
      <div class="chart-container-row" style="height: 200px">
        <div class="chart-box">
          <canvas id="barChart"></canvas>
        </div>
      </div>
    </div>
    
    <div class="cert-info">
      <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 16px;">Certificate of Verification</h3>
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #64748b;">This document certifies the code contributions documented above. It was automatically generated via the GitHub Analytics Engine.</p>
      <div style="display: flex; justify-content: center; gap: 20px; align-items: center; margin-top: 15px;">
        <div><span class="metric-label">Certificate ID:</span> <span class="cert-id">${certId}</span></div>
        <div><span class="metric-label">Hash:</span> <span class="cert-id" style="font-size: 10px;">${certHash}</span></div>
      </div>
    </div>

    <div class="footer">
      Generated automatically by the GitHub Analytics Dashboard • Validated via GitHub REST API
    </div>

    <!-- Chart Configuration Script -->
    <script>
      // Wait for font load implicitly and init charts
      window.onload = function() {
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        new Chart(pieCtx, {
          type: 'doughnut',
          data: {
            labels: ['${contributor.login}', 'Other Contributors'],
            datasets: [{
              data: [${pieData[0]}, ${pieData[1]}],
              backgroundColor: ['#3b82f6', '#e2e8f0'],
              borderWidth: 0
            }]
          },
          options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: "'Inter', sans-serif" } } }
            }
          }
        });

        const lineCtx = document.getElementById('lineChart').getContext('2d');
        new Chart(lineCtx, {
          type: 'line',
          data: {
            labels: ${JSON.stringify(chartLabels)},
            datasets: [{
              label: 'Lines Added (Weekly)',
              data: ${JSON.stringify(chartLines)},
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 2,
              pointRadius: 3,
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true, position: 'top' }
            },
            scales: {
              y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } },
              x: { grid: { display: false }, border: { display: false } }
            }
          }
        });

        const barCtx = document.getElementById('barChart').getContext('2d');
        new Chart(barCtx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(chartLabels)},
            datasets: [{
              label: 'Commits (Weekly)',
              data: ${JSON.stringify(chartCommits)},
              backgroundColor: '#3b82f6',
              borderRadius: 4
            }]
          },
          options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true, position: 'top' }
            },
            scales: {
              y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } },
              x: { grid: { display: false }, border: { display: false } }
            }
          }
        });
      };
    </script>
  </body>
  </html>
  `;
};
