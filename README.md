# SplitIt

AI-powered expense splitting app. Track daily spends, split bills with friends, and get Claude AI insights — all in a mobile-friendly PWA.

## Quick Start

```bash
# Run setup (creates Next.js app + installs all deps)
bash setup.sh

# Fill in API keys
nano frontend/.env.local

# Start dev server
cd frontend && npm run dev
```

## Docs

- [CLAUDE.md](./CLAUDE.md) — Full architecture, schema, conventions
- [SKILLS.md](./SKILLS.md) — Commands, agent flows, feature checklist

## Stack

| Layer | Tool | Cost |
|-------|------|------|
| Frontend | Next.js 14 on Vercel | Free |
| Auth + DB | Supabase | Free |
| AI | Claude (Anthropic) | Pay-per-use |
| Payments | Stripe | 2.9% + 30¢ |

## Features

- OTP login (email + SMS) + WebAuthn biometric
- Multi-currency expense tracking
- Bill splitting (equal / percentage / exact)
- AI-powered spend capture (describe in plain English)
- Subscription tiers + donations
- Playwright agent testing
