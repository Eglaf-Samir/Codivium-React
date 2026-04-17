// utils/prefs.js — all preference keys and defaults in one place.
// Adding a new preference = add one entry here. No other change needed.

export const PREF_DEFAULTS = {
  // Editor appearance — Carbon Ink for both editor and REPL
  cv_syntax_theme:             'carbon-ink',
  cv_repl_syntax_theme:        'carbon-ink',
  cv_editor_font_size:         '13',
  cv_repl_font_size:           '13',
  cv_instructions_font_size:   '15',
  cv_editor_font_family:       'system-mono',
  cv_repl_font_family:         'system-mono',
  cv_instructions_font_family: 'auto',
  // Platform preferences
  as_dash_layout:              'full',
  cv_drawer_speed:             '500',  // max speed (slowest animation = most visible)
  reduce_motion:               '0',    // animations on
  // Notifications
  notif_weekly_summary:        '0',
  notif_milestones:            '1',
  notif_in_app:                '1',
  notif_marketing:             '0',
  // Privacy — both consent flags off by default
  show_tour_btn:               '1',
  analytics_consent:           '0',
  performance_consent:         '0',
};

export const DASH_PRESETS = {
  full:          { mode: 'full',      panels: { scores:true,  depth:true,  heatmap:true,  time:true,  allocation:true,  mcq:true,  infoPane:true  } },
  coding_core:   { mode: 'full',      panels: { scores:true,  depth:true,  heatmap:true,  time:true,  allocation:true,  mcq:false, infoPane:true  } },
  heatmap_focus: { mode: 'full',      panels: { scores:false, depth:false, heatmap:true,  time:false, allocation:false, mcq:false, infoPane:true  } },
  scores_only:   { mode: 'full',      panels: { scores:true,  depth:false, heatmap:false, time:false, allocation:false, mcq:false, infoPane:true  } },
  info_only:     { mode: 'info_only', panels: { scores:false, depth:false, heatmap:false, time:false, allocation:false, mcq:false, infoPane:true  } },
};

export const CODE_FONT_SIZES = [
  { value: '6',  label: '6px' },
  { value: '7',  label: '7px' },
  { value: '8',  label: '8px' },
  { value: '9',  label: '9px' },
  { value: '10', label: '10px' },
  { value: '11', label: '11px' },
  { value: '12', label: '12px' },
  { value: '13', label: '13px — Default' },
  { value: '14', label: '14px' },
  { value: '15', label: '15px' },
  { value: '16', label: '16px' },
  { value: '17', label: '17px' },
  { value: '18', label: '18px' },
  { value: '20', label: '20px' },
  { value: '22', label: '22px' },
  { value: '24', label: '24px' },
  { value: '26', label: '26px' },
  { value: '28', label: '28px' },
  { value: '30', label: '30px' },
  { value: '32', label: '32px' },
  { value: '34', label: '34px' },
  { value: '36', label: '36px' },
];

export const PROSE_FONT_SIZES = [
  { value: '6',  label: '6px' },
  { value: '7',  label: '7px' },
  { value: '8',  label: '8px' },
  { value: '9',  label: '9px' },
  { value: '10', label: '10px' },
  { value: '11', label: '11px' },
  { value: '12', label: '12px' },
  { value: '13', label: '13px' },
  { value: '14', label: '14px' },
  { value: '15', label: '15px — Default' },
  { value: '16', label: '16px' },
  { value: '17', label: '17px' },
  { value: '18', label: '18px' },
  { value: '20', label: '20px' },
  { value: '22', label: '22px' },
  { value: '24', label: '24px' },
  { value: '26', label: '26px' },
  { value: '28', label: '28px' },
  { value: '30', label: '30px' },
  { value: '32', label: '32px' },
  { value: '34', label: '34px' },
  { value: '36', label: '36px' },
];

export const CODE_FONT_FAMILIES = [
  { value: 'system-mono',     label: 'System Mono (default)' },
  { value: 'jetbrains-mono',  label: 'JetBrains Mono' },
  { value: 'fira-code',       label: 'Fira Code' },
  { value: 'source-code-pro', label: 'Source Code Pro' },
  { value: 'ibm-plex-mono',   label: 'IBM Plex Mono' },
  { value: 'inconsolata',     label: 'Inconsolata' },
];

export const PROSE_FONT_FAMILIES = [
  { value: 'auto',         label: 'Default (system UI)' },
  { value: 'system-sans',  label: 'System Sans-serif' },
  { value: 'system-serif', label: 'System Serif' },
  { value: 'cinzel',       label: 'Cinzel (decorative)' },
  { value: 'system-mono',  label: 'Monospace' },
];

export const CODE_FONT_FAMILY_MAP = {
  'system-mono':     'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  'jetbrains-mono':  '"JetBrains Mono", monospace',
  'fira-code':       '"Fira Code", monospace',
  'source-code-pro': '"Source Code Pro", monospace',
  'ibm-plex-mono':   '"IBM Plex Mono", monospace',
  'inconsolata':     '"Inconsolata", monospace',
};
