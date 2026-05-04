import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Search, Zap, MessageSquare, Handshake, Sparkles } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../contexts/AuthContext';
import './HowItWorks.css';

export const HowItWorks = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  return (
    <div className="hiw-page">
      <div className="hiw-header">
        <h1 className="hiw-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          How <Logo size={56} /> Works
        </h1>
        <p className="hiw-subtitle">
          Trading on CirQl is designed to be as frictionless as passing a book to a friend in class. No physical shipping, no online payment gateways, and zero fees. Just 3 simple steps to get what you need.
        </p>
      </div>

      <div className="hiw-grid">
        <div className="hiw-card" style={{ '--card-border': '#a855f7', '--icon-bg': 'rgba(168, 85, 247, 0.12)', '--icon-color': '#9333ea', '--icon-shadow': 'rgba(168, 85, 247, 0.2)' } as React.CSSProperties}>
          <div className="hiw-card-content">
            <div className="hiw-icon-wrap">
              <ShieldCheck size={32} strokeWidth={2.5} />
            </div>
            <h3 className="hiw-step-title">1. Verify Campus</h3>
            <p className="hiw-step-desc">
              Sign up securely using your college email address. Our marketplace is strictly exclusive to verified students on your exact campus.
            </p>
          </div>
        </div>

        <div className="hiw-card" style={{ '--card-border': '#00e554', '--icon-bg': 'rgba(0, 229, 84, 0.12)', '--icon-color': '#00b840', '--icon-shadow': 'rgba(0, 229, 84, 0.2)' } as React.CSSProperties}>
          <div className="hiw-card-content">
            <div className="hiw-icon-wrap">
              <Search size={32} strokeWidth={2.5} />
            </div>
            <h3 className="hiw-step-title">2. Find or Sell</h3>
            <p className="hiw-step-desc">
              Browse the campus feed for great deals, or post your own gear in under 30 seconds to start earning cash instantly.
            </p>
          </div>
        </div>

        <div className="hiw-card hiw-card-wide" style={{ '--card-border': '#facc15', '--icon-bg': 'rgba(250, 204, 21, 0.15)', '--icon-color': '#eab308', '--icon-shadow': 'rgba(250, 204, 21, 0.3)' } as React.CSSProperties}>
          <div className="hiw-card-content hiw-content-horizontal">
            <div className="hiw-icon-wrap hiw-icon-large">
              <Zap size={40} strokeWidth={2.5} />
            </div>
            <div className="hiw-text-wrap">
              <span className="hiw-badge">New Feature</span>
              <h3 className="hiw-step-title">3. The "Wanted Items" Engine</h3>
              <p className="hiw-step-desc">
                Can't find what you need? Don't stress. Use our revolutionary <strong>Wanted Items</strong> feature to post a request. The entire campus gets notified, turning traditional buying into a powerful reverse-marketplace where sellers come directly to you!
              </p>
            </div>
          </div>
        </div>

        <div className="hiw-card" style={{ '--card-border': '#3b82f6', '--icon-bg': 'rgba(59, 130, 246, 0.12)', '--icon-color': '#2563eb', '--icon-shadow': 'rgba(59, 130, 246, 0.2)' } as React.CSSProperties}>
          <div className="hiw-card-content">
            <div className="hiw-icon-wrap">
              <MessageSquare size={32} strokeWidth={2.5} />
            </div>
            <h3 className="hiw-step-title">4. Chat & Negotiate</h3>
            <p className="hiw-step-desc">
              Found a great deal? Use our private, in-app messaging to negotiate prices and securely arrange a meetup spot.
            </p>
          </div>
        </div>

        <div className="hiw-card" style={{ '--card-border': '#f97316', '--icon-bg': 'rgba(249, 115, 22, 0.12)', '--icon-color': '#ea580c', '--icon-shadow': 'rgba(249, 115, 22, 0.2)' } as React.CSSProperties}>
          <div className="hiw-card-content">
            <div className="hiw-icon-wrap">
              <Handshake size={32} strokeWidth={2.5} />
            </div>
            <h3 className="hiw-step-title">5. Meet Up & Trade</h3>
            <p className="hiw-step-desc">
              Meet safely at the library or dorms. Exchange cash or UPI directly—zero platform fees mean you keep 100% of the value.
            </p>
          </div>
        </div>
      </div>

      <div className="hiw-promo">
        <div className="hiw-promo-icon">
          <Sparkles size={48} strokeWidth={2.5} />
        </div>
        <h2>Ready to clean out your dorm room?</h2>
        <button
          type="button"
          onClick={() => navigate(isLoggedIn ? '/marketplace' : '/login')}
          className="hiw-btn"
        >
          {isLoggedIn ? 'Browse College Listings' : 'Start Trading Now'}
        </button>
      </div>
    </div>
  );
};
