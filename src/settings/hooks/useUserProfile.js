// hooks/useUserProfile.js
// Profile and billing data. Currently reads from localStorage and window globals
// (set by account-settings-demo.js). Shaped so swapping to fetch('/api/user/…)
// only changes this file — no component changes needed.

import { useState, useCallback } from 'react';
import { lsGet, lsSet, lsRemove } from '../utils/storage.js';

const PLACEHOLDER_IMG = 'assets/img/profile-placeholder.svg';

function loadProfile() {
  return {
    name:      lsGet('cv_profile_name',  ''),
    email:     window.CODIVIUM_DEMO_EMAIL || lsGet('cv_profile_email', ''),
    avatarSrc: lsGet('cv_profile_image', '') || PLACEHOLDER_IMG,
    plan:      window.CODIVIUM_DEMO_PLAN || {
      tier: 'free', tierLabel: 'Free', autoRenews: false,
      expiresAt: null, renewsAt: null, dateLabel: 'No active subscription',
      card: null, discount: null,
    },
    invoices: window.CODIVIUM_DEMO_INVOICES || [],
  };
}

export function useUserProfile() {
  const [profile, setProfile] = useState(loadProfile);

  // Update display name
  const updateName = useCallback((name) => {
    lsSet('cv_profile_name', name);
    setProfile(p => ({ ...p, name }));
    // Sync sidebar profile card (vanilla JS sidebar reads on load; update imperatively now)
    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = name;
  }, []);

  // Upload avatar — preview immediately, save data URL to localStorage
  // TODO: replace body with POST /api/user/avatar then store returned URL string
  const uploadAvatar = useCallback((file) => {
    if (!file) return Promise.reject(new Error('No file'));
    if (file.size > 2 * 1024 * 1024) return Promise.reject(new Error('Image must be under 2 MB.'));

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        lsSet('cv_profile_image', dataUrl);
        setProfile(p => ({ ...p, avatarSrc: dataUrl }));
        // Sync sidebar avatar
        const sidebarImg = document.getElementById('profileImg');
        if (sidebarImg) sidebarImg.src = dataUrl;
        resolve(dataUrl);
      };
      reader.onerror = () => reject(new Error('File read failed.'));
      reader.readAsDataURL(file);
    });
  }, []);

  // Remove avatar
  const removeAvatar = useCallback(() => {
    lsRemove('cv_profile_image');
    setProfile(p => ({ ...p, avatarSrc: PLACEHOLDER_IMG }));
    const sidebarImg = document.getElementById('profileImg');
    if (sidebarImg) sidebarImg.src = PLACEHOLDER_IMG;
  }, []);

  return { profile, updateName, uploadAvatar, removeAvatar };
}
