import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { BookOpen, Award, TrendingUp, Calendar, Printer, BookOpenCheck } from 'lucide-react';

interface ProgressData {
  current_juz: number;
  current_surah: number;
  current_ayah: number;
  completion_percentage: string;
}

interface HifzLog {
  id: number;
  log_date: string;
  sabaq_surah?: string | null;
  sabaq_ayah_start?: number | null;
  sabaq_ayah_end?: number | null;
  sabaq_status?: string | null;
  sabki_juz?: number | null;
  sabki_status?: string | null;
  manzil_juz?: number | null;
  manzil_status?: string | null;
  mistakes_count: number;
  tajweed_score: number;
  teacher_remarks?: string | null;
}

interface Assessment {
  id: number;
  assessment_type: string;
  assessment_date: string;
  juz_tested: string;
  memorization_score: string;
  tajweed_score: string;
  grade: string;
  remarks?: string;
}

interface Milestone {
  id: number;
  milestone_name: string;
  completion_date: string;
  remarks?: string;
}

interface HifzDashboardData {
  student_id: number;
  student_id_number: string;
  name: string;
  email: string;
  program: string;
  progress: ProgressData;
  logs: HifzLog[];
  assessments: Assessment[];
  milestones: Milestone[];
  stats: {
    total_sessions: number;
    avg_mistakes: number;
    avg_tajweed: number;
  };
}

