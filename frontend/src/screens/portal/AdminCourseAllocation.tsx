import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Plus, Edit2, UserCheck } from 'lucide-react';

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

interface Teacher {
  id: number;
  teacher_id_number: string;
  user?: {
    name: string;
  };
}

interface CourseSection {
  id: number;
  subject_id: number;
  subject?: Subject;
  semester_id: number;
  semester?: Semester;
  teacher_id?: number | null;
  teacher?: Teacher;
  code: string;
  section: string;
  capacity: number;
}

const AdminCourseAllocation: React.FC = () => {
  const [courses, setCourses] = useState<CourseSection[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Active filters
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>('');

  // Modals fields
  const [showModal, setShowModal] = useState(false);
  const [editCourseId, setEditCourseId] = useState<number | null>(null);

  const [cSubjectId, setCSubjectId] = useState<number>(0);
  const [cSemesterId, setCSemesterId] = useState<number>(0);
  const [cTeacherId, setCTeacherId] = useState<string>('');
  const [cCode, setCCode] = useState('');
  const [cSection, setCSection] = useState('Section A');
  const [cCapacity, setCCapacity] = useState(40);

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [selectedSemesterFilter]);

  const fetchBaseData = async () => {
    try {
      const semRes = await api.get('/admin/academic/semesters');
      setSemesters(semRes.data.data);
      if (semRes.data.data.length > 0) {
        setSelectedSemesterFilter(String(semRes.data.data[0].id));
      }

      const subRes = await api.get('/admin/academic/subjects');
      setSubjects(subRes.data.data);

      const teachRes = await api.get('/admin/teachers');
      setTeachers(teachRes.data.data.teachers);
    } catch (error) {
      toast.error('Failed to load academic calibration parameters.');
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/academic/courses', {
        params: { semester_id: selectedSemesterFilter || undefined }
      });
      setCourses(response.data.data);
    } catch (error) {
      toast.error('Failed to load course sections.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateCourse = () => {
    setEditCourseId(null);
    setShowModal(true);
    setCCode('');
    setCSection('Section A');
    setCCapacity(40);
    setCTeacherId('');
    if (subjects.length > 0) setCSubjectId(subjects[0].id);
    if (semesters.length > 0) setCSemesterId(semesters[0].id);
  };

  const handleOpenEditCourse = (c: CourseSection) => {
    setEditCourseId(c.id);
    setShowModal(true);
    setCSubjectId(c.subject_id);
    setCSemesterId(c.semester_id);
    setCTeacherId(c.teacher_id ? String(c.teacher_id) : '');
    setCCode(c.code);
    setCSection(c.section);
    setCCapacity(c.capacity);
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Saving course section...');
    try {
      const payload = {
        subject_id: cSubjectId,
        semester_id: cSemesterId,
        teacher_id: cTeacherId ? parseInt(cTeacherId) : null,
        code: cCode,
        section: cSection,
        capacity: cCapacity,
      };

      if (editCourseId) {
        await api.post(`/admin/academic/courses/${editCourseId}/update`, payload);
      } else {
        await api.post('/admin/academic/courses', payload);
      }

      toast.success('Course section updated successfully!', { id: toastId });
      setShowModal(false);
      fetchCourses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transaction failed.', { id: toastId });
    }
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Registrar</span>
          <span className="badge badge-role">Course Allocation & Sections</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>Course Allocation Grid</h1>
            <p>Define active class sections, allocate capacities, and assign teachers for current semesters.</p>
          </div>
          <button onClick={handleOpenCreateCourse} className="btn btn-primary btn-sm flex-center">
            <Plus size={14} /> Open Class Section
          </button>
        </header>

        {/* Filter bar */}
        <div className="dashboard-card" style={{ marginBottom: '30px', padding: '20px' }}>
          <div className="input-group" style={{ maxWidth: '400px', margin: '0' }}>
            <label>Select Semester Term</label>
            <select value={selectedSemesterFilter} onChange={(e) => setSelectedSemesterFilter(e.target.value)}>
              <option value="">All Semesters</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Course sections ledger */}
        {loading ? (
          <div className="spinner-center" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
            <p>Loading class sections...</p>
          </div>
        ) : courses.length > 0 ? (
          <div className="dashboard-card">
            <div className="downloads-table-container">
              <table className="downloads-table">
                <thead>
                  <tr>
                    <th>Section Code</th>
                    <th>Subject</th>
                    <th>Semester</th>
                    <th>Section</th>
                    <th>Capacity</th>
                    <th>Faculty Allocation</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id}>
                      <td><code>{c.code}</code></td>
                      <td>
                        <strong style={{ color: 'white' }}>{c.subject?.name_en}</strong>
                        <div className="card-desc" style={{ fontSize: '11px', margin: '2px 0 0' }}>Code: {c.subject?.code}</div>
                      </td>
                      <td>{c.semester?.name}</td>
                      <td><span className="badge badge-role">{c.section}</span></td>
                      <td><strong>{c.capacity}</strong> Seats</td>
                      <td>
                        {c.teacher ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <UserCheck size={14} style={{ color: 'var(--success)' }} />
                            <span>{c.teacher.user?.name} (ID: {c.teacher.teacher_id_number})</span>
                          </div>
                        ) : (
                          <span className="no-badge" style={{ color: 'var(--warning)', fontStyle: 'normal' }}>⚠️ Unassigned</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handleOpenEditCourse(c)} className="btn btn-outline btn-sm" style={{ margin: '0 auto' }}>
                          <Edit2 size={12} style={{ marginRight: '6px' }} /> Allocate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="no-data">No course sections registered for this term.</div>
        )}

        {/* Modal: Create/Edit Course Section */}
        {showModal && (
          <div className="fullscreen-loader" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
            <div className="auth-card" style={{ maxWidth: '580px', width: '100%' }}>
              <div className="auth-header">
                <h2>{editCourseId ? 'Configure Section & Allocation' : 'Open Class Section'}</h2>
                <p>Configure enrollment caps and allocate teacher boards.</p>
              </div>
              <form onSubmit={handleCourseSubmit} className="auth-form">
                
                <div className="grid-2">
                  <div className="input-group">
                    <label>Syllabus Subject</label>
                    <select value={cSubjectId} onChange={(e) => setCSubjectId(parseInt(e.target.value))}>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.code} - {s.name_en}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Active Semester</label>
                    <select value={cSemesterId} onChange={(e) => setCSemesterId(parseInt(e.target.value))}>
                      {semesters.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label>Section Code</label>
                    <input type="text" placeholder="e.g. ARA101-SEC1" value={cCode} onChange={(e) => setCCode(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Section Name</label>
                    <input type="text" placeholder="e.g. Section A" value={cSection} onChange={(e) => setCSection(e.target.value)} required />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label>Maximum Capacity (Seats)</label>
                    <input type="number" min={1} value={cCapacity} onChange={(e) => setCCapacity(parseInt(e.target.value) || 40)} required />
                  </div>
                  <div className="input-group">
                    <label>Allocate Faculty (Optional)</label>
                    <select value={cTeacherId} onChange={(e) => setCTeacherId(e.target.value)}>
                      <option value="">-- Leave Unassigned --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.user?.name} ({t.teacher_id_number})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: '1' }}>
                    Save Allocation
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
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

export default AdminCourseAllocation;
