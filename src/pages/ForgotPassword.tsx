import React, { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { api, getErrorMessage } from '../utils/api';
import './Auth.css';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post<{ message?: string }>('/auth/forgot-password', { email });
      setMessage(res.message || 'If an account with that email exists, we sent a password reset link.');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send password reset email'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split display-side">
        <div className="display-content">
          <h1>Recover your <br /><span className="text-accent">CirQl</span> access.</h1>
          <p>We will send a short-lived reset link to your verified college email.</p>
        </div>
      </div>

      <div className="auth-split form-side">
        <button className="auth-back-btn" onClick={() => navigate('/login')}>
          <ArrowLeft size={18} /> Back to Login
        </button>

        <div className="auth-form-container">
          <div className="auth-logo-center">
            <Logo size={40} lightMode={true} className="auth-brand-logo" />
          </div>
          <h2 className="auth-heading">Reset Password</h2>
          <p className="auth-subheading">Enter your account email to receive a secure reset link.</p>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          <form className="premium-form" onSubmit={submit}>
            <div className="input-group">
              <label>College Email</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  placeholder="student@college.edu.in"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError('');
                  }}
                />
              </div>
            </div>

            <button type="submit" className="premium-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="auth-footer">
            Remembered it? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
