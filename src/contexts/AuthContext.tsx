import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { api, getErrorMessage, registerTokenGetter } from '../utils/api';
import { initSocket, disconnectSocket } from '../utils/socket';

export interface User {
  _id: string;
  name: string;
  email: string;
  college: string;
  initials: string;
  avatar: string;
  rating: number;
  reviewCount?: number;
  listingCount?: number;
  soldCount?: number;
  isVerified: boolean;
  role?: 'user' | 'admin';
  pushSubscriptionCount?: number;
  notificationPreferences?: {
    pushEnabled: boolean;
    messages: boolean;
    deals: boolean;
    wanted: boolean;
    moderation: boolean;
    messagePreview: boolean;
  };
  trust?: {
    score: number;
    badges: string[];
    accountAgeDays: number;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  isLoggedIn: boolean;
  unreadMessages: number;
  setUnreadMessages: React.Dispatch<React.SetStateAction<number>>;
  unreadAlerts: number;
  setUnreadAlerts: React.Dispatch<React.SetStateAction<number>>;
  fetchUnreadCounts: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    registerTokenGetter(
      () => accessTokenRef.current,
      (token) => { accessTokenRef.current = token; }
    );
  }, []);

  const setupGlobalSockets = (token?: string) => {
    const socket = initSocket(token || accessTokenRef.current || undefined);
    
    socket.off('new_message');
    socket.off('notification');
    socket.off('new_notification');

    socket.on('new_message', () => {
      setUnreadMessages(prev => prev + 1);
    });

    socket.on('notification', () => {
      setUnreadAlerts(prev => prev + 1);
    });

    socket.on('new_notification', ({ notification }: { notification: any }) => {
      if (notification?.type !== 'message') {
        setUnreadAlerts(prev => prev + 1);
      }
    });
  };

  const fetchUnreadCounts = async () => {
    try {
      const [chatRes, notifRes] = await Promise.all([
        api.get<{ unreadCount: number }>('/chat/unread-count'),
        api.get<{ unreadCount: number }>('/notifications?limit=1')
      ]);
      setUnreadMessages(chatRes.unreadCount || 0);
      setUnreadAlerts(notifRes.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      const res = await api.get<{ success: boolean; user: User }>('/users/me');
      setUser(res.user);
      return res.user;
    } catch {
      setUser(null);
      return null;
    }
  };

  // Load user on open
  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const res = await api.get<{ success: boolean; user: User }>('/users/me');
        if (isMounted) {
          setUser(res.user);
          setupGlobalSockets();
          fetchUnreadCounts();
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await api.post<{ success: boolean; user: User; accessToken?: string }>('/auth/login', { email, password });
      if (res.accessToken) {
        accessTokenRef.current = res.accessToken;
        setupGlobalSockets(res.accessToken);
      }
      setUser(res.user);
      fetchUnreadCounts();
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: getErrorMessage(err, 'Login failed') };
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      await api.post('/auth/register', { name, email, password });
      // Don't set user yet, wait for OTP
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: getErrorMessage(err, 'Signup failed') };
    }
  };

  const verifyOTP = async (email: string, otp: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await api.post<{ success: boolean; user: User; accessToken?: string }>('/auth/verify-otp', { email, otp });
      if (res.accessToken) {
        accessTokenRef.current = res.accessToken;
        setupGlobalSockets(res.accessToken);
      }
      setUser(res.user);
      fetchUnreadCounts();
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: getErrorMessage(err, 'OTP verification failed') };
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch { /* ignore offline */ }
    accessTokenRef.current = null;
    disconnectSocket();
    setUser(null);
    setUnreadMessages(0);
    setUnreadAlerts(0);
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, login, signup, verifyOTP, logout, refreshUser, isLoggedIn: !!user,
      unreadMessages, setUnreadMessages, unreadAlerts, setUnreadAlerts, fetchUnreadCounts,
      getAccessToken: () => accessTokenRef.current
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
