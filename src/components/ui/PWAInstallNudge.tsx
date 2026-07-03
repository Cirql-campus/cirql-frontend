import React, { useEffect, useState } from 'react';
import { usePWA } from '../../contexts/PWAContext';
import './PWAInstallNudge.css';

interface PWAInstallNudgeProps {
  onDismiss: () => void;
}

export const PWAInstallNudge: React.FC<PWAInstallNudgeProps> = ({ onDismiss }) => {
  const { installState, triggerInstall } = usePWA();
  const [visible, setVisible] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  useEffect(() => {
    const isDismissed = localStorage.getItem('pwa-nudge-dismissed');
    const cooldown = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (isDismissed && (Date.now() - parseInt(isDismissed, 10) < cooldown)) {
      onDismiss();
      return;
    }

    if (installState === 'installed') {
      onDismiss();
      return;
    }

    const shouldShow = installState === 'available' || isIOS;

    if (shouldShow) {
      setVisible(true);

      const autoDismissTimer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300); // Wait for slide-down animation
      }, 8000);

      return () => clearTimeout(autoDismissTimer);
    } else {
      onDismiss();
    }
  }, [installState, isIOS, onDismiss]);

  const handleInstall = async () => {
    setVisible(false);
    await triggerInstall();
    onDismiss();
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('pwa-nudge-dismissed', Date.now().toString());
    setTimeout(onDismiss, 300);
  };

  if (!visible) return null;

  return (
    <div className="pwa-install-nudge slide-up">
      <div className="pwa-nudge-bar-content">
        <h4 className="pwa-nudge-headline">Your listing is live! 🎉</h4>
        <p className="pwa-nudge-body">
          {isIOS 
            ? "Tap the share icon → 'Add to Home Screen' to get instant notifications"
            : "Add CirQl to your home screen — get notified the moment someone messages you about it, even when the browser is closed."}
        </p>
      </div>
      <div className="pwa-nudge-bar-actions">
        {!isIOS && installState === 'available' && (
          <button className="pwa-btn-nudge-primary" onClick={handleInstall}>
            Add to Home Screen
          </button>
        )}
        <button className="pwa-btn-nudge-secondary" onClick={handleDismiss}>
          Maybe later
        </button>
      </div>
    </div>
  );
};
