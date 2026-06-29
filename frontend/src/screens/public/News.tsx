import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Bell, Calendar, MapPin, Clock } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
  type: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
}

const News: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'announcements' | 'events'>('all');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewsEvents = async () => {
      try {
        const response = await api.get('/public/news-events');
        setAnnouncements(response.data.data.announcements);
        setEvents(response.data.data.events);
      } catch (error) {
        console.error("Failed to fetch public news/events. Using placeholders.", error);
        setAnnouncements([
          {
            id: 1,
            title: 'Fall Semester 2026 Registrations Open',
            content: 'Applications are now being accepted for B-Sharia, B-Arabic, and B-Hadith programs for the academic year 2026/2027. Apply online through our admissions portal.',
            date: '2026-06-25',
            type: 'announcement',
          },
          {
            id: 2,
            title: 'Digital Library Catalog Launch',
            content: 'We are pleased to introduce our digital catalog system. Students can now search books, renew loans, and inspect reference availability online.',
            date: '2026-06-28',
            type: 'announcement',
          },
        ]);
        setEvents([
          {
            id: 1,
            title: 'Arabic Calligraphy Masterclass',
            description: 'A workshop covering Thuluth and Naskh scripts, hosted by Sheikh Dr. Bilal Al-Madani.',
            date: '2026-07-10',
            time: '10:00 AM - 01:00 PM',
            location: 'Main Academic Hall B',
            type: 'event',
          },
          {
            id: 2,
            title: 'Symposium on Hadith Methodology',
            description: 'A classical research paper discussion regarding narrator critic analysis in modern database compilation.',
            date: '2026-07-20',
            time: '09:00 AM - 04:00 PM',
            location: 'Library Conference Hall',
            type: 'event',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNewsEvents();
  }, []);

  return (
    <div className="public-subpage news-page">
      <header className="page-header">
        <div className="header-container">
          <h1>News & Events</h1>
          <p>Stay up to date with the latest activities, timetables, and academic bulletins</p>
        </div>
      </header>

      <section className="page-content">
        <div className="section-container">
          {/* Tab Filter */}
          <div className="news-tabs">
            <button
              onClick={() => setActiveTab('all')}
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            >
              All Updates
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
            >
              <Bell size={14} style={{ marginRight: '6px' }} /> Announcements
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            >
              <Calendar size={14} style={{ marginRight: '6px' }} /> Events
            </button>
          </div>

          {loading ? (
            <div className="spinner-center">
              <div className="spinner"></div>
              <p>Loading news bulletin...</p>
            </div>
          ) : (
            <div className="bulletin-list">
              {/* Announcements rendering */}
              {(activeTab === 'all' || activeTab === 'announcements') &&
                announcements.map((ann) => (
                  <div key={`ann-${ann.id}`} className="bulletin-card announcement-card">
                    <div className="bulletin-card-header">
                      <span className="bulletin-tag tag-announcement">
                        <Bell size={12} /> Announcement
                      </span>
                      <span className="bulletin-date">{ann.date}</span>
                    </div>
                    <h3>{ann.title}</h3>
                    <p>{ann.content}</p>
                  </div>
                ))}

              {/* Events rendering */}
              {(activeTab === 'all' || activeTab === 'events') &&
                events.map((evt) => (
                  <div key={`evt-${evt.id}`} className="bulletin-card event-detail-card">
                    <div className="bulletin-card-header">
                      <span className="bulletin-tag tag-event">
                        <Calendar size={12} /> Event
                      </span>
                      <span className="bulletin-date">
                        {new Date(evt.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <h3>{evt.title}</h3>
                    <p>{evt.description}</p>
                    
                    <div className="event-meta-grid">
                      <div className="meta-pill">
                        <Clock size={14} />
                        <span>{evt.time}</span>
                      </div>
                      <div className="meta-pill">
                        <MapPin size={14} />
                        <span>{evt.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default News;
