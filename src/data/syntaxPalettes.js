// Per-syntax-theme color palettes. Mirrors AS_SYNTAX_THEMES in
// public/account-settings.js so the editor page renders the same colors that
// the Settings → Appearance preview shows.
//
// Each entry maps to CSS custom properties (--syn-*) that the editor + REPL
// stylesheets consume to colorize Ace tokens and the REPL output panel.

export const SYNTAX_PALETTES = {
  'obsidian-code': {
    codeBg:'#0B1020', codeFg:'#E8EEF5',
    gutterBg:'#0A0F1D', gutterFg:'#6E7A90',
    panelBg:'#111827', panelBorder:'#273246',
    selection:'#2A3A67', linehl:'#101A34', caret:'#FFD166',
    comment:'#7E8AA5', keyword:'#A78BFA', string:'#7EE2A8', number:'#F5D68A',
    function:'#4FB0FF', type:'#34D399', variable:'#E8EEF5', builtin:'#FF5DA2',
    operator:'#C9D2DE', punct:'#9FB0C7',
  },
  'midnight-terminal': {
    codeBg:'#070812', codeFg:'#ECEBFF',
    gutterBg:'#060610', gutterFg:'#7E7AAE',
    panelBg:'#111027', panelBorder:'#2B2A55',
    selection:'#2A1F59', linehl:'#141032', caret:'#B9A2FF',
    comment:'#8A86B8', keyword:'#B9A2FF', string:'#7EE2A8', number:'#F7D99A',
    function:'#7DD3FC', type:'#34D399', variable:'#ECEBFF', builtin:'#FF5DA2',
    operator:'#C3C1E6', punct:'#A6A4D0',
  },
  'carbon-ink': {
    codeBg:'#0A0A0B', codeFg:'#F3F1EC',
    gutterBg:'#080808', gutterFg:'#8B8579',
    panelBg:'#151516', panelBorder:'#2E2D2A',
    selection:'#2C2517', linehl:'#151312', caret:'#D9C07C',
    comment:'#8B8579', keyword:'#D9C07C', string:'#86E7B0', number:'#F7D99A',
    function:'#9AE6FF', type:'#34D399', variable:'#F3F1EC', builtin:'#FF7AA2',
    operator:'#C8C3B8', punct:'#B6B0A5',
  },
  'graphite-neon': {
    codeBg:'#0B0F14', codeFg:'#F2F4F7',
    gutterBg:'#0A0D12', gutterFg:'#8793A2',
    panelBg:'#1A1D22', panelBorder:'#2D3442',
    selection:'#1D2B3A', linehl:'#121A22', caret:'#34D399',
    comment:'#8793A2', keyword:'#60A5FA', string:'#34D399', number:'#F5D68A',
    function:'#FF5DA2', type:'#A7F3D0', variable:'#F2F4F7', builtin:'#7DD3FC',
    operator:'#C7D0DD', punct:'#9FB0C7',
  },
  'aurora-nightfall': {
    codeBg:'#06111A', codeFg:'#EAF2FB',
    gutterBg:'#050E15', gutterFg:'#7B8CA3',
    panelBg:'#0C1C28', panelBorder:'#1F3344',
    selection:'#0F2E3F', linehl:'#071A24', caret:'#7EE2A8',
    comment:'#7B8CA3', keyword:'#7DD3FC', string:'#7EE2A8', number:'#FFD7A8',
    function:'#A78BFA', type:'#34D399', variable:'#EAF2FB', builtin:'#FF5DA2',
    operator:'#C7D0DD', punct:'#A3B6CC',
  },
  'porcelain-codebook': {
    codeBg:'#FBFCFE', codeFg:'#0F172A',
    gutterBg:'#F1F5F9', gutterFg:'#64748B',
    panelBg:'#FFFFFF', panelBorder:'#E2E8F0',
    selection:'#C7D2FE', linehl:'#EEF2FF', caret:'#2563EB',
    comment:'#64748B', keyword:'#7C3AED', string:'#0F766E', number:'#B45309',
    function:'#2563EB', type:'#0F766E', variable:'#0F172A', builtin:'#DB2777',
    operator:'#334155', punct:'#475569',
  },
  'ivory-syntax': {
    codeBg:'#FFFDF8', codeFg:'#111827',
    gutterBg:'#F3EFE6', gutterFg:'#6B7280',
    panelBg:'#FFFFFF', panelBorder:'#E5E1D6',
    selection:'#BFDBFE', linehl:'#F1F5F9', caret:'#1F3A5F',
    comment:'#6B7280', keyword:'#1F3A5F', string:'#0F766E', number:'#B45309',
    function:'#2563EB', type:'#0F766E', variable:'#111827', builtin:'#C026D3',
    operator:'#374151', punct:'#4B5563',
  },
  'champagne-console': {
    codeBg:'#FFFAF3', codeFg:'#1F2937',
    gutterBg:'#F3ECE2', gutterFg:'#6B7280',
    panelBg:'#FFFFFF', panelBorder:'#E9DCCF',
    selection:'#FDE68A', linehl:'#FFF7ED', caret:'#7C2D43',
    comment:'#6B7280', keyword:'#7C2D43', string:'#0F766E', number:'#92400E',
    function:'#1D4ED8', type:'#0F766E', variable:'#1F2937', builtin:'#BE185D',
    operator:'#374151', punct:'#4B5563',
  },
  'slate-studio': {
    codeBg:'#1B2431', codeFg:'#E6EEF8',
    gutterBg:'#18202B', gutterFg:'#8AA0B6',
    panelBg:'#232E3D', panelBorder:'#304155',
    selection:'#2F4A6B', linehl:'#223043', caret:'#60A5FA',
    comment:'#8AA0B6', keyword:'#60A5FA', string:'#34D399', number:'#F5D68A',
    function:'#A78BFA', type:'#A7F3D0', variable:'#E6EEF8', builtin:'#FF5DA2',
    operator:'#C7D0DD', punct:'#A3B6CC',
  },
  'mist-meridian': {
    codeBg:'#EEF2F6', codeFg:'#0F172A',
    gutterBg:'#E2E8F0', gutterFg:'#64748B',
    panelBg:'#F7FAFD', panelBorder:'#CBD5E1',
    selection:'#A7F3D0', linehl:'#E6F4EF', caret:'#10B981',
    comment:'#64748B', keyword:'#0F2A43', string:'#0F766E', number:'#92400E',
    function:'#2563EB', type:'#0F766E', variable:'#0F172A', builtin:'#DB2777',
    operator:'#334155', punct:'#475569',
  },
};

