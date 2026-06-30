import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { BookOpen, BookOpenCheck, CreditCard, Award, Printer, Clock } from 'lucide-react';

interface TimelineEvent {
  title: string;
  description: string;
  date: string;
  type: string;
}

interface DashboardMetrics {
  student_id: number;
  student_id_number: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  admission_semester: string;
  admission_date: string;
  metrics: {
    enrollments_count: number;
    borrowed_books_count: number;
    unpaid_balance: number;
    gpa: number;
  };
}

// Simple Vector Barcode Generator
const BarcodeSVG: React.FC<{ value: string }> = ({ value }) => {
  const chars = value.split('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="180" height="40" viewBox="0 0 180 40">
        <g fill="#000000">
          {chars.map((char, index) => {
            const charCode = char.charCodeAt(0);
            const w1 = (charCode % 2) + 1;
            const w2 = ((charCode >> 1) % 2) + 1;
            const w3 = ((charCode >> 2) % 2) + 1;
            const offset = index * 14 + 10;
            return (
              <React.Fragment key={index}>
                <rect x={offset} y="2" width={w1 * 1.5} height="36" />
                <rect x={offset + 4} y="2" width={w2 * 1.5} height="36" />
                <rect x={offset + 8} y="2" width={w3 * 1.5} height="36" />
              </React.Fragment>
            );
          })}
        </g>
      </svg>
      <span style={{ fontSize: '10px', letterSpacing: '2px', color: '#000', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
};

const StudentDashboardView: React.FC = () => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewCard, setViewCard] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const dbRes = await api.get('/student/dashboard');
      setData(dbRes.data.data);

      const timeRes = await api.get('/student/timeline');
      setTimeline(timeRes.data.data);
    } catch (error) {
      toast.error('Failed to load student dashboard stats.');
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
          <p className="loading-text">Loading student dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="dashboard-wrapper printable-admission-wrapper">
      <nav className="dashboard-nav no-print">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Student Portal</span>
          <span className="badge badge-role">Student Dashboard</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="no-print">
          {/* Header */}
          <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between' }}>
            <div>
              <h1>Welcome Back, {data.name}!</h1>
              <p>ID: <strong>{data.student_id_number}</strong> | Track: <span className="badge badge-role">{data.program}</span></p>
            </div>
            <button onClick={() => setViewCard(!viewCard)} className="btn btn-outline btn-sm">
              <CreditCard size={14} style={{ marginRight: '6px' }} /> {viewCard ? 'View Stats & Feed' : 'View ID Card'}
            </button>
          </header>

          {!viewCard ? (
            /* Dashboard View: Stats & Timeline Feed */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Stats Grid */}
              <div className="grid-container" style={{ margin: '0' }}>
                
                <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(99,102,241,0.1)', padding: '12px', borderRadius: '12px' }}>
                    <BookOpen size={24} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Active Courses</h3>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>{data.metrics.enrollments_count}</div>
                  </div>
                </div>

                <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(245,158,11,0.1)', padding: '12px', borderRadius: '12px' }}>
                    <BookOpenCheck size={24} style={{ color: 'var(--warning)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Borrowed Books</h3>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>{data.metrics.borrowed_books_count}</div>
                  </div>
                </div>

                <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '12px' }}>
                    <CreditCard size={24} style={{ color: 'var(--error)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Unpaid Balance</h3>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>{data.metrics.unpaid_balance} SAR</div>
                  </div>
                </div>

                <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(16,185,129,0.1)', padding: '12px', borderRadius: '12px' }}>
                    <Award size={24} style={{ color: 'var(--success)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Cumulative GPA</h3>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>{data.metrics.gpa}</div>
                  </div>
                </div>

              </div>

              {/* Timeline feed */}
              <div className="dashboard-card">
                <div className="card-header">
                  <Clock size={20} className="icon-header" />
                  <h3>Academic Milestones Timeline</h3>
                </div>
                <div className="card-body">
                  {timeline.length > 0 ? (
                    <div className="schedule-body" style={{ margin: '0' }}>
                      {timeline.map((event, idx) => (
                        <div key={idx} className="timeline-item" style={{ paddingLeft: '24px', paddingBottom: '20px' }}>
                          <span className="timeline-date">{event.date}</span>
                          <h4 style={{ fontSize: '15px', color: 'white', fontWeight: '600' }}>{event.title}</h4>
                          <p className="card-desc" style={{ fontSize: '13px', margin: '4px 0 0' }}>{event.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-badge">No academic milestones recorded yet.</p>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* Digital ID Card Preview */
            <div className="dashboard-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                  <h3>My Digital ID Card</h3>
                  <p className="card-desc">Verify your barcode and scan profiles for library logins.</p>
                </div>
                <button onClick={handlePrint} className="btn btn-primary">
                  <Printer size={16} /> Print ID Card
                </button>
              </div>

              <div className="idcard-double-sided-grid" style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {/* Front */}
                <div style={{ width: '280px', height: '420px', background: '#ffffff', color: '#000000', borderRadius: '16px', border: '2px solid #d4af37', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 6px 15px rgba(0,0,0,0.15)' }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e0', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px', color: '#8c6239' }}>ARABIC COLLEGE</span>
                    <div style={{ fontSize: '9px', color: '#718096', marginTop: '2px' }}>Sharia & Linguistic Sciences</div>
                  </div>
                  
                  {/* Photo Placeholder */}
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
                    <div style={{ width: '100px', height: '120px', border: '1px solid #cbd5e0', background: '#f7fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#a0aec0', textAlign: 'center', padding: '6px' }}>Student Photo</div>
                    </div>
                  </div>

                  <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a202c', textAlign: 'center' }}>{data.name}</div>
                    <div style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>{data.program}</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4f46e5', marginTop: '4px' }}>ID: {data.student_id_number}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                    <BarcodeSVG value={data.student_id_number} />
                  </div>
                </div>

                {/* Back */}
                <div style={{ width: '280px', height: '420px', background: '#1e293b', color: '#ffffff', borderRadius: '16px', border: '2px solid #475569', padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 6px 15px rgba(0,0,0,0.15)' }}>
                  <div>
                    <h4 style={{ fontSize: '11px', color: '#a5b4fc', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '8px' }}>Campus Card Terms</h4>
                    <ul style={{ fontSize: '9px', paddingLeft: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
                      <li>This card is property of Arabic College and must be displayed on campus.</li>
                      <li>Loss must be reported to the Registrar immediately.</li>
                    </ul>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'white', padding: '6px', borderRadius: '8px', display: 'inline-block' }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${data.student_id_number}`}
                        alt="QR Code"
                        style={{ width: '100px', height: '100px', display: 'block' }}
                      />
                    </div>
                    <span style={{ fontSize: '9px', color: '#94a3b8' }}>Scan for digital profile verification</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', fontSize: '9.5px', textAlign: 'center', color: '#94a3b8' }}>
                    <div>Emergency contact phone:</div>
                    <div style={{ fontWeight: 'bold', color: 'white', marginTop: '2px' }}>{data.phone}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PRINT LAYOUT FOR ID CARD */}
        {viewCard && (
          <div className="printable-id-card-layout print-only" style={{ margin: '0 auto', padding: '20px', background: '#fff' }}>
            <div style={{ display: 'flex', gap: '40px', justifyContent: 'center' }}>
              {/* Front */}
              <div style={{ width: '280px', height: '420px', background: '#ffffff', color: '#000000', borderRadius: '16px', border: '2px solid #d4af37', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e0', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px', color: '#8c6239' }}>ARABIC COLLEGE</span>
                  <div style={{ fontSize: '9px', color: '#718096', marginTop: '2px' }}>Sharia & Linguistic Sciences</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
                  <div style={{ width: '100px', height: '120px', border: '1px solid #cbd5e0', background: '#f7fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#a0aec0', textAlign: 'center', padding: '6px' }}>Student Photo</div>
                  </div>
                </div>
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a202c', textAlign: 'center' }}>{data.name}</div>
                  <div style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>{data.program}</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4f46e5', marginTop: '4px' }}>ID: {data.student_id_number}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                  <BarcodeSVG value={data.student_id_number} />
                </div>
              </div>

              {/* Back */}
              <div style={{ width: '280px', height: '420px', background: '#1e293b', color: '#ffffff', borderRadius: '16px', border: '2px solid #475569', padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '11px', color: '#a5b4fc', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '8px' }}>Campus Card Terms</h4>
                  <ul style={{ fontSize: '9px', paddingLeft: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
                    <li>This card is property of Arabic College and must be displayed on campus.</li>
                    <li>Loss must be reported to the Registrar immediately.</li>
                  </ul>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: 'white', padding: '6px', borderRadius: '8px', display: 'inline-block' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${data.student_id_number}`}
                      alt="QR Code"
                      style={{ width: '100px', height: '100px', display: 'block' }}
                    />
                  </div>
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>Scan for digital profile verification</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', fontSize: '9.5px', textAlign: 'center', color: '#94a3b8' }}>
                  <div>Emergency contact phone:</div>
                  <div style={{ fontWeight: 'bold', color: 'white', marginTop: '2px' }}>{data.phone}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboardView;
