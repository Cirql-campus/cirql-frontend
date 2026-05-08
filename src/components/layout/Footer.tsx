import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { Mail, Activity, Lock, HelpCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Footer.css'; // Utilizing the V2 CSS mapping

export const Footer = () => {
  const { isLoggedIn } = useAuth();
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
  };

  return (
    <>
      <section id="newsletter">
        <div className="nl-inner">
          <div className="nl-left">
            <h2>Join the Cirql<br/>Campus Network</h2>
            <p style={{ marginTop: '8px', color: '#a1a1aa' }}>Follow our active development and vibrant campus market drops.</p>
          </div>
          <div className="nl-right">
            {!subscribed ? (
              <form className="nl-form" onSubmit={handleSubscribe}>
                <div className="nl-input-wrap">
                  <Mail size={16} className="nl-input-icon" />
                  <input type="email" className="nl-input" placeholder="student@university.edu" required />
                </div>
                <button type="submit" className="nl-btn">Subscribe Free</button>
                <div className="nl-note">No spam. Only exclusive campus deals.</div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(35, 209, 96, 0.1)', borderRadius: '12px', border: '1px solid rgba(35, 209, 96, 0.3)' }}>
                 <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '18px', marginBottom: '4px' }}>Welcome aboard! 🚀</div>
                 <div style={{ fontSize: '13px', color: '#a1a1aa' }}>Watch your inbox for the next drop.</div>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="footer-brand" style={{ marginBottom: '16px' }}>
                <Logo size={28} color="var(--accent)" lightMode={true} />
              </div>
              <p className="footer-tagline">The definitive campus marketplace connecting students, promoting sustainability, and eliminating commission fees.</p>
              <div className="footer-socials">
                <a href="https://www.instagram.com/_cirql.store_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="soc-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
              </div>
            </div>
            
            <div>
              <div className="footer-col-title">Marketplace</div>
              <Link to={isLoggedIn ? '/marketplace' : '/'} className="footer-link">Browse Items</Link>
              <Link to="/why-cirql" className="footer-link">Why CirQl?</Link>
              <Link to="/how-it-works" className="footer-link">How it Works</Link>
            </div>

            <div>
              <div className="footer-col-title">Support</div>
              <a href="mailto:cirqlofficial1@gmail.com" className="footer-link"><HelpCircle size={12} style={{ display: 'inline', marginRight: '4px' }}/> Help Center</a>
              <a href="#" className="footer-link"><Lock size={12} style={{ display: 'inline', marginRight: '4px' }}/> Safety Center</a>
              <a href="mailto:cirqlofficial1@gmail.com" className="footer-link">Report an Issue</a>
              <a href="mailto:cirqlofficial1@gmail.com" className="footer-link" style={{ textTransform: 'none' }}>cirqlofficial1@gmail.com</a>
            </div>

            <div>
              <div className="footer-col-title">System Status</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(255,255,255,.05)', borderRadius: '30px', border: '1px solid rgba(255,255,255,.1)' }}>
                 <Activity size={14} color="var(--accent)" />
                 <span style={{ fontSize: '12px', fontWeight: 600, color: '#e4e4e7' }}>All Systems Active</span>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div>&copy; {new Date().getFullYear()} Cirql Marketplace. All rights reserved.</div>
            <div className="footer-bottom-links">
              <a href="#" className="footer-bottom-link">Privacy Policy</a>
              <a href="#" className="footer-bottom-link">Terms of Service</a>
              <a href="#" className="footer-bottom-link">Cookie Settings</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
