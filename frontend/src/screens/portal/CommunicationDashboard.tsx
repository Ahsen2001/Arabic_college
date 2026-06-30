import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { 
  Megaphone, Mail, MessageSquare, Send, Plus, Trash2, 
  RefreshCw, FileText, CheckCircle, Clock, XCircle, AlertTriangle
} from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  audience_type: string;
  published_at: string;
  expires_at: string | null;
  creator_name: string;
}

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body_markup: string;
}

interface EmailLog {
  id: number;
  recipient_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  trigger_by: string;
}

interface Program {
  id: number;
  name_en: string;
}

const CommunicationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'emails' | 'sms'>('announcements');
  const [loading, setLoading] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnn, setNewAnn] = useState({ title: '', content: '', audience_type: 'All', expires_at: '' });
  
  // Email state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  
  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', body_markup: '' });
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);

  const [emailFilter, setEmailFilter] = useState({
    recipient_role: 'Student',
    program_id: '',
    status_id: '',
    template_id: '',
  });

  // SMS state
  const [smsTest, setSmsTest] = useState({ phone: '', message: '' });
  const [smsLog, setSmsLog] = useState<string[]>([]);

  useEffect(() => {
    fetchAnnouncements();
    fetchTemplates();
    fetchEmailLogs();
    fetchLookups();
  }, []);

  const fetchLookups = async () => {
    try {
      const res = await api.get('/library/lookups');
      setPrograms(res.data.data.categories || []); // or fallback
    } catch {
      // Set static fallback programs if lookup fails
      setPrograms([
        { id: 1, name_en: 'Bachelor in Sharia' },
        { id: 2, name_en: 'Arabic Linguistics' },
        { id: 3, name_en: 'Quranic Memorization (Hifz)' }
      ]);
    }
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/communication/announcements');
      setAnnouncements(res.data.data);
    } catch {
      toast.error('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/communication/email-templates');
      setTemplates(res.data.data);
    } catch {
      toast.error('Failed to load email templates.');
    }
  };

  const fetchEmailLogs = async () => {
    try {
      const res = await api.get('/communication/email-logs');
      setEmailLogs(res.data.data);
    } catch {
      toast.error('Failed to load email logs.');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Publishing announcement...');
    try {
      await api.post('/communication/announcements', {
        ...newAnn,
        expires_at: newAnn.expires_at || null
      });
      toast.success('Announcement published!', { id: toastId });
      setNewAnn({ title: '', content: '', audience_type: 'All', expires_at: '' });
      fetchAnnouncements();
    } catch {
      toast.error('Failed to publish announcement.', { id: toastId });
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm('Are you sure you want to remove this announcement?')) return;
    try {
      await api.delete(`/communication/announcements/${id}`);
      toast.success('Announcement removed.');
      fetchAnnouncements();
    } catch {
      toast.error('Failed to delete announcement.');
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Saving template...');
    try {
      await api.post('/communication/email-templates', {
        id: editingTemplateId || undefined,
        ...newTemplate
      });
      toast.success('Email template saved.', { id: toastId });
      setNewTemplate({ name: '', subject: '', body_markup: '' });
      setEditingTemplateId(null);
      fetchTemplates();
    } catch {
      toast.error('Failed to save template.', { id: toastId });
    }
  };

  const handleSendBulkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailFilter.template_id) {
      toast.error('Please select an email template to dispatch.');
      return;
    }

    const toastId = toast.loading('Compiling recipients and queueing emails...');
    try {
      await api.post('/communication/emails/send-bulk', {
        recipient_role: emailFilter.recipient_role,
        program_id: emailFilter.program_id ? parseInt(emailFilter.program_id) : null,
        status_id: emailFilter.status_id ? parseInt(emailFilter.status_id) : null,
        template_id: parseInt(emailFilter.template_id),
      });
      toast.success('Bulk emails compiled and queued successfully!', { id: toastId });
      fetchEmailLogs();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to dispatch bulk emails.';
      toast.error(msg, { id: toastId });
    }
  };

  const handleProcessQueue = async () => {
    const toastId = toast.loading('Processing pending emails in queue...');
    try {
      await api.post('/communication/emails/process-queue');
      toast.success('Mail queue processed successfully.', { id: toastId });
      fetchEmailLogs();
    } catch {
      toast.error('Failed to process mail queue.', { id: toastId });
    }
  };

  const handleSendSmsTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Sending test SMS via active gateway...');
    try {
      await api.post('/communication/sms/test', smsTest);
      toast.success('Test SMS dispatched!', { id: toastId });
      setSmsLog(prev => [
        `[${new Date().toLocaleTimeString()}] Sent to ${smsTest.phone}: "${smsTest.message}"`,
        ...prev
      ]);
      setSmsTest({ phone: '', message: '' });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'SMS dispatch failed.';
      toast.error(msg, { id: toastId });
    }
  };

  const loadTemplateIntoFields = (tpl: EmailTemplate) => {
    setNewTemplate({
      name: tpl.name,
      subject: tpl.subject,
      body_markup: tpl.body_markup
    });
    setEditingTemplateId(tpl.id);
  };

  return (
    <div className="communication-dashboard-container">
      <header className="dashboard-header" style={{ marginBottom: '24px' }}>
        <h1>Communication Center</h1>
        <p className="card-desc">Coordinate campus-wide announcements, bulk email campaigns, and SMS notification dispatch.</p>
      </header>

      {/* Tabs Layout */}
      <div className="tabs" style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('announcements')} 
          className={`btn btn-sm ${activeTab === 'announcements' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Megaphone size={16} /> Announcements
        </button>
        <button 
          onClick={() => setActiveTab('emails')} 
          className={`btn btn-sm ${activeTab === 'emails' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Mail size={16} /> Bulk Emailer
        </button>
        <button 
          onClick={() => setActiveTab('sms')} 
          className={`btn btn-sm ${activeTab === 'sms' ? 'btn-primary' : 'btn-outline'}`}
        >
          <MessageSquare size={16} /> SMS Gateway
        </button>
      </div>

      {/* ANNOUNCEMENTS TAB */}
      {activeTab === 'announcements' && (
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Create Announcement */}
          <div className="dashboard-card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Plus size={18} className="logo-icon" />
              <h3>Publish Announcement</h3>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="auth-form">
              <div className="input-group">
                <label>Announcement Title</label>
                <div className="input-wrapper">
                  <input 
                    type="text" 
                    placeholder="Enter short, descriptive title" 
                    value={newAnn.title}
                    onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                    required 
                    style={{ paddingLeft: '14px' }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Audience Target</label>
                <select 
                  value={newAnn.audience_type} 
                  onChange={(e) => setNewAnn({ ...newAnn, audience_type: e.target.value })}
                >
                  <option value="All">All Portal Users</option>
                  <option value="Student">Students Only</option>
                  <option value="Teacher">Teachers Only</option>
                  <option value="Staff">Staff Only</option>
                </select>
              </div>

              <div className="input-group">
                <label>Content / Body</label>
                <textarea 
                  rows={4}
                  placeholder="Type the message body here..."
                  value={newAnn.content}
                  onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: 'white',
                    padding: '12px',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div className="input-group">
                <label>Expiration Date (Optional)</label>
                <div className="input-wrapper">
                  <input 
                    type="datetime-local" 
                    value={newAnn.expires_at}
                    onChange={(e) => setNewAnn({ ...newAnn, expires_at: e.target.value })}
                    style={{ paddingLeft: '14px' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                <Send size={16} /> Publish Notice
              </button>
            </form>
          </div>

          {/* Active Announcements List */}
          <div className="dashboard-card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Active Announcements</h3>
              <button onClick={fetchAnnouncements} className="btn btn-outline btn-sm">
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {loading ? (
              <p>Syncing announcements...</p>
            ) : announcements.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No active announcements found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {announcements.map((ann) => (
                  <div key={ann.id} className="detail-item" style={{ flexDirection: 'column', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '14px', background: 'rgba(255, 255, 255, 0.01)', display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="badge badge-role" style={{ fontSize: '11px' }}>Audience: {ann.audience_type}</span>
                      <button 
                        onClick={() => handleDeleteAnnouncement(ann.id)} 
                        className="btn btn-outline" 
                        style={{ padding: '4px 8px', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                        title="Delete Announcement"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <h4 style={{ color: 'white', fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>{ann.title}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '10px' }}>{ann.content}</p>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>By: {ann.creator_name}</span>
                      <span>Published: {ann.published_at}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BULK EMAIL TAB */}
      {activeTab === 'emails' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Manage Templates */}
            <div className="dashboard-card">
              <div className="card-header" style={{ marginBottom: '16px' }}>
                <h3>{editingTemplateId ? 'Edit Template' : 'Create Email Template'}</h3>
              </div>
              <form onSubmit={handleSaveTemplate} className="auth-form">
                <div className="input-group">
                  <label>Template Identifier Name</label>
                  <div className="input-wrapper">
                    <input 
                      type="text" 
                      placeholder="e.g. welcome_student"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      required
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Default Email Subject</label>
                  <div className="input-wrapper">
                    <input 
                      type="text" 
                      placeholder="e.g. Welcome to Arabic Sharia College, {{NAME}}"
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                      required
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>HTML / Body Markup (supports variables: {"{{NAME}}"}, {"{{EMAIL}}"}, {"{{PHONE}}"})</label>
                  <textarea 
                    rows={6}
                    placeholder="Dear {{NAME}},\n\nWe are pleased to inform you..."
                    value={newTemplate.body_markup}
                    onChange={(e) => setNewTemplate({ ...newTemplate, body_markup: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: 'white',
                      padding: '12px',
                      outline: 'none',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {editingTemplateId ? 'Update Template' : 'Create Template'}
                  </button>
                  {editingTemplateId && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingTemplateId(null);
                        setNewTemplate({ name: '', subject: '', body_markup: '' });
                      }} 
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Template Selector & Filters */}
            <div className="dashboard-card">
              <div className="card-header" style={{ marginBottom: '16px' }}>
                <h3>Recipient Filters & Dispatcher</h3>
              </div>
              <form onSubmit={handleSendBulkEmail} className="auth-form">
                
                <div className="input-group">
                  <label>1. Select Compiled Email Template</label>
                  <select 
                    value={emailFilter.template_id}
                    onChange={(e) => setEmailFilter({ ...emailFilter, template_id: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Template --</option>
                    {templates.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>{tpl.name} (Subject: {tpl.subject})</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>2. Filter Audience Group</label>
                  <select 
                    value={emailFilter.recipient_role}
                    onChange={(e) => setEmailFilter({ ...emailFilter, recipient_role: e.target.value })}
                  >
                    <option value="All">All Registered Portal Accounts</option>
                    <option value="Student">Students Only</option>
                    <option value="Teacher">Teachers Only</option>
                    <option value="Staff">Staff Only</option>
                  </select>
                </div>

                {emailFilter.recipient_role === 'Student' && (
                  <>
                    <div className="input-group">
                      <label>Program Filter (Students Only)</label>
                      <select 
                        value={emailFilter.program_id}
                        onChange={(e) => setEmailFilter({ ...emailFilter, program_id: e.target.value })}
                      >
                        <option value="">All Programs</option>
                        {programs.map(prog => (
                          <option key={prog.id} value={prog.id}>{prog.name_en}</option>
                        ))}
                      </select>
                    </div>

                    <div className="input-group">
                      <label>Student Status Filter</label>
                      <select 
                        value={emailFilter.status_id}
                        onChange={(e) => setEmailFilter({ ...emailFilter, status_id: e.target.value })}
                      >
                        <option value="">All Statuses</option>
                        <option value="1">Active</option>
                        <option value="2">Graduated</option>
                        <option value="3">Suspended</option>
                        <option value="4">Withdrawn</option>
                      </select>
                    </div>
                  </>
                )}

                <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '8px', fontSize: '13px' }}>
                  <p style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
                    Emails will be added to the queue in a <strong>Pending</strong> state. Run the queue manager below to dispatch.
                  </p>
                </div>

                <button type="submit" className="btn btn-primary">
                  <Send size={16} /> Compile & Queue Bulk Mail
                </button>
              </form>

              {templates.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Click to edit template parameters:</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {templates.map(tpl => (
                      <button 
                        key={tpl.id} 
                        onClick={() => loadTemplateIntoFields(tpl)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '6px 12px' }}
                      >
                        <FileText size={12} /> {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email Logs Queue List */}
          <div className="dashboard-card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3>Mail Logs & Queue Engine</h3>
                <span className="card-desc">Tracks asynchronous email logs and pending queue batches.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleProcessQueue} className="btn btn-primary btn-sm">
                  <RefreshCw size={14} /> Process Pending Queue
                </button>
                <button onClick={fetchEmailLogs} className="btn btn-outline btn-sm">
                  Refresh Logs
                </button>
              </div>
            </div>

            <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Trigger By</th>
                    <th>Sent At / Queued</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No queued or sent email logs found.</td>
                    </tr>
                  ) : (
                    emailLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{log.recipient_email}</td>
                        <td style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.subject}</td>
                        <td>
                          {log.status === 'Sent' && (
                            <span className="badge badge-permission" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={12} /> Sent
                            </span>
                          )}
                          {log.status === 'Pending' && (
                            <span className="badge badge-role" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> Queued
                            </span>
                          )}
                          {log.status === 'Failed' && (
                            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '4px' }} title={log.error_message || ''}>
                              <XCircle size={12} /> Failed
                            </span>
                          )}
                        </td>
                        <td>{log.trigger_by}</td>
                        <td style={{ fontSize: '12px' }}>{log.sent_at || `Queued: ${log.created_at}`}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SMS GATEWAY TAB */}
      {activeTab === 'sms' && (
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Test Form */}
          <div className="dashboard-card">
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <h3>Pluggable SMS Dispatch Tester</h3>
              <p className="card-desc">Tests future-ready SMS provider gateway integration. Supports Twilio and Local Log drivers.</p>
            </div>
            <form onSubmit={handleSendSmsTest} className="auth-form">
              <div className="input-group">
                <label>Test Recipient Phone (Mobile format)</label>
                <div className="input-wrapper">
                  <input 
                    type="text" 
                    placeholder="e.g. +966501234567" 
                    value={smsTest.phone}
                    onChange={(e) => setSmsTest({ ...smsTest, phone: e.target.value })}
                    required
                    style={{ paddingLeft: '14px' }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>SMS Message Body (Max 160 characters)</label>
                <textarea 
                  rows={4}
                  maxLength={160}
                  placeholder="Write message here..."
                  value={smsTest.message}
                  onChange={(e) => setSmsTest({ ...smsTest, message: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: 'white',
                    padding: '12px',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                <Send size={16} /> Test Dispatch
              </button>
            </form>
          </div>

          {/* SMS Driver Output Logger */}
          <div className="dashboard-card">
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <h3>Gateway Execution Logs</h3>
            </div>
            <div style={{ 
              background: '#020617', 
              border: '1px solid var(--border-glass)', 
              borderRadius: '12px', 
              padding: '16px', 
              height: '340px', 
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#38bdf8'
            }}>
              {smsLog.length === 0 ? (
                <span style={{ color: 'var(--text-secondary)' }}>No SMS dispatched in this session. Trigger a test dispatch to view logs.</span>
              ) : (
                smsLog.map((logStr, idx) => (
                  <div key={idx} style={{ marginBottom: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px' }}>
                    {logStr}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationDashboard;
