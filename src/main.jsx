import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './assets/styles/main.css';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div style={{
        padding: '40px', fontFamily: 'monospace', fontSize: '14px',
        background: '#1a1a2e', color: '#ff6b8a', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <strong>Something went wrong</strong>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
        <button onClick={() => window.location.reload()}
          style={{ padding: '8px 16px', cursor: 'pointer', width: 'fit-content' }}>
          Reload
        </button>
      </div>
    );
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  </ErrorBoundary>
);
