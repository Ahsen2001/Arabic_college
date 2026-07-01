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

  const primaryLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.about'), path: '/about' },
    { name: t('nav.news'), path: '/news' },
    { name: t('nav.downloads'), path: '/downloads' },
    { name: t('nav.contact'), path: '/contact' },
  ];

  const remainingLinks = [
    { name: t('nav.programs'), path: '/programs' },
    { name: t('nav.admissions'), path: '/admissions' },
    { name: t('nav.teachers'), path: '/teachers' },
    { name: t('nav.gallery'), path: '/gallery' },
    { name: t('nav.faq'), path: '/faq' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const renderLanguageSelector = () => {
    const currentLang = i18n.language ? i18n.language.split('-')[0].split('_')[0] : 'ar';
    return (
      <select 
        value={currentLang} 
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="lang-selector-select"
        aria-label={t('nav.select_language')}
        title={t('nav.select_language')}
      >
        <option value="en">English</option>
        <option value="ar">العربية (Arabic)</option>
        <option value="ta">தமிழ் (Tamil)</option>
        <option value="si">සිංහල (Sinhala)</option>
      </select>
    );
  };

  return (
    <nav className="public-navbar">
      <div className="nav-container">
        <Link to="/" className="navbar-logo">
          {logo ? (
            <img 
              src={logo} 
              alt="Logo" 
              className="navbar-logo-img" 
              onError={() => setLogo(null)}
            />
          ) : (
            <BookOpen className="logo-icon" />
          )}
          <span>{abbreviation}</span>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links-desktop">
          {primaryLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link-item ${isActive(link.path) ? 'active' : ''}`}
            >
              {link.name}
            </Link>
          ))}
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm nav-btn">
              <User size={14} /> {t('nav.dashboard')}
            </Link>
          ) : (
            <Link to="/login" className="btn btn-outline btn-sm nav-btn">
              {t('nav.portal_login')}
            </Link>
          )}
          {renderLanguageSelector()}
          <button 
            onClick={toggleTheme} 
            className="btn btn-outline btn-sm btn-theme-toggle-desktop"
            title="Toggle Light/Dark Theme"
          >
            {isLightTheme ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={toggleMenu} className="nav-toggle-desktop" aria-label="Toggle menu">
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Actions Container */}
        <div className="mobile-actions-container">
          {renderLanguageSelector()}
          <button 
            onClick={toggleTheme} 
            className="btn-theme-toggle-mobile"
            title="Toggle Light/Dark Theme"
          >
            {isLightTheme ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={toggleMenu} className="nav-toggle-mobile" aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile/Desktop Drawer */}
      <div className={`nav-drawer-mobile ${isOpen ? 'open' : ''}`}>
        <div className="drawer-links">
          {/* Main links visible in drawer on mobile, hidden on desktop */}
          <div className="drawer-main-links-only-mobile">
            {primaryLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={toggleMenu}
                className={`drawer-link-item ${isActive(link.path) ? 'active' : ''}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Remaining links always visible in the drawer */}
          {remainingLinks.map((link) => (
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
