import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SUPPORT_EMAIL, LAST_POLICY_UPDATE } from '../utils/constants';
import './Legal.css';

export const Terms = () => {
  return (
    <div className="legal-page-container">
      <Link to="/" className="legal-back-link">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="legal-header">
        <h1 className="legal-title">Terms & Conditions</h1>
        <div className="legal-date">Last updated: {LAST_POLICY_UPDATE}</div>
      </div>

      <div className="legal-content">
        <p>
          Welcome to CirQl Campus Marketplace. By using our platform, you agree to these Terms & Conditions. Please read them carefully.
        </p>

        <h2>1. What We Are</h2>
        <p>
          CirQl is a peer-to-peer campus marketplace connecting students at the same college. We facilitate connections, not transactions. We do not handle payments or delivery; all exchanges and payments must happen directly between users in person.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          To use CirQl, you must be a student with an active, verified college email address at a supported institution. Users only see listings from their own college.
        </p>

        <h2>3. Allowed and Prohibited Listings</h2>
        <p>
          You may list legal personal items that you own. Prohibited items include:
        </p>
        <ul>
          <li>Weapons, fireworks, or explosives.</li>
          <li>Illegal substances, drugs, and prescription medications.</li>
          <li>Counterfeit goods or stolen items.</li>
          <li>Services or digital products (we support physical items only).</li>
          <li>Anything that violates your college's official policies.</li>
        </ul>

        <h2>4. Your Responsibilities</h2>
        <p>
          As a member of the CirQl community, you agree to:
        </p>
        <ul>
          <li>Provide accurate and honest listings.</li>
          <li>Complete agreed-upon deals in good faith.</li>
          <li>Respect other students and maintain appropriate communications.</li>
          <li>Not spam, harass, or attempt to defraud other users.</li>
        </ul>

        <h2>5. Our Role and Disclaimer</h2>
        <p>
          CirQl is a platform provider, not a party to any transactions. We do not verify, guarantee, or inspect the quality, safety, or delivery of the items listed. All exchanges are at your own risk.
        </p>

        <h2>6. Safety Guidelines</h2>
        <p>
          For your safety, we strongly recommend:
        </p>
        <ul>
          <li>Meeting in public, well-lit campus spaces (e.g., student union, library).</li>
          <li>Inspecting items thoroughly before payment.</li>
          <li>Never sharing financial details, bank accounts, or sensitive info in chat.</li>
          <li>Immediately reporting suspicious behavior using the in-app report button.</li>
        </ul>

        <h2>7. Moderation and Enforcement</h2>
        <p>
          To keep the campus community safe, our admins have the right to:
        </p>
        <ul>
          <li>Review reported items, listings, and flagged chat messages.</li>
          <li>Remove listings that violate our guidelines.</li>
          <li>Temporarily or permanently ban users who break these rules.</li>
        </ul>

        <h2>8. Intellectual Property</h2>
        <p>
          You retain ownership of any text, images, or listing descriptions you upload. By posting on CirQl, you grant us a non-exclusive license to display this content to other students on the platform.
        </p>

        <h2>9. Account Deletion and Termination</h2>
        <p>
          We may suspend or terminate your access if you violate these terms. You can request your account to be deleted by contacting support at <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--accent-dark)', fontWeight: 'bold' }}>{SUPPORT_EMAIL}</a>.
        </p>

        <h2>10. Governing Law</h2>
        <p>
          These terms are governed by the laws of India.
        </p>
      </div>
    </div>
  );
};

export default Terms;
