import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { 
  History, Search, Filter, Eye, RefreshCw, X,
  ChevronLeft, ChevronRight, Globe, Laptop, ShieldAlert,
  ArrowDownToLine, LogIn, LogOut, Plus, Edit2, Trash2, KeyRound
} from 'lucide-react';

interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  model_type: string | null;
  model_id: number | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });

  // Filters State
  const [search, setSearch] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Selected Log for Details Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Parse User Agent to browser & OS representation
  const parseUserAgent = (ua: string | null): { browser: string; os: string } => {
    if (!ua) return { browser: 'Unknown', os: 'Unknown' };
    
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    // Basic OS parsing
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    // Basic Browser parsing
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome') && !ua.includes('Chromium')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

    return { browser, os };
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        search: search || undefined,
        action: action || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        per_page: pagination.per_page
      };

      const response = await api.get('/admin/audit-logs', { params });
      const data = response.data.data;
      
      setLogs(data.data || []);
      setPagination({
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        per_page: data.per_page || 15,
        total: data.total || 0
      });
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  }, [page, search, action, dateFrom, dateTo, pagination.per_page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearFilters = () => {
    setSearch('');
    setAction('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  // Get Action Badge styling
  const getActionDetails = (actionName: string) => {
    switch (actionName) {
      case 'create':
        return { 
          label: 'Create', 
          style: 'badge-create', 
          icon: <Plus size={14} className="mr-1" />
        };
      case 'update':
        return { 
          label: 'Update', 
          style: 'badge-update', 
          icon: <Edit2 size={14} className="mr-1" />
        };
      case 'delete':
        return { 
          label: 'Delete', 
          style: 'badge-delete', 
          icon: <Trash2 size={14} className="mr-1" />
        };
      case 'login':
        return { 
          label: 'Login', 
          style: 'badge-login', 
          icon: <LogIn size={14} className="mr-1" />
        };
      case 'logout':
        return { 
          label: 'Logout', 
          style: 'badge-logout', 
          icon: <LogOut size={14} className="mr-1" />
        };
      case 'role_change':
        return { 
          label: 'Role Change', 
          style: 'badge-role', 
          icon: <KeyRound size={14} className="mr-1" />
        };
      case 'permission_change':
        return { 
          label: 'Permission Change', 
          style: 'badge-permission', 
          icon: <ShieldAlert size={14} className="mr-1" />
        };
      case 'file_download':
        return { 
          label: 'Download', 
          style: 'badge-download', 
          icon: <ArrowDownToLine size={14} className="mr-1" />
        };
      default:
        return { 
          label: actionName, 
          style: 'badge-default', 
          icon: <History size={14} className="mr-1" />
        };
    }
  };

  // Extract model name from full namespace
  const formatModelType = (modelType: string | null) => {
    if (!modelType) return 'N/A';
    const parts = modelType.split('\\');
    return parts[parts.length - 1];
  };

  return (
    <div className="audit-logs-screen" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Header Banner */}
      <div className="portal-header-banner" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(192, 132, 252, 0.15) 100%)',
        border: '1px solid var(--border-glass)',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <History className="text-primary" size={28} style={{ color: 'var(--primary)' }} />
              Audit Logs System
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px', marginBottom: 0 }}>
              Track real-time security events, administrative changes, downloads, and database modifications.
            </p>
          </div>
          <button 
            onClick={() => fetchLogs()} 
            disabled={loading}
            className="btn-refresh-logs"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: '10px',
              padding: '10px 16px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Audit Stats Dashboard */}
      <div className="stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        <div className="stat-card" style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-glass)',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '10px', color: 'var(--primary)' }}>
            <History size={22} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Total Tracked Events</div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '2px' }}>{pagination.total}</div>
          </div>
        </div>

        <div className="stat-card" style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-glass)',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '10px', color: 'var(--success)' }}>
            <LogIn size={22} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Access Logins</div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '2px' }}>
              {logs.filter(l => l.action === 'login').length}+ Active
            </div>
          </div>
        </div>

        <div className="stat-card" style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-glass)',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '10px', color: 'var(--warning)' }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Security Changes</div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '2px' }}>
              {logs.filter(l => l.action.includes('change')).length} New
            </div>
          </div>
        </div>

        <div className="stat-card" style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-glass)',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '10px', color: 'var(--error)' }}>
            <ArrowDownToLine size={22} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>File Exports</div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '2px' }}>
              {logs.filter(l => l.action === 'file_download').length} Downloads
            </div>
          </div>
        </div>
      </div>

      {/* Glass Filters Card */}
      <div className="filters-card" style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-glass)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Filter size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '15px' }}>Filter Log Directory</span>
        </div>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {/* Search Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Search Logs</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="User name, email, IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '10px 14px 10px 38px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          {/* Action Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Action Type</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-glass)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">All Actions</option>
              <option value="create">Database Create</option>
              <option value="update">Database Update</option>
              <option value="delete">Database Delete</option>
              <option value="login">Account Logins</option>
              <option value="logout">Account Logouts</option>
              <option value="role_change">Role Modifications</option>
              <option value="permission_change">Permission Assignments</option>
              <option value="file_download">File Downloads</option>
            </select>
          </div>

          {/* Date From */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>From Date</label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '10px 14px 10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Date To */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>To Date</label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '10px 14px 10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Clear Filter Button */}
        {(search || action || dateFrom || dateTo) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              onClick={handleClearFilters}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: 'var(--error)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              <X size={14} />
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Audit Log Table Box */}
      <div className="table-card" style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-glass)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <RefreshCw className="animate-spin text-primary" size={32} style={{ color: 'var(--primary)', margin: '0 auto 16px auto' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Loading audit log registry...</span>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <ShieldAlert size={36} style={{ color: 'var(--text-secondary)', margin: '0 auto 16px auto' }} />
            <div style={{ fontWeight: 600, fontSize: '16px' }}>No logs recorded</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
              No audit logs matched your specified filters.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Initiator</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Action</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Affected Model</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>IP Address</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Client System</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Timestamp</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const act = getActionDetails(log.action);
                  const client = parseUserAgent(log.user_agent);
                  return (
                    <tr key={log.id} style={{ 
                      borderBottom: '1px solid var(--border-glass)',
                      transition: 'background 0.2s',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {/* User Info */}
                      <td style={{ padding: '14px 20px' }}>
                        {log.user ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'rgba(99, 102, 241, 0.1)',
                              border: '1px solid rgba(99, 102, 241, 0.2)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '13px'
                            }}>
                              {log.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500, fontSize: '14px' }}>{log.user.name}</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{log.user.email}</div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid var(--border-glass)',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px'
                            }}>
                              SYS
                            </div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>System Process</span>
                          </div>
                        )}
                      </td>

                      {/* Action Badge */}
                      <td style={{ padding: '14px 20px' }}>
                        <span className={`audit-badge ${act.style}`} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}>
                          {act.icon}
                          {act.label}
                        </span>
                      </td>

                      {/* Target Model */}
                      <td style={{ padding: '14px 20px' }}>
                        {log.model_type ? (
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '13px' }}>{formatModelType(log.model_type)}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>ID: {log.model_id}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>N/A</span>
                        )}
                      </td>

                      {/* IP Address */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {log.ip_address || '127.0.0.1'}
                        </span>
                      </td>

                      {/* Client OS & Browser */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                            <Laptop size={13} className="text-secondary" style={{ color: 'var(--text-secondary)' }} />
                            <span>{client.os}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <Globe size={11} />
                            <span>{client.browser}</span>
                          </div>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {log.created_at}
                      </td>

                      {/* Action trigger */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="btn-details-viewer"
                          style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                          }}
                        >
                          <Eye size={13} />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* CSS Custom badges inject block */}
        <style dangerouslySetInnerHTML={{__html: `
          .audit-badge.badge-create { background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25); }
          .audit-badge.badge-update { background: rgba(59, 130, 246, 0.12); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.25); }
          .audit-badge.badge-delete { background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); }
          .audit-badge.badge-login { background: rgba(99, 102, 241, 0.12); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.25); }
          .audit-badge.badge-logout { background: rgba(148, 163, 184, 0.12); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.25); }
          .audit-badge.badge-role { background: rgba(168, 85, 247, 0.12); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.25); }
          .audit-badge.badge-permission { background: rgba(236, 72, 153, 0.12); color: #ec4899; border: 1px solid rgba(236, 72, 153, 0.25); }
          .audit-badge.badge-download { background: rgba(249, 115, 22, 0.12); color: #f97316; border: 1px solid rgba(249, 115, 22, 0.25); }
          .audit-badge.badge-default { background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid var(--border-glass); }
          
          .btn-refresh-logs:hover { background: rgba(255,255,255,0.1) !important; border-color: rgba(255,255,255,0.2) !important; }
          .btn-details-viewer:hover { background: var(--primary) !important; color: white !important; }
        `}} />

        {/* Footer Pagination */}
        {!loading && logs.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderTop: '1px solid var(--border-glass)',
            background: 'rgba(255,255,255,0.01)'
          }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Showing Page <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pagination.current_page}</span> of <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pagination.last_page}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                style={{
                  background: page <= 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  color: page <= 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                  transition: 'all 0.2s'
                }}
              >
                <ChevronLeft size={16} />
              </button>
              
              <button
                disabled={page >= pagination.last_page}
                onClick={() => setPage(prev => Math.min(prev + 1, pagination.last_page))}
                style={{
                  background: page >= pagination.last_page ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: page >= pagination.last_page ? 'not-allowed' : 'pointer',
                  color: page >= pagination.last_page ? 'var(--text-secondary)' : 'var(--text-primary)',
                  transition: 'all 0.2s'
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Log JSON/Diff Detail Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#0d131f',
            border: '1px solid var(--border-glass)',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-glass)',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert style={{ color: 'var(--primary)' }} size={20} />
                  Event Audit Details
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Log ID: #{selectedLog.id}</span>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Event Metadata Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Initiated By</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '4px' }}>
                    {selectedLog.user ? selectedLog.user.name : 'System Process'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Action Type</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '4px', textTransform: 'capitalize' }}>
                    {selectedLog.action.replace('_', ' ')}
                  </div>
                </div>
                {selectedLog.model_type && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Affected Component</div>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '4px' }}>
                      {formatModelType(selectedLog.model_type)} (ID: {selectedLog.model_id})
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Date & Time</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '4px' }}>
                    {selectedLog.created_at}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>IP Address</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '4px', fontFamily: 'monospace' }}>
                    {selectedLog.ip_address || '127.0.0.1'}
                  </div>
                </div>
              </div>

              {/* Diff Values Section */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>Audit Payload & Changes</h4>
                
                {/* Database Updates Side-by-side comparison */}
                {selectedLog.action === 'update' && selectedLog.old_values && selectedLog.new_values ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    minWidth: 0
                  }}>
                    {/* Old Values */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--error)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--error)' }}></span>
                        Old State (Original)
                      </div>
                      <pre style={{
                        background: '#070b12',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: '10px',
                        padding: '14px',
                        fontSize: '12px',
                        overflow: 'auto',
                        maxHeight: '260px',
                        color: '#f87171',
                        margin: 0
                      }}>
                        {JSON.stringify(selectedLog.old_values, null, 2)}
                      </pre>
                    </div>

                    {/* New Values */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--success)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
                        New State (Updated)
                      </div>
                      <pre style={{
                        background: '#070b12',
                        border: '1px solid rgba(16, 185, 129, 0.15)',
                        borderRadius: '10px',
                        padding: '14px',
                        fontSize: '12px',
                        overflow: 'auto',
                        maxHeight: '260px',
                        color: '#34d399',
                        margin: 0
                      }}>
                        {JSON.stringify(selectedLog.new_values, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  /* Single State for Create, Delete, Role changes or Downloads */
                  <div>
                    <pre style={{
                      background: '#070b12',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '10px',
                      padding: '14px',
                      fontSize: '12px',
                      overflow: 'auto',
                      maxHeight: '260px',
                      color: 'var(--text-secondary)',
                      margin: 0
                    }}>
                      {JSON.stringify(
                        selectedLog.new_values || selectedLog.old_values || { message: 'No payload data recorded for this action type.' },
                        null, 
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>

              {/* User Agent Full Details */}
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-glass)',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '12px'
              }}>
                <div style={{ color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '4px' }}>Raw User Agent String</div>
                <div style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {selectedLog.user_agent || 'N/A'}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '16px 24px',
              borderTop: '1px solid var(--border-glass)',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  background: 'var(--primary)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '13px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)'; }}
              >
                Close Audit Viewer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
