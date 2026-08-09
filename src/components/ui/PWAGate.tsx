import React from 'react';
import { Smartphone, Bell, X } from 'lucide-react';
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
  const [skipped, setSkipped] = React.useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);

  // Step 1: install required
  // — skip on iOS (Safari cannot show beforeinstallprompt)
  // — skip on browsers that don't support install (Firefox desktop etc.)
  const needsInstall = installState === 'available' && !isIOS;

  // Step 2: push notifications required
  // — skip on iOS if not installed (push won't work anyway until installed)
  // — skip if already blocked (can't ask again)
  const needsPush = pushStatus === 'not-enabled';

  // If user clicked skip, or both satisfied, render children
  if (skipped || (!needsInstall && !needsPush)) {
    return <>{children}</>;
  }

  const handleInstall = async () => {
    setInstalling(true);
    setError(null);
    try {
      const result = await triggerInstall();
      if (result === 'dismissed') {
        setError('You can install CirQl later from your browser menu.');
      }
    } catch {
      setError('Installation failed. You can try again from your browser menu.');
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
        setError(result.message || 'Could not enable notifications.');
      }
    } catch {
      setError('Failed to enable notifications.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleSkip = () => {
    setSkipped(true);
  };

  const currentStep = needsInstall ? 1 : 2;
  const totalSteps = needsInstall && needsPush ? 2 : 1;

  return (
    <div className="pwa-gate-overlay">
      <div className="pwa-gate-card">

        {/* Skip button — top right corner */}
        <button
          className="pwa-gate-skip"
          onClick={handleSkip}
          aria-label="Skip and continue"
          title="Continue without installing"
        >
          <X size={18} />
        </button>

        {/* Step indicator */}
        {totalSteps > 1 && (
          <div className="pwa-gate-steps">
            Step {currentStep} of {totalSteps}
          </div>
        )}

        {needsInstall ? (
          <>
            <div className="pwa-gate-icon-wrap">
              <Smartphone size={32} strokeWidth={1.6} />
            </div>
            <h2 className="pwa-gate-title">Add CirQl to Your Home Screen</h2>
            <p className="pwa-gate-desc">
              Get instant alerts when buyers reply to your listings —
              even when the browser is closed.
            </p>

            {isIOS ? (
              /* iOS: Safari can't do beforeinstallprompt — show manual instructions */
              <div className="pwa-gate-ios-steps">
                <p style={{ fontWeight: 600, marginBottom: 8 }}>On iPhone or iPad:</p>
                <ol>
                  <li>Tap the <strong>Share</strong> button at the bottom of Safari</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
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
          </>
        ) : (
          <>
            <div className="pwa-gate-icon-wrap">
              <Bell size={32} strokeWidth={1.6} />
            </div>
            <h2 className="pwa-gate-title">Enable Notifications</h2>
            <p className="pwa-gate-desc">
              Know the moment a buyer replies or a deal is confirmed.
              You can turn this off anytime in browser settings.
            </p>

            <button
              className="pwa-gate-btn-primary"
              onClick={handleEnableNotifications}
              disabled={subscribing}
            >
              {subscribing ? 'Enabling...' : 'Enable Notifications'}
            </button>

            {pushStatus === 'blocked' && (
              <p className="pwa-gate-blocked-hint">
                Notifications are blocked. Go to your browser site settings
                for this page, allow notifications, then refresh.
              </p>
            )}
          </>
        )}

        {error && <p className="pwa-gate-error">{error}</p>}

        {/* Skip text link below — secondary option */}
        <button className="pwa-gate-skip-link" onClick={handleSkip}>
          Continue without {needsInstall ? 'installing' : 'notifications'}
        </button>

      </div>
    </div>
  );
};
