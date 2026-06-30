import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, Award, UserCheck, Printer, FileText, Clock } from 'lucide-react';

interface DocumentInfo {
  id: number;
  document_type_id: number;
  file_name: string;
  file_path: string;
  file_size: string;
  verified: boolean;
}

interface ApplicationDetail {
  id: number;
  application_number: string;
  name: string;
  email: string;
  date_of_birth: string;
  contact_number: string;
  address: string;
  program_id: number;
  program: string;
  academic_year: string;
  status_id: number;
  status_name: string;
  applied_date: string;
  remarks: string;
  documents: DocumentInfo[];
}

const AdminApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Interview Modal State
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewRemarks, setInterviewRemarks] = useState('');



  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/applications/${id}`);
      setApplication(response.data.data);
    } catch (error) {
      toast.error('Failed to load application details.');
      navigate('/admin/admissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewStatus = async (statusId: number, remarksMessage: string) => {
    setSubmitting(true);
    const toastId = toast.loading('Updating application status...');
    try {
      await api.post(`/admin/applications/${id}/review`, {
        status_id: statusId,
        remarks: remarksMessage,
      });
      toast.success('Status updated successfully!', { id: toastId });
      fetchApplicationDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewDate || !interviewTime) {
      toast.error('Please select both date and time.');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Scheduling interview...');
    try {
      await api.post(`/admin/applications/${id}/schedule-interview`, {
        interview_date: interviewDate,
        interview_time: interviewTime,
        remarks: interviewRemarks,
      });
      toast.success('Interview scheduled and notification email sent!', { id: toastId });
      setShowInterviewModal(false);
      fetchApplicationDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to schedule interview.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectApplicant = async () => {
    setSubmitting(true);
    const toastId = toast.loading('Promoting candidate to Selected...');
    try {
      await api.post(`/admin/applications/${id}/select`);
      toast.success('Applicant promoted! Offer letter email dispatched.', { id: toastId });
      fetchApplicationDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to promote applicant.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnrollApplicant = async () => {
    setSubmitting(true);
    const toastId = toast.loading('Matriculating candidate into active student...');
    try {
      const response = await api.post(`/admin/applications/${id}/enroll`);
      const studentIdNum = response.data.data.student_id;
      toast.success(`Matriculation complete! Student ID: ${studentIdNum}`, { id: toastId });
      fetchApplicationDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Matriculation failed.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fullscreen-loader">
        <div className="loader-card">
          <div className="spinner"></div>
          <p className="loading-text">Loading application dossier...</p>
        </div>
      </div>
    );
  }

  if (!application) return null;

  const getStatusClass = (statusId: number) => {
    switch (statusId) {
      case 1: return 'badge-role'; // Draft
      case 2: return 'badge-permission'; // Submitted
      case 3: return 'badge-warning'; // Under Review
      case 4: return 'badge-role'; // Interview
      case 5: return 'badge-permission'; // Selected
      case 6: return 'badge-error'; // Rejected
      case 7: return 'badge-success-glow'; // Enrolled
      default: return '';
    }
  };

  return (
    <div className="dashboard-wrapper printable-admission-wrapper">
      <nav className="dashboard-nav no-print">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Registrar</span>
          <button onClick={() => navigate('/admin/admissions')} className="btn btn-outline btn-sm">
            <ArrowLeft size={16} /> Back to Board
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="no-print">
          {/* Header */}
          <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between' }}>
            <div>
              <h1>Review Dossier: {application.name}</h1>
              <p>Reference: <strong>{application.application_number}</strong> | Status: <span className={`badge ${getStatusClass(application.status_id)}`}>{application.status_name}</span></p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {application.status_id === 5 && (
                <button onClick={handlePrint} className="btn btn-primary">
                  <Printer size={16} /> Print Offer Letter
                </button>
              )}
              {application.status_id > 1 && (
                <button onClick={handlePrint} className="btn btn-outline">
                  <Printer size={16} /> Print Dossier
                </button>
              )}
            </div>
          </header>

          <div className="grid-container" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start', gap: '24px' }}>
            {/* Left Col - Details & Uploads */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Profile Card */}
              <div className="dashboard-card">
                <div className="card-header">
                  <UserCheck size={20} className="icon-header" />
                  <h3>Candidate Details</h3>
                </div>
                <div className="card-body">
                  <div className="detail-item">
                    <span className="detail-label">Name</span>
                    <span className="detail-val">{application.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email Address</span>
                    <span className="detail-val">{application.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date of Birth</span>
                    <span className="detail-val">{application.date_of_birth || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Contact Phone</span>
                    <span className="detail-val">{application.contact_number || 'Not specified'}</span>
                  </div>
                  <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                    <span className="detail-label">Residential Address</span>
                    <span className="detail-val" style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }}>{application.address || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Document Console */}
              <div className="dashboard-card">
                <div className="card-header">
                  <FileText size={20} className="icon-header" />
                  <h3>Admissions Credentials Verification</h3>
                </div>
                <div className="card-body">
                  <p className="card-desc">Verify scans uploaded by the candidate.</p>
                  
                  <div className="upload-sections-wrapper" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {application.documents.length > 0 ? (
                      application.documents.map((doc) => (
                        <div key={doc.id} className="upload-row-item" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                          <div>
                            <h4 style={{ fontSize: '14px', color: 'white' }}>
                              {doc.document_type_id === 1 ? 'National ID / Passport Scan' : (doc.document_type_id === 2 ? 'High School Academic Transcript' : (doc.document_type_id === 3 ? 'Passport Photograph' : 'Medical Report'))}
                            </h4>
                            <p className="card-desc" style={{ fontSize: '11px', margin: '4px 0 0' }}>File: <code>{doc.file_name}</code> ({doc.file_size})</p>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                              View File
                            </a>
                            <span className="badge badge-permission" style={{ display: 'inline-flex', alignItems: 'center' }}>
                              <Check size={12} style={{ marginRight: '4px' }} /> Uploaded
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-badge">No documents uploaded by candidate.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col - Review Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Program Choice details */}
              <div className="dashboard-card">
                <div className="card-header">
                  <Award size={20} className="icon-header" />
                  <h3>Applied Track</h3>
                </div>
                <div className="card-body">
                  <div className="detail-item">
                    <span className="detail-label">Track Choice</span>
                    <span className="detail-val" style={{ color: 'var(--primary)' }}>{application.program}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Intake Session</span>
                    <span className="detail-val">{application.academic_year}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date Submitted</span>
                    <span className="detail-val">{application.applied_date || 'Draft'}</span>
                  </div>
                  {application.remarks && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                      <label className="detail-label">Committee Remarks:</label>
                      <p className="card-desc" style={{ marginTop: '6px', fontSize: '12.5px', color: 'white' }}>{application.remarks}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Console Actions */}
              <div className="dashboard-card">
                <div className="card-header">
                  <Clock size={20} className="icon-header" />
                  <h3>Admissions Actions</h3>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Status: Submitted -> Under Review */}
                  {application.status_id === 2 && (
                    <button
                      onClick={() => handleReviewStatus(3, 'Registrar reviewed submission, credentials verification pending.')}
                      className="btn btn-primary btn-block"
                      disabled={submitting}
                    >
                      Begin Under Review
                    </button>
                  )}

                  {/* Status: Under Review -> Schedule Interview */}
                  {application.status_id === 3 && (
                    <button
                      onClick={() => setShowInterviewModal(true)}
                      className="btn btn-primary btn-block"
                      disabled={submitting}
                    >
                      Schedule Interview & Exam
                    </button>
                  )}

                  {/* Status: Interview -> Select Applicant */}
                  {application.status_id === 4 && (
                    <button
                      onClick={handleSelectApplicant}
                      className="btn btn-primary btn-block"
                      style={{ background: 'var(--success)' }}
                      disabled={submitting}
                    >
                      Select Applicant (Admit)
                    </button>
                  )}

                  {/* Status: Selected -> Enroll Candidate */}
                  {application.status_id === 5 && (
                    <button
                      onClick={handleEnrollApplicant}
                      className="btn btn-primary btn-block"
                      style={{ background: 'var(--primary)', color: 'white', fontWeight: 'bold' }}
                      disabled={submitting}
                    >
                      Enroll Candidate as Student
                    </button>
                  )}

                  {/* Enrolled View */}
                  {application.status_id === 7 && (
                    <div className="notice-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                      <Check className="notice-icon" style={{ color: 'var(--success)' }} />
                      <p style={{ color: '#6ee7b7', fontSize: '13px' }}>Enrolled. Student profile active in database.</p>
                    </div>
                  )}

                  {/* Reject Action */}
                  {application.status_id > 1 && application.status_id < 6 && (
                    <button
                      onClick={() => handleReviewStatus(6, 'Candidate rejected by admissions committee.')}
                      className="btn btn-outline btn-block"
                      style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      disabled={submitting}
                    >
                      Reject Application
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Schedule Interview */}
        {showInterviewModal && (
          <div className="fullscreen-loader no-print" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
            <div className="auth-card" style={{ maxWidth: '480px', width: '100%' }}>
              <div className="auth-header">
                <h2>Schedule Interview & Exam</h2>
                <p>Specify slot. Candidate will receive email notifications.</p>
              </div>
              <form onSubmit={handleScheduleInterview} className="auth-form">
                <div className="input-group">
                  <label htmlFor="interview-date">Examination/Interview Date</label>
                  <input
                    id="interview-date"
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    required
                    title="Examination/Interview Date"
                    placeholder="Select interview date"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="interview-time">Examination/Interview Time</label>
                  <input
                    id="interview-time"
                    type="time"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    required
                    title="Examination/Interview Time"
                    placeholder="Select interview time"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="interview-remarks">Interviewer Notes (Optional)</label>
                  <textarea
                    id="interview-remarks"
                    rows={3}
                    value={interviewRemarks}
                    onChange={(e) => setInterviewRemarks(e.target.value)}
                    style={{ padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-primary)', outline: 'none' }}
                    title="Interviewer Notes"
                    placeholder="Enter interviewer notes"
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: '1' }}>Confirm Schedule</button>
                  <button type="button" onClick={() => setShowInterviewModal(false)} className="btn btn-outline">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Print Layout: Application Summary Sheet */}
        <div className="printable-summary-sheet print-only" style={{ margin: '20px auto', maxWidth: '800px', padding: '40px', background: '#ffffff', color: '#000000', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000000', paddingBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '22px', margin: '0', fontWeight: 'bold' }}>ARABIC COLLEGE</h1>
              <p style={{ fontSize: '12px', margin: '4px 0 0', color: '#4a5568' }}>College of Sharia and Linguistic Sciences</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '16px', margin: '0', fontWeight: 'bold' }}>APPLICANT SUMMARY</h2>
              <p style={{ fontSize: '12px', margin: '4px 0 0', color: '#4a5568' }}>Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <h3 style={{ borderBottom: '1px solid #cbd5e0', paddingBottom: '6px', fontSize: '14px', fontWeight: 'bold' }}>Candidate Details Summary</h3>
            <table style={{ width: '100%', marginTop: '10px', fontSize: '13px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 0', width: '35%', color: '#4a5568' }}>Application Ref:</td>
                  <td style={{ padding: '6px 0', fontWeight: 'bold' }}>{application.application_number}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#4a5568' }}>Candidate Name:</td>
                  <td style={{ padding: '6px 0', fontWeight: 'bold' }}>{application.name}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#4a5568' }}>Email Address:</td>
                  <td style={{ padding: '6px 0' }}>{application.email}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#4a5568' }}>Date of Birth:</td>
                  <td style={{ padding: '6px 0' }}>{application.date_of_birth}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#4a5568' }}>Applied Track:</td>
                  <td style={{ padding: '6px 0', fontWeight: 'bold' }}>{application.program}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#4a5568' }}>Status:</td>
                  <td style={{ padding: '6px 0', fontWeight: 'bold' }}>{application.status_name}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Print Layout: Admission Offer Letter */}
        {application.status_id === 5 && (
          <div className="printable-offer-letter print-only" style={{ margin: '40px auto', maxWidth: '800px', padding: '60px', border: '8px double #d4af37', background: '#ffffff', color: '#000000', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: '0.04', fontSize: '120px', fontWeight: 'bold', color: '#d4af37', pointerEvents: 'none', userSelect: 'none', textAlign: 'center', width: '100%' }}>
              KAC
            </div>

            <div style={{ textAlign: 'center', borderBottom: '2px solid #cbd5e0', paddingBottom: '20px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#8c6239' }}>كلية العلوم الشرعية واللغوية العربية</h1>
              <h2 style={{ fontSize: '16px', margin: '6px 0 0', letterSpacing: '0.5px' }}>ARABIC COLLEGE OF SHARIA AND LINGUISTIC SCIENCES</h2>
              <p style={{ fontSize: '11px', color: '#4a5568', margin: '4px 0 0' }}>Office of Admissions and Registration</p>
            </div>

            <div style={{ marginTop: '40px', lineHeight: '1.6' }}>
              <p style={{ textAlign: 'right', fontSize: '13px' }}>Date: {new Date().toLocaleDateString()}</p>
              <p style={{ fontSize: '14px', fontWeight: 'bold' }}>ADMISSION OFFER LETTER</p>
              
              <p style={{ marginTop: '20px', fontSize: '14px' }}>Dear <strong>{application.name}</strong>,</p>
              <p style={{ fontSize: '14px', textIndent: '30px', textAlign: 'justify' }}>
                We are pleased to inform you that the admissions committee has evaluated your academic credentials and placement exam grades and has approved your enrollment as a candidate for the degree of <strong>{application.program}</strong> at the Arabic College.
              </p>
              <p style={{ fontSize: '14px', textAlign: 'justify' }}>
                Your application reference code is <strong>{application.application_number}</strong>. To accept this offer and complete your enrollment, please log in to the portal dashboard, sign the offer declaration, and complete your first semester tuition fees installment.
              </p>
              <p style={{ fontSize: '14px', marginTop: '20px' }}>
                We congratulate you on your achievements and welcome you to our academic community.
              </p>
            </div>

            <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '12px', color: '#718096' }}>
                Reference: {application.application_number}-OFFER
              </div>
              <div style={{ textAlign: 'center', minWidth: '150px' }}>
                <div style={{ height: '50px', borderBottom: '1px solid #4a5568' }}></div>
                <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '6px 0 0' }}>Sheikh Bilal Al-Madani</p>
                <p style={{ fontSize: '11px', color: '#718096', margin: '2px 0 0' }}>Dean of Admissions</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminApplicationDetail;
