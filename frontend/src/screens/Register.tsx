import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Lock, UserPlus } from 'lucide-react';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirmation) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Creating account...');

    try {
      await register({
        name,
        email,
        phone: phone || undefined,
        password,
        password_confirmation: passwordConfirmation,
      });

      toast.success('Registration successful! Verification code sent.', { id: toastId });
      // Redirect to OTP verification with state prefilled
      navigate('/verify-otp', { state: { email } });
    } catch (error: any) {
      const responseData = error.response?.data;
      const errorMsg = responseData?.message || 'Registration failed. Please check input parameters.';
      
      if (responseData?.errors) {
        // Display validation errors nicely
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
          <h2>Create Account</h2>
          <p>Register as an applicant to Arabic College</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                id="name"
                type="text"
                placeholder="Ahmad Al-Harbi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                type="email"
                placeholder="ahmad@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="phone">Phone Number (Optional)</label>
            <div className="input-wrapper">
              <Phone className="input-icon" size={18} />
              <input
                id="phone"
                type="tel"
                placeholder="+966501234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
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
                <span className="spinner-mini"></span> Submitting...
              </span>
            ) : (
              <>
                <UserPlus size={18} /> Register
              </>
            )}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
