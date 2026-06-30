import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Award, Briefcase, Calendar, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface StaffDetail {
  id: number;
  staff_id_number: string;
  name: string;
  email: string;
  phone: string;
  department_id: number | null;
  department_name: string;
  staff_role_id: number;
  role: string;
  status_id: number;
  status: string;
  joining_date: string;
  qualifications: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    year_obtained: number;
  }>;
  experiences: Array<{
    company_name: string;
    job_title: string;
    start_date: string;
    end_date?: string;
    description?: string;
  }>;
  leaves: Array<{
    id: number;
    leave_type: string;
    start_date: string;
    end_date: string;
    reason?: string;
    status: string;
  }>;
}

const AdminStaffDossier: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Form Fields - Profile Tab
  const [pName, setPName] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pDept, setPDept] = useState<string>('');
  const [pRole, setPRole] = useState(1);
  const [pStatus, setPStatus] = useState(1);
  const [pJoiningDate, setPJoiningDate] = useState('');

  // Form Fields - Lists
  const [qualificationList, setQualificationList] = useState<Array<{ institution: string; degree: string; field_of_study: string; year_obtained: number }>>([]);
  const [experienceList, setExperienceList] = useState<Array<{ company_name: string; job_title: string; start_date: string; end_date?: string; description?: string }>>([]);

  // Form Fields - Leaves Tab
  const [leaveType, setLeaveType] = useState('Annual Leave');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => {
    fetchStaffDossier();
  }, [id]);

  const fetchStaffDossier = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/staff/${id}`);
      const data = response.data.data as StaffDetail;
      setStaff(data);

      setPName(data.name);
      setPPhone(data.phone);
      setPDept(data.department_id ? String(data.department_id) : '');
      setPRole(data.staff_role_id);
      setPStatus(data.status_id);
      setPJoiningDate(data.joining_date || '');

      setQualificationList(data.qualifications || []);
      setExperienceList(data.experiences || []);
    } catch (error) {
      toast.error('Failed to load staff dossier.');
      navigate('/admin/teachers-staff');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading('Saving profile parameters...');
    try {
      await api.post(`/admin/staff/${id}/update`, {
        name: pName,
        phone: pPhone,
        department_id: pDept ? parseInt(pDept) : null,
        staff_role_id: pRole,
        status_id: pStatus,
        joining_date: pJoiningDate,
      });
      toast.success('Staff profile updated!', { id: toastId });
      fetchStaffDossier();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateQualifications = async () => {
    setSubmitting(true);
    const toastId = toast.loading('Saving qualifications...');
    try {
      await api.post(`/admin/staff/${id}/qualifications`, { qualifications: qualificationList });
      toast.success('Qualifications updated successfully!', { id: toastId });
      fetchStaffDossier();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateExperience = async () => {
    setSubmitting(true);
    const toastId = toast.loading('Saving experiences...');
    try {
      await api.post(`/admin/staff/${id}/experience`, { experiences: experienceList });
      toast.success('Work experiences updated!', { id: toastId });
      fetchStaffDossier();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd) {
      toast.error('Please enter leave start and end dates.');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Filing leave request...');
    try {
      await api.post(`/admin/staff/${id}/leaves`, {
        leave_type: leaveType,
        start_date: leaveStart,
        end_date: leaveEnd,
        reason: leaveReason,
      });
      toast.success('Leave request submitted successfully!', { id: toastId });
      setLeaveReason('');
      fetchStaffDossier();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit leave.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveApproval = async (leaveId: number, status: 'Approved' | 'Rejected') => {
    const toastId = toast.loading(`Updating leave status to ${status}...`);
    try {
      await api.post(`/admin/leaves/${leaveId}/action`, { status });
      toast.success(`Leave request ${status}!`, { id: toastId });
      fetchStaffDossier();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed.', { id: toastId });
    }
  };

  const addQualificationRow = () => {
    setQualificationList([...qualificationList, { institution: '', degree: '', field_of_study: '', year_obtained: new Date().getFullYear() }]);
  };

  const removeQualificationRow = (index: number) => {
    setQualificationList(qualificationList.filter((_, idx) => idx !== index));
  };

  const updateQualificationRow = (index: number, key: string, value: any) => {
    const list = [...qualificationList];
    list[index] = { ...list[index], [key]: value };
    setQualificationList(list);
  };

  const addExperienceRow = () => {
    setExperienceList([...experienceList, { company_name: '', job_title: '', start_date: new Date().toISOString().slice(0, 10), end_date: '', description: '' }]);
  };

  const removeExperienceRow = (index: number) => {
    setExperienceList(experienceList.filter((_, idx) => idx !== index));
  };

  const updateExperienceRow = (index: number, key: string, value: string) => {
    const list = [...experienceList];
    list[index] = { ...list[index], [key]: value };
    setExperienceList(list);
  };

  if (loading || !staff) {
    return (
      <div className="fullscreen-loader">
        <div className="loader-card">
          <div className="spinner"></div>
          <p className="loading-text">Loading staff dossier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Registrar</span>
          <button onClick={() => navigate('/admin/teachers-staff')} className="btn btn-outline btn-sm">
            <ArrowLeft size={16} /> Back to Directory
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1>Staff: {staff.name}</h1>
          <p>Staff ID: <strong>{staff.staff_id_number}</strong> | Role: <span className="badge badge-role">{staff.role}</span></p>
        </header>

        {/* Dossier tabs */}
        <div className="news-tabs" style={{ justifyContent: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '30px', flexWrap: 'wrap', gap: '8px' }}>
          <button onClick={() => setActiveTab('profile')} className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} /> Profile Settings
          </button>
          <button onClick={() => setActiveTab('qualifications')} className={`tab-btn ${activeTab === 'qualifications' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={14} /> Qualifications
          </button>
          <button onClick={() => setActiveTab('experience')} className={`tab-btn ${activeTab === 'experience' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Briefcase size={14} /> Work History
          </button>
          <button onClick={() => setActiveTab('leaves')} className={`tab-btn ${activeTab === 'leaves' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Leave Requests
          </button>
        </div>

        <div className="dashboard-card" style={{ padding: '30px' }}>
          {/* Tab 1: Profile */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="auth-form">
              <h3>Staff Parameters</h3>
              <p className="card-desc">Configure roles, departments, and active employment status.</p>

              <div className="grid-2">
                <div className="input-group">
                  <label>Full Name</label>
                  <input type="text" value={pName} onChange={(e) => setPName(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <input type="text" value={pPhone} onChange={(e) => setPPhone(e.target.value)} required />
                </div>
              </div>

              <div className="grid-3">
                <div className="input-group">
                  <label>Department Assigned (Optional)</label>
                  <select value={pDept} onChange={(e) => setPDept(e.target.value)}>
                    <option value="">No department assigned</option>
                    <option value={1}>Sharia Science</option>
                    <option value={2}>Arabic Language</option>
                    <option value={3}>Hadith & Narrator Critique</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Operational Role</label>
                  <select value={pRole} onChange={(e) => setPRole(parseInt(e.target.value))}>
                    <option value={1}>Administrator</option>
                    <option value={2}>Accountant</option>
                    <option value={3}>Librarian</option>
                    <option value={4}>HR Officer</option>
                    <option value={5}>IT Specialist</option>
                    <option value={6}>Registrar</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Employment Status</label>
                  <select value={pStatus} onChange={(e) => setPStatus(parseInt(e.target.value))}>
                    <option value={1}>Active</option>
                    <option value={2}>On Leave</option>
                    <option value={3}>Resigned</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Joining Date</label>
                <input type="date" value={pJoiningDate} onChange={(e) => setPJoiningDate(e.target.value)} required />
              </div>

              <div style={{ marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  Save Profile Settings
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Qualifications */}
          {activeTab === 'qualifications' && (
            <div className="auth-form">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Academic Qualifications</h3>
                  <p className="card-desc">Review and update degree qualifications.</p>
                </div>
                <button onClick={addQualificationRow} className="btn btn-outline btn-sm flex-center">
                  <Plus size={14} /> Add Qualification
                </button>
              </div>

              {qualificationList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                  {qualificationList.map((qual, idx) => (
                    <div key={idx} className="upload-row-item" style={{ flexWrap: 'wrap', gap: '12px' }}>
                      <input
                        type="text"
                        placeholder="Institution"
                        value={qual.institution}
                        onChange={(e) => updateQualificationRow(idx, 'institution', e.target.value)}
                        style={{ flex: '1.5', minWidth: '160px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                      />
                      <input
                        type="text"
                        placeholder="Degree / Certificate"
                        value={qual.degree}
                        onChange={(e) => updateQualificationRow(idx, 'degree', e.target.value)}
                        style={{ flex: '1', minWidth: '120px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                      />
                      <input
                        type="text"
                        placeholder="Field of Study"
                        value={qual.field_of_study}
                        onChange={(e) => updateQualificationRow(idx, 'field_of_study', e.target.value)}
                        style={{ flex: '1', minWidth: '120px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                      />
                      <input
                        type="number"
                        placeholder="Year"
                        value={qual.year_obtained}
                        onChange={(e) => updateQualificationRow(idx, 'year_obtained', parseInt(e.target.value) || 2026)}
                        style={{ width: '90px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                      />
                      <button onClick={() => removeQualificationRow(idx)} className="btn btn-outline" style={{ color: 'var(--error)', padding: '10px', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-badge" style={{ marginTop: '20px' }}>No qualification history recorded.</p>
              )}

              <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                <button onClick={handleUpdateQualifications} className="btn btn-primary" disabled={submitting}>
                  Save Qualifications
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Experience */}
          {activeTab === 'experience' && (
            <div className="auth-form">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Work Experience History</h3>
                  <p className="card-desc">Review and register past work history logs.</p>
                </div>
                <button onClick={addExperienceRow} className="btn btn-outline btn-sm flex-center">
                  <Plus size={14} /> Add History
                </button>
              </div>

              {experienceList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                  {experienceList.map((exp, idx) => (
                    <div key={idx} className="upload-row-item" style={{ flexWrap: 'wrap', gap: '12px' }}>
                      <input
                        type="text"
                        placeholder="Employer/Company"
                        value={exp.company_name}
                        onChange={(e) => updateExperienceRow(idx, 'company_name', e.target.value)}
                        style={{ flex: '1', minWidth: '130px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                      />
                      <input
                        type="text"
                        placeholder="Job Title"
                        value={exp.job_title}
                        onChange={(e) => updateExperienceRow(idx, 'job_title', e.target.value)}
                        style={{ flex: '1', minWidth: '130px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                      />
                      <input
                        type="date"
                        value={exp.start_date}
                        onChange={(e) => updateExperienceRow(idx, 'start_date', e.target.value)}
                        style={{ width: '130px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                      />
                      <input
                        type="date"
                        value={exp.end_date || ''}
                        onChange={(e) => updateExperienceRow(idx, 'end_date', e.target.value)}
                        style={{ width: '130px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                      />
                      <button onClick={() => removeExperienceRow(idx)} className="btn btn-outline" style={{ color: 'var(--error)', padding: '10px', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-badge" style={{ marginTop: '20px' }}>No experiences registered.</p>
              )}

              <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                <button onClick={handleUpdateExperience} className="btn btn-primary" disabled={submitting}>
                  Save Work Experience
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Leaves */}
          {activeTab === 'leaves' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Form submission */}
              <form onSubmit={handleApplyLeave} className="auth-form" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '30px' }}>
                <h3>Apply for Leave</h3>
                <p className="card-desc">File a new leave request (Sick, casual, annual, etc.) on behalf of this staff member.</p>

                <div className="grid-3">
                  <div className="input-group">
                    <label>Leave Type</label>
                    <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                      <option value="Annual Leave">Annual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Maternity Leave">Maternity Leave</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Start Date</label>
                    <input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>End Date</label>
                    <input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} required />
                  </div>
                </div>

                <div className="input-group">
                  <label>Reason / Explanation</label>
                  <textarea rows={3} value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} style={{ padding: '12px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', outline: 'none' }} />
                </div>

                <div>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    File Leave Request
                  </button>
                </div>
              </form>

              {/* Leaves ledger */}
              <div>
                <h3>Leaves History Log</h3>
                <p className="card-desc">Review filed leaves.</p>

                {staff.leaves.length > 0 ? (
                  <div className="downloads-table-container" style={{ marginTop: '16px' }}>
                    <table className="downloads-table">
                      <thead>
                        <tr>
                          <th>Leave Type</th>
                          <th>Duration</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staff.leaves.map((lv) => (
                          <tr key={lv.id}>
                            <td><strong>{lv.leave_type}</strong></td>
                            <td>{lv.start_date} to {lv.end_date}</td>
                            <td>{lv.reason || 'None'}</td>
                            <td>
                              <span className={`badge ${lv.status === 'Approved' ? 'badge-permission' : (lv.status === 'Rejected' ? 'badge-error' : 'badge-role')}`}>
                                {lv.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {lv.status === 'Pending' ? (
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button onClick={() => handleLeaveApproval(lv.id, 'Approved')} className="btn btn-outline btn-sm" style={{ color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                                    <CheckCircle size={14} /> Approve
                                  </button>
                                  <button onClick={() => handleLeaveApproval(lv.id, 'Rejected')} className="btn btn-outline btn-sm" style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                                    <XCircle size={14} /> Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="card-desc" style={{ fontSize: '11px' }}>Processed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-badge" style={{ marginTop: '10px' }}>No leave history logged.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminStaffDossier;
