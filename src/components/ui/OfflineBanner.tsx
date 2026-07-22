import React, { useEffect, useState } from 'react';
import './OfflineBanner.css';

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => { setIsOffline(true); setWasOffline(true); };
    const goOnline = () => {
      setIsOffline(false);
      // Show "back online" briefly then hide
      setTimeout(() => setWasOffline(false), 3000);
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline && !wasOffline) return null;

  return (
    <div className={`offline-banner ${isOffline ? 'offline' : 'back-online'}`}>
      {isOffline
        ? "📡 You're offline — messages will send when connection returns"
        : '✓ Back online'}
    </div>
  );
};
