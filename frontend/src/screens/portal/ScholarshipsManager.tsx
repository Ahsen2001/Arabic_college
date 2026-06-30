import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Plus, Award, Tag, X, Save } from 'lucide-react';

interface Scholarship {
  id: number; name: string; code: string; coverage_type: string;
  coverage_value: number; seats_available?: number; is_active: boolean;
  description?: string; student_awards_count?: number;
}
interface Discount {
  id: number; name: string; code: string; type: string; value: number; is_active: boolean; description?: string;
}
interface Student { id: number; student_id_number: string; user?: { name: string }; }

const ScholarshipsManager: React.FC = () => {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<'scholarships' | 'discounts'>('scholarships');
  const [loading, setLoading] = useState(true);

  // Scholarship modal
  const [showSModal, setShowSModal] = useState(false);
  const [sForm, setSForm] = useState({ name: '', code: '', coverage_type: 'percentage', coverage_value: 0, seats_available: '', description: '' });

  // Award modal
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [awardForm, setAwardForm] = useState({ student_id: 0, scholarship_id: 0, awarded_date: new Date().toISOString().slice(0, 10), expiry_date: '', notes: '' });

  // Discount modal
  const [showDModal, setShowDModal] = useState(false);
  const [dForm, setDForm] = useState({ name: '', code: '', type: 'percentage', value: 0, description: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, dRes, stRes] = await Promise.all([
        api.get('/finance/scholarships'),
        api.get('/finance/discounts'),
        api.get('/admin/students'),
      ]);
      setScholarships(sRes.data.data ?? []);
      setDiscounts(dRes.data.data ?? []);
      setStudents(stRes.data.data?.data ?? stRes.data.data ?? []);
    } catch { toast.error('Failed to load data.'); }
    finally { setLoading(false); }
  };

  const handleCreateScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Creating scholarship…');
    try {
      await api.post('/finance/scholarships', { ...sForm, seats_available: sForm.seats_available ? parseInt(sForm.seats_available) : null });
      toast.success('Scholarship created!', { id: toastId });
      setShowSModal(false);
      setSForm({ name: '', code: '', coverage_type: 'percentage', coverage_value: 0, seats_available: '', description: '' });
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message ?? 'Failed.', { id: toastId }); }
  };

  const handleAwardScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Awarding scholarship…');
    try {
      await api.post('/finance/scholarships/award', awardForm);
      toast.success('Scholarship awarded!', { id: toastId });
      setShowAwardModal(false);
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message ?? 'Failed.', { id: toastId }); }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Creating discount…');
    try {
      await api.post('/finance/discounts', dForm);
      toast.success('Discount created!', { id: toastId });
      setShowDModal(false);
      setDForm({ name: '', code: '', type: 'percentage', value: 0, description: '' });
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.message ?? 'Failed.', { id: toastId }); }
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Finance</span>
          <span className="badge badge-role">Scholarships & Discounts</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Scholarships & Discounts</h1>
            <p>Manage scholarship programmes, waivers, and award them to students.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {activeTab === 'scholarships' ? (
              <>
                <button onClick={() => setShowAwardModal(true)} className="btn btn-outline btn-sm flex-center" style={{ gap: '6px' }}><Award size={13} /> Award</button>
                <button onClick={() => setShowSModal(true)} className="btn btn-primary btn-sm flex-center"><Plus size={13} /> New Scholarship</button>
              </>
            ) : (
              <button onClick={() => setShowDModal(true)} className="btn btn-primary btn-sm flex-center"><Plus size={13} /> New Discount</button>
            )}
          </div>
        </header>

        {/* Tabs */}
        <div className="news-tabs" style={{ margin: '0 0 24px', border: 'none', display: 'flex', gap: '8px' }}>
          {(['scholarships', 'discounts'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} style={{ display: 'flex', gap: '6px', alignItems: 'center', textTransform: 'capitalize' }}>
              {tab === 'scholarships' ? <Award size={13} /> : <Tag size={13} />} {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner-center" style={{ minHeight: '300px' }}><div className="spinner" /></div>
        ) : activeTab === 'scholarships' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '16px' }}>
            {scholarships.map(s => (
              <div key={s.id} className="dashboard-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ color: 'white', margin: 0, fontSize: '14px' }}>{s.name}</h3>
                  <span className={`badge ${s.is_active ? 'badge-permission' : 'badge-role'}`}>{s.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="card-desc" style={{ fontSize: '11px', marginBottom: '12px' }}>{s.description || 'No description provided.'}</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <span className="badge badge-role">{s.code}</span>
                  <span className="badge badge-role" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                    {s.coverage_type === 'percentage' ? `${s.coverage_value}% Coverage` : `PKR ${s.coverage_value} Fixed`}
                  </span>
                  {s.seats_available && <span className="badge badge-role">{s.seats_available} Seats</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {s.student_awards_count ?? 0} student(s) awarded
                </div>
              </div>
            ))}
            {scholarships.length === 0 && <div className="no-data" style={{ gridColumn: '1/-1' }}>No scholarships configured yet.</div>}
          </div>
        ) : (
          <div className="dashboard-card">
            <div className="downloads-table-container">
              <table className="downloads-table">
                <thead><tr><th>Name</th><th>Code</th><th>Type</th><th>Value</th><th>Status</th><th>Description</th></tr></thead>
                <tbody>
                  {discounts.map(d => (
                    <tr key={d.id}>
                      <td><strong>{d.name}</strong></td>
                      <td><span className="badge badge-role">{d.code}</span></td>
                      <td style={{ textTransform: 'capitalize' }}>{d.type}</td>
                      <td><strong style={{ color: 'var(--success)' }}>{d.type === 'percentage' ? `${d.value}%` : `PKR ${d.value}`}</strong></td>
                      <td><span className={`badge ${d.is_active ? 'badge-permission' : 'badge-role'}`}>{d.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td><span className="card-desc" style={{ fontSize: '12px' }}>{d.description || '—'}</span></td>
                    </tr>
                  ))}
                  {discounts.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>No discounts configured.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── Scholarship Create Modal ─────────────────────────────────────── */}
      {showSModal && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="auth-card" style={{ maxWidth: '500px', width: '100%' }}>
            <div className="auth-header"><h2>Create Scholarship</h2></div>
            <form onSubmit={handleCreateScholarship} className="auth-form">
              <div className="grid-2">
                <div className="input-group"><label>Name</label><input value={sForm.name} onChange={e => setSForm(f => ({ ...f, name: e.target.value }))} required /></div>
                <div className="input-group"><label>Code</label><input value={sForm.code} onChange={e => setSForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required /></div>
              </div>
              <div className="grid-2">
                <div className="input-group"><label>Coverage Type</label>
                  <select value={sForm.coverage_type} onChange={e => setSForm(f => ({ ...f, coverage_type: e.target.value }))}>
                    <option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="input-group"><label>Coverage Value</label><input type="number" min={0} value={sForm.coverage_value || ''} onChange={e => setSForm(f => ({ ...f, coverage_value: parseFloat(e.target.value) || 0 }))} required /></div>
              </div>
              <div className="input-group"><label>Seats Available (optional)</label><input type="number" min={1} value={sForm.seats_available} onChange={e => setSForm(f => ({ ...f, seats_available: e.target.value }))} /></div>
              <div className="input-group"><label>Description</label><input value={sForm.description} onChange={e => setSForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Save size={13} style={{ marginRight: '6px' }} />Create</button>
                <button type="button" onClick={() => setShowSModal(false)} className="btn btn-outline"><X size={13} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Award Modal ──────────────────────────────────────────────────── */}
      {showAwardModal && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="auth-card" style={{ maxWidth: '480px', width: '100%' }}>
            <div className="auth-header"><h2>Award Scholarship</h2><p>Assign a scholarship programme to a student.</p></div>
            <form onSubmit={handleAwardScholarship} className="auth-form">
              <div className="input-group"><label>Student</label>
                <select value={awardForm.student_id} onChange={e => setAwardForm(f => ({ ...f, student_id: parseInt(e.target.value) }))} required>
                  <option value={0} disabled>Select student…</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.user?.name} ({s.student_id_number})</option>)}
                </select>
              </div>
              <div className="input-group"><label>Scholarship</label>
                <select value={awardForm.scholarship_id} onChange={e => setAwardForm(f => ({ ...f, scholarship_id: parseInt(e.target.value) }))} required>
                  <option value={0} disabled>Select scholarship…</option>
                  {scholarships.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="input-group"><label>Awarded Date</label><input type="date" value={awardForm.awarded_date} onChange={e => setAwardForm(f => ({ ...f, awarded_date: e.target.value }))} required /></div>
                <div className="input-group"><label>Expiry Date (opt.)</label><input type="date" value={awardForm.expiry_date} onChange={e => setAwardForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
              </div>
              <div className="input-group"><label>Notes</label><input value={awardForm.notes} onChange={e => setAwardForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Award Scholarship</button>
                <button type="button" onClick={() => setShowAwardModal(false)} className="btn btn-outline"><X size={13} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Discount Create Modal ────────────────────────────────────────── */}
      {showDModal && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="auth-card" style={{ maxWidth: '460px', width: '100%' }}>
            <div className="auth-header"><h2>Create Discount</h2></div>
            <form onSubmit={handleCreateDiscount} className="auth-form">
              <div className="grid-2">
                <div className="input-group"><label>Name</label><input value={dForm.name} onChange={e => setDForm(f => ({ ...f, name: e.target.value }))} required /></div>
                <div className="input-group"><label>Code</label><input value={dForm.code} onChange={e => setDForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required /></div>
              </div>
              <div className="grid-2">
                <div className="input-group"><label>Type</label>
                  <select value={dForm.type} onChange={e => setDForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="input-group"><label>Value ({dForm.type === 'percentage' ? '%' : 'PKR'})</label>
                  <input type="number" min={0} value={dForm.value || ''} onChange={e => setDForm(f => ({ ...f, value: parseFloat(e.target.value) || 0 }))} required />
                </div>
              </div>
              <div className="input-group"><label>Description</label><input value={dForm.description} onChange={e => setDForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Discount</button>
                <button type="button" onClick={() => setShowDModal(false)} className="btn btn-outline"><X size={13} /></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipsManager;
