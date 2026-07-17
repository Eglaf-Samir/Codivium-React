/* account-settings.js
 * ============================================================
 * Account & Settings page controller.
 *
 * What this file does:
 *  - Reads/writes all notification and appearance preferences to localStorage
 *  - Renders editor colour theme chips and wires the selection
 *  - Handles modal open/close for all change flows
 *  - All API-dependent flows (name/email/avatar, password, billing, account
 *    deletion) go through window.CV_PROFILE_API, bridged in from the React
 *    page (SettingsPage.jsx) — this script never persists name/email/photo
 *    to localStorage itself.
 *
 * localStorage keys used:
 *  cv_syntax_theme          string   editor syntax theme key
 *  cv_ws_theme              string   editor UI theme key
 *  cv_sidebar_collapsed     string   dashboard sidebar state
 *  notif_marketing          '1'|'0'  marketing emails
 *  reduce_motion            '1'|'0'  reduce motion preference
 *  as_dash_layout           string   'full' | 'info_only'
 * ============================================================ */
(function () {
  'use strict';

  /* ── Helpers ─────────────────────────────────────────────── */
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var get = function (k, def) {
    try { var v = localStorage.getItem(k); return v !== null ? v : (def !== undefined ? def : null); }
    catch (_) { return def !== undefined ? def : null; }
  };
  var set = function (k, v) { try { localStorage.setItem(k, v); } catch (_) {} };
  var el  = function (id) { return document.getElementById(id); };

  /* ── Editor themes (kept in sync with editor-page.js) ───── */
  var EDITOR_THEMES = [
    { key: 'obsidian-code',        name: 'Obsidian Code',       dot: '#0B1020' },
    { key: 'midnight-terminal',    name: 'Midnight Terminal',    dot: '#0D0B1A' },
    { key: 'carbon-ink',           name: 'Carbon Ink',          dot: '#141414' },
    { key: 'graphite-neon',        name: 'Graphite Neon',       dot: '#1A1A2E' },
    { key: 'aurora-nightfall',     name: 'Aurora Nightfall',    dot: '#0F1B2D' },
    { key: 'porcelain-codebook',   name: 'Porcelain Codebook',  dot: '#F5F3EE' },
    { key: 'ivory-syntax',         name: 'Ivory Syntax',        dot: '#F7F5F0' },
    { key: 'champagne-console',    name: 'Champagne Console',   dot: '#F6F0E8' },
    { key: 'slate-studio',         name: 'Slate Studio',        dot: '#E9EEF4' },
    { key: 'mist-meridian',        name: 'Mist Meridian',       dot: '#EFF3F8' },
  ];

  /* ── Avatar ───────────────────────────────────────────────────
   * Upload/remove call through window.CV_PROFILE_API (bridged from
   * SettingsPage.jsx), which persists to the backend (AppUser.ProfileImage)
   * and shows its own success/error dialog. Nothing is cached locally —
   * that was the root cause of every account on a shared browser showing
   * the same photo.
   *
   * Uploads are compressed client-side first (downscaled + re-encoded as
   * JPEG via canvas) so a multi-MB phone photo doesn't get stored verbatim
   * — keeps the DB row small and avoids the 2MB cap rejecting normal photos. */
  var AVATAR_MAX_DIMENSION = 512;
  var AVATAR_JPEG_QUALITY = 0.8;

  function compressImageFile(file, maxDim, quality) {
    return new Promise(function (resolve, reject) {
      var objectUrl = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(objectUrl);
        try {
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          var scale = Math.min(1, maxDim / Math.max(w, h));
          var targetW = Math.max(1, Math.round(w * scale));
          var targetH = Math.max(1, Math.round(h * scale));
          var canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, targetW, targetH);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not read image.'));
      };
      img.src = objectUrl;
    });
  }

  // Fallback for the rare case an image fails to decode via <img>/canvas —
  // upload the original file uncompressed rather than blocking entirely.
  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) { resolve(e.target.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function estimateDataUrlBytes(dataUrl) {
    var commaIdx = dataUrl.indexOf(',');
    var payload = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
    return Math.round((payload.length * 3) / 4);
  }

  function initAvatar() {
    var uploadBtn   = el('asAvatarUploadBtn');
    var removeBtn   = el('asAvatarRemoveBtn');
    var fileInput   = el('asAvatarFile');
    var avatarImg   = el('asAvatarImg');
    var avatarWrap  = el('asAvatarPhotoWrap');
    var sidebarImg  = el('profileImg');

    // Toggles the spinner overlay on the photo itself, in addition to
    // whichever button (Upload/Remove) also shows its own inline spinner.
    var setAvatarBusy = function (busy) {
      if (avatarWrap) avatarWrap.classList.toggle('is-loading', !!busy);
    };
    var setBtnBusy = function (btn, busy, busyLabel) {
      if (!btn) return;
      if (busy) {
        btn.dataset.origHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="as-btn-spinner" aria-hidden="true"></span>' + busyLabel;
      } else {
        btn.disabled = false;
        if (btn.dataset.origHtml) btn.innerHTML = btn.dataset.origHtml;
      }
    };

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        var file = fileInput.files[0];
        fileInput.value = '';
        if (!file) return;
        var api = profileApi();
        if (!api || typeof api.uploadAvatar !== 'function') return;

        setBtnBusy(uploadBtn, true, 'Uploading…');
        setAvatarBusy(true);

        compressImageFile(file, AVATAR_MAX_DIMENSION, AVATAR_JPEG_QUALITY)
          .catch(function () { return readFileAsDataUrl(file); })
          .then(function (dataUrl) {
            if (estimateDataUrlBytes(dataUrl) > 2 * 1024 * 1024) {
              showToast('Image is still too large after compression. Try a smaller photo.', true);
              return;
            }
            return api.uploadAvatar(dataUrl).then(function (result) {
              if (result && result.ok) {
                if (avatarImg)  avatarImg.src  = dataUrl;
                if (sidebarImg) sidebarImg.src = dataUrl;
              }
            });
          })
          .catch(function () {
            showToast('Could not read that image. Try a different file.', true);
          })
          .then(function () {
            setBtnBusy(uploadBtn, false);
            setAvatarBusy(false);
          });
      });
    }
    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        var api = profileApi();
        if (!api || typeof api.removeAvatar !== 'function') return;
        setBtnBusy(removeBtn, true, 'Removing…');
        setAvatarBusy(true);
        api.removeAvatar().then(function (result) {
          setBtnBusy(removeBtn, false);
          setAvatarBusy(false);
          if (result && result.ok) {
            var placeholder = '/assets/img/profile-placeholder.svg';
            if (avatarImg)  avatarImg.src  = placeholder;
            if (sidebarImg) sidebarImg.src = placeholder;
          }
        });
      });
    }
  }

  /* ── Plan display ─────────────────────────────────────────── */
  function loadPlan() {
    // Stub: replace window.CODIVIUM_DEMO_PLAN with a real fetch when the backend is live:
    //   fetch('/api/user/subscription', { credentials: 'same-origin' })
    //     .then(r => r.json()).then(renderPlan).catch(() => renderPlan(null));
    //
    // Response shape: { tier, tierLabel, autoRenews, expiresAt, renewsAt,
    //                   dateLabel, card, discount }
    // Tiers: 'free' | 'weekly' | 'monthly' | 'annual'
    // Weekly has no auto-renewal and expires after 7 days (one-time purchase).
    // Monthly and Annual auto-renew and are managed via the Stripe Customer Portal.

    var planBadge   = el('asPlanBadge');
    var planRenewal = el('asPlanRenewal');
    var upgradeBtn  = el('asUpgradeBtn');
    var paymentHint = el('asPaymentHint');

    var plan = window.CODIVIUM_DEMO_PLAN || {
      tier: 'free', tierLabel: 'Free', autoRenews: false,
      expiresAt: null, renewsAt: null, dateLabel: 'No active subscription',
      card: null, discount: null
    };

    if (planBadge) {
      planBadge.textContent = plan.tierLabel || plan.tier || 'Free';
      planBadge.className   = 'as-plan-badge' + (plan.tier === 'free' ? ' free' : '');
    }
    if (planRenewal) {
      planRenewal.textContent = plan.dateLabel || 'No active subscription';
    }
    if (paymentHint && plan.card) {
      paymentHint.textContent = plan.card;
    }

    // Cancel button: hidden for weekly (expires naturally) and free
    if (plan.tier === 'weekly' || plan.tier === 'free') {
      var cancelTrigger = document.querySelector('[data-open="cancelSubModal"]');
      if (cancelTrigger) cancelTrigger.hidden = true;
    }

    if (upgradeBtn) {
      if (plan.tier === 'weekly') {
        upgradeBtn.textContent = 'Re-subscribe';
        upgradeBtn.addEventListener('click', function () {
          // TODO: link to pricing / checkout page
          showToast('Redirecting to pricing');
        });
      } else if (plan.tier === 'free') {
        upgradeBtn.textContent = 'Subscribe';
        upgradeBtn.addEventListener('click', function () {
          // TODO: link to pricing / checkout page
          showToast('Redirecting to pricing');
        });
      } else {
        // Monthly or Annual — manage via Stripe Customer Portal
        upgradeBtn.textContent = 'Manage plan';
        upgradeBtn.addEventListener('click', function () {
          showToast('Opening billing portal');
          // TODO: fetch('/api/billing/portal', { credentials: 'same-origin' })
          //         .then(r => r.json()).then(d => { window.location.href = d.url; });
        });
      }
    }
  }

  /* ── Billing history ──────────────────────────────────────── */
  function loadBilling() {
    // Stub: replace with API call to GET /api/user/invoices
    // In demo mode, reads from window.CODIVIUM_DEMO_INVOICES
    var invoices = window.CODIVIUM_DEMO_INVOICES;
    if (!invoices || !invoices.length) return;
    var tbody = el('asBillingRows');
    if (!tbody) return;
    tbody.innerHTML = '';
    invoices.forEach(function (inv) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + inv.date + '</td>' +
        '<td>' + inv.desc + '</td>' +
        '<td class="amount">' + inv.amount + '</td>' +
        '<td><a class="download-link" href="' + inv.url + '">Download ↓</a></td>';
      tbody.appendChild(tr);
    });
  }

  /* ── Notification toggles ─────────────────────────────────── */
  function applyDrawerSpeed(ms) {
    var numMs = parseInt(ms, 10);
    if (isNaN(numMs) || numMs < 0) numMs = 0;
    document.documentElement.style.setProperty('--cv-drawer-speed', numMs + 'ms');
    // Propagate to any open menu page via storage event
    try { localStorage.setItem('cv_drawer_speed', String(numMs)); } catch (_) {}
  }

  function initToggles() {
    document.querySelectorAll('[data-pref]').forEach(function (input) {
      var key = input.getAttribute('data-pref');
      var def = (key === 'notif_in_app') ? '1' : '0'; // in-app on by default
      if (key === 'reduce_motion') {
        // Sync with global.js cvEffects key
        var cvEff = (function(){ try { return localStorage.getItem('cvEffects'); } catch(_){ return null; } })();
        if (cvEff === 'low' && get('reduce_motion', '0') !== '1') { set('reduce_motion', '1'); }
        if (cvEff === 'full' && get('reduce_motion', '0') === '1') { set('reduce_motion', '0'); }
      }
      input.checked = get(key, def) === '1';
      input.addEventListener('change', function () {
        set(key, input.checked ? '1' : '0');
        // Reduce motion: apply immediately
        if (key === 'reduce_motion') {
          var low = input.checked;
          document.documentElement.setAttribute('data-cv-effects', low ? 'low' : 'normal');
          // Also write to global.js's key so other pages restore correctly
          try { localStorage.setItem('cvEffects', low ? 'low' : 'full'); } catch(_) {}
          // Lock slider at 0 when reduce motion is on
          var speedSlider = el('asDrawerSpeed');
          if (speedSlider) {
            speedSlider.disabled = low;
            if (low) {
              speedSlider.value = 0;
              applyDrawerSpeed(0);
              if (el('asDrawerSpeedLabel')) el('asDrawerSpeedLabel').textContent = '0ms';
            } else {
              var saved = parseInt(get('cv_drawer_speed', '154'), 10);
              speedSlider.value = saved;
              applyDrawerSpeed(saved);
              if (el('asDrawerSpeedLabel')) el('asDrawerSpeedLabel').textContent = saved + 'ms';
            }
          }
        }
        showToast('Preference saved.');
      });
    });

    // Drawer speed slider
    var speedSlider = el('asDrawerSpeed');
    if (speedSlider) {
      var savedSpeed = parseInt(get('cv_drawer_speed', '154'), 10);
      var isLow = get('reduce_motion', '0') === '1';
      speedSlider.value = isLow ? 0 : savedSpeed;
      speedSlider.disabled = isLow;
      applyDrawerSpeed(isLow ? 0 : savedSpeed);
      if (el('asDrawerSpeedLabel')) {
        el('asDrawerSpeedLabel').textContent = (isLow ? 0 : savedSpeed) + 'ms';
      }
      speedSlider.addEventListener('input', function () {
        var ms = parseInt(speedSlider.value, 10);
        set('cv_drawer_speed', String(ms));
        applyDrawerSpeed(ms);
        if (el('asDrawerSpeedLabel')) el('asDrawerSpeedLabel').textContent = ms + 'ms';
      });
    }
  }

  /* ── Dashboard layout select ──────────────────────────────── */
  function initDashLayout() {
    // Preset ui configs matching __CV_LAYOUT_PRESETS in dashboard.bundle.js
    var DASH_PRESETS = {
      'full':          { mode: 'full',     panels: { scores:true,  depth:true,  heatmap:true,  time:true,  allocation:true,  mcq:true,  infoPane:true  } },
      'coding_core':   { mode: 'full',     panels: { scores:true,  depth:true,  heatmap:true,  time:true,  allocation:true,  mcq:false, infoPane:true  } },
      'heatmap_focus': { mode: 'full',     panels: { scores:false, depth:false, heatmap:true,  time:false, allocation:false, mcq:false, infoPane:true  } },
      'scores_only':   { mode: 'full',     panels: { scores:true,  depth:false, heatmap:false, time:false, allocation:false, mcq:false, infoPane:true  } },
      'info_only':     { mode: 'info_only',panels: { scores:false, depth:false, heatmap:false, time:false, allocation:false, mcq:false, infoPane:true  } }
    };
    function applyDashPreset(id) {
      var ui = DASH_PRESETS[id] || DASH_PRESETS['full'];
      try { localStorage.setItem('cv.dashboard.ui', JSON.stringify(ui)); } catch (_) {}
      // If dashboard is open in the same tab, apply live
      if (window.CodiviumInsights && typeof window.CodiviumInsights.setUiPrefs === 'function') {
        try { window.CodiviumInsights.setUiPrefs(ui); } catch (_) {}
      }
    }
    var sel = el('asDashLayout');
    if (!sel) return;
    var saved = get('as_dash_layout', null);
    var effectiveSaved = saved || 'full';
    if (Array.from(sel.options).some(function(o) { return o.value === effectiveSaved; })) sel.value = effectiveSaved;
    // Only apply preset if user has explicitly saved one (avoid overwriting dashboard custom layout)
    if (saved) applyDashPreset(saved);
    sel.addEventListener('change', function () {
      set('as_dash_layout', sel.value);
      applyDashPreset(sel.value);
      showToast('Performance Insights default layout saved.');
    });
  }

  /* ── Tab switching ───────────────────────────────────────── */
  function initTabs() {
    var tabs   = document.querySelectorAll('.as-tab');
    var panels = document.querySelectorAll('.as-tab-panel');
    var STORAGE_KEY = 'as_active_tab';

    function activateTab(key) {
      tabs.forEach(function (t) {
        var isActive = t.getAttribute('data-tab') === key;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        var isActive = p.id === 'tab-' + key;
        p.classList.toggle('active', isActive);
        if (isActive) p.removeAttribute('hidden');
        else p.setAttribute('hidden', '');
      });
      // Show appearance sub-tabs only when Appearance tab is active
      var subtabBar = document.querySelector('.as-subtabs');
      if (subtabBar) {
        if (key === 'appear') subtabBar.removeAttribute('hidden');
        else subtabBar.setAttribute('hidden', '');
      }
      // Re-apply saved select values when Appearance tab shown (browser quirk guard)
      if (key === 'appear') {
        var dashSel = document.getElementById('asDashLayout');
        if (dashSel) {
          var savedDash = (function(){ try { return localStorage.getItem('as_dash_layout'); } catch(_){ return null; } })();
          if (savedDash) dashSel.value = savedDash;
        }
      }
      try { localStorage.setItem(STORAGE_KEY, key); } catch (_) {}
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        activateTab(tab.getAttribute('data-tab'));
      });
      /* Arrow key navigation */
      tab.addEventListener('keydown', function (e) {
        var all = Array.from(tabs);
        var idx = all.indexOf(tab);
        if (e.key === 'ArrowRight') { e.preventDefault(); all[(idx + 1) % all.length].focus(); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); all[(idx - 1 + all.length) % all.length].focus(); }
      });
    });

    /* Restore last active tab — always call activateTab so hidden attrs are consistent */
    var saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (_) {}
    activateTab(saved || 'account');
  }


  function initSiteThemes() {
    var grid = el('asSiteThemeGrid');
    if (!grid) return;
    var CVTheme = window.CVTheme;
    if (!CVTheme) return;
    var current = CVTheme.get();

    CVTheme.VALID.forEach(function (key) {
      var sw = CVTheme.SWATCHES[key];
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'as-theme-chip' + (key === current ? ' active' : '');
      chip.setAttribute('role', 'radio');
      chip.setAttribute('aria-checked', key === current ? 'true' : 'false');
      chip.setAttribute('data-theme-key', key);
      chip.setAttribute('aria-label', (CVTheme.LABELS && CVTheme.LABELS[key] ? CVTheme.LABELS[key] : key) + ' site theme');

      /* Mini menu preview: sidebar + content lines */
      var preview = document.createElement('span');
      preview.className = 'as-site-preview';
      preview.style.setProperty('--preview-bg', sw.bg);
      preview.style.setProperty('--preview-accent', sw.accent);
      if (sw.accent2) preview.style.setProperty('--preview-accent2', sw.accent2);
      var lines = document.createElement('span');
      lines.className = 'as-site-preview-lines';
      lines.innerHTML = '<span></span><span></span><span></span>';
      preview.appendChild(lines);

      chip.appendChild(preview);
      chip.appendChild(document.createTextNode(CVTheme.LABELS[key]));

      chip.addEventListener('click', function () {
        grid.querySelectorAll('.as-theme-chip').forEach(function (c) {
          c.classList.remove('active');
          c.setAttribute('aria-checked', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-checked', 'true');
        CVTheme.set(key);
        showToast('Theme set to ' + CVTheme.LABELS[key] + '.');
      });

      grid.appendChild(chip);
    });
    }


  

  /* ── Editor font size ──────────────────────────────────────── */
  function initEditorFontSize() {
    var sel = el('asEditorFontSize');
    if (!sel) return;
    var saved = get('cv_editor_font_size', '13');
    // Set the dropdown to saved value
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === saved) {
        sel.selectedIndex = i;
        break;
      }
    }
    // Apply to preview immediately
    applyFontSizeToPreview(saved);

    sel.addEventListener('change', function () {
      var size = sel.value;
      set('cv_editor_font_size', size);
      applyFontSizeToPreview(size);
      showToast('Editor font size set to ' + size + ' px.');
    });
  }

  function initReplFontSize() {
    var sel = el('asReplFontSize');
    if (!sel) return;
    var saved = get('cv_repl_font_size', '13');
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === saved) { sel.selectedIndex = i; break; }
    }
    sel.addEventListener('change', function () {
      set('cv_repl_font_size', sel.value);
      showToast('REPL font size set to ' + sel.value + ' px.');
    });
  }

  /* ── Font family selects ──────────────────────────────────── */
  function initEditorFontFamily() {
    var sel = el('asEditorFontFamily');
    if (!sel) return;
    var saved = get('cv_editor_font_family', 'system-mono');
    if (Array.from(sel.options).some(function(o) { return o.value === saved; })) sel.value = saved;
    applyFontFamilyToPreview(saved);
    sel.addEventListener('change', function () {
      set('cv_editor_font_family', sel.value);
      applyFontFamilyToPreview(sel.value);
      showToast('Editor font family saved.');
    });
  }

  function initReplFontFamily() {
    var sel = el('asReplFontFamily');
    if (!sel) return;
    var saved = get('cv_repl_font_family', 'system-mono');
    if (Array.from(sel.options).some(function(o) { return o.value === saved; })) sel.value = saved;
    sel.addEventListener('change', function () {
      set('cv_repl_font_family', sel.value);
      showToast('REPL font family saved.');
    });
  }

  function initInstructionsFontFamily() {
    var sel = el('asInstructionsFontFamily');
    if (!sel) return;
    var saved = get('cv_instructions_font_family', 'auto');
    if (Array.from(sel.options).some(function(o) { return o.value === saved; })) sel.value = saved;
    sel.addEventListener('change', function () {
      set('cv_instructions_font_family', sel.value);
      showToast('Instructions font family saved.');
    });
  }

  function initReplSyntaxTheme() {
    var grid = el('asReplThemeGrid');
    if (!grid) return;
    var current = get('cv_repl_syntax_theme', 'obsidian-code');

    EDITOR_THEMES.forEach(function (theme) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'as-theme-chip' + (theme.key === current ? ' active' : '');
      chip.setAttribute('role', 'radio');
      chip.setAttribute('aria-checked', theme.key === current ? 'true' : 'false');
      chip.setAttribute('aria-label', (theme.name || theme.key) + ' REPL theme');

      var dot = document.createElement('span');
      dot.className = 'as-theme-dot';
      dot.style.background = theme.dot;
      if (theme.dot.startsWith('#F') || theme.dot.startsWith('#E')) {
        dot.style.borderColor = 'rgba(255,255,255,0.25)';
      }

      chip.appendChild(dot);
      chip.appendChild(document.createTextNode(theme.name));

      chip.addEventListener('click', function () {
        grid.querySelectorAll('.as-theme-chip').forEach(function (c) {
          c.classList.remove('active');
          c.setAttribute('aria-checked', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-checked', 'true');
        set('cv_repl_syntax_theme', theme.key);
        renderReplPreview(theme.key);
        showToast('REPL theme set to ' + theme.name + '.');
      });

      grid.appendChild(chip);
    });
    renderReplPreview(current);
  }



  function initInstructionsFontSize() {
    var sel = el('asInstructionsFontSize');
    if (!sel) return;
    var saved = get('cv_instructions_font_size', '15');
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === saved) { sel.selectedIndex = i; break; }
    }
    sel.addEventListener('change', function () {
      set('cv_instructions_font_size', sel.value);
      showToast('Instructions font size set to ' + sel.value + ' px.');
    });
  }


  function applyFontSizeToPreview(size) {
    var preview = document.getElementById('asEditorPreview');
    if (!preview) return;
    var px = (typeof size === 'string' && size.includes('px')) ? size : size + 'px';
    var targets = [
      preview.querySelector('#asEditorPreviewContent'),
      preview.querySelector('code'),
      preview.querySelector('pre'),
      preview.querySelector('.as-ep-code')
    ];
    targets.forEach(function(el) { if (el) el.style.fontSize = px; });
  }

  function applyFontFamilyToPreview(familyKey) {
    var FONT_MAP = {
      'system-mono':    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      'jetbrains-mono': '"JetBrains Mono", monospace',
      'fira-code':      '"Fira Code", monospace',
      'source-code-pro':'"Source Code Pro", monospace',
      'ibm-plex-mono':  '"IBM Plex Mono", monospace',
      'inconsolata':    '"Inconsolata", monospace'
    };
    var fam = FONT_MAP[familyKey] || FONT_MAP['system-mono'];
    var preview = document.getElementById('asEditorPreview');
    if (!preview) return;
    var targets = [preview.querySelector('code'), preview.querySelector('pre'), preview.querySelector('.as-ep-code')];
    targets.forEach(function(el) { if (el) el.style.fontFamily = fam; });
  }


  /* ── Editor theme syntax preview ─────────────────────────── */
  var AS_SYNTAX_THEMES = [
    {
      key: "obsidian-code",
      name: "Obsidian Code",
      mode: "dark",
      desc: "Deep obsidian base with crisp cool accents (premium, low-glare).",
      colors: {
        codeBg:"#0B1020", codeFg:"#E8EEF5",
        gutterBg:"#0A0F1D", gutterFg:"#6E7A90",
        panelBg:"#111827", panelBorder:"#273246",
        selection:"#2A3A67", linehl:"#101A34", caret:"#FFD166",
        comment:"#7E8AA5", keyword:"#A78BFA", string:"#7EE2A8", number:"#F5D68A",
        function:"#4FB0FF", type:"#34D399", variable:"#E8EEF5", builtin:"#FF5DA2",
        operator:"#C9D2DE", punct:"#9FB0C7"
      }
    },
    {
      key: "midnight-terminal",
      name: "Midnight Terminal",
      mode: "dark",
      desc: "Terminal-inspired midnight palette with strong violet keywords.",
      colors: {
        codeBg:"#070812", codeFg:"#ECEBFF",
        gutterBg:"#060610", gutterFg:"#7E7AAE",
        panelBg:"#111027", panelBorder:"#2B2A55",
        selection:"#2A1F59", linehl:"#141032", caret:"#B9A2FF",
        comment:"#8A86B8", keyword:"#B9A2FF", string:"#7EE2A8", number:"#F7D99A",
        function:"#7DD3FC", type:"#34D399", variable:"#ECEBFF", builtin:"#FF5DA2",
        operator:"#C3C1E6", punct:"#A6A4D0"
      }
    },
    {
      key: "carbon-ink",
      name: "Carbon Ink",
      mode: "dark",
      desc: "Neutral carbon blacks with ink-bright accents and restrained saturation.",
      colors: {
        codeBg:"#0A0A0B", codeFg:"#F3F1EC",
        gutterBg:"#080808", gutterFg:"#8B8579",
        panelBg:"#151516", panelBorder:"#2E2D2A",
        selection:"#2C2517", linehl:"#151312", caret:"#D9C07C",
        comment:"#8B8579", keyword:"#D9C07C", string:"#86E7B0", number:"#F7D99A",
        function:"#9AE6FF", type:"#34D399", variable:"#F3F1EC", builtin:"#FF7AA2",
        operator:"#C8C3B8", punct:"#B6B0A5"
      }
    },
    {
      key: "graphite-neon",
      name: "Graphite Neon",
      mode: "dark",
      desc: "Graphite base with neon-forward accents (great for long sessions).",
      colors: {
        codeBg:"#0B0F14", codeFg:"#F2F4F7",
        gutterBg:"#0A0D12", gutterFg:"#8793A2",
        panelBg:"#1A1D22", panelBorder:"#2D3442",
        selection:"#1D2B3A", linehl:"#121A22", caret:"#34D399",
        comment:"#8793A2", keyword:"#60A5FA", string:"#34D399", number:"#F5D68A",
        function:"#FF5DA2", type:"#A7F3D0", variable:"#F2F4F7", builtin:"#7DD3FC",
        operator:"#C7D0DD", punct:"#9FB0C7"
      }
    },
    {
      key: "aurora-nightfall",
      name: "Aurora Nightfall",
      mode: "dark",
      desc: "Aurora accents over nightfall navy — vivid but still premium.",
      colors: {
        codeBg:"#06111A", codeFg:"#EAF2FB",
        gutterBg:"#050E15", gutterFg:"#7B8CA3",
        panelBg:"#0C1C28", panelBorder:"#1F3344",
        selection:"#0F2E3F", linehl:"#071A24", caret:"#7EE2A8",
        comment:"#7B8CA3", keyword:"#7DD3FC", string:"#7EE2A8", number:"#FFD7A8",
        function:"#A78BFA", type:"#34D399", variable:"#EAF2FB", builtin:"#FF5DA2",
        operator:"#C7D0DD", punct:"#A3B6CC"
      }
    },
    {
      key: "porcelain-codebook",
      name: "Porcelain Codebook",
      mode: "light",
      desc: "Porcelain editor surface with clean, editorial color decisions.",
      colors: {
        codeBg:"#FBFCFE", codeFg:"#0F172A",
        gutterBg:"#F1F5F9", gutterFg:"#64748B",
        panelBg:"#FFFFFF", panelBorder:"#E2E8F0",
        selection:"#C7D2FE", linehl:"#EEF2FF", caret:"#2563EB",
        comment:"#64748B", keyword:"#7C3AED", string:"#0F766E", number:"#B45309",
        function:"#2563EB", type:"#0F766E", variable:"#0F172A", builtin:"#DB2777",
        operator:"#334155", punct:"#475569"
      }
    },
    {
      key: "ivory-syntax",
      name: "Ivory Syntax",
      mode: "light",
      desc: "Warm ivory base; refined contrast with soft but legible accents.",
      colors: {
        codeBg:"#FFFDF8", codeFg:"#111827",
        gutterBg:"#F3EFE6", gutterFg:"#6B7280",
        panelBg:"#FFFFFF", panelBorder:"#E5E1D6",
        selection:"#BFDBFE", linehl:"#F1F5F9", caret:"#1F3A5F",
        comment:"#6B7280", keyword:"#1F3A5F", string:"#0F766E", number:"#B45309",
        function:"#2563EB", type:"#0F766E", variable:"#111827", builtin:"#C026D3",
        operator:"#374151", punct:"#4B5563"
      }
    },
    {
      key: "champagne-console",
      name: "Champagne Console",
      mode: "light",
      desc: "Champagne-tinted light theme with confident, muted sophistication.",
      colors: {
        codeBg:"#FFFAF3", codeFg:"#1F2937",
        gutterBg:"#F3ECE2", gutterFg:"#6B7280",
        panelBg:"#FFFFFF", panelBorder:"#E9DCCF",
        selection:"#FDE68A", linehl:"#FFF7ED", caret:"#7C2D43",
        comment:"#6B7280", keyword:"#7C2D43", string:"#0F766E", number:"#92400E",
        function:"#1D4ED8", type:"#0F766E", variable:"#1F2937", builtin:"#BE185D",
        operator:"#374151", punct:"#4B5563"
      }
    },
    {
      key: "slate-studio",
      name: "Slate Studio",
      mode: "mid",
      desc: "Mid-tone slate base (neither stark dark nor bright light).",
      colors: {
        codeBg:"#1B2431", codeFg:"#E6EEF8",
        gutterBg:"#18202B", gutterFg:"#8AA0B6",
        panelBg:"#232E3D", panelBorder:"#304155",
        selection:"#2F4A6B", linehl:"#223043", caret:"#60A5FA",
        comment:"#8AA0B6", keyword:"#60A5FA", string:"#34D399", number:"#F5D68A",
        function:"#A78BFA", type:"#A7F3D0", variable:"#E6EEF8", builtin:"#FF5DA2",
        operator:"#C7D0DD", punct:"#A3B6CC"
      }
    },
    {
      key: "mist-meridian",
      name: "Mist Meridian",
      mode: "mid/light",
      desc: "Mist-grey base with gentle accents; great for daytime focus.",
      colors: {
        codeBg:"#EEF2F6", codeFg:"#0F172A",
        gutterBg:"#E2E8F0", gutterFg:"#64748B",
        panelBg:"#F7FAFD", panelBorder:"#CBD5E1",
        selection:"#A7F3D0", linehl:"#E6F4EF", caret:"#10B981",
        comment:"#64748B", keyword:"#0F2A43", string:"#0F766E", number:"#92400E",
        function:"#2563EB", type:"#0F766E", variable:"#0F172A", builtin:"#DB2777",
        operator:"#334155", punct:"#475569"
      }
    }
  ];

  var SAMPLE_PY = '<span class="as-ep-cmt"># Fibonacci sequence</span>\n<span class="as-ep-kw">def</span> <span class="as-ep-fn">fibonacci</span><span class="as-ep-pun">(</span><span class="as-ep-var">n</span><span class="as-ep-pun">):</span>\n    <span class="as-ep-str">"""Return nth Fibonacci."""</span>\n    <span class="as-ep-kw">if</span> <span class="as-ep-var">n</span> <span class="as-ep-op">&lt;=</span> <span class="as-ep-num">1</span><span class="as-ep-pun">:</span>\n        <span class="as-ep-kw">return</span> <span class="as-ep-var">n</span>\n    <span class="as-ep-var">a</span><span class="as-ep-pun">,</span> <span class="as-ep-var">b</span> <span class="as-ep-op">=</span> <span class="as-ep-num">0</span><span class="as-ep-pun">,</span> <span class="as-ep-num">1</span>\n    <span class="as-ep-kw">for</span> <span class="as-ep-var">_</span> <span class="as-ep-kw">in</span> <span class="as-ep-fn">range</span><span class="as-ep-pun">(</span><span class="as-ep-var">n</span> <span class="as-ep-op">-</span> <span class="as-ep-num">1</span><span class="as-ep-pun">):</span>\n        <span class="as-ep-var">a</span><span class="as-ep-pun">,</span> <span class="as-ep-var">b</span> <span class="as-ep-op">=</span> <span class="as-ep-var">b</span><span class="as-ep-pun">,</span> <span class="as-ep-var">a</span> <span class="as-ep-op">+</span> <span class="as-ep-var">b</span>\n    <span class="as-ep-kw">return</span> <span class="as-ep-var">b</span>\n\n<span class="as-ep-cmt"># Class example</span>\n<span class="as-ep-kw">class</span> <span class="as-ep-cls">Stack</span><span class="as-ep-pun">:</span>\n    <span class="as-ep-kw">def</span> <span class="as-ep-fn">__init__</span><span class="as-ep-pun">(</span><span class="as-ep-var">self</span><span class="as-ep-pun">):</span>\n        <span class="as-ep-var">self</span><span class="as-ep-pun">.</span><span class="as-ep-var">data</span> <span class="as-ep-op">=</span> <span class="as-ep-pun">[]</span>\n\n    <span class="as-ep-kw">def</span> <span class="as-ep-fn">push</span><span class="as-ep-pun">(</span><span class="as-ep-var">self</span><span class="as-ep-pun">,</span> <span class="as-ep-var">v</span><span class="as-ep-pun">):</span>\n        <span class="as-ep-var">self</span><span class="as-ep-pun">.</span><span class="as-ep-var">data</span><span class="as-ep-pun">.</span><span class="as-ep-fn">append</span><span class="as-ep-pun">(</span><span class="as-ep-var">v</span><span class="as-ep-pun">)</span>\n\n<span class="as-ep-cmt"># Usage</span>\n<span class="as-ep-var">result</span> <span class="as-ep-op">=</span> <span class="as-ep-pun">[</span>\n    <span class="as-ep-fn">fibonacci</span><span class="as-ep-pun">(</span><span class="as-ep-var">i</span><span class="as-ep-pun">)</span> <span class="as-ep-kw">for</span> <span class="as-ep-var">i</span> <span class="as-ep-kw">in</span> <span class="as-ep-fn">range</span><span class="as-ep-pun">(</span><span class="as-ep-num">10</span><span class="as-ep-pun">)</span>\n<span class="as-ep-pun">]</span>\n<span class="as-ep-fn">print</span><span class="as-ep-pun">(</span><span class="as-ep-str">f&quot;Sequence: </span><span class="as-ep-pun">{</span><span class="as-ep-var">result</span><span class="as-ep-pun">}&quot;</span><span class="as-ep-str">)</span>';

  function renderEditorPreview(themeKey) {
    var preview = document.getElementById('asEditorPreview');
    var content = document.getElementById('asEditorPreviewContent');
    if (!preview || !content) return;

    // Use our inlined copy — no dependency on editor-page.js
    var themes = AS_SYNTAX_THEMES;
    var t = null;
    for (var i = 0; i < themes.length; i++) {
      if (themes[i].key === themeKey) { t = themes[i]; break; }
    }
    if (!t) t = themes[0];

    if (t && t.colors) {
      var c = t.colors;
      preview.style.background  = c.codeBg  || '#0B1020';
      preview.style.borderColor = c.panelBorder || 'rgba(255,255,255,0.10)';
      content.style.color       = c.codeFg  || '#E8EEF5';
      var s = preview.style;
      s.setProperty('--syn-keyword',  c.keyword   || '#A78BFA');
      s.setProperty('--syn-function', c['function']|| '#4FB0FF');
      s.setProperty('--syn-string',   c.string    || '#7EE2A8');
      s.setProperty('--syn-number',   c.number    || '#F5D68A');
      s.setProperty('--syn-comment',  c.comment   || '#7E8AA5');
      s.setProperty('--syn-operator', c.operator  || '#C9D2DE');
      s.setProperty('--syn-variable', c.variable  || '#E8EEF5');
      s.setProperty('--syn-type',     c.type      || '#34D399');
      s.setProperty('--syn-punct',    c.punct     || '#9FB0C7');
    }
    content.innerHTML = SAMPLE_PY;
    // Also re-apply current font size to preview
    var savedSize = get('cv_editor_font_size', '13');
    preview.style.fontSize = savedSize + (savedSize.includes('px') ? '' : 'px');
  }

  function renderReplPreview(themeKey) {
    var preview = document.getElementById('asReplPreview');
    var content = document.getElementById('asReplPreviewContent');
    if (!preview || !content) return;
    var themes = AS_SYNTAX_THEMES;
    var t = null;
    for (var i = 0; i < themes.length; i++) {
      if (themes[i].key === themeKey) { t = themes[i]; break; }
    }
    if (!t) t = themes[0];
    if (t && t.colors) {
      var c = t.colors;
      preview.style.background  = c.codeBg  || '#0B1020';
      preview.style.borderColor = c.panelBorder || 'rgba(255,255,255,0.10)';
      content.style.color       = c.codeFg  || '#E8EEF5';
      var s = preview.style;
      s.setProperty('--syn-keyword',  c.keyword   || '#A78BFA');
      s.setProperty('--syn-function', c['function']|| '#4FB0FF');
      s.setProperty('--syn-string',   c.string    || '#7EE2A8');
      s.setProperty('--syn-number',   c.number    || '#F5D68A');
      s.setProperty('--syn-comment',  c.comment   || '#7E8AA5');
      s.setProperty('--syn-operator', c.operator  || '#C9D2DE');
      s.setProperty('--syn-variable', c.variable  || '#E8EEF5');
    }
    content.innerHTML = SAMPLE_PY;
    var savedSize = get('cv_repl_font_size', '13');
    preview.style.fontSize = savedSize + (savedSize.includes('px') ? '' : 'px');
  }


  function initEditorThemes() {
    var grid = el('asEditorThemeGrid');
    if (!grid) return;
    var current = get('cv_syntax_theme', 'obsidian-code');

    EDITOR_THEMES.forEach(function (theme) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'as-theme-chip' + (theme.key === current ? ' active' : '');
      chip.setAttribute('role', 'radio');
      chip.setAttribute('aria-checked', theme.key === current ? 'true' : 'false');
      chip.setAttribute('aria-label', (theme.name || theme.key) + ' editor theme');

      var dot = document.createElement('span');
      dot.className = 'as-theme-dot';
      dot.style.background = theme.dot;
      if (theme.dot.startsWith('#F') || theme.dot.startsWith('#E')) {
        dot.style.borderColor = 'rgba(255,255,255,0.25)';
      }

      chip.appendChild(dot);
      chip.appendChild(document.createTextNode(theme.name));

      chip.addEventListener('click', function () {
        grid.querySelectorAll('.as-theme-chip').forEach(function (c) {
          c.classList.remove('active');
          c.setAttribute('aria-checked', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-checked', 'true');
        set('cv_syntax_theme', theme.key);
        renderEditorPreview(theme.key);
        showToast('Editor theme set to ' + theme.name + '.');
      });

      grid.appendChild(chip);
    });
    renderEditorPreview(current);
  }




  function openModal(id) {
    var backdrop = document.getElementById('modal-' + id);
    if (!backdrop) return;
    backdrop.classList.add('open');
    backdrop._triggerEl = document.activeElement || null;

    // Focus first focusable element inside modal
    var firstField = backdrop.querySelector('input, select, textarea, button:not([data-close-modal])');
    if (firstField) setTimeout(function () { firstField.focus(); }, 60);

    // Focus trap — keeps Tab cycling within the modal
    function trapFocus(e) {
      if (e.key !== 'Tab') return;
      var focusable = Array.from(backdrop.querySelectorAll(
        'a, button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter(function(el) { return !el.closest('[hidden]'); });
      if (!focusable.length) return;
      var first = focusable[0];
      var last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }

    // Escape key closes modal
    function onKeydown(e) {
      if (e.key === 'Escape') closeModal(id);
    }

    backdrop._trapFocus = trapFocus;
    backdrop._onKeydown = onKeydown;
    backdrop.addEventListener('keydown', trapFocus);
    document.addEventListener('keydown', onKeydown);
  }
  function closeModal(id) {
    var backdrop = document.getElementById('modal-' + id);
    if (!backdrop) return;
    backdrop.classList.remove('open');
    // Remove focus trap listeners
    if (backdrop._trapFocus) {
      backdrop.removeEventListener('keydown', backdrop._trapFocus);
      backdrop._trapFocus = null;
    }
    if (backdrop._onKeydown) {
      document.removeEventListener('keydown', backdrop._onKeydown);
      backdrop._onKeydown = null;
    }
    // Restore focus to the element that triggered the modal
    if (backdrop._triggerEl && typeof backdrop._triggerEl.focus === 'function') {
      setTimeout(function() { backdrop._triggerEl.focus(); }, 0);
      backdrop._triggerEl = null;
    }
  }

  function closeAllModals() {
    document.querySelectorAll('.as-modal-backdrop.open').forEach(function (m) {
      var id = m.id ? m.id.replace('modal-', '') : null;
      if (id) closeModal(id);
      else m.classList.remove('open');
    });
  }

  /* ── Appearance sub-tab switching ───────────────────────── */
  function initSubTabs() {
    var btns   = document.querySelectorAll('.as-subtab');
    var panels = document.querySelectorAll('.as-subpanel');
    var SKEY   = 'as_appear_subtab';

    function activateSubTab(key) {
      btns.forEach(function(b) {
        var active = b.getAttribute('data-subtab') === key;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panels.forEach(function(p) {
        p.classList.toggle('active', p.id === 'asp-' + key);
      });
      try { localStorage.setItem(SKEY, key); } catch(_) {}
    }

    btns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        activateSubTab(btn.getAttribute('data-subtab'));
      });
      btn.addEventListener('keydown', function(e) {
        var all = Array.from(btns);
        var idx = all.indexOf(btn);
        if (e.key === 'ArrowRight') { e.preventDefault(); all[(idx + 1) % all.length].focus(); activateSubTab(all[(idx + 1) % all.length].getAttribute('data-subtab')); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); all[(idx - 1 + all.length) % all.length].focus(); activateSubTab(all[(idx - 1 + all.length) % all.length].getAttribute('data-subtab')); }
      });
    });

    var saved;
    try { saved = localStorage.getItem(SKEY); } catch(_) {}
    var validKeys = Array.from(btns).map(function(b) { return b.getAttribute('data-subtab'); });
    activateSubTab(validKeys.indexOf(saved) !== -1 ? saved : 'general');
  }

  function initModals() {
    // Open buttons
    document.querySelectorAll('[data-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () { openModal(btn.getAttribute('data-modal')); });
    });
    // Close buttons
    document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
      btn.addEventListener('click', closeAllModals);
    });
    // Close on backdrop click
    document.querySelectorAll('.as-modal-backdrop').forEach(function (backdrop) {
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) closeAllModals();
      });
    });
    // Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllModals();
    });
  }

  /* ── Profile API bridge ───────────────────────────────────────
   * The React page hands us the one action the profile section needs on
   * window.CV_PROFILE_API.sendPasswordReset() (see SettingsPage.jsx). It resolves
   * the signed-in user's real email from the backend, emails a secure reset link
   * (/resetPassword?uniquecode=…) and returns an axios-style response
   * ({ status, data }) — data === true on success. */
  function profileApi() { return window.CV_PROFILE_API || null; }

  /* ── Modal actions ────────────────────────────────────────── */
  function initModalActions() {

    // Change password — email a reset link to the signed-in user. They set the
    // new password from that link (new + confirm) on the reset page.
    var changePwBtn = el('asChangePasswordBtn');
    if (changePwBtn) {
      changePwBtn.addEventListener('click', function () {
        if (changePwBtn.disabled) return;               // ignore double-clicks
        var api = profileApi();
        if (!api || typeof api.sendPasswordReset !== 'function') {
          showToast('You must be signed in to change your password.', true);
          return;
        }

        // Show an inline loader on the button while the email is being sent.
        var originalHtml = changePwBtn.innerHTML;
        changePwBtn.disabled = true;
        changePwBtn.setAttribute('aria-busy', 'true');
        changePwBtn.innerHTML = '<span class="as-btn-spinner" aria-hidden="true"></span>Sending…';

        var restore = function () {
          changePwBtn.innerHTML = originalHtml;
          changePwBtn.removeAttribute('aria-busy');
          changePwBtn.disabled = false;
        };

        api.sendPasswordReset().then(function (res) {
          if (res && res.status === 200 && res.data === true) {
            showToast('Password reset link sent to your email.');
          } else {
            var msg = (res && typeof res.data === 'string') ? res.data : '';
            showToast(msg || 'Could not send the reset link. Try again.', true);
          }
        }).catch(function () {
          showToast('Something went wrong. Try again.', true);
        }).then(restore);
      });
    }

    // Payment method ("Manage payment →") and Cancel subscription are wired by
    // the React page (SettingsPage.jsx) against the live backend: "Manage
    // payment" opens the Stripe Customer Portal and Cancel calls the cancel
    // endpoint. Not handled here to avoid double-binding the same buttons.

    // Delete account — this NEVER deletes anything itself. It only sends a
    // request email to Codivium staff, who perform the actual deletion
    // manually (see AccountApiController.RequestAccountDeletion). The
    // password field is a confirmation-friction step only, not verified
    // server-side (deletion review happens on the human side).
    var deleteInput = el('asDeleteConfirm');
    var deleteBtn   = el('confirmDeleteAccount');
    if (deleteInput && deleteBtn) {
      deleteInput.addEventListener('input', function () {
        deleteBtn.disabled = deleteInput.value.trim().length < 6;
      });
      deleteBtn.addEventListener('click', function () {
        var pwd = deleteInput.value.trim();
        if (pwd.length < 6) return;
        var api = profileApi();
        closeAllModals();
        if (api && typeof api.requestAccountDeletion === 'function') api.requestAccountDeletion();
      });
    }
  }

  /* ── Toast notifications ──────────────────────────────────── */
  var _toastEl = null;
  var _toastTimer = null;
  function showToast(msg, isError) {
    if (!_toastEl) {
      _toastEl = document.createElement('div');
      _toastEl.style.cssText = [
        'position:fixed', 'bottom:24px', 'left:50%', 'transform:translateX(-50%)',
        'background:rgba(14,16,26,0.96)', 'border:1px solid rgba(255,255,255,0.14)',
        'color:rgba(245,245,252,0.92)', 'border-radius:12px', 'padding:10px 18px',
        'font-size:13px', 'font-family:var(--font-ui)', 'z-index:9999',
        'box-shadow:0 16px 40px rgba(0,0,0,0.55)',
        'transition:opacity 250ms', 'pointer-events:none'
      ].join(';');
      document.body.appendChild(_toastEl);
    }
    _toastEl.textContent = msg;
    _toastEl.style.borderColor = isError
      ? 'rgba(220,80,80,0.40)'
      : 'rgba(246,213,138,0.35)';
    _toastEl.style.opacity = '1';
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { _toastEl.style.opacity = '0'; }, 2800);
  }

  /* ── Appearance persistence (DB-backed via window.CV_PROFILE_API) ──────────
   * These preferences are saved to the backend so a user's setup follows them to
   * any device/login. All keys are lowercase, matching the backend's lowercase
   * KeyName storage. `cvEffects` and `cv.dashboard.ui` are derived mirrors of
   * `reduce_motion` / `as_dash_layout`, so we persist only the primary keys and
   * re-derive the mirrors on load. */
  var APPEARANCE_KEYS = [
    'cv_site_theme',
    'as_dash_layout',
    'reduce_motion',
    'cv_drawer_speed',
    'cv_syntax_theme',
    'cv_editor_font_size',
    'cv_editor_font_family',
    'cv_repl_syntax_theme',
    'cv_repl_font_size',
    'cv_repl_font_family',
    'cv_instructions_font_size',
    'cv_instructions_font_family',
    'as_appear_subtab',
  ];
  // Notification preferences are persisted the same DB-backed way as appearance,
  // so a user's choices follow them across devices AND the server can honour them
  // (e.g. only email users who opted into marketing / weekly digests). Same
  // lowercase KeyName storage; values are '1'|'0'.
  var NOTIFICATION_KEYS = [
    'notif_in_app',
    'notif_marketing',
  ];
  // Every key we hydrate-from / sync-to the backend (appearance + notifications).
  var SYNC_KEYS = APPEARANCE_KEYS.concat(NOTIFICATION_KEYS);
  var _apSnapshot = {};
  var _apSaveTimer = null;

  // Pull saved values from the backend into localStorage BEFORE the init
  // functions read them, so every control shows the user's saved choice.
  function hydrateAppearanceFromDb() {
    var api = profileApi();
    if (!api || typeof api.getAppearanceSettings !== 'function') {
      return Promise.resolve();
    }
    return api.getAppearanceSettings().then(function (res) {
      if (!res || res.status !== 200 || !Array.isArray(res.data)) return;
      res.data.forEach(function (row) {
        var key = (row && row.keyName ? String(row.keyName) : '').toLowerCase();
        if (key && SYNC_KEYS.indexOf(key) !== -1 && row.displayValue != null) {
          set(key, String(row.displayValue));
        }
      });
      // Re-derive the reduce-motion mirror and apply the site theme now.
      var rm = get('reduce_motion', null);
      if (rm != null) set('cvEffects', rm === '1' ? 'low' : 'full');
      var theme = get('cv_site_theme', null);
      if (theme && window.CVTheme && typeof window.CVTheme.set === 'function') {
        window.CVTheme.set(theme);
      }
    }).catch(function () { /* offline / unauthenticated — keep local values */ });
  }

  // Remember the current values so we only push what actually changed.
  function snapshotAppearance() {
    SYNC_KEYS.forEach(function (k) { _apSnapshot[k] = get(k, null); });
  }

  // Diff localStorage against the snapshot and upsert only the changed keys.
  function syncChangedAppearance() {
    var api = profileApi();
    if (!api || typeof api.saveAppearanceSetting !== 'function') return;
    SYNC_KEYS.forEach(function (k) {
      var cur = get(k, null);
      if (cur === _apSnapshot[k]) return;
      _apSnapshot[k] = cur;
      if (cur == null) return;
      api.saveAppearanceSetting({
        KeyName: k, DisplayText: k, DisplayValue: String(cur),
      }).catch(function () { /* best-effort; value stays in localStorage */ });
    });
  }

  function scheduleAppearanceSync() {
    if (_apSaveTimer) clearTimeout(_apSaveTimer);
    _apSaveTimer = setTimeout(syncChangedAppearance, 600);
  }

  // Any change/click/input on the page may have updated an appearance key
  // (theme chips write on click; selects/checkbox/range fire change/input).
  // Debounced + diff-based, so unrelated events cost only a timer reset.
  // SettingsPage re-injects this script on every visit, so remove a previous
  // instance's document listeners first — only the latest one should sync.
  var _AP_EVENTS = ['change', 'input', 'click'];
  function initAppearanceSync() {
    snapshotAppearance();
    if (window.__cvApSyncHandler) {
      _AP_EVENTS.forEach(function (evt) {
        document.removeEventListener(evt, window.__cvApSyncHandler, true);
      });
    }
    window.__cvApSyncHandler = scheduleAppearanceSync;
    _AP_EVENTS.forEach(function (evt) {
      document.addEventListener(evt, scheduleAppearanceSync, true);
    });
  }

  /* ── Boot ─────────────────────────────────────────────────── */
  function init() {
    // Display name, email, and avatar are rendered directly by the React page
    // (SettingsPage.jsx) from a live getUserById call — same as billing below —
    // so there's nothing to load here from localStorage.
    initAvatar();

    // Core UI that doesn't depend on saved appearance values — wire it
    // synchronously so tabs and modals (e.g. change password) work immediately,
    // independent of the settings network call.
    initTabs();
    initModals();
    initModalActions();

    // Hydrate saved appearance from the backend first, THEN run the init
    // functions that read those values, THEN start syncing changes back.
    hydrateAppearanceFromDb().then(function () {
      initToggles();
      initDashLayout();
      initSiteThemes();
      initEditorThemes();
      initEditorFontSize();
      initReplFontSize();
      initInstructionsFontSize();
      initEditorFontFamily();
      initReplFontFamily();
      initInstructionsFontFamily();
      initReplSyntaxTheme();
      initSubTabs();

      // Reduce motion: apply on load
      if (get('reduce_motion') === '1') {
        document.documentElement.setAttribute('data-cv-effects', 'low');
      }

      // Start persisting changes only after everything is applied, so hydration
      // and init defaults don't get echoed straight back to the server.
      initAppearanceSync();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Cleanup on page navigation (SPA safety) ───────────────────────────────
  window.addEventListener('pagehide', function() {
    // Remove the DOMContentLoaded listener if it hasn't fired yet
    document.removeEventListener('DOMContentLoaded', init);
    // Best-effort removal of window-level listeners added during init
    try { window.removeEventListener('resize', onResize); } catch(_) {}
  }, { once: true });

})();
