import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { 
  Info, Mail, Calendar,
  Trash2, Shield, Upload, FileText, Layout, RefreshCw, 
  Download, Plus, Save, BookOpen
} from 'lucide-react';

interface AcademicYear {
  id: number;
  name: string;
  is_active: boolean;
}

interface BackupRecord {
  id: number;
  file_name: string;
  file_size_bytes: number;
  backup_status_id: number;
  initiated_by_user_id: number;
  created_at: string;
  initiator?: {
    name: string;
    email: string;
  };
}

interface SlideItem {
  title: string;
  description: string;
  image: string;
  cta: string;
  link: string;
}

interface ValueItem {
  title: string;
  desc: string;
}

interface CmsAbout {
  intro_title: string;
  intro_desc: string;
  values: ValueItem[];
}

interface CmsFaq {
  category: string;
  question: string;
  answer: string;
}

interface CmsGallery {
  image: string;
  caption: string;
}

interface CmsNews {
  id: number;
  title: string;
  content: string;
  date: string;
}

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'college' | 'smtp' | 'academic' | 'otp' | 'storage' | 'cms' | 'backup'>('college');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [backupTriggering, setBackupTriggering] = useState(false);

  // Database settings records maps
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);

  // Selected Active Academic Year ID
  const [selectedActiveYear, setSelectedActiveYear] = useState<string>('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/settings');
      setSettings(response.data.settings || {});
      setAcademicYears(response.data.academic_years || []);
      setBackups(response.data.backups || []);
      
      // Locate active year
      const activeYear = response.data.academic_years.find((y: AcademicYear) => y.is_active);
      if (activeYear) {
        setSelectedActiveYear(activeYear.id.toString());
      }
    } catch (error) {
      toast.error('Failed to load system settings panel records.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // Nested CMS content modifications
  const handleCmsAboutChange = (field: string, value: any) => {
    const currentAbout = (settings.cms_about_content as CmsAbout) || { intro_title: '', intro_desc: '', values: [] };
    setSettings((prev) => ({
      ...prev,
      cms_about_content: {
        ...currentAbout,
        [field]: value
      }
    }));
  };

  const handleCmsAboutValueChange = (index: number, field: keyof ValueItem, value: string) => {
    const currentAbout = (settings.cms_about_content as CmsAbout) || { intro_title: '', intro_desc: '', values: [] };
    const currentValues = [...currentAbout.values];
    if (currentValues[index]) {
      currentValues[index] = { ...currentValues[index], [field]: value };
      handleCmsAboutChange('values', currentValues);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading('Saving system configurations...');

    try {
      await api.post('/admin/settings', {
        settings: settings,
        active_academic_year_id: selectedActiveYear ? parseInt(selectedActiveYear) : null
      });
      toast.success('System settings saved successfully!', { id: toastId });
      fetchSettings(); // reload state
    } catch (error) {
      toast.error('Failed to save settings. Please verify inputs.', { id: toastId });
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    setLogoUploading(true);
    const toastId = toast.loading('Uploading institutional logo...');

    try {
      const response = await api.post('/admin/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      handleInputChange('college_logo', response.data.logo_url);
      toast.success('Logo uploaded successfully!', { id: toastId });
    } catch (error) {
      toast.error('Logo upload failed. Must be image smaller than 4MB.', { id: toastId });
      console.error(error);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleTriggerBackup = async () => {
    setBackupTriggering(true);
    const toastId = toast.loading('Compiling database SQL backup structure...');

    try {
      const response = await api.post('/admin/settings/backup');
      setBackups((prev) => [response.data.backup, ...prev]);
      toast.success('Database backup created and logged successfully!', { id: toastId });
    } catch (error) {
      toast.error('Failed to compile backup. Disk error.', { id: toastId });
      console.error(error);
    } finally {
      setBackupTriggering(false);
    }
  };

  const handleDownloadBackup = (id: number, name: string) => {
    // Direct stream link utilizing token authorization
    const token = localStorage.getItem('token');
    const url = `${api.defaults.baseURL}/admin/settings/backup/${id}/download?token=${token}`;
    
    // Simulate simple download trigger
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading backup file: ${name}`);
  };

  const handleRestoreBackup = async (id: number) => {
    if (!window.confirm('WARNING: Restoring the database will overwrite existing configuration keys. Do you wish to proceed?')) {
      return;
    }

    const toastId = toast.loading('Restoring SQL dump schemas...');
    try {
      const response = await api.post(`/admin/settings/backup/${id}/restore`);
      toast.success(response.data.message || 'Database restored successfully!', { id: toastId });
      fetchSettings();
    } catch (error) {
      toast.error('Restoration failed. Invalid SQL structure.', { id: toastId });
      console.error(error);
    }
  };

  // CMS Helper operations
  const addSlide = () => {
    const slides = [...(settings.cms_home_hero || [])];
    slides.push({
      title: 'New Slide Title',
      description: 'Slide description details here.',
      image: '/assets/college_campus.png',
      cta: 'Explore More',
      link: '/about'
    });
    handleInputChange('cms_home_hero', slides);
  };

  const removeSlide = (idx: number) => {
    const slides = (settings.cms_home_hero || []).filter((_: any, i: number) => i !== idx);
    handleInputChange('cms_home_hero', slides);
  };

  const updateSlideField = (idx: number, field: keyof SlideItem, val: string) => {
    const slides = [...(settings.cms_home_hero || [])];
    if (slides[idx]) {
      slides[idx] = { ...slides[idx], [field]: val };
      handleInputChange('cms_home_hero', slides);
    }
  };

  const addFaqItem = () => {
    const faqs = [...(settings.cms_faq_list || [])];
    faqs.push({
      category: 'general',
      question: 'New Frequently Asked Question?',
      answer: 'Type the detailed answer details here.'
    });
    handleInputChange('cms_faq_list', faqs);
  };

  const removeFaqItem = (idx: number) => {
    const faqs = (settings.cms_faq_list || []).filter((_: any, i: number) => i !== idx);
    handleInputChange('cms_faq_list', faqs);
  };

  const updateFaqField = (idx: number, field: keyof CmsFaq, val: string) => {
    const faqs = [...(settings.cms_faq_list || [])];
    if (faqs[idx]) {
      faqs[idx] = { ...faqs[idx], [field]: val };
      handleInputChange('cms_faq_list', faqs);
    }
  };

  const addGalleryItem = () => {
    const gallery = [...(settings.cms_gallery_images || [])];
    gallery.push({
      image: '/assets/college_campus.png',
      caption: 'Campus classroom'
    });
    handleInputChange('cms_gallery_images', gallery);
  };

  const removeGalleryItem = (idx: number) => {
    const gallery = (settings.cms_gallery_images || []).filter((_: any, i: number) => i !== idx);
    handleInputChange('cms_gallery_images', gallery);
  };

  const updateGalleryField = (idx: number, field: keyof CmsGallery, val: string) => {
    const gallery = [...(settings.cms_gallery_images || [])];
    if (gallery[idx]) {
      gallery[idx] = { ...gallery[idx], [field]: val };
      handleInputChange('cms_gallery_images', gallery);
    }
  };

  const addNewsItem = () => {
    const news = [...(settings.cms_news_bulletins || [])];
    const nextId = news.reduce((max: number, item: any) => item.id > max ? item.id : max, 0) + 1;
    news.unshift({
      id: nextId,
      title: 'New Announcement Header',
      content: 'Detailed school newsletter description.',
      date: new Date().toISOString().split('T')[0]
    });
    handleInputChange('cms_news_bulletins', news);
  };

  const removeNewsItem = (idx: number) => {
    const news = (settings.cms_news_bulletins || []).filter((_: any, i: number) => i !== idx);
    handleInputChange('cms_news_bulletins', news);
  };

  const updateNewsField = (idx: number, field: keyof CmsNews, val: string) => {
    const news = [...(settings.cms_news_bulletins || [])];
    if (news[idx]) {
      news[idx] = { ...news[idx], [field]: val };
      handleInputChange('cms_news_bulletins', news);
    }
  };

  if (loading) {
    return (
      <div className="portal-loading-container">
        <div className="spinner"></div>
        <p>Fetching institutional setups & configurations...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-content-container">
      <div className="dashboard-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2>System & Utilities Settings</h2>
          <p className="subtitle">Configure institutional metadata, logo branding, email SMTP gates, and edit public web pages layout CMS blocks</p>
        </div>
      </div>

      <div className="timetable-layout-grid" style={{ gridTemplateColumns: '240px 1fr', gap: '24px' }}>
        {/* Settings Tab Sidebar Navigation */}
        <div className="dashboard-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', height: 'fit-content' }}>
          <button 
            type="button" 
            onClick={() => setActiveTab('college')} 
            className={`portal-sidebar-item ${activeTab === 'college' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Info size={16} /> College Details
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('smtp')} 
            className={`portal-sidebar-item ${activeTab === 'smtp' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Mail size={16} /> SMTP Gateway
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('academic')} 
            className={`portal-sidebar-item ${activeTab === 'academic' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Calendar size={16} /> Academic Year
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('otp')} 
            className={`portal-sidebar-item ${activeTab === 'otp' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Shield size={16} /> Security & OTP
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('storage')} 
            className={`portal-sidebar-item ${activeTab === 'storage' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <FileText size={16} /> PDF & Storage
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('cms')} 
            className={`portal-sidebar-item ${activeTab === 'cms' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Layout size={16} /> Public Web CMS
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('backup')} 
            className={`portal-sidebar-item ${activeTab === 'backup' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <RefreshCw size={16} /> Database Backups
          </button>
        </div>

        {/* Form Workspace Content */}
        <form onSubmit={handleSaveSettings}>
          {activeTab === 'college' && (
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card-header">
                <h3>College Information & Logo</h3>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>College Full Name</label>
                  <input 
                    type="text" 
                    value={settings.college_name || ''} 
                    onChange={(e) => handleInputChange('college_name', e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Institutional Abbreviation</label>
                  <input 
                    type="text" 
                    value={settings.college_abbreviation || ''} 
                    onChange={(e) => handleInputChange('college_abbreviation', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>College Admin Email Address</label>
                  <input 
                    type="email" 
                    value={settings.college_email || ''} 
                    onChange={(e) => handleInputChange('college_email', e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Contact Phone Number</label>
                  <input 
                    type="text" 
                    value={settings.college_phone || ''} 
                    onChange={(e) => handleInputChange('college_phone', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Physical Campus Address</label>
                <input 
                  type="text" 
                  value={settings.college_address || ''} 
                  onChange={(e) => handleInputChange('college_address', e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Institutional Logo Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {settings.college_logo ? (
                      <img src={settings.college_logo} alt="College Logo preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <BookOpen size={32} style={{ color: 'var(--text-secondary)' }} />
                    )}
                  </div>
                  <div>
                    <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                      <Upload size={14} /> Upload New Logo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        style={{ display: 'none' }}
                        disabled={logoUploading}
                      />
                    </label>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>Supported formats: PNG, JPG, WebP. Max 4MB size limit.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'smtp' && (
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card-header">
                <h3>SMTP Outgoing Mail Gateway</h3>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>SMTP Gateway Host Name</label>
                  <input 
                    type="text" 
                    value={settings.smtp_host || ''} 
                    onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>SMTP Connection Port</label>
                  <input 
                    type="number" 
                    value={settings.smtp_port || ''} 
                    onChange={(e) => handleInputChange('smtp_port', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>SMTP Username</label>
                  <input 
                    type="text" 
                    value={settings.smtp_username || ''} 
                    onChange={(e) => handleInputChange('smtp_username', e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>SMTP Password</label>
                  <input 
                    type="password" 
                    value={settings.smtp_password || ''} 
                    onChange={(e) => handleInputChange('smtp_password', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-3">
                <div className="input-group">
                  <label>Connection Encryption</label>
                  <select 
                    value={settings.smtp_encryption || ''} 
                    onChange={(e) => handleInputChange('smtp_encryption', e.target.value)}
                  >
                    <option value="none">None (Plain Text)</option>
                    <option value="ssl">SSL Secure</option>
                    <option value="tls">TLS Secure</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Sender Default From Name</label>
                  <input 
                    type="text" 
                    value={settings.smtp_from_name || ''} 
                    onChange={(e) => handleInputChange('smtp_from_name', e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Sender Default From Address</label>
                  <input 
                    type="email" 
                    value={settings.smtp_from_address || ''} 
                    onChange={(e) => handleInputChange('smtp_from_address', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card-header">
                <h3>Academic Year & Admissions Gate</h3>
              </div>
              
              <div className="input-group">
                <label>Set Active Academic Year Calendar</label>
                <select 
                  value={selectedActiveYear} 
                  onChange={(e) => setSelectedActiveYear(e.target.value)}
                  required
                >
                  <option value="">-- Choose Calendar Year --</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name} {year.is_active ? '(Currently Active)' : ''}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>Changing this resets the default active semester rosters loaded inside the teacher, student, and finance billing portal views.</p>
              </div>

              <div className="input-group">
                <label>Admissions Portal Intake Status</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                  <label className="switch-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={settings.admission_status === 'open'} 
                      onChange={(e) => handleInputChange('admission_status', e.target.checked ? 'open' : 'closed')}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <span style={{ fontWeight: '600', color: settings.admission_status === 'open' ? 'var(--success)' : 'var(--error)' }}>
                      {settings.admission_status === 'open' ? 'Admissions Active (Open)' : 'Admissions Suspended (Closed)'}
                    </span>
                  </label>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Toggle this to open or close the public application portal gates to prospective students.</p>
              </div>
            </div>
          )}

          {activeTab === 'otp' && (
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card-header">
                <h3>Security & Verification OTP Settings</h3>
              </div>
              <div className="grid-3">
                <div className="input-group">
                  <label>OTP Validity Expiration (Seconds)</label>
                  <input 
                    type="number" 
                    value={settings.otp_expiry_seconds || ''} 
                    onChange={(e) => handleInputChange('otp_expiry_seconds', parseInt(e.target.value))}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>OTP Digit Code Length</label>
                  <input 
                    type="number" 
                    value={settings.otp_digits || ''} 
                    onChange={(e) => handleInputChange('otp_digits', parseInt(e.target.value))}
                    min={4}
                    max={8}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Mandatory Email OTP Gate</label>
                  <select 
                    value={settings.otp_mandatory ? '1' : '0'} 
                    onChange={(e) => handleInputChange('otp_mandatory', e.target.value === '1')}
                  >
                    <option value="0">No, optional verify</option>
                    <option value="1">Yes, strictly required</option>
                  </select>
                </div>
              </div>

              <hr style={{ border: 'none', borderBottom: '1px solid var(--border-glass)' }} />

              <div className="card-header">
                <h3>Security Policy Settings</h3>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>Password Minimum Length</label>
                  <input 
                    type="number" 
                    value={settings.password_min_length || ''} 
                    onChange={(e) => handleInputChange('password_min_length', parseInt(e.target.value))}
                    min={6}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Require Special Symbols in Password</label>
                  <select 
                    value={settings.password_require_symbols ? '1' : '0'} 
                    onChange={(e) => handleInputChange('password_require_symbols', e.target.value === '1')}
                  >
                    <option value="0">Disabled</option>
                    <option value="1">Enabled</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>Max Failed Login Lockout Attempts</label>
                  <input 
                    type="number" 
                    value={settings.login_max_attempts || ''} 
                    onChange={(e) => handleInputChange('login_max_attempts', parseInt(e.target.value))}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Inactive User Session Lifetime (Minutes)</label>
                  <input 
                    type="number" 
                    value={settings.session_lifetime_minutes || ''} 
                    onChange={(e) => handleInputChange('session_lifetime_minutes', parseInt(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card-header">
                <h3>PDF Formatting & File Storage Limits</h3>
              </div>
              
              <div className="grid-2">
                <div className="input-group">
                  <label>Active File Upload Storage disk</label>
                  <select 
                    value={settings.file_storage_driver || ''} 
                    onChange={(e) => handleInputChange('file_storage_driver', e.target.value)}
                  >
                    <option value="local">Local Storage Disk (Default)</option>
                    <option value="s3">Amazon AWS S3 Cloud Drive</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Max Attachment Upload Size (MB)</label>
                  <input 
                    type="number" 
                    value={settings.max_upload_size_mb || ''} 
                    onChange={(e) => handleInputChange('max_upload_size_mb', parseInt(e.target.value))}
                    required
                  />
                </div>
              </div>

              <hr style={{ border: 'none', borderBottom: '1px solid var(--border-glass)' }} />

              <div className="input-group">
                <label>PDF Template Header HTML</label>
                <textarea 
                  rows={4} 
                  value={settings.pdf_header_template || ''} 
                  onChange={(e) => handleInputChange('pdf_header_template', e.target.value)}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: 'white', padding: '12px', outline: 'none' }}
                />
              </div>

              <div className="input-group">
                <label>PDF Template Footer HTML</label>
                <textarea 
                  rows={4} 
                  value={settings.pdf_footer_template || ''} 
                  onChange={(e) => handleInputChange('pdf_footer_template', e.target.value)}
                  style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: 'white', padding: '12px', outline: 'none' }}
                />
              </div>
            </div>
          )}

          {activeTab === 'cms' && (
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card-header">
                <h3>Public Website CMS Settings Panel</h3>
              </div>

              {/* 1. Hero Slides Section */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ color: 'white' }}>1. Home Hero Slides Manager</h4>
                  <button type="button" onClick={addSlide} className="btn btn-outline btn-sm">
                    <Plus size={12} /> Add Hero Slide
                  </button>
                </div>
                {((settings.cms_home_hero) || []).map((slide: SlideItem, idx: number) => (
                  <div key={idx} style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', marginBottom: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ color: '#818cf8' }}>Slide #{idx + 1}</strong>
                      <button type="button" onClick={() => removeSlide(idx)} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid-2">
                      <div className="input-group">
                        <label>Slide Title Header</label>
                        <input 
                          type="text" 
                          value={slide.title} 
                          onChange={(e) => updateSlideField(idx, 'title', e.target.value)} 
                        />
                      </div>
                      <div className="input-group">
                        <label>Background Image Link</label>
                        <input 
                          type="text" 
                          value={slide.image} 
                          onChange={(e) => updateSlideField(idx, 'image', e.target.value)} 
                        />
                      </div>
                    </div>
                    <div className="input-group" style={{ marginTop: '8px' }}>
                      <label>Slide Paragraph Subtext</label>
                      <input 
                        type="text" 
                        value={slide.description} 
                        onChange={(e) => updateSlideField(idx, 'description', e.target.value)} 
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 2. About Page intro Content */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <h4 style={{ color: 'white', marginBottom: '14px' }}>2. About Page CMS Content</h4>
                <div className="input-group">
                  <label>Intro Main Header</label>
                  <input 
                    type="text" 
                    value={((settings.cms_about_content as CmsAbout)?.intro_title) || ''} 
                    onChange={(e) => handleCmsAboutChange('intro_title', e.target.value)} 
                  />
                </div>
                <div className="input-group" style={{ marginTop: '12px' }}>
                  <label>Intro Descriptions Paragraph</label>
                  <textarea 
                    rows={3}
                    value={((settings.cms_about_content as CmsAbout)?.intro_desc) || ''} 
                    onChange={(e) => handleCmsAboutChange('intro_desc', e.target.value)} 
                    style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'white', padding: '10px', outline: 'none' }}
                  />
                </div>

                <h5 style={{ color: '#a5b4fc', marginTop: '14px', marginBottom: '8px' }}>Core Values Elements</h5>
                {((settings.cms_about_content as CmsAbout)?.values || []).map((val, idx) => (
                  <div key={idx} className="grid-2" style={{ marginBottom: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="Value Title" 
                      value={val.title} 
                      onChange={(e) => handleCmsAboutValueChange(idx, 'title', e.target.value)} 
                    />
                    <input 
                      type="text" 
                      placeholder="Value Description Subtext" 
                      value={val.desc} 
                      onChange={(e) => handleCmsAboutValueChange(idx, 'desc', e.target.value)} 
                    />
                  </div>
                ))}
              </div>

              {/* 3. FAQ accordions manager */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ color: 'white' }}>3. FAQ Page accordion Manager</h4>
                  <button type="button" onClick={addFaqItem} className="btn btn-outline btn-sm">
                    <Plus size={12} /> Add FAQ item
                  </button>
                </div>
                {((settings.cms_faq_list) || []).map((faq: CmsFaq, idx: number) => (
                  <div key={idx} style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', marginBottom: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <select 
                        value={faq.category} 
                        onChange={(e) => updateFaqField(idx, 'category', e.target.value)}
                        style={{ width: '160px', padding: '4px' }}
                      >
                        <option value="general">General Queries</option>
                        <option value="admissions">Admissions</option>
                        <option value="academics">Academics</option>
                      </select>
                      <button type="button" onClick={() => removeFaqItem(idx)} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="input-group">
                      <label>Question Text Header</label>
                      <input 
                        type="text" 
                        value={faq.question} 
                        onChange={(e) => updateFaqField(idx, 'question', e.target.value)} 
                      />
                    </div>
                    <div className="input-group" style={{ marginTop: '8px' }}>
                      <label>Answer details block</label>
                      <textarea 
                        rows={2} 
                        value={faq.answer} 
                        onChange={(e) => updateFaqField(idx, 'answer', e.target.value)}
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'white', padding: '10px', outline: 'none' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 4. Gallery asset manager */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ color: 'white' }}>4. Campus Gallery Manager</h4>
                  <button type="button" onClick={addGalleryItem} className="btn btn-outline btn-sm">
                    <Plus size={12} /> Add photo
                  </button>
                </div>
                {((settings.cms_gallery_images) || []).map((gal: CmsGallery, idx: number) => (
                  <div key={idx} className="grid-3" style={{ marginBottom: '10px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      placeholder="Image url link" 
                      value={gal.image} 
                      onChange={(e) => updateGalleryField(idx, 'image', e.target.value)} 
                    />
                    <input 
                      type="text" 
                      placeholder="Photo caption text" 
                      value={gal.caption} 
                      onChange={(e) => updateGalleryField(idx, 'caption', e.target.value)} 
                    />
                    <button type="button" onClick={() => removeGalleryItem(idx)} className="btn btn-outline btn-sm" style={{ borderColor: 'var(--error)', color: 'var(--error)', width: 'fit-content' }}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* 5. Bulletins news manager */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ color: 'white' }}>5. News & Announcements Bulletins</h4>
                  <button type="button" onClick={addNewsItem} className="btn btn-outline btn-sm">
                    <Plus size={12} /> Add announcement
                  </button>
                </div>
                {((settings.cms_news_bulletins) || []).map((news: CmsNews, idx: number) => (
                  <div key={idx} style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', marginBottom: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <input 
                        type="date" 
                        value={news.date} 
                        onChange={(e) => updateNewsField(idx, 'date', e.target.value)}
                        style={{ width: '150px', padding: '4px' }}
                      />
                      <button type="button" onClick={() => removeNewsItem(idx)} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="input-group">
                      <label>Headline title text</label>
                      <input 
                        type="text" 
                        value={news.title} 
                        onChange={(e) => updateNewsField(idx, 'title', e.target.value)} 
                      />
                    </div>
                    <div className="input-group" style={{ marginTop: '8px' }}>
                      <label>News Content Details</label>
                      <textarea 
                        rows={2} 
                        value={news.content} 
                        onChange={(e) => updateNewsField(idx, 'content', e.target.value)}
                        style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'white', padding: '10px', outline: 'none' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Database Backup & Restore center</h3>
                <button 
                  type="button" 
                  onClick={handleTriggerBackup} 
                  className="btn btn-primary btn-sm"
                  disabled={backupTriggering}
                >
                  <RefreshCw size={14} className={backupTriggering ? 'spin' : ''} /> Run Full SQL Backup
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Creating a database backup bundles all table relations, Spatie role mappings, research papers configurations, student records files, and settings variables into a queryable SQL file. You can download these backups or restore active schemas instantly.
              </p>

              {/* Table of Backups */}
              <div className="table-responsive">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Created Date</th>
                      <th>File Name</th>
                      <th>File Size</th>
                      <th>Status</th>
                      <th>Initiator User</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No database backups created yet.</td>
                      </tr>
                    ) : (
                      backups.map((back) => (
                        <tr key={back.id}>
                          <td>{new Date(back.created_at).toLocaleString()}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{back.file_name}</td>
                          <td>{(back.file_size_bytes / 1024).toFixed(2)} KB</td>
                          <td>
                            <span className="badge badge-success">Success</span>
                          </td>
                          <td>{back.initiator ? back.initiator.name : 'System Worker'}</td>
                          <td style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button 
                              type="button" 
                              onClick={() => handleDownloadBackup(back.id, back.file_name)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '6px 10px' }}
                              title="Download backup file"
                            >
                              <Download size={12} /> Download
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleRestoreBackup(back.id)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '6px 10px', borderColor: 'var(--warning)', color: 'var(--warning)' }}
                              title="Restore configurations"
                            >
                              Restore
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sticky footer action bar */}
          {activeTab !== 'backup' && (
            <div className="dashboard-card" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px', position: 'sticky', bottom: '20px', zIndex: '100', background: 'rgba(30, 41, 59, 0.95)', border: '1px solid var(--border-glass)', boxShadow: '0 -10px 20px rgba(0,0,0,0.1)' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={saving}
                style={{ width: '200px' }}
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SystemSettings;
export { SystemSettings };
