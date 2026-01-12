import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'diego.menendez@xpdglobal.com';
const TEST_PASSWORD = 'Yali.202';

test.describe('UX/UI Visual QA Audit', () => {

    test.beforeEach(async ({ page }) => {
        // Login before each test to reach the core UI
        await page.goto('/login');
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button:has-text("Iniciar Sesión")');
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    });

    test('Visual Audit: Dashboard Layout & Hierarchy', async ({ page }) => {
        // Check main container
        const main = page.locator('main');
        await expect(main).toBeVisible();

        // Take screenshot for visual inspection
        await page.screenshot({ path: 'tests/results/ux_visual_dashboard.png', fullPage: true });

        // Verify FAB (Floating Action Button) positioning and size
        const fab = page.getByLabel('Agregar Gasto', { exact: false });
        await expect(fab).toBeVisible();
        const box = await fab.boundingBox();
        if (box) {
            expect(box.width).toBeGreaterThanOrEqual(44); // Minimum tactile target
            expect(box.height).toBeGreaterThanOrEqual(44);
        }
    });

    test('Visual Audit: Navigation Consistency (TabBar)', async ({ page }) => {
        // TabBar buttons use aria-label
        await page.getByLabel('Plan', { exact: true }).click();
        await expect(page.locator('h1, h2').filter({ hasText: /Plan/i }).first()).toBeVisible();
        await page.screenshot({ path: 'tests/results/ux_visual_planning.png' });

        await page.getByLabel('Inicio', { exact: true }).click();
        await expect(page.locator('h1, h2').filter({ hasText: /Hola/i }).first()).toBeVisible();
    });

    test('Visual Audit: Dark/Light Mode Coherence', async ({ page }) => {
        // Assuming there's a theme toggle in Profile
        await page.goto('/profile');
        const themeToggle = page.locator('button:has-text("Tema"), button:has-text("Modo")');

        if (await themeToggle.count() > 0) {
            await themeToggle.click();
            await page.waitForTimeout(500); // Wait for transition
            await page.screenshot({ path: 'tests/results/ux_visual_theme_toggled.png' });
        }
    });

    test('Visual Audit: Empty States & Skeletons', async ({ page }) => {
        // We might need a fresh account for true empty states, 
        // but we can check if current views handle "no data" gracefully if we filter or find an empty section.

        // Check for "No hay movimientos" or similar in History if empty (or simulate it)
        await page.goto('/history');
        const emptyState = page.locator('text=No hay movimientos, No se encontraron transacciones');
        if (await emptyState.count() > 0) {
            await expect(emptyState).toBeVisible();
            await page.screenshot({ path: 'tests/results/ux_visual_empty_history.png' });
        }
    });

    test('Visual Audit: Interaction Feedback (Modals)', async ({ page }) => {
        await page.getByLabel('Agregar Gasto', { exact: false }).click();

        const modal = page.getByRole('dialog');
        await expect(modal).toBeVisible();

        // Check modal centering and padding
        await page.screenshot({ path: 'tests/results/ux_visual_modal_add.png' });

        // Verify "Magia" button consistency (Case insensitive)
        const magicBtn = page.getByRole('button', { name: /Magia/i });
        if (await magicBtn.count() > 0) {
            await expect(magicBtn).toBeVisible();
        }
    });

    test('Visual Audit: Cross-Platform Feel (Mobile vs Tablet)', async ({ page }) => {
        // Mobile Viewport (iPhone 13-ish)
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: 'tests/results/ux_visual_mobile_iphone.png' });

        // Check if TabBar is sticky at bottom
        const tabBar = page.locator('div.fixed.bottom-0');
        await expect(tabBar).toBeVisible();

        // Small Tablet Viewport
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.screenshot({ path: 'tests/results/ux_visual_tablet.png' });
    });
});
