import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SUPPORT_EMAIL, LAST_POLICY_UPDATE } from '../utils/constants';
import './Legal.css';

export const PrivacyPolicy = () => {
  return (
    <div className="legal-page-container">
      <Link to="/" className="legal-back-link">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="legal-header">
        <h1 className="legal-title">Privacy Policy</h1>
        <div className="legal-date">Last updated: {LAST_POLICY_UPDATE}</div>
      </div>

      <div className="legal-content">
        <p>
          At CirQl Campus Marketplace, we value your privacy and believe in being completely transparent about how we handle your data. This policy details what we collect, why we collect it, and how we protect it.
        </p>

        <h2>1. What We Collect</h2>
        <p>
          We collect only the information necessary to provide you with a safe and functional campus marketplace:
        </p>
        <ul>
          <li><strong>Account Information:</strong> Your name, verified college email address, college name, and profile photo.</li>
          <li><strong>Listing Content:</strong> The descriptions, categories, prices, and photos of the items you list for sale or request.</li>
          <li><strong>Messages:</strong> Chat messages exchanged with other users to coordinate trades.</li>
          <li><strong>Notification Tokens:</strong> Device tokens used exclusively to send you push notifications about listings or messages.</li>
          <li><strong>Technical Logs:</strong> Standard server logs containing your IP address to maintain security and prevent abuse.</li>
        </ul>

        <h2>2. Why We Collect It</h2>
        <p>
          We use your data solely to run and improve the platform:
        </p>
        <ul>
          <li>To verify you are an active student at a supported college.</li>
          <li>To display your listings to other students at your campus.</li>
          <li>To notify you about new messages, saved search matches, and transaction updates.</li>
          <li>To protect our community from fraud and platform abuse.</li>
        </ul>

        <h2>3. How We Store and Protect It</h2>
        <p>
          Your data is securely stored using industry-standard systems:
        </p>
        <ul>
          <li><strong>Database:</strong> Hosted on MongoDB Atlas.</li>
          <li><strong>Media Assets:</strong> Listing and profile images are stored on Cloudinary.</li>
          <li><strong>Authentication:</strong> Sessions are secured using HTTP-only JSON Web Token (JWT) cookies and 45-day refresh tokens stored in MongoDB.</li>
          <li>We do not process payments on-platform; all deals are completed in-person.</li>
        </ul>

        <h2>4. Who Sees Your Data</h2>
        <p>
          CirQl is college-scoped. Here is who has access to your information:
        </p>
        <ul>
          <li><strong>Your Campus Community:</strong> Only verified students at your college can view your listings, profile photo, and display name.</li>
          <li><strong>Platform Moderators:</strong> Admins can view reports, flagged messages, and listings to enforce community guidelines.</li>
          <li><strong>Service Providers:</strong> Hosting (Render/Vercel) and database providers process data as instructed.</li>
          <li><strong>No Selling:</strong> We never sell your personal data to third parties or advertisers.</li>
        </ul>

        <h2>5. Your Rights and Data Retention</h2>
        <p>
          You control your data:
        </p>
        <ul>
          <li><strong>Listing Deletion:</strong> You can delete your listings at any time.</li>
          <li><strong>Account Deletion:</strong> You can request permanent account deletion by emailing us.</li>
          <li><strong>Data Export:</strong> We are currently building a feature to let you download your data.</li>
          <li><strong>Retention:</strong> Active listings expire automatically. Account data is retained until you request deletion.</li>
        </ul>

        <h2>6. Cookies</h2>
        <p>
          We use exactly one functional cookie (a secure refresh token) to keep you logged in. We do not use any advertising, tracking, or analytics cookies.
        </p>

        <h2>7. Changes to This Policy</h2>
        <p>
          We will notify you of any material changes to this policy directly through the app.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          If you have questions or want to request account deletion, email us at: <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--accent-dark)', fontWeight: 'bold' }}>{SUPPORT_EMAIL}</a>
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
