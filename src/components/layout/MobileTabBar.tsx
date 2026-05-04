import React from 'react';
import { NavLink } from 'react-router-dom';
import { Handshake, Home, Search, PlusCircle, User } from 'lucide-react';
import './MobileTabBar.css';

export const MobileTabBar = () => {
  return (
    <nav className="mobile-tab-bar glass">
      <NavLink to="/" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`} end>
        <Home size={24} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/marketplace" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
        <Search size={24} />
        <span>Search</span>
      </NavLink>
      <NavLink to="/create" className={({ isActive }) => `tab-item post-btn ${isActive ? 'active' : ''}`}>
        <div className="post-btn-inner">
          <PlusCircle size={28} />
        </div>
        <span>Post</span>
      </NavLink>
      <NavLink to="/deals" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
        <Handshake size={24} />
        <span>Deals</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
        <User size={24} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};
