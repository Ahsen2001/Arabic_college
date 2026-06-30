import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Edit3, Save, X, Calendar,
  AlertTriangle, BookOpen, User, DoorOpen,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Room { id: number; name: string; building?: string; type: string; capacity: number; }
interface Course { id: number; code: string; section: string; subject?: { name_en: string }; }
interface Teacher { id: number; name: string; email: string; }

interface TimetableSlot {
  id: number;
  course_id: number;
  teacher_user_id?: number | null;
  classroom_id?: number | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  notes?: string;
  course?: Course;
  teacher?: Teacher;
  room?: Room;
}

const DAY_NAMES = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_ACTIVE = [2, 3, 4, 5, 6]; // Mon–Fri default school week
const SLOT_COLORS = [
  'rgba(99,102,241,0.7)',
  'rgba(16,185,129,0.7)',
  'rgba(245,158,11,0.7)',
  'rgba(239,68,68,0.65)',
  'rgba(236,72,153,0.65)',
  'rgba(14,165,233,0.7)',
  'rgba(168,85,247,0.7)',
  'rgba(34,197,94,0.7)',
];

// ─── Blank form ───────────────────────────────────────────────────────────────
const blankForm = () => ({
  course_id: 0,
  teacher_user_id: null as number | null,
  classroom_id: null as number | null,
  day_of_week: 2,
  start_time: '08:00',
  end_time: '09:00',
  notes: '',
});

