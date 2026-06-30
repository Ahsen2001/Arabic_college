import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { Printer, BookOpen, Award, TrendingUp } from 'lucide-react';

interface TranscriptCourse {
  code: string;
  name: string;
  credits: number;
  grade: string;
  gpa_point: number;
}

interface TranscriptSemester {
  semester_name: string;
  semester_code: string;
  courses: TranscriptCourse[];
  gpa: number;
  credits_attempted: number;
  credits_earned: number;
}

interface TranscriptData {
  student_id: number;
  student_id_number: string;
  name: string;
  email: string;
  program: string;
  status: string;
  semesters: TranscriptSemester[];
  cgpa: number;
  total_credits_attempted: number;
  total_credits_earned: number;
}

const StudentTranscriptView: React.FC = () => {
  const { studentId } = useParams<{ studentId?: string }>();
  const navigate = useNavigate();
  
  const [data, setData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTranscript();
  }, [studentId]);

  const fetchTranscript = async () => {
    setLoading(true);
    try {
      let targetId = studentId;

      if (!targetId) {
        // Fetch logged-in user profile to extract Student ID if loading student portal directly
        const profileRes = await api.get('/profile');
        const student = profileRes.data.data.student;
        if (!student) {
          toast.error('No student profile linked to this account.');
          navigate('/dashboard');
          return;
        }
        targetId = student.id;
      }

      const response = await api.get(`/shareea/students/${targetId}/transcript`);
      setData(response.data.data);
    } catch (error) {
      toast.error('Failed to load official transcript.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fullscreen-loader">
        <div className="loader-card">
          <div className="spinner"></div>
          <p className="loading-text">Generating academic transcript...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="dashboard-wrapper printable-admission-wrapper">
      
      {/* Navbar - Screen only */}
      <nav className="dashboard-nav no-print">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Student Portal</span>
          <button onClick={handlePrint} className="btn btn-primary btn-sm flex-center">
            <Printer size={14} /> Print Official Transcript
          </button>
        </div>
      </nav>

      {/* Transcript Screen Display */}
      <main className="dashboard-content no-print">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>Academic Transcript</h1>
            <p>Official ledger of course grades, credit hours, and GPAs.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="dashboard-card" style={{ padding: '14px 20px', margin: '0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={20} style={{ color: 'var(--success)' }} />
              <div>
                <span className="card-desc" style={{ margin: '0', fontSize: '11px' }}>Cumulative CGPA</span>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>{data.cgpa} / 4.00</div>
              </div>
            </div>
            <div className="dashboard-card" style={{ padding: '14px 20px', margin: '0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={20} style={{ color: 'var(--primary)' }} />
              <div>
                <span className="card-desc" style={{ margin: '0', fontSize: '11px' }}>Credits Completed</span>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>{data.total_credits_earned} CH</div>
              </div>
            </div>
          </div>
        </header>

        {/* Profile Card */}
        <div className="dashboard-card" style={{ marginBottom: '30px' }}>
          <div className="grid-3" style={{ margin: '0' }}>
            <div className="detail-item">
              <span className="detail-label">Student Name:</span>
              <span className="detail-val" style={{ color: 'white' }}>{data.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Registration ID:</span>
              <span className="detail-val" style={{ color: 'white' }}>{data.student_id_number}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Program:</span>
              <span className="detail-val" style={{ color: 'white' }}>{data.program}</span>
            </div>
          </div>
        </div>

        {/* Semesters list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {data.semesters.map((sem, idx) => (
            <div key={idx} className="dashboard-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} /> {sem.semester_name} ({sem.semester_code})
                </h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span className="card-desc" style={{ margin: '0' }}>Credits: <strong>{sem.credits_earned} CH</strong></span>
                  <span className="card-desc" style={{ margin: '0' }}>GPA: <strong style={{ color: 'var(--success)' }}>{sem.gpa}</strong></span>
                </div>
              </div>

              <div className="downloads-table-container">
                <table className="downloads-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Subject Name</th>
                      <th>Credit Hours</th>
                      <th>Grade Letter</th>
                      <th>Grade Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sem.courses.map((c, cidx) => (
                      <tr key={cidx}>
                        <td><code>{c.code}</code></td>
                        <td>{c.name}</td>
                        <td>{c.credits} CH</td>
                        <td>
                          <span className={`badge ${c.grade === 'F' ? 'badge-error' : 'badge-permission'}`}>
                            {c.grade}
                          </span>
                        </td>
                        <td>{c.gpa_point.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* PRINT LAYOUT FOR OFFICIAL TRANSCRIPT */}
      <div className="printable-summary-sheet printable-offer-letter print-only" style={{ maxWidth: '850px', background: '#fff', color: '#000', padding: '45px', border: '8px double #d4af37', position: 'relative', margin: '0 auto', fontFamily: 'serif' }}>
        
        {/* Background Watermark Seal */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: '0.04', pointerEvents: 'none', zIndex: '0', textAlign: 'center', width: '100%' }}>
          <span style={{ fontSize: '110px', fontWeight: 'bold', fontFamily: 'serif', letterSpacing: '4px' }}>ARABIC COLLEGE</span>
        </div>

        {/* Head */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #cbd5e0', paddingBottom: '20px', marginBottom: '30px', position: 'relative', zIndex: '1' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '1px', margin: '0' }}>ARABIC COLLEGE OF SHARIA & LINGUISTICS</h2>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#4a5568', marginTop: '4px' }}>Official Academic Transcript Roll</div>
          <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px' }}>Riyadh, Kingdom of Saudi Arabia</div>
        </div>

        {/* Student Dossier */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px', fontSize: '13px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', position: 'relative', zIndex: '1' }}>
          <div>
            <div style={{ marginBottom: '6px' }}>Student Name: <strong style={{ color: '#000' }}>{data.name}</strong></div>
            <div style={{ marginBottom: '6px' }}>Student ID Number: <strong style={{ color: '#000' }}>{data.student_id_number}</strong></div>
            <div>Track Program: <strong style={{ color: '#000' }}>{data.program}</strong></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '6px' }}>Print Date: <strong style={{ color: '#000' }}>{new Date().toISOString().slice(0, 10)}</strong></div>
            <div style={{ marginBottom: '6px' }}>Cumulative CGPA: <strong style={{ color: '#000' }}>{data.cgpa} / 4.00</strong></div>
            <div>Total Earned Credits: <strong style={{ color: '#000' }}>{data.total_credits_earned} CH</strong></div>
          </div>
        </div>

        {/* Courses listing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative', zIndex: '1' }}>
          {data.semesters.map((sem, idx) => (
            <div key={idx} style={{ pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #4a5568', paddingBottom: '6px', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ fontWeight: 'bold', color: '#000' }}>{sem.semester_name} ({sem.semester_code})</span>
                <div>
                  <span style={{ marginRight: '14px' }}>GPA: <strong>{sem.gpa}</strong></span>
                  <span>Credits Earned: <strong>{sem.credits_earned} CH</strong></span>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#4a5568', textAlign: 'left' }}>
                    <th style={{ padding: '6px 0', width: '100px' }}>Course Code</th>
                    <th style={{ padding: '6px 0' }}>Subject Title</th>
                    <th style={{ padding: '6px 0', width: '80px', textAlign: 'center' }}>Credits</th>
                    <th style={{ padding: '6px 0', width: '80px', textAlign: 'center' }}>Grade</th>
                    <th style={{ padding: '6px 0', width: '80px', textAlign: 'right' }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {sem.courses.map((c, cidx) => (
                    <tr key={cidx} style={{ borderBottom: '1px dotted #edf2f7', color: '#000' }}>
                      <td style={{ padding: '8px 0' }}><code>{c.code}</code></td>
                      <td style={{ padding: '8px 0' }}>{c.name}</td>
                      <td style={{ padding: '8px 0', textAlign: 'center' }}>{c.credits} CH</td>
                      <td style={{ padding: '8px 0', textAlign: 'center', fontWeight: 'bold' }}>{c.grade}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{c.gpa_point.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Footer Seal signature */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: '60px', borderTop: '1px solid #e2e8f0', paddingTop: '30px', position: 'relative', zIndex: '1', pageBreakInside: 'avoid' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#718096' }}>Registry Authentication Seal</div>
            <div style={{ width: '100px', height: '60px', border: '1px dashed #cbd5e0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#a0aec0', marginTop: '8px', transform: 'rotate(-10deg)' }}>
              OFFICIAL SEAL
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ width: '160px', borderBottom: '1px solid #4a5568', margin: '0 0 8px auto' }}></div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000' }}>Registrar of Board</div>
            <div style={{ fontSize: '10px', color: '#718096' }}>Arabic College of Riyadh</div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default StudentTranscriptView;
