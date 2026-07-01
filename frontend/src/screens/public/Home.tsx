import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { ArrowRight, ChevronLeft, ChevronRight, Bell, Calendar, Award, BookMarked, Users } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
}

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [activeSlide, setActiveSlide] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [collegeName, setCollegeName] = useState('Arabic College of Sharia Sciences');
  const [admissionOpen, setAdmissionOpen] = useState(true);
  const [hasCustomSlides, setHasCustomSlides] = useState(false);

  const defaultSlides = [
    {
      title: 'Excellence in Islamic Sharia Jurisprudence',
      description: 'Preserving classical legal traditions with rigorous scientific analysis and contemporary contexts.',
      image: '/assets/hero_sharia.png',
      cta: 'View Programs',
      link: '/programs',
    },
    {
      title: 'Arabic Linguistics & Classical Literature',
      description: 'Explore the depths of grammar, morphology, syntax, and rhetoric of classical Arabic.',
      image: '/assets/hero_linguistics.png',
      cta: 'Explore Faculty',
      link: '/teachers',
    },
    {
      title: 'Hadith Sciences Research Center',
      description: 'Academic cataloging and critiquing narration chains using advanced scientific methodology.',
      image: '/assets/college_campus.png',
      cta: 'Admissions Open',
      link: '/admissions',
    },
  ];
  const [slides, setSlides] = useState(defaultSlides);

  const activeSlides = useMemo(() => {
    if (hasCustomSlides) return slides;
    return [
      {
        title: t('home.hero_slide1_title'),
        description: t('home.hero_slide1_desc'),
        image: '/assets/hero_sharia.png',
        cta: t('home.hero_slide1_cta'),
        link: '/programs',
      },
      {
        title: t('home.hero_slide2_title'),
        description: t('home.hero_slide2_desc'),
        image: '/assets/hero_linguistics.png',
        cta: t('home.hero_slide2_cta'),
        link: '/teachers',
      },
      {
        title: t('home.hero_slide3_title'),
        description: t('home.hero_slide3_desc'),
        image: '/assets/college_campus.png',
        cta: t('home.hero_slide3_cta'),
        link: '/admissions',
      },
    ];
  }, [hasCustomSlides, slides, t]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch CMS settings for dynamic content
        const cmsResponse = await api.get('/public/cms');
        const cms = cmsResponse.data.data;
        if (cms.college_name) setCollegeName(cms.college_name);
        if (cms.admission_status !== undefined) setAdmissionOpen(cms.admission_status === '1' || cms.admission_status === true);
        if (cms.cms_home_hero && Array.isArray(cms.cms_home_hero) && cms.cms_home_hero.length > 0) {
          setSlides(cms.cms_home_hero);
          setHasCustomSlides(true);
        }
      } catch {
        // silently fall back to defaults
      }

      try {
        const response = await api.get('/public/news-events');
        setAnnouncements(response.data.data.announcements);
        setEvents(response.data.data.events);
      } catch (error) {
        console.error('Failed to load public website news/events. Falling back to static placeholders.', error);
        setAnnouncements([
          { id: 1, title: 'Fall Semester 2026 Admissions Open', content: 'Applications are now being accepted for all degree tracks.', date: '2026-06-25' },
          { id: 2, title: 'Digital Library Services Active', content: 'Search references, renew borrows, and access catalog assets online.', date: '2026-06-28' }
        ]);
        setEvents([
          { id: 1, title: 'Arabic Calligraphy Masterclass', description: 'A workshop covering Thuluth and Naskh scripts.', date: '2026-07-10', time: '10:00 AM - 01:00 PM', location: 'Main Academic Hall B' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Automatic slider interval
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % activeSlides.length);
    }, 6000);
    return () => clearInterval(slideInterval);
  }, [activeSlides.length]);

  const prevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % activeSlides.length);
  };

  return (
    <div className="home-page">
      {/* Hero Slider Section */}
      <section className="hero-slider-section">
        <div className="slider-wrapper">
          {activeSlides.map((slide, idx) => (
            <div
              key={idx}
              className={`slide-item ${idx === activeSlide ? 'active' : ''}`}
              style={{ backgroundImage: `linear-gradient(rgba(9, 13, 22, 0.75), rgba(9, 13, 22, 0.85)), url(${slide.image})` }}
            >
              <div className="slide-content">
                <h2>{slide.title}</h2>
                <p>{slide.description}</p>
                <Link to={slide.link} className="btn btn-primary">
                  {slide.cta} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Slide Controls */}
        <button className="slider-arrow arrow-left" onClick={prevSlide} aria-label="Previous slide">
          <ChevronLeft size={24} />
        </button>
        <button className="slider-arrow arrow-right" onClick={nextSlide} aria-label="Next slide">
          <ChevronRight size={24} />
        </button>

        {/* Slide Dots */}
        <div className="slider-dots">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              className={`dot-item ${idx === activeSlide ? 'active' : ''}`}
              onClick={() => setActiveSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* College Highlights Quick Stats */}
      <section className="highlights-section">
        <div className="section-container grid-3">
          <div className="stat-card">
            <Award size={36} className="stat-icon" />
            <h3>{t('home.qualified_faculty')}</h3>
            <p>{t('home.qualified_faculty_desc')}</p>
          </div>
          <div className="stat-card">
            <BookMarked size={36} className="stat-icon" />
            <h3>{t('home.academic_excellence')}</h3>
            <p>{t('home.academic_excellence_desc')}</p>
          </div>
          <div className="stat-card">
            <Users size={36} className="stat-icon" />
            <h3>{t('home.rich_student_life')}</h3>
            <p>{t('home.rich_student_life_desc')}</p>
          </div>
        </div>
      </section>

      {/* Announcements and Events Section */}
      <section className="news-events-section">
        <div className="section-container">
          <div className="news-events-grid">
            {/* Announcements */}
            <div className="announcements-column">
              <div className="column-title">
                <Bell className="title-icon" />
                <h3>{t('home.latest_announcements')}</h3>
              </div>
              <div className="announcements-list">
                {loading ? (
                  <div className="spinner-center"><div className="spinner-mini"></div> {t('home.loading')}</div>
                ) : announcements.length > 0 ? (
                  announcements.map((ann) => (
                    <div key={ann.id} className="news-card">
                      <span className="card-date">{ann.date}</span>
                      <h4>{ann.title}</h4>
                      <p>{ann.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="no-data">{t('home.no_announcements')}</p>
                )}
              </div>
            </div>

            {/* Events */}
            <div className="events-column">
              <div className="column-title">
                <Calendar className="title-icon" />
                <h3>{t('home.upcoming_events')}</h3>
              </div>
              <div className="events-list">
                {loading ? (
                  <div className="spinner-center"><div className="spinner-mini"></div> {t('home.loading')}</div>
                ) : events.length > 0 ? (
                  events.map((evt) => (
                    <div key={evt.id} className="event-card">
                      <div className="event-badge">
                        <span className="event-day">{new Date(evt.date).getDate()}</span>
                        <span className="event-month">
                          {new Date(evt.date).toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                      <div className="event-details">
                        <h4>{evt.title}</h4>
                        <p className="event-desc">{evt.description}</p>
                        <p className="event-meta">
                          <span>{evt.time}</span> | <span>{evt.location}</span>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">{t('home.no_events')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Admissions Call to Action */}
      {admissionOpen && (
      <section className="cta-admissions-section">
        <div className="cta-container">
          <h2>{t('home.apply_admissions')}</h2>
          <p>{t('home.apply_desc', { collegeName })}</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            {t('home.start_application')} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      )}
    </div>
  );
};

export default Home;
