import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { Chart, registerables } from 'chart.js';
import { DollarSign, AlertTriangle, TrendingUp, Receipt, CreditCard, GraduationCap } from 'lucide-react';

Chart.register(...registerables);

interface Totals { revenue: number; outstanding: number; invoiced: number; }
interface MonthlyPoint { month: string; total: number; }
interface StatusBreak { status: string; count: number; total: number; }
interface MethodBreak { method: string; total: number; }

const CURRENCY = 'PKR';
const fmt = (n: number) =>
  n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const FinanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [totals, setTotals] = useState<Totals>({ revenue: 0, outstanding: 0, invoiced: 0 });
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);
  const [statusBreak, setStatusBreak] = useState<StatusBreak[]>([]);
  const [methodBreak, setMethodBreak] = useState<MethodBreak[]>([]);
  const [loading, setLoading] = useState(true);

  const lineRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutRef = useRef<HTMLCanvasElement | null>(null);
  const barRef = useRef<HTMLCanvasElement | null>(null);
  const charts = useRef<Chart[]>([]);

  useEffect(() => {
    fetchAnalytics();
    return () => { charts.current.forEach(c => c.destroy()); };
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/finance/analytics');
      const d = res.data.data;
      setTotals(d.totals);
      setMonthly(d.monthly_collections);
      setStatusBreak(d.status_breakdown);
      setMethodBreak(d.payment_method_stats);
    } catch {
      toast.error('Failed to load finance analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading || !monthly.length) return;
    charts.current.forEach(c => c.destroy());
    charts.current = [];

    const palette = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#0ea5e9'];

    // Monthly collections line
    if (lineRef.current) {
      charts.current.push(new Chart(lineRef.current, {
        type: 'line',
        data: {
          labels: monthly.map(m => m.month),
          datasets: [{
            label: 'Collections (' + CURRENCY + ')',
            data: monthly.map(m => m.total),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#6366f1',
            pointRadius: 5,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          },
        },
      }));
    }

    // Invoice status doughnut
    if (doughnutRef.current && statusBreak.length) {
      charts.current.push(new Chart(doughnutRef.current, {
        type: 'doughnut',
        data: {
          labels: statusBreak.map(s => s.status),
          datasets: [{ data: statusBreak.map(s => s.count), backgroundColor: palette, borderWidth: 0 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '70%',
          plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 } } } },
        },
      }));
    }

    // Payment method bar
    if (barRef.current && methodBreak.length) {
      charts.current.push(new Chart(barRef.current, {
        type: 'bar',
        data: {
          labels: methodBreak.map(m => m.method),
          datasets: [{ label: CURRENCY, data: methodBreak.map(m => m.total), backgroundColor: palette, borderRadius: 6 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
            y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          },
        },
      }));
    }
  }, [loading, monthly, statusBreak, methodBreak]);

  const quickLinks = [
    { label: 'Invoices & Payments', icon: Receipt,      path: '/admin/finance-invoices' },
    { label: 'Outstanding Dues',    icon: AlertTriangle, path: '/admin/finance-outstanding' },
    { label: 'Scholarships',        icon: GraduationCap, path: '/admin/finance-scholarships' },
    { label: 'Discounts',           icon: CreditCard,    path: '/admin/finance-discounts' },
  ];

  const collectionRate = totals.invoiced > 0
    ? Math.round((totals.revenue / totals.invoiced) * 100)
    : 0;

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Finance</span>
          <span className="badge badge-role">Finance Dashboard</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1>Finance Overview</h1>
          <p>Real-time revenue, outstanding dues, scholarship and payment analytics.</p>
        </header>

        {/* KPI Cards */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { label: 'Total Revenue',    value: fmt(totals.revenue),     sub: 'Payments collected',    icon: TrendingUp,    color: 'var(--success)' },
            { label: 'Total Invoiced',   value: fmt(totals.invoiced),    sub: 'All invoices sum',      icon: DollarSign,    color: 'var(--primary)' },
            { label: 'Outstanding',      value: fmt(totals.outstanding), sub: 'Unpaid / overdue',      icon: AlertTriangle, color: 'var(--warning)' },
            { label: 'Collection Rate',  value: collectionRate + '%',    sub: 'Revenue vs invoiced',   icon: CreditCard,    color: '#a855f7' },
          ].map(card => (
            <div key={card.label} className="stat-card">
              <div className="stat-icon" style={{ background: `${card.color}22` }}>
                <card.icon size={20} style={{ color: card.color }} />
              </div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
              <div className="card-desc" style={{ fontSize: '11px', marginTop: '4px' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick Nav */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '24px 0' }}>
          {quickLinks.map(l => (
            <button
              key={l.path}
              onClick={() => navigate(l.path)}
              className="btn btn-outline flex-center"
              style={{ gap: '8px', fontSize: '13px' }}
            >
              <l.icon size={14} /> {l.label}
            </button>
          ))}
        </div>

        {/* Charts */}
        {loading ? (
          <div className="spinner-center" style={{ minHeight: '300px' }}><div className="spinner" /></div>
        ) : (
          <>
            {/* Monthly line */}
            <div className="dashboard-card" style={{ marginBottom: '20px' }}>
              <div className="card-header">
                <TrendingUp size={16} className="icon-header" />
                <h3>Monthly Collections (Last 6 Months)</h3>
              </div>
              <div style={{ position: 'relative', height: '220px', marginTop: '12px' }}>
                <canvas ref={lineRef} />
              </div>
            </div>

            <div className="grid-container" style={{ margin: '0' }}>
              {/* Invoice status doughnut */}
              <div className="dashboard-card" style={{ minHeight: '280px' }}>
                <div className="card-header">
                  <Receipt size={16} className="icon-header" />
                  <h3>Invoice Status Distribution</h3>
                </div>
                <div style={{ position: 'relative', height: '220px', marginTop: '12px' }}>
                  <canvas ref={doughnutRef} />
                </div>
              </div>

              {/* Payment method bar */}
              <div className="dashboard-card" style={{ minHeight: '280px' }}>
                <div className="card-header">
                  <CreditCard size={16} className="icon-header" style={{ color: 'var(--success)' }} />
                  <h3>Collections by Payment Method</h3>
                </div>
                <div style={{ position: 'relative', height: '220px', marginTop: '12px' }}>
                  <canvas ref={barRef} />
                </div>
              </div>
            </div>

            {/* Invoice status table */}
            {statusBreak.length > 0 && (
              <div className="dashboard-card" style={{ marginTop: '20px' }}>
                <h3 style={{ color: 'white', marginBottom: '14px', fontSize: '14px' }}>Invoice Status Summary</h3>
                <div className="downloads-table-container">
                  <table className="downloads-table">
                    <thead>
                      <tr><th>Status</th><th>Invoices</th><th>Total Amount ({CURRENCY})</th></tr>
                    </thead>
                    <tbody>
                      {statusBreak.map(s => (
                        <tr key={s.status}>
                          <td><span className={`badge ${s.status === 'Paid' ? 'badge-permission' : s.status === 'Overdue' ? 'badge-error' : 'badge-role'}`}>{s.status}</span></td>
                          <td>{s.count}</td>
                          <td><strong>{fmt(Number(s.total))}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default FinanceDashboard;
