import React, { useEffect, useRef, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Chart, registerables } from 'chart.js';
import { TrendingUp, BarChart2, Award } from 'lucide-react';

Chart.register(...registerables);

interface HifzReportsData {
  milestones_distribution: { [key: string]: number };
  avg_mistakes_trend: { [key: string]: string | number };
  avg_tajweed_trend: { [key: string]: string | number };
}

const AdminHifzReports: React.FC = () => {
  const [data, setData] = useState<HifzReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Canvas Refs
  const milestonesChartRef = useRef<HTMLCanvasElement | null>(null);
  const mistakesChartRef = useRef<HTMLCanvasElement | null>(null);
  const tajweedChartRef = useRef<HTMLCanvasElement | null>(null);

  // Chart instances
  const chartInstances = useRef<Chart[]>([]);

  useEffect(() => {
    fetchReports();
    return () => {
      chartInstances.current.forEach(c => c.destroy());
    };
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/hifz/reports');
      setData(response.data.data);
    } catch (error) {
      toast.error('Failed to load Hifz cohort reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data) return;

    // Clear previous charts
    chartInstances.current.forEach(c => c.destroy());
    chartInstances.current = [];

    // 1. Milestones Distribution Chart (Bar)
    if (milestonesChartRef.current) {
      const labels = Object.keys(data.milestones_distribution);
      const values = Object.values(data.milestones_distribution);

      const chart = new Chart(milestonesChartRef.current, {
        type: 'bar',
        data: {
          labels: labels.length > 0 ? labels : ['No Milestones Granted'],
          datasets: [{
            label: 'Students Count',
            data: values.length > 0 ? values : [0],
            backgroundColor: 'rgba(99, 102, 241, 0.65)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 1,
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

    // 2. Mistakes Count Trend (Line)
    if (mistakesChartRef.current) {
      const labels = Object.keys(data.avg_mistakes_trend);
      const values = Object.values(data.avg_mistakes_trend).map(Number);

      const chart = new Chart(mistakesChartRef.current, {
        type: 'line',
        data: {
          labels: labels.length > 0 ? labels : ['No Logs Filed'],
          datasets: [{
            label: 'Avg Mistakes / Student',
            data: values.length > 0 ? values : [0],
            borderColor: 'rgba(239, 68, 68, 0.8)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2,
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

    // 3. Tajweed Performance Score Trend (Line)
    if (tajweedChartRef.current) {
      const labels = Object.keys(data.avg_tajweed_trend);
      const values = Object.values(data.avg_tajweed_trend).map(Number);

      const chart = new Chart(tajweedChartRef.current, {
        type: 'line',
        data: {
          labels: labels.length > 0 ? labels : ['No Logs Filed'],
          datasets: [{
            label: 'Avg Tajweed Score',
            data: values.length > 0 ? values : [100],
            borderColor: 'rgba(16, 185, 129, 0.8)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2,
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
              min: 0,
              max: 100,
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
  }, [data]);

  if (loading) {
    return (
      <div className="fullscreen-loader">
        <div className="loader-card">
          <div className="spinner"></div>
          <p className="loading-text">Loading Hifz analytics metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Sharia Portal</span>
          <span className="badge badge-role">Hifz Board Analytics</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1>Hifz Board Analytics</h1>
          <p>Analytical cohort monitoring of Tajweed performance scores, pronunciation mistake averages, and memorization milestones timeline.</p>
        </header>

        <div className="grid-container" style={{ margin: '0 0 30px' }}>
          
          {/* Chart 1: Milestones distribution */}
          <div className="dashboard-card" style={{ gridColumn: 'span 2', minHeight: '340px' }}>
            <div className="card-header">
              <Award size={18} className="icon-header" style={{ color: '#d4af37' }} />
              <h3>Milestones Distribution</h3>
            </div>
            <div style={{ position: 'relative', height: '240px', width: '100%', marginTop: '10px' }}>
              <canvas ref={milestonesChartRef} />
            </div>
          </div>

          {/* Quality highlight summary */}
          <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '16px', borderRadius: '50%', marginBottom: '20px' }}>
              <Award size={48} style={{ color: 'var(--primary)' }} />
            </div>
            <h3>Memorization Speed Index</h3>
            <p className="card-desc" style={{ maxWidth: '300px', marginTop: '8px' }}>
              Dynamic calculations track the average verses memorized daily by our Sharia cohorts.
            </p>
          </div>

        </div>

        <div className="grid-container" style={{ margin: '0' }}>
          
          {/* Chart 2: Mistakes trend */}
          <div className="dashboard-card" style={{ minHeight: '340px' }}>
            <div className="card-header">
              <BarChart2 size={18} className="icon-header" style={{ color: 'var(--error)' }} />
              <h3>Pronunciation Mistakes Trend</h3>
            </div>
            <div style={{ position: 'relative', height: '240px', width: '100%', marginTop: '10px' }}>
              <canvas ref={mistakesChartRef} />
            </div>
          </div>

          {/* Chart 3: Tajweed scores trend */}
          <div className="dashboard-card" style={{ gridColumn: 'span 2', minHeight: '340px' }}>
            <div className="card-header">
              <TrendingUp size={18} className="icon-header" style={{ color: 'var(--success)' }} />
              <h3>Average Tajweed Recitation Scores</h3>
            </div>
            <div style={{ position: 'relative', height: '240px', width: '100%', marginTop: '10px' }}>
              <canvas ref={tajweedChartRef} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminHifzReports;
