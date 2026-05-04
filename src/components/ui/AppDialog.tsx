import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './AppDialog.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

interface TextDialogProps {
  open: boolean;
  title: string;
  description: string;
  value: string;
  placeholder?: string;
  submitLabel?: string;
  loading?: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) => {
  if (!open) return null;

  return (
    <div className="app-dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <div className="app-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className={`app-dialog-icon ${danger ? 'danger' : ''}`}>
          <AlertTriangle size={20} />
        </div>
        <div className="app-dialog-content">
          <button className="app-dialog-close" type="button" onClick={onCancel} aria-label="Close dialog">
            <X size={17} />
          </button>
          <h2 id="confirm-dialog-title">{title}</h2>
          <p>{description}</p>
          <div className="app-dialog-actions">
            <button type="button" className="app-dialog-secondary" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </button>
            <button type="button" className={`app-dialog-primary ${danger ? 'danger' : ''}`} onClick={onConfirm} disabled={loading}>
              {loading ? 'Working...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TextDialog = ({
  open,
  title,
  description,
  value,
  placeholder = 'Add details...',
  submitLabel = 'Submit',
  loading = false,
  onChange,
  onCancel,
  onSubmit,
}: TextDialogProps) => {
  if (!open) return null;

  const canSubmit = value.trim().length > 0 && !loading;

  return (
    <div className="app-dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <div className="app-dialog text-dialog" role="dialog" aria-modal="true" aria-labelledby="text-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="app-dialog-content">
          <button className="app-dialog-close" type="button" onClick={onCancel} aria-label="Close dialog">
            <X size={17} />
          </button>
          <h2 id="text-dialog-title">{title}</h2>
          <p>{description}</p>
          <textarea
            className="app-dialog-textarea"
            value={value}
            placeholder={placeholder}
            rows={4}
            onChange={(event) => onChange(event.target.value)}
            autoFocus
          />
          <div className="app-dialog-actions">
            <button type="button" className="app-dialog-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="button" className="app-dialog-primary" onClick={onSubmit} disabled={!canSubmit}>
              {loading ? 'Sending...' : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
