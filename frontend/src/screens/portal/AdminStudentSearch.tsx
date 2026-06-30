import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { Search, Upload, Download, RefreshCw, ChevronLeft, ChevronRight, AlertCircle, Eye } from 'lucide-react';

interface StudentSummary {
  id: number;
  student_id_number: string;
  name: string;
  email: string;
  program: string;
  status_id: number;
  status_name: string;
  admission_date: string;
  has_scholarship: boolean;
}

const AdminStudentSearch: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scholarshipFilter, setScholarshipFilter] = useState('');

  // Bulk Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [page, programFilter, statusFilter, scholarshipFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/students', {
        params: {
          page,
          search: searchQuery || undefined,
          program_id: programFilter || undefined,
          status_id: statusFilter || undefined,
          has_scholarship: scholarshipFilter || undefined,
        }
      });
      const data = response.data.data;
      setStudents(data.students);
      setTotalPages(data.last_page);
      setTotalRecords(data.total);
    } catch (error) {
      toast.error('Failed to retrieve students records.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleExportCSV = async () => {
    const toastId = toast.loading('Generating export CSV ledger...');
    try {

      // Direct stream download using window.open with authentication token in query parameter if needed,
      // or fetch the blob directly and trigger download. Fetching blob is cleaner.
      const response = await api.get('/admin/students/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Students CSV ledger downloaded!', { id: toastId });
    } catch (error) {
      toast.error('Failed to export students records.', { id: toastId });
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Please select a CSV file.');
      return;
    }

    setImporting(true);
    const toastId = toast.loading('Processing CSV imports...');
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await api.post('/admin/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = response.data.data;
      toast.success(`Import complete! Loaded ${data.imported} records, skipped ${data.skipped} items.`, { id: toastId });
      setShowImportModal(false);
      setImportFile(null);
      setPage(1);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'CSV Import failed.', { id: toastId });
    } finally {
      setImporting(false);
    }
  };

  const getStatusClass = (statusId: number) => {
    switch (statusId) {
      case 1: return 'badge-permission'; // Active
      case 2: return 'badge-success-glow'; // Graduated
      case 3: return 'badge-warning'; // Suspended
      case 4: return 'badge-error'; // Withdrawn
      default: return '';
    }
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College SIS</span>
          <span className="badge badge-role">Registrar Portal</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>Student Search & Ledger</h1>
            <p>Administer enrolled profiles, view guardians, check scholarships, and export registers.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowImportModal(true)} className="btn btn-outline btn-sm">
              <Upload size={16} /> Bulk Import CSV
            </button>
            <button onClick={handleExportCSV} className="btn btn-outline btn-sm">
              <Download size={16} /> Export CSV Ledger
            </button>
            <button onClick={() => { setPage(1); fetchStudents(); }} className="btn btn-outline btn-sm">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </header>

        {/* Filter console */}
        <div className="dashboard-card" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSearchSubmit} className="card-body grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
            <div className="input-group">
              <label>Search Student</label>
              <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                <Search className="input-icon" size={16} />
                <input
                  type="text"
                  placeholder="ID, Name, or Email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Track Program</label>
              <select value={programFilter} onChange={(e) => { setProgramFilter(e.target.value); setPage(1); }}>
                <option value="">All Programs</option>
                <option value={1}>B-Sharia</option>
                <option value={2}>B-Arabic</option>
                <option value={3}>B-Hadith</option>
              </select>
            </div>

            <div className="input-group">
              <label>Academic Status</label>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Statuses</option>
                <option value={1}>Active</option>
                <option value={2}>Graduated</option>
                <option value={3}>Suspended</option>
                <option value={4}>Withdrawn</option>
              </select>
            </div>

            <div className="input-group">
              <label>Scholarship Status</label>
              <select value={scholarshipFilter} onChange={(e) => { setScholarshipFilter(e.target.value); setPage(1); }}>
                <option value="">All Scholarships</option>
                <option value="yes">Active Scholarship</option>
                <option value="no">No Active Scholarship</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>
              Apply Filters
            </button>
          </form>
        </div>

        {/* Students Table */}
        {loading ? (
          <div className="spinner-center" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
            <p>Retrieving student profiles ledger...</p>
          </div>
        ) : students.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="downloads-table-container">
              <table className="downloads-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Full Name</th>
                    <th>Track Program</th>
                    <th>Admission Date</th>
                    <th>Scholarship Status</th>
                    <th>Academic Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td><code>{student.student_id_number}</code></td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{student.name}</div>
                        <div className="card-desc" style={{ fontSize: '11px', margin: '2px 0 0' }}>{student.email}</div>
                      </td>
                      <td>{student.program}</td>
                      <td>{student.admission_date}</td>
                      <td>
                        {student.has_scholarship ? (
                          <span className="badge badge-role" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>Active Scholarship</span>
                        ) : (
                          <span className="card-desc" style={{ fontSize: '12px', fontStyle: 'italic' }}>None</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getStatusClass(student.status_id)}`}>
                          {student.status_name}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => navigate(`/admin/students/${student.id}`)}
                          className="btn btn-outline btn-sm flex-center"
                          style={{ margin: '0 auto', padding: '6px 12px' }}
                        >
                          <Eye size={14} style={{ marginRight: '6px' }} /> Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <span className="card-desc" style={{ margin: '0' }}>Total: <strong>{totalRecords}</strong> student records found.</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '8px 12px' }}
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <span className="detail-val" style={{ fontSize: '13.5px' }}>Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '8px 12px' }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard-card" style={{ padding: '60px', textAlign: 'center' }}>
            <AlertCircle size={40} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No student records found matching the search/filter parameters.</p>
          </div>
        )}

        {/* CSV Import Modal */}
        {showImportModal && (
          <div className="fullscreen-loader" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
            <div className="auth-card" style={{ maxWidth: '480px', width: '100%' }}>
              <div className="auth-header">
                <h2>Bulk Students CSV Importer</h2>
                <p>Upload a CSV file containing records to register users under active Student roles.</p>
              </div>
              <form onSubmit={handleImportSubmit} className="auth-form">
                <div className="notice-banner" style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                  <AlertCircle size={18} className="notice-icon" />
                  <p style={{ fontSize: '12px' }}>
                    CSV file columns expected: <code>Name, Email, Phone, Program ID, Semester ID</code>. Header row will be skipped.
                  </p>
                </div>
                <div className="input-group">
                  <label>Select CSV file</label>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setImportFile(e.target.files[0]);
                      }
                    }}
                    required
                    style={{
                      background: 'rgba(15,23,42,0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      padding: '12px',
                      color: 'white'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: '1' }} disabled={importing}>
                    {importing ? 'Importing CSV...' : 'Process Import'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowImportModal(false); setImportFile(null); }}
                    className="btn btn-outline"
                    disabled={importing}
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

export default AdminStudentSearch;
