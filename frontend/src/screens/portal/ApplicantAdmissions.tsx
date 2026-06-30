import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Save, Send, Upload, Printer, Check, Calendar, BookOpen, Clock, Award } from 'lucide-react';

interface DocumentInfo {
  id?: number;
  document_type_id: number;
  file_name: string;
  file_size?: string;
  verified?: boolean;
}

interface TimelineItem {
  label: string;
  desc: string;
  status: 'completed' | 'active' | 'pending';
}

const ApplicantAdmissions: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasApplication, setHasApplication] = useState(false);
  
  // Wizard state
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [genderId, setGenderId] = useState(1);
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [programId, setProgramId] = useState(1);
  const [applicationNumber, setApplicationNumber] = useState('');
  const [statusId, setStatusId] = useState(1);
  const [remarks, setRemarks] = useState('');

  // Uploaded docs and fee state
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [feePaid, setFeePaid] = useState(false);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  // Mock Card Details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    fetchApplicationDetails();
  }, []);

  const fetchApplicationDetails = async () => {
    setLoading(true);
    try {
      // Fetch draft data
      const response = await api.get('/admissions/draft');
      const data = response.data.data;
      
      if (data.has_application && data.application) {
        setHasApplication(true);
        setStatusId(data.application.status_id);
        setRemarks(data.application.remarks || '');
        setProgramId(data.application.program_id);
        
        if (data.applicant) {
          setDob(data.applicant.date_of_birth || '');
          setGenderId(data.applicant.gender_id || 1);
          setContactNumber(data.applicant.contact_number || '');
          setAddress(data.applicant.address || '');
          setApplicationNumber(data.applicant.application_number || '');
        }

        setDocuments(data.documents);
        setFeePaid(data.fee_paid);

        // Fetch timeline if application is submitted (status_id > 1)
        if (data.application.status_id > 1) {
          const timeResponse = await api.get('/admissions/timeline');
          setTimeline(timeResponse.data.data);
        }
      }
      
      // Fetch profile to set name
      const profileResponse = await api.get('/profile');
      setName(profileResponse.data.data.name);
    } catch (error) {
      console.error("Failed to load application draft:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    const toastId = toast.loading('Saving application draft...');
    try {
      const response = await api.post('/admissions/save-draft', {
        name,
        date_of_birth: dob || null,
        gender_id: genderId,
        contact_number: contactNumber,
        address: address,
        program_id: programId,
      });
      
      const data = response.data.data;
      setHasApplication(true);
      if (data.applicant) {
        setApplicationNumber(data.applicant.application_number);
      }
      toast.success('Application draft saved successfully!', { id: toastId });
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to save draft.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, typeId: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type_id', typeId.toString());

    const toastId = toast.loading('Uploading document file...');
    try {
      await api.post('/admissions/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document uploaded successfully!', { id: toastId });
      
      // Refresh documents
      const draftRes = await api.get('/admissions/draft');
      setDocuments(draftRes.data.data.documents);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Upload failed.';
      toast.error(errMsg, { id: toastId });
    }
  };

  const handlePayFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.length < 16 || cardExpiry.length < 4 || cardCvv.length < 3) {
      toast.error('Please enter valid credit card details.');
      return;
    }

    setIsPaying(true);
    const toastId = toast.loading('Processing payment transaction...');
    try {
      await api.post('/admissions/pay-fee', { payment_method_id: 3 }); // 3 = Card Lookup
      setFeePaid(true);
      toast.success('Application fee paid successfully!', { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Payment processing failed.', { id: toastId });
    } finally {
      setIsPaying(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!dob || !contactNumber || !address) {
      toast.error('Please fill out all personal details in step 1.');
      setStep(1);
      return;
    }

    const hasTranscript = documents.some(d => d.document_type_id === 2);
    if (!hasTranscript) {
      toast.error('You must upload your High School Academic Transcript PDF to submit.');
      return;
    }

    if (!feePaid) {
      toast.error('Please pay the application fee before submitting.');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Submitting finalized application...');
    try {
      await api.post('/admissions/submit');
      toast.success('Application submitted successfully!', { id: toastId });
      fetchApplicationDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit application.', { id: toastId });
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
          <p className="loading-text">Retrieving admissions records...</p>
        </div>
      </div>
    );
  }

  // Check if user has an active application that is SUBMITTED or further
  const isSubmitted = hasApplication && statusId > 1;

  return (
    <div className="dashboard-wrapper printable-admission-wrapper">
      <nav className="dashboard-nav no-print">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Portal</span>
          <span className="badge badge-role">Applicant Portal</span>
        </div>
      </nav>

      <main className="dashboard-content">
        {!isSubmitted ? (
          /* Wizard application builder */
          <div className="wizard-container no-print">
            <div className="wizard-header">
              <h2>Admission Application Wizard</h2>
              <p>Complete the details below to apply for the academic year 2026/2027.</p>
              
              {applicationNumber && (
                <div className="app-ref-tag">
                  Draft Ref: <code>{applicationNumber}</code>
                </div>
              )}
            </div>

            {/* Step Indicators */}
            <div className="wizard-steps-indicators">
              <button onClick={() => setStep(1)} className={`step-ind-item ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                <span className="step-num">{step > 1 ? <Check size={14} /> : 1}</span>
                <span className="step-label">Personal details</span>
              </button>
              <button onClick={() => setStep(2)} className={`step-ind-item ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`} disabled={!dob}>
                <span className="step-num">{step > 2 ? <Check size={14} /> : 2}</span>
                <span className="step-label">Program Choice</span>
              </button>
              <button onClick={() => setStep(3)} className={`step-ind-item ${step === 3 ? 'active' : ''}`} disabled={!dob || !programId}>
                <span className="step-num">3</span>
                <span className="step-label">Uploads & Fees</span>
              </button>
            </div>

            {/* Step 1: Personal Details */}
            {step === 1 && (
              <div className="wizard-step-content card-body">
                <h3>Step 1: Personal Information</h3>
                <div className="auth-form" style={{ marginTop: '20px' }}>
                  <div className="input-group">
                    <label>Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="grid-2">
                    <div className="input-group">
                      <label>Date of Birth</label>
                      <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <label>Gender</label>
                      <select value={genderId} onChange={(e) => setGenderId(parseInt(e.target.value))}>
                        <option value={1}>Male</option>
                        <option value={2}>Female</option>
                        <option value={3}>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Contact Phone Number</label>
                    <input type="tel" placeholder="+966 50 123 4567" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Permanent Residential Address</label>
                    <textarea rows={3} placeholder="Enter your full address..." value={address} onChange={(e) => setAddress(e.target.value)} required style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', color: 'white', outline: 'none' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Program Selection */}
            {step === 2 && (
              <div className="wizard-step-content card-body">
                <h3>Step 2: Academic Program Selection</h3>
                <p className="card-desc">Choose the primary degree program you wish to enroll in.</p>
                
                <div className="programs-radio-grid" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <label className={`radio-card-wrapper ${programId === 1 ? 'selected' : ''}`}>
                    <input type="radio" name="program" checked={programId === 1} onChange={() => setProgramId(1)} style={{ display: 'none' }} />
                    <BookOpen className="radio-card-icon" />
                    <div className="radio-card-text">
                      <h4>Bachelor of Islamic Jurisprudence (B-Fiqh)</h4>
                      <p>Focuses on comparative Fiqh methodologies, classical legal manuals, and Usul al-Fiqh.</p>
                    </div>
                  </label>
                  
                  <label className={`radio-card-wrapper ${programId === 2 ? 'selected' : ''}`}>
                    <input type="radio" name="program" checked={programId === 2} onChange={() => setProgramId(2)} style={{ display: 'none' }} />
                    <BookOpen className="radio-card-icon" />
                    <div className="radio-card-text">
                      <h4>Bachelor of Arabic Language and Literature (B-Arabic)</h4>
                      <p>Explores classical Arabic morphology (Sarf), syntax (Nahw), rhetoric (Balaghah), and poetry.</p>
                    </div>
                  </label>
                  
                  <label className={`radio-card-wrapper ${programId === 3 ? 'selected' : ''}`}>
                    <input type="radio" name="program" checked={programId === 3} onChange={() => setProgramId(3)} style={{ display: 'none' }} />
                    <BookOpen className="radio-card-icon" />
                    <div className="radio-card-text">
                      <h4>Bachelor of Hadith Sciences (B-Hadith)</h4>
                      <p>Focuses on Hadith authentication metrics, critic analyses of narrators (Ilm ar-Rijal), and text compilation.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Uploads & Fees */}
            {step === 3 && (
              <div className="wizard-step-content card-body">
                <h3>Step 3: Document Uploads & Registration Fee</h3>
                
                {/* Upload elements */}
                <div className="upload-sections-wrapper" style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="upload-row-item">
                    <div>
                      <h4>High School Academic Transcript (Required)</h4>
                      <p className="card-desc">Provide your official high school transcript PDF.</p>
                      {documents.some(d => d.document_type_id === 2) && (
                        <span className="badge badge-permission"><Check size={12} /> Uploaded: {documents.find(d => d.document_type_id === 2)?.file_name}</span>
                      )}
                    </div>
                    <label className="btn btn-outline btn-sm">
                      <Upload size={14} /> Select PDF
                      <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, 2)} style={{ display: 'none' }} />
                    </label>
                  </div>

                  <div className="upload-row-item">
                    <div>
                      <h4>National ID or Passport copy</h4>
                      <p className="card-desc">Scan copy of your national identity card.</p>
                      {documents.some(d => d.document_type_id === 1) && (
                        <span className="badge badge-permission"><Check size={12} /> Uploaded: {documents.find(d => d.document_type_id === 1)?.file_name}</span>
                      )}
                    </div>
                    <label className="btn btn-outline btn-sm">
                      <Upload size={14} /> Select PDF/Image
                      <input type="file" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, 1)} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                {/* Application Fee payment */}
                <div className="application-fee-payment-box" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', marginTop: '20px' }}>
                  <h3>Admissions Fee Payment</h3>
                  <p className="card-desc">All applicants are required to pay a 100 SAR application review fee.</p>

                  {feePaid ? (
                    <div className="notice-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)', marginTop: '16px' }}>
                      <Check className="notice-icon" style={{ color: 'var(--success)' }} />
                      <p style={{ color: '#6ee7b7' }}>Application fee paid successfully. Receipt logged in transactions ledger.</p>
                    </div>
                  ) : (
                    <form onSubmit={handlePayFee} className="auth-form" style={{ marginTop: '20px', maxWidth: '400px' }}>
                      <div className="input-group">
                        <label>Card Number</label>
                        <input type="text" placeholder="4000 1234 5678 9010" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} maxLength={16} required />
                      </div>
                      <div className="grid-2">
                        <div className="input-group">
                          <label>Expiry Date</label>
                          <input type="text" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} maxLength={5} required />
                        </div>
                        <div className="input-group">
                          <label>CVV</label>
                          <input type="text" placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} maxLength={3} required />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={isPaying}>
                        {isPaying ? 'Processing 100 SAR...' : 'Pay Fee (100 SAR)'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="wizard-navigation-buttons" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
              <button
                onClick={() => setStep(prev => prev - 1)}
                className="btn btn-outline"
                disabled={step === 1 || submitting}
              >
                Previous Step
              </button>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleSaveDraft}
                  className="btn btn-outline"
                  disabled={submitting}
                >
                  <Save size={16} /> Save Draft
                </button>

                {step < 3 ? (
                  <button
                    onClick={() => setStep(prev => prev + 1)}
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitApplication}
                    className="btn btn-primary"
                    disabled={submitting || !feePaid}
                    style={{ background: 'var(--success)' }}
                  >
                    <Send size={16} /> Submit Application
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Application is submitted view - Timeline, print receipt and offer letter */
          <div className="application-tracking-wrapper">
            <div className="no-print">
              <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between' }}>
                <div>
                  <h1>Application Status Console</h1>
                  <p>Track your admissions reviews and updates.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handlePrint} className="btn btn-outline">
                    <Printer size={16} /> Print Receipt
                  </button>
                </div>
              </header>

              {/* Status Banner */}
              <div className="dashboard-card" style={{ marginBottom: '30px' }}>
                <div className="card-header">
                  <Clock size={20} className="icon-header" />
                  <h3>Application Remarks</h3>
                </div>
                <div className="card-body">
                  <p className="detail-val" style={{ fontSize: '15px' }}>
                    Application Reference Code: <strong>{applicationNumber}</strong>
                  </p>
                  <p className="card-desc" style={{ marginTop: '8px' }}>
                    {remarks || "Your application documents are securely compiled. Admissions registrars are verifying files."}
                  </p>
                </div>
              </div>

              {/* Timeline checkpoints */}
              <div className="dashboard-card" style={{ marginBottom: '30px' }}>
                <div className="card-header">
                  <Calendar size={20} className="icon-header" />
                  <h3>Admissions Progress Timeline</h3>
                </div>
                <div className="card-body">
                  <div className="timeline-horizontal" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', padding: '20px 0' }}>
                    {timeline.map((stage, idx) => (
                      <div key={idx} className={`timeline-step-node ${stage.status}`} style={{ textAlign: 'center', flex: '1', minWidth: '120px' }}>
                        <div className={`step-circle ${stage.status}`} style={{ width: '32px', height: '32px', borderRadius: '50%', background: stage.status === 'completed' ? 'var(--success)' : (stage.status === 'active' ? 'var(--primary)' : 'rgba(255,255,255,0.05)'), border: stage.status === 'active' ? '2px solid white' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'white' }}>
                          {stage.status === 'completed' ? <Check size={14} style={{ margin: '0 auto' }} /> : idx + 1}
                        </div>
                        <h4 style={{ fontSize: '13.5px', color: 'white' }}>{stage.label}</h4>
                        <p className="card-desc" style={{ fontSize: '11px', marginTop: '4px' }}>{stage.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conditional Offer Letter Acceptance Panel */}
              {statusId === 5 && (
                <div className="dashboard-card" style={{ border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)', marginBottom: '30px' }}>
                  <div className="card-header">
                    <Award size={20} style={{ color: 'var(--success)' }} />
                    <h3 style={{ color: '#6ee7b7' }}>Admission Offer Extended!</h3>
                  </div>
                  <div className="card-body">
                    <p>Congratulations! The academic committee has selected your candidacy. Scroll down to review your official printable Offer Letter certificate.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Printable Application Summary Sheet */}
            <div className="printable-summary-sheet print-only" style={{ margin: '20px auto', maxWidth: '800px', padding: '40px', background: '#ffffff', color: '#000000', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000000', paddingBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '22px', margin: '0', fontWeight: 'bold' }}>ARABIC COLLEGE</h1>
                  <p style={{ fontSize: '12px', margin: '4px 0 0', color: '#4a5568' }}>College of Sharia and Linguistic Sciences</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '16px', margin: '0', fontWeight: 'bold' }}>APPLICATION RECEIPT</h2>
                  <p style={{ fontSize: '12px', margin: '4px 0 0', color: '#4a5568' }}>Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div style={{ marginTop: '30px' }}>
                <h3 style={{ borderBottom: '1px solid #cbd5e0', paddingBottom: '6px', fontSize: '14px', fontWeight: 'bold' }}>Applicant Information</h3>
                <table style={{ width: '100%', marginTop: '10px', fontSize: '13px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '6px 0', width: '35%', color: '#4a5568' }}>Application Ref:</td>
                      <td style={{ padding: '6px 0', fontWeight: 'bold' }}>{applicationNumber}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 0', color: '#4a5568' }}>Applicant Name:</td>
                      <td style={{ padding: '6px 0', fontWeight: 'bold' }}>{name}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 0', color: '#4a5568' }}>Contact Number:</td>
                      <td style={{ padding: '6px 0' }}>{contactNumber}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 0', color: '#4a5568' }}>Residential Address:</td>
                      <td style={{ padding: '6px 0' }}>{address}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '30px' }}>
                <h3 style={{ borderBottom: '1px solid #cbd5e0', paddingBottom: '6px', fontSize: '14px', fontWeight: 'bold' }}>Program & Admissions Parameters</h3>
                <table style={{ width: '100%', marginTop: '10px', fontSize: '13px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '6px 0', width: '35%', color: '#4a5568' }}>Applied Track:</td>
                      <td style={{ padding: '6px 0', fontWeight: 'bold' }}>
                        {programId === 1 ? 'Bachelor of Islamic Jurisprudence (Fiqh & Usul)' : (programId === 2 ? 'Bachelor of Arabic Language and Literature' : 'Bachelor of Hadith Sciences')}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 0', color: '#4a5568' }}>Academic Session:</td>
                      <td style={{ padding: '6px 0' }}>2026/2027 Intake</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 0', color: '#4a5568' }}>Application Fee Status:</td>
                      <td style={{ padding: '6px 0', color: '#2f855a', fontWeight: 'bold' }}>PAID (100.00 SAR)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '50px', textAlign: 'center', borderTop: '1px dashed #cbd5e0', paddingTop: '20px' }}>
                <p style={{ fontSize: '11px', color: '#718096', margin: '0' }}>Please retain this document for placement entrance exam entries.</p>
                <div style={{ fontSize: '12px', letterSpacing: '8px', fontWeight: 'bold', marginTop: '10px' }}>*APP{applicationNumber.replace(/[^0-9]/g, '')}*</div>
              </div>
            </div>

            {/* Printable Offer Letter if status is APPROVED/SELECTED */}
            {statusId === 5 && (
              <div className="printable-offer-letter print-only" style={{ margin: '40px auto', maxWidth: '800px', padding: '60px', border: '8px double #d4af37', background: '#ffffff', color: '#000000', position: 'relative' }}>
                {/* Background Watermark seal placeholder */}
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
                  
                  <p style={{ marginTop: '20px', fontSize: '14px' }}>Dear <strong>{name}</strong>,</p>
                  <p style={{ fontSize: '14px', textIndent: '30px', textAlign: 'justify' }}>
                    We are pleased to inform you that the admissions committee has evaluated your academic credentials and placement exam grades and has approved your enrollment as a candidate for the degree of <strong>
                      {programId === 1 ? 'Bachelor of Islamic Jurisprudence (Fiqh)' : (programId === 2 ? 'Bachelor of Arabic Language' : 'Bachelor of Hadith Sciences')}
                    </strong> at the Arabic College.
                  </p>
                  <p style={{ fontSize: '14px', textAlign: 'justify' }}>
                    Your application reference code is <strong>{applicationNumber}</strong>. To accept this offer and complete your enrollment, please log in to the portal dashboard, sign the offer declaration, and complete your first semester tuition fees installment.
                  </p>
                  <p style={{ fontSize: '14px', marginTop: '20px' }}>
                    We congratulate you on your achievements and welcome you to our academic community.
                  </p>
                </div>

                <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '12px', color: '#718096' }}>
                    Reference: {applicationNumber}-OFFER
                  </div>
                  <div style={{ textAlign: 'center', minWidth: '150px' }}>
                    <div style={{ height: '50px', borderBottom: '1px solid #4a5568' }}></div>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '6px 0 0' }}>Sheikh Bilal Al-Madani</p>
                    <p style={{ fontSize: '11px', color: '#718096', margin: '2px 0 0' }}>Dean of Admissions</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ApplicantAdmissions;
