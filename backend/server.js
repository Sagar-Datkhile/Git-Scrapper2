import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import crypto from 'crypto';
import multer from 'multer';
import { generateReportHTML } from './reportTemplate.js';
import { anchorHash } from './blockchain.js';

// Multer config for PDF upload verification
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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

    // === VERIFICATION HASHING ===
    // 1. Content hash: deterministic JSON of the report data
    const contentPayload = JSON.stringify({
      login: contributor.login,
      repo: repoId,
      commits: contributor.commits,
      linesAdded: contributor.linesAdded,
      linesDeleted: contributor.linesDeleted,
      score: contributor.score,
      rank,
      generatedAt
    });
    const contentHash = crypto.createHash('sha256').update(contentPayload).digest('hex');

    // 2. File hash: SHA-256 of the raw PDF bytes
    const fileHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    // 3. Optional blockchain anchoring
    const blockchainTxn = await anchorHash(contentHash);

    // 4. Store in Supabase
    if (supabase) {
      supabase
        .from('report_verification')
        .insert({
          report_id: certId,
          contributor_login: contributor.login,
          repo: repoId,
          content_hash: contentHash,
          file_hash: fileHash,
          blockchain_txn: blockchainTxn
        })
        .then(({ error }) => {
          if (error) console.error('Failed to store verification record:', error.message);
          else console.log(`Verification record stored for ${certId}`);
        });
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contributor_report_${contributor.login}_${certId}.pdf"`,
      'Content-Length': pdfBuffer.length,
      'X-Report-Id': certId,
      'Access-Control-Expose-Headers': 'X-Report-Id'
    });

    res.end(pdfBuffer);
  } catch (err) {
    console.error('PDF Generation Error:', err);
    res.status(500).json({ message: 'Failed to generate PDF.' });
  }
});

// API Route: Verify report by Certificate ID
app.post('/api/report/verify', async (req, res) => {
  const { reportId } = req.body;
  if (!reportId) {
    return res.status(400).json({ message: 'Report ID is required.' });
  }

  try {
    if (!supabase) {
      return res.status(500).json({ message: 'Verification service unavailable.' });
    }

    const { data, error } = await supabase
      .from('report_verification')
      .select('*')
      .eq('report_id', reportId.trim().toUpperCase())
      .single();

    if (error || !data) {
      return res.json({
        verified: false,
        message: 'No report found with this Certificate ID. The report may be tampered or invalid.'
      });
    }

    return res.json({
      verified: true,
      message: 'Report is authentic and verified.',
      details: {
        contributor: data.contributor_login,
        repo: data.repo,
        contentHash: data.content_hash,
        fileHash: data.file_hash,
        blockchainTxn: data.blockchain_txn,
        createdAt: data.created_at
      }
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ message: 'Verification failed.' });
  }
});

// API Route: Verify report by PDF file upload
app.post('/api/report/verify-file', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'PDF file is required.' });
  }

  try {
    if (!supabase) {
      return res.status(500).json({ message: 'Verification service unavailable.' });
    }

    const uploadedHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    const { data, error } = await supabase
      .from('report_verification')
      .select('*')
      .eq('file_hash', uploadedHash)
      .single();

    if (error || !data) {
      return res.json({
        verified: false,
        message: 'This PDF does not match any verified report. It may have been modified.',
        uploadedHash
      });
    }

    return res.json({
      verified: true,
      message: 'PDF is authentic and matches the original report.',
      details: {
        reportId: data.report_id,
        contributor: data.contributor_login,
        repo: data.repo,
        contentHash: data.content_hash,
        fileHash: data.file_hash,
        blockchainTxn: data.blockchain_txn,
        createdAt: data.created_at
      }
    });
  } catch (err) {
    console.error('File verification error:', err);
    res.status(500).json({ message: 'Verification failed.' });
  }
});

app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
