import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Plus } from 'lucide-react';
import { OfflineBanner } from '../ui/OfflineBanner';
import { MobileTabBar } from './MobileTabBar';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMessagesRoute = location.pathname === '/messages' || location.pathname.startsWith('/messages/');
  const showMobileTabBar = !location.pathname.startsWith('/messages/');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      // On chat/messages routes: exact height so chat layout is contained
      // On all other routes: min-height so pages can scroll freely
      ...(isMessagesRoute
        ? { height: '100dvh', overflow: 'hidden' }
        : { minHeight: '100vh' }
      ),
    }}>
      <Navbar />
      <main
        className={showMobileTabBar ? 'main-content-with-tabbar' : ''}
        style={{
          flexGrow: 1,
          minHeight: 0,
          // On messages route: overflow hidden so chat-page controls its own scroll
          ...(isMessagesRoute ? { overflow: 'hidden', display: 'flex', flexDirection: 'column' } : {}),
        }}
      >
        <Outlet />
      </main>
      {!isMessagesRoute && <Footer />}

      {/* Floating Action Button for Selling */}
      {!isMessagesRoute && <button
        className="desktop-sell-fab"
        style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 100, 
          height: '52px', padding: '0 22px', background: 'var(--accent)', 
          color: '#000', borderRadius: '30px', fontSize: '14px', 
          fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', 
          boxShadow: '0 6px 24px rgba(35,209,96,.4)', fontFamily: 'var(--font-display)',
          cursor: 'pointer', border: 'none', transition: 'all 0.2s'
        }}
        onClick={() => navigate('/create')}
      >
        <Plus size={18} strokeWidth={3} /> Post Item
      </button>}
      <OfflineBanner />
      {showMobileTabBar && <MobileTabBar />}
    </div>
  );
};
