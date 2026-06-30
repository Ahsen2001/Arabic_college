import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar as CalendarIcon, Plus, Trash2, Clock, AlertCircle
} from 'lucide-react';

interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  event_type: string; // 'Holiday', 'Exam Period', 'Registration', 'Event'
  start_date: string;
  end_date: string;
  is_holiday: boolean;
}

const AcademicCalendarView: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('Super Admin');

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'Event',
    start_date: '',
    end_date: '',
    is_holiday: false,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/communication/calendar');
      setEvents(res.data.data);
    } catch {
      toast.error('Failed to load academic calendar events.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Adding calendar event...');
    try {
      await api.post('/communication/calendar', newEvent);
      toast.success('Calendar event added successfully!', { id: toastId });
      setShowAddForm(false);
      setNewEvent({
        title: '',
        description: '',
        event_type: 'Event',
        start_date: '',
        end_date: '',
        is_holiday: false,
      });
      fetchEvents();
    } catch {
      toast.error('Failed to add calendar event.', { id: toastId });
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event from the calendar?')) return;
    try {
      await api.delete(`/communication/calendar/${id}`);
      toast.success('Event deleted.');
      fetchEvents();
    } catch {
      toast.error('Failed to delete calendar event.');
    }
  };

  // Group events by Month for clean syllabus/academic calendar style representation
  const getEventMonthName = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  // Grouped structure
  const groupedEvents: { [month: string]: CalendarEvent[] } = {};
  sortedEvents.forEach(ev => {
    const month = getEventMonthName(ev.start_date);
    if (!groupedEvents[month]) {
      groupedEvents[month] = [];
    }
    groupedEvents[month].push(ev);
  });

  const getEventTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Holiday':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)' };
      case 'Exam Period':
        return { bg: 'rgba(245, 158, 11, 0.1)', color: '#fef08a', border: '1px solid rgba(245, 158, 11, 0.2)' };
      case 'Registration':
        return { bg: 'rgba(16, 185, 129, 0.1)', color: '#a7f3d0', border: '1px solid rgba(16, 185, 129, 0.2)' };
      default:
        return { bg: 'rgba(99, 102, 241, 0.1)', color: '#c7d2fe', border: '1px solid rgba(99, 102, 241, 0.2)' };
    }
  };

  return (
    <div className="academic-calendar-container">
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Academic Calendar</h1>
          <p className="card-desc">Keep track of key college terms, examinations, registration gates, and institutional holidays.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="btn btn-primary"
          >
            <Plus size={16} /> Add Calendar Event
          </button>
        )}
      </header>

      {/* ADMIN ADD EVENT MODAL/FORM */}
      {showAddForm && isAdmin && (
        <div className="dashboard-card" style={{ marginBottom: '24px', animation: 'fadeIn 0.25s' }}>
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <h3>Create Calendar Event</h3>
          </div>
          <form onSubmit={handleAddEvent} className="auth-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Event Title</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  placeholder="e.g. Semester Registration Open" 
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  required 
                  style={{ paddingLeft: '14px' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Event Category Type</label>
              <select 
                value={newEvent.event_type}
                onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
              >
                <option value="Event">General Campus Event</option>
                <option value="Holiday">Official Term Holiday</option>
                <option value="Exam Period">Examination block</option>
                <option value="Registration">Admission/Registration gate</option>
              </select>
            </div>

            <div className="input-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input 
                  type="checkbox" 
                  checked={newEvent.is_holiday}
                  onChange={(e) => setNewEvent({ ...newEvent, is_holiday: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Mark as College Holiday (Suspends classes)</span>
              </label>
            </div>

            <div className="input-group">
              <label>Start Date</label>
              <div className="input-wrapper">
                <input 
                  type="date" 
                  value={newEvent.start_date}
                  onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                  required
                  style={{ paddingLeft: '14px' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label>End Date</label>
              <div className="input-wrapper">
                <input 
                  type="date" 
                  value={newEvent.end_date}
                  onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                  required
                  style={{ paddingLeft: '14px' }}
                />
              </div>
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Description / Details</label>
              <textarea 
                rows={3}
                placeholder="Include campus guidelines, location, or notes..."
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
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

            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Event</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* CALENDAR DISPLAY PANEL */}
      <div className="grid-layout">
        {loading ? (
          <p>Syncing calendar events...</p>
        ) : events.length === 0 ? (
          <div className="dashboard-card" style={{ textAlign: 'center', padding: '40px' }}>
            <CalendarIcon size={40} className="logo-icon" style={{ opacity: '0.4', marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No upcoming calendar events schedules registered yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {Object.keys(groupedEvents).map(monthName => (
              <div key={monthName} className="month-group">
                <h3 style={{ 
                  color: 'white', 
                  fontSize: '18px', 
                  borderBottom: '2px solid var(--border-glass)', 
                  paddingBottom: '8px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CalendarIcon size={18} style={{ color: 'var(--primary)' }} />
                  {monthName}
                </h3>

                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {groupedEvents[monthName].map(ev => {
                    const badgeStyles = getEventTypeBadgeClass(ev.event_type);
                    return (
                      <div 
                        key={ev.id} 
                        className="dashboard-card" 
                        style={{ 
                          borderLeft: ev.is_holiday ? '4px solid var(--error)' : '4px solid var(--primary)',
                          background: 'rgba(255, 255, 255, 0.01)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span className="badge" style={{ 
                            background: badgeStyles.bg, 
                            color: badgeStyles.color, 
                            border: badgeStyles.border,
                            fontSize: '10px',
                            padding: '4px 8px'
                          }}>
                            {ev.event_type}
                          </span>
                          {isAdmin && (
                            <button 
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="btn btn-outline" 
                              style={{ padding: '4px', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                              title="Delete Event"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        <h4 style={{ color: 'white', fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>
                          {ev.title}
                        </h4>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            {ev.start_date === ev.end_date ? ev.start_date : `${ev.start_date} to ${ev.end_date}`}
                          </span>
                          {ev.is_holiday && (
                            <span style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertCircle size={12} /> Holiday
                            </span>
                          )}
                        </div>

                        {ev.description && (
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            {ev.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicCalendarView;
export { AcademicCalendarView };
