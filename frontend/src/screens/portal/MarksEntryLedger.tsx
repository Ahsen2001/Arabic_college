import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Save, Printer, Eye, EyeOff } from 'lucide-react';

interface CourseSection {
  id: number;
  code: string;
  section: string;
  subject?: {
    name_en: string;
  };
}

interface Examination {
  id: number;
  name: string;
  max_marks: number;
  weightage_percentage: number;
  is_published: boolean;
  course?: CourseSection;
}

interface MarkRecord {
  student_id: number;
  student_id_number: string;
  name: string;
  marks_obtained: number;
  grade_id?: number | null;
  letter_grade?: string;
  remarks: string;
}

const MarksEntryLedger: React.FC = () => {
  const [exams, setExams] = useState<Examination[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number>(0);
  const [records, setRecords] = useState<MarkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Grade references for calculations on the fly
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExamId > 0) {
      fetchMarksSheet();
    }
  }, [selectedExamId]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await api.get('/exams/schedules');
      setExams(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedExamId(response.data.data[0].id);
      }

      // Set grade boundaries for on-the-fly letter calculation
      setGrades([
        { letter: 'A+', min: 95 },
        { letter: 'A',  min: 90 },
        { letter: 'B+', min: 85 },
        { letter: 'B',  min: 80 },
        { letter: 'C+', min: 75 },
        { letter: 'C',  min: 70 },
        { letter: 'D',  min: 60 },
        { letter: 'F',  min: 0 },
      ]);
    } catch (error) {
      toast.error('Failed to load exam schedules.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMarksSheet = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/exams/${selectedExamId}/marks`);
      setRecords(response.data.data.records);
    } catch (error) {
      toast.error('Failed to load marks sheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMark = (studentId: number, val: number) => {
    setRecords(records.map(r => {
      if (r.student_id === studentId) {
        // Calculate grade letter on the fly
        const exam = exams.find(e => e.id === selectedExamId);
        let letter = 'F';
        if (exam && exam.max_marks > 0) {
          const pct = (val / exam.max_marks) * 100;
          for (const g of grades) {
            if (pct >= g.min) {
              letter = g.letter;
              break;
            }
          }
        }
        return { ...r, marks_obtained: val, letter_grade: letter };
      }
      return r;
    }));
  };

  const handleUpdateRemarks = (studentId: number, val: string) => {
    setRecords(records.map(r => r.student_id === studentId ? { ...r, remarks: val } : r));
  };

  const handleSaveMarks = async () => {
    setSaving(true);
    const toastId = toast.loading('Saving exam marks sheet...');
    try {
      await api.post(`/exams/${selectedExamId}/marks`, {
        records: records.map(r => ({
          student_id: r.student_id,
          marks_obtained: r.marks_obtained,
          remarks: r.remarks,
        }))
      });
      toast.success('Marks saved successfully!', { id: toastId });
      fetchMarksSheet();
    } catch (error) {
      toast.error('Failed to save marks sheet.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (publish: boolean) => {
    const toastId = toast.loading(`${publish ? 'Publishing' : 'Unpublishing'} results...`);
    try {
      await api.post(`/exams/${selectedExamId}/publish`, { is_published: publish });
      toast.success(publish ? 'Results published to student dashboard!' : 'Results draft unpublished.', { id: toastId });
      
      // Update local state
      setExams(exams.map(e => e.id === selectedExamId ? { ...e, is_published: publish } : e));
    } catch (error) {
      toast.error('Failed to toggle publishing status.', { id: toastId });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentExam = exams.find(e => e.id === selectedExamId);

  return (
    <div className="dashboard-wrapper printable-admission-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar - Screen only */}
      <nav className="dashboard-nav no-print" style={{ marginBottom: '30px' }}>
        <div className="nav-container">
          <span className="brand-logo">Arabic College Registrar</span>
          <button onClick={handlePrint} className="btn btn-primary btn-sm flex-center">
            <Printer size={14} style={{ marginRight: '6px' }} /> Print Score Sheet
          </button>
        </div>
      </nav>

      {/* Selector Roster - Screen only */}
      <div className="dashboard-content no-print" style={{ padding: '0 20px 30px' }}>
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>Marks Entry Console</h1>
            <p>Select scheduled terms to log student marks, calculate letter grades, and publish sheets.</p>
          </div>

          <div className="input-group" style={{ margin: '0', minWidth: '320px' }}>
            <select value={selectedExamId} onChange={(e) => setSelectedExamId(parseInt(e.target.value))}>
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.course?.subject?.name_en})</option>
              ))}
            </select>
          </div>
        </header>

        {currentExam && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Control buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                {currentExam.is_published ? (
                  <button onClick={() => handleTogglePublish(false)} className="btn btn-outline btn-sm flex-center" style={{ color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.2)' }}>
                    <EyeOff size={14} style={{ marginRight: '6px' }} /> Unpublish Results
                  </button>
                ) : (
                  <button onClick={() => handleTogglePublish(true)} className="btn btn-outline btn-sm flex-center" style={{ color: 'var(--success)', borderColor: 'rgba(16,185,129,0.2)' }}>
                    <Eye size={14} style={{ marginRight: '6px' }} /> Publish Results
                  </button>
                )}
              </div>
              <button onClick={handleSaveMarks} className="btn btn-primary" disabled={saving}>
                <Save size={14} /> Lock & Save Marks
              </button>
            </div>

            {loading ? (
              <div className="spinner-center" style={{ minHeight: '200px' }}>
                <div className="spinner"></div>
              </div>
            ) : records.length > 0 ? (
              <div className="dashboard-card">
                <div className="downloads-table-container">
                  <table className="downloads-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Marks Obtained (Max: {currentExam.max_marks})</th>
                        <th>Percentage</th>
                        <th>Final Grade</th>
                        <th>Instructor Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r) => {
                        const pct = currentExam.max_marks > 0 ? (r.marks_obtained / currentExam.max_marks) * 100 : 0;
                        return (
                          <tr key={r.student_id}>
                            <td><code>{r.student_id_number}</code></td>
                            <td><strong>{r.name}</strong></td>
                            <td>
                              <input
                                type="number"
                                min={0}
                                max={currentExam.max_marks}
                                value={r.marks_obtained}
                                onChange={(e) => handleUpdateMark(r.student_id, parseFloat(e.target.value) || 0)}
                                style={{ width: '100px', padding: '6px', background: 'rgba(9,13,22,0.6)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                              />
                            </td>
                            <td><strong>{pct.toFixed(1)} %</strong></td>
                            <td>
                              <span className={`badge ${r.letter_grade === 'F' ? 'badge-error' : 'badge-permission'}`}>
                                {r.letter_grade || 'F'}
                              </span>
                            </td>
                            <td>
                              <input
                                type="text"
                                placeholder="Add notes..."
                                value={r.remarks}
                                onChange={(e) => handleUpdateRemarks(r.student_id, e.target.value)}
                                style={{ width: '100%', padding: '6px', background: 'rgba(9,13,22,0.6)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="no-data">No students enrolled in this course section.</div>
            )}

          </div>
        )}
      </div>

      {/* PRINT LAYOUT: OFFICIAL SCORESHEET */}
      <div className="printable-summary-sheet print-only" style={{ maxWidth: '850px', width: '100%', background: '#fff', color: '#000', padding: '45px', border: '1px solid #cbd5e0', margin: '0 auto', fontFamily: 'sans-serif' }}>
        
        {/* Head */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #2d3748', paddingBottom: '16px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>ARABIC COLLEGE OF RIYADH</h2>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#4a5568', marginTop: '4px', letterSpacing: '1px' }}>Official Examination Score Sheet</div>
          <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>
            Exam: {currentExam?.name} | Course Section: {currentExam?.course?.code} ({currentExam?.course?.section})
          </div>
        </div>

        {/* Scores ledger table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#edf2f7', border: '1px solid #cbd5e0', textAlign: 'left' }}>
              <th style={{ padding: '8px', border: '1px solid #cbd5e0' }}>Student ID</th>
              <th style={{ padding: '8px', border: '1px solid #cbd5e0' }}>Student Name</th>
              <th style={{ padding: '8px', border: '1px solid #cbd5e0', textAlign: 'center' }}>Marks Obtained</th>
              <th style={{ padding: '8px', border: '1px solid #cbd5e0', textAlign: 'center' }}>Max Marks</th>
              <th style={{ padding: '8px', border: '1px solid #cbd5e0', textAlign: 'center' }}>Percentage</th>
              <th style={{ padding: '8px', border: '1px solid #cbd5e0', textAlign: 'center' }}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const pct = currentExam ? (r.marks_obtained / currentExam.max_marks) * 100 : 0;
              return (
                <tr key={r.student_id} style={{ borderBottom: '1px solid #cbd5e0' }}>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e0' }}><code>{r.student_id_number}</code></td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e0' }}><strong>{r.name}</strong></td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e0', textAlign: 'center' }}>{r.marks_obtained.toFixed(1)}</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e0', textAlign: 'center' }}>{currentExam?.max_marks}</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e0', textAlign: 'center' }}>{pct.toFixed(1)} %</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e0', textAlign: 'center', fontWeight: 'bold' }}>{r.letter_grade || 'F'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Bottom signoffs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#718096' }}>Prepared By (Filer):</div>
            <div style={{ width: '150px', borderBottom: '1px solid #4a5568', marginTop: '30px' }}></div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#000', marginTop: '4px' }}>Instructor of Record</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#718096' }}>Approved By:</div>
            <div style={{ width: '150px', borderBottom: '1px solid #4a5568', marginTop: '30px', marginLeft: 'auto' }}></div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#000', marginTop: '4px' }}>Registrar / Controller of Exams</div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default MarksEntryLedger;
