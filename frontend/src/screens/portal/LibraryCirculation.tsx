import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Search, Plus, X, 
  AlertTriangle, DollarSign, RefreshCcw 
} from 'lucide-react';

interface BorrowRecord {
  id: number;
  borrow_date: string;
  due_date: string;
  return_date?: string | null;
  fine_amount: number;
  status_id: number;
  book?: {
    id: number;
    title: string;
    authors: string;
    barcode?: string;
  };
  user?: {
    name: string;
    student?: {
      student_id_number: string;
    };
  };
  status?: {
    name: string;
  };
}

interface BookOption { id: number; title: string; barcode?: string; available_copies: number; }

const LibraryCirculation: React.FC = () => {
  const navigate = useNavigate();

  // Records
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [booksList, setBooksList] = useState<BookOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');

  // Borrow Modal
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowForm, setBorrowForm] = useState({
    book_id: 0,
    barcode: '',
    student_id_number: '',
    duration_days: 14
  });

  // Return Modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState<BorrowRecord | null>(null);
  const [returnForm, setReturnForm] = useState({
    status: 'Returned',
    custom_fine: 0
  });

  useEffect(() => {
    fetchBorrows();
    fetchBooksList();
  }, [selectedStatusFilter]);

  const fetchBorrows = async () => {
    setLoading(true);
    try {
      const res = await api.get('/library/borrows', {
        params: {
          search,
          status_id: selectedStatusFilter || undefined
        }
      });
      setBorrows(res.data.data.data ?? res.data.data ?? []);
    } catch {
      toast.error('Failed to load circulation records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBooksList = async () => {
    try {
      const res = await api.get('/library/books', { params: { limit: 100 } });
      const books = res.data.data.data ?? res.data.data ?? [];
      setBooksList(books.map((b: any) => ({
        id: b.id,
        title: b.title,
        barcode: b.barcode,
        available_copies: b.available_copies
      })));
    } catch {
      // Catch silently
    }
  };

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowForm.student_id_number) {
      toast.error('Please input a student registration ID.');
      return;
    }
    if (!borrowForm.book_id && !borrowForm.barcode) {
      toast.error('Please select a book or input its barcode.');
      return;
    }

    const toastId = toast.loading('Processing borrow transaction...');
    try {
      await api.post('/library/borrow', {
        book_id: borrowForm.book_id > 0 ? borrowForm.book_id : null,
        barcode: borrowForm.barcode || null,
        student_id_number: borrowForm.student_id_number,
        duration_days: borrowForm.duration_days
      });
      toast.success('Book checkout processed successfully!', { id: toastId });
      setShowBorrowModal(false);
      setBorrowForm({ book_id: 0, barcode: '', student_id_number: '', duration_days: 14 });
      fetchBorrows();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Checkout failed.', { id: toastId });
    }
  };

  const openReturnModal = (record: BorrowRecord) => {
    setSelectedBorrow(record);
    
    // Auto-calculate dynamic late fee
    const dueDate = new Date(record.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let computedFine = 0;
    if (today > dueDate) {
      const diffTime = Math.abs(today.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      computedFine = diffDays * 50; // 50 PKR/day
    }

    setReturnForm({
      status: 'Returned',
      custom_fine: computedFine
    });
    setShowReturnModal(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBorrow) return;

    const toastId = toast.loading('Processing book return...');
    try {
      await api.post('/library/return', {
        borrow_id: selectedBorrow.id,
        status: returnForm.status,
        custom_fine: returnForm.custom_fine
      });
      toast.success('Book returned successfully!', { id: toastId });
      setShowReturnModal(false);
      setSelectedBorrow(null);
      fetchBorrows();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Return failed.', { id: toastId });
    }
  };

  // Status highlights
  const isOverdue = (dueDateStr: string) => {
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today > dueDate;
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <button onClick={() => navigate('/admin/library')} className="btn btn-outline btn-sm flex-center" style={{ gap: '6px' }}>
            <ArrowLeft size={13} /> Catalog
          </button>
          <span className="brand-logo">Sharia Library Circulation</span>
          <button onClick={() => setShowBorrowModal(true)} className="btn btn-primary btn-sm flex-center" style={{ gap: '6px' }}>
            <Plus size={14} /> New Checkout
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1>Circulation & Checkout Desk</h1>
          <p>Process book checkout logs, compute late return fees, and handle returns.</p>
        </header>

        {/* Filter and Search Bar */}
        <div className="dashboard-card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', maxWidth: '340px', width: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search by student name or book title..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchBorrows()}
                style={{ paddingLeft: '36px', width: '100%' }}
                className="search-input"
              />
            </div>
            <div className="flex-align" style={{ gap: '12px' }}>
              <select 
                value={selectedStatusFilter} 
                onChange={e => setSelectedStatusFilter(e.target.value)}
                style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-glass)', padding: '8px 12px', color: '#fff', borderRadius: '8px', fontSize: '13px' }}
              >
                <option value="">Issued & Overdue</option>
                <option value="1">Issued</option>
                <option value="2">Returned</option>
                <option value="3">Overdue</option>
                <option value="4">Lost</option>
              </select>
              <button onClick={fetchBorrows} className="btn btn-primary btn-sm">Refresh</button>
            </div>
          </div>
        </div>

        {/* Borrows Log */}
        {loading ? (
          <div className="spinner-center" style={{ minHeight: '200px' }}><div className="spinner" /></div>
        ) : (
          <div className="dashboard-card">
            <div className="downloads-table-container">
              <table className="downloads-table">
                <thead>
                  <tr>
                    <th>Student Name & Reg ID</th>
                    <th>Book Details</th>
                    <th>Borrow Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Fine</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {borrows.map(record => {
                    const overdue = isOverdue(record.due_date) && record.status_id === 1;
                    return (
                      <tr key={record.id} style={{ background: overdue ? 'rgba(239,68,68,0.04)' : undefined }}>
                        <td>
                          <strong>{record.user?.name}</strong>
                          <div className="card-desc" style={{ fontSize: '11px' }}>ID: {record.user?.student?.student_id_number}</div>
                        </td>
                        <td>
                          <strong>{record.book?.title}</strong>
                          <div className="card-desc" style={{ fontSize: '11px' }}>Barcode: {record.book?.barcode || '—'}</div>
                        </td>
                        <td>{record.borrow_date}</td>
                        <td>
                          <span style={{ color: overdue ? 'var(--error)' : undefined }}>
                            {overdue && <AlertTriangle size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
                            {record.due_date}
                          </span>
                        </td>
                        <td>{record.return_date || '—'}</td>
                        <td style={{ color: record.fine_amount > 0 ? 'var(--warning)' : undefined }}>
                          {record.fine_amount > 0 ? `PKR ${record.fine_amount}` : '—'}
                        </td>
                        <td>
                          <span className={`badge ${
                            record.status_id === 2 ? 'badge-permission' : 
                            (record.status_id === 4 || overdue) ? 'badge-error' : 'badge-role'
                          }`}>
                            {overdue ? 'Overdue' : (record.status?.name ?? 'Issued')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {record.status_id === 1 && (
                            <button onClick={() => openReturnModal(record)} className="btn btn-outline btn-sm flex-center" style={{ gap: '4px', padding: '4px 10px', color: 'var(--success)' }}>
                              <RefreshCcw size={11} /> Return Book
                            </button>
                          )}
                          {record.status_id !== 1 && (
                            <span className="card-desc" style={{ fontSize: '11px' }}>Processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {borrows.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No checked-out records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── Checkout Book Modal ────────────────────────────────────────── */}
      {showBorrowModal && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="auth-card" style={{ maxWidth: '480px', width: '100%' }}>
            <div className="auth-header">
              <h2>Checkout Book</h2>
              <p>Issue a library book to a student record.</p>
            </div>
            <form onSubmit={handleBorrowSubmit} className="auth-form">
              <div className="input-group">
                <label>Student Registration ID</label>
                <input 
                  type="text" 
                  placeholder="e.g. STU-2026-0001" 
                  value={borrowForm.student_id_number} 
                  onChange={e => setBorrowForm(f => ({ ...f, student_id_number: e.target.value }))}
                  required 
                />
              </div>
              <div className="input-group">
                <label>Select Book from Catalog</label>
                <select 
                  value={borrowForm.book_id} 
                  onChange={e => setBorrowForm(f => ({ ...f, book_id: parseInt(e.target.value), barcode: '' }))}
                >
                  <option value={0}>Select book...</option>
                  {booksList.filter(b => b.available_copies > 0).map(b => (
                    <option key={b.id} value={b.id}>{b.title} ({b.available_copies} available)</option>
                  ))}
                </select>
              </div>

              <div style={{ textAlign: 'center', margin: '8px 0', color: '#64748b', fontSize: '12px' }}>— OR —</div>

              <div className="input-group">
                <label>Scan Barcode ID</label>
                <input 
                  type="text" 
                  placeholder="Input scanned barcode..." 
                  value={borrowForm.barcode} 
                  onChange={e => setBorrowForm(f => ({ ...f, barcode: e.target.value, book_id: 0 }))}
                />
              </div>

              <div className="input-group">
                <label>Borrow Duration (Days)</label>
                <select 
                  value={borrowForm.duration_days} 
                  onChange={e => setBorrowForm(f => ({ ...f, duration_days: parseInt(e.target.value) }))}
                >
                  <option value={7}>7 Days (1 Week)</option>
                  <option value={14}>14 Days (2 Weeks)</option>
                  <option value={30}>30 Days (1 Month)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Checkout Book</button>
                <button type="button" onClick={() => setShowBorrowModal(false)} className="btn btn-outline"><X size={14} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Return Book Modal ─────────────────────────────────────────── */}
      {showReturnModal && selectedBorrow && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="auth-card" style={{ maxWidth: '440px', width: '100%' }}>
            <div className="auth-header">
              <h2>Process Book Return</h2>
              <p>Verify copy return or mark as lost.</p>
            </div>
            <form onSubmit={handleReturnSubmit} className="auth-form">
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{selectedBorrow.book?.title}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Issued to: {selectedBorrow.user?.name}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Due Date: {selectedBorrow.due_date}</div>
              </div>

              <div className="input-group">
                <label>Return Status</label>
                <select 
                  value={returnForm.status} 
                  onChange={e => setReturnForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="Returned">Returned (Restock to catalog)</option>
                  <option value="Lost">Lost (Decrease catalog size)</option>
                </select>
              </div>

              <div className="input-group">
                <label>Late Fee / Penalty (PKR)</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="number" 
                    min={0}
                    value={returnForm.custom_fine} 
                    onChange={e => setReturnForm(f => ({ ...f, custom_fine: parseFloat(e.target.value) || 0 }))}
                    style={{ paddingLeft: '32px' }}
                    required 
                  />
                </div>
                <div className="card-desc" style={{ fontSize: '11px', marginTop: '4px' }}>
                  Overdue fine auto-calculated based on due date rules. Can be adjusted.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm Return</button>
                <button type="button" onClick={() => setShowReturnModal(false)} className="btn btn-outline"><X size={14} /></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryCirculation;
