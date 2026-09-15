import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, GraduationCap, ClipboardList, Camera, ChevronRight, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePWA } from '../contexts/PWAContext';
import { detectCollege, COLLEGE_MAP } from '../utils/collegeDetect';
import { PasswordRequirements, passwordMeetsRequirements } from '../components/ui/PasswordRequirements';
import { api, getErrorMessage, ensureCsrfToken } from '../utils/api';
import './Auth.css';

const StepIndicator = ({ current, isManual }: { current: number; isManual: boolean }) => {
  const steps = isManual
    ? ['Method', 'Details', 'Verify', 'Upload ID', 'Done']
    : ['Method', 'Details', 'Verify', 'Done'];
  return (
    <div className="reg-steps">
      {steps.map((s, i) => (
        <div key={s} className={`reg-step ${i + 1 === current ? 'active' : i + 1 < current ? 'done' : ''}`}>
          <div className="reg-step-dot">{i + 1 < current ? '✓' : i + 1}</div>
          <span className="reg-step-label">{s}</span>
        </div>
      ))}
    </div>
  );
};

export const Signup = () => {
  const navigate = useNavigate();
  const { signup, verifyOTP, isLoggedIn } = useAuth();
  const { showInstallNudge } = usePWA();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);

  type RegStep = 'choose' | 'college-email' | 'manual-email' | 'otp' | 'submit-id' | 'pending';
  const [step, setStep] = useState<RegStep>('choose');
  const [college, setCollege] = useState('');
  const [collegeSearch, setCollegeSearch] = useState('');
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [collegeInputFocused, setCollegeInputFocused] = useState(false);
  const collegeInputRef = React.useRef<HTMLInputElement>(null);
  const [rollNumber, setRollNumber] = useState('');
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);

  const detectedCampus = useMemo(() => detectCollege(email)?.college || null, [email]);

  const filteredColleges = useMemo(() => {
    const q = collegeSearch.trim().toLowerCase();
    if (!q) return COLLEGE_MAP.slice(0, 8); // show first 8 when empty
    return COLLEGE_MAP
      .filter(c => c.name.toLowerCase().includes(q))
      .slice(0, 10); // max 10 results
  }, [collegeSearch]);

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
    const result = await signup(name, email, password, agreedToTerms);
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

    const isManualFlow = step === 'manual-email' || (college && college.trim().length > 0);

    if (isManualFlow) {
      // Manual flow: call backend directly — do NOT use AuthContext.verifyOTP
      // because it navigates away from Signup before we can show the ID upload step
      try {
        const res = await api.post<{ user: any; accessToken: string }>(
          '/auth/verify-otp',
          { email, otp }
        );
        setLoading(false);
        if (res && res.accessToken) {
          // Store token so the submit-id upload call (which uses protect middleware) works
          // AuthContext.verifyOTP would do this — we replicate only what's needed here
          // The full auth state will be set when user logs in after admin approval
          sessionStorage.setItem('cirql_pending_token', res.accessToken);
          // Fetch a fresh CSRF token so it matches the new auth session cookies set by verify-otp
          await ensureCsrfToken(true);
          setShowOTP(false);
          setStep('submit-id');
        } else {
          setError('Verification failed. Please try again.');
        }
      } catch (err: unknown) {
        setLoading(false);
        setError(getErrorMessage(err, 'Invalid or expired OTP. Please try again.'));
      }
    } else {
      // College email flow: use AuthContext.verifyOTP as before
      const result = await verifyOTP(email, otp);
      setLoading(false);
      if (result.ok) {
        sessionStorage.setItem('show_pwa_nudge', 'login');
        navigate('/marketplace');
      } else {
        setError(result.error || 'Invalid OTP. Please try again.');
      }
    }
  };

  // Manual registration submit (Step 3)
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!college.trim()) return setError('Please enter your college name');
    if (!rollNumber.trim()) return setError('Please enter your roll number');
    setLoading(true);
    try {
      await api.post('/auth/register/manual', {
        name, email, password, college, rollNumber, agreedToTerms: String(agreedToTerms),
      });
      setShowOTP(true); // reuse existing OTP step
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  // ID photo upload submit (Step 4)
  const handleIDSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idPhoto) return setError('Please select a photo');
    setError('');
    setLoading(true);
    try {
      // Ensure fresh CSRF token before submitting the form
      await ensureCsrfToken(true);

      const formData = new FormData();
      formData.append('idPhoto', idPhoto);

      // Use the pending token from manual OTP verification
      // since the user is not fully logged in yet (isVerified = false)
      const pendingToken = sessionStorage.getItem('cirql_pending_token');

      await api.post('/auth/register/submit-id', formData, true, {
        headers: pendingToken
          ? { Authorization: `Bearer ${pendingToken}` }
          : undefined,
      });

      // Clear the pending token — user must wait for admin approval and then log in
      sessionStorage.removeItem('cirql_pending_token');
      setStep('pending');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Upload failed. Please try again.'));
    } finally {
      setLoading(false);
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
        <button className="auth-back-btn" onClick={() => {
          if (step === 'choose') navigate('/');
          else setStep('choose');
        }}>
          <ArrowLeft size={18} /> {step === 'choose' ? 'Back to Homepage' : 'Back'}
        </button>

        <div className="auth-form-container">
          <div className="auth-logo-center">
            <Logo size={40} lightMode={true} className="auth-brand-logo" />
          </div>

          {/* ===== STEP 1: CHOOSE METHOD ===== */}
          {step === 'choose' && (
            <>
              <h2 className="auth-heading">Join CirQl</h2>
              <p className="auth-subheading">How would you like to verify your student identity?</p>

              {error && <div className="auth-error">{error}</div>}

              <div className="reg-method-cards">
                <button
                  className="reg-method-card"
                  onClick={() => setStep('college-email')}
                >
                  <div className="reg-method-icon"><GraduationCap size={26} strokeWidth={1.8} /></div>
                  <div className="reg-method-content">
                    <div className="reg-method-title">College Email</div>
                    <div className="reg-method-desc">
                      I have a college email like<br />
                      <code>name@college.ac.in</code>
                    </div>
                    <div className="reg-method-badge recommended">Instant access</div>
                  </div>
                  <span className="reg-method-arrow"><ChevronRight size={18} /></span>
                </button>

                <button
                  className="reg-method-card"
                  onClick={() => setStep('manual-email')}
                >
                  <div className="reg-method-icon"><ClipboardList size={26} strokeWidth={1.8} /></div>
                  <div className="reg-method-content">
                    <div className="reg-method-title">Personal Email + ID</div>
                    <div className="reg-method-desc">
                      My college doesn't provide<br />
                      a college email address
                    </div>
                    <div className="reg-method-badge">Verified within 24h</div>
                  </div>
                  <span className="reg-method-arrow"><ChevronRight size={18} /></span>
                </button>
              </div>

              <div className="auth-footer">
                Already have an account? <Link to="/login">Log in here</Link>
              </div>
            </>
          )}

          {/* ===== STEP 2A: COLLEGE EMAIL FORM (existing flow, unchanged) ===== */}
          {(step === 'college-email' && !showOTP) && (
            <>
              <StepIndicator current={2} isManual={false} />
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

                <label className="terms-consent">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  I agree to the{' '}
                  <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</Link>
                  {' '}and{' '}
                  <Link to="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>
                </label>

                <button type="submit" className="premium-btn" disabled={loading || !passwordMeetsRequirements(password) || !agreedToTerms}>
                  {loading ? 'Creating Account...' : 'Create Free Account'}
                </button>
              </form>

              <div className="auth-footer">
                Already have an account? <Link to="/login">Log in here</Link>
              </div>
            </>
          )}

          {/* ===== STEP 2B: OTP (existing, shared between both flows) ===== */}
          {showOTP && (
            <>
              <StepIndicator current={3} isManual={step === 'manual-email'} />
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

          {/* ===== STEP 3: MANUAL FLOW — personal details ===== */}
          {step === 'manual-email' && !showOTP && (
            <>
              <StepIndicator current={2} isManual={true} />
              <h2 className="auth-heading">Create Account</h2>
              <p className="auth-subheading">Enter your details. We'll verify your identity via your college ID card.</p>
              {error && <div className="auth-error">{error}</div>}

              <form className="premium-form" onSubmit={handleManualSubmit}>
                <div className="input-group">
                  <label>Full Name</label>
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
                    <input type="text" placeholder="John Doe" required
                      value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                </div>

                <div className="input-group">
                  <label>Personal Email</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" />
                    <input type="email" placeholder="yourname@gmail.com" required
                      value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className="input-group" style={{ position: 'relative' }}>
                  <label>College / University Name</label>
                  <input
                    ref={collegeInputRef}
                    type="text"
                    className={`plain-input${college && !COLLEGE_MAP.find(c => c.name === college) ? ' plain-input--warning' : college ? ' plain-input--ok' : ''}`}
                    placeholder="Search your college..."
                    required
                    autoComplete="off"
                    value={collegeSearch || college}
                    onFocus={() => {
                      setShowCollegeDropdown(true);
                      setCollegeInputFocused(true);
                      if (college) setCollegeSearch('');
                    }}
                    onBlur={() => {
                      // Delay so click on dropdown option registers first
                      setTimeout(() => {
                        setShowCollegeDropdown(false);
                        setCollegeInputFocused(false);
                        // If user typed but didn't select, allow custom college name
                        if (collegeSearch && !college) {
                          setCollege(collegeSearch.trim());
                        }
                        setCollegeSearch('');
                      }, 150);
                    }}
                    onChange={(e) => {
                      setCollegeSearch(e.target.value);
                      setCollege(''); // clear selection when typing
                      setShowCollegeDropdown(true);
                    }}
                  />

                  {/* Show selected college name when not focused */}
                  {college && !collegeInputFocused && (
                    <div className="college-selected-badge">
                      {college}
                      <button
                        type="button"
                        className="college-clear-btn"
                        onClick={() => { setCollege(''); setCollegeSearch(''); collegeInputRef.current?.focus(); }}
                        tabIndex={-1}
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {showCollegeDropdown && (
                    <div className="college-dropdown">
                      {filteredColleges.length > 0 ? (
                        filteredColleges.map(c => (
                          <button
                            key={c.domain}
                            type="button"
                            className={`college-option${college === c.name ? ' selected' : ''}`}
                            onMouseDown={(e) => {
                              e.preventDefault(); // prevent blur firing before click
                              setCollege(c.name);
                              setCollegeSearch('');
                              setShowCollegeDropdown(false);
                            }}
                          >
                            <span className="college-option-name">{c.name}</span>
                            <span className="college-option-domain">{c.domain}</span>
                          </button>
                        ))
                      ) : (
                        <div className="college-option-empty">
                          <span>No match found</span>
                          <span style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                            Type your college name exactly — we'll verify it during ID review
                          </span>
                        </div>
                      )}
                      {collegeSearch && filteredColleges.length > 0 && !COLLEGE_MAP.find(c => c.name.toLowerCase() === collegeSearch.toLowerCase()) && (
                        <button
                          type="button"
                          className="college-option college-option--custom"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCollege(collegeSearch.trim());
                            setCollegeSearch('');
                            setShowCollegeDropdown(false);
                          }}
                        >
                          <span className="college-option-name">Use "{collegeSearch.trim()}"</span>
                          <span className="college-option-domain">Not in our list — verified during ID review</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="input-group">
                <label>University Roll Number</label>
                <input type="text" className="plain-input" placeholder="e.g. 2100140100001"
                  required value={rollNumber} onChange={(e) => setRollNumber(e.target.value.toUpperCase())} />
                <span style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4, display: 'block' }}>
                  This ensures one account per student.
                </span>
                <span style={{ fontSize: 11, color: '#b45309', marginTop: 2, display: 'block', fontWeight: 500, background: '#fffbeb', padding: '4px 8px', borderRadius: 4, borderLeft: '2px solid #f59e0b' }}>
                  Your roll number must match the ID number printed on your college ID card.
                </span>
              </div>

                <div className="input-group">
                  <label>Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input type={showPass ? 'text' : 'password'} placeholder="Create a strong password"
                      required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)} />
                    <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {(passwordFocused || password.length > 0) && (
                    <PasswordRequirements value={password} />
                  )}
                </div>

                <label className="terms-consent">
                  <input type="checkbox" checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)} />
                  I agree to the <Link to="/terms" target="_blank">Terms & Conditions</Link> and{' '}
                  <Link to="/privacy" target="_blank">Privacy Policy</Link>
                </label>

                <button type="submit" className="premium-btn"
                  disabled={loading || !passwordMeetsRequirements(password) || !agreedToTerms}>
                  {loading ? 'Creating Account...' : 'Continue →'}
                </button>
              </form>
            </>
          )}

          {/* ===== STEP 4: UPLOAD ID PHOTO ===== */}
          {step === 'submit-id' && (
            <>
              <StepIndicator current={4} isManual={true} />
              <h2 className="auth-heading">Upload Your College ID</h2>
              <p className="auth-subheading">
                Upload a clear photo of your college ID card.<br />
                Your college admin will verify it within 24 hours.
              </p>
              {error && <div className="auth-error">{error}</div>}

              <form className="premium-form" onSubmit={handleIDSubmit}>
                <div className="id-upload-area">
                  {idPhotoPreview ? (
                    <div className="id-preview-wrap">
                      <img src={idPhotoPreview} alt="ID preview" className="id-preview-img" />
                      <button type="button" className="id-change-btn"
                        onClick={() => { setIdPhoto(null); setIdPhotoPreview(null); }}>
                        Change photo
                      </button>
                    </div>
                  ) : (
                    <label className="id-upload-label">
                      <input type="file" accept="image/jpeg,image/png,image/webp" hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            setError('Photo must be under 5MB');
                            return;
                          }
                          setIdPhoto(file);
                          setIdPhotoPreview(URL.createObjectURL(file));
                          setError('');
                        }} />
                      <div className="id-upload-icon"><Camera size={28} strokeWidth={1.6} color="var(--gray-400, #a1a1aa)" /></div>
                      <div className="id-upload-text">
                        <strong>Tap to upload ID photo</strong>
                        <span>JPG, PNG or WebP · Max 5MB</span>
                      </div>
                    </label>
                  )}
                </div>

                <div className="id-tips">
                  <p style={{ fontSize: 12, color: 'var(--gray-500)', margin: '8px 0 4px' }}>
                    Make sure your name and roll number are clearly visible
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                    Good lighting, no blur, full card in frame
                  </p>
                </div>

                <button type="submit" className="premium-btn" disabled={loading || !idPhoto}>
                  {loading ? 'Uploading...' : 'Submit for Verification →'}
                </button>
              </form>
            </>
          )}

          {/* ===== STEP 5: PENDING STATE ===== */}
          {step === 'pending' && (
            <div className="pending-verification-screen">
              <StepIndicator current={5} isManual={true} />
              <div className="pending-icon"><Clock size={44} strokeWidth={1.5} color="var(--primary, #00e554)" /></div>
              <h2 className="auth-heading">Verification Pending</h2>
              <p className="auth-subheading">
                Your ID has been submitted to your college admin at<br />
                <strong>{college}</strong>.
              </p>
              <div className="pending-info-box">
                <div className="pending-timeline">
                  <div className="pending-timeline-item done">
                    <div className="pending-timeline-dot" />
                    <span>Email verified</span>
                  </div>
                  <div className="pending-timeline-item done">
                    <div className="pending-timeline-dot" />
                    <span>ID submitted</span>
                  </div>
                  <div className="pending-timeline-item active">
                    <div className="pending-timeline-dot" />
                    <span>College admin review <em>(in progress)</em></span>
                  </div>
                  <div className="pending-timeline-item">
                    <div className="pending-timeline-dot" />
                    <span>Access granted — you'll get an email at <strong>{email}</strong></span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 12, textAlign: 'center' }}>
                  Questions?{' '}
                  <a href="mailto:cirqlofficial1@gmail.com" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    cirqlofficial1@gmail.com
                  </a>
                </p>
              </div>
              <button className="premium-btn" style={{ marginTop: 20 }}
                onClick={() => navigate('/')}>
                Back to Homepage
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
