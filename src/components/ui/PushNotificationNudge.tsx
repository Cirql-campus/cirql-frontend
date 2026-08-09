import React, { useEffect, useState } from 'react';
import { usePWA } from '../../contexts/PWAContext';
import { subscribeUserToPush, getPushNotificationStatus } from '../../utils/pushNotifications';
import './PWAInstallNudge.css';

interface PushNotificationNudgeProps {
  onDismiss: () => void;
}

export const PushNotificationNudge: React.FC<PushNotificationNudgeProps> = ({ onDismiss }) => {
  const { checkPushStatus } = usePWA();
  const [visible, setVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const checkConditions = async () => {
      const isDismissed = localStorage.getItem('push-nudge-dismissed');

      if (isDismissed) {
        setTimeout(onDismiss, 0);
        return;
      }

      try {
        const status = await getPushNotificationStatus();
        if (status === 'not-enabled') {
          setVisible(true);
        } else {
          setTimeout(onDismiss, 0);
        }
      } catch {
        setTimeout(onDismiss, 0);
      }
    };

    checkConditions();
  }, [onDismiss]);

  const handleSubscribe = async () => {
    try {
      const result = await subscribeUserToPush();
      await checkPushStatus();

      if (result.ok) {
        setIsSuccess(true);
        setStatusMessage("✓ Notifications on! You'll hear back the moment they reply.");
        
        // Success message displays for 3 seconds, then dismisses
        setTimeout(() => {
          setVisible(false);
          setTimeout(onDismiss, 300);
        }, 3000);
      } else {
        setIsError(true);
        setStatusMessage(result.message || 'Failed to enable notifications.');
      }
    } catch {
      setIsError(true);
      setStatusMessage('An unexpected error occurred while enabling notifications.');
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('push-nudge-dismissed', Date.now().toString());
    setTimeout(onDismiss, 300);
  };

  const handleGotIt = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (!visible) return null;

  return (
    <div className="pwa-install-nudge slide-up">
      <div className="pwa-nudge-bar-content">
        {statusMessage ? (
          <>
            <h4 className="pwa-nudge-headline">{isSuccess ? 'Success ✓' : 'Notification Alert'}</h4>
            <p className="pwa-nudge-body">{statusMessage}</p>
          </>
        ) : (
          <>
            <h4 className="pwa-nudge-headline">Enable Notifications</h4>
            <p className="pwa-nudge-body">
              Turn on notifications so you don't miss chat replies and updates from buyers and sellers.
            </p>
          </>
        )}
      </div>
      <div className="pwa-nudge-bar-actions">
        {statusMessage ? (
          isError && (
            <button className="pwa-btn-nudge-primary" onClick={handleGotIt}>
              Got it
            </button>
          )
        ) : (
          <>
            <button className="pwa-btn-nudge-primary" onClick={handleSubscribe}>
              Turn On Notifications
            </button>
            <button className="pwa-btn-nudge-secondary" onClick={handleDismiss}>
              No thanks
            </button>
          </>
        )}
      </div>
    </div>
  );
};
