
import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import {
  Info, Mail, Calendar, Shield, HardDrive, Globe, Database,
  Download, Plus, Save, BookOpen, Upload,
  Image, Megaphone, ChevronRight,
  CheckCircle, AlertTriangle, Clock, User, Eye, EyeOff,
  ToggleLeft, ToggleRight, Server, Key, Layers, Edit3, X,
  RefreshCw, Lock
} from 'lucide-react';

interface AcademicYear { id: number; name: string; is_active: boolean; start_date?: string; end_date?: string; }
interface BackupRecord { id: number; file_name: string; file_size_bytes: number; backup_status_id: number; initiated_by_user_id: number; created_at: string; initiator?: { name: string; email: string }; }
interface SlideItem { title: string; description: string; image: string; cta: string; link: string; }
interface ValueItem { title: string; desc: string; }
interface CmsAbout { intro_title: string; intro_desc: string; values: ValueItem[]; }
interface CmsFaq { category: string; question: string; answer: string; }
interface CmsGallery { image: string; caption: string; }
interface CmsNews { id: number; title: string; content: string; date: string; }
type TabId = 'college' | 'smtp' | 'academic' | 'otp' | 'storage' | 'cms' | 'backup';

const TABS: { id: TabId; label: string; icon: React.FC<any>; desc: string }[] = [
  { id: 'college', label: 'College Info', icon: Info, desc: 'Identity & branding' },
  { id: 'smtp', label: 'SMTP Gateway', icon: Mail, desc: 'Email configuration' },
  { id: 'academic', label: 'Academic Year', icon: Calendar, desc: 'Semester & admissions' },
  { id: 'otp', label: 'Security & OTP', icon: Shield, desc: 'Auth policies' },
  { id: 'storage', label: 'Storage & PDF', icon: HardDrive, desc: 'Files & templates' },
  { id: 'cms', label: 'Public Web CMS', icon: Globe, desc: 'Website content' },
  { id: 'backup', label: 'DB Backups', icon: Database, desc: 'Backup & restore' },
];

/* ─── reusable primitives ─────────────────────────────────── */

const iStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(15,23,42,0.7)', border: '1.5px solid rgba(99,102,241,0.2)',
  borderRadius: '10px', color: 'var(--text-primary)', padding: '11px 14px', fontSize: '14px', outline: 'none',
};

const FLabel: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <div style={{ marginBottom: 6 }}>
    <label style={{ fontSize: '13px', fontWeight: 600, color: '#c7d2fe', letterSpacing: '0.02em' }}>{children}</label>
    {hint && <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>{hint}</p>}
  </div>
);

const IField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }> = ({ label, hint, ...p }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
    {label && <FLabel hint={hint}>{label}</FLabel>}
    <input {...p} style={{ ...iStyle, ...p.style }}
      onFocus={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
    />
  </div>
);

const SField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; hint?: string }> = ({ label, hint, children, ...p }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
    {label && <FLabel hint={hint}>{label}</FLabel>}
    <select {...p} style={{ ...iStyle, cursor: 'pointer', ...p.style }}>{children}</select>
  </div>
);

