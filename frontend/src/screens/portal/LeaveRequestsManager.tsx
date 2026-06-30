import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Check, X, Plus } from 'lucide-react';

interface LeaveRequest {
  id: number;
  user_id: number;
  user?: {
    name: string;
    email: string;
  };
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: string;
}

const LeaveRequestsManager: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Leave filing form fields
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState('Sick Leave');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');

  // Active filters
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchProfileAndLeaves();
  }, [statusFilter]);

  const fetchProfileAndLeaves = async () => {
    setLoading(true);
    try {
      const profileRes = await api.get('/profile');
      const userRoles = profileRes.data.data.roles.map((r: any) => r.name);
      const isRegistrar = userRoles.includes('admin') || userRoles.includes('Staff');
      setIsAdmin(isRegistrar);

      const response = await api.get('/attendance/leaves', {
        params: { status: statusFilter || undefined }
      });
      
      // If student/teacher, only display their own requests
      if (!isRegistrar) {
        const userId = profileRes.data.data.id;
        setLeaves(response.data.data.filter((l: LeaveRequest) => l.user_id === userId));
      } else {
        setLeaves(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load leave logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Filing leave request...');
    try {
      await api.post('/attendance/leaves', {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason,
      });
      toast.success('Leave application filed successfully!', { id: toastId });
      setShowApplyModal(false);
      setReason('');
      fetchProfileAndLeaves();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to file request.', { id: toastId });
    }
  };

  const handleApprovalAction = async (leaveId: number, approveStatus: 'Approved' | 'Rejected') => {
    const toastId = toast.loading(`Marking request ${approveStatus.toLowerCase()}...`);
    try {
      await api.post(`/attendance/leaves/${leaveId}/action`, { status: approveStatus });
      toast.success(`Request ${approveStatus}!`, { id: toastId });
      fetchProfileAndLeaves();
    } catch (error) {
      toast.error('Failed to save leave action.', { id: toastId });
    }
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Portal</span>
          <span className="badge badge-role">Leave Logs Panel</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>Leave Logs & Approvals</h1>
            <p>{isAdmin ? 'Manage administrative leave approval workflows.' : 'File leave requests and check application status.'}</p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {!isAdmin && (
              <button onClick={() => setShowApplyModal(true)} className="btn btn-primary btn-sm flex-center">
                <Plus size={14} /> Request Leave
              </button>
            )}
          </div>
        </header>

        {/* Filter bar */}
        <div className="dashboard-card" style={{ marginBottom: '24px', padding: '20px' }}>
          <div className="input-group" style={{ maxWidth: '300px', margin: '0' }}>
            <label>Filter by Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Applications</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Leaves ledger */}
        {loading ? (
          <div className="spinner-center" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
          </div>
        ) : leaves.length > 0 ? (
          <div className="dashboard-card">
            <div className="downloads-table-container">
              <table className="downloads-table">
                <thead>
                  <tr>
                    {isAdmin && <th>Requestee</th>}
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Reason / Notes</th>
                    <th>Status</th>
                    {isAdmin && <th style={{ textAlign: 'center' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr key={l.id}>
                      {isAdmin && (
                        <td>
                          <strong>{l.user?.name}</strong>
                          <div className="card-desc" style={{ fontSize: '11px', margin: '2px 0 0' }}>{l.user?.email}</div>
                        </td>
                      )}
                      <td><strong>{l.leave_type}</strong></td>
                      <td>{l.start_date}</td>
                      <td>{l.end_date}</td>
                      <td><span className="card-desc" style={{ fontSize: '12px' }}>{l.reason || '--'}</span></td>
                      <td>
                        <span className={`badge ${l.status === 'Approved' ? 'badge-permission' : (l.status === 'Rejected' ? 'badge-error' : 'badge-role')}`}>
                          {l.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: 'center' }}>
                          {l.status === 'Pending' ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button onClick={() => handleApprovalAction(l.id, 'Approved')} className="btn btn-primary btn-sm flex-center" style={{ padding: '6px 12px' }}>
                                <Check size={12} style={{ marginRight: '4px' }} /> Approve
                              </button>
                              <button onClick={() => handleApprovalAction(l.id, 'Rejected')} className="btn btn-outline btn-sm flex-center" style={{ padding: '6px 12px', color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}>
                                <X size={12} style={{ marginRight: '4px' }} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Processed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="no-data">No leave applications registered.</div>
        )}

        {/* Modal: Request Leave */}
        {showApplyModal && (
          <div className="fullscreen-loader" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
            <div className="auth-card" style={{ maxWidth: '500px', width: '100%' }}>
              <div className="auth-header">
                <h2>File Leave Application</h2>
                <p>Request sick leave or casual leave parameters.</p>
              </div>
              <form onSubmit={handleApplyLeave} className="auth-form">
                <div className="input-group">
                  <label>Leave Category</label>
                  <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Maternity Leave">Maternity Leave</option>
                  </select>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label>Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>End Date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                  </div>
                </div>

                <div className="input-group">
                  <label>Reason / Details</label>
                  <textarea rows={3} placeholder="Provide details..." value={reason} onChange={(e) => setReason(e.target.value)} style={{ padding: '10px', background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-glass)', borderRadius: '10px', color: '#fff', outline: 'none' }} required />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: '1' }}>
                    File Request
                  </button>
                  <button type="button" onClick={() => setShowApplyModal(false)} className="btn btn-outline">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default LeaveRequestsManager;
