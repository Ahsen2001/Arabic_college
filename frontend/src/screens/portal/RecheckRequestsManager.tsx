import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Check, X, Plus } from 'lucide-react';

interface Examination {
  id: number;
  name: string;
  max_marks: number;
}

interface ExamResult {
  id: number;
  marks_obtained: number;
  examination?: Examination;
}

interface RecheckRequest {
  id: number;
  student_id: number;
  student?: {
    student_id_number: string;
    user?: {
      name: string;
    };
  };
  exam_result_id: number;
  exam_result?: ExamResult;
  reason: string;
  status: string;
  new_marks?: number | null;
  teacher_remarks?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: one row in the admin table — holds its own local state
// so that useState is not violated inside .map()
// ─────────────────────────────────────────────────────────────────────────────
interface RecheckRowProps {
  r: RecheckRequest;
  isAdmin: boolean;
  onResolve: (recheckId: number, status: 'Approved' | 'Rejected', newMarks: number | null, remarks: string) => void;
}

const RecheckRow: React.FC<RecheckRowProps> = ({ r, isAdmin, onResolve }) => {
  const [newMarks, setNewMarks] = useState<string>(
    r.new_marks != null ? String(r.new_marks) : ''
  );
  const [auditorRemarks, setAuditorRemarks] = useState(r.teacher_remarks || '');

  return (
    <tr key={r.id}>
      {isAdmin && (
        <td>
          <strong>{r.student?.user?.name}</strong>
          <div className="card-desc" style={{ fontSize: '11px', margin: '2px 0 0' }}>
            ID: {r.student?.student_id_number}
          </div>
        </td>
      )}
      <td><strong>{r.exam_result?.examination?.name}</strong></td>
      <td>
        <strong>{r.exam_result?.marks_obtained}</strong>{' '}
        / {r.exam_result?.examination?.max_marks} Marks
      </td>
      <td><span className="card-desc" style={{ fontSize: '12px' }}>{r.reason}</span></td>
      <td>
        <span className={`badge ${
          r.status === 'Approved'
            ? 'badge-permission'
            : r.status === 'Rejected'
            ? 'badge-error'
            : 'badge-role'
        }`}>
          {r.status}
        </span>
      </td>
      <td>
        {isAdmin && r.status === 'Pending' ? (
          <input
            type="text"
            placeholder="Filing comments..."
            value={auditorRemarks}
            onChange={(e) => setAuditorRemarks(e.target.value)}
            style={{
              padding: '6px',
              background: 'rgba(9,13,22,0.6)',
              border: '1px solid var(--border-glass)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '12px',
              width: '100%',
            }}
          />
        ) : (
          <span className="card-desc" style={{ fontSize: '12px' }}>
            {r.teacher_remarks || '--'}
          </span>
        )}
      </td>
      {isAdmin && (
        <td style={{ textAlign: 'center' }}>
          {r.status === 'Pending' ? (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="New Mark"
                value={newMarks}
                onChange={(e) => setNewMarks(e.target.value)}
                style={{
                  width: '80px',
                  padding: '6px',
                  background: 'rgba(9,13,22,0.6)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <button
                onClick={() => onResolve(r.id, 'Approved', parseFloat(newMarks) || null, auditorRemarks)}
                className="btn btn-primary btn-sm flex-center"
                style={{ padding: '6px 12px' }}
              >
                <Check size={12} style={{ marginRight: '4px' }} /> Update
              </button>
              <button
                onClick={() => onResolve(r.id, 'Rejected', null, auditorRemarks)}
                className="btn btn-outline btn-sm flex-center"
                style={{ padding: '6px 12px', color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}
              >
                <X size={12} style={{ marginRight: '4px' }} /> Reject
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {r.new_marks != null ? `Revised: ${r.new_marks}` : 'Processed'}
            </span>
          )}
        </td>
      )}
    </tr>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────────────────────
const RecheckRequestsManager: React.FC = () => {
  const [requests, setRequests] = useState<RecheckRequest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Recheck filing form (Student only)
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resultsList, setResultsList] = useState<{ result_id: number; title: string }[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<number>(0);
  const [recheckReason, setRecheckReason] = useState('');

  useEffect(() => {
    fetchProfileAndRechecks();
  }, []);

  const fetchProfileAndRechecks = async () => {
    setLoading(true);
    try {
      const profileRes = await api.get('/profile');
      const userRoles: string[] = profileRes.data.data.roles.map((role: any) => role.name);
      const isTeacherOrAdmin =
        userRoles.includes('admin') ||
        userRoles.includes('Teacher') ||
        userRoles.includes('Staff');
      setIsAdmin(isTeacherOrAdmin);

      const response = await api.get('/exams/recheck');
      let data: RecheckRequest[] = response.data.data;

      if (!isTeacherOrAdmin) {
        const student = profileRes.data.data.student;
        if (student) {
          data = data.filter((r) => r.student_id === student.id);

          // Build a list of this student's published results to select from
          try {
            const transcriptRes = await api.get(`/shareea/students/${student.id}/transcript`);
            const list: { result_id: number; title: string }[] = [];
            transcriptRes.data.data.semesters?.forEach((sem: any) => {
              sem.courses?.forEach((c: any) => {
                list.push({
                  result_id: c.result_id ?? 1,
                  title: `${c.name} (${c.code}) — Grade: ${c.grade}`,
                });
              });
            });
            setResultsList(list);
            if (list.length > 0) setSelectedResultId(list[0].result_id);
          } catch {
            // transcript may not exist yet — silently skip
          }
        }
      }

      setRequests(data);
    } catch (error) {
      toast.error('Failed to load recheck requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Filing recheck request...');
    try {
      await api.post(`/exams/results/${selectedResultId}/recheck`, {
        reason: recheckReason,
      });
      toast.success('Recheck request registered successfully!', { id: toastId });
      setShowApplyModal(false);
      setRecheckReason('');
      fetchProfileAndRechecks();
    } catch (error) {
      toast.error('Failed to register recheck request.', { id: toastId });
    }
  };

  const handleResolveRequest = async (
    recheckId: number,
    approveStatus: 'Approved' | 'Rejected',
    newMarksVal: number | null,
    remarks: string
  ) => {
    const toastId = toast.loading('Filing recheck audit...');
    try {
      await api.post(`/exams/recheck/${recheckId}/action`, {
        status: approveStatus,
        new_marks: newMarksVal,
        teacher_remarks: remarks,
      });
      toast.success('Marks sheet audit saved!', { id: toastId });
      fetchProfileAndRechecks();
    } catch (error) {
      toast.error('Resolution failed.', { id: toastId });
    }
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Portal</span>
          <span className="badge badge-role">Result Rechecking Desk</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header
          className="dashboard-header flex-align"
          style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}
        >
          <div>
            <h1>Exam Recheck Requests</h1>
            <p>
              {isAdmin
                ? 'Review student grade recheck applications and update scores.'
                : 'Apply for score reviews or track pending requests.'}
            </p>
          </div>

          {!isAdmin && (
            <button
              onClick={() => setShowApplyModal(true)}
              className="btn btn-primary btn-sm flex-center"
            >
              <Plus size={14} /> File Recheck Request
            </button>
          )}
        </header>

        {loading ? (
          <div className="spinner-center" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
          </div>
        ) : requests.length > 0 ? (
          <div className="dashboard-card">
            <div className="downloads-table-container">
              <table className="downloads-table">
                <thead>
                  <tr>
                    {isAdmin && <th>Student</th>}
                    <th>Assessment Term</th>
                    <th>Current Score</th>
                    <th>Reason / Notes</th>
                    <th>Status</th>
                    <th>Auditor Remarks</th>
                    {isAdmin && <th style={{ textAlign: 'center' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <RecheckRow
                      key={r.id}
                      r={r}
                      isAdmin={isAdmin}
                      onResolve={handleResolveRequest}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="no-data">No active rechecking request logs found.</div>
        )}

        {/* Modal: Request Recheck (student only) */}
        {showApplyModal && (
          <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="auth-card" style={{ maxWidth: '500px', width: '100%' }}>
              <div className="auth-header">
                <h2>File Rechecking Application</h2>
                <p>Request a course term result review.</p>
              </div>
              <form onSubmit={handleApplyRecheck} className="auth-form">
                <div className="input-group">
                  <label>Select Published Result</label>
                  <select
                    value={selectedResultId}
                    onChange={(e) => setSelectedResultId(parseInt(e.target.value))}
                  >
                    {resultsList.map((res) => (
                      <option key={res.result_id} value={res.result_id}>
                        {res.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Auditing Reason / Details</label>
                  <textarea
                    rows={3}
                    placeholder="State your reasons..."
                    value={recheckReason}
                    onChange={(e) => setRecheckReason(e.target.value)}
                    style={{
                      padding: '10px',
                      background: 'rgba(15,23,42,0.6)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '10px',
                      color: '#fff',
                      outline: 'none',
                      width: '100%',
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: '1' }}>
                    Submit Application
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="btn btn-outline"
                  >
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

export default RecheckRequestsManager;
