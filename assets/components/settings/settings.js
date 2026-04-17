/* settings.js — Account & Settings page logic */
(function () {
  'use strict';

  /* ── Storage helpers ──────────────────────────────────────── */
  function lsGet(key, fallback) {
    try { var v = localStorage.getItem(key); return v !== null ? v : fallback; }
    catch (e) { return fallback; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, String(val)); } catch (e) {}
  }

  /* ── Tab switching ────────────────────────────────────────── */
  var tabs    = document.querySelectorAll('.settings-tab');
  var panels  = document.querySelectorAll('.settings-panel');

  function activateTab(key) {
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.dataset.tab === key);
    });
    panels.forEach(function (p) {
      p.classList.toggle('active', p.id === 'panel-' + key);
    });
    lsSet('cv_settings_tab', key);
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activateTab(tab.dataset.tab);
    });
  });

  /* Restore last active tab */
  activateTab(lsGet('cv_settings_tab', 'personal'));

  /* ── Personal details ─────────────────────────────────────── */
  var fields = {
    name:        document.getElementById('sName'),
    email:       document.getElementById('sEmail'),
    profileName: document.getElementById('sProfileName'),
    userId:      document.getElementById('sUserId'),
  };

  // Populate from localStorage (profile fields are set by the platform)
  if (fields.name)        fields.name.value        = lsGet('cv_display_name', '');
  if (fields.profileName) fields.profileName.value = lsGet('cv_profile_name', '');

  // User ID and email come from server — shown as readonly placeholders for now
  if (fields.userId) fields.userId.value = lsGet('cv_user_id', '—');
  if (fields.email)  fields.email.value  = lsGet('cv_user_email', '—');

  var savePersonalBtn = document.getElementById('savePersonal');
  var savePersonalMsg = document.getElementById('savePersonalMsg');

  if (savePersonalBtn) {
    savePersonalBtn.addEventListener('click', function () {
      if (fields.name)        lsSet('cv_display_name',  fields.name.value.trim());
      if (fields.profileName) lsSet('cv_profile_name',  fields.profileName.value.trim());

      // Update sidebar profile name live
      var sidebarName = document.getElementById('profileName');
      if (sidebarName && fields.profileName) {
        var pn = fields.profileName.value.trim();
        sidebarName.textContent = pn || 'Profile';
      }

      showSaveMsg(savePersonalMsg);
    });
  }

  /* ── Avatar picker ────────────────────────────────────────── */
  var avatarTiles = document.querySelectorAll('.s-avatar-tile');
  var currentAvatar = lsGet('cv_avatar_key', '');

  avatarTiles.forEach(function (tile) {
    if (tile.dataset.avatar === currentAvatar) tile.classList.add('selected');
    tile.addEventListener('click', function () {
      avatarTiles.forEach(function (t) { t.classList.remove('selected'); });
      tile.classList.add('selected');
      var key = tile.dataset.avatar;
      lsSet('cv_avatar_key', key);

      // Update sidebar avatar
      var svgContent = tile.querySelector('svg');
      var profileImg = document.getElementById('profileImg');
      if (profileImg && svgContent) {
        var svgStr = new XMLSerializer().serializeToString(svgContent);
        var dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
        profileImg.src = dataUrl;
        lsSet('cv_profile_image', dataUrl);
      }
    });
  });

  /* ── UI Theme picker ──────────────────────────────────────── */
  var themeCards = document.querySelectorAll('.s-theme-card');
  var currentTheme = lsGet('cv_ui_theme', 'dark-obsidian-luxe');

  themeCards.forEach(function (card) {
    if (card.dataset.theme === currentTheme) card.classList.add('selected');
    card.addEventListener('click', function () {
      themeCards.forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      lsSet('cv_ui_theme', card.dataset.theme);
      // Setting is picked up by editor-page.js on next load via window.__cvUiTheme
      window.__cvUiTheme = card.dataset.theme;
    });
  });

  /* ── Syntax scheme picker ─────────────────────────────────── */
  var synCards = document.querySelectorAll('.s-syn-card');
  var currentSyn = lsGet('cv_syn_theme', 'obsidian-code');

  synCards.forEach(function (card) {
    if (card.dataset.syn === currentSyn) card.classList.add('selected');
    card.addEventListener('click', function () {
      synCards.forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      lsSet('cv_syn_theme', card.dataset.syn);
      window.__cvSynTheme = card.dataset.syn;
    });
  });

  /* ── Toggles (settings tab) ───────────────────────────────── */
  function wireToggle(id, lsKey, defaultVal) {
    var el = document.getElementById(id);
    if (!el) return;
    el.checked = lsGet(lsKey, defaultVal) === 'true';
    el.addEventListener('change', function () {
      lsSet(lsKey, String(el.checked));
    });
  }

  wireToggle('toggleTimer',    'cv_timer_hidden',   'false');
  wireToggle('toggleEffects',  'cv_effects_low',    'false');
  wireToggle('toggleExclude',  'cv_exclude_correct','true');

  /* ── Cancel subscription modal ────────────────────────────── */
  var cancelBtn      = document.getElementById('cancelSubBtn');
  var cancelModal    = document.getElementById('cancelModal');
  var cancelConfirm  = document.getElementById('cancelConfirm');
  var cancelDismiss  = document.getElementById('cancelDismiss');

  if (cancelBtn && cancelModal) {
    cancelBtn.addEventListener('click', function () {
      cancelModal.classList.add('open');
    });
    cancelDismiss && cancelDismiss.addEventListener('click', function () {
      cancelModal.classList.remove('open');
    });
    cancelModal.addEventListener('click', function (e) {
      if (e.target === cancelModal) cancelModal.classList.remove('open');
    });
    cancelConfirm && cancelConfirm.addEventListener('click', function () {
      // In production this would call the cancellation API
      cancelModal.classList.remove('open');
      alert('Cancellation request submitted. Your subscription will remain active until the end of the current billing period.');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cancelModal.classList.remove('open');
    });
  }

  /* ── Helpers ──────────────────────────────────────────────── */
  function showSaveMsg(el) {
    if (!el) return;
    el.classList.add('visible');
    setTimeout(function () { el.classList.remove('visible'); }, 2400);
  }

  /* ── Sidebar profile hydration ────────────────────────────── */
  (function hydrateProfile() {
    var imgEl  = document.getElementById('profileImg');
    var nameEl = document.getElementById('profileName');
    var img  = lsGet('cv_profile_image', null);
    var name = lsGet('cv_profile_name', null);
    if (imgEl && img)  imgEl.src = img;
    if (nameEl) nameEl.textContent = (name && name.trim()) ? name.trim() : 'Profile';
  })();

  // Cleanup on navigation (SPA safety)
  window.addEventListener('pagehide', function() {
    document.removeEventListener('DOMContentLoaded', init);
  }, { once: true });

})();