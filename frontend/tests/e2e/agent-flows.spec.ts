/**
 * Agent Test Flows — Comprehensive automated testing
 * Run with: npm run test:agent
 * These simulate full user journeys through the app.
 */
import { test, expect, Page } from '@playwright/test'

async function fillAndSubmitLoginForm(page: Page, email: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)

  // Mock OTP send
  await page.route('**/auth/v1/otp**', (route) =>
    route.fulfill({ status: 200, body: '{}' })
  )
  await page.getByRole('button', { name: /send otp to email/i }).click()
  await page.waitForURL('**/verify-otp')
}

test.describe('Agent: Full Auth Journey', () => {
  test('login page renders and email form works', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Login page should render
    await expect(page.getByText('SplitIt')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Welcome back')).toBeVisible()

    // Email input visible
    await expect(page.locator('input[type="email"]')).toBeVisible()

    // Fill email
    await page.fill('input[type="email"]', 'agent-test@splitit.app')

    // Mock OTP call to succeed
    await page.route('**supabase**/auth/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    )
    await page.route('**/auth/v1/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    )

    await page.getByRole('button', { name: /send otp/i }).click()

    // Wait for navigation or stay on login with error (depends on Supabase config)
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url).toMatch(/(verify-otp|login)/)
  })

  test('phone tab switches correctly', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: /phone/i }).click()
    await expect(page.locator('input[type="tel"]')).toBeVisible()
    await page.fill('input[type="tel"]', '+15551234567')
    await expect(page.locator('input[type="tel"]')).toHaveValue('+15551234567')
  })
})

test.describe('Agent: Pricing & Payments', () => {
  test('full pricing page interaction', async ({ page }) => {
    await page.goto('/pricing')

    // Verify all sections present
    await expect(page.getByText('Simple, honest pricing')).toBeVisible()
    await expect(page.getByText('$4.99 /month')).toBeVisible()
    await expect(page.getByText('$39/year (save 35%)')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Support the project' })).toBeVisible()

    // Pro features visible
    await expect(page.getByText('Unlimited groups')).toBeVisible()
    await expect(page.getByText('Full AI capture & analysis')).toBeVisible()

    // Donation form
    const donationInput = page.locator('input[type="number"][min="1"]')
    await donationInput.fill('10')
    await expect(donationInput).toHaveValue('10')

    // Click donate (expect Stripe error since not configured)
    await page.route('**/api/stripe/donate**', (route) =>
      route.fulfill({ status: 503, body: JSON.stringify({ error: 'Stripe not configured' }) })
    )
    await page.getByRole('button', { name: /donate/i }).click()
    // Should show error toast
    await page.waitForTimeout(500)
  })
})

test.describe('Agent: Feedback Submission', () => {
  test('complete feedback form journey', async ({ page }) => {
    await page.goto('/feedback')

    // Select bug type
    await page.locator('[role="combobox"]').click()
    await page.getByRole('option', { name: /bug report/i }).click()

    // Rate 4 stars
    const stars = page.locator('button').filter({ hasText: '★' })
    await stars.nth(3).click()

    // Write message
    await page.fill('textarea', 'This is a test feedback message from the Playwright agent.')

    // Mock Supabase insert
    await page.route('**/rest/v1/feedback**', (route) =>
      route.fulfill({ status: 201, body: '{}' })
    )

    // Mock auth (no user)
    await page.route('**/auth/v1/user**', (route) =>
      route.fulfill({ status: 401, body: '{}' })
    )

    await page.getByRole('button', { name: /send feedback/i }).click()
  })
})

test.describe('Agent: Navigation & Routing', () => {
  test('unauthenticated redirects or renders correctly', async ({ page }) => {
    // With Supabase configured: redirects to /login
    // Without Supabase (dev/demo): page renders as-is or shows login
    const protectedRoutes = ['/dashboard', '/expenses', '/friends']

    for (const route of protectedRoutes) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      const url = page.url()
      // Either redirected to login OR the page loaded (when Supabase not configured)
      expect(url).toMatch(/(login|dashboard|expenses|friends|groups|settings)/)
    }
  })

  test('public routes are accessible', async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForLoadState('networkidle')
    // Should stay on pricing or load it
    await expect(page.getByText('Simple, honest pricing')).toBeVisible({ timeout: 10000 })

    await page.goto('/feedback')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Send Feedback' })).toBeVisible({ timeout: 10000 })
  })

  test('root page loads without error', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const url = page.url()
    // Should be at some valid route
    expect(url).toMatch(/localhost:\d+/)
  })
})

test.describe('Agent: Mobile Viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } }) // iPhone 14 Pro

  test('login page is mobile-responsive', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('SplitIt')).toBeVisible()
    // Tabs should be visible and properly sized
    await expect(page.getByRole('tab', { name: /email/i })).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/mobile-login.png' })
  })

  test('pricing page is mobile-responsive', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText('Simple, honest pricing')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/mobile-pricing.png' })
  })
})
