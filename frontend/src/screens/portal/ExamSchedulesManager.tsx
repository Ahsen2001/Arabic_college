import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Calendar, Plus } from 'lucide-react';

interface CourseSection {
  id: number;
  code: string;
  section: string;
  subject?: {
    name_en: string;
  };
}

interface ExamType {
  id: number;
  name: string;
}

interface ExaminationSchedule {
  id: number;
  course_id: number;
  course?: CourseSection;
  exam_type_id: number;
  name: string;
  exam_date: string;
  max_marks: number;
  weightage_percentage: number;
  is_published: boolean;
}

const ExamSchedulesManager: React.FC = () => {
  const [schedules, setSchedules] = useState<ExaminationSchedule[]>([]);
  const [courses, setCourses] = useState<CourseSection[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [showModal, setShowModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [selectedExamTypeId, setSelectedExamTypeId] = useState<number>(1);
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().slice(0, 10));
  const [maxMarks, setMaxMarks] = useState(100);
  const [weightage, setWeightage] = useState(40);

  useEffect(() => {
    fetchBaseData();
  }, []);

  const fetchBaseData = async () => {
    setLoading(true);
    try {
      const schRes = await api.get('/exams/schedules');
      setSchedules(schRes.data.data);

      const crsRes = await api.get('/admin/academic/courses');
      setCourses(crsRes.data.data);
      if (crsRes.data.data.length > 0) {
        setSelectedCourseId(crsRes.data.data[0].id);
      }

      // Hardcoded or fetched exam types lookup
      setExamTypes([
        { id: 1, name: 'Quiz' },
        { id: 2, name: 'Midterm' },
        { id: 3, name: 'Final' },
        { id: 4, name: 'Assignment' },
        { id: 5, name: 'Practical' },
      ]);
    } catch (error) {
      toast.error('Failed to load academic records.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Scheduling exam term...');
    try {
      await api.post('/exams/schedules', {
        course_id: selectedCourseId,
        exam_type_id: selectedExamTypeId,
        name: examName,
        exam_date: examDate,
        max_marks: maxMarks,
        weightage_percentage: weightage,
      });
      toast.success('Exam schedule created successfully!', { id: toastId });
      setShowModal(false);
      setExamName('');
      
      // Refresh list
      const schRes = await api.get('/exams/schedules');
      setSchedules(schRes.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create schedule.', { id: toastId });
    }
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Portal</span>
          <span className="badge badge-role">Examinations Scheduler</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>Exam Schedules Ledger</h1>
            <p>Schedule assessment calendars and record grade points weightages.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm flex-center">
            <Plus size={14} /> Schedule Exam
          </button>
        </header>

        {loading ? (
          <div className="spinner-center" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
          </div>
        ) : schedules.length > 0 ? (
          <div className="dashboard-card">
            <div className="downloads-table-container">
              <table className="downloads-table">
                <thead>
                  <tr>
                    <th>Exam Title</th>
                    <th>Course Subject</th>
                    <th>Date Scheduled</th>
                    <th>Weight (Marks)</th>
                    <th>Weightage (%)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong style={{ color: 'white' }}>{s.name}</strong>
                        <div className="card-desc" style={{ fontSize: '11px', margin: '2px 0 0' }}>Type: {examTypes.find(t => t.id === s.exam_type_id)?.name}</div>
                      </td>
                      <td>
                        <span>{s.course?.subject?.name_en}</span>
                        <div className="card-desc" style={{ fontSize: '11px', margin: '2px 0 0' }}>Section: {s.course?.code} ({s.course?.section})</div>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} style={{ color: 'var(--primary)' }} />
                          {s.exam_date}
                        </span>
                      </td>
                      <td><strong>{s.max_marks}</strong> Max Marks</td>
                      <td><span className="badge badge-role">{s.weightage_percentage}% Weight</span></td>
                      <td>
                        <span className={`badge ${s.is_published ? 'badge-permission' : 'badge-role'}`}>
                          {s.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="no-data">No examination terms scheduled yet.</div>
        )}

        {/* Modal: Schedule Exam */}
        {showModal && (
          <div className="fullscreen-loader" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
            <div className="auth-card" style={{ maxWidth: '540px', width: '100%' }}>
              <div className="auth-header">
                <h2>Schedule New Examination</h2>
                <p>Register active term assessment calendars.</p>
              </div>
              <form onSubmit={handleCreateSchedule} className="auth-form">
                <div className="input-group">
                  <label>Syllabus Course Section</label>
                  <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(parseInt(e.target.value))}>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.subject?.name_en} ({c.code}) - {c.section}</option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label>Exam Type</label>
                    <select value={selectedExamTypeId} onChange={(e) => setSelectedExamTypeId(parseInt(e.target.value))}>
                      {examTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Exam Date</label>
                    <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} required />
                  </div>
                </div>

                <div className="input-group">
                  <label>Examination Title</label>
                  <input type="text" placeholder="e.g. Midterm Evaluation Part 1" value={examName} onChange={(e) => setExamName(e.target.value)} required />
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label>Maximum Marks (Out of)</label>
                    <input type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(parseInt(e.target.value) || 100)} required />
                  </div>
                  <div className="input-group">
                    <label>Grade Weightage (%)</label>
                    <input type="number" min={0} max={100} value={weightage} onChange={(e) => setWeightage(parseInt(e.target.value) || 40)} required />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: '1' }}>
                    Save Schedule
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

export default ExamSchedulesManager;
