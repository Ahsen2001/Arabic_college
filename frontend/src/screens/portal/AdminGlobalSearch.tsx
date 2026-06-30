import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import {
  Search, Users, FileText, GraduationCap, BookOpen, Book,
  Award, FolderOpen, Calendar, CheckSquare, ArrowRight,
  ArrowLeft, X, Loader2
} from 'lucide-react';

type SearchType = '' | 'students' | 'applicants' | 'teachers' | 'subjects' | 'books' | 'research' | 'documents' | 'attendance' | 'results';

interface SearchResultItem {
  id: number;
  title: string;
  subtitle: string;
  meta: string;
  detail: string;
}

interface GroupedCategory {
  items: SearchResultItem[];
  count: number;
}

interface GroupedResponse {
  students: GroupedCategory;
  applicants: GroupedCategory;
  teachers: GroupedCategory;
  subjects: GroupedCategory;
  books: GroupedCategory;
  research: GroupedCategory;
  documents: GroupedCategory;
  attendance: GroupedCategory;
  results: GroupedCategory;
}

interface PaginatedResponse {
  items: SearchResultItem[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

const CATEGORIES: { type: SearchType; label: string; icon: React.FC<any>; color: string }[] = [
  { type: '', label: 'All Categories', icon: Search, color: '#818cf8' },
  { type: 'students', label: 'Students', icon: Users, color: '#38bdf8' },
  { type: 'applicants', label: 'Applicants', icon: FileText, color: '#34d399' },
  { type: 'teachers', label: 'Teachers', icon: GraduationCap, color: '#a78bfa' },
  { type: 'subjects', label: 'Subjects', icon: BookOpen, color: '#fb7185' },
  { type: 'books', label: 'Books', icon: Book, color: '#fb923c' },
  { type: 'research', label: 'Research', icon: Award, color: '#f472b6' },
  { type: 'documents', label: 'Documents', icon: FolderOpen, color: '#2dd4bf' },
  { type: 'attendance', label: 'Attendance', icon: Calendar, color: '#facc15' },
  { type: 'results', label: 'Results', icon: CheckSquare, color: '#e2e8f0' },
];

const AdminGlobalSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search input state
  const queryFromUrl = searchParams.get('q') || '';
  const typeFromUrl = (searchParams.get('type') || '') as SearchType;

  const [inputVal, setInputVal] = useState(queryFromUrl);
  const [activeType, setActiveType] = useState<SearchType>(typeFromUrl);
  const [loading, setLoading] = useState(false);

  // Results State
  const [groupedResults, setGroupedResults] = useState<GroupedResponse | null>(null);
  const [paginatedResults, setPaginatedResults] = useState<PaginatedResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setInputVal(queryFromUrl);
    setActiveType(typeFromUrl);
    
    if (queryFromUrl.trim() !== '') {
      fetchSearchResults(queryFromUrl, typeFromUrl, 1);
    } else {
      setGroupedResults(null);
      setPaginatedResults(null);
    }
  }, [queryFromUrl, typeFromUrl]);

  const fetchSearchResults = async (q: string, type: SearchType, page: number) => {
    setLoading(true);
    try {
      const endpoint = `/admin/search/global`;
      const params: Record<string, any> = { q };
      if (type) {
        params.type = type;
        params.page = page;
      }
      
      const response = await api.get(endpoint, { params });
      
      if (type) {
        setPaginatedResults(response.data.data);
        setGroupedResults(null);
        setCurrentPage(page);
      } else {
        setGroupedResults(response.data.data);
        setPaginatedResults(null);
      }
    } catch (err) {
      toast.error('Search query failed. Please check network/parameters.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim() === '') {
      toast.error('Please enter a query string to search.');
      return;
    }
    setSearchParams({ q: inputVal, type: activeType });
  };

  const handleTypeChange = (type: SearchType) => {
    setActiveType(type);
    if (inputVal.trim() !== '') {
      setSearchParams({ q: inputVal, type });
    } else {
      setSearchParams({ type });
    }
  };

  const handlePageChange = (newPage: number) => {
    if (paginatedResults && newPage >= 1 && newPage <= paginatedResults.last_page) {
      fetchSearchResults(queryFromUrl, activeType, newPage);
    }
  };

  const handleClear = () => {
    setInputVal('');
    setSearchParams({});
    setGroupedResults(null);
    setPaginatedResults(null);
  };

  // Result card styling
  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-glass)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'all 0.2s',
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Registrar</span>
          <span className="badge badge-role">Global Search Panel</span>
        </div>
      </nav>

      <main className="dashboard-content" style={{ paddingBottom: '60px' }}>
        <header className="dashboard-header">
          <h1>Database Global Search</h1>
          <p>Search across students, applicants, teachers, subjects, books, research, documents, attendance, and exam results.</p>
        </header>

        {/* Search Input Bar */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-glass)', padding: '24px', marginBottom: '24px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
              <Search className="input-icon" size={20} style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Enter search keywords (e.g. Student ID, Author, Subject name)..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 48px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1.5px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  outline: 'none',
                }}
              />
              {inputVal && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: '14px 28px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '700',
              }}
            >
              <Search size={18} /> Search
            </button>
          </form>

          {/* Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
            {CATEGORIES.map((cat) => {
              const active = activeType === cat.type;
              let matchCount: number | null = null;
              if (groupedResults && cat.type !== '') {
                const grp = groupedResults[cat.type as keyof GroupedResponse];
                if (grp) matchCount = grp.count;
              }

              return (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => handleTypeChange(cat.type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: active ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--border-glass)',
                    background: active ? 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(168,85,247,0.1))' : 'rgba(255,255,255,0.02)',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    fontWeight: active ? '700' : '500',
                    transition: 'all 0.2s',
                  }}
                >
                  <cat.icon size={14} style={{ color: cat.color }} />
                  <span>{cat.label}</span>
                  {matchCount !== null && (
                    <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1px 6px', fontSize: '10.5px', color: cat.color }}>
                      {matchCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
            <Loader2 className="spin" size={40} style={{ color: 'var(--primary)' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Querying index databases...</p>
          </div>
        )}

        {/* No Query / Empty State */}
        {!loading && queryFromUrl === '' && (
          <div style={{ textAlign: 'center', padding: '80px 24px', border: '1.5px dashed var(--border-glass)', borderRadius: '16px', background: 'rgba(255,255,255,0.01)' }}>
            <Search size={48} style={{ color: 'var(--primary)', opacity: 0.4, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Find college entries</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '360px', margin: '6px auto 0', lineHeight: 1.5 }}>
              Enter search keywords at the top to query students, admission records, catalog books, grades, and documents.
            </p>
          </div>
        )}

        {/* Grouped View Results */}
        {!loading && queryFromUrl !== '' && groupedResults && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {Object.keys(groupedResults).map((key) => {
              const category = CATEGORIES.find(c => c.type === key);
              const grp = groupedResults[key as keyof GroupedResponse];
              if (!grp || grp.items.length === 0) return null;

              return (
                <div key={key} style={{ background: 'rgba(255, 255, 255, 0.01)', borderRadius: '16px', border: '1px solid var(--border-glass)', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {category && <category.icon size={18} style={{ color: category.color }} />}
                      <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                        {category?.label ?? key}
                      </h2>
                      <span style={{ fontSize: '11px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>
                        {grp.count} {grp.count === 1 ? 'match' : 'matches'}
                      </span>
                    </div>
                    {grp.count > grp.items.length && (
                      <button
                        type="button"
                        onClick={() => handleTypeChange(key as SearchType)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        View all <ArrowRight size={14} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {grp.items.map((item) => (
                      <div key={item.id} style={cardStyle}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14.5px', color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.title}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                            {item.subtitle}
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px', fontSize: '12px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{item.detail}</span>
                          <span style={{ color: '#a5b4fc', fontWeight: '600' }}>{item.meta}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* If all categories returned zero items */}
            {Object.keys(groupedResults).every(key => groupedResults[key as keyof GroupedResponse].items.length === 0) && (
              <div style={{ textAlign: 'center', padding: '80px 24px', border: '1px dashed var(--border-glass)', borderRadius: '16px' }}>
                <Search size={40} style={{ color: 'var(--text-secondary)', opacity: 0.3, marginBottom: '16px' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>No matches found</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  No records matched the query parameters "<strong>{queryFromUrl}</strong>". Double check search keyword spellings.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Paginated Categorized View Results */}
        {!loading && queryFromUrl !== '' && paginatedResults && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Showing <strong>{paginatedResults.items.length}</strong> of <strong>{paginatedResults.total}</strong> results
              </div>
              <button
                type="button"
                onClick={() => handleTypeChange('')}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-glass)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Back to Grouped view
              </button>
            </div>

            {paginatedResults.items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 24px', border: '1px dashed var(--border-glass)', borderRadius: '16px' }}>
                <Search size={40} style={{ color: 'var(--text-secondary)', opacity: 0.3, marginBottom: '16px' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>No matches found</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  No records matched "<strong>{queryFromUrl}</strong>" in the selected category.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                  {paginatedResults.items.map((item) => (
                    <div key={item.id} style={cardStyle}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14.5px', color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.title}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                          {item.subtitle}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{item.detail}</span>
                        <span style={{ color: '#a5b4fc', fontWeight: '600' }}>{item.meta}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {paginatedResults.last_page > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(255,255,255,0.02)',
                        color: 'var(--text-primary)',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === 1 ? 0.4 : 1,
                        display: 'flex',
                      }}
                    >
                      <ArrowLeft size={16} />
                    </button>

                    {Array.from({ length: paginatedResults.last_page }, (_, i) => i + 1).map((p) => {
                      if (paginatedResults.last_page > 7 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== paginatedResults.last_page) {
                        if (p === 2 || p === paginatedResults.last_page - 1) {
                          return <span key={p} style={{ color: 'var(--text-secondary)', padding: '0 4px' }}>...</span>;
                        }
                        return null;
                      }

                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePageChange(p)}
                          style={{
                            minWidth: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-glass)',
                            background: p === currentPage ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '13px',
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={currentPage === paginatedResults.last_page}
                      onClick={() => handlePageChange(currentPage + 1)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(255,255,255,0.02)',
                        color: 'var(--text-primary)',
                        cursor: currentPage === paginatedResults.last_page ? 'not-allowed' : 'pointer',
                        opacity: currentPage === paginatedResults.last_page ? 0.4 : 1,
                        display: 'flex',
                      }}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminGlobalSearch;
export { AdminGlobalSearch };
