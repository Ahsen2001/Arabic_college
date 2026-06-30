import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { Search, MailPlus, Eye, RefreshCw, AlertCircle } from 'lucide-react';

interface ApplicationSummary {
  id: number;
  application_number: string;
  name: string;
  email: string;
  program: string;
  academic_year: string;
  status_id: number;
  status_name: string;
  applied_date: string;
}

const AdminAdmissionsList: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Email Modal State
  const [showMailModal, setShowMailModal] = useState(false);
  const [mailStatusId, setMailStatusId] = useState(2); // Default to Submitted
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [sendingMail, setSendingMail] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, programFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/applications', {
        params: {
          status_id: statusFilter || undefined,
          program_id: programFilter || undefined,
        }
      });
      setApplications(response.data.data);
    } catch (error) {
      toast.error('Failed to load applications list.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailSubject || !mailBody) {
      toast.error('Please enter both subject and body message.');
      return;
    }

    setSendingMail(true);
    const toastId = toast.loading('Sending bulk emails...');
    try {
      const response = await api.post('/admin/applications/bulk-email', {
        status_id: mailStatusId,
        subject: mailSubject,
        body: mailBody
      });
      const count = response.data.data.count;
      toast.success(`Successfully sent emails to ${count} applicants!`, { id: toastId });
      setShowMailModal(false);
      setMailSubject('');
      setMailBody('');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to dispatch bulk emails.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setSendingMail(false);
    }
  };

  const getStatusClass = (statusId: number) => {
    switch (statusId) {
      case 1: return 'badge-role'; // Draft (grey-indigo)
      case 2: return 'badge-permission'; // Submitted (green)
      case 3: return 'badge-warning'; // Under Review (orange)
      case 4: return 'badge-role'; // Interview (indigo)
      case 5: return 'badge-permission'; // Selected (green glow)
      case 6: return 'badge-error'; // Rejected (red)
      case 7: return 'badge-success-glow'; // Enrolled
      default: return '';
    }
  };



  // Local search filter
  const filteredApps = applications.filter(app => {
    const query = searchQuery.toLowerCase();
    return (
      app.name.toLowerCase().includes(query) ||
      app.application_number.toLowerCase().includes(query) ||
      app.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Registrar</span>
          <span className="badge badge-role">Admin console</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>Admissions Review Board</h1>
            <p>Manage, review, schedule placement interviews, and enroll candidates.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowMailModal(true)} className="btn btn-outline btn-sm">
              <MailPlus size={16} /> Bulk Email Tool
            </button>
            <button onClick={fetchApplications} className="btn btn-outline btn-sm">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </header>

        {/* Filter bar */}
        <div className="dashboard-card" style={{ marginBottom: '24px' }}>
          <div className="card-body grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="input-group">
              <label>Search Applicants</label>
              <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                <Search className="input-icon" size={16} />
                <input
                  type="text"
                  placeholder="Name, ref, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Workflow Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value={1}>Draft</option>
                <option value={2}>Submitted</option>
                <option value={3}>Under Review</option>
                <option value={4}>Interview</option>
                <option value={5}>Selected</option>
                <option value={6}>Rejected</option>
                <option value={7}>Enrolled</option>
              </select>
            </div>

            <div className="input-group">
              <label>Academic Program</label>
              <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
                <option value="">All Programs</option>
                <option value={1}>B-Sharia</option>
                <option value={2}>B-Arabic</option>
                <option value={3}>B-Hadith</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table/List view of applications */}
        {loading ? (
          <div className="spinner-center" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
            <p>Retrieving applicant database...</p>
          </div>
        ) : filteredApps.length > 0 ? (
          <div className="downloads-table-container">
            <table className="downloads-table">
              <thead>
                <tr>
                  <th>Ref Number</th>
                  <th>Candidate Name</th>
                  <th>Applied Track</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr key={app.id}>
                    <td><code>{app.application_number}</code></td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{app.name}</div>
                      <div className="card-desc" style={{ fontSize: '11px', margin: '2px 0 0' }}>{app.email}</div>
                    </td>
                    <td>{app.program}</td>
                    <td>{app.applied_date || 'Draft'}</td>
                    <td>
                      <span className={`badge ${getStatusClass(app.status_id)}`}>
                        {app.status_name}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => navigate(`/admin/admissions/${app.id}`)}
                        className="btn btn-outline btn-sm flex-center"
                        style={{ margin: '0 auto', padding: '6px 12px' }}
                      >
                        <Eye size={14} style={{ marginRight: '6px' }} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dashboard-card" style={{ padding: '60px', textAlign: 'center' }}>
            <AlertCircle size={40} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No applications found matching the search/filter parameters.</p>
          </div>
        )}

        {/* Bulk Email Modal */}
        {showMailModal && (
          <div className="fullscreen-loader no-print" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
            <div className="auth-card" style={{ maxWidth: '600px', width: '100%', position: 'relative' }}>
              <div className="auth-header">
                <h2>Bulk Admissions Communicator</h2>
                <p>Send a notification email to all candidates matching a specific application status.</p>
              </div>
              <form onSubmit={handleBulkEmailSubmit} className="auth-form">
                <div className="input-group">
                  <label>Target Candidate Status Group</label>
                  <select value={mailStatusId} onChange={(e) => setMailStatusId(parseInt(e.target.value))}>
                    <option value={2}>Submitted</option>
                    <option value={3}>Under Review</option>
                    <option value={4}>Interview</option>
                    <option value={5}>Selected</option>
                    <option value={6}>Rejected</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Email Subject</label>
                  <input
                    type="text"
                    placeholder="Admissions Update: Additional Requirements Needed"
                    value={mailSubject}
                    onChange={(e) => setMailSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Email Message Body</label>
                  <textarea
                    rows={6}
                    placeholder="Write your notice here..."
                    value={mailBody}
                    onChange={(e) => setMailBody(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: '1' }} disabled={sendingMail}>
                    {sendingMail ? 'Sending Mail...' : 'Send Bulk Notification'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMailModal(false)}
                    className="btn btn-outline"
                    disabled={sendingMail}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminAdmissionsList;
