import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, ShieldAlert, Lock, CheckCircle2, ArrowLeft } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location.state && (location.state as any).email) {
      setEmail((location.state as any).email);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP code.');
      return;
    }

    if (password !== passwordConfirmation) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Resetting password...');

    try {
      await resetPassword({
        email,
        otp,
        password,
        password_confirmation: passwordConfirmation,
      });

      toast.success('Password reset successful! Please login.', { id: toastId });
      navigate('/login');
    } catch (error: any) {
      const responseData = error.response?.data;
      const errorMsg = responseData?.message || 'Failed to reset password. Check the OTP code.';
      
      if (responseData?.errors) {
        const validationErrors = Object.values(responseData.errors).flat().join(' ');
        toast.error(validationErrors, { id: toastId });
      } else {
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
          <h2>Reset Password</h2>
          <p>Enter the OTP code sent to your email to set a new password</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
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
            <label htmlFor="otp">Verification Code (OTP)</label>
            <div className="input-wrapper">
              <ShieldAlert className="input-icon" size={18} />
              <input
                id="otp"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">New Password</label>
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

          <div className="input-group">
            <label htmlFor="password_confirmation">Confirm Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="password_confirmation"
                type="password"
                placeholder="••••••••"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="btn-loading">
                <span className="spinner-mini"></span> Resetting...
              </span>
            ) : (
              <>
                <CheckCircle2 size={18} /> Reset Password
              </>
            )}
          </button>
        </form>
        <div className="auth-footer flex-center-col">
          <Link to="/login" className="back-link">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
