import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallState = 'not-available' | 'available' | 'installed';

export function usePWAInstall() {
  const [installState, setInstallState] = useState<InstallState>('not-available');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstallState('installed');
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallState('available');
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstallState('installed'));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') setInstallState('installed');
    return outcome;
  };

  return { installState, triggerInstall };
}
