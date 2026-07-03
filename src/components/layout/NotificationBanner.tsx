import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePWA } from '../../contexts/PWAContext';
import { subscribeUserToPush } from '../../utils/pushNotifications';
import { X } from 'lucide-react';
import './NotificationBanner.css';

export const NotificationBanner = () => {
  const { isLoggedIn } = useAuth();
  const { installState, pushStatus, triggerInstall, checkPushStatus } = usePWA();
  const [showType, setShowType] = useState<'install' | 'push' | null>(null);

  const checkDismiss = (key: string, cooldownDays: number): boolean => {
    const dismissedAt = localStorage.getItem(key);
    if (!dismissedAt) return false;
    const cooldown = cooldownDays * 24 * 60 * 60 * 1000;
    return Date.now() - parseInt(dismissedAt, 10) < cooldown;
  };

  useEffect(() => {
    const isInstallDismissed = checkDismiss('banner-install-dismissed', 3);
    const isPushDismissed = checkDismiss('banner-push-dismissed', 3);

    if (installState === 'available' && !isInstallDismissed) {
      setShowType('install');
    } else if (pushStatus === 'not-enabled' && isLoggedIn && !isPushDismissed) {
      setShowType('push');
    } else {
      setShowType(null);
    }
  }, [installState, pushStatus, isLoggedIn]);

  const handleInstall = async () => {
    await triggerInstall();
  };

  const handleEnablePush = async () => {
    try {
      await subscribeUserToPush();
      await checkPushStatus();
    } catch (e) {
      console.error('Failed to enable push notifications from banner:', e);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showType === 'install') {
      localStorage.setItem('banner-install-dismissed', Date.now().toString());
    } else if (showType === 'push') {
      localStorage.setItem('banner-push-dismissed', Date.now().toString());
    }
    setShowType(null);
  };

  if (!showType) return null;

  return (
    <div className="notification-banner">
      <div className="container banner-content">
        <div className="banner-message-wrap">
          {showType === 'install' ? (
            <>
              <span className="banner-text">📲 Add CirQl to your home screen for instant buyer alerts</span>
              <button className="banner-action-btn" onClick={handleInstall}>
                Install
              </button>
            </>
          ) : (
            <>
              <span className="banner-text">🔔 Enable notifications — know the moment your item sells</span>
              <button className="banner-action-btn" onClick={handleEnablePush}>
                Enable
              </button>
            </>
          )}
        </div>
        <button className="banner-close-btn" onClick={handleDismiss} aria-label="Dismiss banner">
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
