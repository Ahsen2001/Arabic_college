import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, MapPin, Mail, Phone, Clock } from 'lucide-react';
import api from '../api';

const Footer: React.FC = () => {
  const [logo, setLogo] = useState<string | null>(null);
  const [brandName, setBrandName] = useState('Arabic College');
  const [desc, setDesc] = useState('Promoting classical Arabic linguistics, Islamic jurisprudence, and Hadith sciences with contemporary academic standards.');
  const [contact, setContact] = useState({
    address: 'Ibnu Abbas Arabic College, Galle, Sri Lanka',
    email: 'info@arabiccollege.edu',
    phone: '+94 75460 3008',
  });

  useEffect(() => {
    api.get('/public/cms').then(res => {
      const data = res.data.data;
      if (data.college_logo) {
        setLogo(data.college_logo.startsWith('http') ? data.college_logo : `http://localhost:8000${data.college_logo}`);
      }
      if (data.college_name) {
        setBrandName(data.college_name);
      }
      if (data.cms_footer_desc) {
        setDesc(data.cms_footer_desc);
      }
      setContact({
        address: data.college_address || 'Ibnu Abbas Arabic College, Galle, Sri Lanka',
        email: data.college_email || 'info@arabiccollege.edu',
        phone: data.college_phone || '+94 75460 3008',
      });
    }).catch(err => {
      console.error('Footer failed to load branding:', err);
    });
  }, []);

  return (
    <footer className="public-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Col */}
          <div className="footer-col brand-col">
            <Link to="/" className="footer-logo">
              {logo ? (
                <img src={logo} alt="Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
              ) : (
                <BookOpen className="logo-icon" />
              )}
              <span>{brandName}</span>
            </Link>
            <p className="footer-desc">
              {desc}
            </p>
          </div>

          {/* Quick Links Col */}
          <div className="footer-col links-col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/programs">Academic Programs</Link></li>
              <li><Link to="/admissions">Admissions info</Link></li>
              <li><Link to="/teachers">Faculty Directory</Link></li>
              <li><Link to="/downloads">Downloads Center</Link></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="footer-col contact-col">
            <h4>Contact Info</h4>
            <ul className="contact-list">
              <li>
                <MapPin size={16} className="contact-icon" />
                <span>{contact.address}</span>
              </li>
              <li>
                <Mail size={16} className="contact-icon" />
                <span>{contact.email}</span>
              </li>
              <li>
                <Phone size={16} className="contact-icon" />
                <span>{contact.phone}</span>
              </li>
              <li>
                <Clock size={16} className="contact-icon" />
                <span>Sun - Thu: 08:00 AM - 04:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} {brandName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
