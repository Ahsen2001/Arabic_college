import React, { useEffect, useRef, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Chart, registerables } from 'chart.js';
import { Users, Clock, Clipboard, PieChart } from 'lucide-react';

Chart.register(...registerables);

interface AttendanceStats {
  today_student_rate: number;
  today_staff_rate: number;
  pending_leaves: number;
  distribution: {
    Present: number;
    Absent: number;
    Late: number;
    Excused: number;
  };
}

const AdminAttendanceAnalytics: React.FC = () => {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Canvas Refs
  const distChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstances = useRef<Chart[]>([]);

  useEffect(() => {
    fetchAnalytics();
    return () => {
      chartInstances.current.forEach(c => c.destroy());
    };
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/attendance/analytics');
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load attendance analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!stats) return;

    chartInstances.current.forEach(c => c.destroy());
    chartInstances.current = [];

    // Distribution Chart (Doughnut)
    if (distChartRef.current) {
      const labels = Object.keys(stats.distribution);
      const values = Object.values(stats.distribution);

      const chart = new Chart(distChartRef.current, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: [
              'rgba(16, 185, 129, 0.7)',  // Present
              'rgba(239, 68, 68, 0.7)',   // Absent
              'rgba(245, 158, 11, 0.7)',   // Late
              'rgba(99, 102, 241, 0.7)',   // Excused
            ],
            borderColor: 'rgba(9, 13, 22, 0.8)',
            borderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#f8fafc' }
            }
          }
        }
      });
      chartInstances.current.push(chart);
    }
  }, [stats]);

  if (loading) {
    return (
      <div className="fullscreen-loader">
        <div className="loader-card">
          <div className="spinner"></div>
          <p className="loading-text">Loading attendance board reports...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Registrar</span>
          <span className="badge badge-role">Attendance Analytics</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1>Attendance Reports & Analytics</h1>
          <p>Real-time indicators of daily student class attendance, staff clock-in, and leave logs.</p>
        </header>

        {/* Indicators Stats Cards */}
        <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          
          {/* Card 1: Students */}
          <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '50%' }}>
              <Users size={24} style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <span className="card-desc" style={{ fontSize: '11px', margin: '0' }}>Today's Student Roster</span>
              <h2 style={{ color: 'white', margin: '2px 0 0' }}>{stats.today_student_rate}% Present</h2>
            </div>
          </div>

          {/* Card 2: Staff */}
          <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '50%' }}>
              <Clock size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <span className="card-desc" style={{ fontSize: '11px', margin: '0' }}>Today's Faculty Clock-in</span>
              <h2 style={{ color: 'white', margin: '2px 0 0' }}>{stats.today_staff_rate}% Active</h2>
            </div>
          </div>

          {/* Card 3: Pending Leaves */}
          <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '50%' }}>
              <Clipboard size={24} style={{ color: 'var(--warning)' }} />
            </div>
            <div>
              <span className="card-desc" style={{ fontSize: '11px', margin: '0' }}>Pending Leave Requests</span>
              <h2 style={{ color: 'white', margin: '2px 0 0' }}>{stats.pending_leaves} Pending</h2>
            </div>
          </div>

        </div>

        {/* Charts & Metrics */}
        <div className="grid-container" style={{ margin: '0' }}>
          
          <div className="dashboard-card" style={{ gridColumn: 'span 2', minHeight: '340px' }}>
            <div className="card-header">
              <PieChart size={18} className="icon-header" />
              <h3>Cumulative Distribution Metrics</h3>
            </div>
            <div style={{ position: 'relative', height: '240px', width: '100%', marginTop: '10px' }}>
              <canvas ref={distChartRef} />
            </div>
          </div>

          <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '16px', borderRadius: '50%', marginBottom: '20px' }}>
              <Clipboard size={48} style={{ color: 'var(--success)' }} />
            </div>
            <h3>Roster Auditing summary</h3>
            <p className="card-desc" style={{ maxWidth: '300px', marginTop: '8px' }}>
              Verify attendance logs periodically to maintain compliance and graduation qualifications.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminAttendanceAnalytics;
