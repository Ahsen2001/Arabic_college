import React, { useEffect, useRef, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Chart, registerables } from 'chart.js';
import { Award, BarChart2 } from 'lucide-react';

Chart.register(...registerables);

interface StudentRank {
  rank: number;
  student_id: number;
  student_id_number: string;
  name: string;
  program: string;
  cgpa: number;
}

interface PerformanceData {
  success_rate: number;
  avg_scores: { [type: string]: number };
}

const CohortRanksDashboard: React.FC = () => {
  const [ranks, setRanks] = useState<StudentRank[]>([]);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProgram, setSelectedProgram] = useState('');
  const [programs, setPrograms] = useState<any[]>([]);

  // Canvas Refs
  const successChartRef = useRef<HTMLCanvasElement | null>(null);
  const scoresChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstances = useRef<Chart[]>([]);

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    fetchRankings();
  }, [selectedProgram]);

  const fetchBaseData = async () => {
    try {
      const response = await api.get('/admin/academic/programs');
      setPrograms(response.data.data);

      const perfRes = await api.get('/exams/analytics');
      setPerformance(perfRes.data.data);
    } catch (error) {
      toast.error('Failed to load base dashboard parameters.');
    }
  };

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/exams/ranks', {
        params: { program_id: selectedProgram || undefined }
      });
      setRanks(response.data.data);
    } catch (error) {
      toast.error('Failed to calculate cohort rankings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!performance) return;

    chartInstances.current.forEach(c => c.destroy());
    chartInstances.current = [];

    // 1. Success Rate Chart (Doughnut)
    if (successChartRef.current) {
      const chart = new Chart(successChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Passed (>=60%)', 'Failed (<60%)'],
          datasets: [{
            data: [performance.success_rate, 100 - performance.success_rate],
            backgroundColor: [
              'rgba(16, 185, 129, 0.7)', // green
              'rgba(239, 68, 68, 0.7)',  // red
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

    // 2. Average Marks by Type (Bar)
    if (scoresChartRef.current) {
      const labels = Object.keys(performance.avg_scores);
      const values = Object.values(performance.avg_scores).map(Number);

      const chart = new Chart(scoresChartRef.current, {
        type: 'bar',
        data: {
          labels: labels.length > 0 ? labels : ['No Data'],
          datasets: [{
            label: 'Avg Score',
            data: values.length > 0 ? values : [0],
            backgroundColor: 'rgba(99, 102, 241, 0.65)',
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: '#94a3b8' },
              grid: { color: 'rgba(255, 255, 255, 0.04)' }
            },
            x: {
              ticks: { color: '#94a3b8' },
              grid: { display: false }
            }
          }
        }
      });
      chartInstances.current.push(chart);
    }
  }, [performance]);

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Registrar</span>
          <span className="badge badge-role">Cohort Rankings Desk</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>Cohort Rankings & Statistics</h1>
            <p>Review student academic rankings by track and success percentages.</p>
          </div>

          <div className="input-group" style={{ margin: '0', width: '260px' }}>
            <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}>
              <option value="">All Degree Programs</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name_en} ({p.code})</option>
              ))}
            </select>
          </div>
        </header>

        {/* Charts Section */}
        <div className="grid-container" style={{ margin: '0 0 30px' }}>
          
          {/* Chart 1: Success Rate */}
          <div className="dashboard-card" style={{ minHeight: '340px' }}>
            <div className="card-header">
              <Award size={18} className="icon-header" style={{ color: 'var(--success)' }} />
              <h3>Overall Success Ratio</h3>
            </div>
            <div style={{ position: 'relative', height: '240px', width: '100%', marginTop: '10px' }}>
              <canvas ref={successChartRef} />
            </div>
          </div>

          {/* Chart 2: Avg Scores */}
          <div className="dashboard-card" style={{ gridColumn: 'span 2', minHeight: '340px' }}>
            <div className="card-header">
              <BarChart2 size={18} className="icon-header" style={{ color: 'var(--primary)' }} />
              <h3>Average Marks by Assessment Category</h3>
            </div>
            <div style={{ position: 'relative', height: '240px', width: '100%', marginTop: '10px' }}>
              <canvas ref={scoresChartRef} />
            </div>
          </div>

        </div>

        {/* Student Ranks */}
        {loading ? (
          <div className="spinner-center" style={{ minHeight: '200px' }}>
            <div className="spinner"></div>
          </div>
        ) : ranks.length > 0 ? (
          <div className="dashboard-card">
            <h3 style={{ fontSize: '15px', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '16px' }}>Student Standings Ledger</h3>
            <div className="downloads-table-container">
              <table className="downloads-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px', textAlign: 'center' }}>Rank Position</th>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Program Track</th>
                    <th>Cumulative GPA (CGPA)</th>
                  </tr>
                </thead>
                <tbody>
                  {ranks.map((r) => (
                    <tr key={r.student_id}>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${r.rank === 1 ? 'badge-permission' : (r.rank <= 3 ? 'badge-warning' : 'badge-role')}`} style={{ minWidth: '40px', display: 'inline-block', textAlign: 'center' }}>
                          # {r.rank}
                        </span>
                      </td>
                      <td><code>{r.student_id_number}</code></td>
                      <td><strong>{r.name}</strong></td>
                      <td>{r.program}</td>
                      <td>
                        <strong style={{ color: r.cgpa >= 3.5 ? 'var(--success)' : 'white' }}>{r.cgpa.toFixed(2)}</strong> / 4.00
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="no-data">No ranking lists computed.</div>
        )}
      </main>
    </div>
  );
};

export default CohortRanksDashboard;
