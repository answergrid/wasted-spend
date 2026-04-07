---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use when building web components, pages, dashboards, or any UI. Avoids generic AI aesthetics.
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics.

## Design Thinking

Before coding, commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme — brutally minimal, retro-futuristic, luxury/refined, editorial/magazine, brutalist/raw, industrial/utilitarian
- **Differentiation**: What makes this UNFORGETTABLE?

CRITICAL: Choose a clear conceptual direction and execute it with precision.

## Wasted Spend Aesthetic Direction

This product is a financial tool for Google Ads professionals.
The aesthetic should feel: precise, data-native, trustworthy, dark-first.
Reference products: Linear, Stripe, Vercel dashboard.

Specific rules for Wasted Spend:
- Primary font: NOT Inter — use DM Sans, Geist, or Syne for headings
- Background: #0a0f1a (deeper than slate-950)
- Accent: #0d9f6e (our specific green — not Tailwind emerald-500)
- Data values: always white or green, never amber unless warning
- Borders: rgba(255,255,255,0.06) — barely visible, creates depth without noise
- Spacing: strict 8px grid — every gap is 8, 16, 24, 32, 40, 48
- Cards: no heavy shadows — subtle border + slightly lighter bg is enough
- Buttons: primary = solid #0d9f6e, secondary = ghost with green border
- Typography scale: 11px labels, 13px body, 14px card content, 18px section heads, 32-52px hero numbers

## Frontend Aesthetics Guidelines

- **Typography**: Distinctive display/body pairings. Never Inter, Roboto, Arial. 
- **Color**: Commit to cohesive system. CSS variables for everything.
- **Motion**: CSS-only micro-interactions. One well-orchestrated page load.
- **Spatial Composition**: Generous negative space. Let the hero number breathe.
- **Backgrounds**: Depth through subtle layering, not gradients.

NEVER use: overused font families, purple gradients, predictable card grids, cookie-cutter layouts.
