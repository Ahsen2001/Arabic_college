import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Send, Clock, User, HelpCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Contact: React.FC = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const [contactInfo, setContactInfo] = useState({
    phone: '+966 11 123 4567',
    email: 'info@arabiccollege.edu',
    address: 'Academic Campus, Riyadh, Saudi Arabia',
  });

  useEffect(() => {
    api.get('/public/cms').then(res => {
      const data = res.data.data;
      setContactInfo({
        phone: data.college_phone || '+966 11 123 4567',
        email: data.college_email || 'info@arabiccollege.edu',
        address: data.college_address || 'Academic Campus, Riyadh, Saudi Arabia',
      });
    }).catch(err => {
      console.error('Failed to load contact CMS info:', err);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !subject || !message) {
      toast.error(t('contact.toast_fill_fields'));
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(t('contact.toast_submitting'));

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
          <h1>{t('contact.title')}</h1>
          <p>{t('contact.subtitle')}</p>
        </div>
      </header>

      <section className="page-content">
        <div className="section-container">
          <div className="contact-split-layout">
            {/* Info panel */}
            <div className="contact-info-panel">
              <h2>{t('contact.info_title')}</h2>
              <p>{t('contact.info_desc')}</p>

              <div className="contact-info-cards">
                <div className="info-item-card">
                  <Phone className="info-icon" />
                  <div>
                    <h4>{t('contact.phone_label')}</h4>
                    <p>{contactInfo.phone}</p>
                  </div>
                </div>
                <div className="info-item-card">
                  <Mail className="info-icon" />
                  <div>
                    <h4>{t('contact.email_label')}</h4>
                    <p>{contactInfo.email}</p>
                  </div>
                </div>
                <div className="info-item-card">
                  <MapPin className="info-icon" />
                  <div>
                    <h4>{t('contact.address_label')}</h4>
                    <p>{contactInfo.address}</p>
                  </div>
                </div>
              </div>

              {/* Operational Hours */}
              <div className="operational-hours-card">
                <div className="operational-hours-title">
                  <Clock size={16} />
                  <span>{t('contact.hours_title')}</span>
                </div>
                <div className="operational-hours-list">
                  <div className="operational-hours-row">
                    <span>{t('contact.days_week')}</span>
                    <span>8:00 AM - 4:00 PM</span>
                  </div>
                  <div className="operational-hours-row">
                    <span>{t('contact.days_weekend')}</span>
                    <span style={{ color: 'var(--error)' }}>{t('contact.closed')}</span>
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
                  <h3 style={{ fontWeight: '700' }}>{t('contact.msg_submitted')}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', maxWidth: '360px', margin: '0 auto', textAlign: 'center' }}>
                    {t('contact.msg_success_desc', { email: submittedEmail })}
                  </p>
                  <button 
                    onClick={() => setSubmittedSuccess(false)} 
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: '10px' }}
                  >
                    {t('contact.send_another')}
                  </button>
                </div>
              ) : (
                <>
                  <h2>{t('contact.send_msg_title')}</h2>
                  <form onSubmit={handleSubmit} className="auth-form contact-form">
                    <div className="input-group">
                      <label htmlFor="name">{t('contact.form_name')}</label>
                      <div className="input-wrapper">
                        <User className="input-icon" size={16} />
                        <input
                          id="name"
                          type="text"
                          placeholder={t('contact.placeholder_name')}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={isSubmitting}
                          required
                          style={{ paddingLeft: '44px' }}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="email">{t('contact.form_email')}</label>
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
                      <label htmlFor="subject">{t('contact.form_subject')}</label>
                      <div className="input-wrapper">
                        <HelpCircle className="input-icon" size={16} />
                        <input
                          id="subject"
                          type="text"
                          placeholder={t('contact.placeholder_subject')}
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          disabled={isSubmitting}
                          required
                          style={{ paddingLeft: '44px' }}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="message">{t('contact.form_message')}</label>
                      <div style={{ position: 'relative' }}>
                        <textarea
                          id="message"
                          rows={5}
                          maxLength={1000}
                          placeholder={t('contact.placeholder_message')}
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
                          {t('contact.char_counter', { length: message.length })}
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', marginTop: '10px' }}>
                      {isSubmitting ? (
                        <span className="btn-loading" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                          <span className="spinner-mini"></span> {t('contact.submitting')}
                        </span>
                      ) : (
                        <>
                          <Send size={16} /> {t('contact.submit_btn')}
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
