import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import {
  Plus, Search, Eye, Printer, DollarSign,
  X, Save, CheckCircle, Tag, Layers,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface InvoiceItem { fee_category_id: number; amount: number; description: string; }
interface Invoice {
  id: number; invoice_number: string; total_amount: number; due_date: string;
  total_paid?: number; outstanding?: number;
  status?: { name: string };
  student?: { student_id_number: string; user?: { name: string } };
  semester?: { name: string };
  items?: { id: number; amount: number; description?: string; fee_category_id: number }[];
  transactions?: { id: number; amount: number; transaction_date: string; paymentMethod?: { name: string }; transactionType?: { name: string } }[];
  discounts?: { id: number; applied_amount: number; discount?: { name: string } }[];
  installmentPlan?: {
    id: number; total_installments: number; installment_amount: number; status: string;
    payments?: { id: number; installment_number: number; due_date: string; amount_due: number; amount_paid: number; status: string }[];
  } | null;
}
interface Lookup { id: number; name: string; }

const CURRENCY = 'PKR';
const fmt = (n: number) => n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const statusColor = (s?: string) => s === 'Paid' ? 'badge-permission' : s === 'Overdue' ? 'badge-error' : s === 'Draft' ? 'badge-role' : 'badge-role';

// ─── PDF Receipt Printer ──────────────────────────────────────────────────────
const printReceipt = (inv: Invoice) => {
  const w = window.open('', '_blank')!;
  w.document.write(`
    <html><head><title>Receipt ${inv.invoice_number}</title>
    <style>
      body { font-family: 'Arial', sans-serif; color: #000; max-width:600px; margin:40px auto; font-size:13px; }
      .head { text-align:center; border-bottom:2px solid #2d3748; padding-bottom:12px; margin-bottom:20px; }
      .head h2 { margin:0; font-size:20px; } .head p { margin:4px 0; color:#4a5568; font-size:11px; }
      table { width:100%; border-collapse:collapse; margin:16px 0; }
      th { background:#edf2f7; padding:8px 10px; text-align:left; font-size:11px; border:1px solid #e2e8f0; }
      td { padding:8px 10px; border:1px solid #e2e8f0; font-size:12px; }
      .total-row td { font-weight:bold; background:#f7fafc; }
      .badge { display:inline-block; padding:2px 10px; border-radius:12px; font-size:11px; background:#d1fae5; color:#065f46; }
      .sig { display:flex; justify-content:space-between; margin-top:50px; border-top:1px solid #e2e8f0; padding-top:20px; }
      .sig-line { width:150px; border-bottom:1px solid #2d3748; margin-top:30px; }
    </style></head><body>
    <div class="head">
      <h2>ARABIC COLLEGE — OFFICIAL RECEIPT</h2>
      <p>Invoice: <strong>${inv.invoice_number}</strong> | Due: ${inv.due_date} | Status: <strong>${inv.status?.name ?? '—'}</strong></p>
      <p>Student: <strong>${inv.student?.user?.name ?? '—'}</strong> (${inv.student?.student_id_number ?? '—'}) | Semester: ${inv.semester?.name ?? '—'}</p>
    </div>
    <table>
      <thead><tr><th>Fee Component</th><th>Description</th><th style="text-align:right">Amount (${CURRENCY})</th></tr></thead>
      <tbody>
        ${(inv.items ?? []).map(it => `<tr><td>Fee #${it.fee_category_id}</td><td>${it.description ?? '—'}</td><td style="text-align:right">${fmt(Number(it.amount))}</td></tr>`).join('')}
        ${(inv.discounts ?? []).map(d => `<tr style="color:#065f46"><td colspan="2">Discount: ${d.discount?.name ?? '—'}</td><td style="text-align:right">- ${fmt(Number(d.applied_amount))}</td></tr>`).join('')}
        <tr class="total-row"><td colspan="2">Total Amount</td><td style="text-align:right">${fmt(Number(inv.total_amount))}</td></tr>
        <tr class="total-row"><td colspan="2">Total Paid</td><td style="text-align:right; color:#065f46">${fmt(Number(inv.total_paid ?? 0))}</td></tr>
        <tr class="total-row"><td colspan="2">Outstanding Balance</td><td style="text-align:right; color:#c53030">${fmt(Number(inv.outstanding ?? 0))}</td></tr>
      </tbody>
    </table>
    <h4 style="margin-bottom:6px">Payment History</h4>
    <table>
      <thead><tr><th>Date</th><th>Method</th><th>Type</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        ${(inv.transactions ?? []).map(t => `<tr><td>${t.transaction_date}</td><td>${t.paymentMethod?.name ?? '—'}</td><td>${t.transactionType?.name ?? '—'}</td><td style="text-align:right">${fmt(Number(t.amount))}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="sig">
      <div><div class="sig-line"></div><p style="font-size:11px">Accountant</p></div>
      <div><div class="sig-line" style="margin-left:auto"></div><p style="font-size:11px;text-align:right">Student Signature</p></div>
    </div>
    <p style="text-align:center;font-size:10px;color:#a0aec0;margin-top:30px">Generated on ${new Date().toLocaleString()} | Arabic College Management System</p>
    </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
};

// ─── Main Component ───────────────────────────────────────────────────────────
const InvoiceManager: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Lookups
  const [feeCategories, setFeeCategories] = useState<Lookup[]>([]);
  const [semesters, setSemesters] = useState<Lookup[]>([]);
  const [students, setStudents] = useState<{ id: number; student_id_number: string; user?: { name: string } }[]>([]);
  const [discounts, setDiscounts] = useState<{ id: number; name: string; code: string; type: string; value: number }[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Lookup[]>([]);

  // Detail modal
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  // Create invoice modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ student_id: 0, semester_id: 0, due_date: '' });
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([{ fee_category_id: 0, amount: 0, description: '' }]);

  // Payment modal
  const [payForm, setPayForm] = useState({ invoice_id: 0, amount: 0, payment_method_id: 0, transaction_date: new Date().toISOString().slice(0, 10), reference_number: '', description: '' });
  const [showPayModal, setShowPayModal] = useState(false);

  // Installment modal
  const [showInstModal, setShowInstModal] = useState(false);
  const [instForm, setInstForm] = useState({ invoice_id: 0, total_installments: 3, first_due_date: '', interval_days: 30 });

  // Discount modal
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountInvoiceId, setDiscountInvoiceId] = useState(0);
  const [selectedDiscountId, setSelectedDiscountId] = useState(0);

  useEffect(() => {
    fetchAll();
    fetchLookups();
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, stRes, semRes] = await Promise.all([
        api.get('/finance/invoices', { params: { search } }),
        api.get('/admin/students'),
        api.get('/admin/academic/semesters'),
      ]);
      setInvoices(invRes.data.data?.data ?? invRes.data.data ?? []);
      setStudents(stRes.data.data?.data ?? stRes.data.data ?? []);
      setSemesters(semRes.data.data ?? []);
    } catch {
      toast.error('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchLookups = async () => {
    try {
      const res = await api.get('/finance/lookups');
      const d = res.data.data;
      setFeeCategories(d.fee_categories ?? []);
      setDiscounts(d.discounts ?? []);
      setPaymentMethods(d.payment_methods ?? []);
    } catch {
      toast.error('Failed to load finance lookups.');
    }
  };

  const loadDetail = async (id: number) => {
    try {
      const res = await api.get(`/finance/invoices/${id}`);
      setDetailInvoice(res.data.data);
    } catch {
      toast.error('Failed to load invoice detail.');
    }
  };

  // ── Create Invoice ─────────────────────────────────────────────────────────
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Creating invoice…');
    try {
      await api.post('/finance/invoices', {
        ...createForm,
        items: lineItems.filter(i => i.fee_category_id > 0 && i.amount > 0),
      });
      toast.success('Invoice created!', { id: toastId });
      setShowCreateModal(false);
      setLineItems([{ fee_category_id: 0, amount: 0, description: '' }]);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to create invoice.', { id: toastId });
    }
  };

  const handleIssueInvoice = async (id: number) => {
    const toastId = toast.loading('Issuing invoice…');
    try {
      await api.post(`/finance/invoices/${id}/issue`);
      toast.success('Invoice issued!', { id: toastId });
      fetchAll();
      if (detailInvoice?.id === id) loadDetail(id);
    } catch {
      toast.error('Failed to issue invoice.', { id: toastId });
    }
  };

  // ── Payment ────────────────────────────────────────────────────────────────
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Recording payment…');
    try {
      await api.post('/finance/payments', payForm);
      toast.success('Payment recorded!', { id: toastId });
      setShowPayModal(false);
      fetchAll();
      if (detailInvoice) loadDetail(detailInvoice.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Payment failed.', { id: toastId });
    }
  };

  // ── Installment ────────────────────────────────────────────────────────────
  const handleCreateInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Creating installment plan…');
    try {
      await api.post('/finance/installments', instForm);
      toast.success('Installment plan created!', { id: toastId });
      setShowInstModal(false);
      if (detailInvoice) loadDetail(detailInvoice.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Plan creation failed.', { id: toastId });
    }
  };

  const handlePayInstallment = async (installmentId: number) => {
    const methodId = paymentMethods[0]?.id;
    if (!methodId) return;
    const toastId = toast.loading('Paying installment…');
    try {
      await api.post(`/finance/installments/${installmentId}/pay`, { payment_method_id: methodId });
      toast.success('Installment marked paid!', { id: toastId });
      if (detailInvoice) loadDetail(detailInvoice.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Installment payment failed.', { id: toastId });
    }
  };

  // ── Apply Discount ─────────────────────────────────────────────────────────
  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Applying discount…');
    try {
      await api.post(`/finance/invoices/${discountInvoiceId}/discount`, { discount_id: selectedDiscountId });
      toast.success('Discount applied!', { id: toastId });
      setShowDiscountModal(false);
      fetchAll();
      if (detailInvoice?.id === discountInvoiceId) loadDetail(discountInvoiceId);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to apply discount.', { id: toastId });
    }
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Finance</span>
          <span className="badge badge-role">Invoice Manager</span>
        </div>
      </nav>

      <main className="dashboard-content">
        {/* Header */}
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Invoices & Payments</h1>
            <p>Create invoices, record payments, apply discounts, set up installment plans and print receipts.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm flex-center">
            <Plus size={14} style={{ marginRight: '6px' }} /> Create Invoice
          </button>
        </header>

        {/* Search */}
        <div className="dashboard-card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', maxWidth: '360px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search by invoice number…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchAll()}
              style={{ paddingLeft: '36px', width: '100%' }}
              className="search-input"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="spinner-center" style={{ minHeight: '300px' }}><div className="spinner" /></div>
        ) : (
          <div className="dashboard-card">
            <div className="downloads-table-container">
              <table className="downloads-table">
                <thead>
                  <tr>
                    <th>Invoice #</th><th>Student</th><th>Semester</th>
                    <th>Total ({CURRENCY})</th><th>Paid</th><th>Outstanding</th>
                    <th>Due Date</th><th>Status</th><th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td><strong style={{ color: 'var(--primary)' }}>{inv.invoice_number}</strong></td>
                      <td>
                        <div>{inv.student?.user?.name ?? '—'}</div>
                        <div className="card-desc" style={{ fontSize: '11px' }}>{inv.student?.student_id_number}</div>
                      </td>
                      <td>{inv.semester?.name ?? '—'}</td>
                      <td>{fmt(Number(inv.total_amount))}</td>
                      <td style={{ color: 'var(--success)' }}>{fmt(Number(inv.total_paid ?? 0))}</td>
                      <td style={{ color: Number(inv.outstanding) > 0 ? 'var(--warning)' : 'var(--success)' }}>
                        {fmt(Number(inv.outstanding ?? 0))}
                      </td>
                      <td>{inv.due_date}</td>
                      <td><span className={`badge ${statusColor(inv.status?.name)}`}>{inv.status?.name ?? '—'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button onClick={() => loadDetail(inv.id)} className="btn btn-outline btn-sm" title="View Detail" style={{ padding: '4px 8px' }}><Eye size={12} /></button>
                          <button onClick={() => { setPayForm(f => ({ ...f, invoice_id: inv.id, amount: Number(inv.outstanding ?? 0) })); setShowPayModal(true); }} className="btn btn-primary btn-sm" style={{ padding: '4px 8px' }} title="Record Payment"><DollarSign size={12} /></button>
                          <button onClick={() => { setDiscountInvoiceId(inv.id); setSelectedDiscountId(discounts[0]?.id ?? 0); setShowDiscountModal(true); }} className="btn btn-outline btn-sm" style={{ padding: '4px 8px' }} title="Apply Discount"><Tag size={12} /></button>
                          {inv.status?.name === 'Draft' && (
                            <button onClick={() => handleIssueInvoice(inv.id)} className="btn btn-outline btn-sm" style={{ padding: '4px 8px', color: 'var(--success)' }} title="Issue Invoice"><CheckCircle size={12} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No invoices found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── Invoice Detail Modal ─────────────────────────────────────────── */}
      {detailInvoice && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.8)', zIndex: 9999 }}>
          <div className="auth-card" style={{ maxWidth: '760px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, color: 'white' }}>{detailInvoice.invoice_number}</h2>
                <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '13px' }}>
                  {detailInvoice.student?.user?.name} · {detailInvoice.semester?.name}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => printReceipt(detailInvoice)} className="btn btn-primary btn-sm flex-center" style={{ gap: '6px' }}>
                  <Printer size={13} /> Print Receipt
                </button>
                {!detailInvoice.installmentPlan && (
                  <button onClick={() => { setInstForm(f => ({ ...f, invoice_id: detailInvoice.id, first_due_date: detailInvoice.due_date })); setShowInstModal(true); }} className="btn btn-outline btn-sm flex-center" style={{ gap: '6px' }}>
                    <Layers size={13} /> Installments
                  </button>
                )}
                <button onClick={() => setDetailInvoice(null)} className="btn btn-outline btn-sm"><X size={13} /></button>
              </div>
            </div>

            {/* Summary row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
              {[
                { l: 'Total', v: fmt(Number(detailInvoice.total_amount)), c: '#fff' },
                { l: 'Paid', v: fmt(Number(detailInvoice.total_paid ?? 0)), c: 'var(--success)' },
                { l: 'Outstanding', v: fmt(Number(detailInvoice.outstanding ?? 0)), c: 'var(--warning)' },
              ].map(s => (
                <div key={s.l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{CURRENCY} · {s.l}</div>
                </div>
              ))}
            </div>

            {/* Items */}
            <h4 style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Line Items</h4>
            <table className="downloads-table" style={{ marginBottom: '16px' }}>
              <thead><tr><th>Category</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
              <tbody>
                {(detailInvoice.items ?? []).map(it => (
                  <tr key={it.id}><td>Fee #{it.fee_category_id}</td><td>{it.description ?? '—'}</td><td style={{ textAlign: 'right' }}>{fmt(Number(it.amount))}</td></tr>
                ))}
                {(detailInvoice.discounts ?? []).map(d => (
                  <tr key={d.id} style={{ color: 'var(--success)' }}><td colSpan={2}>Discount: {d.discount?.name}</td><td style={{ textAlign: 'right' }}>− {fmt(Number(d.applied_amount))}</td></tr>
                ))}
              </tbody>
            </table>

            {/* Transactions */}
            {(detailInvoice.transactions ?? []).length > 0 && (
              <>
                <h4 style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment History</h4>
                <table className="downloads-table" style={{ marginBottom: '16px' }}>
                  <thead><tr><th>Date</th><th>Method</th><th>Ref.</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                  <tbody>
                    {(detailInvoice.transactions ?? []).map(t => (
                      <tr key={t.id}>
                        <td>{t.transaction_date}</td>
                        <td>{t.paymentMethod?.name ?? '—'}</td>
                        <td><span className="card-desc" style={{ fontSize: '11px' }}>—</span></td>
                        <td style={{ textAlign: 'right', color: 'var(--success)' }}>{fmt(Number(t.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Installment Plan */}
            {detailInvoice.installmentPlan && (
              <>
                <h4 style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Installment Plan</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {(detailInvoice.installmentPlan.payments ?? []).map(p => (
                    <div key={p.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px 14px', minWidth: '140px' }}>
                      <div style={{ fontWeight: 700, color: 'white', fontSize: '12px' }}>Inst. #{p.installment_number}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0' }}>Due: {p.due_date}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: p.status === 'Paid' ? 'var(--success)' : 'var(--warning)' }}>{fmt(Number(p.amount_due))} {CURRENCY}</div>
                      <span className={`badge ${p.status === 'Paid' ? 'badge-permission' : 'badge-role'}`} style={{ marginTop: '6px', display: 'inline-block', fontSize: '10px' }}>{p.status}</span>
                      {p.status === 'Pending' && (
                        <button onClick={() => handlePayInstallment(p.id)} className="btn btn-primary btn-sm" style={{ marginTop: '8px', width: '100%', padding: '4px 8px', fontSize: '11px' }}>
                          Pay Now
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Create Invoice Modal ─────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="auth-card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="auth-header"><h2>Create Invoice</h2><p>Add line items; invoice total will be summed automatically.</p></div>
            <form onSubmit={handleCreateInvoice} className="auth-form">
              <div className="grid-2">
                <div className="input-group">
                  <label>Student</label>
                  <select value={createForm.student_id} onChange={e => setCreateForm(f => ({ ...f, student_id: parseInt(e.target.value) }))} required>
                    <option value={0} disabled>Select student…</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.user?.name} ({s.student_id_number})</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Semester</label>
                  <select value={createForm.semester_id} onChange={e => setCreateForm(f => ({ ...f, semester_id: parseInt(e.target.value) }))} required>
                    <option value={0} disabled>Select semester…</option>
                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Due Date</label>
                <input type="date" value={createForm.due_date} onChange={e => setCreateForm(f => ({ ...f, due_date: e.target.value }))} required />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ color: '#94a3b8', fontSize: '13px' }}>Line Items</label>
                  <button type="button" onClick={() => setLineItems(l => [...l, { fee_category_id: 0, amount: 0, description: '' }])} className="btn btn-outline btn-sm flex-center" style={{ gap: '4px', fontSize: '11px' }}>
                    <Plus size={11} /> Add Row
                  </button>
                </div>
                {lineItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
                    <select value={item.fee_category_id} onChange={e => setLineItems(l => l.map((li, i) => i === idx ? { ...li, fee_category_id: parseInt(e.target.value) } : li))}>
                      <option value={0}>Category…</option>
                      {feeCategories.map(fc => <option key={fc.id} value={fc.id}>{fc.name}</option>)}
                    </select>
                    <input type="text" placeholder="Description" value={item.description} onChange={e => setLineItems(l => l.map((li, i) => i === idx ? { ...li, description: e.target.value } : li))} />
                    <input type="number" placeholder="Amount" min={0} value={item.amount || ''} onChange={e => setLineItems(l => l.map((li, i) => i === idx ? { ...li, amount: parseFloat(e.target.value) || 0 } : li))} />
                    {idx > 0 && <button type="button" onClick={() => setLineItems(l => l.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><X size={14} /></button>}
                    {idx === 0 && <div />}
                  </div>
                ))}
                <div style={{ textAlign: 'right', fontWeight: 700, color: 'white', fontSize: '14px', marginTop: '8px' }}>
                  Total: {CURRENCY} {fmt(lineItems.reduce((s, i) => s + (i.amount || 0), 0))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Save size={14} style={{ marginRight: '6px' }} />Create Invoice</button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline"><X size={14} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Pay Modal ────────────────────────────────────────────────────── */}
      {showPayModal && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="auth-card" style={{ maxWidth: '460px', width: '100%' }}>
            <div className="auth-header"><h2>Record Payment</h2><p>Post a credit transaction to this invoice.</p></div>
            <form onSubmit={handleRecordPayment} className="auth-form">
              <div className="input-group"><label>Amount ({CURRENCY})</label><input type="number" min={0.01} step={0.01} value={payForm.amount || ''} onChange={e => setPayForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} required /></div>
              <div className="grid-2">
                <div className="input-group"><label>Payment Method</label><select value={payForm.payment_method_id} onChange={e => setPayForm(f => ({ ...f, payment_method_id: parseInt(e.target.value) }))} required>
                  <option value={0} disabled>Select…</option>
                  {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select></div>
                <div className="input-group"><label>Date</label><input type="date" value={payForm.transaction_date} onChange={e => setPayForm(f => ({ ...f, transaction_date: e.target.value }))} required /></div>
              </div>
              <div className="input-group"><label>Reference # (optional)</label><input type="text" value={payForm.reference_number} onChange={e => setPayForm(f => ({ ...f, reference_number: e.target.value }))} /></div>
              <div className="input-group"><label>Description (optional)</label><input type="text" value={payForm.description} onChange={e => setPayForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Record Payment</button>
                <button type="button" onClick={() => setShowPayModal(false)} className="btn btn-outline"><X size={14} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Installment Modal ─────────────────────────────────────────────── */}
      {showInstModal && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="auth-card" style={{ maxWidth: '440px', width: '100%' }}>
            <div className="auth-header"><h2>Create Installment Plan</h2><p>Split the invoice balance into equal monthly payments.</p></div>
            <form onSubmit={handleCreateInstallment} className="auth-form">
              <div className="grid-2">
                <div className="input-group"><label>Total Installments</label><input type="number" min={2} max={12} value={instForm.total_installments} onChange={e => setInstForm(f => ({ ...f, total_installments: parseInt(e.target.value) || 3 }))} required /></div>
                <div className="input-group"><label>Interval (days)</label><input type="number" min={7} max={90} value={instForm.interval_days} onChange={e => setInstForm(f => ({ ...f, interval_days: parseInt(e.target.value) || 30 }))} /></div>
              </div>
              <div className="input-group"><label>First Due Date</label><input type="date" value={instForm.first_due_date} onChange={e => setInstForm(f => ({ ...f, first_due_date: e.target.value }))} required /></div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Plan</button>
                <button type="button" onClick={() => setShowInstModal(false)} className="btn btn-outline"><X size={14} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Discount Modal ─────────────────────────────────────────────────── */}
      {showDiscountModal && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="auth-card" style={{ maxWidth: '400px', width: '100%' }}>
            <div className="auth-header"><h2>Apply Discount</h2><p>The discount will be deducted from the invoice total.</p></div>
            <form onSubmit={handleApplyDiscount} className="auth-form">
              <div className="input-group">
                <label>Select Discount</label>
                <select value={selectedDiscountId} onChange={e => setSelectedDiscountId(parseInt(e.target.value))} required>
                  {discounts.map(d => <option key={d.id} value={d.id}>{d.name} — {d.type === 'percentage' ? d.value + '%' : CURRENCY + ' ' + d.value}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Apply</button>
                <button type="button" onClick={() => setShowDiscountModal(false)} className="btn btn-outline"><X size={14} /></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManager;
