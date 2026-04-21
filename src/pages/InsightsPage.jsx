// InsightsPage.jsx — thin wrapper around the componentised React dashboard.
// The dashboard is self-contained: useDashboardData() waits for external
// callers to push data via window.CodiviumInsights.update(payload).
// No dashboard.bundle.js — it was the old server-rendered bridge and
// clashed with the React portals (NotFoundError on navigation away).
import React, { Component } from 'react';
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

export default function InsightsPage() {
  return (
    <main id="main-content" className="main" role="main">
      <DashboardErrorBoundary>
        <InsightsDashboard />
      </DashboardErrorBoundary>
    </main>
  );
}
