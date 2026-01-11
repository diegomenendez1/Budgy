import { test, expect } from '@playwright/test';

test.describe('Variable Income Persona - Verification', () => {

    test.setTimeout(120000);

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.context().clearCookies();
    });

    test('Owner Account: Variable Income Logic Verification', async ({ page }) => {
        // Login with owner account for reliable, isolated testing
        await page.goto('/login');
        await page.fill('input[type="email"]', 'diegomenendez1@gmail.com');
        await page.fill('input[type="password"]', 'Yali.202');
        await page.click('button:text("Iniciar Sesión")');

        await expect(page).toHaveURL(/\/dashboard/);
        await page.waitForTimeout(5000);

        const initialAvailable = await page.locator('span.text-6xl').innerText();
        const initialValue = parseFloat(initialAvailable.replace(/,/g, ''));
        console.log(`Initial Available: ${initialValue}`);

        // Add Test Income
        await page.getByRole('button', { name: 'Agregar Gasto' }).click();
        await page.waitForSelector('button:text("Ingreso")');
        await page.click('button:text("Ingreso")');

        const incomeAmount = 333;
        const incomeDesc = 'E2E Test Income';

        await page.fill('input[inputmode="decimal"]', incomeAmount.toString());
        await page.fill('input[placeholder="Venta, Regalo..."]', incomeDesc);
        await page.click('button:text("Registrar Ingreso")');

        await page.waitForTimeout(2000);
        const midAvailable = await page.locator('span.text-6xl').innerText();
        const midValue = parseFloat(midAvailable.replace(/,/g, ''));
        console.log(`After Income: ${midValue}`);

        // Assertion: Available should have increased by incomeAmount
        expect(midValue).toBe(initialValue + incomeAmount);

        console.log('TEST PASSED: Variable Income logic verified successfully.');
        // Note: Cleanup skipped intentionally. Core logic verified.
    });

});
