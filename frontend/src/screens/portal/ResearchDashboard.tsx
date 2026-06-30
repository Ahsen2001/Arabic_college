import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { 
  Plus, Search, ArrowRight, X 
} from 'lucide-react';

interface Paper {
  id: number;
  title: string;
  abstract?: string;
  category: string;
  keywords?: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  created_at: string;
  updated_at: string;
  user?: { name: string };
  supervisor?: { name: string };
}

const statusBadge = (s: string) => {
  switch (s) {
    case 'Draft': return 'badge-role';
    case 'Submitted': return 'badge-role';
    case 'Under Review': return 'badge-permission';
    case 'Approved': return 'badge-permission';
    case 'Rejected': return 'badge-error';
    default: return 'badge-role';
  }
};

const ResearchDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Data States
  const [papers, setPapers] = useState<Paper[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [supervisors, setSupervisors] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    abstract: '',
    category: '',
    keywords: '',
    supervisor_user_id: 0,
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPapers();
    fetchLookups();
  }, [selectedCategory, selectedStatus]);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/research/papers', {
        params: {
          search,
          category: selectedCategory || undefined,
          status: selectedStatus || undefined
        }
      });
      setPapers(res.data.data.data ?? res.data.data ?? []);
    } catch {
      toast.error('Failed to load research papers.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        api.get('/research/categories'),
        api.get('/research/supervisors')
      ]);
      const cats = catRes.data.data ?? [];
      setCategories(cats);
      if (cats.length > 0) {
        setUploadForm(f => ({ ...f, category: cats[0] }));
      }
      const sups = supRes.data.data ?? [];
      setSupervisors(sups);
      if (sups.length > 0) {
        setUploadForm(f => ({ ...f, supervisor_user_id: sups[0].id }));
      }
    } catch {
      // Silently catch lookup errors
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF documents are allowed.');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error('File size exceeds the 15MB limit.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a PDF document to upload.');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading research paper securely...');
    
    // Create multipart form
    const formData = new FormData();
    formData.append('title', uploadForm.title);
    formData.append('abstract', uploadForm.abstract);
    formData.append('category', uploadForm.category);
    formData.append('keywords', uploadForm.keywords);
    formData.append('notes', uploadForm.notes);
    formData.append('file', selectedFile);
    if (uploadForm.supervisor_user_id > 0) {
      formData.append('supervisor_user_id', String(uploadForm.supervisor_user_id));
    }

    try {
      await api.post('/research/papers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Research paper uploaded successfully as Draft!', { id: toastId });
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadForm({
        title: '', abstract: '', category: categories[0] ?? '', 
        keywords: '', supervisor_user_id: supervisors[0]?.id ?? 0, notes: ''
      });
      fetchPapers();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to register research paper.', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Academic Research Portal</span>
          <span className="badge badge-role">Research Desk</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Academic Research Projects</h1>
            <p>Upload thesis papers, track approval workflows, assign supervisors, and access publication vault archives.</p>
          </div>
          <button onClick={() => setShowUploadModal(true)} className="btn btn-primary btn-sm flex-center" style={{ gap: '6px' }}>
            <Plus size={14} /> Upload Research
          </button>
        </header>

        {/* Filter and Search */}
        <div className="dashboard-card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', maxWidth: '340px', width: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search by paper title or keywords..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchPapers()}
                style={{ paddingLeft: '36px', width: '100%' }}
                className="search-input"
              />
            </div>
            <div className="flex-align" style={{ gap: '12px' }}>
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-glass)', padding: '8px 12px', color: '#fff', borderRadius: '8px', fontSize: '13px' }}
              >
                <option value="">All Categories</option>
                {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
              <select 
                value={selectedStatus} 
                onChange={e => setSelectedStatus(e.target.value)}
                style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-glass)', padding: '8px 12px', color: '#fff', borderRadius: '8px', fontSize: '13px' }}
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <button onClick={fetchPapers} className="btn btn-primary btn-sm">Filter</button>
            </div>
          </div>
        </div>

        {/* Papers Grid */}
        {loading ? (
          <div className="spinner-center" style={{ minHeight: '200px' }}><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {papers.map(paper => (
              <div key={paper.id} className="dashboard-card flex-between" style={{ padding: '20px', flexDirection: 'column', alignItems: 'stretch' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span className="badge badge-role" style={{ fontSize: '10px' }}>{paper.category}</span>
                    <span className={`badge ${statusBadge(paper.status)}`}>{paper.status}</span>
                  </div>
                  
                  <h3 style={{ color: 'white', margin: '0 0 8px', fontSize: '15px', fontWeight: 600, lineHeight: 1.4 }}>
                    {paper.title}
                  </h3>
                  
                  <p className="card-desc" style={{ fontSize: '12px', height: '54px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginBottom: '14px' }}>
                    {paper.abstract || 'No abstract provided.'}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      <div>Author: <strong style={{ color: '#cbd5e1' }}>{paper.user?.name}</strong></div>
                      {paper.supervisor && <div style={{ marginTop: '2px' }}>Supervisor: <strong>{paper.supervisor.name}</strong></div>}
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/admin/research/${paper.id}`)} 
                      className="btn btn-outline btn-sm flex-center" 
                      style={{ padding: '6px 10px', fontSize: '11px', gap: '4px' }}
                    >
                      View Desk <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {papers.length === 0 && (
              <div className="no-data" style={{ gridColumn: '1/-1' }}>No research papers registered in catalog desk.</div>
            )}
          </div>
        )}
      </main>

      {/* ── Upload Research Modal ──────────────────────────────────────── */}
      {showUploadModal && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="auth-card" style={{ maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="auth-header">
              <h2>Register & Upload Research Paper</h2>
              <p>Upload a thesis manuscript securely in PDF format.</p>
            </div>
            <form onSubmit={handleUploadSubmit} className="auth-form">
              <div className="input-group">
                <label>Paper Title</label>
                <input type="text" value={uploadForm.title} onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label>Abstract / Synopsis</label>
                <textarea 
                  rows={4}
                  style={{ width: '100%', background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-glass)', padding: '10px', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  value={uploadForm.abstract} 
                  onChange={e => setUploadForm(f => ({ ...f, abstract: e.target.value }))} 
                />
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Category Classification</label>
                  <select value={uploadForm.category} onChange={e => setUploadForm(f => ({ ...f, category: e.target.value }))} required>
                    {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Assign Supervisor</label>
                  <select value={uploadForm.supervisor_user_id} onChange={e => setUploadForm(f => ({ ...f, supervisor_user_id: parseInt(e.target.value) }))}>
                    <option value={0}>— Select Supervisor —</option>
                    {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Keywords (tags)</label>
                  <input type="text" placeholder="e.g. Sharia, Fiqh, Contract" value={uploadForm.keywords} onChange={e => setUploadForm(f => ({ ...f, keywords: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Initial Version Notes</label>
                  <input type="text" placeholder="e.g. Initial draft submission" value={uploadForm.notes} onChange={e => setUploadForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              <div className="input-group" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border-glass)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '8px', cursor: 'pointer' }}>
                  {selectedFile ? `Selected Document: ${selectedFile.name}` : 'Click here to choose Thesis PDF Document'}
                  <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFileChange} />
                </label>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Only PDF documents up to 15MB allowed.</div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading}>
                  {uploading ? 'Processing Secure Upload...' : 'Submit Draft Register'}
                </button>
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn btn-outline" disabled={uploading}><X size={14} /></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchDashboard;
