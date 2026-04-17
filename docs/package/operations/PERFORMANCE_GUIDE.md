# Performance Guide

## Reduced motion
If the OS requests reduced motion, animations and transitions are minimized.

## Low-effects mode
You can enable a reduced-visual-effects mode to improve performance on low-end devices:

- Query param: `?cvEffects=low`
- Or programmatically: `CodiviumInsights.setEffectsMode('low')`

Low-effects mode disables heavy overlays, blur filters, and reduces chart animation.
