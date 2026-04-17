// src/shared/ErrorBoundary.jsx
// Single canonical ErrorBoundary used by all page entry points.
// Class component — required by React (hooks cannot catch render errors).

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Log to console so errors are visible even when the UI is replaced
    console.error('[Codivium] React render error:', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '32px', fontFamily: 'monospace', fontSize: '14px',
          background: '#1a1a2e', color: '#ff6b8a', minHeight: '200px',
          border: '1px solid rgba(255,107,138,0.3)', margin: '20px', borderRadius: '8px',
        }}>
          <strong>React render error — check the browser console for details</strong>
          <br /><br />
          {String(this.state.error)}
        </div>
      );
    }
    return this.props.children;
  }
}
