import React, { useMemo, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { api, getErrorMessage } from '../utils/api';
import './Auth.css';

const validatePassword = (value: string) => {
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(value)) return 'Password must contain at least one number.';
  if (!/[\W_]/.test(value)) return 'Password must contain at least one special character.';
  return '';
};

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordHint = useMemo(() => validatePassword(password), [password]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Reset link is missing or invalid. Request a new reset link.');
      return;
    }
    if (passwordHint) {
      setError(passwordHint);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ message?: string }>('/auth/reset-password', {
        token,
        newPassword: password,
      });
      setMessage(res.message || 'Password reset successfully. Please log in.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reset password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split display-side">
        <div className="display-content">
          <h1>Set a fresh <br /><span className="text-accent">password.</span></h1>
          <p>Your reset link expires quickly, so choose a strong password and get back into your campus marketplace.</p>
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
          <h2 className="auth-heading">New Password</h2>
          <p className="auth-subheading">Use at least 8 characters with uppercase, number, and symbol.</p>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          <form className="premium-form" onSubmit={submit}>
            <div className="input-group">
              <label>New Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Strong password"
                  required
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                  }}
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (
                <div className="campus-detect-text" style={{ color: passwordHint ? 'var(--danger)' : 'var(--accent)' }}>
                  {passwordHint || 'Password looks good.'}
                </div>
              )}
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Repeat password"
                  required
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setError('');
                  }}
                />
              </div>
            </div>

            <button type="submit" className="premium-btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="auth-footer">
            Need a new link? <Link to="/forgot-password">Request reset</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
