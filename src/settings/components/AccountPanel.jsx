// components/AccountPanel.jsx
import React, { useRef } from 'react';

export default function AccountPanel({ profile, onOpenModal, onUploadAvatar, onRemoveAvatar }) {
  const fileRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onUploadAvatar(file)
      .catch(err => onOpenModal('_toast_error', err.message));
    e.target.value = '';
  }

  return (
    <div className="as-tab-panel active" id="tab-account" role="tabpanel" aria-labelledby="tabn-account" tabIndex={0}>
      <section className="as-section" aria-label="Account and Identity">
        <div className="as-section-head">
          <svg className="as-section-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/>
            <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span className="as-section-title">Account &amp; Identity</span>
        </div>

        {/* Avatar */}
        <div className="as-avatar-row">
          <img id="asAvatarImg" src={profile.avatarSrc} alt="Profile photo" className="as-avatar" />
          <div className="as-avatar-text">
            <div className="as-row-label">Profile photo</div>
            <div className="as-row-hint">JPG or PNG, up to 2 MB</div>
          </div>
          <div className="as-avatar-btns">
            <button className="as-btn" type="button" onClick={() => fileRef.current?.click()}>Upload</button>
            <button className="as-btn" type="button" onClick={onRemoveAvatar}>Remove</button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="as-file-hidden"
            aria-label="Upload profile photo"
            onChange={handleFileChange}
          />
        </div>

        {/* Display name — Change button was missing, now added (bug fix #1) */}
        <div className="as-row">
          <div className="as-row-text">
            <div className="as-row-label">Display name</div>
            <div className="as-row-hint">Your profile name</div>
          </div>
          <span className="as-row-value" id="asDisplayNameVal">{profile.name || '—'}</span>
          <button className="as-btn" type="button" onClick={() => onOpenModal('displayName')}>Change</button>
        </div>

        {/* Email — Change button was missing, now added (bug fix #2) */}
        <div className="as-row">
          <div className="as-row-text">
            <div className="as-row-label">Email address</div>
          </div>
          <span className="as-row-value" id="asEmailVal">{profile.email || '—'}</span>
          <button className="as-btn" type="button" onClick={() => onOpenModal('email')}>Change</button>
        </div>

        {/* Password */}
        <div className="as-row">
          <div className="as-row-text">
            <div className="as-row-label">Password</div>
            <div className="as-row-hint">Use a strong password you don't use elsewhere</div>
          </div>
          <span className="as-row-value">••••••••</span>
          <button className="as-btn" type="button" onClick={() => onOpenModal('password')}>Change</button>
        </div>
        <p className="as-note">Changes to email or password require your current password to confirm.</p>
      </section>

      {/* Danger zone */}
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
          <button className="as-btn danger" type="button" onClick={() => onOpenModal('deleteAccount')}>Delete account</button>
        </div>
      </section>
    </div>
  );
}
