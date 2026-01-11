import { test, expect } from '@playwright/test';

test.describe('Breaker - Boundary & Impossible States', () => {

    test.setTimeout(180000);

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.context().clearCookies();

        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'diego.menendez@xpdglobal.com');
        await page.fill('input[type="password"]', 'Yali.202');
        await page.click('button:text("Iniciar Sesión")');

        // Wait for redirect and ensure we are on Dashboard
        await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });
        await expect(page.getByText('Hola')).toBeVisible({ timeout: 10000 });
    });

    test('1. Massive Amounts Stress Test', async ({ page }) => {
        await page.click('button[aria-label="Agregar Gasto"]');

        const massiveAmount = "999999999";
        const desc = "Stress Test Massive Amount";

        await page.fill('input[placeholder="0"]', massiveAmount);
        await page.fill('input[placeholder="¿En qué gastaste?"]', desc);
        await page.click('button:has-text("Agregar Gasto")');

        await expect(page.locator('button[aria-label="Agregar Gasto"]')).toBeVisible();

        const availableText = await page.locator('span.text-6xl').innerText();
        console.log(`Balance after massive expense: ${availableText}`);
    });

    test('2. Negative Values (Impossible State) - Should be Blocked', async ({ page }) => {
        await page.click('button[aria-label="Agregar Gasto"]');

        const negativeAmount = "-100";
        await page.fill('input[placeholder="0"]', negativeAmount);
        await page.fill('input[placeholder="¿En qué gastaste?"]', 'Negative Test');
        await page.click('button:has-text("Agregar Gasto")');

        // Modal should remain open
        await page.waitForTimeout(1000);
        const isModalOpen = await page.isVisible('button:has-text("Cancelar")');
        expect(isModalOpen).toBe(true);
        console.log("CONFIRMED: Negative amount blocked.");
    });

    test('3. Zero Amount Transaction - Should be Blocked', async ({ page }) => {
        await page.click('button[aria-label="Agregar Gasto"]');

        await page.fill('input[placeholder="0"]', "0");
        await page.fill('input[placeholder="¿En qué gastaste?"]', 'Zero Amount Test');

        const submitBtn = page.locator('button:has-text("Agregar Gasto")');
        await submitBtn.click();

        // If modal remains open, it's rejected (correct behavior)
        await page.waitForTimeout(1000);
        const isModalOpen = await page.isVisible('button:has-text("Cancelar")');
        expect(isModalOpen).toBe(true);
        console.log("CONFIRMED: Zero amount blocked.");
    });

    test('4. SQL Injection / Script Payload Rendering', async ({ page }) => {
        await page.click('button[aria-label="Agregar Gasto"]');

        const payload = "' OR 1=1; -- <script>alert(1)</script>";
        await page.fill('input[placeholder="0"]', "10");
        await page.fill('input[placeholder="¿En qué gastaste?"]', payload);
        await page.click('button:has-text("Agregar Gasto")');

        await page.waitForTimeout(2000);

        await page.click('button:has-text("Presupuesto")');
        await expect(page.getByText(payload)).toBeVisible();
    });

    test('5. Massive Category Name', async ({ page }) => {
        await page.click('button[aria-label="Agregar Gasto"]');
        await page.click('button[aria-label="Agregar nueva categoría"]');

        const massiveCat = "CAT_" + "A".repeat(50);
        await page.fill('input[placeholder="Nueva..."]', massiveCat);
        await page.keyboard.press('Enter');

        await expect(page.getByText(massiveCat)).toBeVisible();
    });

});