// Apply a palette as `--syn-*` CSS variables (code editor scope only).
export function applyEditorSyntaxPalette(element, themeKey) {
  if (!element) return;
  const c = SYNTAX_PALETTES[themeKey] || SYNTAX_PALETTES['obsidian-code'];
  const s = element.style;
  const set = (k, v) => s.setProperty(k, v);

  set('--syn-bg',         c.codeBg);
  set('--syn-fg',         c.codeFg);
  // Aliases — older editor.css uses `--syn-code-bg` / `--syn-code-fg` /
  // `--syn-panel-bg` / `--syn-panel-border`. Setting both names keeps any
  // legacy rules in sync with the active palette.
  set('--syn-code-bg',     c.codeBg);
  set('--syn-code-fg',     c.codeFg);
  set('--syn-panel-bg',    c.panelBg);
  set('--syn-panel-border',c.panelBorder);
  set('--syn-gutter-bg',  c.gutterBg);
  set('--syn-gutter-fg',  c.gutterFg);
  set('--syn-selection',  c.selection);
  set('--syn-linehl',     c.linehl);
  set('--syn-caret',      c.caret);
  set('--syn-comment',    c.comment);
  set('--syn-keyword',    c.keyword);
  set('--syn-string',     c.string);
  set('--syn-number',     c.number);
  set('--syn-function',   c.function);
  set('--syn-type',       c.type);
  set('--syn-variable',   c.variable);
  set('--syn-builtin',    c.builtin);
  set('--syn-operator',   c.operator);
  set('--syn-punct',      c.punct);
}

// Apply a palette as `--repl-syn-*` CSS variables (REPL scope only). Kept
// independent so the editor's syntax theme cannot bleed into the REPL panel.
// Mirrors applyEditorSyntaxPalette but in the REPL namespace, including
// token-level colors used by the Ace overrides for the REPL input editor.
export function applyReplSyntaxPalette(element, themeKey) {
  if (!element) return;
  const c = SYNTAX_PALETTES[themeKey] || SYNTAX_PALETTES['obsidian-code'];
  const s = element.style;
  const set = (k, v) => s.setProperty(k, v);

  set('--repl-syn-bg',         c.codeBg);
  set('--repl-syn-fg',         c.codeFg);
  set('--repl-syn-code-bg',    c.codeBg);
  set('--repl-syn-code-fg',    c.codeFg);
  set('--repl-syn-panel-bg',   c.panelBg);
  set('--repl-syn-border',     c.panelBorder);
  set('--repl-syn-gutter-bg',  c.gutterBg);
  set('--repl-syn-gutter-fg',  c.gutterFg);
  set('--repl-syn-selection',  c.selection);
  set('--repl-syn-linehl',     c.linehl);
  set('--repl-syn-caret',      c.caret);
  set('--repl-syn-comment',    c.comment);
  set('--repl-syn-keyword',    c.keyword);
  set('--repl-syn-string',     c.string);
  set('--repl-syn-number',     c.number);
  set('--repl-syn-function',   c.function);
  set('--repl-syn-type',       c.type);
  set('--repl-syn-variable',   c.variable);
  set('--repl-syn-builtin',    c.builtin);
  set('--repl-syn-operator',   c.operator);
  set('--repl-syn-punct',      c.punct);
}
