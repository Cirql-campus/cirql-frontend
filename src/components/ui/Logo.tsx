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
      } as React.CSSProperties}
    >
      <span className="brand-logo-mark">
        <span>Cir</span><span className="brand-logo-q">Q</span><span>l</span>
      </span>
    </span>
  );
};
