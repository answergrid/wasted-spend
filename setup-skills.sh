#!/bin/bash
# Wasted Spend — Skills Setup Script
# Run this from your wasted-spend project root:
# cd ~/wasted-spend && bash setup-skills.sh

set -e

echo "Setting up Cursor skills for Wasted Spend..."

# 1. Create skills directory structure
mkdir -p .cursor/skills
mkdir -p .cursor/rules

echo "Created .cursor/skills and .cursor/rules directories"

# 2. Install ui-ux-pro-max-skill via their CLI
echo "Installing ui-ux-pro-max-skill..."
npx uipro-cli init --ai cursor --offline 2>/dev/null || {
  echo "CLI install failed, cloning manually..."
  git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git /tmp/ui-ux-pro-max-skill
  cp -r /tmp/ui-ux-pro-max-skill/.cursor/skills/* .cursor/skills/ 2>/dev/null || \
  cp -r /tmp/ui-ux-pro-max-skill/src/ui-ux-pro-max .cursor/skills/ui-ux-pro-max
  rm -rf /tmp/ui-ux-pro-max-skill
}

echo "ui-ux-pro-max-skill installed"

# 3. Write the frontend-design skill directly
cat > .cursor/skills/frontend-design.md << 'SKILL'
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
SKILL

echo "frontend-design skill written"

# 4. Write the updated .cursorrules file
cat > .cursorrules << 'RULES'
# Project: Wasted Spend
# wastedspend.app
# Founder constraints — always respect these

## What this product is
A self-serve SaaS tool for Google Ads advertisers.
Automated negative keyword management — finds wasted spend and blocks it.
$29/month flat subscription.
Live at wastedspend.app

## Stack
- Next.js 14, TypeScript, Tailwind
- Supabase (Postgres)
- Stripe for billing (live mode)
- Google Ads API (Basic Access pending)
- Vercel for hosting
- Resend for email

## Core business constraints
- Zero manual marketing or sales by the founder
- Grows only through organic discovery:
  * Google Ads Partner Marketplace
  * SEO for high-intent search terms
  * Word of mouth from visible results
- Fully automated — no human in the loop for value delivery
- Minimal ongoing maintenance after launch

## Build principles
- Every feature must work without founder involvement
- No features that require manual setup per customer
- Simple is always better than complex
- Automate everything that recurs
- Ship the narrowest possible v1 of any feature

## What NOT to build
- Anything requiring customer support to use
- Dashboards with no action attached
- Features that only provide insights without automation
- Anything that requires the founder to intervene per customer

## Design standard — ALWAYS APPLY
When building or updating ANY UI component, page, or visual element:

Read and apply: .cursor/skills/frontend-design.md
Read and apply: .cursor/skills/ui-ux-pro-max/ (if present)

Wasted Spend visual identity:
- Background: #0a0f1a
- Brand green: #0d9f6e
- Text primary: #e8eaf0
- Text muted: #4b5563
- Text dimmed: #374151
- Border default: rgba(255,255,255,0.06)
- Border hover: rgba(255,255,255,0.1)
- Card background: rgba(255,255,255,0.03)
- Font: Inter (current) — consider upgrading to DM Sans or Geist
- Letter spacing on headings: -0.02em to -0.03em
- All section labels: 11px, font-weight 500, letter-spacing 0.07em, uppercase, color #4b5563

Never use:
- Tailwind emerald-500 (#10b981) — use #0d9f6e instead
- bg-slate-950 — use #0a0f1a
- Heavy card borders
- Amber/yellow for data values (only for warnings)
- Bold text everywhere — use weight contrast deliberately

## Pricing
- Free: see top 3 wasted searches, one on-demand scan
- Pro ($29/mo): all searches, one-click blocking, weekly automated scans, email digest, blocked library, waste checker

## Key routes
- / — landing page
- /dashboard — main product (requires Google OAuth)
- /blog/* — SEO content
- /privacy — privacy policy
- /api/auth/google — OAuth initiation
- /api/auth/google/callback — OAuth callback
- /api/ads/search-terms — fetch wasted searches
- /api/ads/add-negative — block a search
- /api/ads/blocked-searches — fetch blocked library
- /api/ads/check-term — waste risk checker (Pro)
- /api/stripe/checkout — create checkout session
- /api/stripe/webhook — handle payment events
- /api/stripe/portal — customer portal
- /api/cron/weekly-digest — Monday email (cron)

## Supabase tables
- connected_accounts (email, access_token, refresh_token, is_paid, needs_reconnect)
- blocked_searches (account_email, search_term, cost_at_block, impressions_at_block, blocked_at, is_active)
- scan_history (account_email, total_wasted, term_count, health_score, scanned_at)
- term_checks (account_email, search_term, risk_level, reasons, checked_at)

## Environment variables (all required)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
GOOGLE_ADS_CLIENT_ID
GOOGLE_ADS_CLIENT_SECRET
GOOGLE_ADS_DEVELOPER_TOKEN
GOOGLE_ADS_CUSTOMER_ID
GOOGLE_ADS_LOGIN_CUSTOMER_ID
RESEND_API_KEY
CRON_SECRET
NEXT_PUBLIC_APP_URL=https://wastedspend.app
MOCK_MODE=true (set to false when Google API Basic Access approved)
RULES

echo ".cursorrules written"

# 5. Write a Cursor rule file for design enforcement
cat > .cursor/rules/design.mdc << 'DESIGN'
---
description: Design enforcement for Wasted Spend UI
globs: ["app/**/*.tsx", "app/**/*.css", "components/**/*.tsx"]
---

Before writing any UI code, check .cursor/skills/frontend-design.md

Wasted Spend design rules:
- Background is always #0a0f1a not bg-slate-950
- Brand green is always #0d9f6e not emerald-500 or #10b981
- Hero numbers: 48-52px, font-weight 600, letter-spacing -0.03em, color #0d9f6e
- Section labels: 11px, uppercase, letter-spacing 0.07em, color #4b5563
- Card borders: 1px solid rgba(255,255,255,0.07) — never heavier
- Never use amber/yellow for data values — only for warning states
- Buttons: primary = bg #0d9f6e text white, secondary = transparent border rgba(13,159,110,0.35) text #0d9f6e
- All spacing on a strict 8px grid
DESIGN

echo ".cursor/rules/design.mdc written"

echo ""
echo "Done. Skills installed:"
echo "  .cursor/skills/frontend-design.md"
echo "  .cursor/skills/ui-ux-pro-max/ (if install succeeded)"
echo "  .cursor/rules/design.mdc"
echo "  .cursorrules (updated)"
echo ""
echo "Cursor will now apply design standards automatically on every UI change."
