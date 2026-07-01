import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Authenticating user...');

    try {
      await login({ email, password, remember_me: rememberMe });
      toast.success('Successfully logged in!', { id: toastId });
      navigate('/');
    } catch (error: any) {
      const responseData = error.response?.data;
      
      if (responseData?.errors?.email && responseData.errors.email.includes('email_unverified')) {
        toast.error('Email is not verified. Redirecting to OTP verification...', { id: toastId });
        navigate('/verify-otp', { state: { email } });
      } else {
        const errorMsg = responseData?.message || 'Login failed. Please check your credentials.';
        toast.error(errorMsg, { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{t('login.welcome_back')}</h2>
          <p>{t('login.login_desc')}</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">{t('login.email_address')}</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div className="label-row">
              <label htmlFor="password">{t('login.password')}</label>
              <Link to="/forgot-password" className="forgot-link">
                {t('login.forgot_password')}
              </Link>
            </div>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="row-spaced">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting}
              />
              <span className="checkmark"></span>
              {t('login.remember_me')}
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="btn-loading">
                <span className="spinner-mini"></span> {t('login.authenticating')}
              </span>
            ) : (
              <>
                <LogIn size={18} /> {t('login.login_btn')}
              </>
            )}
          </button>
        </form>
        <div className="auth-footer">
          {t('login.no_account')} <Link to="/register">{t('login.register_here')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
