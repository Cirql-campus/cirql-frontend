import React from 'react';
import { usePWA } from '../../contexts/PWAContext';
import { subscribeUserToPush } from '../../utils/pushNotifications';
import './PWAGate.css';

interface PWAGateProps {
  children: React.ReactNode;
}

export const PWAGate: React.FC<PWAGateProps> = ({ children }) => {
  const { installState, pushStatus, triggerInstall, checkPushStatus } = usePWA();
  const [installing, setInstalling] = React.useState(false);
  const [subscribing, setSubscribing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [bypassed, setBypassed] = React.useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);

  // Step 1: install required (skip if already installed OR on iOS where we can't prompt)
  const needsInstall = installState === 'not-available' 
    ? false  // browser doesn't support install (desktop Firefox, etc) — skip this gate
    : installState === 'available';  // browser supports it, not installed yet

  // Step 2: push notifications required
  const needsPush = pushStatus === 'not-enabled';

  // If both are satisfied or the user bypassed, render children normally
  if (!needsInstall && !needsPush || bypassed) {
    return <>{children}</>;
  }

  const handleInstall = async () => {
    setInstalling(true);
    setError(null);
    try {
      const result = await triggerInstall();
      if (result === 'dismissed') {
        setError('Please install the app to continue. Tap "Add to Home Screen" to get started.');
      }
    } catch {
      setError('Installation failed. Please try again.');
    } finally {
      setInstalling(false);
    }
  };

  const handleEnableNotifications = async () => {
    setSubscribing(true);
    setError(null);
    try {
      const result = await subscribeUserToPush();
      if (result.ok) {
        await checkPushStatus();
      } else {
        setError(result.message || 'Could not enable notifications. Check your browser settings.');
      }
    } catch {
      setError('Failed to enable notifications. Please allow notifications in your browser settings.');
    } finally {
      setSubscribing(false);
    }
  };

  // Determine which step we're on
  const currentStep = needsInstall ? 1 : 2;
  const totalSteps = needsInstall ? 2 : 1; // if already installed, only 1 step

  return (
    <div className="pwa-gate-overlay">
      <div className="pwa-gate-card">
        <div className="pwa-gate-steps">
          Step {currentStep} of {totalSteps}
        </div>

        {needsInstall ? (
          <>
            <div className="pwa-gate-icon">📲</div>
            <h2 className="pwa-gate-title">Add CirQl to Your Home Screen</h2>
            <p className="pwa-gate-desc">
              Install CirQl as an app to post listings and message buyers & sellers. 
              This lets us send you instant notifications when someone replies — 
              so you never miss a sale.
            </p>
            {isIOS ? (
              <div className="pwa-gate-ios-steps">
                <p>On iPhone/iPad:</p>
                <ol>
                  <li>Tap the <strong>Share</strong> button in Safari (the box with an arrow)</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                  <li>Tap <strong>Add</strong> — then open CirQl from your home screen</li>
                </ol>
              </div>
            ) : (
              <button
                className="pwa-gate-btn-primary"
                onClick={handleInstall}
                disabled={installing}
              >
                {installing ? 'Opening install prompt...' : 'Add to Home Screen'}
              </button>
            )}
            <button
              className="pwa-gate-btn-secondary"
              onClick={() => setBypassed(true)}
              type="button"
            >
              Skip & Proceed anyway
            </button>
          </>
        ) : (
          <>
            <div className="pwa-gate-icon">🔔</div>
            <h2 className="pwa-gate-title">Enable Notifications to Continue</h2>
            <p className="pwa-gate-desc">
              CirQl needs notification permission to alert you when buyers reply to your 
              listings or sellers respond to your messages. Without this, you'll miss 
              time-sensitive deals.
            </p>
            <button
              className="pwa-gate-btn-primary"
              onClick={handleEnableNotifications}
              disabled={subscribing}
            >
              {subscribing ? 'Enabling...' : 'Enable Notifications'}
            </button>
            <button
              className="pwa-gate-btn-secondary"
              onClick={() => setBypassed(true)}
              type="button"
            >
              Skip & Proceed anyway
            </button>
            {pushStatus === 'blocked' && (
              <p className="pwa-gate-blocked-hint">
                Notifications are blocked in your browser settings. 
                Go to your browser's site settings for this page and allow notifications, then refresh.
              </p>
            )}
          </>
        )}

        {error && <p className="pwa-gate-error">{error}</p>}
      </div>
    </div>
  );
};