const TField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }> = ({ label, hint, ...p }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
    {label && <FLabel hint={hint}>{label}</FLabel>}
    <textarea {...p} style={{ ...iStyle, resize: 'vertical', ...p.style }}
      onFocus={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
    />
  </div>
);

const SecHead: React.FC<{ icon: React.FC<any>; title: string; desc?: string; action?: React.ReactNode }> = ({ icon: Icon, title, desc, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
    <div style={{ display: 'flex', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,rgba(99,102,241,.25),rgba(168,85,247,.15))', border: '1px solid rgba(99,102,241,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} style={{ color: '#818cf8' }} />
      </div>
      <div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
        {desc && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>{desc}</p>}
      </div>
    </div>
    {action}
  </div>
);

const Hr: React.FC<{ label?: string }> = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
    {label && <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{label}</span>}
    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.07)' }} />
  </div>
);

const CmsSection: React.FC<{ icon: React.FC<any>; title: string; count?: number; onAdd: () => void; addLabel: string; children: React.ReactNode }> = ({ icon: Icon, title, count, onAdd, addLabel, children }) => (
  <div style={{ background: 'rgba(255,255,255,.025)', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(99,102,241,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon size={16} style={{ color: '#818cf8' }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{title}</span>
        {count !== undefined && <span style={{ background: 'rgba(99,102,241,.2)', color: '#a5b4fc', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{count}</span>}
      </div>
      <button type="button" onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.3)', borderRadius: 8, color: '#a5b4fc', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
        <Plus size={12} />{addLabel}
      </button>
    </div>
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
  </div>
);

const ItemCard: React.FC<{ index: number; label: string; onRemove: () => void; children: React.ReactNode; ac?: string }> = ({ index, label, onRemove, children, ac = '#818cf8' }) => (
  <div style={{ background: 'rgba(15,23,42,.5)', borderRadius: 10, border: '1px solid rgba(255,255,255,.06)', overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,.04)', background: 'rgba(255,255,255,.02)' }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: ac }}>#{index + 1} — {label}</span>
      <button type="button" onClick={onRemove} style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 6, color: '#f87171', cursor: 'pointer', padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
        <X size={11} />Remove
      </button>
    </div>
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
  </div>
);

const card: React.CSSProperties = { background: 'var(--bg-card)', backdropFilter: 'blur(20px)', borderRadius: 16, border: '1px solid var(--border-glass)', padding: 28 };
const g2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
const g3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 };

/* ─── component ───────────────────────────────────────────── */

const SystemSettings: React.FC = () => {
  const [tab, setTab] = useState<TabId>('college');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [s, setS] = useState<Record<string, any>>({});
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [activeYear, setActiveYear] = useState('');
  const [ayStart, setAyStart] = useState('');
  const [ayEnd, setAyEnd] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/settings');
      setS(r.data.settings || {});
      setYears(r.data.academic_years || []);
      setBackups(r.data.backups || []);
      const ay = (r.data.academic_years || []).find((y: AcademicYear) => y.is_active);
      if (ay) {
        setActiveYear(ay.id.toString());
        setAyStart(ay.start_date ? ay.start_date.substring(0, 10) : '');
        setAyEnd(ay.end_date ? ay.end_date.substring(0, 10) : '');
      }
    } catch { toast.error('Failed to load settings.'); }
    finally { setLoading(false); }
  };

  const upd = (k: string, v: any) => setS(p => ({ ...p, [k]: v }));

  const updAbout = (f: string, v: any) => {
    const cur = (s.cms_about_content as CmsAbout) || { intro_title: '', intro_desc: '', values: [] };
    upd('cms_about_content', { ...cur, [f]: v });
  };
  const updAboutVal = (i: number, f: keyof ValueItem, v: string) => {
    const cur = (s.cms_about_content as CmsAbout) || { intro_title: '', intro_desc: '', values: [] };
    const vals = [...cur.values];
    if (vals[i]) { vals[i] = { ...vals[i], [f]: v }; updAbout('values', vals); }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const tid = toast.loading('Saving...');
    try {
      await api.post('/admin/settings', {
        settings: s,
        active_academic_year_id: activeYear ? parseInt(activeYear) : null,
        academic_year_start_date: ayStart || null,
        academic_year_end_date: ayEnd || null,
      });
      toast.success('Settings saved!', { id: tid });
      window.dispatchEvent(new Event('branding-updated'));
      load();
    } catch { toast.error('Save failed.', { id: tid }); }
    finally { setSaving(false); }
  };

  const onLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const fd = new FormData(); fd.append('logo', f);
    setLogoLoading(true); const tid = toast.loading('Uploading...');
    try {
      const r = await api.post('/admin/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      upd('college_logo', r.data.logo_url);
      toast.success('Logo updated!', { id: tid });
      window.dispatchEvent(new Event('branding-updated'));
    } catch { toast.error('Upload failed. Max 4MB.', { id: tid }); }
    finally { setLogoLoading(false); }
  };

  const triggerBackup = async () => {
    setBackupBusy(true); const tid = toast.loading('Creating backup...');
    try {
      const r = await api.post('/admin/settings/backup');
      setBackups(p => [r.data.backup, ...p]); toast.success('Backup created!', { id: tid });
    } catch { toast.error('Backup failed.', { id: tid }); }
    finally { setBackupBusy(false); }
  };

  const dlBackup = (id: number, name: string) => {
    const token = localStorage.getItem('token');
    const url = `${api.defaults.baseURL}/admin/settings/backup/${id}/download?token=${token}`;
    const a = document.createElement('a'); a.href = url; a.setAttribute('download', name);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success(`Downloading ${name}`);
  };

  const restoreBackup = async (id: number) => {
    if (!window.confirm('WARNING: This will overwrite current config keys. Proceed?')) return;
    const tid = toast.loading('Restoring...');
    try {
      const r = await api.post(`/admin/settings/backup/${id}/restore`);
      toast.success(r.data.message || 'Restored!', { id: tid }); load();
    } catch { toast.error('Restore failed.', { id: tid }); }
  };

  // CMS helpers
  const slides: SlideItem[] = s.cms_home_hero || [];
  const addSlide = () => upd('cms_home_hero', [...slides, { title: 'New Slide', description: 'Description.', image: '/assets/college_campus.png', cta: 'Explore', link: '/about' }]);
  const rmSlide = (i: number) => upd('cms_home_hero', slides.filter((_, j) => j !== i));
  const udSlide = (i: number, f: keyof SlideItem, v: string) => { const a = [...slides]; if (a[i]) { a[i] = { ...a[i], [f]: v }; upd('cms_home_hero', a); } };

  const faqs: CmsFaq[] = s.cms_faq_list || [];
  const addFaq = () => upd('cms_faq_list', [...faqs, { category: 'general', question: 'New FAQ?', answer: 'Answer here.' }]);
  const rmFaq = (i: number) => upd('cms_faq_list', faqs.filter((_, j) => j !== i));
  const udFaq = (i: number, f: keyof CmsFaq, v: string) => { const a = [...faqs]; if (a[i]) { a[i] = { ...a[i], [f]: v }; upd('cms_faq_list', a); } };

  const gallery: CmsGallery[] = s.cms_gallery_images || [];
  const addGallery = () => upd('cms_gallery_images', [...gallery, { image: '/assets/college_campus.png', caption: 'Campus view' }]);
  const rmGallery = (i: number) => upd('cms_gallery_images', gallery.filter((_, j) => j !== i));
  const udGallery = (i: number, f: keyof CmsGallery, v: string) => { const a = [...gallery]; if (a[i]) { a[i] = { ...a[i], [f]: v }; upd('cms_gallery_images', a); } };

  const news: CmsNews[] = s.cms_news_bulletins || [];
  const addNews = () => {
    const nid = news.reduce((m, x) => x.id > m ? x.id : m, 0) + 1;
    upd('cms_news_bulletins', [{ id: nid, title: 'New Announcement', content: 'Details.', date: new Date().toISOString().split('T')[0] }, ...news]);
  };
  const rmNews = (i: number) => upd('cms_news_bulletins', news.filter((_, j) => j !== i));
  const udNews = (i: number, f: keyof CmsNews, v: string) => { const a = [...news]; if (a[i]) { a[i] = { ...a[i], [f]: v }; upd('cms_news_bulletins', a); } };

  const statusBadge = (sid: number) => {
    if (sid === 1) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'rgba(16,185,129,.15)', color: '#34d399', fontSize: 11, fontWeight: 700 }}><CheckCircle size={11} />Success</span>;
    if (sid === 2) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'rgba(239,68,68,.15)', color: '#f87171', fontSize: 11, fontWeight: 700 }}><AlertTriangle size={11} />Failed</span>;
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'rgba(245,158,11,.15)', color: '#fbbf24', fontSize: 11, fontWeight: 700 }}><Clock size={11} />Running</span>;
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid rgba(99,102,241,.2)', borderTopColor: '#6366f1', animation: 'spin .8s linear infinite' }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading system configurations...</p>
    </div>
  );

  return (
    <div className="dashboard-content-container" style={{ paddingBottom: 40 }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,.12),rgba(168,85,247,.08))', borderRadius: 16, border: '1px solid rgba(99,102,241,.2)', padding: '28px 32px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,.15),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Server size={20} style={{ color: 'white' }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>System Settings</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Configure college identity, SMTP, security policies, CMS content, and database management</p>
          </div>
          <div style={{ padding: '8px 16px', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#34d399', flexShrink: 0 }}>
            <CheckCircle size={13} /> System Online
          </div>
        </div>
      </div>

      {/* ── Layout ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '256px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Sidebar nav */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', borderRadius: 16, border: '1px solid var(--border-glass)', padding: 8 }}>
            {TABS.map(t => {
              const active = tab === t.id;
              return (
                <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2, background: active ? 'linear-gradient(135deg,rgba(99,102,241,.25),rgba(168,85,247,.15))' : 'transparent', boxShadow: active ? 'inset 0 0 0 1px rgba(99,102,241,.35)' : 'none', transition: 'all .2s' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(99,102,241,.3)' : 'rgba(255,255,255,.05)', transition: 'all .2s' }}>
                    <t.icon size={15} style={{ color: active ? '#818cf8' : 'var(--text-secondary)' }} />
                  </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: active ? 'var(--text-primary)' : 'rgba(148,163,184,.6)', opacity: active ? 0.8 : 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
                    </div>
                  {active && <ChevronRight size={14} style={{ color: '#818cf8', flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {/* Quick stats */}
          <div style={{ marginTop: 16, background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-glass)', padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 12 }}>Quick Overview</p>
            {[
              { label: 'Academic Years', val: years.length },
              { label: 'DB Backups', val: backups.length },
              { label: 'Hero Slides', val: slides.length },
              { label: 'FAQ Items', val: faqs.length },
            ].map(stat => (
              <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{stat.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc' }}>{stat.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form panel */}
        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* COLLEGE INFO */}
          {tab === 'college' && (
            <div style={card}>
              <SecHead icon={Info} title="College Identity & Branding" desc="Core information displayed on documents, certificates, and the public website" />
              <div style={{ background: 'rgba(99,102,241,.06)', border: '1.5px dashed rgba(99,102,241,.3)', borderRadius: 14, padding: 24, display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28 }}>
                <div style={{ width: 96, height: 96, borderRadius: 16, background: 'rgba(15,23,42,.8)', border: '1px solid rgba(99,102,241,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {s.college_logo ? <img src={s.college_logo.startsWith('http') ? s.college_logo : `http://localhost:8000${s.college_logo}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <BookOpen size={36} style={{ color: 'rgba(99,102,241,.5)' }} />}
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Institution Logo</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>PNG, JPG, WebP — Max 4 MB — Recommended 512x512 px</p>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: logoLoading ? 'rgba(99,102,241,.15)' : 'linear-gradient(135deg,rgba(99,102,241,.3),rgba(139,92,246,.25))', border: '1px solid rgba(99,102,241,.4)', borderRadius: 9, color: '#a5b4fc', fontSize: 13, fontWeight: 600, cursor: logoLoading ? 'not-allowed' : 'pointer' }}>
                    <Upload size={14} />{logoLoading ? 'Uploading...' : 'Upload New Logo'}
                    <input type="file" accept="image/*" onChange={onLogoUpload} disabled={logoLoading} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
              <div style={{ ...g2, marginBottom: 16 }}>
                <IField label="College Full Name" value={s.college_name || ''} onChange={e => upd('college_name', e.target.value)} required />
                <IField label="Abbreviation" value={s.college_abbreviation || ''} onChange={e => upd('college_abbreviation', e.target.value)} placeholder="e.g. ACSS" required />
              </div>
              <div style={{ ...g2, marginBottom: 16 }}>
                <IField label="Admin Email" type="email" value={s.college_email || ''} onChange={e => upd('college_email', e.target.value)} required />
                <IField label="Phone Number" type="tel" value={s.college_phone || ''} onChange={e => upd('college_phone', e.target.value)} required />
              </div>
              <IField label="Campus Address" value={s.college_address || ''} onChange={e => upd('college_address', e.target.value)} placeholder="Building, Street, City, Country" required />
            </div>
          )}

          {/* SMTP */}
          {tab === 'smtp' && (
            <div style={card}>
              <SecHead icon={Mail} title="SMTP Outgoing Mail Gateway" desc="Configure email transport for OTP delivery, notifications, and bulk emails" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 10, marginBottom: 24 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 3px rgba(16,185,129,.2)' }} />
                <span style={{ fontSize: 13, color: '#34d399', fontWeight: 600 }}>SMTP Host: {s.smtp_host || 'Not configured'}</span>
              </div>
              <Hr label="Server Connection" />
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
                <IField label="SMTP Host" value={s.smtp_host || ''} onChange={e => upd('smtp_host', e.target.value)} placeholder="smtp.gmail.com" required />
                <IField label="Port" type="number" value={s.smtp_port || ''} onChange={e => upd('smtp_port', e.target.value)} placeholder="587" required />
              </div>
              <Hr label="Authentication" />
              <div style={{ ...g2, marginBottom: 16 }}>
                <IField label="Username" value={s.smtp_username || ''} onChange={e => upd('smtp_username', e.target.value)} placeholder="your@email.com" required />
                <div>
                  <FLabel>Password</FLabel>
                  <div style={{ position: 'relative' }}>
                    <input type={showPwd ? 'text' : 'password'} value={s.smtp_password || ''} onChange={e => upd('smtp_password', e.target.value)} placeholder="Password" style={{ ...iStyle, paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4, display: 'flex' }}>
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
              <Hr label="Sender Identity" />
              <div style={g3}>
                <SField label="Encryption" value={s.smtp_encryption || ''} onChange={e => upd('smtp_encryption', e.target.value)}>
                  <option value="none">None</option><option value="ssl">SSL</option><option value="tls">TLS</option>
                </SField>
                <IField label="From Name" value={s.smtp_from_name || ''} onChange={e => upd('smtp_from_name', e.target.value)} placeholder="Arabic College" required />
                <IField label="From Address" type="email" value={s.smtp_from_address || ''} onChange={e => upd('smtp_from_address', e.target.value)} placeholder="noreply@college.edu" required />
              </div>
            </div>
          )}

          {/* ACADEMIC YEAR */}
          {tab === 'academic' && (
            <div style={card}>
              <SecHead icon={Calendar} title="Academic Year & Admissions Gate" desc="Select the active semester and control public registration access" />
              <Hr label="Active Year & Calendar Setup" />
              <SField label="Active Academic Year" value={activeYear} onChange={e => {
                const targetId = e.target.value;
                setActiveYear(targetId);
                const yr = years.find(y => y.id.toString() === targetId);
                if (yr) {
                  setAyStart(yr.start_date ? yr.start_date.substring(0, 10) : '');
                  setAyEnd(yr.end_date ? yr.end_date.substring(0, 10) : '');
                }
              }} required>
                <option value="">Select Active Year</option>
                {years.map(yr => (
                  <option key={yr.id} value={yr.id.toString()}>{yr.name} {yr.is_active ? '(Active)' : ''}</option>
                ))}
              </SField>
              <div style={{ ...g2, marginTop: 16, marginBottom: 20 }}>
                <IField label="Manual Calendar Start Date" type="date" value={ayStart} onChange={e => setAyStart(e.target.value)} required />
                <IField label="Manual Calendar End Date" type="date" value={ayEnd} onChange={e => setAyEnd(e.target.value)} required />
              </div>
              <Hr label="Admissions Gate" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: s.admission_status === 'open' ? 'rgba(16,185,129,.07)' : 'rgba(239,68,68,.07)', border: s.admission_status === 'open' ? '1px solid rgba(16,185,129,.25)' : '1px solid rgba(239,68,68,.2)', borderRadius: 12 }}>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Public Application Portal</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Toggle to open or close public admissions intake</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.admission_status === 'open' ? '#34d399' : '#f87171' }}>{s.admission_status === 'open' ? 'OPEN' : 'CLOSED'}</span>
                  <button type="button" onClick={() => upd('admission_status', s.admission_status === 'open' ? 'closed' : 'open')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: s.admission_status === 'open' ? '#10b981' : '#94a3b8' }}>
                    {s.admission_status === 'open' ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY & OTP */}
          {tab === 'otp' && (
            <div style={card}>
              <SecHead icon={Shield} title="Security & Verification Policies" desc="Configure OTP expiry rules and password security standards" />
              <Hr label="OTP Configuration" />
              <div style={{ ...g3, marginBottom: 24 }}>
                <IField label="Expiry (seconds)" hint="How long before OTP expires" type="number" value={s.otp_expiry_seconds || ''} onChange={e => upd('otp_expiry_seconds', parseInt(e.target.value))} required />
                <IField label="OTP Length (digits)" hint="Typically 6 digits" type="number" min={4} max={8} value={s.otp_digits || ''} onChange={e => upd('otp_digits', parseInt(e.target.value))} required />
                <SField label="Enforce OTP" hint="Require OTP on every login" value={s.otp_mandatory ? '1' : '0'} onChange={e => upd('otp_mandatory', e.target.value === '1')}>
                  <option value="0">Optional</option><option value="1">Strictly Required</option>
                </SField>
              </div>
              <Hr label="Password Policy" />
              <div style={{ ...g2, marginBottom: 16 }}>
                <IField label="Minimum Length" hint="Min characters required" type="number" min={6} value={s.password_min_length || ''} onChange={e => upd('password_min_length', parseInt(e.target.value))} required />
                <SField label="Require Symbols" hint="Enforce @, #, ! etc." value={s.password_require_symbols ? '1' : '0'} onChange={e => upd('password_require_symbols', e.target.value === '1')}>
                  <option value="0">Disabled</option><option value="1">Enabled</option>
                </SField>
              </div>
              <Hr label="Session Management" />
              <div style={g2}>
                <IField label="Max Failed Attempts" hint="Lockout threshold" type="number" value={s.login_max_attempts || ''} onChange={e => upd('login_max_attempts', parseInt(e.target.value))} required />
                <IField label="Session Lifetime (min)" hint="Idle timeout for portal users" type="number" value={s.session_lifetime_minutes || ''} onChange={e => upd('session_lifetime_minutes', parseInt(e.target.value))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 24 }}>
                {[
                  { label: 'OTP Expiry', val: (s.otp_expiry_seconds || '—') + 's', icon: Clock, color: '#818cf8' },
                  { label: 'OTP Length', val: (s.otp_digits || '—') + ' digits', icon: Key, color: '#a78bfa' },
                  { label: 'Min Password', val: (s.password_min_length || '—') + ' chars', icon: Lock, color: '#c084fc' },
                  { label: 'Session', val: (s.session_lifetime_minutes || '—') + 'm', icon: User, color: '#e879f9' },
                ].map(c => (
                  <div key={c.label} style={{ padding: 16, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, textAlign: 'center' }}>
                    <c.icon size={20} style={{ color: c.color, marginBottom: 8 }} />
                    <div style={{ fontSize: 16, fontWeight: 800, color: c.color, marginBottom: 4 }}>{c.val}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STORAGE & PDF */}
          {tab === 'storage' && (
            <div style={card}>
              <SecHead icon={HardDrive} title="File Storage & PDF Templates" desc="Configure upload limits, storage backend, and certificate document layout" />
              <Hr label="Storage Configuration" />
              <div style={{ ...g2, marginBottom: 16 }}>
                <SField label="Storage Backend" hint="Where uploaded files are stored" value={s.file_storage_driver || 'local'} onChange={e => upd('file_storage_driver', e.target.value)}>
                  <option value="local">Local Server Disk</option>
                  <option value="s3">Amazon S3 Cloud</option>
                </SField>
                <IField label="Max Upload Size (MB)" hint="Maximum per-file upload size" type="number" value={s.max_upload_size_mb || ''} onChange={e => upd('max_upload_size_mb', parseInt(e.target.value))} required />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 10, marginBottom: 24 }}>
                <HardDrive size={16} style={{ color: '#818cf8' }} />
                <span style={{ fontSize: 13, color: '#a5b4fc' }}>Active: <strong>{s.file_storage_driver === 's3' ? 'Amazon S3' : 'Local Disk'}</strong> — Max: <strong>{s.max_upload_size_mb || 10} MB</strong></span>
              </div>
              <Hr label="PDF Certificate Templates" />
              <TField label="PDF Header HTML" hint="HTML injected at top of all certificates, transcripts, and invoices" rows={5} value={s.pdf_header_template || ''} onChange={e => upd('pdf_header_template', e.target.value)} style={{ fontFamily: 'monospace', fontSize: 13 }} />
              <div style={{ marginTop: 16 }}>
                <TField label="PDF Footer HTML" hint="HTML injected at the bottom of generated PDFs" rows={5} value={s.pdf_footer_template || ''} onChange={e => upd('pdf_footer_template', e.target.value)} style={{ fontFamily: 'monospace', fontSize: 13 }} />
              </div>
              <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(245,158,11,.07)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 10, display: 'flex', gap: 10 }}>
                <AlertTriangle size={14} style={{ color: '#f59e0b', marginTop: 2, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#fbbf24', margin: 0, lineHeight: 1.5 }}>PDF templates accept inline HTML and CSS only. Avoid external scripts. The college logo is auto-inserted if set in College Info.</p>
              </div>
            </div>
          )}

          {/* PUBLIC CMS */}
          {tab === 'cms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <CmsSection icon={Layers} title="Home Hero Slides" count={slides.length} onAdd={addSlide} addLabel="Add Slide">
                {slides.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)', fontSize: 13 }}>No slides configured. Click Add Slide to create one.</div>}
                {slides.map((sl, i) => (
                  <ItemCard key={i} index={i} label={sl.title || 'Slide'} onRemove={() => rmSlide(i)}>
                    <div style={g2}>
                      <IField label="Title" value={sl.title} onChange={e => udSlide(i, 'title', e.target.value)} />
                      <IField label="Background Image URL" value={sl.image} onChange={e => udSlide(i, 'image', e.target.value)} placeholder="/assets/hero.png" />
                    </div>
                    <IField label="Description" value={sl.description} onChange={e => udSlide(i, 'description', e.target.value)} />
                    <div style={g2}>
                      <IField label="CTA Label" value={sl.cta} onChange={e => udSlide(i, 'cta', e.target.value)} placeholder="Explore More" />
                      <IField label="CTA Link" value={sl.link} onChange={e => udSlide(i, 'link', e.target.value)} placeholder="/about" />
                    </div>
                  </ItemCard>
                ))}
              </CmsSection>

              <div style={{ background: 'rgba(255,255,255,.025)', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(99,102,241,.06)' }}>
                  <Edit3 size={16} style={{ color: '#818cf8' }} /><span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>About Page Content</span>
                </div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <IField label="Intro Title" value={((s.cms_about_content as CmsAbout)?.intro_title) || ''} onChange={e => updAbout('intro_title', e.target.value)} />
                  <TField label="Intro Description" rows={3} value={((s.cms_about_content as CmsAbout)?.intro_desc) || ''} onChange={e => updAbout('intro_desc', e.target.value)} />
                  <Hr label="Core Values" />
                  {(((s.cms_about_content as CmsAbout)?.values) || []).map((v, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                      <IField label={i === 0 ? 'Value Title' : undefined} value={v.title} onChange={e => updAboutVal(i, 'title', e.target.value)} placeholder="Value name" />
                      <IField label={i === 0 ? 'Description' : undefined} value={v.desc} onChange={e => updAboutVal(i, 'desc', e.target.value)} placeholder="Short description" />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,.025)', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(99,102,241,.06)' }}>
                  <Edit3 size={16} style={{ color: '#818cf8' }} /><span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Contact Page Information</span>
                </div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={g2}>
                    <IField label="Public Phone Number" value={s.college_phone || ''} onChange={e => upd('college_phone', e.target.value)} required />
                    <IField label="Public Email Address" value={s.college_email || ''} onChange={e => upd('college_email', e.target.value)} required />
                  </div>
                  <IField label="Public Campus Address" value={s.college_address || ''} onChange={e => upd('college_address', e.target.value)} required />
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,.025)', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(99,102,241,.06)' }}>
                  <Globe size={16} style={{ color: '#818cf8' }} /><span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Header & Footer Global Branding</span>
                </div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={g2}>
                    <IField label="Header Brand Abbreviation" value={s.college_abbreviation || ''} onChange={e => upd('college_abbreviation', e.target.value)} required />
                    <IField label="System Brand Name" value={s.college_name || ''} onChange={e => upd('college_name', e.target.value)} required />
                  </div>
                  <TField label="Footer Description" rows={2} value={s.cms_footer_desc || ''} onChange={e => upd('cms_footer_desc', e.target.value)} placeholder="Short institution summary printed in the public website footer." />
                </div>
              </div>

              <CmsSection icon={Layers} title="FAQ Items" count={faqs.length} onAdd={addFaq} addLabel="Add FAQ">
                {faqs.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)', fontSize: 13 }}>No FAQ items yet.</div>}
                {faqs.map((f, i) => (
                  <ItemCard key={i} index={i} label={f.question || 'FAQ'} onRemove={() => rmFaq(i)} ac="#a78bfa">
                    <SField label="Category" value={f.category} onChange={e => udFaq(i, 'category', e.target.value)}>
                      <option value="general">General</option><option value="admissions">Admissions</option><option value="academics">Academics</option>
                    </SField>
                    <IField label="Question" value={f.question} onChange={e => udFaq(i, 'question', e.target.value)} />
                    <TField label="Answer" rows={3} value={f.answer} onChange={e => udFaq(i, 'answer', e.target.value)} />
                  </ItemCard>
                ))}
              </CmsSection>

              <CmsSection icon={Image} title="Campus Gallery" count={gallery.length} onAdd={addGallery} addLabel="Add Photo">
                {gallery.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)', fontSize: 13 }}>No gallery photos yet.</div>}
                {gallery.map((g, i) => (
                  <ItemCard key={i} index={i} label={g.caption || 'Photo'} onRemove={() => rmGallery(i)} ac="#c084fc">
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                      <IField label="Image URL" value={g.image} onChange={e => udGallery(i, 'image', e.target.value)} placeholder="/assets/photo.png" />
                      <IField label="Caption" value={g.caption} onChange={e => udGallery(i, 'caption', e.target.value)} placeholder="Library hall" />
                    </div>
                  </ItemCard>
                ))}
              </CmsSection>

              <CmsSection icon={Megaphone} title="News & Bulletins" count={news.length} onAdd={addNews} addLabel="Add Announcement">
                {news.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)', fontSize: 13 }}>No announcements yet.</div>}
                {news.map((n, i) => (
                  <ItemCard key={i} index={i} label={n.title || 'Announcement'} onRemove={() => rmNews(i)} ac="#e879f9">
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                      <IField label="Headline" value={n.title} onChange={e => udNews(i, 'title', e.target.value)} />
                      <IField label="Date" type="date" value={n.date} onChange={e => udNews(i, 'date', e.target.value)} />
                    </div>
                    <TField label="Content" rows={2} value={n.content} onChange={e => udNews(i, 'content', e.target.value)} />
                  </ItemCard>
                ))}
              </CmsSection>
            </div>
          )}

          {/* DATABASE BACKUPS */}
          {tab === 'backup' && (
            <div style={card}>
              <SecHead icon={Database} title="Database Backup & Restore" desc="Create SQL dumps and restore previous system states"
                action={
                  <button type="button" onClick={triggerBackup} disabled={backupBusy} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 700, cursor: backupBusy ? 'not-allowed' : 'pointer', opacity: backupBusy ? 0.7 : 1, boxShadow: '0 4px 14px rgba(99,102,241,.35)' }}>
                    <RefreshCw size={14} className={backupBusy ? 'spin' : ''} />{backupBusy ? 'Creating...' : 'Create New Backup'}
                  </button>
                }
              />
              <div style={{ padding: '16px 20px', background: 'rgba(99,102,241,.07)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 12, marginBottom: 24, display: 'flex', gap: 12 }}>
                <Database size={16} style={{ color: '#818cf8', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: '#a5b4fc', margin: 0, lineHeight: 1.6 }}>Backups include all table data — students, Spatie roles, research, academic structure, finance, and settings — compiled into a queryable SQL archive.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Total Backups', val: backups.length, color: '#818cf8' },
                  { label: 'Successful', val: backups.filter(b => b.backup_status_id === 1).length, color: '#34d399' },
                  { label: 'Total Size', val: (() => { const tot = backups.reduce((acc, b) => acc + (b.file_size_bytes || 0), 0); return tot > 1048576 ? (tot / 1048576).toFixed(2) + ' MB' : (tot / 1024).toFixed(2) + ' KB'; })(), color: '#fbbf24' },
                ].map(st => (
                  <div key={st.label} style={{ padding: 16, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: st.color, marginBottom: 4 }}>{st.val}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{st.label}</div>
                  </div>
                ))}
              </div>
              {backups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, border: '1.5px dashed rgba(255,255,255,.1)', borderRadius: 12 }}>
                  <Database size={36} style={{ color: 'rgba(99,102,241,.4)', marginBottom: 12 }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 4 }}>No backups yet</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Click Create New Backup to generate your first archive</p>
                </div>
              ) : (
                <div style={{ borderRadius: 12, overflowX: 'auto', border: '1px solid var(--border-glass)', width: '100%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(99,102,241,.1)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                        {['Created', 'File Name', 'Size', 'Status', 'Initiator', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a5b4fc', textAlign: h === 'Actions' ? 'right' : 'left', verticalAlign: 'middle' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map((b, i) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)' }}>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{new Date(b.created_at).toLocaleString()}</td>
                          <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, color: '#a5b4fc', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{b.file_name}</td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{(b.file_size_bytes / 1024).toFixed(2)} KB</td>
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>{statusBadge(b.backup_status_id)}</td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-secondary)', verticalAlign: 'middle' }}>{b.initiator?.name || 'System'}</td>
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button type="button" onClick={() => dlBackup(b.id, b.file_name)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.3)', borderRadius: 7, color: '#a5b4fc', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                <Download size={11} />Download
                              </button>
                              <button type="button" onClick={() => restoreBackup(b.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 7, color: '#fbbf24', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                <RefreshCw size={11} />Restore
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sticky Save Bar */}
          {tab !== 'backup' && (
            <div style={{ position: 'sticky', bottom: 16, zIndex: 50, background: 'var(--bg-card)', backdropFilter: 'blur(20px)', borderRadius: 14, border: '1px solid rgba(99,102,241,.25)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 32px rgba(0,0,0,.4)', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: saving ? '#f59e0b' : '#10b981', animation: saving ? 'pulse 1s infinite' : 'none' }} />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{saving ? 'Saving changes...' : 'Editing: ' + (TABS.find(t => t.id === tab)?.label || '')}</span>
              </div>
              <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 28px', background: saving ? 'rgba(99,102,241,.5)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 14px rgba(99,102,241,.4)' }}>
                <Save size={16} />{saving ? 'Saving...' : 'Save Changes'}
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
