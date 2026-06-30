import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { Search, UserPlus, Eye, BookOpen, Shield } from 'lucide-react';

interface TeacherSummary {
  id: number;
  teacher_id_number: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  status: string;
  joining_date: string;
}

interface StaffSummary {
  id: number;
  staff_id_number: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: string;
  joining_date: string;
}

const AdminTeacherStaffList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'teachers' | 'staff'>('teachers');
  
  // Data lists
  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
  const [staff, setStaff] = useState<StaffSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState('');

  const [staffRoleFilter, setStaffRoleFilter] = useState('');
  const [staffStatusFilter, setStaffStatusFilter] = useState('');

  // Register Modals State
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states - Teacher
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPhone, setTPhone] = useState('');
  const [tDept, setTDept] = useState(1);
  const [tDesignation, setTDesignation] = useState(4); // default lecturer
  const [tSpecialization, setTSpecialization] = useState('');
  const [tJoiningDate, setTJoiningDate] = useState(new Date().toISOString().slice(0, 10));

  // Form states - Staff
  const [sName, setSName] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sDept, setSDept] = useState('');
  const [sRole, setSRole] = useState(1);
  const [sJoiningDate, setSJoiningDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetchDirectory();
  }, [activeTab, deptFilter, teacherStatusFilter, staffRoleFilter, staffStatusFilter]);

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      if (activeTab === 'teachers') {
        const response = await api.get('/admin/teachers', {
          params: {
            search: searchQuery || undefined,
            department_id: deptFilter || undefined,
            status_id: teacherStatusFilter || undefined,
          }
        });
        setTeachers(response.data.data.teachers);
      } else {
        const response = await api.get('/admin/staff', {
          params: {
            search: searchQuery || undefined,
            staff_role_id: staffRoleFilter || undefined,
            status_id: staffStatusFilter || undefined,
          }
        });
        setStaff(response.data.data.staff);
      }
    } catch (error) {
      toast.error('Failed to load records.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDirectory();
  };

  const handleRegisterTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading('Registering teacher profile...');
    try {
      const response = await api.post('/admin/teachers', {
        name: tName,
        email: tEmail,
        phone: tPhone,
        department_id: tDept,
        designation_id: tDesignation,
        specialization: tSpecialization,
        joining_date: tJoiningDate,
      });
      toast.success(`Teacher profile created! ID: ${response.data.data.teacher_id_number}`, { id: toastId });
      setShowTeacherModal(false);
      // Reset form
      setTName('');
      setTEmail('');
      setTPhone('');
      setTSpecialization('');
      fetchDirectory();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading('Registering staff profile...');
    try {
      const response = await api.post('/admin/staff', {
        name: sName,
        email: sEmail,
        phone: sPhone,
        department_id: sDept || null,
        staff_role_id: sRole,
        joining_date: sJoiningDate,
      });
      toast.success(`Staff profile created! ID: ${response.data.data.staff_id_number}`, { id: toastId });
      setShowStaffModal(false);
      setSName('');
      setSEmail('');
      setSPhone('');
      fetchDirectory();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Active': return 'badge-permission';
      case 'On Leave': return 'badge-warning';
      case 'Resigned': return 'badge-error';
      case 'Suspended': return 'badge-error';
      default: return 'badge-role';
    }
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Registrar</span>
          <span className="badge badge-role">HR & Directory Console</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>Personnel Directories</h1>
            <p>Administer academic teacher profiles, operational staff records, leave applications, and class allocations.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowTeacherModal(true)} className="btn btn-primary btn-sm flex-center">
              <UserPlus size={14} /> Add Teacher
            </button>
            <button onClick={() => setShowStaffModal(true)} className="btn btn-outline btn-sm flex-center">
              <UserPlus size={14} /> Add Staff
            </button>
          </div>
        </header>

        {/* Swapper directory tabs */}
        <div className="news-tabs" style={{ justifyContent: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '30px' }}>
          <button onClick={() => { setActiveTab('teachers'); }} className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} /> Faculty Board
          </button>
          <button onClick={() => { setActiveTab('staff'); }} className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} /> Operational Staff
          </button>
        </div>

        {/* Directory Filters */}
        <div className="dashboard-card" style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSearchSubmit} className="card-body grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
            <div className="input-group">
              <label>Search Keyword</label>
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

            {activeTab === 'teachers' ? (
              /* Teacher filters */
              <>
                <div className="input-group">
                  <label>Department</label>
                  <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                    <option value="">All Departments</option>
                    <option value={1}>Sharia Science</option>
                    <option value={2}>Arabic Language</option>
                    <option value={3}>Hadith & Narrator Critique</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Status</label>
                  <select value={teacherStatusFilter} onChange={(e) => setTeacherStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value={1}>Active</option>
                    <option value={2}>On Leave</option>
                    <option value={3}>Resigned</option>
                    <option value={4}>Suspended</option>
                  </select>
                </div>
              </>
            ) : (
              /* Staff filters */
              <>
                <div className="input-group">
                  <label>Staff Role</label>
                  <select value={staffRoleFilter} onChange={(e) => setStaffRoleFilter(e.target.value)}>
                    <option value="">All Roles</option>
                    <option value={1}>Administrator</option>
                    <option value={2}>Accountant</option>
                    <option value={3}>Librarian</option>
                    <option value={4}>HR Officer</option>
                    <option value={5}>IT Specialist</option>
                    <option value={6}>Registrar</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Status</label>
                  <select value={staffStatusFilter} onChange={(e) => setStaffStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value={1}>Active</option>
                    <option value={2}>On Leave</option>
                    <option value={3}>Resigned</option>
                  </select>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>
              Apply Filters
            </button>
          </form>
        </div>

        {/* Directory Listing Grid */}
        {loading ? (
          <div className="spinner-center" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
            <p>Loading directory list...</p>
          </div>
        ) : activeTab === 'teachers' ? (
          /* Teachers Listing table */
          teachers.length > 0 ? (
            <div className="downloads-table-container">
              <table className="downloads-table">
                <thead>
                  <tr>
                    <th>Faculty ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Joining Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id}>
                      <td><code>{t.teacher_id_number}</code></td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{t.name}</div>
                        <div className="card-desc" style={{ fontSize: '11px', margin: '2px 0 0' }}>{t.email}</div>
                      </td>
                      <td>{t.department}</td>
                      <td>{t.designation}</td>
                      <td>{t.joining_date}</td>
                      <td>
                        <span className={`badge ${getStatusClass(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => navigate(`/admin/teachers/${t.id}`)}
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
          ) : (
            <div className="no-data">No teachers found matching criteria.</div>
          )
        ) : (
          /* Staff Listing table */
          staff.length > 0 ? (
            <div className="downloads-table-container">
              <table className="downloads-table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Role Designation</th>
                    <th>Joining Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id}>
                      <td><code>{s.staff_id_number}</code></td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{s.name}</div>
                        <div className="card-desc" style={{ fontSize: '11px', margin: '2px 0 0' }}>{s.email}</div>
                      </td>
                      <td>{s.department || 'N/A'}</td>
                      <td>{s.role}</td>
                      <td>{s.joining_date}</td>
                      <td>
                        <span className={`badge ${getStatusClass(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => navigate(`/admin/staff/${s.id}`)}
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
          ) : (
            <div className="no-data">No staff records found.</div>
          )
        )}

        {/* Modal: Register Teacher */}
        {showTeacherModal && (
          <div className="fullscreen-loader" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
            <div className="auth-card" style={{ maxWidth: '580px', width: '100%' }}>
              <div className="auth-header">
                <h2>Faculty Registration Dossier</h2>
                <p>Register new academic profile. Password defaults to: <code>Teacher@College2026</code></p>
              </div>
              <form onSubmit={handleRegisterTeacher} className="auth-form">
                <div className="grid-2">
                  <div className="input-group">
                    <label>Full Name</label>
                    <input type="text" value={tName} onChange={(e) => setTName(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Email Address</label>
                    <input type="email" value={tEmail} onChange={(e) => setTEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label>Contact Phone</label>
                    <input type="text" value={tPhone} onChange={(e) => setTPhone(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Department Board</label>
                    <select value={tDept} onChange={(e) => setTDept(parseInt(e.target.value))}>
                      <option value={1}>Sharia Science</option>
                      <option value={2}>Arabic Language</option>
                      <option value={3}>Hadith & Narrator Critique</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label>Designation Title</label>
                    <select value={tDesignation} onChange={(e) => setTDesignation(parseInt(e.target.value))}>
                      <option value={1}>Professor</option>
                      <option value={2}>Associate Professor</option>
                      <option value={3}>Assistant Professor</option>
                      <option value={4}>Lecturer</option>
                      <option value={5}>Teaching Assistant</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Joining Date</label>
                    <input type="date" value={tJoiningDate} onChange={(e) => setTJoiningDate(e.target.value)} required />
                  </div>
                </div>

                <div className="input-group">
                  <label>Area of Specialization</label>
                  <input type="text" placeholder="e.g. Usul al-Fiqh, Islamic Jurisprudence" value={tSpecialization} onChange={(e) => setTSpecialization(e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: '1' }} disabled={submitting}>
                    {submitting ? 'Registering...' : 'Complete Registration'}
                  </button>
                  <button type="button" onClick={() => setShowTeacherModal(false)} className="btn btn-outline" disabled={submitting}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Register Staff */}
        {showStaffModal && (
          <div className="fullscreen-loader" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
            <div className="auth-card" style={{ maxWidth: '580px', width: '100%' }}>
              <div className="auth-header">
                <h2>Staff Registration Dossier</h2>
                <p>Register new operational profile. Password defaults to: <code>Staff@College2026</code></p>
              </div>
              <form onSubmit={handleRegisterStaff} className="auth-form">
                <div className="grid-2">
                  <div className="input-group">
                    <label>Full Name</label>
                    <input type="text" value={sName} onChange={(e) => setSName(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Email Address</label>
                    <input type="email" value={sEmail} onChange={(e) => setSEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label>Contact Phone</label>
                    <input type="text" value={sPhone} onChange={(e) => setSPhone(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Operational Role</label>
                    <select value={sRole} onChange={(e) => setSRole(parseInt(e.target.value))}>
                      <option value={1}>Administrator</option>
                      <option value={2}>Accountant</option>
                      <option value={3}>Librarian</option>
                      <option value={4}>HR Officer</option>
                      <option value={5}>IT Specialist</option>
                      <option value={6}>Registrar</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label>Department (Optional)</label>
                    <select value={sDept} onChange={(e) => setSDept(e.target.value)}>
                      <option value="">No department assigned</option>
                      <option value={1}>Sharia Science</option>
                      <option value={2}>Arabic Language</option>
                      <option value={3}>Hadith & Narrator Critique</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Joining Date</label>
                    <input type="date" value={sJoiningDate} onChange={(e) => setSJoiningDate(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: '1' }} disabled={submitting}>
                    {submitting ? 'Registering...' : 'Complete Registration'}
                  </button>
                  <button type="button" onClick={() => setShowStaffModal(false)} className="btn btn-outline" disabled={submitting}>
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

export default AdminTeacherStaffList;
