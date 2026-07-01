import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { School, GraduationCap, Calendar, Clock, Plus, Edit, Check } from 'lucide-react';

interface Department {
  id: number;
  name_ar: string;
  name_en: string;
  code: string;
  head_teacher_id?: number | null;
}

interface Program {
  id: number;
  department_id: number;
  department?: Department;
  name_ar: string;
  name_en: string;
  code: string;
  duration_years: number;
  total_credits: number;
}

interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Semester {
  id: number;
  academic_year_id: number;
  academic_year?: AcademicYear;
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const AdminAcademicStructure: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'depts' | 'programs' | 'years' | 'semesters'>('depts');
  const [loading, setLoading] = useState(true);

  // States
  const [depts, setDepts] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form Fields - Department
  const [dNameAr, setDNameAr] = useState('');
  const [dNameEn, setDNameEn] = useState('');
  const [dCode, setDCode] = useState('');

  // Form Fields - Program
  const [pDeptId, setPDeptId] = useState(0);
  const [pNameAr, setPNameAr] = useState('');
  const [pNameEn, setPNameEn] = useState('');
  const [pCode, setPCode] = useState('');
  const [pDuration, setPDuration] = useState(4);
  const [pCredits, setPCredits] = useState(120);

  // Form Fields - Academic Year
  const [yName, setYName] = useState('');
  const [yStart, setYStart] = useState('');
  const [yEnd, setYEnd] = useState('');
  const [yActive, setYActive] = useState(false);

  // Form Fields - Semester
  const [sYearId, setSYearId] = useState(0);
  const [sName, setSName] = useState('');
  const [sCode, setSCode] = useState('');
  const [sStart, setSStart] = useState('');
  const [sEnd, setSEnd] = useState('');
  const [sActive, setSActive] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'depts') {
        const response = await api.get('/admin/academic/departments');
        setDepts(response.data.data);
      } else if (activeSubTab === 'programs') {
        const dRes = await api.get('/admin/academic/departments');
        setDepts(dRes.data.data);
        const response = await api.get('/admin/academic/programs');
        setPrograms(response.data.data);
      } else if (activeSubTab === 'years') {
        const response = await api.get('/admin/academic/years');
        setYears(response.data.data);
      } else if (activeSubTab === 'semesters') {
        const yRes = await api.get('/admin/academic/years');
        setYears(yRes.data.data);
        const response = await api.get('/admin/academic/semesters');
        setSemesters(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load academic records.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditId(null);
    setShowModal(true);

    // Reset fields
    setDNameAr(''); setDNameEn(''); setDCode('');
    setPNameAr(''); setPNameEn(''); setPCode(''); setPDuration(4); setPCredits(120);
    if (depts.length > 0) setPDeptId(depts[0].id);

    setYName(''); setYStart(''); setYEnd(''); setYActive(false);

    setSName(''); setSCode(''); setSStart(''); setSEnd(''); setSActive(false);
    if (years.length > 0) setSYearId(years[0].id);
  };

  const handleOpenEditModal = (item: any) => {
    setEditId(item.id);
    setShowModal(true);

    if (activeSubTab === 'depts') {
      setDNameAr(item.name_ar);
      setDNameEn(item.name_en);
      setDCode(item.code);
    } else if (activeSubTab === 'programs') {
      setPDeptId(item.department_id);
      setPNameAr(item.name_ar);
      setPNameEn(item.name_en);
      setPCode(item.code);
      setPDuration(item.duration_years);
      setPCredits(item.total_credits);
    } else if (activeSubTab === 'years') {
      setYName(item.name);
      setYStart(item.start_date ? item.start_date.substring(0, 10) : '');
      setYEnd(item.end_date ? item.end_date.substring(0, 10) : '');
      setYActive(item.is_active);
    } else if (activeSubTab === 'semesters') {
      setSYearId(item.academic_year_id);
      setSName(item.name);
      setSCode(item.code);
      setSStart(item.start_date ? item.start_date.substring(0, 10) : '');
      setSEnd(item.end_date ? item.end_date.substring(0, 10) : '');
      setSActive(item.is_active);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Saving structure details...');
    try {
      if (activeSubTab === 'depts') {
        const payload = { name_ar: dNameAr, name_en: dNameEn, code: dCode };
        if (editId) {
          await api.post(`/admin/academic/departments/${editId}/update`, payload);
        } else {
          await api.post('/admin/academic/departments', payload);
        }
      } else if (activeSubTab === 'programs') {
        const payload = { department_id: pDeptId, name_ar: pNameAr, name_en: pNameEn, code: pCode, duration_years: pDuration, total_credits: pCredits };
        if (editId) {
          await api.post(`/admin/academic/programs/${editId}/update`, payload);
        } else {
          await api.post('/admin/academic/programs', payload);
        }
      } else if (activeSubTab === 'years') {
        const payload = { name: yName, start_date: yStart, end_date: yEnd, is_active: yActive };
        if (editId) {
          await api.post(`/admin/academic/years/${editId}/update`, payload);
        } else {
          await api.post('/admin/academic/years', payload);
        }
      } else if (activeSubTab === 'semesters') {
        const payload = { academic_year_id: sYearId, name: sName, code: sCode, start_date: sStart, end_date: sEnd, is_active: sActive };
        if (editId) {
          await api.post(`/admin/academic/semesters/${editId}/update`, payload);
        } else {
          await api.post('/admin/academic/semesters', payload);
        }
      }
      toast.success('Record saved successfully!', { id: toastId });
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transaction failed.', { id: toastId });
    }
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Registrar</span>
          <span className="badge badge-role">Academic Infrastructure</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>Academic Structure</h1>
            <p>Administer college divisions, curricula tracks, and calendar semesters.</p>
          </div>
          <button onClick={handleOpenCreateModal} className="btn btn-primary btn-sm flex-center">
            <Plus size={14} /> Add Structure Record
          </button>
        </header>

        {/* Directory subtabs */}
        <div className="news-tabs" style={{ justifyContent: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '30px', flexWrap: 'wrap', gap: '8px' }}>
          <button onClick={() => setActiveSubTab('depts')} className={`tab-btn ${activeSubTab === 'depts' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <School size={14} /> Departments
          </button>
          <button onClick={() => setActiveSubTab('programs')} className={`tab-btn ${activeSubTab === 'programs' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GraduationCap size={14} /> Programs
          </button>
          <button onClick={() => setActiveSubTab('years')} className={`tab-btn ${activeSubTab === 'years' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Academic Years
          </button>
          <button onClick={() => setActiveSubTab('semesters')} className={`tab-btn ${activeSubTab === 'semesters' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} /> Semesters
          </button>
        </div>

        {loading ? (
          <div className="spinner-center" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
            <p>Loading records...</p>
          </div>
        ) : (
          <div className="dashboard-card">
            {/* Departments */}
            {activeSubTab === 'depts' && (
              depts.length > 0 ? (
                <div className="downloads-table-container">
                  <table className="downloads-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Arabic Name</th>
                        <th>English Name</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {depts.map((d) => (
                        <tr key={d.id}>
                          <td><code>{d.code}</code></td>
                          <td style={{ fontFamily: 'amiri, serif' }}>{d.name_ar}</td>
                          <td>{d.name_en}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button onClick={() => handleOpenEditModal(d)} className="btn btn-outline btn-sm" style={{ margin: '0 auto' }}>
                              <Edit size={14} /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-badge">No departments created yet.</p>
              )
            )}

            {/* Programs */}
            {activeSubTab === 'programs' && (
              programs.length > 0 ? (
                <div className="downloads-table-container">
                  <table className="downloads-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Program Name</th>
                        <th>Department</th>
                        <th>Duration</th>
                        <th>Credits Required</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programs.map((p) => (
                        <tr key={p.id}>
                          <td><code>{p.code}</code></td>
                          <td>
                            <div style={{ fontWeight: '500' }}>{p.name_en}</div>
                            <div style={{ fontFamily: 'amiri, serif', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{p.name_ar}</div>
                          </td>
                          <td>{p.department?.name_en || 'N/A'}</td>
                          <td>{p.duration_years} Years</td>
                          <td>{p.total_credits} Credits</td>
                          <td style={{ textAlign: 'center' }}>
                            <button onClick={() => handleOpenEditModal(p)} className="btn btn-outline btn-sm" style={{ margin: '0 auto' }}>
                              <Edit size={14} /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-badge">No programs created yet.</p>
              )
            )}

            {/* Academic Years */}
            {activeSubTab === 'years' && (
              years.length > 0 ? (
                <div className="downloads-table-container">
                  <table className="downloads-table">
                    <thead>
                      <tr>
                        <th>Calendar Term</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {years.map((y) => (
                        <tr key={y.id}>
                          <td><strong>{y.name}</strong></td>
                          <td>{y.start_date}</td>
                          <td>{y.end_date}</td>
                          <td>
                            {y.is_active ? (
                              <span className="badge badge-permission" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={12} /> Active Calendar
                              </span>
                            ) : (
                              <span className="badge badge-role">Inactive</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button onClick={() => handleOpenEditModal(y)} className="btn btn-outline btn-sm" style={{ margin: '0 auto' }}>
                              <Edit size={14} /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-badge">No academic years configured.</p>
              )
            )}

            {/* Semesters */}
            {activeSubTab === 'semesters' && (
              semesters.length > 0 ? (
                <div className="downloads-table-container">
                  <table className="downloads-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Semester Name</th>
                        <th>Academic Year</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semesters.map((s) => (
                        <tr key={s.id}>
                          <td><code>{s.code}</code></td>
                          <td><strong>{s.name}</strong></td>
                          <td>{s.academic_year?.name || 'N/A'}</td>
                          <td>{s.start_date} to {s.end_date}</td>
                          <td>
                            {s.is_active ? (
                              <span className="badge badge-permission" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={12} /> Active Semester
                              </span>
                            ) : (
                              <span className="badge badge-role">Inactive</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button onClick={() => handleOpenEditModal(s)} className="btn btn-outline btn-sm" style={{ margin: '0 auto' }}>
                              <Edit size={14} /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-badge">No semesters configured.</p>
              )
            )}
          </div>
        )}

        {/* Modal: Create/Edit record */}
        {showModal && (
          <div className="fullscreen-loader" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
            <div className="auth-card" style={{ maxWidth: '580px', width: '100%' }}>
              <div className="auth-header">
                <h2>{editId ? 'Modify Details' : 'Add Academic Record'}</h2>
                <p>Register records under active college divisions.</p>
              </div>
              <form onSubmit={handleSubmit} className="auth-form">
                
                {/* DEPARTMENTS FORM */}
                {activeSubTab === 'depts' && (
                  <>
                    <div className="input-group">
                      <label htmlFor="dept-code">Department Code</label>
                      <input id="dept-code" type="text" placeholder="e.g. SHAR" value={dCode} onChange={(e) => setDCode(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <label htmlFor="dept-name-en">English Name</label>
                      <input id="dept-name-en" type="text" placeholder="e.g. Sharia Science" value={dNameEn} onChange={(e) => setDNameEn(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <label htmlFor="dept-name-ar">Arabic Name</label>
                      <input id="dept-name-ar" type="text" placeholder="e.g. قسم الشريعة" value={dNameAr} onChange={(e) => setDNameAr(e.target.value)} required style={{ textAlign: 'right', direction: 'rtl', fontFamily: 'amiri, serif' }} />
                    </div>
                  </>
                )}

                {/* PROGRAMS FORM */}
                {activeSubTab === 'programs' && (
                  <>
                    <div className="grid-2">
                      <div className="input-group">
                        <label htmlFor="program-dept-select">Department</label>
                        <select
                          id="program-dept-select"
                          title="Department"
                          value={pDeptId}
                          onChange={(e) => setPDeptId(parseInt(e.target.value))}
                        >
                          {depts.map((d) => (
                            <option key={d.id} value={d.id}>{d.name_en}</option>
                          ))}
                        </select>
                      </div>
                      <div className="input-group">
                        <label htmlFor="program-code">Program Code</label>
                        <input id="program-code" type="text" placeholder="e.g. BSHAR" value={pCode} onChange={(e) => setPCode(e.target.value)} required />
                      </div>
                    </div>
                    <div className="input-group">
                      <label htmlFor="program-name-en">English Name</label>
                      <input id="program-name-en" type="text" placeholder="e.g. Bachelor in Sharia Studies" value={pNameEn} onChange={(e) => setPNameEn(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <label htmlFor="program-name-ar">Arabic Name</label>
                      <input id="program-name-ar" type="text" placeholder="e.g. بكالوريوس الشريعة" value={pNameAr} onChange={(e) => setPNameAr(e.target.value)} required style={{ textAlign: 'right', direction: 'rtl', fontFamily: 'amiri, serif' }} />
                    </div>
                    <div className="grid-2">
                      <div className="input-group">
                        <label htmlFor="program-duration">Duration (Years)</label>
                        <input id="program-duration" type="number" placeholder="4" value={pDuration} onChange={(e) => setPDuration(parseInt(e.target.value) || 4)} required />
                      </div>
                      <div className="input-group">
                        <label htmlFor="program-credits">Total Credits Required</label>
                        <input id="program-credits" type="number" placeholder="120" value={pCredits} onChange={(e) => setPCredits(parseInt(e.target.value) || 120)} required />
                      </div>
                    </div>
                  </>
                )}

                {/* ACADEMIC YEARS FORM */}
                {activeSubTab === 'years' && (
                  <>
                    <div className="input-group">
                      <label htmlFor="year-name">Academic Year Term</label>
                      <input id="year-name" type="text" placeholder="e.g. 2026/2027" value={yName} onChange={(e) => setYName(e.target.value)} required />
                    </div>
                    <div className="grid-2">
                      <div className="input-group">
                        <label htmlFor="year-start">Start Date</label>
                        <input id="year-start" type="date" placeholder="YYYY-MM-DD" value={yStart} onChange={(e) => setYStart(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label htmlFor="year-end">End Date</label>
                        <input id="year-end" type="date" placeholder="YYYY-MM-DD" value={yEnd} onChange={(e) => setYEnd(e.target.value)} required />
                      </div>
                    </div>
                    <div className="row-spaced" style={{ marginTop: '10px' }}>
                      <label htmlFor="year-active" className="checkbox-container">
                        Set as Active College Calendar
                        <input id="year-active" type="checkbox" checked={yActive} onChange={(e) => setYActive(e.target.checked)} />
                        <span className="checkmark"></span>
                      </label>
                    </div>
                  </>
                )}

                {/* SEMESTERS FORM */}
                {activeSubTab === 'semesters' && (
                  <>
                    <div className="grid-2">
                      <div className="input-group">
                        <label htmlFor="semester-year-select">Academic Year</label>
                        <select
                          id="semester-year-select"
                          title="Academic Year"
                          value={sYearId}
                          onChange={(e) => setSYearId(parseInt(e.target.value))}
                        >
                          {years.map((y) => (
                            <option key={y.id} value={y.id}>{y.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="input-group">
                        <label htmlFor="semester-code">Semester Code</label>
                        <input id="semester-code" type="text" placeholder="e.g. 2026-S1" value={sCode} onChange={(e) => setSCode(e.target.value)} required />
                      </div>
                    </div>
                    <div className="input-group">
                      <label htmlFor="semester-name">Semester Name</label>
                      <input id="semester-name" type="text" placeholder="e.g. Semester 1" value={sName} onChange={(e) => setSName(e.target.value)} required />
                    </div>
                    <div className="grid-2">
                      <div className="input-group">
                        <label htmlFor="semester-start">Start Date</label>
                        <input id="semester-start" type="date" placeholder="YYYY-MM-DD" value={sStart} onChange={(e) => setSStart(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label htmlFor="semester-end">End Date</label>
                        <input id="semester-end" type="date" placeholder="YYYY-MM-DD" value={sEnd} onChange={(e) => setSEnd(e.target.value)} required />
                      </div>
                    </div>
                    <div className="row-spaced" style={{ marginTop: '10px' }}>
                      <label htmlFor="semester-active" className="checkbox-container">
                        Set as Active Current Semester
                        <input id="semester-active" type="checkbox" checked={sActive} onChange={(e) => setSActive(e.target.checked)} />
                        <span className="checkmark"></span>
                      </label>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: '1' }}>
                    Save Record
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
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

export default AdminAcademicStructure;
