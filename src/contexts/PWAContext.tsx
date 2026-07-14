import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { getPushNotificationStatus } from '../utils/pushNotifications';
import { PWAInstallNudge } from '../components/ui/PWAInstallNudge';
import { PushNotificationNudge } from '../components/ui/PushNotificationNudge';

interface PWAContextType {
  installState: 'not-available' | 'available' | 'installed';
  pushStatus: string;
  triggerInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  showInstallNudge: () => void;
  showPushNudge: () => void;
  checkPushStatus: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { installState, triggerInstall } = usePWAInstall();
  const [pushStatus, setPushStatus] = useState<string>('not-enabled');
  const [activeNudge, setActiveNudge] = useState<'install' | 'push' | null>(null);
  const location = useLocation();

  const showInstallNudge = useCallback(() => {
    if (installState === 'installed') return;
    setActiveNudge('install');
  }, [installState]);

  const showPushNudge = useCallback(() => {
    // Priority: do NOT show push nudge if install nudge is active (install nudge covers both)
    if (activeNudge === 'install') return;
    if (pushStatus === 'not-enabled') {
      setActiveNudge('push');
    }
  }, [activeNudge, pushStatus]);

  const checkPushStatus = async () => {
    try {
      const status = await getPushNotificationStatus();
      setPushStatus(status);
    } catch (e) {
      console.error('Error checking push notification status:', e);
    }
  };

  // Perform checks on startup
  useEffect(() => {
    setTimeout(() => {
      checkPushStatus();
    }, 0);
  }, []);

  // Listen to route changes to show nudges after redirects
  useEffect(() => {
    const pendingNudge = sessionStorage.getItem('show_pwa_nudge');
    if (pendingNudge === 'listing') {
      sessionStorage.removeItem('show_pwa_nudge');
      const timer = setTimeout(() => {
        showInstallNudge();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, showInstallNudge]);

  const dismissNudge = useCallback(() => {
    setActiveNudge(null);
  }, []);

  return (
    <PWAContext.Provider value={{
      installState,
      pushStatus,
      triggerInstall,
      showInstallNudge,
      showPushNudge,
      checkPushStatus,
    }}>
      {children}
      {activeNudge === 'install' && <PWAInstallNudge onDismiss={dismissNudge} />}
      {activeNudge === 'push' && <PushNotificationNudge onDismiss={dismissNudge} />}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
