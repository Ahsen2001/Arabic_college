import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { AlertTriangle, Printer } from 'lucide-react';

interface OutstandingRow {
  id: number; invoice_number: string; student_name: string; student_id_no: string;
  semester: string; total_amount: number; total_paid: number; outstanding: number;
  due_date: string; status: string; is_overdue: boolean;
}

const CURRENCY = 'PKR';
const fmt = (n: number) => n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const OutstandingDues: React.FC = () => {
  const [rows, setRows] = useState<OutstandingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/finance/outstanding');
      setRows(res.data.data ?? []);
    } catch { toast.error('Failed to load outstanding dues.'); }
    finally { setLoading(false); }
  };

  const totalOutstanding = rows.reduce((s, r) => s + Number(r.outstanding), 0);
  const overdueRows = rows.filter(r => r.is_overdue);

  const handlePrint = () => window.print();

  return (
    <div className="dashboard-wrapper printable-admission-wrapper">
      <nav className="dashboard-nav no-print">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Finance</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={handlePrint} className="btn btn-primary btn-sm flex-center" style={{ gap: '6px' }}>
              <Printer size={13} /> Export PDF
            </button>
            <span className="badge badge-error">Outstanding Dues</span>
          </div>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1>Outstanding Dues Report</h1>
          <p>All issued and partially paid invoices with pending balances.</p>
        </header>

        {/* Summary */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', marginBottom: '24px' }}>
          {[
            { l: 'Total Outstanding', v: `${CURRENCY} ${fmt(totalOutstanding)}`, c: 'var(--warning)' },
            { l: 'Pending Invoices',  v: rows.length,                              c: 'var(--primary)' },
            { l: 'Overdue Invoices',  v: overdueRows.length,                       c: 'var(--error)' },
          ].map(s => (
            <div key={s.l} className="stat-card">
              <div className="stat-value" style={{ color: s.c }}>{s.v}</div>
              <div className="stat-label">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="spinner-center" style={{ minHeight: '300px' }}><div className="spinner" /></div>
        ) : rows.length > 0 ? (
          <div className="dashboard-card printable-summary-sheet">
            {/* Print header (hidden on screen) */}
            <div className="print-only" style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>ARABIC COLLEGE — OUTSTANDING DUES REPORT</h2>
              <p style={{ margin: '4px 0 0', fontSize: '11px' }}>As of {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="downloads-table-container">
              <table className="downloads-table">
                <thead>
                  <tr>
                    <th>#</th><th>Invoice</th><th>Student</th><th>Semester</th>
                    <th>Total</th><th>Paid</th><th>Outstanding</th>
                    <th>Due Date</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.id} style={{ background: r.is_overdue ? 'rgba(239,68,68,0.04)' : undefined }}>
                      <td>{idx + 1}</td>
                      <td><strong style={{ color: 'var(--primary)' }}>{r.invoice_number}</strong></td>
                      <td>
                        <div>{r.student_name}</div>
                        <div className="card-desc" style={{ fontSize: '11px' }}>{r.student_id_no}</div>
                      </td>
                      <td>{r.semester}</td>
                      <td>{fmt(Number(r.total_amount))}</td>
                      <td style={{ color: 'var(--success)' }}>{fmt(Number(r.total_paid))}</td>
                      <td style={{ color: 'var(--warning)', fontWeight: 700 }}>{fmt(Number(r.outstanding))}</td>
                      <td>
                        <span style={{ color: r.is_overdue ? 'var(--error)' : undefined }}>
                          {r.is_overdue && <AlertTriangle size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
                          {r.due_date}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${r.is_overdue ? 'badge-error' : 'badge-role'}`}>{r.is_overdue ? 'Overdue' : r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid rgba(255,255,255,0.1)', fontWeight: 700 }}>
                    <td colSpan={6} style={{ textAlign: 'right', paddingRight: '16px', color: '#94a3b8', fontSize: '12px' }}>TOTAL OUTSTANDING:</td>
                    <td style={{ color: 'var(--warning)', fontSize: '15px' }}>{fmt(totalOutstanding)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="no-data">No outstanding dues found! All invoices are settled. ✓</div>
        )}
      </main>
    </div>
  );
};

export default OutstandingDues;
