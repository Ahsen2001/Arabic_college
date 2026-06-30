import React, { useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Send, Clock, User, HelpCircle, CheckCircle } from 'lucide-react';

const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !subject || !message) {
      toast.error('Please fill out all fields.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting query...');

    try {
      const response = await api.post('/public/contact', {
        name,
        email,
        subject,
        message,
      });

      toast.success(response.data.message || 'Query submitted successfully!', { id: toastId });
      setSubmittedEmail(email);
      setSubmittedSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error: any) {
      const responseData = error.response?.data;
      const errorMsg = responseData?.message || 'Submission failed. Please check validation rules.';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="public-subpage contact-page">
      <header className="page-header">
        <div className="header-container">
          <h1>Contact Us</h1>
          <p>Get in touch with the Arabic College administration team</p>
        </div>
      </header>

      <section className="page-content">
        <div className="section-container">
          <div className="contact-split-layout">
            {/* Info panel */}
            <div className="contact-info-panel">
              <h2>Contact Information</h2>
              <p>For immediate registrar help, syllabus questions, or general campus guidance, reach out to us directly:</p>

              <div className="contact-info-cards">
                <div className="info-item-card">
                  <Phone className="info-icon" />
                  <div>
                    <h4>Registrar Office Phone</h4>
                    <p>+966 11 123 4567</p>
                  </div>
                </div>
                <div className="info-item-card">
                  <Mail className="info-icon" />
                  <div>
                    <h4>General Email Queries</h4>
                    <p>info@arabiccollege.edu</p>
                  </div>
                </div>
                <div className="info-item-card">
                  <MapPin className="info-icon" />
                  <div>
                    <h4>Academic Campus Address</h4>
                    <p>Academic Campus, Riyadh, Saudi Arabia</p>
                  </div>
                </div>
              </div>

              {/* Operational Hours */}
              <div className="operational-hours-card">
                <div className="operational-hours-title">
                  <Clock size={16} />
                  <span>Campus Operational Hours</span>
                </div>
                <div className="operational-hours-list">
                  <div className="operational-hours-row">
                    <span>Sunday - Thursday:</span>
                    <span>8:00 AM - 4:00 PM</span>
                  </div>
                  <div className="operational-hours-row">
                    <span>Friday - Saturday:</span>
                    <span style={{ color: 'var(--error)' }}>Closed</span>
                  </div>
                </div>
              </div>

              {/* Riyadh Campus Vector Map Illustration */}
              <div className="contact-campus-map-card">
                <img src="/assets/college_campus_map.png" alt="Riyadh Campus Location Map Illustration" />
              </div>
            </div>

            {/* Form panel */}
            <div className="contact-form-panel">
              {submittedSuccess ? (
                <div className="dashboard-card text-center" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', animation: 'fadeIn 0.3s ease-out' }}>
                  <CheckCircle size={48} style={{ color: 'var(--success)' }} />
                  <h3 style={{ fontWeight: '700' }}>Message Submitted!</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', maxWidth: '360px', margin: '0 auto', textAlign: 'center' }}>
                    Thank you. We have successfully received your query parameters. Our registrar administration team will review and reply to <strong>{submittedEmail}</strong> shortly.
                  </p>
                  <button 
                    onClick={() => setSubmittedSuccess(false)} 
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: '10px' }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <h2>Send a Query Message</h2>
                  <form onSubmit={handleSubmit} className="auth-form contact-form">
                    <div className="input-group">
                      <label htmlFor="name">Your Name</label>
                      <div className="input-wrapper">
                        <User className="input-icon" size={16} />
                        <input
                          id="name"
                          type="text"
                          placeholder="Enter your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={isSubmitting}
                          required
                          style={{ paddingLeft: '44px' }}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="email">Email Address</label>
                      <div className="input-wrapper">
                        <Mail className="input-icon" size={16} />
                        <input
                          id="email"
                          type="email"
                          placeholder="ahmad@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isSubmitting}
                          required
                          style={{ paddingLeft: '44px' }}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="subject">Subject Topic</label>
                      <div className="input-wrapper">
                        <HelpCircle className="input-icon" size={16} />
                        <input
                          id="subject"
                          type="text"
                          placeholder="e.g. Placement exam criteria"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          disabled={isSubmitting}
                          required
                          style={{ paddingLeft: '44px' }}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="message">Your Message</label>
                      <div style={{ position: 'relative' }}>
                        <textarea
                          id="message"
                          rows={5}
                          maxLength={1000}
                          placeholder="Type your message guidelines here..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          disabled={isSubmitting}
                          required
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '14px',
                            outline: 'none',
                            resize: 'vertical',
                            transition: 'all 0.3s'
                          }}
                        />
                        <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {message.length} / 1000 characters
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', marginTop: '10px' }}>
                      {isSubmitting ? (
                        <span className="btn-loading" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                          <span className="spinner-mini"></span> Submitting Query...
                        </span>
                      ) : (
                        <>
                          <Send size={16} /> Submit Query Message
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
