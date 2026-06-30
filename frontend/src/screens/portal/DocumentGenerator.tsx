import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { 
  FileText, Plus, RefreshCw, 
  Download, ShieldCheck, Settings, X, Save 
} from 'lucide-react';

interface Template {
  id: number;
  name: string;
  type: 'OfferLetter' | 'Certificate' | 'IDCard' | 'Transcript' | 'CharacterCertificate' | 'Custom';
  html_content: string;
  css_content?: string;
  qr_enabled: boolean;
  signature_enabled: boolean;
  signature_title: string;
}

interface Student {
  id: number;
  student_id_number: string;
  user?: { name: string };
  program?: { name: string };
}

const DocumentGenerator: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedStudentId, setSelectedStudentId] = useState<number>(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(0);

  // Generated results
  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  const [generatedCss, setGeneratedCss] = useState<string>('');
  const [docNumber, setDocNumber] = useState<string>('');
  const [verToken, setVerToken] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  // Template editor modal state
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editorForm, setEditorForm] = useState({
    name: '',
    type: 'Custom' as any,
    html_content: '',
    css_content: '',
    qr_enabled: true,
    signature_enabled: true,
    signature_title: 'Registrar'
  });
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [tplRes, stdRes] = await Promise.all([
        api.get('/document/templates'),
        api.get('/admin/students')
      ]);
      const tpls = tplRes.data.data ?? [];
      setTemplates(tpls);
      if (tpls.length > 0) setSelectedTemplateId(tpls[0].id);

      const stds = stdRes.data.data?.data ?? stdRes.data.data ?? [];
      setStudents(stds);
      if (stds.length > 0) setSelectedStudentId(stds[0].id);
    } catch {
      toast.error('Failed to load templates or student records.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (selectedStudentId === 0 || selectedTemplateId === 0) {
      toast.error('Please select both a student and a template.');
      return;
    }

    setGenerating(true);
    const toastId = toast.loading('Compiling placeholders & generating document...');
    try {
      const res = await api.post('/document/generate', {
        student_id: selectedStudentId,
        document_template_id: selectedTemplateId
      });
      const d = res.data.data;
      setGeneratedHtml(d.html);
      setGeneratedCss(d.css ?? '');
      setDocNumber(d.document_number);
      setVerToken(d.verification_token);
      toast.success('Document compiled successfully!', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Compilation failed.', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!generatedHtml) return;
    const toastId = toast.loading('Exporting to DomPDF renderer...');
    try {
      const res = await api.post('/document/download-pdf', {
        html: generatedHtml,
        css: generatedCss
      }, { responseType: 'blob' });

      // Save blob file
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${docNumber || 'document'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF generated successfully!', { id: toastId });
    } catch {
      toast.error('Failed to export PDF file.', { id: toastId });
    }
  };

  const openEditor = (tpl: Template | null = null) => {
    if (tpl) {
      setEditingTemplate(tpl);
      setEditorForm({
        name: tpl.name,
        type: tpl.type,
        html_content: tpl.html_content,
        css_content: tpl.css_content || '',
        qr_enabled: tpl.qr_enabled,
        signature_enabled: tpl.signature_enabled,
        signature_title: tpl.signature_title
      });
    } else {
      setEditingTemplate(null);
      setEditorForm({
        name: '',
        type: 'Custom',
        html_content: '<div><h1>Custom Template</h1><p>Student: {{STUDENT_NAME}}</p>{{QR_CODE}}</div>',
        css_content: 'body { font-family: sans-serif; }',
        qr_enabled: true,
        signature_enabled: true,
        signature_title: 'Registrar'
      });
    }
    setShowEditorModal(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTemplate(true);
    const toastId = toast.loading(editingTemplate ? 'Updating template...' : 'Creating template...');
    try {
      if (editingTemplate) {
        await api.post(`/document/templates/${editingTemplate.id}/update`, editorForm);
        toast.success('Template updated!', { id: toastId });
      } else {
        await api.post('/document/templates', editorForm);
        toast.success('New template created!', { id: toastId });
      }
      setShowEditorModal(false);
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to save template.', { id: toastId });
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Registrar Desk</span>
          <span className="badge badge-role">Official Document Generator</span>
        </div>
      </nav>

      <main className="dashboard-content" style={{ display: 'grid', gridTemplateColumns: '3fr 4fr', gap: '20px', alignItems: 'stretch' }}>
        
        {/* Left Column: Form Selector & Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Generation form */}
          <div className="dashboard-card" style={{ padding: '20px' }}>
            <h3 style={{ color: 'white', margin: '0 0 14px', fontSize: '15px' }}>Document Generation Config</h3>
            
            {loading ? (
              <div className="spinner-center" style={{ minHeight: '100px' }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="input-group">
                  <label>Select Target Student</label>
                  <select value={selectedStudentId} onChange={e => setSelectedStudentId(parseInt(e.target.value))}>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.user?.name} ({s.student_id_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Select Template Layout</label>
                  <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(parseInt(e.target.value))}>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button onClick={handleGenerate} className="btn btn-primary" style={{ flex: 1 }} disabled={generating}>
                    <RefreshCw size={13} style={{ marginRight: '6px' }} /> Compiled Render
                  </button>
                  <button onClick={() => openEditor(null)} className="btn btn-outline flex-center" title="Create Custom Layout">
                    <Plus size={14} /> Template
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Templates inventory */}
          <div className="dashboard-card" style={{ padding: '20px', flex: 1 }}>
            <h3 style={{ color: 'white', margin: '0 0 14px', fontSize: '15px' }}>Custom Layout Templates</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {templates.map(tpl => (
                <div key={tpl.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{tpl.name}</div>
                    <div className="card-desc" style={{ fontSize: '11px', marginTop: '1px' }}>Type: {tpl.type}</div>
                  </div>
                  <button onClick={() => openEditor(tpl)} className="btn btn-outline btn-sm flex-center" style={{ padding: '4px 8px', gap: '4px' }}>
                    <Settings size={11} /> Modify
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Compiled HTML Sandbox & PDF Download */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="dashboard-card" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: '15px' }}>Document Preview (Compiled output)</h3>
              {generatedHtml && (
                <button onClick={handleDownloadPdf} className="btn btn-primary btn-sm flex-center" style={{ gap: '6px' }}>
                  <Download size={13} /> Export PDF
                </button>
              )}
            </div>

            {/* Render Sandbox Frame */}
            <div style={{ flex: 1, minHeight: '440px', background: '#fff', border: '1px solid var(--border-glass)', borderRadius: '10px', overflowY: 'auto' }}>
              {generatedHtml ? (
                <>
                  <style>{generatedCss}</style>
                  <div dangerouslySetInnerHTML={{ __html: generatedHtml }} />
                  
                  {/* Verified badge */}
                  <div style={{ padding: '15px 40px', borderTop: '1px dashed #e2e8f0', background: '#f7fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'sans-serif' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f766e', fontSize: '12px', fontWeight: 600 }}>
                      <ShieldCheck size={16} /> Authentic Registrar Document
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Token: <strong style={{ color: '#0f766e' }}>{verToken.slice(0, 8)}...</strong>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '160px 20px', color: '#64748b', fontSize: '12px', fontFamily: 'sans-serif' }}>
                  <FileText size={32} style={{ display: 'block', margin: '0 auto 12px', color: '#cbd5e1' }} />
                  No document generated. Select a student and layout, then click "Compiled Render".
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Template Editor Modal ───────────────────────────────────────── */}
      {showEditorModal && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="auth-card" style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="auth-header">
              <h2>{editingTemplate ? 'Modify Document Template' : 'Create Custom Layout Template'}</h2>
              <p>Supports placeholders: <code>{"{{STUDENT_NAME}}"}</code>, <code>{"{{STUDENT_ID}}"}</code>, <code>{"{{PROGRAM_NAME}}"}</code>, <code>{"{{DATE}}"}</code>, <code>{"{{QR_CODE}}"}</code>, <code>{"{{DOC_NUMBER}}"}</code></p>
            </div>
            <form onSubmit={handleSaveTemplate} className="auth-form">
              <div className="grid-2">
                <div className="input-group">
                  <label>Template Name</label>
                  <input type="text" value={editorForm.name} onChange={e => setEditorForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label>Document Category / Type</label>
                  <select value={editorForm.type} onChange={e => setEditorForm(f => ({ ...f, type: e.target.value }))} required>
                    <option value="OfferLetter">Offer Letter</option>
                    <option value="Certificate">Certificate of completion</option>
                    <option value="IDCard">Student ID Card</option>
                    <option value="Transcript">Official Transcript</option>
                    <option value="CharacterCertificate">Character Certificate</option>
                    <option value="Custom">Custom Template</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Signature Block Label</label>
                  <input type="text" placeholder="e.g. Registrar" value={editorForm.signature_title} onChange={e => setEditorForm(f => ({ ...f, signature_title: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '22px' }}>
                  <label style={{ display: 'flex', gap: '8px', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editorForm.qr_enabled} onChange={e => setEditorForm(f => ({ ...f, qr_enabled: e.target.checked }))} />
                    Enable QR Verification
                  </label>
                  <label style={{ display: 'flex', gap: '8px', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editorForm.signature_enabled} onChange={e => setEditorForm(f => ({ ...f, signature_enabled: e.target.checked }))} />
                    Enable Seal Signature
                  </label>
                </div>
              </div>

              <div className="input-group">
                <label>HTML Blueprint</label>
                <textarea 
                  rows={8}
                  style={{ width: '100%', fontFamily: 'monospace', background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-glass)', padding: '10px', borderRadius: '8px', color: '#22c55e', fontSize: '12px' }}
                  value={editorForm.html_content}
                  onChange={e => setEditorForm(f => ({ ...f, html_content: e.target.value }))}
                  required
                />
              </div>

              <div className="input-group">
                <label>CSS Rules (optional)</label>
                <textarea 
                  rows={4}
                  style={{ width: '100%', fontFamily: 'monospace', background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-glass)', padding: '10px', borderRadius: '8px', color: '#38bdf8', fontSize: '12px' }}
                  value={editorForm.css_content}
                  onChange={e => setEditorForm(f => ({ ...f, css_content: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={savingTemplate}>
                  <Save size={13} style={{ marginRight: '6px' }} /> Save Layout Template
                </button>
                <button type="button" onClick={() => setShowEditorModal(false)} className="btn btn-outline" disabled={savingTemplate}><X size={14} /></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentGenerator;
