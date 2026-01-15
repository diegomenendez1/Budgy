import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'diego.menendez@xpdglobal.com';
const TEST_PASSWORD = 'Yali.202';

test.describe('Mobile Interaction & Dark Mode Audit', () => {

    test.beforeEach(async ({ page }) => {
        // Simulate iPhone 13
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/login');
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button:has-text("Iniciar Sesión")');
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    });

    test('Interaction: Profile Modal & Dark Mode Toggle', async ({ page }) => {
        // Open Profile
        await page.getByLabel('Perfil de usuario e inicio de sesión').click();
        const modal = page.locator('text=Perfil');
        await expect(modal).toBeVisible();

        // Verify Theme Toggle
        const themeToggle = page.getByLabel(/Cambiar a modo/i);
        await expect(themeToggle).toBeVisible();

        // Toggle to Dark Mode
        await themeToggle.click();
        await page.waitForTimeout(500);

        // Check if black background is applied (slate-950)
        const body = page.locator('html');
        await expect(body).toHaveClass(/dark/);

        await page.screenshot({ path: 'tests/results/ux_mobile_dark_mode.png' });

        // Close modal
        await page.getByLabel('Cerrar perfil').click();
        await expect(modal).not.toBeVisible();
    });

    test('Interaction: Mobile Transaction Details & Context', async ({ page }) => {
        // Add a test transaction if none exists or just click first one
        const transaction = page.locator('div[class*="bg-white"]').filter({ hasText: /\$/ }).first();
        if (await transaction.count() > 0) {
            await transaction.click();
            // Here we'd verify if a detail view or modal opens
            await page.screenshot({ path: 'tests/results/ux_mobile_transaction_click.png' });
        }
    });

    test('Interaction: Keyboard Simulation Layout', async ({ page }) => {
        await page.getByLabel('Agregar Gasto', { exact: false }).click();
        const amountInput = page.locator('input[inputMode="decimal"]');
        await amountInput.click();

        // On real devices, keyboard shifts layout. We can check if the modal is still usable.
        await page.screenshot({ path: 'tests/results/ux_mobile_keyboard_modal.png' });

        await expect(page.locator('button:has-text("Agregar Gasto")')).toBeVisible();
    });
});
