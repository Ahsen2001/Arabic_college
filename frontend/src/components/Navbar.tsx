import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, X, BookOpen, User, Sun, Moon } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const { isLightTheme, toggleTheme } = useTheme();
  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Programs', path: '/programs' },
    { name: 'Admissions', path: '/admissions' },
    { name: 'Teachers', path: '/teachers' },
    { name: 'News', path: '/news' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Downloads', path: '/downloads' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="public-navbar">
      <div className="nav-container">
        <Link to="/" className="navbar-logo">
          <BookOpen className="logo-icon" />
          <span>Arabic College</span>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links-desktop">
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
            <Link to="/dashboard" className="btn btn-primary btn-sm nav-btn">
              <User size={14} /> Dashboard
            </Link>
          ) : (
            <Link to="/login" className="btn btn-outline btn-sm nav-btn">
              Portal Login
            </Link>
          )}
          <button 
            onClick={toggleTheme} 
            className="btn btn-outline btn-sm"
            style={{ padding: '8px', marginLeft: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Toggle Light/Dark Theme"
          >
            {isLightTheme ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* Mobile Actions Container */}
        <div className="mobile-actions-container">
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
              <User size={14} /> Dashboard
            </Link>
          ) : (
            <Link to="/login" onClick={toggleMenu} className="btn btn-outline btn-sm drawer-btn">
              Portal Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
