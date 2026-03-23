import { test, expect, Page } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('login page renders correctly', async ({ page }) => {
    await expect(page.getByText('SplitIt')).toBeVisible()
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.getByRole('tab', { name: /email/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /phone/i })).toBeVisible()
  })

  test('email tab is active by default', async ({ page }) => {
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
  })

  test('phone tab switches input', async ({ page }) => {
    await page.getByRole('tab', { name: /phone/i }).click()
    await expect(page.getByPlaceholder('+1 555 123 4567')).toBeVisible()
  })

  test('email OTP send shows verify page', async ({ page }) => {
    // Mock Supabase auth (we can't actually send OTP in tests)
    await page.route('**/auth/v1/otp**', (route) => {
      route.fulfill({ status: 200, body: JSON.stringify({}) })
    })

    await page.fill('input[type="email"]', 'test@example.com')
    await page.getByRole('button', { name: /send otp to email/i }).click()
    await expect(page).toHaveURL('/verify-otp')
    await expect(page.getByText('Enter verification code')).toBeVisible()
  })

  test('OTP form shows 6 digit inputs', async ({ page }) => {
    // Navigate directly via store
    await page.goto('/verify-otp')
    const inputs = page.locator('input[type="text"][maxlength="1"]')
    await expect(inputs).toHaveCount(6)
  })

  test('OTP input auto-focuses next box', async ({ page }) => {
    await page.goto('/verify-otp')
    const inputs = page.locator('input[type="text"][maxlength="1"]')
    await inputs.nth(0).fill('1')
    await expect(inputs.nth(1)).toBeFocused()
  })

  test('back to login button works', async ({ page }) => {
    await page.goto('/verify-otp')
    await page.getByRole('button', { name: /back to login/i }).click()
    await expect(page).toHaveURL('/login')
  })

  test('resend button shows countdown', async ({ page }) => {
    await page.goto('/verify-otp')
    await expect(page.getByRole('button', { name: /resend in/i })).toBeVisible()
  })
})
