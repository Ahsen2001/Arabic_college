import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { Chart, registerables } from 'chart.js';
import { 
  BookOpen, Plus, Search, Tag, BarChart3, 
  Trash2, Edit3, X, Save, Bookmark, ShieldAlert 
} from 'lucide-react';

Chart.register(...registerables);

interface Book {
  id: number;
  title: string;
  authors: string;
  publisher?: string;
  isbn?: string;
  barcode?: string;
  publication_year?: number;
  total_copies: number;
  available_copies: number;
  shelf_location?: string;
  category?: { name: string };
  category_id: number;
}

interface Category { id: number; name: string; code: string; description?: string; }

const LibraryDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // States
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number>(0);
  
  // Analytics stats
  const [stats, setStats] = useState({
    total_books: 0,
    borrowed_copies: 0,
    available_copies: 0,
    overdue_count: 0,
    total_fines: 0.00
  });
  
  // Modal controllers
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '', authors: '', category_id: 0, publisher: '', 
    isbn: '', barcode: '', publication_year: new Date().getFullYear(),
    total_copies: 1, shelf_location: ''
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', code: '', description: '' });

  // Charts
  const categoryChartRef = useRef<HTMLCanvasElement | null>(null);
  const monthlyChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstances = useRef<Chart[]>([]);

  useEffect(() => {
    fetchLookups();
    fetchBooks();
    fetchAnalytics();
    return () => { chartInstances.current.forEach(c => c.destroy()); };
  }, [selectedCategoryFilter]);

  const fetchLookups = async () => {
    try {
      const res = await api.get('/library/lookups');
      setCategories(res.data.data.categories ?? []);
    } catch {
      toast.error('Failed to load library lookups.');
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/library/books', {
        params: {
          search,
          category_id: selectedCategoryFilter > 0 ? selectedCategoryFilter : undefined
        }
      });
      setBooks(res.data.data.data ?? res.data.data ?? []);
    } catch {
      toast.error('Failed to load books catalog.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/library/analytics');
      const data = res.data.data;
      setStats(data.totals);
      buildCharts(data);
    } catch {
      // Silently catch analytics load
    }
  };

  const buildCharts = (data: any) => {
    chartInstances.current.forEach(c => c.destroy());
    chartInstances.current = [];

    const palette = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#0ea5e9'];

    // Category Breakdown Chart
    if (categoryChartRef.current && data.category_breakdown?.length) {
      chartInstances.current.push(new Chart(categoryChartRef.current, {
        type: 'doughnut',
        data: {
          labels: data.category_breakdown.map((c: any) => c.name),
          datasets: [{
            data: data.category_breakdown.map((c: any) => c.total_copies),
            backgroundColor: palette,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#94a3b8', font: { size: 10 } }
            }
          }
        }
      }));
    }

    // Monthly Borrowing Trend Chart
    if (monthlyChartRef.current && data.monthly_borrowing?.length) {
      const reversedList = [...data.monthly_borrowing].reverse();
      chartInstances.current.push(new Chart(monthlyChartRef.current, {
        type: 'bar',
        data: {
          labels: reversedList.map((m: any) => m.month),
          datasets: [{
            label: 'Books Borrowed',
            data: reversedList.map((m: any) => m.count),
            backgroundColor: 'rgba(99,102,241,0.65)',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
            y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } }
          }
        }
      }));
    }
  };

  const handleOpenBookModal = (book: Book | null = null) => {
    if (book) {
      setEditingBook(book);
      setBookForm({
        title: book.title,
        authors: book.authors,
        category_id: book.category_id,
        publisher: book.publisher || '',
        isbn: book.isbn || '',
        barcode: book.barcode || '',
        publication_year: book.publication_year || new Date().getFullYear(),
        total_copies: book.total_copies,
        shelf_location: book.shelf_location || ''
      });
    } else {
      setEditingBook(null);
      setBookForm({
        title: '', authors: '', category_id: categories[0]?.id ?? 0, publisher: '', 
        isbn: '', barcode: '', publication_year: new Date().getFullYear(),
        total_copies: 1, shelf_location: ''
      });
    }
    setShowBookModal(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading(editingBook ? 'Updating book...' : 'Adding book...');
    try {
      if (editingBook) {
        await api.post(`/library/books/${editingBook.id}/update`, bookForm);
        toast.success('Book details updated!', { id: toastId });
      } else {
        await api.post('/library/books', bookForm);
        toast.success('Book registered successfully!', { id: toastId });
      }
      setShowBookModal(false);
      fetchBooks();
      fetchAnalytics();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to save book record.', { id: toastId });
    }
  };

  const handleDeleteBook = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this book from the catalog?')) return;
    const toastId = toast.loading('Removing book...');
    try {
      await api.delete(`/library/books/${id}`);
      toast.success('Book deleted successfully.', { id: toastId });
      fetchBooks();
      fetchAnalytics();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to delete book.', { id: toastId });
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Creating category...');
    try {
      await api.post('/library/categories', catForm);
      toast.success('New category registered!', { id: toastId });
      setShowCategoryModal(false);
      setCatForm({ name: '', code: '', description: '' });
      fetchLookups();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to save category.', { id: toastId });
    }
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Sharia Library</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigate('/admin/library-circulation')} className="btn btn-outline btn-sm flex-center" style={{ gap: '6px' }}>
              <Bookmark size={13} /> Circulation Desk
            </button>
            <span className="badge badge-role">Library Catalog</span>
          </div>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Library Catalog & Inventory</h1>
            <p>Manage books catalog, classifications, search shelf locations, and overview borrowing stats.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowCategoryModal(true)} className="btn btn-outline btn-sm flex-center" style={{ gap: '6px' }}>
              <Tag size={13} /> Add Category
            </button>
            <button onClick={() => handleOpenBookModal()} className="btn btn-primary btn-sm flex-center" style={{ gap: '6px' }}>
              <Plus size={14} /> Add Book
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '24px' }}>
          {[
            { label: 'Total Books Inventory', value: stats.total_books, icon: BookOpen, color: 'var(--primary)' },
            { label: 'Checked Out Copies',   value: stats.borrowed_copies, icon: Bookmark, color: 'var(--warning)' },
            { label: 'Available on Shelves', value: stats.available_copies, icon: BookOpen, color: 'var(--success)' },
            { label: 'Overdue Returns',     value: stats.overdue_count, icon: ShieldAlert, color: 'var(--error)' },
            { label: 'Total Late Fines (PKR)', value: stats.total_fines.toFixed(0), icon: BarChart3, color: '#a855f7' }
          ].map((card, idx) => (
            <div key={idx} className="stat-card">
              <div className="stat-icon" style={{ background: `${card.color}22` }}>
                <card.icon size={18} style={{ color: card.color }} />
              </div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{card.value}</div>
              <div className="stat-label" style={{ fontSize: '11px' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Analytics Charts */}
        <div className="grid-container" style={{ margin: '0 0 24px' }}>
          <div className="dashboard-card" style={{ minHeight: '260px' }}>
            <div className="card-header">
              <BarChart3 size={15} className="icon-header" />
              <h3>Classification Distribution</h3>
            </div>
            <div style={{ position: 'relative', height: '180px', marginTop: '10px' }}>
              <canvas ref={categoryChartRef} />
            </div>
          </div>

          <div className="dashboard-card" style={{ minHeight: '260px' }}>
            <div className="card-header">
              <BarChart3 size={15} className="icon-header" style={{ color: 'var(--success)' }} />
              <h3>Circulation Trends (Last 6 Months)</h3>
            </div>
            <div style={{ position: 'relative', height: '180px', marginTop: '10px' }}>
              <canvas ref={monthlyChartRef} />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="dashboard-card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', maxWidth: '340px', width: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search by title, author, barcode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchBooks()}
                style={{ paddingLeft: '36px', width: '100%' }}
                className="search-input"
              />
            </div>
            <div className="flex-align" style={{ gap: '12px' }}>
              <select 
                value={selectedCategoryFilter} 
                onChange={e => setSelectedCategoryFilter(parseInt(e.target.value))}
                style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-glass)', padding: '8px 12px', color: '#fff', borderRadius: '8px', fontSize: '13px' }}
              >
                <option value={0}>All Classifications</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={fetchBooks} className="btn btn-primary btn-sm">Filter</button>
            </div>
          </div>
        </div>

        {/* Books List Grid */}
        {loading ? (
          <div className="spinner-center" style={{ minHeight: '200px' }}><div className="spinner" /></div>
        ) : (
          <div className="dashboard-card">
            <div className="downloads-table-container">
              <table className="downloads-table">
                <thead>
                  <tr>
                    <th>Title & Authors</th>
                    <th>Classification</th>
                    <th>Barcode / ISBN</th>
                    <th>Year</th>
                    <th>Shelving</th>
                    <th>Availability</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map(book => (
                    <tr key={book.id}>
                      <td>
                        <strong style={{ color: 'white' }}>{book.title}</strong>
                        <div className="card-desc" style={{ fontSize: '11px' }}>By: {book.authors}</div>
                      </td>
                      <td><span className="badge badge-role">{book.category?.name ?? 'General'}</span></td>
                      <td>
                        <div style={{ fontSize: '12px' }}>Barcode: <strong style={{ color: 'var(--primary)' }}>{book.barcode || '—'}</strong></div>
                        <div className="card-desc" style={{ fontSize: '11px' }}>ISBN: {book.isbn || '—'}</div>
                      </td>
                      <td>{book.publication_year || '—'}</td>
                      <td><span className="badge badge-role" style={{ background: 'rgba(255,255,255,0.04)' }}>{book.shelf_location || 'Not Shelved'}</span></td>
                      <td>
                        <strong style={{ color: book.available_copies > 0 ? 'var(--success)' : 'var(--error)' }}>
                          {book.available_copies} / {book.total_copies} Copies
                        </strong>
                        <div className="card-desc" style={{ fontSize: '10px' }}>
                          {book.available_copies > 0 ? 'Available' : 'All checked out'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => handleOpenBookModal(book)} className="btn btn-outline btn-sm" title="Edit Book" style={{ padding: '4px 8px' }}>
                            <Edit3 size={12} />
                          </button>
                          <button onClick={() => handleDeleteBook(book.id)} className="btn btn-outline btn-sm" style={{ padding: '4px 8px', color: 'var(--error)' }} title="Delete Book">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {books.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No books matching the criteria found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── Add/Edit Book Modal ────────────────────────────────────────── */}
      {showBookModal && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="auth-card" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="auth-header">
              <h2>{editingBook ? 'Edit Book Record' : 'Register New Book'}</h2>
              <p>Add a book to Sharia Library catalog system.</p>
            </div>
            <form onSubmit={handleSaveBook} className="auth-form">
              <div className="input-group">
                <label>Book Title</label>
                <input type="text" value={bookForm.title} onChange={e => setBookForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label>Author(s)</label>
                <input type="text" placeholder="Separate multiple with comma" value={bookForm.authors} onChange={e => setBookForm(f => ({ ...f, authors: e.target.value }))} required />
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>Classification / Category</label>
                  <select value={bookForm.category_id} onChange={e => setBookForm(f => ({ ...f, category_id: parseInt(e.target.value) }))} required>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Publisher</label>
                  <input type="text" value={bookForm.publisher} onChange={e => setBookForm(f => ({ ...f, publisher: e.target.value }))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>ISBN</label>
                  <input type="text" value={bookForm.isbn} onChange={e => setBookForm(f => ({ ...f, isbn: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Barcode ID</label>
                  <input type="text" placeholder="Unique scan code" value={bookForm.barcode} onChange={e => setBookForm(f => ({ ...f, barcode: e.target.value }))} />
                </div>
              </div>
              <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label>Year</label>
                  <input type="number" value={bookForm.publication_year} onChange={e => setBookForm(f => ({ ...f, publication_year: parseInt(e.target.value) || new Date().getFullYear() }))} />
                </div>
                <div className="input-group">
                  <label>Copies</label>
                  <input type="number" min={1} value={bookForm.total_copies} onChange={e => setBookForm(f => ({ ...f, total_copies: parseInt(e.target.value) || 1 }))} required />
                </div>
                <div className="input-group">
                  <label>Shelf Location</label>
                  <input type="text" placeholder="e.g. Shelf B4" value={bookForm.shelf_location} onChange={e => setBookForm(f => ({ ...f, shelf_location: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Save size={14} style={{ marginRight: '6px' }} /> Save Book
                </button>
                <button type="button" onClick={() => setShowBookModal(false)} className="btn btn-outline"><X size={14} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Category Modal ─────────────────────────────────────────── */}
      {showCategoryModal && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="auth-card" style={{ maxWidth: '440px', width: '100%' }}>
            <div className="auth-header">
              <h2>Add Classification / Category</h2>
              <p>Create a new book category tag.</p>
            </div>
            <form onSubmit={handleSaveCategory} className="auth-form">
              <div className="input-group">
                <label>Category Name</label>
                <input type="text" placeholder="e.g. Arabic Literature" value={catForm.name} onChange={e => setCatForm(c => ({ ...c, name: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label>Category Code</label>
                <input type="text" placeholder="e.g. AR-LIT" value={catForm.code} onChange={e => setCatForm(c => ({ ...c, code: e.target.value.toUpperCase() }))} required />
              </div>
              <div className="input-group">
                <label>Description</label>
                <input type="text" placeholder="Short classification details" value={catForm.description} onChange={e => setCatForm(c => ({ ...c, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Register Category</button>
                <button type="button" onClick={() => setShowCategoryModal(false)} className="btn btn-outline"><X size={14} /></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryDashboard;
