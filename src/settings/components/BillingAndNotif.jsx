// components/BillingPanel.jsx
import React from 'react';

export function BillingPanel({ plan, invoices, onOpenModal }) {
  const tier = plan?.tier || 'free';
  const canCancel = tier !== 'free' && tier !== 'weekly';

  function handleUpgrade() {
    if (tier === 'weekly') {
      // TODO: link to pricing / checkout
    } else if (tier === 'free') {
      // TODO: link to pricing / checkout
    } else {
      // Monthly/Annual: Stripe Customer Portal
      // TODO: fetch('/api/billing/portal').then(d => window.location.href = d.url)
    }
  }

  const upgradeLabel = tier === 'weekly' ? 'Re-subscribe' : tier === 'free' ? 'Subscribe' : 'Manage plan';

  return (
    <div className="as-tab-panel" id="tab-billing" role="tabpanel" aria-labelledby="tabn-billing" tabIndex={0}>
      <section className="as-section" aria-label="Subscription and Billing">
        <div className="as-section-head">
          <svg className="as-section-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M2 10h20" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span className="as-section-title">Subscription &amp; Billing</span>
        </div>

        <div className="as-row">
          <div className="as-row-text">
            <div className="as-row-label">Current plan</div>
            <div className="as-row-hint" id="asPlanRenewal">{plan?.dateLabel || 'No active subscription'}</div>
          </div>
          <span className={`as-plan-badge${tier === 'free' ? ' free' : ''}`} id="asPlanBadge">
            {plan?.tierLabel || 'Free'}
          </span>
          <button className="as-btn primary" type="button" id="asUpgradeBtn" onClick={handleUpgrade}>
            {upgradeLabel}
          </button>
        </div>

        <div className="as-row">
          <div className="as-row-text">
            <div className="as-row-label">Payment method</div>
            <div className="as-row-hint" id="asPaymentHint">
              {plan?.card || 'No payment method on file'}
            </div>
          </div>
          <button className="as-btn" type="button" onClick={() => onOpenModal('payment')}>Manage</button>
        </div>

        <div className="as-scroll-x">
          <table className="as-billing-table" aria-label="Billing history">
            <thead>
              <tr><th>Date</th><th>Description</th><th>Amount</th><th>Invoice</th></tr>
            </thead>
            <tbody id="asBillingRows">
              {invoices && invoices.length > 0
                ? invoices.map((inv, i) => (
                    <tr key={i}>
                      <td>{inv.date}</td>
                      <td>{inv.desc}</td>
                      <td className="amount">{inv.amount}</td>
                      <td><a className="download-link" href={inv.url}>Download ↓</a></td>
                    </tr>
                  ))
                : <tr><td colSpan={4} className="as-billing-empty">No billing history yet</td></tr>
              }
            </tbody>
          </table>
        </div>

        {canCancel && (
          <div className="as-row">
            <div className="as-row-text">
              <div className="as-row-label">Cancel subscription</div>
              <div className="as-row-hint">You'll keep access until the end of the current billing period</div>
            </div>
            <button className="as-btn danger" type="button" onClick={() => onOpenModal('cancelSub')}>
              Cancel plan
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Notifications panel ───────────────────────────────────────────────────────

import { PrefToggle } from './shared/Widgets.jsx';

export function NotificationsPanel({ prefs, setPref }) {
  return (
    <div className="as-tab-panel" id="tab-notif" role="tabpanel" aria-labelledby="tabn-notif" tabIndex={0}>
      <section className="as-section" aria-label="Notifications">
        <div className="as-section-head">
          <svg className="as-section-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="as-section-title">Notifications</span>
        </div>

        <PrefToggle
          label="Weekly progress summary"
          hint="Email each Monday with your week's practice highlights"
          checked={prefs.notif_weekly_summary === '1'}
          onChange={v => setPref('notif_weekly_summary', v ? '1' : '0')}
        />
        {/* Previously missing from UI — now added (bug fix #3 & #4) */}
        <PrefToggle
          label="Milestone alerts"
          hint="In-app notification when you complete a ring, reach 10 sessions, or finish a full week"
          checked={prefs.notif_milestones === '1'}
          onChange={v => setPref('notif_milestones', v ? '1' : '0')}
        />
        <PrefToggle
          label="In-app notifications"
          hint="Show notification badges and banners within the platform"
          checked={prefs.notif_in_app === '1'}
          onChange={v => setPref('notif_in_app', v ? '1' : '0')}
        />
        <PrefToggle
          label="Product updates &amp; tips"
          hint="Occasional emails about new features and learning tips"
          checked={prefs.notif_marketing === '1'}
          onChange={v => setPref('notif_marketing', v ? '1' : '0')}
        />
        <p className="as-note">
          Transactional emails (password reset, email verification) are always sent.
          You can unsubscribe from any other email via the link at the bottom of each message.
        </p>
      </section>
    </div>
  );
}