const StudentHifzDashboard: React.FC = () => {
  const { studentId } = useParams<{ studentId?: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<HifzDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Sub-tabs: history vs assessments
  const [activeTab, setActiveTab] = useState<'logs' | 'assessments'>('logs');

  useEffect(() => {
    fetchHifzDashboard();
  }, [studentId]);

  const fetchHifzDashboard = async () => {
    setLoading(true);
    try {
      let targetId = studentId;

      if (!targetId) {
        // Fetch logged-in user profile to extract Student ID
        const profileRes = await api.get('/profile');
        const student = profileRes.data.data.student;
        if (!student) {
          toast.error('No student profile linked to this account.');
          navigate('/dashboard');
          return;
        }
        targetId = student.id;
      }

      const response = await api.get(`/hifz/student/${targetId}/progress`);
      setData(response.data.data);
    } catch (error) {
      toast.error('Failed to load Quran memorization parameters.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fullscreen-loader">
        <div className="loader-card">
          <div className="spinner"></div>
          <p className="loading-text">Loading Hifz progress stats...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Check if student completed the whole Quran
  const hasKhatm = data.milestones.some(m => m.milestone_name.toLowerCase().includes('khatm') || m.milestone_name.toLowerCase().includes('full quran'));

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Sharia Portal</span>
          <span className="badge badge-role">Quran Memorization Progress</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>Quran Memorization Portfolio</h1>
            <p>Track your daily Sabaq logs, assess pronunciation mistakes, and download official Khatm certificates.</p>
          </div>
          {hasKhatm && (
            <button
              onClick={() => navigate(`/portal/hifz-certificate/${data.student_id}`)}
              className="btn btn-primary flex-center"
              style={{ background: 'linear-gradient(135deg, #d4af37 0%, #aa7c11 100%)', border: 'none', color: '#000', fontWeight: 'bold' }}
            >
              <Printer size={16} /> Official Khatm Certificate
            </button>
          )}
        </header>

        {/* Dynamic completion ring and metrics */}
        <div className="grid-container" style={{ margin: '0 0 30px' }}>
          
          {/* Card 1: circular completion indicator */}
          <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '30px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* SVG Ring */}
              <svg style={{ transform: 'rotate(-90deg)', width: '100px', height: '100px' }}>
                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="var(--success)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * parseFloat(data.progress.completion_percentage)) / 100}
                />
              </svg>
              <div style={{ position: 'absolute', color: 'white', fontWeight: 'bold', fontSize: '15px' }}>
                {parseFloat(data.progress.completion_percentage).toFixed(1)}%
              </div>
            </div>
            <div>
              <span className="card-desc" style={{ fontSize: '11px', margin: '0' }}>Cumulative Memorization</span>
              <h2 style={{ color: 'white', margin: '2px 0 6px' }}>{parseFloat(data.progress.completion_percentage).toFixed(1)}% Completed</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span className="badge badge-permission" style={{ fontSize: '11px' }}>Juz {data.progress.current_juz}</span>
                <span className="badge badge-role" style={{ fontSize: '11px' }}>Surah {data.progress.current_surah}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Recitation stats */}
          <div className="dashboard-card" style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '20px', padding: '30px' }}>
            <div style={{ textAlign: 'center' }}>
              <TrendingUp size={24} style={{ color: 'var(--success)', margin: '0 auto 8px' }} />
              <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>{data.stats.total_sessions}</div>
              <span className="card-desc" style={{ fontSize: '11px', margin: '0' }}>Daily Sabaq Sessions</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Award size={24} style={{ color: 'var(--primary)', margin: '0 auto 8px' }} />
              <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>{data.stats.avg_tajweed} / 100</div>
              <span className="card-desc" style={{ fontSize: '11px', margin: '0' }}>Avg Tajweed Score</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <BookOpenCheck size={24} style={{ color: 'var(--warning)', margin: '0 auto 8px' }} />
              <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>{data.stats.avg_mistakes}</div>
              <span className="card-desc" style={{ fontSize: '11px', margin: '0' }}>Avg Mistakes / Recitation</span>
            </div>
          </div>

        </div>

        {/* Milestones timeline grid */}
        <div className="dashboard-card" style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '15px', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '16px' }}>Milestones Timeline</h3>
          {data.milestones.length > 0 ? (
            <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', margin: '0' }}>
              {data.milestones.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(9, 13, 22, 0.4)', padding: '16px', border: '1px solid var(--border-glass)', borderRadius: '10px' }}>
                  <Award size={20} style={{ color: '#d4af37' }} />
                  <div>
                    <strong style={{ color: 'white', fontSize: '13px' }}>{m.milestone_name}</strong>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{m.completion_date}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-badge">No milestones achieved yet.</p>
          )}
        </div>

        {/* Tab selection for ledger */}
        <div className="news-tabs" style={{ justifyContent: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', margin: '0 0 20px', gap: '8px' }}>
          <button onClick={() => setActiveTab('logs')} className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={14} /> Recitation History
          </button>
          <button onClick={() => setActiveTab('assessments')} className={`tab-btn ${activeTab === 'assessments' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Portions Assessments
          </button>
        </div>

        {/* Sub-tab content */}
        <div className="dashboard-card">
          
          {/* TAB 1: DAILY RECITAION HISTORY */}
          {activeTab === 'logs' && (
            <div>
              {data.logs.length > 0 ? (
                <div className="downloads-table-container">
                  <table className="downloads-table">
                    <thead>
                      <tr>
                        <th>Date Logged</th>
                        <th>Sabaq Surah (Verses)</th>
                        <th>Sabki Juz (Pages)</th>
                        <th>Manzil Juz</th>
                        <th>Mistakes</th>
                        <th>Tajweed Score</th>
                        <th>Teacher Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.logs.map((l) => (
                        <tr key={l.id}>
                          <td>{l.log_date}</td>
                          <td>
                            {l.sabaq_surah ? (
                              <strong style={{ color: 'white' }}>{l.sabaq_surah} ({l.sabaq_ayah_start}-{l.sabaq_ayah_end})</strong>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>--</span>
                            )}
                          </td>
                          <td>
                            {l.sabki_juz ? (
                              <span>Juz {l.sabki_juz}</span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>--</span>
                            )}
                          </td>
                          <td>
                            {l.manzil_juz ? (
                              <span>Juz {l.manzil_juz}</span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>--</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${l.mistakes_count > 3 ? 'badge-error' : (l.mistakes_count > 0 ? 'badge-warning' : 'badge-permission')}`}>
                              {l.mistakes_count} Mistakes
                            </span>
                          </td>
                          <td><strong>{l.tajweed_score} %</strong></td>
                          <td><span className="card-desc" style={{ fontSize: '12px' }}>{l.teacher_remarks || '--'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-badge">No daily recitation logs filed.</p>
              )}
            </div>
          )}

          {/* TAB 2: PORTIONS ASSESSMENTS */}
          {activeTab === 'assessments' && (
            <div>
              {data.assessments.length > 0 ? (
                <div className="downloads-table-container">
                  <table className="downloads-table">
                    <thead>
                      <tr>
                        <th>Date Tested</th>
                        <th>Tested Juz Portions</th>
                        <th>Assessment</th>
                        <th>Memorization</th>
                        <th>Tajweed</th>
                        <th>Grade</th>
                        <th>Assessor Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.assessments.map((a) => (
                        <tr key={a.id}>
                          <td>{a.assessment_date}</td>
                          <td><strong>{a.juz_tested}</strong></td>
                          <td><span className="badge badge-role">{a.assessment_type}</span></td>
                          <td>{a.memorization_score} %</td>
                          <td>{a.tajweed_score} %</td>
                          <td>
                            <span className={`badge ${a.grade === 'F' ? 'badge-error' : 'badge-permission'}`}>
                              {a.grade}
                            </span>
                          </td>
                          <td><span className="card-desc" style={{ fontSize: '12px' }}>{a.remarks || '--'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-badge">No periodic assessment records logged.</p>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default StudentHifzDashboard;
