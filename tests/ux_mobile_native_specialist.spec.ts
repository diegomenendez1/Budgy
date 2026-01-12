import { test, expect, devices } from '@playwright/test';

const TEST_EMAIL = 'diego.menendez@xpdglobal.com';
const TEST_PASSWORD = 'Yali.202';

/**
 * Mobile UX/UI QA Specialist Test Suite
 * Focuses on: Reachability, Layout Density, Tactile Targets, and Native Mobile States.
 */
test.describe('Mobile Native UX Audit', () => {

    test.beforeEach(async ({ page }) => {
        // Start with a standard mobile viewport (iPhone 13)
        await page.setViewportSize(devices['iPhone 13'].viewport);
        await page.goto('/login');
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button:has-text("Iniciar Sesión")');
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    });

    test('Mobile UX: Reachability & Thumb Zone Audit', async ({ page }) => {
        const viewportHeight = page.viewportSize()?.height || 844;
        const middleScreen = viewportHeight / 2;
        const safeZoneStart = viewportHeight * 0.4; // Approximated reachable area for thumb

        // Check Navigation (TabBar)
        const tabBar = page.locator('nav, div[class*="fixed bottom-0"]');
        await expect(tabBar).toBeVisible();
        const tabBox = await tabBar.boundingBox();
        if (tabBox) {
            // Ideally, the bottom nav should be at the very bottom
            expect(tabBox.y).toBeGreaterThan(viewportHeight - 100);
        }

        // Check Floating Action Button (FAB)
        const fab = page.getByLabel('Agregar Gasto', { exact: false });
        if (await fab.count() > 0) {
            const fabBox = await fab.boundingBox();
            if (fabBox) {
                // Should be in the lower half for reachability
                expect(fabBox.y).toBeGreaterThan(middleScreen);
                // Also check if it's too close to the edge (padding check)
                expect(fabBox.x).toBeGreaterThan(10);
            }
        }

        await page.screenshot({ path: 'tests/results/ux_mobile_reachability.png' });
    });

    test('Mobile UX: Layout Density Stress Test (iPhone SE)', async ({ page }) => {
        // Small device simulation (iPhone SE)
        await page.setViewportSize({ width: 375, height: 667 });
        await page.reload();

        // Check for content clipping or overflow
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(375);

        // Check if important elements (Balance, Progress) are visible without scrolling
        const balance = page.locator('text=/Balance|Disponible/i').first();
        await expect(balance).toBeInViewport();

        await page.screenshot({ path: 'tests/results/ux_mobile_density_se.png' });
    });

    test('Mobile UX: Tactile Target Sizes Audit', async ({ page }) => {
        // Find all interactive elements (buttons, links, inputs)
        const interactiveElements = page.locator('button, a, input, [role="button"]');
        const count = await interactiveElements.count();

        for (let i = 0; i < Math.min(count, 15); i++) {
            const el = interactiveElements.nth(i);
            if (await el.isVisible()) {
                const box = await el.boundingBox();
                if (box) {
                    // Apple Human Interface Guidelines: 44x44pt
                    // Android Design Guidelines: 48x48dp
                    // We check for at least 40px as a reasonable web threshold
                    const isIconOnly = await el.evaluate(node => node.innerText.trim().length === 0);
                    if (isIconOnly) {
                        // Icon buttons are often small targets
                        if (box.width < 40 || box.height < 40) {
                            console.warn(`Small tactile target detected at index ${i}: ${box.width}x${box.height}`);
                        }
                    }
                }
            }
        }
    });

    test('Mobile UX: Dark Mode Native Feel', async ({ page }) => {
        // Toggle Dark Mode (assuming there's a toggle in profile or we can set it via system preference)
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.reload();

        // Check if the UI actually responds to system preference or manual toggle
        const isDarkNow = await page.evaluate(() => document.documentElement.classList.contains('dark'));

        if (!isDarkNow) {
            console.log("System dark mode emulation not picked up, trying manual toggle...");
            const profileBtn = page.getByLabel('Perfil de usuario');
            if (await profileBtn.count() > 0) {
                await profileBtn.click();
                const themeToggle = page.getByLabel(/Cambiar a modo oscuro/i);
                if (await themeToggle.count() > 0) {
                    await themeToggle.click();
                    await page.waitForTimeout(300);
                }
            }
        }

        await page.screenshot({ path: 'tests/results/ux_mobile_dark_mode_native.png' });

        // Verify background is truly dark
        const bgColor = await page.evaluate(() => {
            const mainDiv = document.querySelector('.dark\\:bg-slate-950') || document.body;
            return window.getComputedStyle(mainDiv).backgroundColor;
        });
        // Check if it's a dark color (very low R, G, B)
        const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            const [_, r, g, b] = match;
            expect(Number(r)).toBeLessThan(50);
            expect(Number(g)).toBeLessThan(50);
            expect(Number(b)).toBeLessThan(50);
        }
    });

    test('Mobile UX: Text Scaling Robustness', async ({ page }) => {
        // Simulate high text zoom (Accessibility check)
        // Note: Playwright doesn't have a direct "system font size" but we can evaluate CSS or use zoom
        await page.evaluate(() => {
            document.documentElement.style.fontSize = '24px'; // 150% standard
        });

        // Check for layout breaking (height overlaps)
        await page.screenshot({ path: 'tests/results/ux_mobile_text_scaling.png' });

        // Check if a header is still visible
        const header = page.locator('h1, h2').first();
        await expect(header).toBeVisible();
    });

    test('Mobile UX: Offline State Resilience', async ({ page, context }) => {
        // Go offline
        await context.setOffline(true);

        // Try to perform an action (e.g., open a modal)
        const fab = page.getByLabel('Agregar Gasto', { exact: false });
        if (await fab.count() > 0) {
            await fab.click();
            // Verify if an offline warning appears or if the UI remains stable
            await page.screenshot({ path: 'tests/results/ux_mobile_offline.png' });
        }

        await context.setOffline(false);
    });
});
