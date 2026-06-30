import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Trash2, Edit, Award } from 'lucide-react';

interface Department {
  id: number;
  name_en: string;
}

interface Subject {
  id: number;
  department_id: number;
  department?: Department;
  name_ar: string;
  name_en: string;
  code: string;
  credit_hours: number;
  description?: string;
  prerequisites: Subject[];
}

interface Program {
  id: number;
  name_en: string;
  code: string;
}

interface CurriculumItem {
  id?: number;
  subject_id: number;
  subject?: Subject;
  semester_period: number;
  is_elective: boolean;
}

const AdminSubjectCurriculum: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subjects' | 'curriculum'>('subjects');
  const [loading, setLoading] = useState(true);

  // Data lists
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  // Selected program for curriculum tab
  const [selectedProgramId, setSelectedProgramId] = useState<number>(0);
  const [curriculumItems, setCurriculumItems] = useState<CurriculumItem[]>([]);

  // Subject Modal fields
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState<number | null>(null);
  const [sNameAr, setSNameAr] = useState('');
  const [sNameEn, setSNameEn] = useState('');
  const [sCode, setSCode] = useState('');
  const [sCredits, setSCredits] = useState(3);
  const [sDeptId, setSDeptId] = useState(0);
  const [sDesc, setSDesc] = useState('');
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<number[]>([]);

  // Curriculum Editor state
  const [showCurriculumAdd, setShowCurriculumAdd] = useState(false);
  const [currSubjectId, setCurrSubjectId] = useState<number>(0);
  const [currSemesterPeriod, setCurrSemesterPeriod] = useState<number>(1);
  const [currIsElective, setCurrIsElective] = useState<boolean>(false);

  useEffect(() => {
    fetchBaseData();
  }, [activeTab]);

  const fetchBaseData = async () => {
    setLoading(true);
    try {
      const dRes = await api.get('/admin/academic/departments');
      setDepartments(dRes.data.data);

      const sRes = await api.get('/admin/academic/subjects');
      setSubjects(sRes.data.data);

      if (activeTab === 'curriculum') {
        const pRes = await api.get('/admin/academic/programs');
        setPrograms(pRes.data.data);
        if (pRes.data.data.length > 0 && selectedProgramId === 0) {
          setSelectedProgramId(pRes.data.data[0].id);
        }
      }
    } catch (error) {
      toast.error('Failed to load subjects data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProgramId > 0 && activeTab === 'curriculum') {
      fetchCurriculum();
    }
  }, [selectedProgramId, activeTab]);

  const fetchCurriculum = async () => {
    try {
      const response = await api.get(`/admin/academic/programs/${selectedProgramId}/curriculum`);
      setCurriculumItems(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch program curriculum map.');
    }
  };

  const handleOpenCreateSubject = () => {
    setEditSubjectId(null);
    setShowSubjectModal(true);
    setSNameAr('');
    setSNameEn('');
    setSCode('');
    setSCredits(3);
    setSDesc('');
    setSelectedPrereqIds([]);
    if (departments.length > 0) setSDeptId(departments[0].id);
  };

  const handleOpenEditSubject = (sub: Subject) => {
    setEditSubjectId(sub.id);
    setShowSubjectModal(true);
    setSNameAr(sub.name_ar);
    setSNameEn(sub.name_en);
    setSCode(sub.code);
    setSCredits(sub.credit_hours);
    setSDeptId(sub.department_id);
    setSDesc(sub.description || '');
    setSelectedPrereqIds(sub.prerequisites.map(p => p.id));
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Saving subject details...');
    try {
      const payload = {
        department_id: sDeptId,
        name_ar: sNameAr,
        name_en: sNameEn,
        code: sCode,
        credit_hours: sCredits,
        description: sDesc,
        prerequisite_ids: selectedPrereqIds,
      };

      if (editSubjectId) {
        await api.post(`/admin/academic/subjects/${editSubjectId}/update`, payload);
      } else {
        await api.post('/admin/academic/subjects', payload);
      }

      toast.success('Subject details saved successfully!', { id: toastId });
      setShowSubjectModal(false);
      fetchBaseData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Transaction failed.', { id: toastId });
    }
  };

  const togglePrereq = (prereqId: number) => {
    if (selectedPrereqIds.includes(prereqId)) {
      setSelectedPrereqIds(selectedPrereqIds.filter(id => id !== prereqId));
    } else {
      setSelectedPrereqIds([...selectedPrereqIds, prereqId]);
    }
  };

  // Curriculum functions
  const handleAddCurriculumItem = () => {
    if (currSubjectId === 0 && subjects.length > 0) {
      setCurrSubjectId(subjects[0].id);
    }
    setShowCurriculumAdd(true);
  };

  const saveCurriculumItem = () => {
    // Check duplicate
    if (curriculumItems.some(i => i.subject_id === currSubjectId)) {
      toast.error('This subject is already mapped in the curriculum.');
      return;
    }

    const itemSubject = subjects.find(s => s.id === currSubjectId);
    const newItems = [...curriculumItems, {
      subject_id: currSubjectId,
      subject: itemSubject,
      semester_period: currSemesterPeriod,
      is_elective: currIsElective
    }];

    setCurriculumItems(newItems);
    setShowCurriculumAdd(false);
    toast.success('Subject added to working draft curriculum.');
  };

  const removeCurriculumItem = (subjectId: number) => {
    setCurriculumItems(curriculumItems.filter(i => i.subject_id !== subjectId));
  };

  const handleSaveCurriculumMap = async () => {
    const toastId = toast.loading('Syncing curriculum map to database...');
    try {
      const payload = curriculumItems.map(item => ({
        subject_id: item.subject_id,
        semester_period: item.semester_period,
        is_elective: item.is_elective
      }));

      await api.post(`/admin/academic/programs/${selectedProgramId}/curriculum`, { curriculum: payload });
      toast.success('Curriculum map updated successfully!', { id: toastId });
      fetchCurriculum();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to sync curriculum.', { id: toastId });
    }
  };

  // Group curriculum items by semester period for rendering
  const semestersGroup = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Registrar</span>
          <span className="badge badge-role">Subjects & Curriculum</span>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header flex-align" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>Syllabus Management</h1>
            <p>Administer subjects catalog, prerequisites criteria, and recommended program curriculum mappings.</p>
          </div>
          {activeTab === 'subjects' ? (
            <button onClick={handleOpenCreateSubject} className="btn btn-primary btn-sm flex-center">
              <Plus size={14} /> Create Subject
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleAddCurriculumItem} className="btn btn-outline btn-sm flex-center">
                <Plus size={14} /> Map Subject
              </button>
              <button onClick={handleSaveCurriculumMap} className="btn btn-primary btn-sm flex-center">
                Save Curriculum Map
              </button>
            </div>
          )}
        </header>

        {/* Tab Switcher */}
        <div className="news-tabs" style={{ justifyContent: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '30px' }}>
          <button onClick={() => { setActiveTab('subjects'); }} className={`tab-btn ${activeTab === 'subjects' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={16} /> Course Syllabus Catalog
          </button>
          <button onClick={() => { setActiveTab('curriculum'); }} className={`tab-btn ${activeTab === 'curriculum' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={16} /> Program Curriculum Map
          </button>
        </div>

        {loading ? (
          <div className="spinner-center" style={{ minHeight: '300px' }}>
            <div className="spinner"></div>
            <p>Loading catalog details...</p>
          </div>
        ) : activeTab === 'subjects' ? (
          /* Tab 1: Subject Catalog */
          <div className="dashboard-card">
            {subjects.length > 0 ? (
              <div className="downloads-table-container">
                <table className="downloads-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Subject Name</th>
                      <th>Department</th>
                      <th>Credits</th>
                      <th>Prerequisites</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((sub) => (
                      <tr key={sub.id}>
                        <td><code>{sub.code}</code></td>
                        <td>
                          <div style={{ fontWeight: '600', color: 'white' }}>{sub.name_en}</div>
                          <div style={{ fontFamily: 'amiri, serif', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{sub.name_ar}</div>
                        </td>
                        <td>{sub.department?.name_en || 'N/A'}</td>
                        <td>{sub.credit_hours} Credits</td>
                        <td>
                          {sub.prerequisites && sub.prerequisites.length > 0 ? (
                            <div className="badge-container">
                              {sub.prerequisites.map(p => (
                                <span key={p.id} className="badge badge-role" style={{ fontSize: '10px', padding: '2px 6px' }}>{p.code}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="no-badge">None</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => handleOpenEditSubject(sub)} className="btn btn-outline btn-sm" style={{ margin: '0 auto' }}>
                            <Edit size={14} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-badge">No subjects defined.</p>
            )}
          </div>
        ) : (
          /* Tab 2: Curriculum Map */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Program selection bar */}
            <div className="dashboard-card" style={{ padding: '20px' }}>
              <div className="input-group" style={{ maxWidth: '400px', margin: '0' }}>
                <label>Select Degree Program</label>
                <select value={selectedProgramId} onChange={(e) => setSelectedProgramId(parseInt(e.target.value))}>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.name_en} ({p.code})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Curriculum grid mapped by semesters */}
            <div className="grid-container" style={{ margin: '0', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {semestersGroup.map((semNum) => {
                const semesterItems = curriculumItems.filter(item => item.semester_period === semNum);
                const semesterCredits = semesterItems.reduce((acc, curr) => acc + (curr.subject?.credit_hours || 0), 0);
                
                return (
                  <div key={semNum} className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '340px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '15px', color: 'white' }}>Semester {semNum}</h3>
                        <span className="badge badge-role" style={{ fontSize: '11px' }}>{semesterCredits} Credits</span>
                      </div>

                      {semesterItems.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {semesterItems.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                              <div>
                                <span style={{ fontSize: '13px', fontWeight: '500', display: 'block', color: 'white' }}>{item.subject?.name_en}</span>
                                <code style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{item.subject?.code} ({item.subject?.credit_hours} CH)</code>
                                {item.is_elective && <span className="badge badge-warning" style={{ fontSize: '8px', padding: '1px 4px', marginLeft: '6px' }}>Elective</span>}
                              </div>
                              <button onClick={() => removeCurriculumItem(item.subject_id)} className="btn btn-outline" style={{ padding: '6px', color: 'var(--error)', borderColor: 'rgba(239,68,68,0.1)' }}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-badge" style={{ fontSize: '12px' }}>No subjects assigned.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal: Subject Form */}
        {showSubjectModal && (
          <div className="fullscreen-loader" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
            <div className="auth-card" style={{ maxWidth: '580px', width: '100%' }}>
              <div className="auth-header">
                <h2>{editSubjectId ? 'Modify Subject Details' : 'Create Subject Record'}</h2>
                <p>Configure subject credit weights and prerequisite flows.</p>
              </div>
              <form onSubmit={handleSubjectSubmit} className="auth-form">
                <div className="grid-2">
                  <div className="input-group">
                    <label>Department Board</label>
                    <select value={sDeptId} onChange={(e) => setSDeptId(parseInt(e.target.value))}>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name_en}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Subject Code</label>
                    <input type="text" placeholder="e.g. ARA102" value={sCode} onChange={(e) => setSCode(e.target.value)} required />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label>English Name</label>
                    <input type="text" placeholder="e.g. Arabic Syntax II" value={sNameEn} onChange={(e) => setSNameEn(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Arabic Name</label>
                    <input type="text" placeholder="e.g. النحو 2" value={sNameAr} onChange={(e) => setSNameAr(e.target.value)} required style={{ textAlign: 'right', direction: 'rtl', fontFamily: 'amiri, serif' }} />
                  </div>
                </div>

                <div className="input-group">
                  <label>Credit Hours</label>
                  <input type="number" min={1} max={6} value={sCredits} onChange={(e) => setSCredits(parseInt(e.target.value) || 3)} required />
                </div>

                <div className="input-group">
                  <label>Prerequisites (Choose prerequisites)</label>
                  <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '10px', background: 'rgba(15,23,42,0.6)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {subjects.filter(s => s.id !== editSubjectId).map(sub => (
                      <label key={sub.id} className="checkbox-container" style={{ margin: '0', fontSize: '12px' }}>
                        {sub.code} - {sub.name_en}
                        <input
                          type="checkbox"
                          checked={selectedPrereqIds.includes(sub.id)}
                          onChange={() => togglePrereq(sub.id)}
                        />
                        <span className="checkmark" style={{ height: '14px', width: '14px' }}></span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Description / Course Outline</label>
                  <textarea rows={2} value={sDesc} onChange={(e) => setSDesc(e.target.value)} style={{ padding: '10px', background: 'rgba(15,23,42,0.6)', border: '1px solid var(--border-glass)', borderRadius: '10px', color: '#fff', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: '1' }}>
                    Save Subject
                  </button>
                  <button type="button" onClick={() => setShowSubjectModal(false)} className="btn btn-outline">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Map Subject to Curriculum */}
        {showCurriculumAdd && (
          <div className="fullscreen-loader" style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
            <div className="auth-card" style={{ maxWidth: '480px', width: '100%' }}>
              <div className="auth-header">
                <h2>Map Subject to Curriculum</h2>
                <p>Bind course subjects to recommended academic year semesters.</p>
              </div>
              <div className="auth-form">
                <div className="input-group">
                  <label>Select Subject</label>
                  <select value={currSubjectId} onChange={(e) => setCurrSubjectId(parseInt(e.target.value))}>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name_en}</option>
                    ))}
                  </select>
                </div>

                <div className="grid-2" style={{ alignItems: 'center' }}>
                  <div className="input-group">
                    <label>Recommended Semester</label>
                    <select value={currSemesterPeriod} onChange={(e) => setCurrSemesterPeriod(parseInt(e.target.value))}>
                      {semestersGroup.map(n => (
                        <option key={n} value={n}>Semester {n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="row-spaced" style={{ marginTop: '20px' }}>
                    <label className="checkbox-container" style={{ margin: '0' }}>
                      Is Elective Course
                      <input type="checkbox" checked={currIsElective} onChange={(e) => setCurrIsElective(e.target.checked)} />
                      <span className="checkmark"></span>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
                  <button onClick={saveCurriculumItem} className="btn btn-primary" style={{ flex: '1' }}>
                    Add Subject
                  </button>
                  <button type="button" onClick={() => setShowCurriculumAdd(false)} className="btn btn-outline">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminSubjectCurriculum;
