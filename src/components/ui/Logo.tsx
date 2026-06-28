import React from 'react';
import './Logo.css';

export const Logo: React.FC<{ size?: number, color?: string, lightMode?: boolean, className?: string }> = ({
  size = 32,
  color = '#00e554',
  lightMode = false,
  className,
}) => {
  return (
    <span
      className={['brand-logo', lightMode ? 'brand-logo-light' : '', className].filter(Boolean).join(' ')}
      aria-label="CirQl"
      style={{
        '--logo-size': `${size}px`,
        '--logo-accent': color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
      } as React.CSSProperties}
    >
      <img
        src="/logo.png"
        alt="CirQl Logo"
        style={{
          height: 'var(--logo-size, 32px)',
          width: 'var(--logo-size, 32px)',
          objectFit: 'contain',
        }}
      />
      <span className="brand-logo-mark">
        <span>Cir</span><span className="brand-logo-q">Q</span><span>l</span>
      </span>
    </span>
  );
};
