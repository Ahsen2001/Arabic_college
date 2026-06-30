import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Download, Upload, 
  Check, X, Shield, Info, MessageSquare 
} from 'lucide-react';

interface Version {
  id: number;
  version_number: number;
  original_filename: string;
  notes?: string;
  created_at: string;
}

interface PaperDetail {
  id: number;
  title: string;
  abstract?: string;
  category: string;
  keywords?: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  remarks?: string;
  created_at: string;
  user_id: number;
  user?: { name: string; email: string };
  supervisor?: { id: number; name: string };
  versions: Version[];
  latest_version?: Version;
}

const ResearchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [paper, setPaper] = useState<PaperDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number>(0);

  // Review status
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ status: 'Under Review', remarks: '' });
  const [reviewing, setReviewing] = useState(false);

  // New version upload
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionNotes, setVersionNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // PDF Preview Blob state
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchPaperDetails();
  }, [id]);

  const fetchPaperDetails = async () => {
    setLoading(true);
    try {
      const profileRes = await api.get('/profile');
      setUserRoles(profileRes.data.data.roles.map((r: any) => r.name));
      setCurrentUserId(profileRes.data.data.id);

      const res = await api.get(`/research/papers/${id}`);
      setPaper(res.data.data);
      
      // Auto-preview latest version if available
      const latestVerId = res.data.data.latest_version?.id ?? res.data.data.versions[0]?.id;
      if (latestVerId) {
        handleLoadPreview(latestVerId);
      }
    } catch {
      toast.error('Failed to load research paper details.');
      navigate('/admin/research');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPreview = async (versionId: number) => {
    setPreviewLoading(true);
    try {
      const res = await api.get(`/research/versions/${versionId}/preview`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
    } catch {
      toast.error('Failed to load secure document preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (versionId: number, filename: string) => {
    const toastId = toast.loading('Downloading secure file...');
    try {
      const res = await api.get(`/research/versions/${versionId}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download complete!', { id: toastId });
    } catch {
      toast.error('Secure download failed.', { id: toastId });
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewing(true);
    const toastId = toast.loading('Processing workflow state change...');
    try {
      await api.post(`/research/papers/${id}/workflow`, reviewForm);
      toast.success(`Workflow status updated to '${reviewForm.status}'!`, { id: toastId });
      setShowReviewModal(false);
      fetchPaperDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Action failed.', { id: toastId });
    } finally {
      setReviewing(false);
    }
  };

  const handleSubmitPaper = async () => {
    if (!window.confirm('Submit this draft to supervisor for formal evaluation?')) return;
    const toastId = toast.loading('Submitting paper...');
    try {
      await api.post(`/research/papers/${id}/submit`);
      toast.success('Manuscript submitted for evaluation!', { id: toastId });
      fetchPaperDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Submission failed.', { id: toastId });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF documents allowed.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a PDF document.');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading revision to vault...');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('notes', versionNotes);

    try {
      await api.post(`/research/papers/${id}/version`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('New version registered!', { id: toastId });
      setShowVersionModal(false);
      setSelectedFile(null);
      setVersionNotes('');
      fetchPaperDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Revision failed.', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  if (loading || !paper) {
    return (
      <div className="dashboard-wrapper">
        <div className="spinner-center" style={{ minHeight: '400px' }}><div className="spinner" /></div>
      </div>
    );
  }

  // Permissions check
  const isOwner = paper.user_id === currentUserId;
  const isSupervisor = paper.supervisor?.id === currentUserId || userRoles.includes('admin');
  const showReviewButton = isSupervisor && paper.status !== 'Draft';

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <button onClick={() => navigate('/admin/research')} className="btn btn-outline btn-sm flex-center" style={{ gap: '6px' }}>
            <ArrowLeft size={13} /> Desk Directory
          </button>
          <span className="brand-logo">Manuscript Evaluation Board</span>
          <span className={`badge ${
            paper.status === 'Approved' ? 'badge-permission' : 
            paper.status === 'Rejected' ? 'badge-error' : 'badge-role'
          }`}>{paper.status}</span>
        </div>
      </nav>

      <main className="dashboard-content" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px', alignItems: 'stretch' }}>
        
        {/* Left Column: PDF Preview / Document details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="dashboard-card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '14px' }}>
              <div className="badge badge-role" style={{ fontSize: '10px', marginBottom: '8px' }}>{paper.category}</div>
              <h2 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: 600 }}>{paper.title}</h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>
                Uploaded by: <strong style={{ color: '#cbd5e1' }}>{paper.user?.name}</strong> ({paper.user?.email})
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              {isOwner && paper.status === 'Draft' && (
                <button onClick={handleSubmitPaper} className="btn btn-primary btn-sm flex-center" style={{ gap: '6px' }}>
                  <Check size={13} /> Submit Evaluation
                </button>
              )}
              {showReviewButton && (
                <button onClick={() => setShowReviewModal(true)} className="btn btn-primary btn-sm flex-center" style={{ gap: '6px', background: '#ec4899' }}>
                  <Shield size={13} /> Perform Audit Review
                </button>
              )}
              {isOwner && (paper.status === 'Draft' || paper.status === 'Rejected') && (
                <button onClick={() => setShowVersionModal(true)} className="btn btn-outline btn-sm flex-center" style={{ gap: '6px' }}>
                  <Upload size={13} /> Upload Revision
                </button>
              )}
            </div>

            {/* Abstract */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <h4 style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 0, marginBottom: '6px' }}>Abstract</h4>
              <p className="card-desc" style={{ fontSize: '13px', lineHeight: 1.5, margin: 0 }}>{paper.abstract || 'No abstract configured.'}</p>
              {paper.keywords && (
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
                  Keywords: <strong style={{ color: '#cbd5e1' }}>{paper.keywords}</strong>
                </div>
              )}
            </div>

            {/* Live Secure PDF Preview Frame */}
            <div style={{ flex: 1, minHeight: '440px', background: 'rgba(9,13,22,0.4)', border: '1px solid var(--border-glass)', borderRadius: '10px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-glass)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Secure Vault Stream Previewer</span>
                {paper.latest_version && (
                  <button 
                    onClick={() => handleDownload(paper.latest_version!.id, paper.latest_version!.original_filename)} 
                    className="btn btn-outline btn-sm flex-center" 
                    style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}
                  >
                    <Download size={11} /> Save Copy
                  </button>
                )}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                {previewLoading ? (
                  <div className="spinner-center" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}><div className="spinner" /></div>
                ) : previewBlobUrl ? (
                  <iframe 
                    src={`${previewBlobUrl}#toolbar=0`} 
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '0 0 10px 10px' }} 
                    title="PDF secure vault preview"
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '100px 20px', color: '#64748b', fontSize: '12px' }}>
                    <Info size={24} style={{ display: 'block', margin: '0 auto 10px', color: '#334155' }} />
                    Secure preview not cached. Select a version from history to stream.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Workflow timeline, Remarks, Version history */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Review remarks banner */}
          {paper.remarks && (
            <div className="dashboard-card" style={{ padding: '18px', borderLeft: '4px solid #ef4444', background: 'rgba(239,68,68,0.03)' }}>
              <div className="flex-align" style={{ gap: '8px', color: 'white', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
                <MessageSquare size={14} style={{ color: 'var(--error)' }} /> Evaluation Desk remarks
              </div>
              <p className="card-desc" style={{ fontSize: '12px', margin: 0 }}>{paper.remarks}</p>
            </div>
          )}

          {/* Workflow Status Timeline Card */}
          <div className="dashboard-card" style={{ padding: '20px' }}>
            <h3 style={{ color: 'white', margin: '0 0 14px', fontSize: '14px' }}>Evaluation Desk Workflow</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', paddingLeft: '20px' }}>
              <div style={{ position: 'absolute', left: '6px', top: '4px', bottom: '4px', width: '2px', background: 'rgba(255,255,255,0.05)' }} />
              
              {[
                { label: 'Register Manuscript', desc: 'Paper added as workspace draft', active: true, done: true },
                { label: 'Evaluation Submission', desc: 'Submitted to supervisor desk', active: paper.status !== 'Draft', done: paper.status !== 'Draft' },
                { label: 'Audit Reviewing', desc: 'Supervisor reviewing document content', active: ['Under Review', 'Approved', 'Rejected'].includes(paper.status), done: ['Approved', 'Rejected'].includes(paper.status) },
                { label: 'Evaluation Result', desc: paper.status === 'Approved' ? 'Thesis manuscript Approved' : paper.status === 'Rejected' ? 'Revision requested' : 'Evaluation pending result', active: ['Approved', 'Rejected'].includes(paper.status), done: paper.status === 'Approved', err: paper.status === 'Rejected' }
              ].map((step, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute', left: '-19px', top: '3px', width: '10px', height: '10px', borderRadius: '50%',
                    background: step.err ? 'var(--error)' : step.done ? 'var(--success)' : step.active ? 'var(--primary)' : '#1e293b',
                    border: step.active ? 'none' : '2px solid rgba(255,255,255,0.1)'
                  }} />
                  <div style={{ fontSize: '12px', fontWeight: 600, color: step.active ? 'white' : '#64748b' }}>{step.label}</div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Version History Card */}
          <div className="dashboard-card" style={{ padding: '20px', flex: 1 }}>
            <h3 style={{ color: 'white', margin: '0 0 14px', fontSize: '14px' }}>Version History Ledger</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {paper.versions.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => handleLoadPreview(v.id)}
                  style={{ 
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', 
                    padding: '10px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1, marginRight: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>Version #{v.version_number}</span>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{v.created_at.slice(0, 10)}</span>
                    </div>
                    <div className="card-desc" style={{ fontSize: '11px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {v.original_filename}
                    </div>
                    {v.notes && <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Note: {v.notes}</div>}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDownload(v.id, v.original_filename); }}
                    className="btn btn-outline btn-sm" 
                    style={{ padding: '4px 6px' }}
                  >
                    <Download size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── Workflow Review Modal ────────────────────────────────────────── */}
      {showReviewModal && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="auth-card" style={{ maxWidth: '440px', width: '100%' }}>
            <div className="auth-header">
              <h2>Manuscript Evaluation Audit</h2>
              <p>State evaluation remarks and review result.</p>
            </div>
            <form onSubmit={handleActionSubmit} className="auth-form">
              <div className="input-group">
                <label>Review Result Status</label>
                <select value={reviewForm.status} onChange={e => setReviewForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved (Settle evaluation)</option>
                  <option value="Rejected">Rejected (Request revision)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Review Evaluation Remarks</label>
                <textarea 
                  rows={4}
                  placeholder="Provide critique, requested changes, or approval details..."
                  style={{ width: '100%', background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-glass)', padding: '10px', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  value={reviewForm.remarks} 
                  onChange={e => setReviewForm(f => ({ ...f, remarks: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={reviewing}>
                  Update State
                </button>
                <button type="button" onClick={() => setShowReviewModal(false)} className="btn btn-outline" disabled={reviewing}><X size={14} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Upload New Version Modal ─────────────────────────────────────── */}
      {showVersionModal && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="auth-card" style={{ maxWidth: '440px', width: '100%' }}>
            <div className="auth-header">
              <h2>Upload Manuscript Revision</h2>
              <p>Registers a new version increment in the secure vault.</p>
            </div>
            <form onSubmit={handleVersionSubmit} className="auth-form">
              <div className="input-group">
                <label>Revision Notes / Changelog</label>
                <input 
                  type="text" 
                  placeholder="e.g. Addressed supervisor comments in Chapter 3" 
                  value={versionNotes} 
                  onChange={e => setVersionNotes(e.target.value)} 
                  required 
                />
              </div>

              <div className="input-group" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border-glass)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '8px', cursor: 'pointer' }}>
                  {selectedFile ? `Selected: ${selectedFile.name}` : 'Click here to select PDF revision file'}
                  <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFileChange} />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading}>
                  {uploading ? 'Uploading version...' : 'Upload Revision'}
                </button>
                <button type="button" onClick={() => setShowVersionModal(false)} className="btn btn-outline" disabled={uploading}><X size={14} /></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchDetail;
