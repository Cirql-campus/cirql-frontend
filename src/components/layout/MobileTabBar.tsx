import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Search, MessageCircle, Plus, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './MobileTabBar.css';

export const MobileTabBar = () => {
  const { user, unreadMessages } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <nav className="mobile-tab-bar" aria-label="Mobile Navigation">
      <NavLink
        to="/marketplace"
        className={({ isActive }) =>
          `tab-item ${isActive || location.pathname.startsWith('/item') ? 'active' : ''}`
        }
      >
        <Search size={20} />
        <span>Browse</span>
      </NavLink>

      <NavLink
        to="/messages"
        className={({ isActive }) =>
          `tab-item ${isActive || location.pathname.startsWith('/messages/') ? 'active' : ''}`
        }
      >
        <div className="tab-icon-container">
          <MessageCircle size={20} />
          {unreadMessages > 0 && (
            <span className="tab-badge" aria-label={`${unreadMessages} unread messages`}>
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </div>
        <span>Chat</span>
      </NavLink>

      <NavLink to="/create" className="tab-item sell-tab">
        <div className="sell-icon-wrap">
          <Plus size={22} strokeWidth={3} />
        </div>
        <span>Post Item</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
      >
        <User size={20} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};
