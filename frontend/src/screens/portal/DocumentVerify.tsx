import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import { ShieldCheck, ShieldAlert, CheckCircle } from 'lucide-react';

interface VerificationResult {
  is_authentic: boolean;
  document_number: string;
  type: string;
  name: string;
  student_name: string;
  student_id: string;
  course: string;
  generated_at: string;
}

const DocumentVerify: React.FC = () => {
  const { token } = useParams<{ token?: string }>();
  
  const [inputToken, setInputToken] = useState(token || '');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      handleVerify(token);
    }
  }, [token]);

  const handleVerify = async (queryToken: string) => {
    if (!queryToken.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setResult(null);
    try {
      // Public endpoint
      const res = await api.get(`/verify-document/${queryToken}`);
      setResult(res.data.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message ?? 'Document verification failed. Invalid certificate token.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(inputToken);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top, #0f172a 0%, #020617 100%)', padding: '20px' }}>
      <div className="auth-card" style={{ maxWidth: '500px', width: '100%', border: '1px solid rgba(255,255,255,0.06)' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(99,102,241,0.1)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <ShieldCheck size={26} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ color: 'white', margin: 0, fontSize: '20px', fontWeight: 700 }}>Document Verification Desk</h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            Verify the authenticity of official Arabic College transcripts, degree certificates, and offer letters.
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="auth-form" style={{ marginBottom: '20px' }}>
          <div className="input-group">
            <label>Enter Reference Number or Token ID</label>
            <input 
              type="text" 
              placeholder="e.g. AC-DOC-2026-0001 or UUID token" 
              value={inputToken} 
              onChange={e => setInputToken(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '6px' }} disabled={loading}>
            {loading ? 'Performing Audit Verification...' : 'Verify Authenticity'}
          </button>
        </form>

        {/* Loading Spinner */}
        {loading && (
          <div className="spinner-center" style={{ minHeight: '100px' }}><div className="spinner" /></div>
        )}

        {/* Error State */}
        {errorMsg && (
          <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start', color: '#f87171', fontSize: '13px' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', color: 'white', marginBottom: '2px' }}>Verification Alert</strong>
              {errorMsg}
            </div>
          </div>
        )}

        {/* Success State */}
        {result && result.is_authentic && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Authenticity Certificate Banner */}
            <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start', color: '#34d399', fontSize: '13px' }}>
              <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--success)' }} />
              <div>
                <strong style={{ display: 'block', color: 'white', marginBottom: '2px' }}>Document Authentic</strong>
                This digital seal confirms that this document record matches the official archives of Arabic College Registrar Office.
              </div>
            </div>

            {/* Metadata breakdown */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Document Number</span>
                  <strong style={{ color: 'white' }}>{result.document_number}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Document Name</span>
                  <span style={{ color: 'white', fontWeight: 600 }}>{result.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Student Name</span>
                  <span style={{ color: 'white', fontWeight: 600 }}>{result.student_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Student Reg ID</span>
                  <span style={{ color: 'white', fontWeight: 600 }}>{result.student_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Program / Course</span>
                  <span style={{ color: 'white', fontWeight: 600 }}>{result.course}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Generated On</span>
                  <span style={{ color: 'white', fontWeight: 600 }}>{result.generated_at.slice(0, 16)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '14px' }}>
          <Link to="/" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' }}>
            ← Back to Public Portal Home
          </Link>
        </div>

      </div>
    </div>
  );
};

export default DocumentVerify;
