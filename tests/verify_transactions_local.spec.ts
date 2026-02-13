import { test, expect } from '@playwright/test';

test('Verify Local Transaction Creation', async ({ page }) => {
    // 1. Seed User & Login
    const email = 'trans.test@example.com';
    const password = 'Password123!';
    const name = 'Transaction Tester';

    page.on('console', msg => console.log(`BROWSER CONS: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERR: ${err}`));

    try {
        console.log('Navigating to login...');
        await page.goto('/login');

        // Seed User
        await page.evaluate(({ email, password, name }) => {
            const users = [{
                id: 'tx-tester-id',
                email,
                password,
                full_name: name,
                created_at: new Date().toISOString()
            }];
            localStorage.setItem('budgy_users', JSON.stringify(users));
        }, { email, password, name });

        // Perform Login
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard.*/);
        console.log('Login successful');

        // 2. Open Add Transaction Modal
        console.log('Opening transaction modal...');
        // Force click in case of overlay issues
        // Click "Nuevo Gasto" or "Registrar Gasto" (Empty State)
        await page.getByRole('button', { name: /Nuevo Gasto|Registrar Gasto/i }).click();

        // Wait for modal with screenshot if fails
        try {
            await page.waitForSelector('h3:has-text("Nuevo Gasto")', { state: 'visible', timeout: 5000 });
        } catch (e) {
            console.log('Modal header not found. Screenshotting...');
            await page.screenshot({ path: 'modal_failure.png', fullPage: true });
            throw e;
        }

        // 3. Fill Form
        console.log('Filling transaction form...');
        const amountInput = page.locator('input[placeholder="0"]');
        await amountInput.fill('1234');

        const descInput = page.locator('input[placeholder="¿En qué gastaste?"]');
        await descInput.fill('Prueba E2E Local');

        // Select Category 
        const categoryBtn = page.locator('button', { hasText: 'Comida' }).first();
        if (await categoryBtn.isVisible()) {
            await categoryBtn.click();
        } else {
            console.log('Comida category not found, picking first available');
            await page.locator('.flex-wrap button').nth(0).click();
        }

        // 4. Submit
        console.log('Submitting transaction...');
        await page.click('button:has-text("Confirmar Gasto")');

        // 5. Verify UI Update
        console.log('Verifying transaction in list...');
        await expect(page.locator('h3:has-text("Nuevo Gasto")')).not.toBeVisible();

        // Check dashboard list
        await expect(page.locator(`text="Prueba E2E Local"`)).toBeVisible({ timeout: 5000 });
        await expect(page.locator('body')).toContainText('1,234');

        console.log('Transaction verified in UI');

    } catch (e) {
        console.log('Test FAILED');
        console.log(`Error: ${e}`);
        require('fs').writeFileSync('error_log.txt', `Error: ${e}\nStack: ${e.stack}`);
        await page.screenshot({ path: 'transaction_test_failure.png', fullPage: true });
        throw e;
    }
});
