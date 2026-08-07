import React from 'react';
import { Shield, Zap, Target, Leaf } from 'lucide-react';
import { Logo } from '../components/ui/Logo';

export const WhyCirql = () => {
  return (
    <div className="why-cirql-container">
      <style>{`
        .why-cirql-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
        }
        .why-cirql-heading {
          font-family: var(--font-display);
          font-size: 56px;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -1.5px;
          color: var(--black);
        }
        .why-cirql-desc {
          font-size: 18px;
          color: var(--gray-600);
          line-height: 1.7;
          margin: 0 auto 60px;
          max-width: 700px;
        }
        @media (max-width: 768px) {
          .why-cirql-heading { font-size: 42px; }
        }
        .why-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          text-align: left;
        }
        @media (min-width: 768px) {
          .why-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .why-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .why-card {
          background: #fff;
          padding: 24px;
          border-radius: 16px;
          border: 1px solid var(--gray-200);
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .why-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08);
        }
        .why-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .why-card-title {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 10px;
          color: var(--gray-900);
        }
        .why-card-text {
          color: var(--gray-500);
          font-size: 14px;
          line-height: 1.6;
        }
        .highlight {
          color: #22c55e;
          font-weight: 700;
        }
        .heading-brand {
          color: var(--accent, #00e554);
          font-family: var(--font-display);
          font-weight: 900;
        }
      `}</style>
      
      <h2 className="why-cirql-heading">
        Why <span className="heading-brand">CirQl</span>?
      </h2>
      <p className="why-cirql-desc">
        Campus trading is inefficient. Students lose money to middlemen, 
        and there's no trusted student-only system. We built CirQl to fix that.
      </p>

      <div className="why-grid">
        <div className="why-card">
          <div className="why-icon-wrap">
            <Shield size={24} />
          </div>
          <h3 className="why-card-title">Zero Commission</h3>
          <p className="why-card-text">
            Students keep <span className="highlight">100%</span> of earnings. Absolutely no platform fees or hidden charges.
          </p>
        </div>

        <div className="why-card">
          <div className="why-icon-wrap">
            <Target size={24} />
          </div>
          <h3 className="why-card-title">Hyperlocal Network</h3>
          <p className="why-card-text">
            Only <span className="highlight">Verified</span> college email users. A trusted, student-only marketplace.
          </p>
        </div>

        <div className="why-card">
          <div className="why-icon-wrap">
            <Zap size={24} />
          </div>
          <h3 className="why-card-title">Instant Connections</h3>
          <p className="why-card-text">
            No shipping, no delays. Secure <span className="highlight">Instant</span> same-day meetups directly on campus.
          </p>
        </div>

        <div className="why-card">
          <div className="why-icon-wrap">
            <Leaf size={24} />
          </div>
          <h3 className="why-card-title">Sustainable Sharing</h3>
          <p className="why-card-text">
            Promote reuse of textbooks and tech. Actively reduce waste within your campus environment.
          </p>
        </div>
      </div>
    </div>
  );
};
