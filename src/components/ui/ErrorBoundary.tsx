import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { captureFrontendException } from '../../utils/monitoring';
import './ErrorBoundary.css';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Frontend render crash:', error, info);
    captureFrontendException(error, { componentStack: info.componentStack });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="app-crash-page">
        <section className="app-crash-card">
          <div className="app-crash-icon">
            <AlertTriangle size={24} />
          </div>
          <h1>Something broke on this page</h1>
          <p>The app is still running. Refresh the page, or go back to the marketplace.</p>
          <div className="app-crash-actions">
            <button type="button" onClick={() => window.location.reload()}>
              <RefreshCcw size={16} /> Refresh
            </button>
            <a href="/marketplace">Marketplace</a>
          </div>
        </section>
      </main>
    );
  }
}
