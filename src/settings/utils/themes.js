// utils/themes.js
// Single source of truth for all editor/REPL themes.
// Previously split across EDITOR_THEMES (dots) and AS_SYNTAX_THEMES (colors).
// Adding a new theme = one entry here.

export const EDITOR_THEMES = [
  {
    key:  'obsidian-code', name: 'Obsidian Code', dot: '#0B1020', mode: 'dark',
    desc: 'Deep obsidian base with crisp cool accents (premium, low-glare).',
    colors: {
      codeBg:'#0B1020', codeFg:'#E8EEF5', gutterBg:'#0A0F1D', gutterFg:'#6E7A90',
      panelBg:'#111827', panelBorder:'#273246', selection:'#2A3A67', linehl:'#101A34', caret:'#FFD166',
      comment:'#7E8AA5', keyword:'#A78BFA', string:'#7EE2A8', number:'#F5D68A',
      function:'#4FB0FF', type:'#34D399', variable:'#E8EEF5', builtin:'#FF5DA2', operator:'#C9D2DE', punct:'#9FB0C7',
    },
  },
  {
    key:  'midnight-terminal', name: 'Midnight Terminal', dot: '#0D0B1A', mode: 'dark',
    desc: 'Terminal-inspired midnight palette with strong violet keywords.',
    colors: {
      codeBg:'#070812', codeFg:'#ECEBFF', gutterBg:'#060610', gutterFg:'#7E7AAE',
      panelBg:'#111027', panelBorder:'#2B2A55', selection:'#2A1F59', linehl:'#141032', caret:'#B9A2FF',
      comment:'#8A86B8', keyword:'#B9A2FF', string:'#7EE2A8', number:'#F7D99A',
      function:'#7DD3FC', type:'#34D399', variable:'#ECEBFF', builtin:'#FF5DA2', operator:'#C3C1E6', punct:'#A6A4D0',
    },
  },
  {
    key:  'carbon-ink', name: 'Carbon Ink', dot: '#141414', mode: 'dark',
    desc: 'Neutral carbon blacks with ink-bright accents and restrained saturation.',
    colors: {
      codeBg:'#0A0A0B', codeFg:'#F3F1EC', gutterBg:'#080808', gutterFg:'#8B8579',
      panelBg:'#151516', panelBorder:'#2E2D2A', selection:'#2C2517', linehl:'#151312', caret:'#D9C07C',
      comment:'#8B8579', keyword:'#D9C07C', string:'#86E7B0', number:'#F7D99A',
      function:'#9AE6FF', type:'#34D399', variable:'#F3F1EC', builtin:'#FF7AA2', operator:'#C8C3B8', punct:'#B6B0A5',
    },
  },
  {
    key:  'graphite-neon', name: 'Graphite Neon', dot: '#1A1A2E', mode: 'dark',
    desc: 'Graphite base with neon-forward accents (great for long sessions).',
    colors: {
      codeBg:'#0B0F14', codeFg:'#F2F4F7', gutterBg:'#0A0D12', gutterFg:'#8793A2',
      panelBg:'#1A1D22', panelBorder:'#2D3442', selection:'#1D2B3A', linehl:'#121A22', caret:'#34D399',
      comment:'#8793A2', keyword:'#60A5FA', string:'#34D399', number:'#F5D68A',
      function:'#FF5DA2', type:'#A7F3D0', variable:'#F2F4F7', builtin:'#7DD3FC', operator:'#C7D0DD', punct:'#9FB0C7',
    },
  },
  {
    key:  'aurora-nightfall', name: 'Aurora Nightfall', dot: '#0F1B2D', mode: 'dark',
    desc: 'Aurora accents over nightfall navy — vivid but still premium.',
    colors: {
      codeBg:'#06111A', codeFg:'#EAF2FB', gutterBg:'#050E15', gutterFg:'#7B8CA3',
      panelBg:'#0C1C28', panelBorder:'#1F3344', selection:'#0F2E3F', linehl:'#071A24', caret:'#7EE2A8',
      comment:'#7B8CA3', keyword:'#7DD3FC', string:'#7EE2A8', number:'#FFD7A8',
      function:'#A78BFA', type:'#34D399', variable:'#EAF2FB', builtin:'#FF5DA2', operator:'#C7D0DD', punct:'#A3B6CC',
    },
  },
  {
    key:  'porcelain-codebook', name: 'Porcelain Codebook', dot: '#F5F3EE', mode: 'light',
    desc: 'Porcelain editor surface with clean, editorial color decisions.',
    colors: {
      codeBg:'#FBFCFE', codeFg:'#0F172A', gutterBg:'#F1F5F9', gutterFg:'#64748B',
      panelBg:'#FFFFFF', panelBorder:'#E2E8F0', selection:'#C7D2FE', linehl:'#EEF2FF', caret:'#2563EB',
      comment:'#64748B', keyword:'#7C3AED', string:'#0F766E', number:'#B45309',
      function:'#2563EB', type:'#0F766E', variable:'#0F172A', builtin:'#DB2777', operator:'#334155', punct:'#475569',
    },
  },
  {
    key:  'ivory-syntax', name: 'Ivory Syntax', dot: '#F7F5F0', mode: 'light',
    desc: 'Warm ivory base; refined contrast with soft but legible accents.',
    colors: {
      codeBg:'#FFFDF8', codeFg:'#111827', gutterBg:'#F3EFE6', gutterFg:'#6B7280',
      panelBg:'#FFFFFF', panelBorder:'#E5E1D6', selection:'#BFDBFE', linehl:'#F1F5F9', caret:'#1F3A5F',
      comment:'#6B7280', keyword:'#1F3A5F', string:'#0F766E', number:'#B45309',
      function:'#2563EB', type:'#0F766E', variable:'#111827', builtin:'#C026D3', operator:'#374151', punct:'#4B5563',
    },
  },
  {
    key:  'champagne-console', name: 'Champagne Console', dot: '#F6F0E8', mode: 'light',
    desc: 'Champagne-tinted light theme with confident, muted sophistication.',
    colors: {
      codeBg:'#FFFAF3', codeFg:'#1F2937', gutterBg:'#F3ECE2', gutterFg:'#6B7280',
      panelBg:'#FFFFFF', panelBorder:'#E9DCCF', selection:'#FDE68A', linehl:'#FFF7ED', caret:'#7C2D43',
      comment:'#6B7280', keyword:'#7C2D43', string:'#0F766E', number:'#92400E',
      function:'#1D4ED8', type:'#0F766E', variable:'#1F2937', builtin:'#BE185D', operator:'#374151', punct:'#4B5563',
    },
  },
  {
    key:  'slate-studio', name: 'Slate Studio', dot: '#E9EEF4', mode: 'mid',
    desc: 'Mid-tone slate base (neither stark dark nor bright light).',
    colors: {
      codeBg:'#1B2431', codeFg:'#E6EEF8', gutterBg:'#18202B', gutterFg:'#8AA0B6',
      panelBg:'#232E3D', panelBorder:'#304155', selection:'#2F4A6B', linehl:'#223043', caret:'#60A5FA',
      comment:'#8AA0B6', keyword:'#60A5FA', string:'#34D399', number:'#F5D68A',
      function:'#A78BFA', type:'#A7F3D0', variable:'#E6EEF8', builtin:'#FF5DA2', operator:'#C7D0DD', punct:'#A3B6CC',
    },
  },
  {
    key:  'mist-meridian', name: 'Mist Meridian', dot: '#EFF3F8', mode: 'mid/light',
    desc: 'Mist-grey base with gentle accents; great for daytime focus.',
    colors: {
      codeBg:'#EEF2F6', codeFg:'#0F172A', gutterBg:'#E2E8F0', gutterFg:'#64748B',
      panelBg:'#F7FAFD', panelBorder:'#CBD5E1', selection:'#A7F3D0', linehl:'#E6F4EF', caret:'#10B981',
      comment:'#64748B', keyword:'#0F2A43', string:'#0F766E', number:'#92400E',
      function:'#2563EB', type:'#0F766E', variable:'#0F172A', builtin:'#DB2777', operator:'#334155', punct:'#475569',
    },
  },
];

export function getTheme(key) {
  return EDITOR_THEMES.find(t => t.key === key) || EDITOR_THEMES[0];
}
