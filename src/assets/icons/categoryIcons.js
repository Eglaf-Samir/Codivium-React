// icons/categoryIcons.js
// SVG path data keyed by normalised category name.
// Used by ExerciseCard to render the category icon.

export const CATEGORY_PATHS = {
  'arrays':              '<path d="M4 4h7v7H4V4Z M13 4h7v7h-7V4Z M4 13h7v7H4v-7Z M13 13h7v7h-7v-7Z" stroke="currentColor" stroke-linejoin="round" stroke-width="2.4"/>',
  'strings':             '<path d="M10.2 13.8l-1.4 1.4a4.5 4.5 0 1 1-6.4-6.4l1.4-1.4M13.8 10.2l1.4-1.4a4.5 4.5 0 1 1 6.4 6.4l-1.4 1.4M9.8 14.2l4.4-4.4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.6"/>',
  'linked lists':        '<path d="M5 12m-2 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0M9 12h4M19 12m-2 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0M13 12h4" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
  'linked-lists':        '<path d="M5 12m-2 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0M9 12h4M19 12m-2 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0M13 12h4" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
  'stacks':              '<path d="M12 3l9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16.5l9 5 9-5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4"/>',
  'queues':              '<path d="M3 8h18M3 12h14M3 16h10M17 12l4 4-4 4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
  'hash tables':         '<path d="M4 4h16v4H4zM4 10h16v4H4zM4 16h16v4H4zM9 4v16M15 4v16" stroke="currentColor" stroke-linejoin="round" stroke-width="2.2"/>',
  'hash-tables':         '<path d="M4 4h16v4H4zM4 10h16v4H4zM4 16h16v4H4zM9 4v16M15 4v16" stroke="currentColor" stroke-linejoin="round" stroke-width="2.2"/>',
  'trees':               '<path d="M12 3v4M5 10h14M5 10v4M19 10v4M12 10v4M3 17h5M10 17h4M17 17h4" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
  'graphs':              '<circle cx="5" cy="12" r="2.4" stroke="currentColor" stroke-width="2.0"/><circle cx="12" cy="5" r="2.4" stroke="currentColor" stroke-width="2.0"/><circle cx="19" cy="12" r="2.4" stroke="currentColor" stroke-width="2.0"/><circle cx="12" cy="19" r="2.4" stroke="currentColor" stroke-width="2.0"/><path d="M7.4 10.6l3.2-3.2M14.6 6.8l2.8 3.6M17.4 13.4l-3.2 3.2M9.4 17.4l-2.8-3.6" stroke="currentColor" stroke-linecap="round" stroke-width="2.0"/>',
  'heaps':               '<path d="M12 3l9 5v8l-9 5-9-5V8l9-5ZM12 3v18M3 8l9 5 9-5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
  'tries':               '<path d="M12 3v3M12 6l-5 4M12 6l5 4M7 10v3M17 10v3M7 13l-3 4M7 13l3 4M17 13l-3 4M17 13l3 4" stroke="currentColor" stroke-linecap="round" stroke-width="2.0"/>',
  'sets':                '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" stroke-width="2.2"/><path d="M9 8a5 5 0 1 0 6.9 7" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
  'matrices':            '<path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" stroke="currentColor" stroke-linejoin="round" stroke-width="2.2"/>',
  'sorting':             '<path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" stroke-linecap="round" stroke-width="2.6"/>',
  'searching':           '<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35" stroke="currentColor" stroke-linecap="round" stroke-width="2.6"/>',
  'recursion':           '<path d="M4 12a8 8 0 0 1 8-8M20 12a8 8 0 0 1-8 8M16 4l-4 4 4 4M8 20l4-4-4-4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
  'dynamic programming': '<path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" stroke="currentColor" stroke-linejoin="round" stroke-width="2.0"/><path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01" stroke="currentColor" stroke-linecap="round" stroke-width="3.0"/>',
  'dynamic-programming': '<path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" stroke="currentColor" stroke-linejoin="round" stroke-width="2.0"/><path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01" stroke="currentColor" stroke-linecap="round" stroke-width="3.0"/>',
  'greedy algorithms':   '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
  'greedy-algorithms':   '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
  'backtracking':        '<path d="M9 14l-4-4 4-4M5 10h11a4 4 0 0 1 0 8h-1" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4"/>',
  'divide and conquer':  '<path d="M12 3v18M3 12h18" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/><path d="M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" stroke="currentColor" stroke-linecap="round" stroke-width="1.6"/>',
  'divide-and-conquer':  '<path d="M12 3v18M3 12h18" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/><path d="M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" stroke="currentColor" stroke-linecap="round" stroke-width="1.6"/>',
  'two pointers':        '<path d="M5 12h14M5 12l4-4M5 12l4 4M19 12l-4-4M19 12l-4 4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4"/>',
  'two-pointers':        '<path d="M5 12h14M5 12l4-4M5 12l4 4M19 12l-4-4M19 12l-4 4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4"/>',
  'sliding window':      '<path d="M3 6h18v12H3zM8 6v12M16 6v12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
  'sliding-window':      '<path d="M3 6h18v12H3zM8 6v12M16 6v12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
  'binary search':       '<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35M8 11h6M11 8v6" stroke="currentColor" stroke-linecap="round" stroke-width="2.4"/>',
  'binary-search':       '<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35M8 11h6M11 8v6" stroke="currentColor" stroke-linecap="round" stroke-width="2.4"/>',
  'mathematical':        '<path d="M12 6v6l4 2M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10Z" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
  'math':                '<path d="M12 6v6l4 2M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10Z" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
  'bit manipulation':    '<path d="M4 8h4M4 16h4M12 8h4M12 16h4M8 4v16M16 4v16" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
  'bit-manipulation':    '<path d="M4 8h4M4 16h4M12 8h4M12 16h4M8 4v16M16 4v16" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
  'design':              '<path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
  'intervals':           '<path d="M3 6h18M3 10h12M3 14h6M15 10v8M19 10v8M15 14h4" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
  'concurrency':         '<path d="M4 12h4M16 12h4M4 6l4 6-4 6M20 6l-4 6 4 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
  'geometry':            '<path d="M3 20l9-16 9 16H3zM12 4v16M6 14h12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>',
  'number theory':       '<path d="M8 6h.01M12 6h.01M16 6h.01M8 12h.01M12 12h.01M16 12h.01M8 18h.01M12 18h.01M16 18h.01" stroke="currentColor" stroke-linecap="round" stroke-width="3.0"/><path d="M4 4h16v16H4z" stroke="currentColor" stroke-linejoin="round" stroke-width="2.0"/>',
  '_default':            '<path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10ZM12 8v4M12 16h.01" stroke="currentColor" stroke-linecap="round" stroke-width="2.2"/>',
};

export const STATUS_ICON_PATHS = {
  completed:   '<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.6"/>',
  attempted:   '<path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-linecap="round" stroke-width="2.6"/>',
  not_started: '<path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" stroke-linecap="round" stroke-width="2.6"/>',
};

export const STATUS_CLASS = {
  completed:   'done',
  attempted:   'attempted',
  not_started: 'todo',
};

export const STATUS_LABEL = {
  completed:   'Completed',
  attempted:   'Attempted',
  not_started: 'Not started',
};

export function getCategoryPath(category) {
  const key = String(category || '').trim().toLowerCase();
  return CATEGORY_PATHS[key] || CATEGORY_PATHS['_default'];
}
