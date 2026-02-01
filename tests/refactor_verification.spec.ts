import { test, expect } from '@playwright/test';

test.describe('Refactor Verification', () => {
    test.beforeEach(async ({ page }) => {
        // Assuming the app runs on localhost:5173 or similar, check playwright.config.ts if needed
        // For now we use relative path '/' assuming baseURL is set
        await page.goto('/');
    });

    test('should open add transaction modal and see new form elements', async ({ page }) => {
        // Wait for hydration
        await page.waitForTimeout(2000);

        // Use robust selector
        const addButton = page.getByRole('button', { name: 'Agregar transacción' });
        await expect(addButton).toBeVisible();
        await addButton.click();

        // Verify Modal Appears
        await expect(page.getByText('Monto')).toBeVisible();

        // Check for Type Switcher
        await expect(page.getByText('Gasto', { exact: true })).toBeVisible(); // exact to avoid description confusion
        await expect(page.getByText('Ingreso', { exact: true })).toBeVisible();

        // Check for "Compra a Plazos (MSI)"
        await expect(page.getByText('Compra a Plazos (MSI)')).toBeVisible();
    });

    test('should be able to add a transaction via new form', async ({ page }) => {
        await page.waitForTimeout(1000);
        await page.locator('button.bg-black.text-white.rounded-full.shadow-2xl').click();

        // Fill Amount
        const amountInput = page.locator('input[placeholder="0"]');
        await amountInput.fill('123.45');

        // Fill Description
        const descInput = page.locator('input[placeholder="¿En qué gastaste?"]');
        await descInput.fill('Test Refactor Transaction');

        // Select Category (assuming categories are button-like)
        // Let's pick the first category button
        await page.locator('button.rounded-full.bg-gray-100').first().click();

        // Submit
        await page.getByText('Agregar Gasto').click();

        // Verify it appears in the list (TransactionList)
        await expect(page.getByText('Test Refactor Transaction')).toBeVisible();
        await expect(page.getByText('$123.45')).toBeVisible(); // Or formatted 123
    });

    test('should verify Cycle Component visibility', async ({ page }) => {
        await page.waitForTimeout(2000);
        // Use a locator that matches either case
        const cycleIndicator = page.locator('text=Dinero disponible este ciclo').or(page.locator('text=Sin Ciclo Activo'));
        await expect(cycleIndicator).toBeVisible();
    });
});
