// SettingsPage.jsx — Account & Settings with working theme picker
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActivePackagebyuserid,
  getUserTransactionHistory,
  activepackagecancelByUser,
  getInvoiceUrl,
} from '../api/pricepackage/apipackage';
import { getUserById } from '../api/auth/apiauth';

// Temporarily force the "no package" billing view for everyone — hides the
// active-subscription details, billing history, and the Cancel option. The
// billing management feature isn't being exposed to clients yet. Set this back
// to false to restore the real billing view.
const FORCE_NO_PACKAGE_BILLING = true;

function loadScript(src, onload) {
  const s = document.createElement('script');
  s.src = src + '?v=' + Date.now();
  if (onload) s.onload = onload;
  document.body.appendChild(s);
  return s;
}

// ── Real-profile guard ─────────────────────────────────────────────
// The demo script (account-settings-demo.js) seeds cv_profile_name with a
// dummy ("Alex Thornton") and account-settings.js writes it into the shared
// sidebar #profileName element — clobbering the real logged-in name. These
// helpers force the REAL name/email (persisted at login as UserDisplayName/
// UserEmail) back into both localStorage and the DOM.
function getRealProfile() {
  let name = '', email = '';
  try {
    name = (localStorage.getItem('UserDisplayName') || '').trim();
    email = (localStorage.getItem('UserEmail') || '').trim();
  } catch (_) { /* ignore */ }
  return { name, email };
}

function applyRealProfileToStorage() {
  const { name, email } = getRealProfile();
  try {
    if (name) localStorage.setItem('cv_profile_name', name);
    if (email) localStorage.setItem('cv_profile_email', email);
  } catch (_) { /* ignore */ }
}

function applyRealProfileToDom() {
  applyRealProfileToStorage();
  const { name, email } = getRealProfile();
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el && val) el.textContent = val;
  };
  if (name) { setText('profileName', name); setText('asDisplayNameVal', name); }
  if (email) setText('asEmailVal', email);
}

// Set window.CVTheme directly — keys match the [data-theme="..."] rules in our CSS
function setupCVTheme() {
  if (window.CVTheme) return;
  window.CVTheme = {
    VALID: ['obsidian', 'vanta-black', 'ebony', 'dark-charcoal', 'slate', 'glacier-slate', 'frost', 'parchment'],
    LABELS: {
      'obsidian':       'Obsidian',
      'vanta-black':    'Vanta Black',
      'ebony':          'Ebony',
      'dark-charcoal':  'Dark Charcoal',
      'slate':          'Slate',
      'glacier-slate':  'Glacier Slate',
      'frost':          'Frost',
      'parchment':      'Parchment',
    },
    SWATCHES: {
      'obsidian':       { bg: '#0B1020', accent: '#F6D58A' },
      'vanta-black':    { bg: '#000000', accent: '#F6D58A' },
      'ebony':          { bg: '#12101A', accent: '#A78BFA' },
      'dark-charcoal':  { bg: '#1A1A1C', accent: '#D9C07C' },
      'slate':          { bg: '#1B2431', accent: '#60A5FA' },
      'glacier-slate':  { bg: '#2A3A4C', accent: '#7FAFD9' },
      'frost':          { bg: '#E8F0F7', accent: '#2E6FA3' },
      'parchment':      { bg: '#F5F0E8', accent: '#8B1A1A' },
    },
    get: function () {
      try { return localStorage.getItem('cv_site_theme') || 'obsidian'; } catch (e) { return 'obsidian'; }
    },
    set: function (key) {
      try { localStorage.setItem('cv_site_theme', key); } catch (e) {}
      document.documentElement.setAttribute('data-theme', key);
    },
  };
  try {
    document.documentElement.setAttribute('data-theme', window.CVTheme.get());
  } catch (e) {}
}

