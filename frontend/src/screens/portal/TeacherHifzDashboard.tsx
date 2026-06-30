import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Book, Award, Bookmark, CheckCircle, Calendar, Search } from 'lucide-react';

interface StudentSummary {
  id: number;
  student_id_number: string;
  name: string;
  email: string;
  program: string;
}

interface Milestone {
  id: number;
  milestone_name: string;
  completion_date: string;
  remarks?: string;
}

const TeacherHifzDashboard: React.FC = () => {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // active form tab
  const [activeTab, setActiveTab] = useState<'log' | 'assessment' | 'milestones'>('log');

  // Student specific statistics/history
  const [studentProgress, setStudentProgress] = useState<any>(null);

  // Daily logs form
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [sabaqSurah, setSabaqSurah] = useState('');
  const [sabaqStart, setSabaqStart] = useState('');
  const [sabaqEnd, setSabaqEnd] = useState('');
  const [sabaqStatus, setSabaqStatus] = useState('Excellent');
  
  const [sabkiJuz, setSabkiJuz] = useState('');
  const [sabkiStart, setSabkiStart] = useState('');
  const [sabkiEnd, setSabkiEnd] = useState('');
  const [sabkiStatus, setSabkiStatus] = useState('Excellent');
  
  const [manzilJuz, setManzilJuz] = useState('');
  const [manzilStatus, setManzilStatus] = useState('Excellent');
  
  const [mistakes, setMistakes] = useState(0);
  const [tajweedScore, setTajweedScore] = useState(90);
  const [remarks, setRemarks] = useState('');

  // Current global progress trackers
  const [progJuz, setProgJuz] = useState(1);
  const [progSurah, setProgSurah] = useState(1);
  const [progAyah, setProgAyah] = useState(1);
  const [progPercent, setProgPercent] = useState(0);

  // Assessments form
  const [assessType, setAssessType] = useState<'weekly' | 'monthly'>('weekly');
  const [assessDate, setAssessDate] = useState(new Date().toISOString().slice(0, 10));
  const [assessJuz, setAssessJuz] = useState('');
  const [assessMemoScore, setAssessMemoScore] = useState(90);
  const [assessTajweedScore, setAssessTajweedScore] = useState(90);
  const [assessRemarks, setAssessRemarks] = useState('');

  // Milestones form
  const [milestoneName, setMilestoneName] = useState('5 Juz Completion');
  const [milestoneDate, setMilestoneDate] = useState(new Date().toISOString().slice(0, 10));
  const [milestoneRemarks, setMilestoneRemarks] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudentId > 0) {
      fetchStudentDetails(selectedStudentId);
    }
  }, [selectedStudentId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/students', {
        params: { search: searchQuery || undefined }
      });
      const stList = response.data.data.students;
      setStudents(stList);
      if (stList.length > 0 && selectedStudentId === 0) {
        setSelectedStudentId(stList[0].id);
      }
    } catch (error) {
      toast.error('Failed to load students roster.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (id: number) => {
    try {
      const res = await api.get(`/hifz/student/${id}/progress`);
      const det = res.data.data;
      setStudentProgress(det);

      // Pre-fill current progress inputs
      setProgJuz(det.progress.current_juz);
      setProgSurah(det.progress.current_surah);
      setProgAyah(det.progress.current_ayah);
      setProgPercent(parseFloat(det.progress.completion_percentage));
    } catch (error) {
      toast.error('Failed to load student details.');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleSaveDailyLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Logging recitation entries...');
    try {
      await api.post('/hifz/logs', {
        student_id: selectedStudentId,
        log_date: logDate,
        sabaq_surah: sabaqSurah || null,
        sabaq_ayah_start: sabaqStart ? parseInt(sabaqStart) : null,
        sabaq_ayah_end: sabaqEnd ? parseInt(sabaqEnd) : null,
        sabaq_status: sabaqSurah ? sabaqStatus : null,
        sabki_juz: sabkiJuz ? parseInt(sabkiJuz) : null,
        sabki_page_start: sabkiStart ? parseInt(sabkiStart) : null,
        sabki_page_end: sabkiEnd ? parseInt(sabkiEnd) : null,
        sabki_status: sabkiJuz ? sabkiStatus : null,
        manzil_juz: manzilJuz ? parseInt(manzilJuz) : null,
        manzil_status: manzilJuz ? manzilStatus : null,
        mistakes_count: mistakes,
        tajweed_score: tajweedScore,
        teacher_remarks: remarks,
        
        // Progress sync
        current_juz: progJuz,
        current_surah: progSurah,
        current_ayah: progAyah,
        completion_percentage: progPercent,
      });

      toast.success('Daily recitation logs filed!', { id: toastId });
      // Reset Sabaq and Sabki inputs
      setSabaqSurah('');
      setSabaqStart('');
      setSabaqEnd('');
      setSabkiJuz('');
      setSabkiStart('');
      setSabkiEnd('');
      setManzilJuz('');
      setMistakes(0);
      setRemarks('');
      fetchStudentDetails(selectedStudentId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transaction failed.', { id: toastId });
    }
  };

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Saving assessment record...');
    try {
      await api.post('/hifz/assessments', {
        student_id: selectedStudentId,
        assessment_type: assessType,
        assessment_date: assessDate,
        juz_tested: assessJuz,
        memorization_score: assessMemoScore,
        tajweed_score: assessTajweedScore,
        remarks: assessRemarks,
      });
      toast.success('Hifz assessment registered!', { id: toastId });
      setAssessJuz('');
      setAssessRemarks('');
      fetchStudentDetails(selectedStudentId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save.', { id: toastId });
    }
  };

  const handleGrantMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Awarding milestone...');
    try {
      await api.post('/hifz/milestones', {
        student_id: selectedStudentId,
        milestone_name: milestoneName,
        completion_date: milestoneDate,
        remarks: milestoneRemarks,
      });
      toast.success('Milestone verified and logged!', { id: toastId });
      setMilestoneRemarks('');
      fetchStudentDetails(selectedStudentId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to grant.', { id: toastId });
    }
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Hifz</span>
          <span className="badge badge-role">Memorization Log Console</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>Hifz Progress Registrar</h1>
            <p>Administer daily Sabaq/Sabki recitations, record periodic assessments, and log student milestones.</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="input-group" style={{ margin: '0', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '220px', padding: '10px 16px' }}
            />
            <button type="submit" className="btn btn-outline btn-sm flex-center">
              <Search size={14} /> Search
            </button>
          </form>
        </header>

        <div className="grid-container" style={{ gridTemplateColumns: '1fr 3fr' }}>
          
          {/* Students Sidebar Roster */}
          <div className="dashboard-card" style={{ padding: '14px', alignSelf: 'start' }}>
            <h3 style={{ fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '12px', color: 'white' }}>Students List</h3>
            {loading ? (
              <div className="spinner" style={{ margin: '20px auto' }}></div>
            ) : students.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '500px', overflowY: 'auto' }}>
                {students.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`btn ${selectedStudentId === s.id ? 'btn-primary' : 'btn-outline'}`}
                    style={{ textAlign: 'left', display: 'block', width: '100%', padding: '10px 14px', fontSize: '12px' }}
                  >
                    <div>{s.name}</div>
                    <div className="card-desc" style={{ fontSize: '10px', margin: '2px 0 0', color: selectedStudentId === s.id ? '#cbd5e1' : '#94a3b8' }}>ID: {s.student_id_number}</div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="no-badge">No students registered.</p>
            )}
          </div>

          {/* Hifz Console Main Body */}
          {studentProgress ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Student Overview Header */}
              <div className="dashboard-card" style={{ padding: '24px', background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 style={{ color: 'white' }}>{studentProgress.name}</h2>
                    <p className="card-desc">Program: {studentProgress.program} | Reg ID: {studentProgress.student_id_number}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span className="card-desc" style={{ fontSize: '10px', margin: '0' }}>Completion %</span>
                      <div style={{ color: 'var(--success)', fontSize: '20px', fontWeight: 'bold' }}>{studentProgress.progress.completion_percentage} %</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span className="card-desc" style={{ fontSize: '10px', margin: '0' }}>Current Juz</span>
                      <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Juz {studentProgress.progress.current_juz}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-tab selection */}
              <div className="news-tabs" style={{ justifyContent: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', margin: '0', gap: '8px' }}>
                <button onClick={() => setActiveTab('log')} className={`tab-btn ${activeTab === 'log' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Book size={14} /> Daily Sabaq Log
                </button>
                <button onClick={() => setActiveTab('assessment')} className={`tab-btn ${activeTab === 'assessment' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} /> Assessment Roll
                </button>
                <button onClick={() => setActiveTab('milestones')} className={`tab-btn ${activeTab === 'milestones' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={14} /> Milestones & Verification
                </button>
              </div>

              {/* Sub-tab Body */}
              <div className="dashboard-card" style={{ padding: '24px' }}>
                
                {/* 1. DAILY RECITATION LOG */}
                {activeTab === 'log' && (
                  <form onSubmit={handleSaveDailyLog} className="auth-form" style={{ gap: '24px' }}>
                    
                    {/* Log Date */}
                    <div className="input-group" style={{ maxWidth: '240px' }}>
                      <label>Recitation Date</label>
                      <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} required />
                    </div>

                    {/* Sabaq (New recitation) */}
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '16px' }}>
                      <h4 style={{ color: 'white', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Bookmark size={14} style={{ color: 'var(--primary)' }} /> Sabaq (New Lesson)</h4>
                      <div className="grid-4" style={{ margin: '0' }}>
                        <div className="input-group">
                          <label>Surah Name/Number</label>
                          <input type="text" placeholder="e.g. Al-Baqarah" value={sabaqSurah} onChange={(e) => setSabaqSurah(e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label>Start Verse (Ayah)</label>
                          <input type="number" placeholder="e.g. 1" value={sabaqStart} onChange={(e) => setSabaqStart(e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label>End Verse (Ayah)</label>
                          <input type="number" placeholder="e.g. 10" value={sabaqEnd} onChange={(e) => setSabaqEnd(e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label>Evaluation</label>
                          <select value={sabaqStatus} onChange={(e) => setSabaqStatus(e.target.value)}>
                            <option value="Excellent">Excellent (Excellent)</option>
                            <option value="Good">Good (Good)</option>
                            <option value="Needs Practice">Needs Practice (Needs Practice)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Sabki (Recent revision) */}
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '16px' }}>
                      <h4 style={{ color: 'white', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Bookmark size={14} style={{ color: 'var(--success)' }} /> Sabki (Recent Revision)</h4>
                      <div className="grid-4" style={{ margin: '0' }}>
                        <div className="input-group">
                          <label>Juz Number</label>
                          <input type="number" placeholder="Juz 1" value={sabkiJuz} onChange={(e) => setSabkiJuz(e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label>Start Page</label>
                          <input type="number" placeholder="Start Page" value={sabkiStart} onChange={(e) => setSabkiStart(e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label>End Page</label>
                          <input type="number" placeholder="End Page" value={sabkiEnd} onChange={(e) => setSabkiEnd(e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label>Evaluation</label>
                          <select value={sabkiStatus} onChange={(e) => setSabkiStatus(e.target.value)}>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Needs Practice">Needs Practice</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Manzil (Old revision) */}
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '16px' }}>
                      <h4 style={{ color: 'white', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Bookmark size={14} style={{ color: 'var(--warning)' }} /> Manzil (Old Revision)</h4>
                      <div className="grid-2" style={{ margin: '0' }}>
                        <div className="input-group">
                          <label>Juz Number</label>
                          <input type="number" placeholder="e.g. Juz 30" value={manzilJuz} onChange={(e) => setManzilJuz(e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label>Evaluation</label>
                          <select value={manzilStatus} onChange={(e) => setManzilStatus(e.target.value)}>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Needs Practice">Needs Practice</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Quality, mistakes, tajweed */}
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '16px' }}>
                      <h4 style={{ color: 'white', marginBottom: '12px' }}>Recitation Quality Metrics</h4>
                      <div className="grid-2" style={{ margin: '0' }}>
                        <div className="input-group">
                          <label>Mistakes Count (Pronunciation / Hesitation)</label>
                          <input type="number" min={0} value={mistakes} onChange={(e) => setMistakes(parseInt(e.target.value) || 0)} required />
                        </div>
                        <div className="input-group">
                          <label>Tajweed Score (1-100)</label>
                          <input type="number" min={1} max={100} value={tajweedScore} onChange={(e) => setTajweedScore(parseInt(e.target.value) || 100)} required />
                        </div>
                      </div>
                    </div>

                    {/* Sync Global Student Progress */}
                    <div>
                      <h4 style={{ color: 'white', marginBottom: '12px' }}>Update Cumulative Hifz Progress</h4>
                      <div className="grid-4" style={{ margin: '0 0 16px' }}>
                        <div className="input-group">
                          <label>Current Juz</label>
                          <input type="number" min={1} max={30} value={progJuz} onChange={(e) => setProgJuz(parseInt(e.target.value) || 1)} required />
                        </div>
                        <div className="input-group">
                          <label>Current Surah</label>
                          <input type="number" min={1} max={114} value={progSurah} onChange={(e) => setProgSurah(parseInt(e.target.value) || 1)} required />
                        </div>
                        <div className="input-group">
                          <label>Current Ayah</label>
                          <input type="number" min={1} value={progAyah} onChange={(e) => setProgAyah(parseInt(e.target.value) || 1)} required />
                        </div>
                        <div className="input-group">
                          <label>Completion Percentage (%)</label>
                          <input type="number" step="0.01" min={0} max={100} value={progPercent} onChange={(e) => setProgPercent(parseFloat(e.target.value) || 0)} required />
                        </div>
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Teacher Notes / Remarks</label>
                      <textarea rows={3} placeholder="Add comments..." value={remarks} onChange={(e) => setRemarks(e.target.value)} style={{ padding: '10px', background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-glass)', borderRadius: '10px', color: '#fff', outline: 'none' }} />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'start', minWidth: '200px' }}>
                      <CheckCircle size={14} /> File Recitation Log
                    </button>
                  </form>
                )}

                {/* 2. ASSESSMENTS */}
                {activeTab === 'assessment' && (
                  <form onSubmit={handleSaveAssessment} className="auth-form" style={{ gap: '20px' }}>
                    <div className="grid-3" style={{ margin: '0' }}>
                      <div className="input-group">
                        <label>Assessment Period</label>
                        <select value={assessType} onChange={(e: any) => setAssessType(e.target.value)}>
                          <option value="weekly">Weekly Assessment</option>
                          <option value="monthly">Monthly Assessment</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Assessment Date</label>
                        <input type="date" value={assessDate} onChange={(e) => setAssessDate(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label>Juz / Portions Tested</label>
                        <input type="text" placeholder="e.g. Juz 29-30" value={assessJuz} onChange={(e) => setAssessJuz(e.target.value)} required />
                      </div>
                    </div>

                    <div className="grid-2" style={{ margin: '0' }}>
                      <div className="input-group">
                        <label>Memorization Score (0-100)</label>
                        <input type="number" min={0} max={100} value={assessMemoScore} onChange={(e) => setAssessMemoScore(parseInt(e.target.value) || 90)} required />
                      </div>
                      <div className="input-group">
                        <label>Tajweed Score (0-100)</label>
                        <input type="number" min={0} max={100} value={assessTajweedScore} onChange={(e) => setAssessTajweedScore(parseInt(e.target.value) || 90)} required />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Remarks</label>
                      <textarea rows={3} placeholder="Add comments..." value={assessRemarks} onChange={(e) => setAssessRemarks(e.target.value)} style={{ padding: '10px', background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-glass)', borderRadius: '10px', color: '#fff', outline: 'none' }} />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'start', minWidth: '200px' }}>
                      Save Assessment Roll
                    </button>
                  </form>
                )}

                {/* 3. MILESTONES */}
                {activeTab === 'milestones' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <form onSubmit={handleGrantMilestone} className="auth-form" style={{ gap: '20px' }}>
                      <div className="grid-2" style={{ margin: '0' }}>
                        <div className="input-group">
                          <label>Select Milestone Target</label>
                          <select value={milestoneName} onChange={(e) => setMilestoneName(e.target.value)}>
                            <option value="5 Juz Completion">5 Juz Completion</option>
                            <option value="10 Juz Completion">10 Juz Completion</option>
                            <option value="15 Juz Completion">15 Juz Completion</option>
                            <option value="20 Juz Completion">20 Juz Completion</option>
                            <option value="25 Juz Completion">25 Juz Completion</option>
                            <option value="Full Quran Memorization (Khatm)">Full Quran Memorization (Khatm)</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Completion Verification Date</label>
                          <input type="date" value={milestoneDate} onChange={(e) => setMilestoneDate(e.target.value)} required />
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Verifier Remarks</label>
                        <input type="text" placeholder="Verified by recitation panel comments..." value={milestoneRemarks} onChange={(e) => setMilestoneRemarks(e.target.value)} />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ alignSelf: 'start' }}>
                        Verify & Grant Milestone
                      </button>
                    </form>

                    <div>
                      <h3 style={{ fontSize: '15px', color: 'white', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>Milestone History</h3>
                      {studentProgress.milestones.length > 0 ? (
                        <div className="downloads-table-container">
                          <table className="downloads-table">
                            <thead>
                              <tr>
                                <th>Milestone</th>
                                <th>Date Verified</th>
                                <th>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentProgress.milestones.map((m: Milestone) => (
                                <tr key={m.id}>
                                  <td><strong>{m.milestone_name}</strong></td>
                                  <td>{m.completion_date}</td>
                                  <td>{m.remarks || '--'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="no-badge">No milestones achieved yet.</p>
                      )}
                    </div>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="no-data">Select a student from the side roster to start logging.</div>
          )}

        </div>
      </main>
    </div>
  );
};

export default TeacherHifzDashboard;
