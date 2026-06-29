import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Sending verification code...');

    try {
      await forgotPassword(email);
      toast.success('Verification code sent successfully!', { id: toastId });
      // Redirect to ResetPassword screen
      navigate('/reset-password', { state: { email } });
    } catch (error: any) {
      const responseData = error.response?.data;
      const errorMsg = responseData?.message || 'Failed to send verification code. Check your email address.';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Forgot Password</h2>
          <p>Retrieve access code for your account</p>
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

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="btn-loading">
                <span className="spinner-mini"></span> Sending...
              </span>
            ) : (
              <>
                <KeyRound size={18} /> Send OTP Code
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

export default ForgotPassword;
