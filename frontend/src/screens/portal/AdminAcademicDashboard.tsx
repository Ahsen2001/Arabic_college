import React, { useEffect, useRef, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Chart, registerables } from 'chart.js';
import { TrendingUp, PieChart, BarChart2, Award } from 'lucide-react';

Chart.register(...registerables);

interface AnalyticsData {
  grades_distribution: { [key: string]: number };
  program_gpas: { [key: string]: string | number };
  rates: {
    passed: number;
    failed: number;
  };
}

const AdminAcademicDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Canvas Refs
  const gradesChartRef = useRef<HTMLCanvasElement | null>(null);
  const ratesChartRef = useRef<HTMLCanvasElement | null>(null);
  const programsChartRef = useRef<HTMLCanvasElement | null>(null);

  // Chart instances to destroy on cleanup
  const chartInstances = useRef<Chart[]>([]);

  useEffect(() => {
    fetchAnalytics();
    return () => {
      // Clean up chart instances
      chartInstances.current.forEach(c => c.destroy());
    };
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/shareea/analytics');
      setData(response.data.data);
    } catch (error) {
      toast.error('Failed to load cohort analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data) return;

    // Clear previous charts
    chartInstances.current.forEach(c => c.destroy());
    chartInstances.current = [];

    // 1. Grade Distribution Chart (Bar)
    if (gradesChartRef.current) {
      const gradesLabels = Object.keys(data.grades_distribution);
      const gradesValues = Object.values(data.grades_distribution);

      const chart = new Chart(gradesChartRef.current, {
        type: 'bar',
        data: {
          labels: gradesLabels,
          datasets: [{
            label: 'Students Count',
            data: gradesValues,
            backgroundColor: [
              'rgba(99, 102, 241, 0.65)',  // A+
              'rgba(99, 102, 241, 0.5)',   // A
              'rgba(16, 185, 129, 0.65)',  // B+
              'rgba(16, 185, 129, 0.5)',   // B
              'rgba(245, 158, 11, 0.65)',  // C+
              'rgba(245, 158, 11, 0.5)',   // C
              'rgba(139, 92, 246, 0.65)',  // D
              'rgba(239, 68, 68, 0.65)',   // F
            ],
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
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

    // 2. Passing Rates Chart (Doughnut)
    if (ratesChartRef.current) {
      const chart = new Chart(ratesChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Passed', 'Failed'],
          datasets: [{
            data: [data.rates.passed, data.rates.failed],
            backgroundColor: [
              'rgba(16, 185, 129, 0.7)', // Pass
              'rgba(239, 68, 68, 0.7)',  // Fail
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

    // 3. Program GPAs Chart (Horizontal Bar)
    if (programsChartRef.current) {
      const programLabels = Object.keys(data.program_gpas);
      const programGPAs = Object.values(data.program_gpas).map(Number);

      const chart = new Chart(programsChartRef.current, {
        type: 'bar',
        data: {
          labels: programLabels,
          datasets: [{
            label: 'Avg GPA',
            data: programGPAs,
            backgroundColor: 'rgba(168, 85, 247, 0.65)', // purple
            borderRadius: 6,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              max: 4.0,
              ticks: { color: '#94a3b8' },
              grid: { color: 'rgba(255, 255, 255, 0.04)' }
            },
            y: {
              ticks: { color: '#94a3b8' },
              grid: { display: false }
            }
          }
        }
      });
      chartInstances.current.push(chart);
    }
  }, [data]);

  if (loading) {
    return (
      <div className="fullscreen-loader">
        <div className="loader-card">
          <div className="spinner"></div>
          <p className="loading-text">Loading academic reports dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Sharia Portal</span>
          <span className="badge badge-role">Academic Analytics</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1>Cohort Academic Analytics</h1>
          <p>Visual reporting maps of final grade distributions, pass percentages, and average GPAs across degree programs.</p>
        </header>

        <div className="grid-container" style={{ margin: '0 0 30px' }}>
          
          {/* Box 1: Grade counts */}
          <div className="dashboard-card" style={{ gridColumn: 'span 2', minHeight: '340px' }}>
            <div className="card-header">
              <BarChart2 size={18} className="icon-header" />
              <h3>Letter Grade Distribution</h3>
            </div>
            <div style={{ position: 'relative', height: '240px', width: '100%', marginTop: '10px' }}>
              <canvas ref={gradesChartRef} />
            </div>
          </div>

          {/* Box 2: Pass/Fail */}
          <div className="dashboard-card" style={{ minHeight: '340px' }}>
            <div className="card-header">
              <PieChart size={18} className="icon-header" />
              <h3>Passing / Failing Rates</h3>
            </div>
            <div style={{ position: 'relative', height: '240px', width: '100%', marginTop: '10px' }}>
              <canvas ref={ratesChartRef} />
            </div>
          </div>

        </div>

        <div className="grid-container" style={{ margin: '0' }}>
          
          {/* Box 3: Avg GPAs */}
          <div className="dashboard-card" style={{ gridColumn: 'span 2', minHeight: '340px' }}>
            <div className="card-header">
              <TrendingUp size={18} className="icon-header" />
              <h3>Average GPA by Degree Program</h3>
            </div>
            <div style={{ position: 'relative', height: '240px', width: '100%', marginTop: '10px' }}>
              <canvas ref={programsChartRef} />
            </div>
          </div>

          {/* Box 4: Quality Indicator */}
          <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '16px', borderRadius: '50%', marginBottom: '20px' }}>
              <Award size={48} style={{ color: 'var(--success)' }} />
            </div>
            <h3>Faculty Board Summary</h3>
            <p className="card-desc" style={{ maxWidth: '300px', marginTop: '8px' }}>
              Excellent syllabus alignment shows high pass percentages in linguistic tracks and Sharia sciences.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminAcademicDashboard;
