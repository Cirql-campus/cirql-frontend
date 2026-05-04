import React from 'react';
import { Logo } from './Logo';
import './GlobalLoadingShell.css';

export const GlobalLoadingShell = () => (
  <div className="global-loading-shell" role="status" aria-live="polite" aria-label="Loading CirQl">
    <div className="global-loading-card">
      <Logo size={34} className="global-loading-logo" />
      <div className="global-loading-spinner" aria-hidden="true" />
      <div>
        <h1>Loading CirQl</h1>
        <p>Preparing your campus marketplace.</p>
      </div>
    </div>
  </div>
);
