// AccountSettingsPage.jsx
// Top-level component. Owns tab state, modal state, and wires hooks to panels.

import React, { useState, useEffect, useCallback } from 'react';
import { usePreferences }  from './hooks/usePreferences.js';
import { useUserProfile }  from './hooks/useUserProfile.js';
import { useToast }        from './hooks/useToast.js';
import { lsGet, lsSet }   from './utils/storage.js';

import TabBar              from './components/TabBar.jsx';
import AccountPanel        from './components/AccountPanel.jsx';
import AppearancePanel     from './components/AppearancePanel.jsx';
import { BillingPanel, NotificationsPanel } from './components/BillingAndNotif.jsx';
import {
  DisplayNameModal, EmailModal, PasswordModal,
  PaymentModal, CancelSubModal, DeleteAccountModal,
} from './components/modals/Modals.jsx';
import { Toast } from './components/shared/Widgets.jsx';
import { useGlowFollow } from '../shared/useGlowFollow.js';

export default function AccountSettingsPage() {
  useGlowFollow();
  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState(() => lsGet('as_active_tab', 'account'));
  const [activeSubTab, setActiveSubTab] = useState(() => lsGet('as_appear_subtab', 'general'));
  const [openModal,    setOpenModal]    = useState(null);

  const { prefs, setPref }                           = usePreferences();
  const { profile, updateName, uploadAvatar, removeAvatar } = useUserProfile();
  const { toast, showToast }                         = useToast();

  // ── Tab persistence ────────────────────────────────────────────────────────
  const handleTabChange = useCallback((key) => {
    setActiveTab(key);
    lsSet('as_active_tab', key);
  }, []);

  const handleSubTabChange = useCallback((key) => {
    setActiveSubTab(key);
    lsSet('as_appear_subtab', key);
  }, []);

  // ── Preference setter with toast ───────────────────────────────────────────
  const setPrefWithToast = useCallback((key, value, msg) => {
    setPref(key, value);
    showToast(msg || 'Preference saved.');
  }, [setPref, showToast]);

  // ── Sidebar active-link sync ───────────────────────────────────────────────
  useEffect(() => {
    try {
      document.querySelectorAll('.side-link').forEach(a => {
        const match = a.dataset.section === 'account-settings';
        a.classList.toggle('active', match);
        if (match) a.setAttribute('aria-current', 'page');
        else       a.removeAttribute('aria-current');
      });
    } catch (_) {}
  }, []);

  // ── Modal action handlers ──────────────────────────────────────────────────
  function handleSaveName(name) {
    updateName(name);
    showToast('Display name updated.');
  }

  function handleSaveEmail(email) {
    // TODO: POST /api/user/change-email { newEmail, currentPassword }
    showToast(`Verification email sent to ${email}.`);
  }

  function handleSavePassword() {
    // TODO: POST /api/user/change-password { currentPassword, newPassword }
    showToast('Password updated.');
  }

  function handleManagePayment() {
    setOpenModal(null);
    showToast('Opening billing portal…');
    // TODO: fetch('/api/billing/portal').then(d => window.location.href = d.url)
  }

  function handleCancelSub() {
    setOpenModal(null);
    showToast('Opening billing portal…');
    // TODO: redirect to Stripe Customer Portal — cancellation handled there
  }

  function handleDeleteAccount() {
    // TODO: DELETE /api/user/account { password }
    showToast('Account deletion request submitted. You will receive a confirmation email.');
  }

  function handleUploadAvatar(file) {
    return uploadAvatar(file)
      .then(() => showToast('Profile photo updated.'))
      .catch(err => showToast(err.message, true));
  }

  function handleRemoveAvatar() {
    removeAvatar();
    showToast('Profile photo removed.');
  }

  // ── Wrapper: setPref with toast ────────────────────────────────────────────
  // Appearance prefs show a toast; notification prefs show one too.
  function setAndToast(key, value) {
    const MSGS = {
      cv_syntax_theme:             key => `Editor theme saved.`,
      cv_repl_syntax_theme:        key => `REPL theme saved.`,
      cv_editor_font_size:         key => `Editor font size saved.`,
      cv_repl_font_size:           key => `REPL font size saved.`,
      cv_instructions_font_size:   key => `Instructions font size saved.`,
      cv_editor_font_family:       key => `Editor font family saved.`,
      cv_repl_font_family:         key => `REPL font family saved.`,
      cv_instructions_font_family: key => `Instructions font family saved.`,
      as_dash_layout:              key => `Dashboard layout saved.`,
      reduce_motion:               key => `Preference saved.`,
      cv_drawer_speed:             key => null,   // no toast for slider drag
      notif_weekly_summary:        key => `Preference saved.`,
      notif_milestones:            key => `Preference saved.`,
      notif_in_app:                key => `Preference saved.`,
      notif_marketing:             key => `Preference saved.`,
      show_tour_btn:               key => `Preference saved.`,
      analytics_consent:           key => `Preference saved.`,
      performance_consent:         key => `Preference saved.`,
    };
    setPref(key, value);
    const msgFn = MSGS[key];
    const msg   = typeof msgFn === 'function' ? msgFn(key) : 'Preference saved.';
    if (msg) showToast(msg);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="as-wrap">
        <div className="as-window">
          <div className="as-window-title">Account &amp; Settings</div>

          <div className="as-window-scroll">
            <div className="as-inner">

              <TabBar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                activeSubTab={activeSubTab}
                onSubTabChange={handleSubTabChange}
              />

              <div className="as-tab-panels">

                {activeTab === 'account' && (
                  <AccountPanel
                    profile={profile}
                    onOpenModal={setOpenModal}
                    onUploadAvatar={handleUploadAvatar}
                    onRemoveAvatar={handleRemoveAvatar}
                  />
                )}

                {activeTab === 'billing' && (
                  <BillingPanel
                    plan={profile.plan}
                    invoices={profile.invoices}
                    onOpenModal={setOpenModal}
                  />
                )}

                {activeTab === 'notif' && (
                  <NotificationsPanel
                    prefs={prefs}
                    setPref={setAndToast}
                  />
                )}

                {activeTab === 'appear' && (
                  <AppearancePanel
                    prefs={prefs}
                    setPref={setAndToast}
                    activeSubTab={activeSubTab}
                  />
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <DisplayNameModal
        isOpen={openModal === 'displayName'}
        onClose={() => setOpenModal(null)}
        onSave={handleSaveName}
      />
      <EmailModal
        isOpen={openModal === 'email'}
        onClose={() => setOpenModal(null)}
        onSave={handleSaveEmail}
      />
      <PasswordModal
        isOpen={openModal === 'password'}
        onClose={() => setOpenModal(null)}
        onSave={handleSavePassword}
      />
      <PaymentModal
        isOpen={openModal === 'payment'}
        onClose={() => setOpenModal(null)}
        onManage={handleManagePayment}
      />
      <CancelSubModal
        isOpen={openModal === 'cancelSub'}
        onClose={() => setOpenModal(null)}
        onConfirm={handleCancelSub}
      />
      <DeleteAccountModal
        isOpen={openModal === 'deleteAccount'}
        onClose={() => setOpenModal(null)}
        onConfirm={handleDeleteAccount}
      />

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      <Toast toast={toast} />
    </>
  );
}