export default function SettingsPage() {
  const initialized = useRef(false);
  const navigate = useNavigate();

  // Real billing data in the Billing tab: current plan, payment summary, billing
  // history, and a working Upgrade/Cancel. The external account-settings.js fills
  // these from demo data, so we fetch live data and overwrite the nodes (and
  // re-apply once after the controller script runs, to win the race).
  useEffect(() => {
    const userId = localStorage.getItem('Userid');
    if (!userId) return;
    let cancelled = false;
    let timer;

    const fmtDate = (d) => {
      if (!d) return '—';
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return '—';
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}/${dt.getFullYear()}`;
    };

    // Same sliding progress bar as the interview/micro menu loader (.cv-progress).
    const PROGRESS =
      '<div class="cv-progress" role="progressbar" aria-label="Loading" ' +
      'style="margin:0 auto;"><div class="cv-progress-bar"></div></div>';

    let dataReady = false;
    const showLoading = () => {
      const rows = document.getElementById('asBillingRows');
      const payHint = document.getElementById('asPaymentHint');
      const renewal = document.getElementById('asPlanRenewal');
      const badge = document.getElementById('asPlanBadge');
      if (rows) rows.innerHTML = `<tr><td colspan="6" class="as-billing-empty">${PROGRESS}</td></tr>`;
      if (payHint) payHint.innerHTML = PROGRESS;
      if (renewal) renewal.textContent = 'Loading…';
      if (badge) badge.textContent = '…';
    };
    // Show the loader immediately and keep re-asserting it (so the external
    // demo data never flashes) until the real data arrives.
    showLoading();
    const guard = setInterval(() => { if (!dataReady) showLoading(); }, 150);

    (async () => {
      let pkg = null;
      try {
        const res = await ActivePackagebyuserid(userId);
        if (res?.status === 200 && res.data) pkg = res.data;
      } catch (e) { /* fall back to cached */ }
      if (!pkg) {
        try { pkg = JSON.parse(localStorage.getItem('userpackagedetails') || 'null'); } catch (e) {}
      }

      let history = [];
      try {
        const hres = await getUserTransactionHistory(userId);
        if (hres?.status === 200 && Array.isArray(hres.data)) history = hres.data;
      } catch (e) {}

      // Force the empty "no package" view: pretend there's no plan and no
      // billing history, so the active-subscription UI never shows.
      if (FORCE_NO_PACKAGE_BILLING) { pkg = null; history = []; }

      dataReady = true;
      clearInterval(guard);
      if (cancelled) return;

      const name = pkg ? (pkg.packageName || pkg.PackageName) : null;
      const end = pkg ? (pkg.endDate || pkg.EndDate) : null;
      const billingPeriod = pkg ? (pkg.billingPeriod || pkg.BillingPeriod) : null;
      const price = pkg ? (pkg.price ?? pkg.Price) : null;
      const activePkgId = pkg ? (pkg.id ?? pkg.Id) : null;
      const isFreePlan =
        !pkg ||
        (pkg.isDefault ?? pkg.IsDefault) === true ||
        (pkg.isAccessToAllCodingQuestions ?? pkg.IsAccessToAllCodingQuestions) === false;

      const apply = () => {
        const badge = document.getElementById('asPlanBadge');
        const renewal = document.getElementById('asPlanRenewal');
        const payHint = document.getElementById('asPaymentHint');
        const rows = document.getElementById('asBillingRows');
        const upgradeBtn = document.getElementById('asUpgradeBtn');
        const confirmCancel = document.getElementById('confirmCancelSub');

        if (badge) {
          badge.textContent = name || 'No plan';
          badge.className = 'as-plan-badge' + (isFreePlan ? ' free' : '');
        }
        // Money helper: round to whole dollars with a $ prefix.
        const money = (v) => `$${Math.round(Number(v) || 0)}`;
        const num = (v) => Number(v) || 0;

        // Latest active transaction row — carries amount/discount/coupon/next date.
        const active = history.find(
          (h) => (h.isActive ?? h.IsActive) && (h.subscriptionstatus ?? h.Subscriptionstatus ?? '').toLowerCase() !== 'canceled',
        ) || history[0];
        const activeStatus = (active && (active.subscriptionstatus ?? active.Subscriptionstatus) || '').toLowerCase();
        const isCanceled = activeStatus === 'canceled' || activeStatus === 'cancelled';
        const isRecurring =
          (pkg ? ((pkg.isRecurring ?? pkg.IsRecurring) || (pkg.isautorenewal ?? pkg.Isautorenewal)) : false)
          || (active ? (active.isautorenewal ?? active.Isautorenewal) : false);
        const nextDate = active ? (active.nextPaymentDate ?? active.NextPaymentDate) : null;

        // Renewal amount: full base, minus the discount if the coupon keeps
        // applying ("forever"/"repeating"); "once" reverts to full price.
        const renewBase = active ? num(active.packageAmount ?? active.PackageAmount ?? active.price ?? active.Price) : num(price);
        const renewDisc = active ? num(active.discountAmount ?? active.DiscountAmount) : 0;
        const couponDur = (active && (active.couponDuration ?? active.CouponDuration) || '').toLowerCase();
        const renewAmt =
          renewDisc > 0 && (couponDur === 'forever' || couponDur === 'repeating')
            ? Math.max(0, renewBase - renewDisc)
            : renewBase;
        const renewBp = (active && (active.billingPeriod ?? active.BillingPeriod)) || billingPeriod || 'month';

        if (renewal) {
          // Show the next-payment date (+ amount) when the plan will renew.
          renewal.textContent = !pkg
            ? 'No active plan'
            : isFreePlan
              ? 'Free plan'
              : isCanceled
                ? (end ? `Cancels — access until ${fmtDate(end)}` : 'Cancelled')
                : nextDate
                  ? `Next payment ${fmtDate(nextDate)} — ${money(renewAmt)} / ${renewBp}`
                  : (end ? `Active until ${fmtDate(end)}` : 'Active');
        }

        if (payHint) {
          payHint.textContent =
            !pkg || isFreePlan ? 'No paid subscription' : `${money(price ?? 0)} / ${billingPeriod || 'month'}`;
        }

        // ── Pricing breakdown for the active plan (coupon-aware) ──
        const pricingRow = document.getElementById('asPlanPricingRow');
        const pricing = document.getElementById('asPlanPricing');
        if (pricing && pricingRow) {
          const discount = active ? num(active.discountAmount ?? active.DiscountAmount) : 0;
          const coupon = active
            ? (active.couponName ?? active.CouponName ?? active.couponPromotionCodeName ?? active.CouponPromotionCodeName ?? '')
            : '';
          // Suggestion 4: lifetime savings across all paid history.
          const totalSaved = history.reduce((sum, h) => sum + num(h.discountAmount ?? h.DiscountAmount), 0);
          const parts = [];
          if (!isFreePlan && active && discount > 0) {
            const original = num(active.packageAmount ?? active.PackageAmount ?? active.price ?? active.Price);
            const paid = Math.max(0, original - discount);
            // Suggestion 2: show the discount as a percentage too.
            const pct = original > 0 ? Math.round((discount / original) * 100) : 0;
            const offLabel = pct > 0 ? `−${money(discount)} (${pct}% off)` : `−${money(discount)} off`;
            const bp = (active.billingPeriod ?? active.BillingPeriod ?? billingPeriod) || 'month';
            parts.push(
              `<span style="text-decoration:line-through;opacity:.6">${money(original)}</span> ` +
              `<strong>${money(paid)}</strong> / ${bp}` +
              ` &middot; <span style="color:var(--color-text-accent,#d8b268)">${coupon ? coupon + ': ' : ''}${offLabel}</span>`,
            );
          }
          if (totalSaved > 0) {
            parts.push(`<span style="opacity:.85">You've saved <strong>${money(totalSaved)}</strong> with coupons</span>`);
          }
          if (parts.length) {
            pricing.innerHTML = parts.join('<br/>');
            pricingRow.hidden = false;
          } else {
            pricingRow.hidden = true;
          }
        }

        if (rows) {
          if (!history.length) {
            rows.innerHTML = '<tr><td colspan="6" class="as-billing-empty">No billing history yet</td></tr>';
          } else {
            rows.innerHTML = history
              .map((h) => {
                const d = fmtDate(h.startDate ?? h.StartDate);
                const bp = h.billingPeriod ?? h.BillingPeriod;
                const coupon = h.couponName ?? h.CouponName ?? h.couponPromotionCodeName ?? h.CouponPromotionCodeName ?? '';
                const desc = (h.packageName ?? h.PackageName ?? 'Plan') + (bp ? ` (${bp})` : '') +
                  (coupon ? ` · <span style="color:var(--color-text-accent,#d8b268)">${coupon}</span>` : '');
                const discount = num(h.discountAmount ?? h.DiscountAmount);
                const baseAmt = num(h.packageAmount ?? h.PackageAmount ?? h.price ?? h.Price);
                const paid = Math.max(0, baseAmt - discount);
                const status =
                  h.subscriptionstatus ?? h.Subscriptionstatus ?? ((h.isActive ?? h.IsActive) ? 'active' : '—');
                // Suggestion 3: on-demand Stripe hosted-invoice link.
                const pid = h.userPaymentId ?? h.UserPaymentId ?? 0;
                const invoiceCell = pid > 0
                  ? `<a href="#" class="as-invoice-link" data-payment-id="${pid}" style="color:var(--color-text-accent,#d8b268)">View</a>`
                  : '—';
                return `<tr><td>${d}</td><td>${desc}</td><td>${discount > 0 ? '−' + money(discount) : '—'}</td><td>${money(paid)}</td><td>${status}</td><td>${invoiceCell}</td></tr>`;
              })
              .join('');

            // Delegated handler: fetch the invoice URL on click and open it.
            rows.onclick = async (ev) => {
              const link = ev.target.closest && ev.target.closest('.as-invoice-link');
              if (!link) return;
              ev.preventDefault();
              const pid = Number(link.getAttribute('data-payment-id'));
              if (!pid) return;
              const original = link.textContent;
              link.textContent = 'Opening…';
              try {
                const r = await getInvoiceUrl(pid);
                const u = r?.status === 200 ? (r.data?.url || r.data?.Url) : null;
                if (u) window.open(u, '_blank', 'noopener');
                else link.textContent = original;
              } catch (_) { link.textContent = original; }
              if (link.isConnected) link.textContent = original;
            };
          }
        }
        if (upgradeBtn) {
          upgradeBtn.onclick = () => navigate('/pricing');
        }
        if (confirmCancel) {
          confirmCancel.onclick = async () => {
            if (!activePkgId || isFreePlan) return;
            confirmCancel.disabled = true;
            try { await activepackagecancelByUser(activePkgId); } catch (e) {}
            // Clear the cached package so the UI doesn't show the now-canceled plan.
            try { localStorage.removeItem('userpackagedetails'); } catch (e) {}
            window.location.reload();
          };
        }
      };
      apply();
      timer = setTimeout(apply, 1500);
    })();
    return () => { cancelled = true; clearTimeout(timer); clearInterval(guard); };
  }, [navigate]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Step 1: set window.CVTheme directly (no DOM injection = no React conflict)
    setupCVTheme();

    // If the real name isn't cached yet (e.g. an older session), fetch it once
    // so the guard below has something to apply instead of the demo dummy.
    if (!getRealProfile().name) {
      try {
        const uid = localStorage.getItem('Userid');
        if (uid) {
          getUserById(uid).then((res) => {
            if (res?.status === 200 && res.data) {
              const d = res.data;
              const full = [d.firstName, d.middleName, d.lastName].filter(Boolean).join(' ').trim();
              if (full) localStorage.setItem('UserDisplayName', full);
              if (d.email) localStorage.setItem('UserEmail', d.email);
              applyRealProfileToDom();
            }
          });
        }
      } catch (_) { /* ignore */ }
    }

    // Step 2: load demo data, then load the settings controller. After each
    // step, force the REAL profile back so the demo dummy never sticks in the
    // sidebar (#profileName) or the settings fields.
    applyRealProfileToStorage();
    const s1 = loadScript('/account-settings-demo.js', () => {
      // Demo just overwrote cv_profile_name with the dummy — restore real value
      // BEFORE the controller reads it.
      applyRealProfileToStorage();
      loadScript('/account-settings.js', () => {
        applyRealProfileToDom();
        setTimeout(applyRealProfileToDom, 150);
        setTimeout(applyRealProfileToDom, 600);
      });
    });

    return () => {
      try { document.body.removeChild(s1); } catch (_) {}
    };
  }, []);

  return (
    <main id="main-content" className="main cv-settings" role="main">
      <div className="as-wrap">
        <div className="as-window">
          <div className="as-window-title">Account &amp; Settings</div>
          <div className="as-window-scroll">
            <div className="as-inner">

              {/* ── Main tabs ── */}
              <div className="as-tabs" role="tablist" aria-label="Settings sections">
                <button className="as-tab active" role="tab" aria-selected="true"
                  aria-controls="tab-account" id="tabn-account" type="button" data-tab="account">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
                    <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>Account
                </button>
                <button className="as-tab" role="tab" aria-selected="false"
                  aria-controls="tab-billing" id="tabn-billing" type="button" data-tab="billing">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 10h20" stroke="currentColor" strokeWidth="2"/>
                  </svg>Billing
                </button>
                <button className="as-tab" role="tab" aria-selected="false"
                  aria-controls="tab-notif" id="tabn-notif" type="button" data-tab="notif">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>Notifications
                </button>
                <button className="as-tab" role="tab" aria-selected="false"
                  aria-controls="tab-appear" id="tabn-appear" type="button" data-tab="appear">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>Appearance
                </button>
              </div>

              {/* Sub-tab nav (hidden until Appearance tab active) */}
              <div className="as-subtabs" role="tablist" aria-label="Appearance sections" hidden>
                <button className="as-subtab active" role="tab" aria-selected="true" aria-controls="asp-general" data-subtab="general" type="button">General</button>
                <button className="as-subtab" role="tab" aria-selected="false" aria-controls="asp-editor" data-subtab="editor" type="button">Code Editor</button>
                <button className="as-subtab" role="tab" aria-selected="false" aria-controls="asp-repl" data-subtab="repl" type="button">REPL</button>
                <button className="as-subtab" role="tab" aria-selected="false" aria-controls="asp-instruct" data-subtab="instruct" type="button">Instructions &amp; Tutorial</button>
              </div>

              <div className="as-tab-panels">

                {/* ── ACCOUNT ── */}
                <div className="as-tab-panel" id="tab-account" role="tabpanel" aria-labelledby="tabn-account" tabIndex="0">
                  <section className="as-section" aria-label="Account and Identity">
                    <div className="as-section-head">
                      <svg className="as-section-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
                        <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span className="as-section-title">Account &amp; Identity</span>
                    </div>
                    <div className="as-avatar-row">
                      <img id="asAvatarImg" src="/assets/img/profile-placeholder.svg" alt="Profile photo" className="as-avatar"/>
                      <div className="as-avatar-text">
                        <div className="as-row-label">Profile photo</div>
                        <div className="as-row-hint">JPG or PNG, up to 2 MB</div>
                      </div>
                      <div className="as-avatar-btns">
                        <button className="as-btn" type="button" id="asAvatarUploadBtn">Upload</button>
                        <button className="as-btn" type="button" id="asAvatarRemoveBtn">Remove</button>
                      </div>
                      <input type="file" id="asAvatarFile" accept="image/jpeg,image/png" className="as-file-hidden" aria-label="Upload profile photo"/>
                    </div>
                    <div className="as-row">
                      <div className="as-row-text">
                        <div className="as-row-label">Display name</div>
                        <div className="as-row-hint">Your profile name</div>
                      </div>
                      <span className="as-row-value" id="asDisplayNameVal">—</span>
                      <button className="as-btn" type="button" data-modal="displayName">Change</button>
                    </div>
                    <div className="as-row">
                      <div className="as-row-text"><div className="as-row-label">Email address</div></div>
                      <span className="as-row-value" id="asEmailVal">—</span>
                      <button className="as-btn" type="button" data-modal="email">Change</button>
                    </div>
                    <div className="as-row">
                      <div className="as-row-text">
                        <div className="as-row-label">Password</div>
                        <div className="as-row-hint">Use a strong password you don't use elsewhere</div>
                      </div>
                      <span className="as-row-value">••••••••</span>
                      <button className="as-btn" type="button" data-modal="password">Change</button>
                    </div>
                    <p className="as-note">Changes to email or password require your current password to confirm.</p>
                  </section>
                  <section className="as-section as-danger-zone" aria-label="Danger zone">
                    <div className="as-section-head">
                      <svg className="as-section-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span className="as-section-title">Danger zone</span>
                    </div>
                    <div className="as-row">
                      <div className="as-row-text">
                        <div className="as-row-label">Delete account</div>
                        <div className="as-row-hint">Permanently removes your account, all session data, and cancels any active subscription. This cannot be undone.</div>
                      </div>
                      <button className="as-btn danger" type="button" data-modal="deleteAccount">Delete account</button>
                    </div>
                  </section>
                </div>

                {/* ── BILLING ── */}
                <div className="as-tab-panel" id="tab-billing" role="tabpanel" aria-labelledby="tabn-billing" tabIndex="0" hidden>
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
                        <div className="as-row-hint" id="asPlanRenewal">—</div>
                      </div>
                      <span className="as-plan-badge" id="asPlanBadge">—</span>
                      <button className="as-btn primary" type="button" id="asUpgradeBtn">Upgrade</button>
                    </div>
                    {/* Pricing breakdown — shown when a coupon/discount applies. */}
                    <div className="as-row" id="asPlanPricingRow" hidden>
                      <div className="as-row-text" style={{ width: '100%' }}>
                        <div className="as-row-label">Pricing</div>
                        <div className="as-row-hint" id="asPlanPricing">—</div>
                      </div>
                    </div>
                    <div className="as-row">
                      <div className="as-row-text">
                        <div className="as-row-label">Payment method</div>
                        <div className="as-row-hint" id="asPaymentHint">No payment method on file</div>
                      </div>
                      <button className="as-btn" type="button" data-modal="payment">Manage</button>
                    </div>
                    <div className="as-scroll-x">
                      <table className="as-billing-table" aria-label="Billing history">
                        <thead><tr><th>Date</th><th>Description</th><th>Discount</th><th>Paid</th><th>Status</th><th>Invoice</th></tr></thead>
                        <tbody id="asBillingRows">
                          <tr><td colSpan="6" className="as-billing-empty">No billing history yet</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="as-row" hidden={FORCE_NO_PACKAGE_BILLING}>
                      <div className="as-row-text">
                        <div className="as-row-label">Cancel subscription</div>
                        <div className="as-row-hint">You'll keep access until the end of the current billing period</div>
                      </div>
                      <button className="as-btn danger" type="button" data-modal="cancelSub">Cancel plan</button>
                    </div>
                  </section>
                </div>

                {/* ── NOTIFICATIONS ── */}
                <div className="as-tab-panel" id="tab-notif" role="tabpanel" aria-labelledby="tabn-notif" tabIndex="0" hidden>
                  <section className="as-section" aria-label="Notifications">
                    <div className="as-section-head">
                      <svg className="as-section-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span className="as-section-title">Notifications</span>
                    </div>
                    {[
                      { pref:'notif_weekly_summary', label:'Weekly progress summary', hint:'Email each Monday with your week\'s practice highlights' },
                      { pref:'notif_milestones',     label:'Milestone alerts',        hint:'Notify when you reach a new skill milestone' },
                      { pref:'notif_in_app',         label:'In-app notifications',   hint:'Show notification banners inside the platform' },
                      { pref:'notif_marketing',      label:'Product updates & tips',  hint:'Occasional emails about new features and learning tips' },
                    ].map(({ pref, label, hint }) => (
                      <div key={pref} className="as-row">
                        <div className="as-row-text">
                          <div className="as-row-label">{label}</div>
                          <div className="as-row-hint">{hint}</div>
                        </div>
                        <label className="as-switch" aria-label={label}>
                          <input type="checkbox" data-pref={pref}/><span className="as-slider"/>
                        </label>
                      </div>
                    ))}
                    <p className="as-note">Transactional emails (password reset, email verification) are always sent.</p>
                  </section>
                </div>

                {/* ── APPEARANCE ── */}
                <div className="as-tab-panel" id="tab-appear" role="tabpanel" aria-labelledby="tabn-appear" tabIndex="0" hidden>
                  <section className="as-section" aria-label="Appearance">
                    <div className="as-section-head">
                      <svg className="as-section-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span className="as-section-title">Appearance</span>
                    </div>

                    {/* General sub-panel */}
                    <div className="as-subpanel active" id="asp-general" role="tabpanel">
                      <div className="as-subpanel-label">Site Theme</div>
                      <div className="as-row as-row-col">
                        <div className="as-row-hint">Choose a visual theme. Obsidian, Midnight, Carbon and Graphite are dark; Porcelain and Ivory are light.</div>
                      </div>
                      {/* FIX 3: this grid is populated by account-settings.js after CVTheme is injected */}
                      <div className="as-theme-grid" id="asSiteThemeGrid" role="radiogroup" aria-label="Site theme"/>

                      <div className="as-subpanel-label">Dashboard Layout</div>
                      <div className="as-row">
                        <div className="as-row-text">
                          <div className="as-row-label">Performance Insights default layout</div>
                          <div className="as-row-hint">Which layout opens when you launch Performance Insights.</div>
                        </div>
                        <div className="as-row-controls">
                          <select className="as-select" id="asDashLayout" aria-label="Dashboard layout preset">
                            <option value="full">Full Dashboard</option>
                            <option value="coding_core">Coding Core</option>
                            <option value="info_only">Summary / Info Only</option>
                            <option value="scores_only">Scores Only</option>
                            <option value="heatmap_focus">Heatmap Focus</option>
                          </select>
                        </div>
                      </div>

                      <div className="as-subpanel-label">Accessibility</div>
                      <div className="as-row">
                        <div className="as-row-text">
                          <div className="as-row-label">Reduce motion</div>
                          <div className="as-row-hint">Minimise animations and transitions across the platform.</div>
                        </div>
                        <label className="as-switch" aria-label="Reduce motion">
                          <input type="checkbox" data-pref="reduce_motion"/><span className="as-slider"/>
                        </label>
                      </div>
                      <div className="as-row" id="asDrawerSpeedRow">
                        <div className="as-row-text">
                          <div className="as-row-label">Filter panel slide speed</div>
                          <div className="as-row-hint">How fast the filter drawer slides in and out. <span id="asDrawerSpeedLabel">154ms</span></div>
                        </div>
                        <div className="as-row-controls">
                          <input type="range" className="as-range" id="asDrawerSpeed" min="0" max="500" step="10" defaultValue="154" aria-label="Filter drawer slide speed"/>
                        </div>
                      </div>
                    </div>

                    {/* Code Editor sub-panel */}
                    <div className="as-subpanel" id="asp-editor" role="tabpanel">
                      <div className="as-subpanel-label">Colour Theme</div>
                      <div className="as-row as-row-col">
                        <div className="as-row-hint">Applied to the code editor panes.</div>
                      </div>
                      <div className="as-theme-grid" id="asEditorThemeGrid" role="radiogroup" aria-label="Editor colour theme"/>
                      <div className="as-editor-preview" id="asEditorPreview" aria-label="Editor theme preview" aria-live="polite">
                        <div className="as-ep-bar">
                          <span className="as-ep-dot as-ep-red"/><span className="as-ep-dot as-ep-amber"/><span className="as-ep-dot as-ep-green"/>
                          <span className="as-ep-filename">preview.py</span>
                        </div>
                        <div className="as-ep-code" id="asEditorPreviewCode">
                          <pre id="asEditorPreviewPre"><code id="asEditorPreviewContent"/></pre>
                        </div>
                      </div>
                      <div className="as-subpanel-label">Typography</div>
                      <div className="as-row">
                        <div className="as-row-text"><div className="as-row-label">Font size</div><div className="as-row-hint">Code text size in editor panels.</div></div>
                        <div className="as-row-controls">
                          <select className="as-select" id="asEditorFontSize" aria-label="Editor font size">
                            <option value="10">10px — Tiny</option><option value="11">11px — Smaller</option><option value="12">12px — Small</option>
                            <option value="13">13px — Normal</option><option value="14">14px — Medium</option><option value="15">15px — Comfortable</option>
                            <option value="16">16px — Large</option><option value="18">18px — Larger</option><option value="20">20px — Big</option>
                          </select>
                        </div>
                      </div>
                      <div className="as-row">
                        <div className="as-row-text"><div className="as-row-label">Font family</div><div className="as-row-hint">Monospace font used in code panels.</div></div>
                        <div className="as-row-controls as-row-font-family">
                          <select className="as-select" id="asEditorFontFamily" aria-label="Editor font family">
                            <option value="system-mono">System Mono (default)</option><option value="jetbrains-mono">JetBrains Mono</option>
                            <option value="fira-code">Fira Code</option><option value="source-code-pro">Source Code Pro</option>
                            <option value="ibm-plex-mono">IBM Plex Mono</option><option value="inconsolata">Inconsolata</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* REPL sub-panel */}
                    <div className="as-subpanel" id="asp-repl" role="tabpanel">
                      <div className="as-subpanel-label">Colour Theme</div>
                      <div className="as-row as-row-col"><div className="as-row-hint">Applied to the REPL input and output panels.</div></div>
                      <div className="as-theme-grid" id="asReplThemeGrid" role="radiogroup" aria-label="REPL colour theme"/>
                      <div className="as-editor-preview" id="asReplPreview" aria-label="REPL theme preview" aria-live="polite">
                        <div className="as-ep-bar">
                          <span className="as-ep-dot as-ep-red"/><span className="as-ep-dot as-ep-amber"/><span className="as-ep-dot as-ep-green"/>
                          <span className="as-ep-filename">repl &gt;&gt;&gt;</span>
                        </div>
                        <div className="as-ep-code" id="asReplPreviewCode">
                          <pre id="asReplPreviewPre"><code id="asReplPreviewContent"/></pre>
                        </div>
                      </div>
                      <div className="as-subpanel-label">Typography</div>
                      <div className="as-row">
                        <div className="as-row-text"><div className="as-row-label">Font size</div><div className="as-row-hint">Text size in REPL.</div></div>
                        <div className="as-row-controls">
                          <select className="as-select" id="asReplFontSize" aria-label="REPL font size">
                            <option value="10">10px</option><option value="11">11px</option><option value="12">12px</option>
                            <option value="13">13px — Normal</option><option value="14">14px</option><option value="15">15px</option><option value="16">16px</option>
                          </select>
                        </div>
                      </div>
                      <div className="as-row">
                        <div className="as-row-text"><div className="as-row-label">Font family</div></div>
                        <div className="as-row-controls as-row-font-family">
                          <select className="as-select" id="asReplFontFamily" aria-label="REPL font family">
                            <option value="system-mono">System Mono</option><option value="jetbrains-mono">JetBrains Mono</option>
                            <option value="fira-code">Fira Code</option><option value="source-code-pro">Source Code Pro</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Instructions sub-panel */}
                    <div className="as-subpanel" id="asp-instruct" role="tabpanel">
                      <div className="as-subpanel-label">Typography</div>
                      <div className="as-row">
                        <div className="as-row-text"><div className="as-row-label">Font size</div><div className="as-row-hint">Prose text in instructions and hints.</div></div>
                        <div className="as-row-controls">
                          <select className="as-select" id="asInstructionsFontSize" aria-label="Instructions font size">
                            <option value="13">13px</option><option value="14">14px</option><option value="15">15px — Comfortable</option>
                            <option value="16">16px</option><option value="17">17px</option><option value="18">18px</option>
                          </select>
                        </div>
                      </div>
                      <div className="as-row">
                        <div className="as-row-text"><div className="as-row-label">Font family</div></div>
                        <div className="as-row-controls as-row-font-family">
                          <select className="as-select" id="asInstructionsFontFamily" aria-label="Instructions font family">
                            <option value="auto">Auto (matches site theme)</option><option value="system-sans">System Sans</option>
                            <option value="noto-serif">Noto Serif</option><option value="georgia">Georgia</option>
                          </select>
                        </div>
                      </div>
                    </div>

                  </section>
                </div>
              </div>{/* /as-tab-panels */}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <div className="as-modal-backdrop" id="modal-displayName" role="dialog" aria-modal="true" aria-labelledby="mdnTitle">
        <div className="as-modal">
          <div className="as-modal-title" id="mdnTitle">Change display name</div>
          <div className="as-modal-body">This name appears in your profile and session history.</div>
          <label className="as-field-label" htmlFor="asNewDisplayName">New display name</label>
          <input className="as-field" type="text" id="asNewDisplayName" placeholder="Your name" maxLength="60" autoComplete="name"/>
          <div className="as-modal-actions">
            <button className="as-btn" type="button" data-close-modal="">Cancel</button>
            <button className="as-btn primary" type="button" id="saveDisplayName">Save</button>
          </div>
        </div>
      </div>

      <div className="as-modal-backdrop" id="modal-email" role="dialog" aria-modal="true" aria-labelledby="mdeTitle">
        <div className="as-modal">
          <div className="as-modal-title" id="mdeTitle">Change email address</div>
          <div className="as-modal-body">A verification link will be sent to your new address.</div>
          <label className="as-field-label" htmlFor="asNewEmail">New email address</label>
          <input className="as-field" type="email" id="asNewEmail" placeholder="you@example.com" maxLength="254" autoComplete="email"/>
          <label className="as-field-label" htmlFor="asEmailPassword">Current password</label>
          <input className="as-field" type="password" id="asEmailPassword" placeholder="Current password" autoComplete="current-password" maxLength="128"/>
          <div className="as-modal-actions">
            <button className="as-btn" type="button" data-close-modal="">Cancel</button>
            <button className="as-btn primary" type="button" id="saveEmail">Send verification</button>
          </div>
        </div>
      </div>

      <div className="as-modal-backdrop" id="modal-password" role="dialog" aria-modal="true" aria-labelledby="mdpTitle">
        <div className="as-modal">
          <div className="as-modal-title" id="mdpTitle">Change password</div>
          <div className="as-modal-body">Use a strong password that you don't use on other sites.</div>
          <label className="as-field-label" htmlFor="asCurrentPassword">Current password</label>
          <input className="as-field" type="password" id="asCurrentPassword" placeholder="Current password" autoComplete="current-password" maxLength="128"/>
          <label className="as-field-label" htmlFor="asNewPassword">New password</label>
          <input className="as-field" type="password" id="asNewPassword" placeholder="New password (min. 8 characters)" autoComplete="new-password" maxLength="128"/>
          <label className="as-field-label" htmlFor="asConfirmPassword">Confirm new password</label>
          <input className="as-field" type="password" id="asConfirmPassword" placeholder="Repeat new password" autoComplete="new-password" maxLength="128"/>
          <div className="as-modal-actions">
            <button className="as-btn" type="button" data-close-modal="">Cancel</button>
            <button className="as-btn primary" type="button" id="savePassword">Update password</button>
          </div>
        </div>
      </div>

      <div className="as-modal-backdrop" id="modal-payment" role="dialog" aria-modal="true" aria-labelledby="mdpaTitle">
        <div className="as-modal">
          <div className="as-modal-title" id="mdpaTitle">Payment method</div>
          <div className="as-modal-body">Payment is handled securely by our billing provider.</div>
          <div className="as-modal-actions">
            <button className="as-btn" type="button" data-close-modal="">Cancel</button>
            <button className="as-btn primary" type="button" id="goToPayment">Manage payment →</button>
          </div>
        </div>
      </div>

      <div className="as-modal-backdrop" id="modal-cancelSub" role="dialog" aria-modal="true" aria-labelledby="mdcsTitle">
        <div className="as-modal">
          <div className="as-modal-title" id="mdcsTitle">Cancel subscription?</div>
          <div className="as-modal-body">You'll keep full access until the end of your current billing period.</div>
          <div className="as-modal-actions">
            <button className="as-btn" type="button" data-close-modal="">Keep my plan</button>
            <button className="as-btn danger" type="button" id="confirmCancelSub">Yes, cancel</button>
          </div>
        </div>
      </div>

      <div className="as-modal-backdrop" id="modal-deleteAccount" role="dialog" aria-modal="true" aria-labelledby="mddaTitle">
        <div className="as-modal">
          <div className="as-modal-title" id="mddaTitle">Delete account permanently?</div>
          <div className="as-modal-body">This will delete all your session data, scores, and progress. <strong className="as-danger-warn">This cannot be undone.</strong><br/><br/>Enter your password to confirm.</div>
          <input className="as-field" type="password" id="asDeleteConfirm" placeholder="Enter your password" autoComplete="current-password" maxLength="128"/>
          <div className="as-modal-actions">
            <button className="as-btn" type="button" data-close-modal="">Cancel</button>
            <button className="as-btn danger" type="button" id="confirmDeleteAccount" disabled>Delete my account</button>
          </div>
        </div>
      </div>
    </main>
  );
}
