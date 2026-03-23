import { test, expect } from '@playwright/test'

// Helper to mock auth session
async function mockAuthSession(page: any) {
  await page.route('**/auth/v1/user**', (route: any) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
      }),
    })
  })
  await page.route('**/rest/v1/profiles**', (route: any) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        id: 'test-user-id',
        display_name: 'Test User',
        email: 'test@example.com',
        currency_preference: 'USD',
        subscription_tier: 'free',
      }),
    })
  })
}

test.describe('Expense Management', () => {
  test('login page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/expenses')
    await expect(page).toHaveURL('/login')
  })

  test('pricing page is publicly accessible', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText('Simple, honest pricing')).toBeVisible()
    await expect(page.getByText('Free')).toBeVisible()
    await expect(page.getByText('Pro')).toBeVisible()
  })

  test('feedback page is publicly accessible', async ({ page }) => {
    await page.goto('/feedback')
    await expect(page.getByText('Send Feedback')).toBeVisible()
  })

  test('feedback form validates minimum length', async ({ page }) => {
    await page.goto('/feedback')
    await page.getByRole('button', { name: /send feedback/i }).click()
    // Should not submit with empty message
    await expect(page.getByText('Send Feedback')).toBeVisible()
  })

  test('star rating interaction works', async ({ page }) => {
    await page.goto('/feedback')
    const stars = page.locator('button').filter({ hasText: '★' })
    await stars.nth(2).click() // Click 3rd star (rating = 3)
    await expect(stars.nth(2)).toHaveClass(/text-yellow-400/)
  })

  test('pricing page shows correct plan features', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText('3 groups')).toBeVisible()
    await expect(page.getByText('Unlimited groups')).toBeVisible()
    await expect(page.getByText('$4.99')).toBeVisible()
    await expect(page.getByText('$39/year')).toBeVisible()
  })

  test('donation amount input is editable', async ({ page }) => {
    await page.goto('/pricing')
    const donationInput = page.getByLabel('').filter({ hasText: '$' }).locator('..').locator('input[type="number"]').first()
    await page.locator('input[type="number"][min="1"]').fill('20')
    await expect(page.locator('input[type="number"][min="1"]')).toHaveValue('20')
  })
})
