import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, X, BookOpen, User, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [abbreviation, setAbbreviation] = useState('Arabic College');
  
  const { t, i18n } = useTranslation();
  const { isLightTheme, toggleTheme } = useTheme();
  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    api.get('/public/cms').then(res => {
      const data = res.data.data;
      if (data.college_logo) {
        setLogo(data.college_logo.startsWith('http') ? data.college_logo : `http://localhost:8000${data.college_logo}`);
      }
      if (data.college_abbreviation) {
        setAbbreviation(data.college_abbreviation);
      }
    }).catch(err => {
      console.error('Navbar failed to load branding:', err);
    });
  }, []);

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.about'), path: '/about' },
    { name: t('nav.programs'), path: '/programs' },
    { name: t('nav.admissions'), path: '/admissions' },
    { name: t('nav.teachers'), path: '/teachers' },
    { name: t('nav.news'), path: '/news' },
    { name: t('nav.gallery'), path: '/gallery' },
    { name: t('nav.downloads'), path: '/downloads' },
    { name: t('nav.faq'), path: '/faq' },
    { name: t('nav.contact'), path: '/contact' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const renderLanguageSelector = (style: React.CSSProperties = {}) => (
    <select 
      value={i18n.language} 
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="lang-selector-select"
      aria-label={t('nav.select_language')}
      title={t('nav.select_language')}
      style={{
        background: 'rgba(15, 23, 42, 0.8)',
        color: 'white',
        border: '1px solid var(--border-glass)',
        borderRadius: '8px',
        padding: '6px 10px',
        fontSize: '13px',
        outline: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        ...style
      }}
    >
      <option value="en" style={{ color: '#0f172a' }}>English</option>
      <option value="ar" style={{ color: '#0f172a' }}>العربية (Arabic)</option>
      <option value="ta" style={{ color: '#0f172a' }}>தமிழ் (Tamil)</option>
      <option value="si" style={{ color: '#0f172a' }}>සිංහල (Sinhala)</option>
    </select>
  );

  return (
    <nav className="public-navbar">
      <div className="nav-container">
        <Link to="/" className="navbar-logo">
          {logo ? (
            <img src={logo} alt="Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
          ) : (
            <BookOpen className="logo-icon" />
          )}
          <span>{abbreviation}</span>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center' }}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link-item ${isActive(link.path) ? 'active' : ''}`}
            >
              {link.name}
            </Link>
          ))}
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm nav-btn" style={{ marginLeft: '10px' }}>
              <User size={14} /> {t('nav.dashboard')}
            </Link>
          ) : (
            <Link to="/login" className="btn btn-outline btn-sm nav-btn" style={{ marginLeft: '10px' }}>
              {t('nav.portal_login')}
            </Link>
          )}
          {renderLanguageSelector({ marginLeft: '10px', marginRight: '10px' })}
          <button 
            onClick={toggleTheme} 
            className="btn btn-outline btn-sm"
            style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Toggle Light/Dark Theme"
          >
            {isLightTheme ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* Mobile Actions Container */}
        <div className="mobile-actions-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {renderLanguageSelector({ padding: '4px 6px', fontSize: '12px' })}
          <button 
            onClick={toggleTheme} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Toggle Light/Dark Theme"
          >
            {isLightTheme ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={toggleMenu} className="nav-toggle-mobile" aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`nav-drawer-mobile ${isOpen ? 'open' : ''}`}>
        <div className="drawer-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={toggleMenu}
              className={`drawer-link-item ${isActive(link.path) ? 'active' : ''}`}
            >
              {link.name}
            </Link>
          ))}
          {user ? (
            <Link to="/dashboard" onClick={toggleMenu} className="btn btn-primary btn-sm drawer-btn">
              <User size={14} /> {t('nav.dashboard')}
            </Link>
          ) : (
            <Link to="/login" onClick={toggleMenu} className="btn btn-outline btn-sm drawer-btn">
              {t('nav.portal_login')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
