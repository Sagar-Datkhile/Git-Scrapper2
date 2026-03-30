import React, { useState, useRef } from 'react';
import { ShieldCheck, ShieldX, Upload, Search, Loader2, FileText, ExternalLink, Link as LinkIcon } from 'lucide-react';

const VerifyReport = () => {
  const [reportId, setReportId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('id'); // 'id' or 'file'
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInput = useRef(null);

  const handleVerifyById = async (e) => {
    e.preventDefault();
    if (!reportId.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:5000/api/report/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: reportId.trim() })
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setResult({ verified: false, message: 'Network error. Ensure backend is running.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyByFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('http://localhost:5000/api/report/verify-file', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setResult({ verified: false, message: 'Network error. Ensure backend is running.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      handleVerifyByFile(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--dark-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={36} color="var(--primary-blue)" />
          Report Verification
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>
          Verify the authenticity of a contributor report using its Certificate ID or by uploading the PDF file.
        </p>
      </div>

      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '2rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
        <button
          onClick={() => { setMode('id'); setResult(null); }}
          style={{
            flex: 1,
            padding: '12px',
            background: mode === 'id' ? 'rgba(59, 130, 246, 0.15)' : 'var(--glass-bg)',
            border: 'none',
            color: mode === 'id' ? 'var(--primary-blue)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            transition: 'all 0.2s',
            borderRight: '1px solid var(--glass-border)'
          }}
        >
          <Search size={16} /> Verify by Certificate ID
        </button>
        <button
          onClick={() => { setMode('file'); setResult(null); }}
          style={{
            flex: 1,
            padding: '12px',
            background: mode === 'file' ? 'rgba(59, 130, 246, 0.15)' : 'var(--glass-bg)',
            border: 'none',
            color: mode === 'file' ? 'var(--primary-blue)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            transition: 'all 0.2s'
          }}
        >
          <Upload size={16} /> Verify by PDF Upload
        </button>
      </div>

      {/* Certificate ID Mode */}
      {mode === 'id' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <form onSubmit={handleVerifyById} style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              className="input-glass"
              placeholder="Enter Certificate ID (e.g. A3F9BC01)"
              value={reportId}
              onChange={(e) => setReportId(e.target.value.toUpperCase())}
              style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '2px', fontSize: '1.1rem', textAlign: 'center' }}
            />
            <button type="submit" className="btn-primary" disabled={loading || !reportId.trim()}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              Verify
            </button>
          </form>
        </div>
      )}

      {/* PDF Upload Mode */}
      {mode === 'file' && (
        <div
          className="glass-panel"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInput.current?.click()}
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            border: dragActive ? '2px dashed var(--primary-blue)' : '2px dashed var(--glass-border)',
            background: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'var(--glass-bg)',
            transition: 'all 0.3s'
          }}
        >
          <input
            ref={fileInput}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) handleVerifyByFile(file);
            }}
          />
          {loading ? (
            <div>
              <Loader2 size={48} className="animate-spin" color="var(--primary-blue)" style={{ margin: '0 auto' }} />
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Verifying {fileName}...</p>
            </div>
          ) : (
            <div>
              <Upload size={48} color="var(--text-muted)" style={{ margin: '0 auto' }} />
              <p style={{ color: 'var(--text-main)', marginTop: '1rem', fontWeight: 600 }}>
                Drag & drop your PDF here, or click to browse
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                We'll compute a SHA-256 hash and compare it against our records
              </p>
            </div>
          )}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div
          className="glass-panel animate-fade-in-up"
          style={{
            marginTop: '2rem',
            padding: '2rem',
            border: result.verified
              ? '1px solid rgba(16, 185, 129, 0.3)'
              : '1px solid rgba(239, 68, 68, 0.3)',
            background: result.verified
              ? 'rgba(16, 185, 129, 0.05)'
              : 'rgba(239, 68, 68, 0.05)'
          }}
        >
          {/* Status Icon */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            {result.verified ? (
              <div>
                <ShieldCheck size={64} color="#10b981" style={{ margin: '0 auto' }} />
                <h2 style={{ color: '#10b981', margin: '0.75rem 0 0.25rem 0', fontSize: '1.5rem' }}>
                  ✓ Verified & Authentic
                </h2>
              </div>
            ) : (
              <div>
                <ShieldX size={64} color="#ef4444" style={{ margin: '0 auto' }} />
                <h2 style={{ color: '#ef4444', margin: '0.75rem 0 0.25rem 0', fontSize: '1.5rem' }}>
                  ✗ Verification Failed
                </h2>
              </div>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{result.message}</p>
          </div>

          {/* Details */}
          {result.verified && result.details && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              padding: '1.25rem',
              border: '1px solid var(--glass-border)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Contributor</p>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>{result.details.contributor}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Repository</p>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>{result.details.repo}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Generated</p>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>{new Date(result.details.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Blockchain</p>
                  <p style={{ margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {result.details.blockchainTxn ? (
                      <span style={{ color: '#10b981' }}>
                        <LinkIcon size={14} /> On-Chain ✓
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Not Anchored</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Hashes */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Content Hash (SHA-256)</p>
                <p style={{ margin: '0 0 1rem 0', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--primary-blue)', wordBreak: 'break-all', background: 'rgba(59,130,246,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                  {result.details.contentHash}
                </p>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>File Hash (SHA-256)</p>
                <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.75rem', color: '#10b981', wordBreak: 'break-all', background: 'rgba(16,185,129,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                  {result.details.fileHash}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Footer */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Reports are cryptographically signed with SHA-256. Any modification to the PDF will invalidate the hash.
        </p>
      </div>
    </div>
  );
};

export default VerifyReport;
