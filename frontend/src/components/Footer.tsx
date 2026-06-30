import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, MapPin, Mail, Phone, Clock } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="public-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Col */}
          <div className="footer-col brand-col">
            <Link to="/" className="footer-logo">
              <BookOpen className="logo-icon" />
              <span>Arabic College</span>
            </Link>
            <p className="footer-desc">
              Promoting classical Arabic linguistics, Islamic jurisprudence, and Hadith sciences with contemporary academic standards.
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
                <span>Ibnu Abbas Arabic College, Galle, Sri Lanka</span>
              </li>
              <li>
                <Mail size={16} className="contact-icon" />
                <span>info@arabiccollege.edu</span>
              </li>
              <li>
                <Phone size={16} className="contact-icon" />
                <span>+94 75460 3008</span>
              </li>
              <li>
                <Clock size={16} className="contact-icon" />
                <span>Sun - Thu: 08:00 AM - 04:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Arabic College of Sharia and Linguistic Sciences. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
