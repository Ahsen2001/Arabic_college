import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Shield, AlertTriangle, FileText, Heart, Award, CreditCard, Plus, Trash2, Printer } from 'lucide-react';

interface DocumentInfo {
  id: number;
  document_type_id: number;
  file_name: string;
  file_path: string;
  file_size: string;
  verified: boolean;
}

interface StudentDetail {
  id: number;
  student_id_number: string;
  name: string;
  email: string;
  phone: string;
  program_id: number;
  program_name: string;
  admission_semester_id: number;
  admission_semester: string;
  status_id: number;
  status_name: string;
  admission_date: string;
  guardian: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    address: string;
    occupation?: string;
  } | null;
  emergency_contacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    alternate_phone?: string;
  }>;
  education_histories: Array<{
    institution_name: string;
    degree_diploma: string;
    passing_year: number;
    gpa_percentage: string;
  }>;
  medical_record: {
    blood_type: string;
    allergies?: string;
    chronic_conditions?: string;
    emergency_notes?: string;
  } | null;
  scholarships: Array<{
    scholarship_name: string;
    discount_percentage: string;
    award_date: string;
    status: string;
  }>;
  documents: DocumentInfo[];
}

// Simple Vector Barcode Generator
const BarcodeSVG: React.FC<{ value: string }> = ({ value }) => {
  const chars = value.split('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="180" height="40" viewBox="0 0 180 40">
        <g fill="#000000">
          {chars.map((char, index) => {
            const charCode = char.charCodeAt(0);
            const w1 = (charCode % 2) + 1;
            const w2 = ((charCode >> 1) % 2) + 1;
            const w3 = ((charCode >> 2) % 2) + 1;
            const offset = index * 14 + 10;
            return (
              <React.Fragment key={index}>
                <rect x={offset} y="2" width={w1 * 1.5} height="36" />
                <rect x={offset + 4} y="2" width={w2 * 1.5} height="36" />
                <rect x={offset + 8} y="2" width={w3 * 1.5} height="36" />
              </React.Fragment>
            );
          })}
        </g>
      </svg>
      <span style={{ fontSize: '10px', letterSpacing: '2px', color: '#000', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
};

const AdminStudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Form Fields - Profile Tab
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileProgram, setProfileProgram] = useState(1);
  const [profileStatus, setProfileStatus] = useState(1);

  // Form Fields - Guardian Tab
  const [gName, setGName] = useState('');
  const [gRelation, setGRelation] = useState('');
  const [gPhone, setGPhone] = useState('');
  const [gEmail, setGEmail] = useState('');
  const [gAddress, setGAddress] = useState('');
  const [gOccupation, setGOccupation] = useState('');

  // Form Fields - Emergency contacts
  const [emergencyList, setEmergencyList] = useState<Array<{ name: string; relationship: string; phone: string; alternate_phone?: string }>>([]);

  // Form Fields - Academic history
  const [educationList, setEducationList] = useState<Array<{ institution_name: string; degree_diploma: string; passing_year: number; gpa_percentage: string }>>([]);

  // Form Fields - Medical records
  const [medBloodType, setMedBloodType] = useState('O+');
  const [medAllergies, setMedAllergies] = useState('');
  const [medChronic, setMedChronic] = useState('');
  const [medNotes, setMedNotes] = useState('');

  // Form Fields - Scholarships
  const [scholarshipList, setScholarshipList] = useState<Array<{ scholarship_name: string; discount_percentage: string; award_date: string; status: string }>>([]);

  useEffect(() => {
    fetchStudentProfile();
  }, [id]);

  const fetchStudentProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/students/${id}`);
      const data = response.data.data as StudentDetail;
      setStudent(data);

      // Populate profile state
      setProfileName(data.name);
      setProfilePhone(data.phone);
      setProfileProgram(data.program_id);
      setProfileStatus(data.status_id);

      // Populate guardian state
      if (data.guardian) {
        setGName(data.guardian.name || '');
        setGRelation(data.guardian.relationship || '');
        setGPhone(data.guardian.phone || '');
        setGEmail(data.guardian.email || '');
        setGAddress(data.guardian.address || '');
        setGOccupation(data.guardian.occupation || '');
      }

      // Populate list states
      setEmergencyList(data.emergency_contacts || []);
      setEducationList(data.education_histories || []);
      
      // Populate medical state
      if (data.medical_record) {
        setMedBloodType(data.medical_record.blood_type || 'O+');
        setMedAllergies(data.medical_record.allergies || '');
        setMedChronic(data.medical_record.chronic_conditions || '');
        setMedNotes(data.medical_record.emergency_notes || '');
      }

      // Populate scholarship state
      setScholarshipList(data.scholarships || []);

    } catch (error) {
      toast.error('Failed to load student dossiers.');
      navigate('/admin/students');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading('Saving profile parameters...');
    try {
      await api.post(`/admin/students/${id}/profile`, {
        name: profileName,
        phone: profilePhone,
        program_id: profileProgram,
        status_id: profileStatus,
      });
      toast.success('Student profile updated!', { id: toastId });
      fetchStudentProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading('Saving guardian details...');
    try {
      await api.post(`/admin/students/${id}/guardian`, {
        name: gName,
        relationship: gRelation,
        phone: gPhone,
        email: gEmail || null,
        address: gAddress,
        occupation: gOccupation || null,
      });
      toast.success('Guardian records updated!', { id: toastId });
      fetchStudentProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update guardian details.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEmergency = async () => {
    setSubmitting(true);
    const toastId = toast.loading('Saving emergency contacts...');
    try {
      await api.post(`/admin/students/${id}/emergency`, { contacts: emergencyList });
      toast.success('Emergency contact matrix saved!', { id: toastId });
      fetchStudentProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update emergency contact list.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEducation = async () => {
    setSubmitting(true);
    const toastId = toast.loading('Saving academic records...');
    try {
      await api.post(`/admin/students/${id}/education`, { education: educationList });
      toast.success('Academic histories updated!', { id: toastId });
      fetchStudentProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update education records.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMedical = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading('Saving medical summary...');
    try {
      await api.post(`/admin/students/${id}/medical`, {
        blood_type: medBloodType,
        allergies: medAllergies,
        chronic_conditions: medChronic,
        emergency_notes: medNotes,
      });
      toast.success('Medical information updated!', { id: toastId });
      fetchStudentProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update medical info.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateScholarships = async () => {
    setSubmitting(true);
    const toastId = toast.loading('Saving scholarships...');
    try {
      await api.post(`/admin/students/${id}/scholarship`, { scholarships: scholarshipList });
      toast.success('Scholarships listing updated!', { id: toastId });
      fetchStudentProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update scholarships.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const addEmergencyRow = () => {
    setEmergencyList([...emergencyList, { name: '', relationship: '', phone: '', alternate_phone: '' }]);
  };

  const removeEmergencyRow = (index: number) => {
    setEmergencyList(emergencyList.filter((_, idx) => idx !== index));
  };

  const updateEmergencyRow = (index: number, key: string, value: string) => {
    const list = [...emergencyList];
    list[index] = { ...list[index], [key]: value };
    setEmergencyList(list);
  };

  const addEducationRow = () => {
    setEducationList([...educationList, { institution_name: '', degree_diploma: '', passing_year: new Date().getFullYear(), gpa_percentage: '' }]);
  };

  const removeEducationRow = (index: number) => {
    setEducationList(educationList.filter((_, idx) => idx !== index));
  };

  const updateEducationRow = (index: number, key: string, value: any) => {
    const list = [...educationList];
    list[index] = { ...list[index], [key]: value };
    setEducationList(list);
  };

  const addScholarshipRow = () => {
    setScholarshipList([...scholarshipList, { scholarship_name: '', discount_percentage: '10.00', award_date: new Date().toISOString().slice(0, 10), status: 'Active' }]);
  };

  const removeScholarshipRow = (index: number) => {
    setScholarshipList(scholarshipList.filter((_, idx) => idx !== index));
  };

  const updateScholarshipRow = (index: number, key: string, value: string) => {
    const list = [...scholarshipList];
    list[index] = { ...list[index], [key]: value };
    setScholarshipList(list);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fullscreen-loader">
        <div className="loader-card">
          <div className="spinner"></div>
          <p className="loading-text">Loading student dossier...</p>
        </div>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="dashboard-wrapper printable-admission-wrapper">
      <nav className="dashboard-nav no-print">
        <div className="nav-container">
          <span className="brand-logo">Arabic College SIS</span>
          <button onClick={() => navigate('/admin/students')} className="btn btn-outline btn-sm">
            <ArrowLeft size={16} /> Back to Search
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="no-print">
          {/* Header */}
          <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between' }}>
            <div>
              <h1>Student Dossier: {student.name}</h1>
              <p>Student ID: <strong>{student.student_id_number}</strong> | Tracks: <span className="badge badge-role">{student.program_name}</span></p>
            </div>
            <div>
              <button onClick={() => { setActiveTab('idcard'); }} className="btn btn-primary btn-sm flex-center">
                <CreditCard size={14} style={{ marginRight: '6px' }} /> View Student ID Card
              </button>
            </div>
          </header>

          {/* Dossier Tabs navigation */}
          <div className="news-tabs" style={{ justifyContent: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '30px', flexWrap: 'wrap', gap: '8px' }}>
            <button onClick={() => setActiveTab('profile')} className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> Profile
            </button>
            <button onClick={() => setActiveTab('guardian')} className={`tab-btn ${activeTab === 'guardian' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={14} /> Guardian
            </button>
            <button onClick={() => setActiveTab('emergency')} className={`tab-btn ${activeTab === 'emergency' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={14} /> Emergency
            </button>
            <button onClick={() => setActiveTab('education')} className={`tab-btn ${activeTab === 'education' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} /> Education
            </button>
            <button onClick={() => setActiveTab('medical')} className={`tab-btn ${activeTab === 'medical' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Heart size={14} /> Medical
            </button>
            <button onClick={() => setActiveTab('scholarship')} className={`tab-btn ${activeTab === 'scholarship' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={14} /> Scholarships
            </button>
            <button onClick={() => setActiveTab('idcard')} className={`tab-btn ${activeTab === 'idcard' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={14} /> ID Card Generator
            </button>
          </div>

          <div className="dashboard-card" style={{ padding: '30px' }}>
            {/* Tab 1: Profile */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="auth-form">
                <h3>Main Profile Settings</h3>
                <p className="card-desc">Configure student registration parameters.</p>

                <div className="grid-2">
                  <div className="input-group">
                    <label>Full Name</label>
                    <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Contact Phone Number</label>
                    <input type="text" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} required />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label>Track Program</label>
                    <select value={profileProgram} onChange={(e) => setProfileProgram(parseInt(e.target.value))}>
                      <option value={1}>Bachelor of Islamic Jurisprudence (Fiqh)</option>
                      <option value={2}>Bachelor of Arabic Language & Literature</option>
                      <option value={3}>Bachelor of Hadith Sciences</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Academic Status</label>
                    <select value={profileStatus} onChange={(e) => setProfileStatus(parseInt(e.target.value))}>
                      <option value={1}>Active</option>
                      <option value={2}>Graduated</option>
                      <option value={3}>Suspended</option>
                      <option value={4}>Withdrawn</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    Save Profile Settings
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Guardian Details */}
            {activeTab === 'guardian' && (
              <form onSubmit={handleUpdateGuardian} className="auth-form">
                <h3>Guardian Information</h3>
                <p className="card-desc">Edit primary guardian details linked to this student record.</p>

                <div className="grid-2">
                  <div className="input-group">
                    <label>Guardian Name</label>
                    <input type="text" value={gName} onChange={(e) => setGName(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Relationship</label>
                    <input type="text" placeholder="e.g. Father, Mother, Uncle" value={gRelation} onChange={(e) => setGRelation(e.target.value)} required />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label>Phone Number</label>
                    <input type="text" value={gPhone} onChange={(e) => setGPhone(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Email Address</label>
                    <input type="email" placeholder="guardian@example.com" value={gEmail} onChange={(e) => setGEmail(e.target.value)} />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label>Occupation</label>
                    <input type="text" value={gOccupation} onChange={(e) => setGOccupation(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Residential Address</label>
                    <input type="text" value={gAddress} onChange={(e) => setGAddress(e.target.value)} required />
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    Save Guardian Details
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Emergency Contacts */}
            {activeTab === 'emergency' && (
              <div className="auth-form">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>Emergency Contact Matrix</h3>
                    <p className="card-desc">Establish contacts to alert during unexpected student incidents.</p>
                  </div>
                  <button onClick={addEmergencyRow} className="btn btn-outline btn-sm flex-center">
                    <Plus size={14} /> Add Contact
                  </button>
                </div>

                {emergencyList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                    {emergencyList.map((contact, idx) => (
                      <div key={idx} className="upload-row-item" style={{ flexWrap: 'wrap', gap: '12px' }}>
                        <input
                          type="text"
                          placeholder="Contact Name"
                          value={contact.name}
                          onChange={(e) => updateEmergencyRow(idx, 'name', e.target.value)}
                          style={{ flex: '1', minWidth: '140px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                        />
                        <input
                          type="text"
                          placeholder="Relationship"
                          value={contact.relationship}
                          onChange={(e) => updateEmergencyRow(idx, 'relationship', e.target.value)}
                          style={{ flex: '1', minWidth: '120px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                        />
                        <input
                          type="text"
                          placeholder="Phone"
                          value={contact.phone}
                          onChange={(e) => updateEmergencyRow(idx, 'phone', e.target.value)}
                          style={{ flex: '1', minWidth: '120px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                        />
                        <input
                          type="text"
                          placeholder="Alt Phone"
                          value={contact.alternate_phone}
                          onChange={(e) => updateEmergencyRow(idx, 'alternate_phone', e.target.value)}
                          style={{ flex: '1', minWidth: '120px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                        />
                        <button onClick={() => removeEmergencyRow(idx)} className="btn btn-outline" style={{ color: 'var(--error)', padding: '10px', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-badge" style={{ marginTop: '20px' }}>No emergency contacts registered. Click add above.</p>
                )}

                <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                  <button onClick={handleUpdateEmergency} className="btn btn-primary" disabled={submitting}>
                    Save Emergency Contacts
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Academic History */}
            {activeTab === 'education' && (
              <div className="auth-form">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>Prior Academic Credentials</h3>
                    <p className="card-desc">Verify degrees and GPAs obtained from prior institutions.</p>
                  </div>
                  <button onClick={addEducationRow} className="btn btn-outline btn-sm flex-center">
                    <Plus size={14} /> Add Record
                  </button>
                </div>

                {educationList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                    {educationList.map((edu, idx) => (
                      <div key={idx} className="upload-row-item" style={{ flexWrap: 'wrap', gap: '12px' }}>
                        <input
                          type="text"
                          placeholder="Institution Name"
                          value={edu.institution_name}
                          onChange={(e) => updateEducationRow(idx, 'institution_name', e.target.value)}
                          style={{ flex: '1.5', minWidth: '160px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                        />
                        <input
                          type="text"
                          placeholder="Degree / Certificate"
                          value={edu.degree_diploma}
                          onChange={(e) => updateEducationRow(idx, 'degree_diploma', e.target.value)}
                          style={{ flex: '1', minWidth: '120px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                        />
                        <input
                          type="number"
                          placeholder="Passing Year"
                          value={edu.passing_year}
                          onChange={(e) => updateEducationRow(idx, 'passing_year', parseInt(e.target.value) || 2026)}
                          style={{ width: '100px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                        />
                        <input
                          type="text"
                          placeholder="GPA / %"
                          value={edu.gpa_percentage}
                          onChange={(e) => updateEducationRow(idx, 'gpa_percentage', e.target.value)}
                          style={{ width: '110px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                        />
                        <button onClick={() => removeEducationRow(idx)} className="btn btn-outline" style={{ color: 'var(--error)', padding: '10px', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-badge" style={{ marginTop: '20px' }}>No education history loaded.</p>
                )}

                <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                  <button onClick={handleUpdateEducation} className="btn btn-primary" disabled={submitting}>
                    Save Academic Histories
                  </button>
                </div>
              </div>
            )}

            {/* Tab 5: Medical Record */}
            {activeTab === 'medical' && (
              <form onSubmit={handleUpdateMedical} className="auth-form">
                <h3>Medical Dossier Profile</h3>
                <p className="card-desc">Log blood groups and allergy records for campus medical events.</p>

                <div className="input-group">
                  <label>Blood Type</label>
                  <select value={medBloodType} onChange={(e) => setMedBloodType(e.target.value)} style={{ maxWidth: '200px' }}>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Allergies & Dietary Restrictions</label>
                  <textarea rows={3} placeholder="Enter any allergies..." value={medAllergies} onChange={(e) => setMedAllergies(e.target.value)} style={{ padding: '12px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', outline: 'none' }} />
                </div>

                <div className="input-group">
                  <label>Chronic Medical Conditions</label>
                  <textarea rows={3} placeholder="Enter any medical conditions..." value={medChronic} onChange={(e) => setMedChronic(e.target.value)} style={{ padding: '12px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', outline: 'none' }} />
                </div>

                <div className="input-group">
                  <label>First-Responder Medical Notes</label>
                  <textarea rows={3} placeholder="Enter emergency notes..." value={medNotes} onChange={(e) => setMedNotes(e.target.value)} style={{ padding: '12px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', outline: 'none' }} />
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    Save Medical Dossier
                  </button>
                </div>
              </form>
            )}

            {/* Tab 6: Scholarships */}
            {activeTab === 'scholarship' && (
              <div className="auth-form">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>Scholarship and Tuition Waivers</h3>
                    <p className="card-desc">Review and configure waivers awarded to this student.</p>
                  </div>
                  <button onClick={addScholarshipRow} className="btn btn-outline btn-sm flex-center">
                    <Plus size={14} /> Award Scholarship
                  </button>
                </div>

                {scholarshipList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                    {scholarshipList.map((sch, idx) => (
                      <div key={idx} className="upload-row-item" style={{ flexWrap: 'wrap', gap: '12px' }}>
                        <input
                          type="text"
                          placeholder="Scholarship Name"
                          value={sch.scholarship_name}
                          onChange={(e) => updateScholarshipRow(idx, 'scholarship_name', e.target.value)}
                          style={{ flex: '1.5', minWidth: '160px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                        />
                        <input
                          type="number"
                          placeholder="Waiver %"
                          value={sch.discount_percentage}
                          onChange={(e) => updateScholarshipRow(idx, 'discount_percentage', e.target.value)}
                          style={{ width: '100px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                        />
                        <input
                          type="date"
                          value={sch.award_date}
                          onChange={(e) => updateScholarshipRow(idx, 'award_date', e.target.value)}
                          style={{ width: '150px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                        />
                        <select
                          value={sch.status}
                          onChange={(e) => updateScholarshipRow(idx, 'status', e.target.value)}
                          style={{ width: '120px', padding: '10px', background: '#090d16', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                        <button onClick={() => removeScholarshipRow(idx)} className="btn btn-outline" style={{ color: 'var(--error)', padding: '10px', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-badge" style={{ marginTop: '20px' }}>No scholarships currently mapped to this student.</p>
                )}

                <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                  <button onClick={handleUpdateScholarships} className="btn btn-primary" disabled={submitting}>
                    Save Scholarships Listing
                  </button>
                </div>
              </div>
            )}

            {/* Tab 7: ID Card Generator */}
            {activeTab === 'idcard' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h3>Digital Student ID Card</h3>
                    <p className="card-desc">Double-sided campus card containing barcode and QR indicators.</p>
                  </div>
                  <button onClick={handlePrint} className="btn btn-primary">
                    <Printer size={16} /> Print ID Card
                  </button>
                </div>

                <div className="idcard-double-sided-grid" style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {/* Card Front Side */}
                  <div className="id-card-body card-front" style={{ width: '280px', height: '420px', background: '#ffffff', color: '#000000', borderRadius: '16px', border: '2px solid #d4af37', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 6px 15px rgba(0,0,0,0.15)', position: 'relative' }}>
                    
                    {/* Header Banner */}
                    <div style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e0', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px', color: '#8c6239' }}>ARABIC COLLEGE</span>
                      <div style={{ fontSize: '9px', color: '#718096', marginTop: '2px' }}>Sharia & Linguistic Sciences</div>
                    </div>

                    {/* Photo Box */}
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
                      <div style={{ width: '100px', height: '120px', border: '1px solid #cbd5e0', background: '#f7fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {student.documents.some(d => d.document_type_id === 4) ? (
                          <img src={student.documents.find(d => d.document_type_id === 4)?.file_path} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ fontSize: '11px', color: '#a0aec0', textAlign: 'center', padding: '6px' }}>Student Photo</div>
                        )}
                      </div>
                    </div>

                    {/* Details Info */}
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a202c', textAlign: 'center' }}>{student.name}</div>
                      <div style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>{student.program_name}</div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4f46e5', marginTop: '4px' }}>ID: {student.student_id_number}</div>
                    </div>

                    {/* Barcode Drawer */}
                    <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                      <BarcodeSVG value={student.student_id_number} />
                    </div>
                  </div>

                  {/* Card Back Side */}
                  <div className="id-card-body card-back" style={{ width: '280px', height: '420px', background: '#1e293b', color: '#ffffff', borderRadius: '16px', border: '2px solid #475569', padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 6px 15px rgba(0,0,0,0.15)' }}>
                    
                    {/* Instructions */}
                    <div>
                      <h4 style={{ fontSize: '11px', color: '#a5b4fc', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '8px' }}>Campus Card Terms</h4>
                      <ul style={{ fontSize: '9px', paddingLeft: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
                        <li>This card is property of Arabic College and must be displayed on campus.</li>
                        <li>Loss must be reported to the Registrar immediately.</li>
                      </ul>
                    </div>

                    {/* QR Code Container */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ background: 'white', padding: '6px', borderRadius: '8px', display: 'inline-block' }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${student.student_id_number}`}
                          alt="QR Code"
                          style={{ width: '100px', height: '100px', display: 'block' }}
                        />
                      </div>
                      <span style={{ fontSize: '9px', color: '#94a3b8' }}>Scan for digital profile verification</span>
                    </div>

                    {/* Footer Contact */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', fontSize: '9.5px', textAlign: 'center', color: '#94a3b8' }}>
                      <div>Emergency contact phone:</div>
                      <div style={{ fontWeight: 'bold', color: 'white', marginTop: '2px' }}>{student.phone}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PRINT LAYOUT FOR STUDENT ID CARD */}
        {activeTab === 'idcard' && (
          <div className="printable-id-card-layout print-only" style={{ margin: '0 auto', padding: '20px', background: '#fff' }}>
            <div style={{ display: 'flex', gap: '40px', justifyContent: 'center' }}>
              {/* Card Front Side */}
              <div style={{ width: '280px', height: '420px', background: '#ffffff', color: '#000000', borderRadius: '16px', border: '2px solid #d4af37', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e0', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px', color: '#8c6239' }}>ARABIC COLLEGE</span>
                  <div style={{ fontSize: '9px', color: '#718096', marginTop: '2px' }}>Sharia & Linguistic Sciences</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
                  <div style={{ width: '100px', height: '120px', border: '1px solid #cbd5e0', background: '#f7fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {student.documents.some(d => d.document_type_id === 4) ? (
                      <img src={student.documents.find(d => d.document_type_id === 4)?.file_path} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ fontSize: '11px', color: '#a0aec0', textAlign: 'center', padding: '6px' }}>Student Photo</div>
                    )}
                  </div>
                </div>
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a202c', textAlign: 'center' }}>{student.name}</div>
                  <div style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', fontWeight: '600' }}>{student.program_name}</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4f46e5', marginTop: '4px' }}>ID: {student.student_id_number}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                  <BarcodeSVG value={student.student_id_number} />
                </div>
              </div>

              {/* Card Back Side */}
              <div style={{ width: '280px', height: '420px', background: '#1e293b', color: '#ffffff', borderRadius: '16px', border: '2px solid #475569', padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '11px', color: '#a5b4fc', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '8px' }}>Campus Card Terms</h4>
                  <ul style={{ fontSize: '9px', paddingLeft: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
                    <li>This card is property of Arabic College and must be displayed on campus.</li>
                    <li>Loss must be reported to the Registrar immediately.</li>
                  </ul>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: 'white', padding: '6px', borderRadius: '8px', display: 'inline-block' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${student.student_id_number}`}
                      alt="QR Code"
                      style={{ width: '100px', height: '100px', display: 'block' }}
                    />
                  </div>
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>Scan for digital profile verification</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', fontSize: '9.5px', textAlign: 'center', color: '#94a3b8' }}>
                  <div>Emergency contact phone:</div>
                  <div style={{ fontWeight: 'bold', color: 'white', marginTop: '2px' }}>{student.phone}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminStudentDetail;
