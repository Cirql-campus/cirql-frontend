import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SUPPORT_EMAIL, LAST_POLICY_UPDATE } from '../utils/constants';
import './Legal.css';

export const CookiePolicy = () => {
  return (
    <div className="legal-page-container">
      <Link to="/" className="legal-back-link">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="legal-header">
        <h1 className="legal-title">Cookie Policy</h1>
        <div className="legal-date">Last updated: {LAST_POLICY_UPDATE}</div>
      </div>

      <div className="legal-content">
        <p>
          At CirQl Campus Marketplace, we believe in a clean, tracker-free browsing experience. This Cookie Policy explains the single cookie we use to power our service.
        </p>

        <h2>1. What is a Cookie?</h2>
        <p>
          A cookie is a small text file stored in your browser when you visit a website. It is typically used to remember your login status or track your browsing activity.
        </p>

        <h2>2. The Only Cookie We Use</h2>
        <p>
          We use exactly one cookie on our platform:
        </p>
        <ul>
          <li><strong>Session Cookie (refreshToken):</strong> This cookie keeps you logged in to your account. It expires automatically after 45 days of inactivity, so you stay signed in on a device you use regularly.</li>
        </ul>

        <h2>3. Security and Protection</h2>
        <p>
          Your security is our priority. This cookie is:
        </p>
        <ul>
          <li><strong>HTTP-only:</strong> It cannot be accessed by client-side JavaScript or browser extensions, protecting your account from common security attacks (like XSS).</li>
          <li><strong>Secure:</strong> It is only transmitted over encrypted (HTTPS) connections.</li>
        </ul>

        <h2>4. No Third-Party Tracking</h2>
        <p>
          We respect your digital privacy:
        </p>
        <ul>
          <li>We do not use advertising, tracking, or analytics cookies.</li>
          <li>We do not use third-party trackers, including Google Analytics or Facebook Pixel.</li>
          <li>Your activity on CirQl is not shared with any advertisers or tracking networks.</li>
        </ul>

        <h2>5. How to Manage Cookies</h2>
        <p>
          You are in control of your browser cookies:
        </p>
        <ul>
          <li><strong>Logging Out:</strong> Logging out of CirQl immediately clears and invalidates this cookie.</li>
          <li><strong>Blocking Cookies:</strong> You can disable all cookies in your browser settings. However, doing so will require you to enter your credentials and log in on every single visit.</li>
        </ul>

        <h2>6. Contact Us</h2>
        <p>
          If you have any questions about this Cookie Policy, feel free to contact us at <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--accent-dark)', fontWeight: 'bold' }}>{SUPPORT_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
};

export default CookiePolicy;
