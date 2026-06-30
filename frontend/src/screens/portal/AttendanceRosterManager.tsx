import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Users, Clock, Save, QrCode } from 'lucide-react';

interface CourseSection {
  id: number;
  code: string;
  section: string;
  subject?: {
    name_en: string;
  };
}

interface StudentRecord {
  student_id: number;
  student_id_number: string;
  name: string;
  status_id: number;
  remarks: string;
}

interface StaffRecord {
  user_id: number;
  name: string;
  email: string;
  status_id: number;
  clock_in: string | null;
  clock_out: string | null;
  remarks: string;
}

const AttendanceRosterManager: React.FC = () => {
  const [courses, setCourses] = useState<CourseSection[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'student' | 'staff'>('student');
  const [loading, setLoading] = useState(true);

  // Student Tab parameters
  const [studentDate, setStudentDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [studentQrCode, setStudentQrCode] = useState('');

  // Staff Tab parameters
  const [staffDate, setStaffDate] = useState(new Date().toISOString().slice(0, 10));
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [staffQrCode, setStaffQrCode] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (activeTab === 'student' && selectedCourseId > 0) {
      fetchStudentRoster();
    } else if (activeTab === 'staff') {
      fetchStaffRoster();
    }
  }, [activeTab, selectedCourseId, studentDate, staffDate]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/academic/courses');
      setCourses(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedCourseId(response.data.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load course sections.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentRoster = async () => {
    setLoading(true);
    try {
      const response = await api.get('/attendance/students', {
        params: { course_id: selectedCourseId, date: studentDate }
      });
      setStudents(response.data.data.records);
    } catch (error) {
      toast.error('Failed to load student roster.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffRoster = async () => {
    setLoading(true);
    try {
      const response = await api.get('/attendance/staff', {
        params: { date: staffDate }
      });
      setStaffList(response.data.data.records);
    } catch (error) {
      toast.error('Failed to load staff roster.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentBulkMark = (statusId: number) => {
    const updated = students.map(s => ({ ...s, status_id: statusId }));
    setStudents(updated);
  };

  const handleStaffBulkMark = (statusId: number) => {
    const updated = staffList.map(s => ({ ...s, status_id: statusId }));
    setStaffList(updated);
  };

  const handleSaveStudents = async () => {
    const toastId = toast.loading('Saving student logs...');
    try {
      await api.post('/attendance/students/bulk', {
        course_id: selectedCourseId,
        date: studentDate,
        records: students.map(s => ({
          student_id: s.student_id,
          status_id: s.status_id,
          remarks: s.remarks
        }))
      });
      toast.success('Roster saved successfully!', { id: toastId });
    } catch (error) {
      toast.error('Failed to save student registers.', { id: toastId });
    }
  };

  const handleSaveStaff = async () => {
    const toastId = toast.loading('Saving staff check-ins...');
    try {
      await api.post('/attendance/staff/bulk', {
        date: staffDate,
        records: staffList.map(s => ({
          user_id: s.user_id,
          status_id: s.status_id,
          clock_in: s.clock_in,
          clock_out: s.clock_out,
          remarks: s.remarks
        }))
      });
      toast.success('Staff register updated!', { id: toastId });
    } catch (error) {
      toast.error('Failed to save staff logs.', { id: toastId });
    }
  };

  const handleQRStudentCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentQrCode) return;
    const toastId = toast.loading('Processing QR simulated scan...');
    try {
      await api.post('/attendance/students/qr', {
        course_id: selectedCourseId,
        student_id_number: studentQrCode,
      });
      toast.success(`Check-in logged for student ID ${studentQrCode}!`, { id: toastId });
      setStudentQrCode('');
      fetchStudentRoster();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'QR Check-in failed.', { id: toastId });
    }
  };

  const handleQRStaffCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffQrCode) return;
    const toastId = toast.loading('Processing clock card...');
    try {
      await api.post('/attendance/staff/qr', {
        email: staffQrCode,
      });
      toast.success(`Clock state updated for ${staffQrCode}!`, { id: toastId });
      setStaffQrCode('');
      fetchStaffRoster();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'QR Clock-in failed.', { id: toastId });
    }
  };

  const updateStudentStatus = (studentId: number, statusId: number) => {
    setStudents(students.map(s => s.student_id === studentId ? { ...s, status_id: statusId } : s));
  };

  const updateStudentRemarks = (studentId: number, notes: string) => {
    setStudents(students.map(s => s.student_id === studentId ? { ...s, remarks: notes } : s));
  };

  const updateStaffStatus = (userId: number, statusId: number) => {
    setStaffList(staffList.map(s => s.user_id === userId ? { ...s, status_id: statusId } : s));
  };

  const updateStaffTime = (userId: number, key: 'clock_in' | 'clock_out', val: string) => {
    setStaffList(staffList.map(s => s.user_id === userId ? { ...s, [key]: val } : s));
  };

  const updateStaffRemarks = (userId: number, notes: string) => {
    setStaffList(staffList.map(s => s.user_id === userId ? { ...s, remarks: notes } : s));
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Registrar</span>
          <span className="badge badge-role">Roster Attendance Roll</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>Attendance Register Sheets</h1>
            <p>Administer daily student attendance rosters or review teacher clock cards.</p>
          </div>

          {/* Sub-tabs selector */}
          <div className="news-tabs" style={{ margin: '0', display: 'flex', gap: '8px', border: 'none' }}>
            <button onClick={() => setActiveTab('student')} className={`tab-btn ${activeTab === 'student' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} /> Student Registers
            </button>
            <button onClick={() => setActiveTab('staff')} className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} /> Teacher Clock Cards
            </button>
          </div>
        </header>

        {/* TAB 1: STUDENT ATTENDANCE SECTION */}
        {activeTab === 'student' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Filter controls and QR Simulator */}
            <div className="grid-2" style={{ margin: '0' }}>
              <div className="dashboard-card" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'end' }}>
                <div className="input-group" style={{ margin: '0', flex: '1', minWidth: '200px' }}>
                  <label>Class Section</label>
                  <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(parseInt(e.target.value))}>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.subject?.name_en} ({c.code}) - {c.section}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group" style={{ margin: '0', width: '160px' }}>
                  <label>Calendar Date</label>
                  <input type="date" value={studentDate} onChange={(e) => setStudentDate(e.target.value)} />
                </div>
              </div>

              {/* QR Simulator check-in */}
              <div className="dashboard-card" style={{ padding: '20px' }}>
                <form onSubmit={handleQRStudentCheck} className="input-group" style={{ margin: '0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><QrCode size={14} /> QR Simulated Check-in</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Type Student Registration ID (e.g. STU-1002)..."
                      value={studentQrCode}
                      onChange={(e) => setStudentQrCode(e.target.value)}
                    />
                    <button type="submit" className="btn btn-outline flex-center" style={{ minWidth: '120px' }}>
                      Check-in
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Bulk modifiers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleStudentBulkMark(1)} className="btn btn-outline btn-sm" style={{ color: 'var(--success)', borderColor: 'rgba(16,185,129,0.2)' }}>Mark All Present</button>
                <button onClick={() => handleStudentBulkMark(2)} className="btn btn-outline btn-sm" style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}>Mark All Absent</button>
              </div>
              <button onClick={handleSaveStudents} className="btn btn-primary">
                <Save size={14} /> Save Student Register
              </button>
            </div>

            {/* Register grid table */}
            {loading ? (
              <div className="spinner-center" style={{ minHeight: '200px' }}>
                <div className="spinner"></div>
              </div>
            ) : students.length > 0 ? (
              <div className="dashboard-card">
                <div className="downloads-table-container">
                  <table className="downloads-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Attendance Check</th>
                        <th>Remarks / Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s.student_id}>
                          <td><code>{s.student_id_number}</code></td>
                          <td><strong>{s.name}</strong></td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => updateStudentStatus(s.student_id, 1)} className={`btn btn-sm ${s.status_id === 1 ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '4px 10px', fontSize: '11px' }}>Present</button>
                              <button onClick={() => updateStudentStatus(s.student_id, 2)} className={`btn btn-sm ${s.status_id === 2 ? 'btn-outline' : 'btn-outline'}`} style={{ padding: '4px 10px', fontSize: '11px', color: s.status_id === 2 ? 'var(--error)' : '#cbd5e1', borderColor: s.status_id === 2 ? 'var(--error)' : 'rgba(255,255,255,0.1)' }}>Absent</button>
                              <button onClick={() => updateStudentStatus(s.student_id, 3)} className={`btn btn-sm ${s.status_id === 3 ? 'btn-outline' : 'btn-outline'}`} style={{ padding: '4px 10px', fontSize: '11px', color: s.status_id === 3 ? 'var(--warning)' : '#cbd5e1', borderColor: s.status_id === 3 ? 'var(--warning)' : 'rgba(255,255,255,0.1)' }}>Late</button>
                              <button onClick={() => updateStudentStatus(s.student_id, 4)} className={`btn btn-sm ${s.status_id === 4 ? 'btn-outline' : 'btn-outline'}`} style={{ padding: '4px 10px', fontSize: '11px', color: s.status_id === 4 ? 'var(--primary)' : '#cbd5e1', borderColor: s.status_id === 4 ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}>Excused</button>
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="Notes..."
                              value={s.remarks}
                              onChange={(e) => updateStudentRemarks(s.student_id, e.target.value)}
                              style={{ padding: '6px 12px', background: 'rgba(9,13,22,0.6)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', width: '100%', fontSize: '12px' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="no-data">No students enrolled in this section.</div>
            )}

          </div>
        )}

        {/* TAB 2: STAFF CLOCK REGISTER SECTION */}
        {activeTab === 'staff' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Filter controls and QR Simulator */}
            <div className="grid-2" style={{ margin: '0' }}>
              <div className="dashboard-card" style={{ padding: '20px', display: 'flex', alignItems: 'end' }}>
                <div className="input-group" style={{ margin: '0', width: '100%' }}>
                  <label>Calendar Date</label>
                  <input type="date" value={staffDate} onChange={(e) => setStaffDate(e.target.value)} />
                </div>
              </div>

              {/* QR Simulator clock card */}
              <div className="dashboard-card" style={{ padding: '20px' }}>
                <form onSubmit={handleQRStaffCheck} className="input-group" style={{ margin: '0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><QrCode size={14} /> QR Simulated Clock Card</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="email"
                      placeholder="Type Staff Email Address..."
                      value={staffQrCode}
                      onChange={(e) => setStaffQrCode(e.target.value)}
                    />
                    <button type="submit" className="btn btn-outline flex-center" style={{ minWidth: '120px' }}>
                      Clock State
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Bulk modifiers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleStaffBulkMark(1)} className="btn btn-outline btn-sm" style={{ color: 'var(--success)', borderColor: 'rgba(16,185,129,0.2)' }}>Mark All Active</button>
                <button onClick={() => handleStaffBulkMark(2)} className="btn btn-outline btn-sm" style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}>Mark All Absent</button>
              </div>
              <button onClick={handleSaveStaff} className="btn btn-primary">
                <Save size={14} /> Save Staff Register
              </button>
            </div>

            {/* Register grid table */}
            {loading ? (
              <div className="spinner-center" style={{ minHeight: '200px' }}>
                <div className="spinner"></div>
              </div>
            ) : staffList.length > 0 ? (
              <div className="dashboard-card">
                <div className="downloads-table-container">
                  <table className="downloads-table">
                    <thead>
                      <tr>
                        <th>Faculty Member</th>
                        <th>Attendance Status</th>
                        <th>Clock In</th>
                        <th>Clock Out</th>
                        <th>Remarks / Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffList.map((s) => (
                        <tr key={s.user_id}>
                          <td>
                            <strong>{s.name}</strong>
                            <div className="card-desc" style={{ fontSize: '11px', margin: '2px 0 0' }}>{s.email}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => updateStaffStatus(s.user_id, 1)} className={`btn btn-sm ${s.status_id === 1 ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '4px 10px', fontSize: '11px' }}>Present</button>
                              <button onClick={() => updateStaffStatus(s.user_id, 2)} className={`btn btn-sm ${s.status_id === 2 ? 'btn-outline' : 'btn-outline'}`} style={{ padding: '4px 10px', fontSize: '11px', color: s.status_id === 2 ? 'var(--error)' : '#cbd5e1', borderColor: s.status_id === 2 ? 'var(--error)' : 'rgba(255,255,255,0.1)' }}>Absent</button>
                              <button onClick={() => updateStaffStatus(s.user_id, 3)} className={`btn btn-sm ${s.status_id === 3 ? 'btn-outline' : 'btn-outline'}`} style={{ padding: '4px 10px', fontSize: '11px', color: s.status_id === 3 ? 'var(--warning)' : '#cbd5e1', borderColor: s.status_id === 3 ? 'var(--warning)' : 'rgba(255,255,255,0.1)' }}>Late</button>
                            </div>
                          </td>
                          <td>
                            <input
                              type="time"
                              value={s.clock_in || ''}
                              onChange={(e) => updateStaffTime(s.user_id, 'clock_in', e.target.value)}
                              style={{ padding: '6px', background: 'rgba(9,13,22,0.6)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', fontSize: '12px', width: '120px' }}
                            />
                          </td>
                          <td>
                            <input
                              type="time"
                              value={s.clock_out || ''}
                              onChange={(e) => updateStaffTime(s.user_id, 'clock_out', e.target.value)}
                              style={{ padding: '6px', background: 'rgba(9,13,22,0.6)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', fontSize: '12px', width: '120px' }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="Notes..."
                              value={s.remarks}
                              onChange={(e) => updateStaffRemarks(s.user_id, e.target.value)}
                              style={{ padding: '6px 12px', background: 'rgba(9,13,22,0.6)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', width: '100%', fontSize: '12px' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="no-data">No teachers or staff members registered.</div>
            )}

          </div>
        )}

      </main>
    </div>
  );
};

export default AttendanceRosterManager;
