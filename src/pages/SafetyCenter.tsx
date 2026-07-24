import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LAST_POLICY_UPDATE } from '../utils/constants';
import './Legal.css';

export const SafetyCenter: React.FC = () => (
  <div className="legal-page-container">
    <Link to="/" className="legal-back-link">
      <ArrowLeft size={16} /> Back to Home
    </Link>
    <h1 className="legal-title">Safety Center</h1>
    <p className="legal-updated">Last updated: {LAST_POLICY_UPDATE}</p>

    <div className="legal-content">
      <h2>Meet Safely on Campus</h2>
      <p>CirQl connects students at the same college. All exchanges happen in person — here's how to stay safe.</p>

      <h2>Where to Meet</h2>
      <p>Always meet in busy, well-lit campus areas — near the library, canteen, or main building. Never meet in isolated locations or off-campus for a first exchange.</p>

      <h2>What Not to Share</h2>
      <p>Never share your bank account details, UPI PIN, OTP, or personal home address in chat. CirQl will never ask for this information.</p>

      <h2>Check Before You Pay</h2>
      <p>Inspect the item in person before paying. If something feels wrong — the item doesn't match the listing, the seller is pressuring you, or the price changed — walk away.</p>

      <h2>Use the Report Button</h2>
      <p>Every listing and message has a Report button. Use it if you see a suspicious listing, receive an inappropriate message, or feel unsafe. Our admin team reviews all reports.</p>

      <h2>Trust Scores</h2>
      <p>Look for sellers with verified reviews and completed deals. Higher-rated sellers have a track record of successful exchanges on campus.</p>

      <h2>Contact Us</h2>
      <p>If you experience or witness unsafe behaviour, email us immediately at <a href="mailto:cirqlofficial1@gmail.com">cirqlofficial1@gmail.com</a>.</p>
    </div>
  </div>
);

export default SafetyCenter;
