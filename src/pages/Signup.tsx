import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { detectCollege } from '../utils/collegeDetect';
import { PasswordRequirements, passwordMeetsRequirements } from '../components/ui/PasswordRequirements';
import './Auth.css';

export const Signup = () => {
  const navigate = useNavigate();
  const { signup, verifyOTP, isLoggedIn } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);

  const detectedCampus = useMemo(() => detectCollege(email)?.college || null, [email]);

  useEffect(() => {
    if (isLoggedIn && !showOTP) navigate('/marketplace', { replace: true });
  }, [isLoggedIn, navigate, showOTP]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) return setError('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(password)) return setError('Password must contain at least one lowercase letter');
    if (!/[0-9]/.test(password)) return setError('Password must contain at least one number');
    if (!/[^a-zA-Z0-9]/.test(password)) return setError('Password must contain at least one special character');

    setLoading(true);
    const result = await signup(name, email, password);
    setLoading(false);
    if (result.ok) {
      setShowOTP(true);
    } else {
      setError(result.error || 'Signup failed.');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await verifyOTP(email, otp);
    setLoading(false);
    if (result.ok) {
      navigate('/marketplace');
    } else {
      setError(result.error || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split display-side alt-display">
        <div className="display-content">
          <div className="abstract-graphic">
            <div className="abstract-ring r1 alt"></div>
            <div className="abstract-ring r2 alt"></div>
            <div className="abstract-glass"></div>
          </div>
          <h1>Join the <br /><span className="text-accent">Movement</span>.</h1>
          <p>Over 2,400+ students are already trading sustainably on campus. Start your journey today.</p>
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
          {!showOTP ? (
            <>
              <h2 className="auth-heading">Create Account</h2>
              <p className="auth-subheading">Your campus email is your admission pass.</p>

              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              <form className="premium-form" onSubmit={handleSubmit}>
                <div className="input-group">
                  <label>Full Name</label>
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      required
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(''); }}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>College ID (University Email)</label>
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
                  <div className="campus-detect-text" style={{ color: detectedCampus ? 'var(--accent)' : 'var(--gray-400)' }}>
                    {email
                      ? detectedCampus
                        ? `${detectedCampus} detected - You're in!`
                        : 'Type your university email to auto-detect campus...'
                      : 'We map your campus from your email automatically.'}
                  </div>
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      required
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {(passwordFocused || password.length > 0) && (
                    <PasswordRequirements value={password} />
                  )}
                </div>

                <button type="submit" className="premium-btn" disabled={loading || !passwordMeetsRequirements(password)}>
                  {loading ? 'Creating Account...' : 'Create Free Account'}
                </button>
              </form>

              <div className="auth-footer">
                Already have an account? <Link to="/login">Log in here</Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="auth-heading">Verify Email</h2>
              <p className="auth-subheading">We sent a 6-digit OTP to <strong>{email}</strong>.</p>

              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              <form className="premium-form" onSubmit={handleVerifyOTP}>
                <div className="input-group">
                  <label>One-Time Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input
                      type="text"
                      placeholder="123456"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value.replace(/[^0-9]/g, '')); setError(''); }}
                    />
                  </div>
                </div>

                <button type="submit" className="premium-btn" disabled={loading || otp.length !== 6}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
              
              <div className="auth-footer" style={{ marginTop: '1rem', cursor: 'pointer' }} onClick={() => setShowOTP(false)}>
                Wrong email? <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Go back</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
