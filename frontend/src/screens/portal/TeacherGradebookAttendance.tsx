import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Calendar, Award, FileText, CheckCircle, Plus, Save } from 'lucide-react';

interface Semester {
  id: number;
  name: string;
  code: string;
}

interface Subject {
  id: number;
  name_en: string;
  code: string;
}

interface CourseSection {
  id: number;
  subject_id: number;
  subject?: Subject;
  semester_id: number;
  semester?: Semester;
  code: string;
  section: string;
}

interface AttendanceStudent {
  student_id: number;
  student_id_number: string;
  name: string;
  status_id: number;
  remarks: string;
}

interface Assignment {
  id: number;
  title: string;
  description?: string;
  max_marks: number;
  due_date: string;
}

interface SubmissionRecord {
  submission_id?: number | null;
  student_id: number;
  student_id_number: string;
  name: string;
  file_path?: string | null;
  submitted_at?: string | null;
  marks_obtained?: number | null;
  feedback?: string;
}

interface GradebookStudent {
  student_id: number;
  student_id_number: string;
  name: string;
  midterm_marks: number;
  assignment_avg: number;
  final_exam_marks: number;
  final_score: number;
  grade_id: number;
  letter_grade: string;
}

const TeacherGradebookAttendance: React.FC = () => {
  const [courses, setCourses] = useState<CourseSection[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'assignments' | 'gradebook'>('attendance');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Sub-Tab 1: Attendance State
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceStudent[]>([]);

  // Sub-Tab 2: Assignments State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number>(0);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);

  // Assignment Creation Form
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignMaxMarks, setAssignMaxMarks] = useState(20);
  const [assignDueDate, setAssignDueDate] = useState(new Date().toISOString().slice(0, 10));

  // Sub-Tab 3: Gradebook State
  const [gradebookRecords, setGradebookRecords] = useState<GradebookStudent[]>([]);

  useEffect(() => {
    fetchTeacherCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId > 0) {
      handleTabFetch();
    }
  }, [selectedCourseId, activeSubTab, attendanceDate, selectedAssignmentId]);

  const fetchTeacherCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/academic/courses'); // In production, filters courses assigned to current teacher
      setCourses(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedCourseId(response.data.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabFetch = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'attendance') {
        const response = await api.get(`/shareea/courses/${selectedCourseId}/attendance`, {
          params: { date: attendanceDate }
        });
        setAttendanceRecords(response.data.data.records);
      } else if (activeSubTab === 'assignments') {
        const response = await api.get(`/shareea/courses/${selectedCourseId}/assignments`);
        setAssignments(response.data.data);
        if (response.data.data.length > 0) {
          const firstAssignId = response.data.data[0].id;
          if (selectedAssignmentId === 0) {
            setSelectedAssignmentId(firstAssignId);
          } else {
            const subRes = await api.get(`/shareea/assignments/${selectedAssignmentId}/submissions`);
            setSubmissions(subRes.data.data.records);
          }
        } else {
          setSubmissions([]);
        }
      } else if (activeSubTab === 'gradebook') {
        const response = await api.get(`/shareea/courses/${selectedCourseId}/gradebook`);
        setGradebookRecords(response.data.data.records);
      }
    } catch (error) {
      toast.error('Failed to retrieve class details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendance = async () => {
    setActionLoading(true);
    const toastId = toast.loading('Filing attendance register...');
    try {
      await api.post(`/shareea/courses/${selectedCourseId}/attendance`, {
        date: attendanceDate,
        records: attendanceRecords.map(r => ({
          student_id: r.student_id,
          status_id: r.status_id,
          remarks: r.remarks
        }))
      });
      toast.success('Attendance saved successfully!', { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save attendance.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    const toastId = toast.loading('Posting assignment...');
    try {
      await api.post(`/shareea/courses/${selectedCourseId}/assignments`, {
        title: assignTitle,
        description: assignDesc,
        max_marks: assignMaxMarks,
        due_date: assignDueDate,
      });
      toast.success('Assignment posted!', { id: toastId });
      setShowAssignModal(false);
      setAssignTitle('');
      setAssignDesc('');
      setActiveSubTab('assignments');
      setSelectedAssignmentId(0); // reset to fetch first
      handleTabFetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to post.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGradeSubmission = async (studentId: number, marks: number, feedback: string) => {
    const toastId = toast.loading('Saving assignment score...');
    try {
      await api.post(`/shareea/assignments/${selectedAssignmentId}/grade`, {
        student_id: studentId,
        marks_obtained: marks,
        feedback: feedback,
      });
      toast.success('Score saved!', { id: toastId });
      handleTabFetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save score.', { id: toastId });
    }
  };

  const handleSaveGradebook = async () => {
    setActionLoading(true);
    const toastId = toast.loading('Locking exam grades...');
    try {
      await api.post(`/shareea/courses/${selectedCourseId}/gradebook`, {
        records: gradebookRecords.map(r => ({
          student_id: r.student_id,
          midterm_marks: r.midterm_marks,
          final_exam_marks: r.final_exam_marks,
        }))
      });
      toast.success('Grades locked successfully!', { id: toastId });
      handleTabFetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save gradebook.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const updateAttendanceStatus = (studentId: number, statusId: number) => {
    const records = attendanceRecords.map(r => {
      if (r.student_id === studentId) {
        return { ...r, status_id: statusId };
      }
      return r;
    });
    setAttendanceRecords(records);
  };

  const updateAttendanceRemarks = (studentId: number, val: string) => {
    const records = attendanceRecords.map(r => {
      if (r.student_id === studentId) {
        return { ...r, remarks: val };
      }
      return r;
    });
    setAttendanceRecords(records);
  };

  const updateGradebookField = (studentId: number, key: 'midterm_marks' | 'final_exam_marks', val: number) => {
    const records = gradebookRecords.map(r => {
      if (r.student_id === studentId) {
        return { ...r, [key]: val };
      }
      return r;
    });
    setGradebookRecords(records);
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Portal</span>
          <span className="badge badge-role">Faculty Gradebook Console</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>Faculty Board Gradebook</h1>
            <p>Administer class attendance rolls, post coursework assignments, and register course final grades.</p>
          </div>
          
          <div className="input-group" style={{ margin: '0', minWidth: '280px' }}>
            <select value={selectedCourseId} onChange={(e) => { setSelectedCourseId(parseInt(e.target.value)); setSelectedAssignmentId(0); }}>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.subject?.name_en} ({c.code}) - {c.section}</option>
              ))}
            </select>
          </div>
        </header>

        {/* Subtab selection */}
        <div className="news-tabs" style={{ justifyContent: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '30px', flexWrap: 'wrap', gap: '8px' }}>
          <button onClick={() => setActiveSubTab('attendance')} className={`tab-btn ${activeSubTab === 'attendance' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Class Attendance
          </button>
          <button onClick={() => setActiveSubTab('assignments')} className={`tab-btn ${activeSubTab === 'assignments' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} /> Assignments & Tasks
          </button>
          <button onClick={() => setActiveSubTab('gradebook')} className={`tab-btn ${activeSubTab === 'gradebook' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={14} /> Gradebook ledger
          </button>
        </div>

        {loading ? (
          <div className="spinner-center" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
            <p>Loading course files...</p>
          </div>
        ) : (
          <div className="dashboard-card">
            
            {/* SUBTAB 1: ATTENDANCE */}
            {activeSubTab === 'attendance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div className="input-group" style={{ margin: '0', maxWidth: '240px' }}>
                    <label>Attendance Register Date</label>
                    <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
                  </div>
                  <button onClick={handleSaveAttendance} className="btn btn-primary" disabled={actionLoading}>
                    <Save size={14} /> Save Attendance Roll
                  </button>
                </div>

                {attendanceRecords.length > 0 ? (
                  <div className="downloads-table-container">
                    <table className="downloads-table">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Student Name</th>
                          <th>Attendance Status</th>
                          <th>Teacher Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceRecords.map((r) => (
                          <tr key={r.student_id}>
                            <td><code>{r.student_id_number}</code></td>
                            <td><strong>{r.name}</strong></td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => updateAttendanceStatus(r.student_id, 1)} className={`btn btn-sm ${r.status_id === 1 ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '4px 10px', fontSize: '11px' }}>Present</button>
                                <button onClick={() => updateAttendanceStatus(r.student_id, 2)} className={`btn btn-sm ${r.status_id === 2 ? 'btn-outline' : 'btn-outline'}`} style={{ padding: '4px 10px', fontSize: '11px', color: r.status_id === 2 ? 'var(--error)' : '#cbd5e1', borderColor: r.status_id === 2 ? 'var(--error)' : 'rgba(255,255,255,0.1)' }}>Absent</button>
                                <button onClick={() => updateAttendanceStatus(r.student_id, 3)} className={`btn btn-sm ${r.status_id === 3 ? 'btn-outline' : 'btn-outline'}`} style={{ padding: '4px 10px', fontSize: '11px', color: r.status_id === 3 ? 'var(--warning)' : '#cbd5e1', borderColor: r.status_id === 3 ? 'var(--warning)' : 'rgba(255,255,255,0.1)' }}>Late</button>
                                <button onClick={() => updateAttendanceStatus(r.student_id, 4)} className={`btn btn-sm ${r.status_id === 4 ? 'btn-outline' : 'btn-outline'}`} style={{ padding: '4px 10px', fontSize: '11px', color: r.status_id === 4 ? 'var(--primary)' : '#cbd5e1', borderColor: r.status_id === 4 ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}>Excused</button>
                              </div>
                            </td>
                            <td>
                              <input
                                type="text"
                                placeholder="Add notes..."
                                value={r.remarks}
                                onChange={(e) => updateAttendanceRemarks(r.student_id, e.target.value)}
                                style={{ padding: '6px 12px', background: 'rgba(9,13,22,0.6)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', width: '100%', fontSize: '12px' }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-badge">No students enrolled in this course section.</p>
                )}
              </div>
            )}

            {/* SUBTAB 2: ASSIGNMENTS */}
            {activeSubTab === 'assignments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="input-group" style={{ margin: '0', minWidth: '220px' }}>
                      <select value={selectedAssignmentId} onChange={(e) => setSelectedAssignmentId(parseInt(e.target.value))}>
                        {assignments.map(a => (
                          <option key={a.id} value={a.id}>{a.title} (Max: {a.max_marks})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button onClick={() => setShowAssignModal(true)} className="btn btn-outline btn-sm flex-center">
                    <Plus size={14} /> New Assignment
                  </button>
                </div>

                {selectedAssignmentId > 0 && submissions.length > 0 ? (
                  <div>
                    <h3 style={{ fontSize: '15px', color: 'white', marginBottom: '14px' }}>Submission Ledger</h3>
                    <div className="downloads-table-container">
                      <table className="downloads-table">
                        <thead>
                          <tr>
                            <th>Student ID</th>
                            <th>Student Name</th>
                            <th>Status</th>
                            <th>Marks Obtained</th>
                            <th>Feedback Notes</th>
                            <th style={{ textAlign: 'center' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.map((sub) => {
                            const [mObtained, setMObtained] = useState<string>(sub.marks_obtained !== null ? String(sub.marks_obtained) : '');
                            const [feedbackVal, setFeedbackVal] = useState<string>(sub.feedback || '');

                            return (
                              <tr key={sub.student_id}>
                                <td><code>{sub.student_id_number}</code></td>
                                <td><strong>{sub.name}</strong></td>
                                <td>
                                  {sub.submission_id ? (
                                    <span className="badge badge-permission">Submitted</span>
                                  ) : (
                                    <span className="badge badge-error">Missing</span>
                                  )}
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    min={0}
                                    placeholder="Score"
                                    value={mObtained}
                                    onChange={(e) => setMObtained(e.target.value)}
                                    style={{ width: '80px', padding: '6px', background: 'rgba(9,13,22,0.6)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    placeholder="Add feedback notes..."
                                    value={feedbackVal}
                                    onChange={(e) => setFeedbackVal(e.target.value)}
                                    style={{ width: '100%', padding: '6px', background: 'rgba(9,13,22,0.6)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                                  />
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    onClick={() => handleGradeSubmission(sub.student_id, parseFloat(mObtained) || 0, feedbackVal)}
                                    className="btn btn-primary btn-sm"
                                    style={{ padding: '6px 12px', fontSize: '11px', margin: '0 auto' }}
                                  >
                                    Save Grade
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="no-badge">No assignments posted, or no student submissions recorded.</p>
                )}
              </div>
            )}

            {/* SUBTAB 3: GRADEBOOK LEDGER */}
            {activeSubTab === 'gradebook' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Term Grading Sheet</h3>
                  <button onClick={handleSaveGradebook} className="btn btn-primary" disabled={actionLoading}>
                    <CheckCircle size={14} /> Lock & Publish Grades
                  </button>
                </div>
                <p className="card-desc">Save midterm & final exam scores. System automatically calculates letter grades (Midterm 30%, Assignments 30%, Final 40%).</p>

                {gradebookRecords.length > 0 ? (
                  <div className="downloads-table-container">
                    <table className="downloads-table">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Student Name</th>
                          <th>Midterm (30%)</th>
                          <th>Assignments (30%)</th>
                          <th>Final Exam (40%)</th>
                          <th>Final score</th>
                          <th>Final letter grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gradebookRecords.map((r) => (
                          <tr key={r.student_id}>
                            <td><code>{r.student_id_number}</code></td>
                            <td><strong>{r.name}</strong></td>
                            <td>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={r.midterm_marks}
                                onChange={(e) => updateGradebookField(r.student_id, 'midterm_marks', parseFloat(e.target.value) || 0)}
                                style={{ width: '90px', padding: '6px', background: 'rgba(9,13,22,0.6)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                              />
                            </td>
                            <td>
                              <span className="badge badge-role">{r.assignment_avg.toFixed(2)} / 100</span>
                            </td>
                            <td>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={r.final_exam_marks}
                                onChange={(e) => updateGradebookField(r.student_id, 'final_exam_marks', parseFloat(e.target.value) || 0)}
                                style={{ width: '90px', padding: '6px', background: 'rgba(9,13,22,0.6)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                              />
                            </td>
                            <td><strong>{r.final_score.toFixed(2)} %</strong></td>
                            <td>
                              <span className={`badge ${r.letter_grade === 'F' ? 'badge-error' : 'badge-permission'}`}>
                                {r.letter_grade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-badge">No student enrollments registered.</p>
                )}
              </div>
            )}

          </div>
        )}

        {/* Modal: Create Assignment */}
        {showAssignModal && (
          <div className="fullscreen-loader" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
            <div className="auth-card" style={{ maxWidth: '500px', width: '100%' }}>
              <div className="auth-header">
                <h2>Post New Course Assignment</h2>
                <p>Register coursework tasks with marks weightage.</p>
              </div>
              <form onSubmit={handleCreateAssignment} className="auth-form">
                <div className="input-group">
                  <label>Assignment Title</label>
                  <input type="text" placeholder="e.g. Fiqh Summary Paper" value={assignTitle} onChange={(e) => setAssignTitle(e.target.value)} required />
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label>Maximum Marks</label>
                    <input type="number" value={assignMaxMarks} onChange={(e) => setAssignMaxMarks(parseInt(e.target.value) || 20)} required />
                  </div>
                  <div className="input-group">
                    <label>Due Date</label>
                    <input type="date" value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)} required />
                  </div>
                </div>
                <div className="input-group">
                  <label>Guidelines / Details</label>
                  <textarea rows={3} value={assignDesc} onChange={(e) => setAssignDesc(e.target.value)} style={{ padding: '10px', background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-glass)', borderRadius: '10px', color: '#fff', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: '1' }}>
                    Post Assignment
                  </button>
                  <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-outline">
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

export default TeacherGradebookAttendance;