// ─── Main Component ───────────────────────────────────────────────────────────
const TimetableBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'class' | 'teacher' | 'room'>('class');

  // Data
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterTeacherId, setFilterTeacherId] = useState<number>(0);
  const [filterRoomId, setFilterRoomId] = useState<number>(0);

  // Slot modal
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [form, setForm] = useState(blankForm());
  const [saving, setSaving] = useState(false);

  // Room modal
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: '', building: '', type: 'Classroom', capacity: 30, has_projector: false, has_ac: false });

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [slotRes, roomRes, courseRes, teacherRes] = await Promise.all([
        api.get('/timetable/slots'),
        api.get('/timetable/rooms'),
        api.get('/admin/academic/courses'),
        api.get('/admin/teachers'),
      ]);
      setSlots(slotRes.data.data);
      setRooms(roomRes.data.data);
      setCourses(courseRes.data.data);
      // Map teachers to a flat {id, name, email} list
      setTeachers(
        teacherRes.data.data.map((t: any) => ({
          id: t.user_id ?? t.user?.id ?? t.id,
          name: t.user?.name ?? t.name ?? 'Unknown',
          email: t.user?.email ?? t.email ?? '',
        }))
      );
    } catch {
      toast.error('Failed to load timetable data.');
    } finally {
      setLoading(false);
    }
  };

  // ── Filtered slot views ──────────────────────────────────────────────────
  const filteredSlots = useCallback((): TimetableSlot[] => {
    if (activeTab === 'teacher' && filterTeacherId > 0) {
      return slots.filter(s => s.teacher_user_id === filterTeacherId);
    }
    if (activeTab === 'room' && filterRoomId > 0) {
      return slots.filter(s => s.classroom_id === filterRoomId);
    }
    return slots;
  }, [slots, activeTab, filterTeacherId, filterRoomId]);

  // Build day → slots map for the weekly grid
  const buildDayMap = (slotList: TimetableSlot[]) => {
    const map: Record<number, TimetableSlot[]> = {};
    DAYS_ACTIVE.forEach(d => { map[d] = []; });
    slotList.forEach(s => {
      if (map[s.day_of_week]) map[s.day_of_week].push(s);
    });
    return map;
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingSlot(null);
    setForm({ ...blankForm(), course_id: courses[0]?.id ?? 0 });
    setShowModal(true);
  };

  const openEditModal = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setForm({
      course_id: slot.course_id,
      teacher_user_id: slot.teacher_user_id ?? null,
      classroom_id: slot.classroom_id ?? null,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      notes: slot.notes ?? '',
    });
    setShowModal(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading(editingSlot ? 'Updating slot…' : 'Adding slot…');
    try {
      if (editingSlot) {
        await api.post(`/timetable/slots/${editingSlot.id}/update`, form);
        toast.success('Slot updated!', { id: toastId });
      } else {
        await api.post('/timetable/slots', form);
        toast.success('Slot added to timetable!', { id: toastId });
      }
      setShowModal(false);
      fetchAll();
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Failed to save slot.';
      toast.error(msg, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!window.confirm('Remove this timetable slot?')) return;
    const toastId = toast.loading('Removing slot…');
    try {
      await api.delete(`/timetable/slots/${slotId}`);
      toast.success('Slot removed.', { id: toastId });
      fetchAll();
    } catch {
      toast.error('Failed to remove slot.', { id: toastId });
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Saving room…');
    try {
      await api.post('/timetable/rooms', roomForm);
      toast.success('Classroom registered!', { id: toastId });
      setShowRoomModal(false);
      setRoomForm({ name: '', building: '', type: 'Classroom', capacity: 30, has_projector: false, has_ac: false });
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to save room.', { id: toastId });
    }
  };

  // ── Slot colour by course ─────────────────────────────────────────────────
  const slotColor = (courseId: number) => SLOT_COLORS[courseId % SLOT_COLORS.length];

  // ── Weekly grid ───────────────────────────────────────────────────────────
  const dayMap = buildDayMap(filteredSlots());

  return (
    <div className="dashboard-wrapper">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <span className="brand-logo">Arabic College Registrar</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/portal/timetable-calendar')}
              className="btn btn-outline btn-sm flex-center"
            >
              <Calendar size={14} style={{ marginRight: '6px' }} /> Calendar View
            </button>
            <span className="badge badge-role">Timetable Builder</span>
          </div>
        </div>
      </nav>

      <main className="dashboard-content">
        {/* Header */}
        <header
          className="dashboard-header flex-align"
          style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}
        >
          <div>
            <h1>Timetable Management</h1>
            <p>Schedule class slots, allocate rooms and detect conflicts in real time.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowRoomModal(true)} className="btn btn-outline btn-sm flex-center">
              <DoorOpen size={14} style={{ marginRight: '6px' }} /> Add Room
            </button>
            <button onClick={openAddModal} className="btn btn-primary btn-sm flex-center">
              <Plus size={14} style={{ marginRight: '6px' }} /> Add Slot
            </button>
          </div>
        </header>

        {/* View tabs */}
        <div className="news-tabs" style={{ margin: '0 0 24px', border: 'none', display: 'flex', gap: '8px' }}>
          {(['class', 'teacher', 'room'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'capitalize' }}
            >
              {tab === 'class' && <BookOpen size={13} />}
              {tab === 'teacher' && <User size={13} />}
              {tab === 'room' && <DoorOpen size={13} />}
              {tab} Timetable
            </button>
          ))}
        </div>

        {/* Filter row for teacher/room tabs */}
        {activeTab === 'teacher' && (
          <div className="dashboard-card" style={{ padding: '16px', marginBottom: '20px' }}>
            <div className="input-group" style={{ margin: 0, maxWidth: '300px' }}>
              <label>Filter by Teacher</label>
              <select value={filterTeacherId} onChange={e => setFilterTeacherId(parseInt(e.target.value))}>
                <option value={0}>All Teachers</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        )}
        {activeTab === 'room' && (
          <div className="dashboard-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>
            <div className="input-group" style={{ margin: 0, flex: '1', minWidth: '220px' }}>
              <label>Filter by Room / Classroom</label>
              <select value={filterRoomId} onChange={e => setFilterRoomId(parseInt(e.target.value))}>
                <option value={0}>All Rooms</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
              </select>
            </div>

            {/* Room catalogue mini-list */}
            <div style={{ flex: '2', minWidth: '260px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {rooms.map(r => (
                  <span key={r.id} className="badge badge-role" style={{ fontSize: '11px', padding: '5px 10px' }}>
                    {r.name} · Cap {r.capacity} · {r.type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Weekly grid */}
        {loading ? (
          <div className="spinner-center" style={{ minHeight: '300px' }}><div className="spinner" /></div>
        ) : (
          <div className="dashboard-card" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Day header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', background: 'rgba(99,102,241,0.08)' }}>
              <div style={{ padding: '12px 8px', fontSize: '11px', color: '#94a3b8', fontWeight: 600, borderRight: '1px solid rgba(255,255,255,0.05)' }}>TIME</div>
              {DAYS_ACTIVE.map(d => (
                <div key={d} style={{ padding: '12px 10px', fontSize: '13px', fontWeight: 700, color: 'white', borderRight: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                  {DAY_NAMES[d]}
                </div>
              ))}
            </div>

            {/* Time slots body */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', minHeight: '400px' }}>
              {/* Merged all-day column */}
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '8px 4px' }}>
                {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'].map(t => (
                  <div key={t} style={{ fontSize: '10px', color: '#64748b', padding: '2px 4px', textAlign: 'right' }}>{t}</div>
                ))}
              </div>

              {/* Day columns */}
              {DAYS_ACTIVE.map(d => (
                <div key={d} style={{ borderRight: '1px solid rgba(255,255,255,0.05)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {dayMap[d].length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#334155' }}>—</span>
                    </div>
                  ) : (
                    dayMap[d]
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map(slot => (
                        <div
                          key={slot.id}
                          style={{
                            background: slotColor(slot.course_id),
                            borderRadius: '8px',
                            padding: '8px 10px',
                            fontSize: '11px',
                            position: 'relative',
                          }}
                        >
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '12px', marginBottom: '2px' }}>
                            {slot.course?.subject?.name_en ?? '—'}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.85)' }}>
                            {slot.start_time} – {slot.end_time}
                          </div>
                          {slot.teacher && (
                            <div style={{ color: 'rgba(255,255,255,0.75)', marginTop: '2px', fontSize: '10px' }}>
                              {slot.teacher.name}
                            </div>
                          )}
                          {slot.room && (
                            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '10px' }}>
                              {slot.room.name}
                            </div>
                          )}
                          {/* Action buttons */}
                          <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => openEditModal(slot)}
                              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '4px', padding: '2px 5px', cursor: 'pointer', color: '#fff' }}
                            >
                              <Edit3 size={10} />
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              style={{ background: 'rgba(239,68,68,0.3)', border: 'none', borderRadius: '4px', padding: '2px 5px', cursor: 'pointer', color: '#fff' }}
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slot list below grid */}
        {!loading && filteredSlots().length > 0 && (
          <div className="dashboard-card" style={{ marginTop: '24px' }}>
            <h3 style={{ color: 'white', marginBottom: '14px', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
              All Scheduled Slots
            </h3>
            <div className="downloads-table-container">
              <table className="downloads-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Subject / Section</th>
                    <th>Time Window</th>
                    <th>Teacher</th>
                    <th>Room</th>
                    <th>Notes</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSlots()
                    .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
                    .map(slot => (
                      <tr key={slot.id}>
                        <td><span className="badge badge-role">{DAY_NAMES[slot.day_of_week]}</span></td>
                        <td>
                          <strong>{slot.course?.subject?.name_en}</strong>
                          <div className="card-desc" style={{ fontSize: '11px', marginTop: '1px' }}>Section {slot.course?.section} · {slot.course?.code}</div>
                        </td>
                        <td>{slot.start_time} – {slot.end_time}</td>
                        <td>{slot.teacher?.name ?? '—'}</td>
                        <td>{slot.room?.name ?? '—'}</td>
                        <td><span className="card-desc" style={{ fontSize: '12px' }}>{slot.notes || '—'}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={() => openEditModal(slot)} className="btn btn-outline btn-sm" style={{ padding: '4px 10px' }}>
                              <Edit3 size={12} />
                            </button>
                            <button onClick={() => handleDeleteSlot(slot.id)} className="btn btn-outline btn-sm" style={{ padding: '4px 10px', color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── Slot Modal ─────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="auth-card" style={{ maxWidth: '560px', width: '100%' }}>
            <div className="auth-header">
              <h2>{editingSlot ? 'Edit Slot' : 'Add Timetable Slot'}</h2>
              <p>Real-time conflict detection will fire on save.</p>
            </div>

            <form onSubmit={handleSaveSlot} className="auth-form">
              <div className="input-group">
                <label>Course Section</label>
                <select value={form.course_id} onChange={e => setForm(f => ({ ...f, course_id: parseInt(e.target.value) }))} required>
                  <option value={0} disabled>Select course…</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.subject?.name_en} ({c.code}) – {c.section}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Assign Teacher</label>
                  <select value={form.teacher_user_id ?? ''} onChange={e => setForm(f => ({ ...f, teacher_user_id: e.target.value ? parseInt(e.target.value) : null }))}>
                    <option value="">— Unassigned —</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Assign Room</label>
                  <select value={form.classroom_id ?? ''} onChange={e => setForm(f => ({ ...f, classroom_id: e.target.value ? parseInt(e.target.value) : null }))}>
                    <option value="">— Unassigned —</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name} (Cap {r.capacity})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Day of Week</label>
                  <select value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: parseInt(e.target.value) }))}>
                    {DAYS_ACTIVE.map(d => <option key={d} value={d}>{DAY_NAMES[d]}</option>)}
                  </select>
                </div>
                <div className="input-group" />
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Start Time</label>
                  <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label>End Time</label>
                  <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} required />
                </div>
              </div>

              <div className="input-group">
                <label>Notes (optional)</label>
                <input type="text" placeholder="e.g. Bring Lab Kit…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              {/* Conflict warning banner (static hint) */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '10px 12px', marginTop: '4px' }}>
                <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                  Conflicts are checked server-side on save — if a teacher or room is double-booked you will see an error toast.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  <Save size={14} style={{ marginRight: '6px' }} />
                  {saving ? 'Saving…' : editingSlot ? 'Update Slot' : 'Add to Timetable'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  <X size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Room Modal ─────────────────────────────────────────────────────── */}
      {showRoomModal && (
        <div className="fullscreen-loader" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="auth-card" style={{ maxWidth: '480px', width: '100%' }}>
            <div className="auth-header">
              <h2>Register Classroom / Room</h2>
              <p>Add a new room to the allocation catalogue.</p>
            </div>
            <form onSubmit={handleSaveRoom} className="auth-form">
              <div className="grid-2">
                <div className="input-group">
                  <label>Room Name</label>
                  <input type="text" placeholder="e.g. Room 101" value={roomForm.name} onChange={e => setRoomForm(r => ({ ...r, name: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label>Building / Block</label>
                  <input type="text" placeholder="e.g. Block A" value={roomForm.building} onChange={e => setRoomForm(r => ({ ...r, building: e.target.value }))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>Room Type</label>
                  <select value={roomForm.type} onChange={e => setRoomForm(r => ({ ...r, type: e.target.value }))}>
                    {['Classroom', 'Lab', 'Hall', 'Seminar'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Seating Capacity</label>
                  <input type="number" min={1} value={roomForm.capacity} onChange={e => setRoomForm(r => ({ ...r, capacity: parseInt(e.target.value) || 30 }))} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={roomForm.has_projector} onChange={e => setRoomForm(r => ({ ...r, has_projector: e.target.checked }))} />
                  Has Projector
                </label>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={roomForm.has_ac} onChange={e => setRoomForm(r => ({ ...r, has_ac: e.target.checked }))} />
                  Air Conditioned
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Room</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowRoomModal(false)}><X size={14} /></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableBuilder;
