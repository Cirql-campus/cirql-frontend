import React from 'react';
import { Check, Circle } from 'lucide-react';
import './PasswordRequirements.css';

interface PasswordRequirementsProps {
  value: string;
  confirmValue?: string;
}

export const passwordMeetsRequirements = (value: string): boolean => {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^a-zA-Z0-9]/.test(value)
  );
};

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ value, confirmValue }) => {
  // Only render if the user has typed something
  if (!value) return null;

  const requirements = [
    { id: 'length', label: 'Minimum 8 characters', met: value.length >= 8 },
    { id: 'uppercase', label: '1 Uppercase letter', met: /[A-Z]/.test(value) },
    { id: 'lowercase', label: '1 Lowercase letter', met: /[a-z]/.test(value) },
    { id: 'number', label: '1 Number', met: /[0-9]/.test(value) },
    { id: 'special', label: '1 Special character', met: /[^a-zA-Z0-9]/.test(value) },
  ];

  if (confirmValue !== undefined && confirmValue.length > 0) {
    requirements.push({
      id: 'match',
      label: 'Passwords match',
      met: value === confirmValue,
    });
  }

  return (
    <ul className="password-requirements-list">
      {requirements.map((req) => (
        <li key={req.id} className={`requirement-item ${req.met ? 'is-met' : 'is-unmet'}`}>
          <span className="requirement-icon-wrapper">
            {req.met ? (
              <Check className="requirement-icon icon-check" size={14} />
            ) : (
              <Circle className="requirement-icon icon-circle" size={14} />
            )}
          </span>
          <span className="requirement-text">{req.label}</span>
        </li>
      ))}
    </ul>
  );
};
