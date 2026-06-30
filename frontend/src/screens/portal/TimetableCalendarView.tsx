import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { Chart, registerables } from 'chart.js';
import { Printer, ArrowLeft, BarChart2 } from 'lucide-react';

Chart.register(...registerables);

// ─── Types ────────────────────────────────────────────────────────────────────
interface TimetableSlot {
  id: number;
  course_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  course?: { code: string; section: string; subject?: { name_en: string } };
  teacher?: { name: string };
  room?: { name: string };
}

interface Analytics {
  room_utilisation: Record<string, number>;
  teacher_load: Record<string, number>;
}

const FULL_DAYS: Record<number, string> = {
  1: 'Sunday', 2: 'Monday', 3: 'Tuesday',
  4: 'Wednesday', 5: 'Thursday', 6: 'Friday', 7: 'Saturday',
};
const ACTIVE_DAYS = [2, 3, 4, 5, 6];

// Colour palette — same as TimetableBuilder
const PALETTE = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#0ea5e9', '#a855f7', '#22c55e',
];
const slotColor = (id: number) => PALETTE[id % PALETTE.length];

// ─── Component ────────────────────────────────────────────────────────────────
const TimetableCalendarView: React.FC = () => {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Chart refs
  const roomChartRef = useRef<HTMLCanvasElement | null>(null);
  const teacherChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstances = useRef<Chart[]>([]);

  useEffect(() => {
    fetchData();
    return () => { chartInstances.current.forEach(c => c.destroy()); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [slotRes, analyticsRes] = await Promise.all([
        api.get('/timetable/slots'),
        api.get('/timetable/analytics'),
      ]);
      setSlots(slotRes.data.data);
      setAnalytics(analyticsRes.data.data);
    } catch {
      toast.error('Failed to load timetable data.');
    } finally {
      setLoading(false);
    }
  };

  // Build charts when analytics data arrives
  useEffect(() => {
    if (!analytics) return;
    chartInstances.current.forEach(c => c.destroy());
    chartInstances.current = [];

    const makeBar = (ref: React.RefObject<HTMLCanvasElement | null>, label: string, data: Record<string, number>) => {
      if (!ref.current) return;
      const chart = new Chart(ref.current, {
        type: 'bar',
        data: {
          labels: Object.keys(data),
          datasets: [{
            label,
            data: Object.values(data),
            backgroundColor: PALETTE,
            borderRadius: 6,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { display: false } },
          },
        },
      });
      chartInstances.current.push(chart);
    };

    makeBar(roomChartRef, 'Slots per Room', analytics.room_utilisation);
    makeBar(teacherChartRef, 'Slots per Teacher', analytics.teacher_load);
  }, [analytics]);

  // Build day → sorted slots map
  const dayMap: Record<number, TimetableSlot[]> = {};
  ACTIVE_DAYS.forEach(d => { dayMap[d] = []; });
  slots.forEach(s => {
    if (dayMap[s.day_of_week]) dayMap[s.day_of_week].push(s);
  });
  ACTIVE_DAYS.forEach(d => dayMap[d].sort((a, b) => a.start_time.localeCompare(b.start_time)));

  const handlePrint = () => window.print();

  return (
    <div className="dashboard-wrapper printable-admission-wrapper" style={{ minHeight: '100vh' }}>

      {/* Screen navbar */}
      <nav className="dashboard-nav no-print">
        <div className="nav-container">
          <button onClick={() => navigate('/admin/timetable')} className="btn btn-outline btn-sm flex-center">
            <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Builder
          </button>
          <span className="brand-logo">Timetable Calendar View</span>
          <button onClick={handlePrint} className="btn btn-primary btn-sm flex-center">
            <Printer size={14} style={{ marginRight: '6px' }} /> Export PDF
          </button>
        </div>
      </nav>

      {/* Analytics charts — screen only */}
      {analytics && (
        <div className="dashboard-content no-print" style={{ padding: '20px 20px 0' }}>
          <div className="grid-container" style={{ margin: '0 0 24px' }}>
            <div className="dashboard-card" style={{ minHeight: '220px' }}>
              <div className="card-header" style={{ marginBottom: '10px' }}>
                <BarChart2 size={16} className="icon-header" />
                <h3>Room Utilisation</h3>
              </div>
              <div style={{ position: 'relative', height: '160px' }}>
                <canvas ref={roomChartRef} />
              </div>
            </div>
            <div className="dashboard-card" style={{ minHeight: '220px' }}>
              <div className="card-header" style={{ marginBottom: '10px' }}>
                <BarChart2 size={16} className="icon-header" style={{ color: 'var(--success)' }} />
                <h3>Teacher Class Load</h3>
              </div>
              <div style={{ position: 'relative', height: '160px' }}>
                <canvas ref={teacherChartRef} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINTABLE WEEKLY CALENDAR ──────────────────────────────────────── */}
      <div
        className="printable-summary-sheet"
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          background: '#fff',
          color: '#000',
          padding: '40px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Print header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #2d3748', paddingBottom: '14px', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>ARABIC COLLEGE — WEEKLY CLASS TIMETABLE</h2>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#4a5568', letterSpacing: '0.5px' }}>
            Academic Timetable | Generated {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>Loading timetable data…</div>
        ) : (
          /* Calendar grid */
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px', border: '1px solid #cbd5e0', background: '#edf2f7', width: '70px', textAlign: 'center' }}>TIME</th>
                {ACTIVE_DAYS.map(d => (
                  <th key={d} style={{ padding: '8px', border: '1px solid #cbd5e0', background: '#edf2f7', textAlign: 'center', fontWeight: 700 }}>
                    {FULL_DAYS[d]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Time rows: 08:00 – 15:00 in 1h bands */}
              {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'].map((hour) => {
                const nextHour = `${String(parseInt(hour) + 1).padStart(2, '0')}:00`;
                return (
                  <tr key={hour} style={{ height: '70px' }}>
                    <td style={{ padding: '6px', border: '1px solid #cbd5e0', textAlign: 'center', color: '#4a5568', verticalAlign: 'top', fontWeight: 600, background: '#f7fafc', fontSize: '10px' }}>
                      {hour}<br /><span style={{ color: '#a0aec0' }}>—</span><br />{nextHour}
                    </td>
                    {ACTIVE_DAYS.map(d => {
                      const inBand = dayMap[d].filter(s =>
                        s.start_time >= hour && s.start_time < nextHour
                      );
                      return (
                        <td key={d} style={{ border: '1px solid #cbd5e0', padding: '4px', verticalAlign: 'top' }}>
                          {inBand.map(slot => (
                            <div
                              key={slot.id}
                              style={{
                                background: slotColor(slot.course_id) + '22',
                                borderLeft: `3px solid ${slotColor(slot.course_id)}`,
                                borderRadius: '4px',
                                padding: '4px 6px',
                                marginBottom: '3px',
                                fontSize: '10px',
                              }}
                            >
                              <div style={{ fontWeight: 700, color: '#2d3748' }}>{slot.course?.subject?.name_en}</div>
                              <div style={{ color: '#4a5568' }}>{slot.start_time} – {slot.end_time}</div>
                              {slot.teacher && <div style={{ color: '#718096' }}>{slot.teacher.name}</div>}
                              {slot.room && <div style={{ color: '#a0aec0' }}>{slot.room.name}</div>}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Legend */}
        {!loading && slots.length > 0 && (
          <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Array.from(new Map(slots.map(s => [s.course_id, s])).values()).map(s => (
              <div key={s.course_id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: slotColor(s.course_id) }} />
                <span style={{ color: '#4a5568' }}>{s.course?.subject?.name_en} ({s.course?.code})</span>
              </div>
            ))}
          </div>
        )}

        {/* Signature block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#718096' }}>Approved by:</div>
            <div style={{ width: '160px', borderBottom: '1px solid #4a5568', marginTop: '30px' }} />
            <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>Dean of Academic Affairs</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#718096' }}>Verified by:</div>
            <div style={{ width: '160px', borderBottom: '1px solid #4a5568', marginTop: '30px', marginLeft: 'auto' }} />
            <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>Registrar</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableCalendarView;
