// InsightsPage.jsx — componentised React dashboard.
// The dashboard.bundle.js in /public/dashboard-js/ acts only as a data bridge,
// calling window.CodiviumInsights.update(payload) which the hook picks up.
import React, { useEffect, useRef, Component } from 'react';
import InsightsDashboard from '../insights/InsightsDashboard.jsx';

class DashboardErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { crashed: false }; }
  static getDerivedStateFromError() { return { crashed: false }; }
  componentDidCatch(err) {
    if (err && err.message && err.message.includes('insertBefore')) return;
    console.warn('[Insights] Dashboard error caught:', err.message);
  }
  render() { return this.props.children; }
}

function loadScript(src) {
  const s = document.createElement('script');
  s.src = src + '?_t=' + Date.now();
  s.defer = true;
  document.body.appendChild(s);
  return s;
}

function cleanupBridge() {
  try {
    if (window.CodiviumInsights?.destroy) window.CodiviumInsights.destroy();
  } catch (_) {}
  document.querySelectorAll('script[src*="dashboard.bundle"]').forEach(el => {
    try { document.body.removeChild(el); } catch (_) {}
  });
}

export default function InsightsPage() {
  const scriptRef = useRef(null);

  useEffect(() => {
    cleanupBridge();
    scriptRef.current = loadScript('/dashboard-js/dashboard.bundle.js');
    return () => {
      cleanupBridge();
      if (scriptRef.current) {
        try { document.body.removeChild(scriptRef.current); } catch (_) {}
        scriptRef.current = null;
      }
    };
  }, []);

  return (
    <DashboardErrorBoundary>
      <InsightsDashboard />
    </DashboardErrorBoundary>
  );
}
