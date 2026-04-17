// components/modals/Modals.jsx
// All six settings modal forms. Each uses the shared Modal shell.

import React, { useState } from 'react';
import Modal from '../shared/Modal.jsx';

// ── Display Name ──────────────────────────────────────────────────────────────

export function DisplayNameModal({ isOpen, onClose, onSave }) {
  const [value, setValue] = useState('');
  const [err,   setErr]   = useState('');

  function handleSave() {
    const v = value.trim();
    if (!v)        { setErr('Please enter a display name.'); return; }
    if (v.length > 60) { setErr('Display name must be 60 characters or fewer.'); return; }
    onSave(v);
    setValue('');
    setErr('');
    onClose();
  }

  function handleClose() { setValue(''); setErr(''); onClose(); }

  return (
    <Modal id="displayName" title="Change display name" titleId="mdnTitle"
      body="This name appears in your profile and session history."
      isOpen={isOpen} onClose={handleClose}>
      <label className="as-field-label" htmlFor="asNewDisplayName">New display name</label>
      <input
        className={`as-field${err ? ' as-field--error' : ''}`}
        type="text" id="asNewDisplayName" placeholder="Your name"
        maxLength={60} autoComplete="name"
        value={value} onChange={e => { setValue(e.target.value); setErr(''); }}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
      />
      {err && <div className="as-field-error">{err}</div>}
      <div className="as-modal-actions">
        <button className="as-btn" type="button" data-close onClick={handleClose}>Cancel</button>
        <button className="as-btn primary" type="button" onClick={handleSave}>Save</button>
      </div>
    </Modal>
  );
}

// ── Email ─────────────────────────────────────────────────────────────────────

export function EmailModal({ isOpen, onClose, onSave }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [err,      setErr]      = useState('');

  function handleSave() {
    const e = email.trim();
    if (!e || !e.includes('@'))   { setErr('Please enter a valid email address.'); return; }
    if (e.length > 254)           { setErr('Email address is too long (max 254 characters).'); return; }
    if (!password)                { setErr('Please enter your current password.'); return; }
    onSave(e);
    setEmail(''); setPassword(''); setErr('');
    onClose();
  }

  function handleClose() { setEmail(''); setPassword(''); setErr(''); onClose(); }

  return (
    <Modal id="email" title="Change email address" titleId="mdeTitle"
      body="A verification link will be sent to your new address. Your email won't change until you click that link."
      isOpen={isOpen} onClose={handleClose}>
      <label className="as-field-label" htmlFor="asNewEmail">New email address</label>
      <input className={`as-field${err ? ' as-field--error' : ''}`}
        type="email" id="asNewEmail" placeholder="you@example.com"
        maxLength={254} autoComplete="email"
        value={email} onChange={e => { setEmail(e.target.value); setErr(''); }} />
      <label className="as-field-label" htmlFor="asEmailPassword">Current password</label>
      <input className="as-field"
        type="password" id="asEmailPassword" placeholder="Current password"
        autoComplete="current-password" maxLength={128}
        value={password} onChange={e => setPassword(e.target.value)} />
      {err && <div className="as-field-error">{err}</div>}
      <div className="as-modal-actions">
        <button className="as-btn" type="button" data-close onClick={handleClose}>Cancel</button>
        <button className="as-btn primary" type="button" onClick={handleSave}>Send verification</button>
      </div>
    </Modal>
  );
}

// ── Password ──────────────────────────────────────────────────────────────────

