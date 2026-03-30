import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import crypto from 'crypto';
import { generateReportHTML } from './reportTemplate.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

// Initialize Supabase only if keys are present
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to make Github API requests
const fetchGithubApi = async (url) => {
  const headers = { Accept: 'application/vnd.github.v3+json' };
  if (GITHUB_TOKEN) {
    headers.Authorization = `token ${GITHUB_TOKEN}`;
  }
  const response = await axios.get(url, { headers });
  return response.data;
};

// API Route: Analyze repository
app.post('/api/analyze', async (req, res) => {
  const { owner, repo } = req.body;
  if (!owner || !repo) {
    return res.status(400).json({ message: 'Owner and repo are required' });
  }

  const repoId = `${owner}/${repo}`;

  try {
    console.log(`Analyzing ${repoId}...`);

    // 1. Check if cached in Supabase
    if (supabase) {
      const { data: cached, error } = await supabase
        .from('repositories')
        .select('*')
        .eq('id', repoId)
        .single();
      
      if (cached && cached.data) {
        console.log(`Returning cached data for ${repoId}`);
        // Optionally, check if it's too old and update async
        return res.json(cached.data);
      }
    }

    // 2. Fetch repository stats (Contributors)
    // Retry logic for 202 Accepted which Github uses while building stats
    let contributorsData = [];
    let statsUrl = `https://api.github.com/repos/${owner}/${repo}/stats/contributors`;
    const headers = { Accept: 'application/vnd.github.v3+json' };
    if (GITHUB_TOKEN) headers.Authorization = `token ${GITHUB_TOKEN}`;
    
    let statsRetries = 0;
    while (statsRetries < 3) {
      const statsRes = await axios.get(statsUrl, { headers });
      if (statsRes.status === 200) {
        contributorsData = statsRes.data;
        break;
      } else if (statsRes.status === 202) {
        // Github is caching data, wait and retry
        // 202 Accepted
        await new Promise(r => setTimeout(r, 2000));
        statsRetries++;
      }
    }
    
    if (!Array.isArray(contributorsData)) {
        console.log("Stats API returned empty or wasn't ready");
        contributorsData = [];
    }

    // Process contributors
    const contributors = contributorsData.map(contributor => {
      // stats/contributors returns an array of { total, weeks, author }
      // weeks is an array of { w (week start), a (additions), d (deletions), c (commits) }
      let linesAdded = 0;
      let linesDeleted = 0;
      
      contributor.weeks.forEach(week => {
        linesAdded += week.a;
        linesDeleted += week.d;
      });

      const commits = contributor.total;
      
      // Analytics Engine Formula: Score = (commits * 2) + (lines_added * 0.5)
      const score = (commits * 2) + (linesAdded * 0.5);

      return {
        login: contributor.author?.login || 'Unknown',
        avatar_url: contributor.author?.avatar_url || '',
        commits,
        linesAdded,
        linesDeleted,
        score
      };
    });

    // Sort by score
    contributors.sort((a, b) => b.score - a.score);

    // 3. Overall summary
    const totalContributors = contributors.length;
    let totalCommits = 0;
    let totalLinesAdded = 0;
    let totalLinesDeleted = 0;

    contributors.forEach(c => {
      totalCommits += c.commits;
      totalLinesAdded += c.linesAdded;
      totalLinesDeleted += c.linesDeleted;
    });

    // 4. Fetch commit activity over time
    const activityUrl = `https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`;
    let commitsByDate = [];
    try {
      let activityRetries = 0;
      while (activityRetries < 3) {
        const activityRes = await axios.get(activityUrl, { headers });
        if (activityRes.status === 200 && Array.isArray(activityRes.data)) {
          // weeks is array of { days [sunday...saturday], total, week (timestamp) }
          activityRes.data.forEach(week => {
            if (week.total > 0) { // Only add if there were commits
              const date = new Date(week.week * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              commitsByDate.push({ date, commits: week.total });
            }
          });
          break; // Done
        } else if (activityRes.status === 202) {
          // Github caching
          await new Promise(r => setTimeout(r, 2000));
          activityRetries++;
        } else {
          break; // Other status
        }
      }
    } catch(err) {
      console.error("Failed to fetch commit activity");
    }

    // Final Payload
    const responsePayload = {
      summary: {
        totalContributors,
        totalCommits,
        totalLinesAdded,
        totalLinesDeleted
      },
      contributors,
      commitsByDate
    };

    // Cache in Supabase if configured
    if (supabase) {
      try {
        await supabase
          .from('repositories')
          .upsert({ id: repoId, data: responsePayload, updated_at: new Date() });
      } catch(e) {
         console.log("Failed to cache to Supabase");
      }
    }

    res.json(responsePayload);
    
  } catch (error) {
    console.error('API Error:', error.response?.data?.message || error.message);
    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'Repository not found. Please verify the owner and repository name.' });
    }
    if (error.response?.status === 403 && error.response.headers['x-ratelimit-remaining'] === '0') {
      return res.status(429).json({ message: 'GitHub API rate limit exceeded. Please configure a personal access token.' });
    }
    res.status(500).json({ message: 'Failed to analyze repository. ' + (error.message || '') });
  }
});

// API Route: Generate PDF Report (Stateless POST)
app.post('/api/report/generate', async (req, res) => {
  const { owner, repo, contributor, totalCommits, totalContributors, rank } = req.body;

  if (!owner || !repo || !contributor) {
    return res.status(400).json({ message: 'Missing report data.' });
  }

  try {
    const repoId = `${owner}/${repo}`;
    const generatedAt = new Date().toISOString();
    
    // Using randomBytes for deep Node.js backwards compatibility
    const certId = crypto.randomBytes(4).toString('hex').toUpperCase();
    const certHashInput = `${contributor.login}-${repoId}-${contributor.score}-${generatedAt}`;
    const certHash = crypto.createHash('sha256').update(certHashInput).digest('hex').substring(0, 16);

    // Mock the specific slice of repoData needed by the report template to bypass Supabase caches entirely
    const repoDataMock = {
      owner, 
      repo,
      summary: { totalCommits, totalContributors }
    };

    const htmlContent = generateReportHTML(contributor, repoDataMock, rank, certId, certHash, generatedAt);

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfUint8 = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // Convert Uint8Array to Node Buffer so Express sends raw binary, not JSON
    const pdfBuffer = Buffer.from(pdfUint8);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contributor_report_${contributor.login}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.end(pdfBuffer);
  } catch (err) {
    console.error('PDF Generation Error:', err);
    res.status(500).json({ message: 'Failed to generate PDF.' });
  }
});

app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
