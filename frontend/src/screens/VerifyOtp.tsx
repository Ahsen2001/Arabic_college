import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';

const VerifyOtp: React.FC = () => {
  const { verifyOtp, resendOtp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (location.state && (location.state as any).email) {
      setEmail((location.state as any).email);
    } else {
      toast.error('Email not found. Please enter it manually.');
    }
  }, [location]);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const val = element.value;
    if (isNaN(Number(val))) return;

    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    // Auto-focus next field
    if (val && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (pasteData.length !== 6 || isNaN(Number(pasteData))) return;

    const newOtp = pasteData.split('');
    setOtp(newOtp);
    inputRefs.current[5].focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter the complete 6-digit verification code.');
      return;
    }
    if (!email) {
      toast.error('Please specify the email address.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Verifying code...');

    try {
      await verifyOtp(email, code);
      toast.success('Email verified successfully! You can now login.', { id: toastId });
      navigate('/login');
    } catch (error: any) {
      const responseData = error.response?.data;
      const errorMsg = responseData?.message || 'Verification failed. Please double-check the OTP.';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;

    setIsResending(true);
    const toastId = toast.loading('Resending verification code...');

    try {
      await resendOtp(email);
      toast.success('A new verification code has been sent!', { id: toastId });
      setTimer(60);
      setCanResend(false);
      setOtp(Array(6).fill(''));
      inputRefs.current[0].focus();
    } catch (error: any) {
      const responseData = error.response?.data;
      const errorMsg = responseData?.message || 'Failed to resend code. Please try again.';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Verify Account</h2>
          <p>We've sent a 6-digit code to {email || 'your email'}</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {!email && (
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className="otp-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                ref={(el) => {
                  if (el) inputRefs.current[index] = el;
                }}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                disabled={isSubmitting}
                className="otp-box"
              />
            ))}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="btn-loading">
                <span className="spinner-mini"></span> Verifying...
              </span>
            ) : (
              <>
                <CheckCircle2 size={18} /> Verify OTP
              </>
            )}
          </button>
        </form>

        <div className="resend-row">
          {canResend ? (
            <button
              onClick={handleResend}
              className="btn-link flex-center"
              disabled={isResending}
            >
              <RefreshCw size={14} className={isResending ? 'spin' : ''} /> Resend OTP
            </button>
          ) : (
            <p className="timer-text">Resend code in {timer}s</p>
          )}
        </div>

        <div className="auth-footer flex-center-col">
          <Link to="/login" className="back-link">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
