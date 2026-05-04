import React from 'react';
import './Select.css';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, error, options, className = '', ...props }) => {
  return (
    <div className={`select-wrapper ${className}`}>
      {label && <label className="select-label">{label}</label>}
      <select className={`select-field ${error ? 'select-error' : ''}`} {...props}>
        <option value="" disabled hidden>Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className="select-error-text">{error}</span>}
    </div>
  );
};
