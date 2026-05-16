import { api } from './api';

export type PushNotificationStatus =
  | 'unsupported'
  | 'missing-key'
  | 'blocked'
  | 'not-enabled'
  | 'enabled';

interface PushResult {
  ok: boolean;
  status: PushNotificationStatus;
  message?: string;
}

/**
 * Converts a base64 string to a Uint8Array
 * Required for passing the VAPID key to the PushManager
 */
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const getServiceWorkerRegistration = async () => {
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return registration;
};

export const getPushNotificationStatus = async (): Promise<PushNotificationStatus> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'unsupported';
  }

  if (!import.meta.env.VITE_VAPID_PUBLIC_KEY) {
    return 'missing-key';
  }

  if (Notification.permission === 'denied') {
    return 'blocked';
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    return subscription ? 'enabled' : 'not-enabled';
  } catch {
    return 'not-enabled';
  }
};

export const subscribeUserToPush = async (): Promise<PushResult> => {
  const currentStatus = await getPushNotificationStatus();
  if (currentStatus === 'unsupported') return { ok: false, status: currentStatus, message: 'Push notifications are not supported in this browser.' };
  if (currentStatus === 'missing-key') return { ok: false, status: currentStatus, message: 'Push notifications are not configured for this environment.' };
  if (currentStatus === 'blocked') return { ok: false, status: currentStatus, message: 'Notifications are blocked in browser settings.' };

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permission for notifications was denied');
      return {
        ok: false,
        status: permission === 'denied' ? 'blocked' : 'not-enabled',
        message: permission === 'denied' ? 'Notifications are blocked in browser settings.' : 'Notification permission was dismissed.',
      };
    }

    const registration = await getServiceWorkerRegistration();
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    }

    await api.post('/users/push/subscribe', { subscription });

    return { ok: true, status: 'enabled', message: 'Push notifications enabled successfully.' };
  } catch (error: unknown) {
    console.error('Error subscribing to push notifications:', error);
    const errorDetails = error && typeof error === 'object'
      ? error as { message?: unknown; name?: unknown; response?: { status?: unknown } }
      : {};
    const errorMessage = typeof errorDetails.message === 'string' ? errorDetails.message : '';
    const errorName = typeof errorDetails.name === 'string' ? errorDetails.name : '';
    const responseStatus = errorDetails.response?.status;
    
    let message = 'Failed to enable push notifications.';
    if (errorMessage.includes('push service error') || errorName === 'AbortError') {
      message = 'Browser blocked notifications (cannot enable push in Incognito or Brave).';
    } else if (responseStatus === 404) {
      message = 'Push notifications are not supported on the server yet.';
    }

    return { ok: false, status: 'not-enabled', message };
  }
};

export const unsubscribeUserFromPush = async (): Promise<PushResult> => {
  const currentStatus = await getPushNotificationStatus();
  if (currentStatus !== 'enabled') {
    return { ok: true, status: currentStatus, message: 'Push notifications are not enabled on this browser.' };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();

    if (!subscription) {
      return { ok: true, status: 'not-enabled', message: 'Push notifications are already disabled.' };
    }

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await api.delete('/users/push/subscribe', { endpoint });

    return { ok: true, status: 'not-enabled', message: 'Push notifications disabled.' };
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return { ok: false, status: 'enabled', message: 'Failed to disable push notifications.' };
  }
};
