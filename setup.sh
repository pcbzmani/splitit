#!/usr/bin/env bash
# SplitIt — Initial Setup Script
# Run from: e:/Projects_AI/splitit/
# Usage: bash setup.sh

set -e

echo "========================================"
echo "  SplitIt — Project Setup"
echo "========================================"

# ── 1. Create Next.js app ─────────────────────────────────────────────────────
echo ""
echo "[1/8] Creating Next.js app..."
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git

cd frontend

# ── 2. Core dependencies ──────────────────────────────────────────────────────
echo ""
echo "[2/8] Installing core dependencies..."
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  @anthropic-ai/sdk \
  ai \
  stripe \
  @stripe/stripe-js \
  zustand \
  @tanstack/react-query \
  react-hook-form \
  @hookform/resolvers \
  zod \
  next-pwa \
  currency.js \
  date-fns \
  lucide-react \
  clsx \
  tailwind-merge \
  @simplewebauthn/browser \
  @simplewebauthn/server

# ── 3. shadcn/ui init ─────────────────────────────────────────────────────────
echo ""
echo "[3/8] Initializing shadcn/ui..."
npx shadcn@latest init --defaults

# ── 4. shadcn components ──────────────────────────────────────────────────────
echo ""
echo "[4/8] Adding shadcn/ui components..."
npx shadcn@latest add \
  button input label card dialog sheet \
  form tabs avatar badge toast \
  dropdown-menu select textarea \
  separator skeleton progress \
  alert scroll-area

# ── 5. Dev / test dependencies ────────────────────────────────────────────────
echo ""
echo "[5/8] Installing dev dependencies..."
npm install -D \
  @playwright/test \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest \
  jest-environment-jsdom \
  @types/jest \
  ts-jest \
  ts-node

# ── 6. Playwright browsers ────────────────────────────────────────────────────
echo ""
echo "[6/8] Installing Playwright browsers..."
npx playwright install chromium

# ── 7. Create .env.local ──────────────────────────────────────────────────────
echo ""
echo "[7/8] Creating .env.local.example..."
cat > .env.local.example << 'EOF'
# ── Supabase ──────────────────────────────────────────────────────────────────
# Get from: https://supabase.com/dashboard → your project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ── Anthropic ─────────────────────────────────────────────────────────────────
# Get from: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-...

# ── Stripe ────────────────────────────────────────────────────────────────────
# Get from: https://dashboard.stripe.com/test/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create in Stripe dashboard)
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...

# ── App ───────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

cp .env.local.example .env.local
echo "  → .env.local created (fill in your keys!)"

# ── 8. Update package.json scripts ───────────────────────────────────────────
echo ""
echo "[8/8] Updating package.json scripts..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = {
  ...pkg.scripts,
  'type-check': 'tsc --noEmit',
  'test': 'jest --watchAll=false',
  'test:watch': 'jest',
  'test:e2e': 'playwright test',
  'test:agent': 'playwright test tests/e2e/agent-flows.spec.ts --headed',
  'test:e2e:ui': 'playwright test --ui',
  'test:e2e:report': 'playwright show-report'
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('  → package.json scripts updated');
"

# ── Create folder structure ───────────────────────────────────────────────────
echo ""
echo "Creating folder structure..."
mkdir -p \
  src/app/\(auth\)/login \
  src/app/\(auth\)/verify-otp \
  src/app/\(app\)/dashboard \
  src/app/\(app\)/expenses \
  src/app/\(app\)/groups \
  src/app/\(app\)/friends \
  src/app/\(app\)/settle \
  src/app/\(app\)/ai-capture \
  src/app/\(app\)/settings \
  src/app/pricing \
  src/app/feedback \
  src/app/api/ai/capture \
  src/app/api/ai/analyze \
  src/app/api/webhooks/stripe \
  src/app/api/currency \
  src/components/ui \
  src/components/auth \
  src/components/expenses \
  src/components/split \
  src/components/ai \
  src/components/layout \
  src/lib/supabase \
  src/lib/validators \
  src/hooks \
  src/stores \
  src/types \
  supabase/migrations \
  tests/e2e \
  tests/unit

echo "  → Directory structure created"

echo ""
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Fill in .env.local with your API keys"
echo "  2. Create a Supabase project at https://supabase.com"
echo "  3. Run: cd frontend && npm run dev"
echo ""
echo "Services to set up:"
echo "  • Supabase:   https://supabase.com/dashboard"
echo "  • Anthropic:  https://console.anthropic.com"
echo "  • Stripe:     https://dashboard.stripe.com"
echo "  • Vercel:     https://vercel.com (deploy later)"
echo ""
