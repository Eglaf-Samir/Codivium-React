# Editor / Workspace — Accessibility Test Checklist

**Version:** 1.1.0  
**Standard:** WCAG 2.1 AA  
**Policy:** Desktop-first — mobile a11y is out of scope (see EDITOR_DESIGN_SYSTEM.md)

---

## How to use this checklist

Run before each release. Check each item manually in at least one browser.
Mark with ✓ (pass), ✗ (fail), or N/A (not applicable).

---

## 1. Keyboard navigation

| Test | Expected | Notes |
|---|---|---|
| Tab through entire page | All interactive elements reachable in logical order | |
| Tab to Exercise/Hints/Tests/Tutorial tabs | Each tab receives focus | |
| Space/Enter on tab | Activates tab, shows panel | |
| Tab to Submit button | Submit button receives focus | |
| Tab to layout toggle buttons | Each wsc-btn receives focus | |
| Tab to timer toggle | Toggle receives focus | |
| Tab to splitter handles | Each splitter receives focus | |
| Arrow keys on splitter | Moves pane boundary (10px per key, 50px with Shift) | |
| Tab into settings palette | Opens if focusable, all controls reachable | |
| Escape on settings palette | Closes palette, returns focus to trigger | |
| Tab to tour button | Tour button receives focus | |
| Enter on tour button | Opens tour, focus moves to first button | |
| Tab within tour | Cycles through Back/Next/Finish/Close | |
| Escape on tour | Closes tour | |
| Tab to locked tab | Receives focus, shows tooltip on Enter | |
| Tab to Unlock Now in tooltip | Receives focus, clickable | |
| Escape on lock tooltip | Closes tooltip | |

---

## 2. Focus management

| Test | Expected |
|---|---|
| Settings palette opens | Focus moves to first control inside palette |
| Settings palette closes | Focus returns to the element that opened it |
| Tour opens | Focus moves to first button inside tour card |
| Tour closes | Focus returns to tour button |
| Lock tooltip appears | Tooltip visible and keyboard reachable |
| Lock tooltip closes | Focus returns to the locked tab |
| Exercise load error | Focus not disrupted; retry button reachable |

---

## 3. Tab panel semantics

| Test | Expected |
|---|---|
| `role="tablist"` on tab container | Present |
| `role="tab"` on each tab button | Present |
| `role="tabpanel"` on each panel | Present |
| `aria-selected="true"` on active tab | Present, updates on change |
| `aria-controls` links tab to panel | Present and correct |
| `aria-labelledby` on panels | Present and links to tab |
| `aria-disabled="true"` on locked tabs | Present on locked tabs |

---

## 4. Live regions and status messages

| Test | Expected |
|---|---|
| Submit pending state announced | `#editorStatus` has `aria-live="polite"` |
| Submit success announced | Status bar updates; screen reader reads it |
| Submit error announced | Status bar updates; screen reader reads it |
| Test results visible | `#testResults` panel appears, summary readable |
| Lock tooltip announced | Tooltip content readable when shown |
| Loading exercise announced | Status message present during fetch |

---

## 5. Dialog / modal semantics

| Test | Expected |
|---|---|
| Settings palette | `role="dialog"`, `aria-modal="true"`, `aria-label` |
| Tour card | `role="dialog"`, `aria-modal="true"`, `aria-label="Guided tour"` |
| Lock tooltip | `role="dialog"` or `role="tooltip"`, `aria-label` |
| Focus trap in palette | Tab cycles within palette; no escape to page behind |
| Focus trap in tour | Tab cycles within tour card |

---

## 6. Visible focus

| Test | Expected |
|---|---|
| All tab buttons | Gold outline ring when focused |
| All action buttons | Gold outline ring when focused |
| Splitter handles | Gold outline + subtle highlight when focused |
| Unlock Now button | Gold outline ring when focused |
| Close (✕) buttons | Gold outline ring when focused |
| CodeMirror editor | CM default focus ring (or editor shell ring) |

---

## 7. Contrast

| Element | Minimum contrast ratio required |
|---|---|
| Active tab label | 4.5:1 against pane-head background |
| Locked tab label | 3:1 (large text exception applies) |
| Submit button text | 4.5:1 |
| Status bar text (all states) | 4.5:1 |
| Splitter handle visible indicator | 3:1 |
| Gold accent on dark background | Check: `rgba(246,213,138)` on `rgba(13,15,26)` |

---

## 8. Zoom test (200%)

| Test | Expected |
|---|---|
| Page at 200% zoom | Unsupported notice shown (below 1024px logical width) OR layout still functional |
| Text visible | No text clipped or hidden |
| Buttons reachable | No overlap or inaccessible targets |

---

## 9. Screen reader smoke check (VoiceOver / NVDA)

| Test | Expected |
|---|---|
| Page loads | "Exercise Workspace" page title announced |
| Tab to first tab | Tab role and label announced |
| Activate tab | Panel content update announced |
| Submit pending | "Running tests…" announced via live region |
| Submit result | Pass/fail count announced |
| Tour open | "Guided tour, dialog" announced |
| Tour step content | Step title and body announced on navigation |

---

## 10. Unsupported viewport (A28)

| Test | Expected |
|---|---|
| Resize browser to 800px wide | "Desktop Required" notice shown |
| All page content behind notice | `visibility: hidden` on all other elements |
| Notice text readable | Sufficient contrast |
| Notice role | `role="alert"` and `aria-live="assertive"` |

---

## Known limitations

- CodeMirror 5 keyboard navigation follows CodeMirror's own a11y model — not fully audited
- REPL execution output is not announced via a live region (post-MVP fix)
- Splitter arrow-key step size (10px) may need adjustment for usability
- Colour theme picker in settings palette: colour swatches have no accessible names (future fix)
