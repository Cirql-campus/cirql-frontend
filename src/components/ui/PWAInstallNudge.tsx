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

    if (isDismissed) {
      setTimeout(onDismiss, 0);
      return;
    }

    if (installState === 'installed') {
      setTimeout(onDismiss, 0);
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
      setTimeout(onDismiss, 0);
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
        <h4 className="pwa-nudge-headline">Install CirQl PWA 🎉</h4>
        <p className="pwa-nudge-body">
          {isIOS 
            ? "Tap the share icon → 'Add to Home Screen' to get instant notifications"
            : "Add CirQl to your home screen to get instant alerts and chat messages when the app is closed."}
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
