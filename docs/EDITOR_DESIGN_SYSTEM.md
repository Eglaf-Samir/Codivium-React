# Editor / Workspace — Design System Extension

**Package version:** 1.1.0  
**Status:** Documented — enforced via `editor-page.*.css`  
**Extends:** Core Codivium shell design (base.css, sidebar.css, topbar.css)

---

## A54: Desktop Productivity Mode Policy

The exercise workspace is **explicitly desktop-first**.

| Property | Value |
|---|---|
| Minimum supported width | 1280px |
| Minimum supported height | 720px |
| Target width | 1440px–1920px |
| Mobile / tablet | Unsupported — graceful notice shown below 1024px (A28) |
| Touch targets | Not optimised — keyboard and mouse primary |
| Orientation | Landscape only (implied by width policy) |

This is a deliberate design choice, not a limitation. The workspace uses a 4-pane resizable layout that requires screen real estate to be useful. Do not attempt to make this responsive to mobile without redesigning the layout model.

---

## A51: Page-Level Design Tokens

These are the values used in `editor-page.css`. They extend (not override) the core tokens.

### Colour palette (in use)
```css
/* Primary accent — gold */
--accent:          rgba(246, 213, 138, 1.00)   /* gold — used on active/highlighted */
--accent-dim:      rgba(246, 213, 138, 0.70)   /* hover/focus rings */
--accent-muted:    rgba(246, 213, 138, 0.25)   /* borders, backgrounds */
--accent-ghost:    rgba(246, 213, 138, 0.08)   /* subtle fills */

/* Surface hierarchy */
--surface-0:       rgba(  8,  10,  18, 1.00)   /* deepest — behind everything */
--surface-1:       rgba( 13,  15,  26, 0.98)   /* stage background */
--surface-2:       rgba( 18,  21,  36, 0.98)   /* pane headers */
--surface-3:       rgba( 22,  25,  42, 0.98)   /* elevated elements */

/* Text hierarchy */
--text-primary:    rgba(245, 245, 252, 0.90)
--text-secondary:  rgba(245, 245, 252, 0.65)
--text-tertiary:   rgba(245, 245, 252, 0.40)
--text-disabled:   rgba(245, 245, 252, 0.25)
```

### Typography
```
Brand/heading:   Cinzel (wght 500–900) — used in tab labels, palette headings, tour
Code:            ui-monospace, SFMono-Regular, Menlo (or user-selected from settings)
UI:              var(--font-ui) — system stack from base.css
```

### Spacing
```
Pane header height:   42–50px
Tab bar gap:          8px
Pane inner padding:   12–16px
Control area gap:     4px (timer/wsc-btn cluster)
Splitter width:       6px (hit area), 2px (visual)
```

### Border radius
`0` everywhere — sharp corners is the intentional design language for this page.

### Motion
```
Standard transition:  160ms ease
Fast transition:      80ms ease (button press)
Slow transition:      280–320ms cubic-bezier(0.4,0,0.2,1) (tour spotlight)
prefers-reduced-motion: all transitions set to 0.01ms (see editor-page.css A31)
```

---

## A52: Interaction Language Unification

These rules ensure the workspace feels like the same product as the dashboard.

### Buttons
| Property | Value | Notes |
|---|---|---|
| Border radius | 0 | Sharp corners everywhere — matches this page's design language |
| Default state | Low opacity border + subtle fill | Same pattern as dashboard secondary buttons |
| Hover state | Border brightens | `rgba(255,255,255,0.25)` |
| Active/pressed | Dark concave gradient + inset shadow | Distinct depressed state |
| Focus | Gold outline 2px | Matches dashboard focus ring pattern |
| Disabled | `opacity: 0.38` | Same ratio as dashboard disabled pattern |

### Tabs
| Property | Value | Notes |
|---|---|---|
| Active | Gold underline or text brightening | Consistent with dashboard active indicator |
| Locked | `opacity: 0.38`, cursor not-allowed | Same as disabled buttons |
| Lock icon | SVG padlock inline | Positioned inline with label |
| Focus | Gold outline | Same as buttons |

### Tooltips / Popovers (lock tooltip, tour card)
| Property | Value | Notes |
|---|---|---|
| Background | Near-black gradient | `rgba(6,6,10,0.98)` → `rgba(14,14,20,0.98)` |
| Border | Gold-tinted | `rgba(246,213,138,0.28)` |
| Border radius | 0 (lock tooltip) or 0 (tour card) | Sharp corners |
| Shadow | Large drop shadow | `0 28px 70px rgba(0,0,0,0.80)` |
| Close button | ✕ top-right | Same position as palette close |
| role | dialog + aria-modal | Required for all modal popovers |

### Status messages
| State | Colour | Notes |
|---|---|---|
| Success | `rgba(120,220,120,0.90)` | Green |
| Fail | `rgba(246,213,138,0.85)` | Gold — not alarming, just informational |
| Error | `rgba(220,80,80,0.90)` | Red |
| Warning | `rgba(246,213,138,0.70)` | Muted gold |
| Running | `rgba(180,200,255,0.80)` | Cool blue |

### Visual density hierarchy (A53)
Secondary/peripheral controls (timer, layout toggles, palette trigger) are muted to `opacity: 0.65–0.75` at rest and reveal at full opacity on hover/focus. This prevents competing affordances when the user is focused on writing code.

---

## Workspace panes

| Pane | ID | Scrolls | Content type |
|---|---|---|---|
| Instructions/hints/tests/tutorial | `#paneLeft` | Yes (inner `.pane-content`) | Rendered HTML + markdown |
| Code editor | `#paneRight` | CodeMirror internal | CodeMirror instance |
| REPL input | `#paneReplIn` | CodeMirror internal | CodeMirror instance |
| REPL output | `#paneReplOut` | Yes (inner `.pane-content`) | Plain text / HTML |

---

## Lock/focus states

| State | Body class | Visual effect |
|---|---|---|
| Default layout | (none) | All panes visible |
| Code focus | `body.focus-editor` | Left pane hidden, editor maximised |
| Read focus | `body.focus-instructions` | Right pane minimised, instructions maximised |
| REPL collapsed | `body.repl-collapsed` | Bottom row hidden |
| Timer hidden | `body.timer-hidden` | Timer opacity 0 |
| Sidebar collapsed | `body.sidebar-collapsed` | Sidebar → 76px, stage shifts |
