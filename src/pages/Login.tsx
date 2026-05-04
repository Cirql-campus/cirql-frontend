import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { detectCollege } from '../utils/collegeDetect';
import './Auth.css';

export const Login = () => {
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const detectedCampus = useMemo(() => detectCollege(email)?.college || null, [email]);

  useEffect(() => {
    if (isLoggedIn) navigate('/marketplace', { replace: true });
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      navigate('/marketplace');
    } else {
      setError(result.error || 'Login failed.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split display-side">
        <div className="display-content">
          <div className="abstract-graphic">
            <div className="abstract-ring r1"></div>
            <div className="abstract-ring r2"></div>
            <div className="abstract-glass"></div>
          </div>
          <h1>Reenter the <br /><span className="text-accent">Campus</span> Market.</h1>
          <p>Access hyper-local deals, zero-commission trading, and instant connections with your peers.</p>
        </div>
      </div>

      <div className="auth-split form-side">
        <button className="auth-back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Back to Homepage
        </button>

        <div className="auth-form-container">
          <div className="auth-logo-center">
            <Logo size={40} lightMode={true} className="auth-brand-logo" />
          </div>
          <h2 className="auth-heading">Welcome Back</h2>
          <p className="auth-subheading">Sign in to your campus marketplace account.</p>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form className="premium-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>College ID / University Email</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  placeholder="student@college.edu.in"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                />
              </div>
              {email && (
                <div className="campus-detect-text" style={{ color: detectedCampus ? 'var(--accent)' : 'var(--gray-400)' }}>
                  {detectedCampus ? `Welcome back, ${detectedCampus} student` : 'Type your university email...'}
                </div>
              )}
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Link to="/forgot-password" className="forgot-pass-link">Forgot password?</Link>
            </div>

            <button type="submit" className="premium-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Sign up for free</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
