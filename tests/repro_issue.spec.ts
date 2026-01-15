
import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'diego.menendez@xpdglobal.com';
const TEST_PASSWORD = 'Yali.202';

test.describe('Reproduction: Mobile Add Expense Issues', () => {

    test.beforeEach(async ({ page }) => {
        // Simulate iPhone 13
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/login');
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button:has-text("Iniciar Sesión")');
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    });

    test('Modal should be scrollable and accept valid amount', async ({ page }) => {
        // Open Modal
        await page.getByLabel('Agregar Gasto', { exact: false }).click();
        const modalContent = page.locator('div[role="dialog"]');
        await expect(modalContent).toBeVisible();

        // 1. Check Scrollability
        // We expect the modal to NOT have 'overflow-hidden' which allows cropping, 
        // OR explicit 'overflow-y-auto' / 'overflow-scroll'
        // For now, let's just check class list or computed style
        const overflow = await modalContent.evaluate((el) => {
            return window.getComputedStyle(el).overflowY;
        });
        console.log('Modal Overflow Y:', overflow);

        // This expectation will fail if the current code has 'overflow-hidden'
        expect(overflow).not.toBe('hidden');

        // 2. Check Validation with Valid Amount
        const amountInput = page.locator('input[inputMode="decimal"]');
        await amountInput.fill('150');

        const descInput = page.locator('input[placeholder*="gastaste"]');
        await descInput.fill('Test Expense Scroll');

        // Submit
        await page.click('button:has-text("Agregar Gasto")');

        // Expectation: Modal should close or show success
        // If it stays open, validation failed silently or blocked
        await expect(modalContent).not.toBeVisible();
    });
});
