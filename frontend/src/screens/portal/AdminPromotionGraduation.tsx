import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { Search, Award, TrendingUp, FileText } from 'lucide-react';

interface Semester {
  id: number;
  name: string;
  code: string;
}

interface StudentSummary {
  id: number;
  student_id_number: string;
  name: string;
  email: string;
  program: string;
  semester: string;
  semester_id: number;
  status: string;
  status_id: number;
}

const AdminPromotionGraduation: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  // Bulk options
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [targetSemesterId, setTargetSemesterId] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [semesterFilter]);

  const fetchBaseData = async () => {
    try {
      const response = await api.get('/admin/academic/semesters');
      setSemesters(response.data.data);
      if (response.data.data.length > 0) {
        setTargetSemesterId(response.data.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load semesters data.');
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/students', {
        params: {
          search: searchQuery || undefined,
          semester_id: semesterFilter || undefined,
        }
      });
      setStudents(response.data.data.students);
    } catch (error) {
      toast.error('Failed to retrieve students roster.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudentIds(students.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleStudent = (studentId: number) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const handleBulkPromote = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Please select one or more students.');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading(`Promoting ${selectedStudentIds.length} students...`);
    try {
      // Loop endpoints (or bulk endpoint if written; loop is clean for registrar operations)
      await Promise.all(selectedStudentIds.map(id => 
        api.post(`/shareea/students/${id}/promote`, { semester_id: targetSemesterId })
      ));
      toast.success('Selected students promoted successfully!', { id: toastId });
      setSelectedStudentIds([]);
      fetchStudents();
    } catch (error) {
      toast.error('Failed to complete promotions.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkGraduate = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Please select one or more students to graduate.');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading(`Declaring graduation status for ${selectedStudentIds.length} students...`);
    try {
      await Promise.all(selectedStudentIds.map(id => 
        api.post(`/shareea/students/${id}/graduate`)
      ));
      toast.success('Graduation status logged!', { id: toastId });
      setSelectedStudentIds([]);
      fetchStudents();
    } catch (error) {
      toast.error('Graduation declarations failed.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Registrar</span>
          <span className="badge badge-role">Promotions & Graduations</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1>Cohort Promotions & Graduations</h1>
          <p>Advance student semester calendars or declare graduations for finalized cohorts.</p>
        </header>

        {/* Filters and Search */}
        <div className="dashboard-card" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSearchSubmit} className="card-body grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'end' }}>
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
              <label>Current Semester Term</label>
              <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
                <option value="">All Semesters</option>
                {semesters.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>
              Search Students
            </button>
          </form>
        </div>

        {/* Registrar Operations Action Bar */}
        {selectedStudentIds.length > 0 && (
          <div className="dashboard-card" style={{ marginBottom: '24px', background: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.2)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <strong style={{ color: 'white' }}>{selectedStudentIds.length} Students Selected</strong>
                <p className="card-desc" style={{ margin: '2px 0 0', fontSize: '12px' }}>Pick target semester for promotion, or declare graduations.</p>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="input-group" style={{ margin: '0', width: '200px' }}>
                  <select value={targetSemesterId} onChange={(e) => setTargetSemesterId(parseInt(e.target.value))}>
                    {semesters.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <button onClick={handleBulkPromote} className="btn btn-primary btn-sm flex-center" disabled={submitting}>
                  <TrendingUp size={14} /> Promote Cohort
                </button>
                <button onClick={handleBulkGraduate} className="btn btn-outline btn-sm flex-center" style={{ color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)' }} disabled={submitting}>
                  <Award size={14} /> Declare Graduation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Student list grid */}
        {loading ? (
          <div className="spinner-center" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
            <p>Loading students roster...</p>
          </div>
        ) : students.length > 0 ? (
          <div className="dashboard-card">
            <div className="downloads-table-container">
              <table className="downloads-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.length === students.length && students.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Degree Program</th>
                    <th>Current Semester</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Academic Record</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(s.id)}
                          onChange={() => handleToggleStudent(s.id)}
                        />
                      </td>
                      <td><code>{s.student_id_number}</code></td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{s.name}</div>
                        <div className="card-desc" style={{ fontSize: '11px', margin: '2px 0 0' }}>{s.email}</div>
                      </td>
                      <td>{s.program}</td>
                      <td><span className="badge badge-role">{s.semester}</span></td>
                      <td>
                        <span className={`badge ${s.status === 'Active' ? 'badge-permission' : (s.status === 'Graduated' ? 'badge-warning' : 'badge-role')}`}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => navigate(`/portal/student-transcript/${s.id}`)}
                          className="btn btn-outline btn-sm flex-center"
                          style={{ margin: '0 auto', padding: '6px 12px' }}
                        >
                          <FileText size={14} style={{ marginRight: '6px' }} /> Transcript
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="no-data">No students found matching filters.</div>
        )}
      </main>
    </div>
  );
};

export default AdminPromotionGraduation;