export function PasswordModal({ isOpen, onClose, onSave }) {
  const [current, setCurrent] = useState('');
  const [newPw,   setNewPw]   = useState('');
  const [confirm, setConfirm] = useState('');
  const [err,     setErr]     = useState('');

  function handleSave() {
    if (!current)          { setErr('Please enter your current password.'); return; }
    if (newPw.length < 8)  { setErr('New password must be at least 8 characters.'); return; }
    if (newPw !== confirm)  { setErr('Passwords do not match.'); return; }
    onSave();
    setCurrent(''); setNewPw(''); setConfirm(''); setErr('');
    onClose();
  }

  function handleClose() { setCurrent(''); setNewPw(''); setConfirm(''); setErr(''); onClose(); }

  return (
    <Modal id="password" title="Change password" titleId="mdpTitle"
      body="Use a strong password that you don't use on other sites."
      isOpen={isOpen} onClose={handleClose}>
      <label className="as-field-label" htmlFor="asCurrentPassword">Current password</label>
      <input className="as-field" type="password" id="asCurrentPassword"
        placeholder="Current password" autoComplete="current-password" maxLength={128}
        value={current} onChange={e => { setCurrent(e.target.value); setErr(''); }} />
      <label className="as-field-label" htmlFor="asNewPassword">New password</label>
      <input className={`as-field${err && err.includes('8') ? ' as-field--error' : ''}`}
        type="password" id="asNewPassword"
        placeholder="New password (min. 8 characters)" autoComplete="new-password" maxLength={128}
        value={newPw} onChange={e => { setNewPw(e.target.value); setErr(''); }} />
      <label className="as-field-label" htmlFor="asConfirmPassword">Confirm new password</label>
      <input className={`as-field${err && err.includes('match') ? ' as-field--error' : ''}`}
        type="password" id="asConfirmPassword"
        placeholder="Repeat new password" autoComplete="new-password" maxLength={128}
        value={confirm} onChange={e => { setConfirm(e.target.value); setErr(''); }} />
      {err && <div className="as-field-error">{err}</div>}
      <div className="as-modal-actions">
        <button className="as-btn" type="button" data-close onClick={handleClose}>Cancel</button>
        <button className="as-btn primary" type="button" onClick={handleSave}>Update password</button>
      </div>
    </Modal>
  );
}

// ── Payment ───────────────────────────────────────────────────────────────────

export function PaymentModal({ isOpen, onClose, onManage }) {
  return (
    <Modal id="payment" title="Payment method" titleId="mdpaTitle"
      body="Payment is handled securely by our billing provider. You'll be redirected to update your card details."
      isOpen={isOpen} onClose={onClose}>
      <div className="as-modal-actions">
        <button className="as-btn" type="button" data-close onClick={onClose}>Cancel</button>
        <button className="as-btn primary" type="button" onClick={onManage}>
          Manage payment →
        </button>
      </div>
    </Modal>
  );
}

// ── Cancel Subscription ───────────────────────────────────────────────────────

export function CancelSubModal({ isOpen, onClose, onConfirm }) {
  return (
    <Modal id="cancelSub" title="Cancel subscription?" titleId="mdcsTitle"
      body="You'll keep full access until the end of your current billing period. After that your account moves to the free tier — your data is preserved and you can resubscribe at any time."
      isOpen={isOpen} onClose={onClose}>
      <div className="as-modal-actions">
        <button className="as-btn" type="button" data-close onClick={onClose}>Keep my plan</button>
        <button className="as-btn danger" type="button" onClick={onConfirm}>Yes, cancel</button>
      </div>
    </Modal>
  );
}

// ── Delete Account ────────────────────────────────────────────────────────────

export function DeleteAccountModal({ isOpen, onClose, onConfirm }) {
  const [pwd, setPwd] = useState('');

  function handleClose() { setPwd(''); onClose(); }

  return (
    <Modal id="deleteAccount" title="Delete account permanently?" titleId="mddaTitle"
      body={
        <>
          This will delete all your session data, scores, and progress, and cancel any active subscription.{' '}
          <strong className="as-danger-warn">This cannot be undone.</strong>
          <br /><br />Enter your password to confirm.
        </>
      }
      isOpen={isOpen} onClose={handleClose}>
      <input
        className="as-field"
        type="password" placeholder="Enter your password"
        aria-label="Password confirmation"
        autoComplete="current-password" maxLength={128}
        value={pwd}
        onChange={e => setPwd(e.target.value)}
      />
      <div className="as-modal-actions">
        <button className="as-btn" type="button" data-close onClick={handleClose}>Cancel</button>
        <button
          className="as-btn danger"
          type="button"
          disabled={pwd.trim().length < 6}
          onClick={() => { onConfirm(); handleClose(); }}
        >
          Delete my account
        </button>
      </div>
    </Modal>
  );
}
