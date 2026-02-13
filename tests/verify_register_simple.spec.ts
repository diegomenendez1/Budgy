import { test, expect } from '@playwright/test';

test('Simple Register Verification', async ({ page }) => {
    // Unique user each run
    const timestamp = Date.now();
    const randomUser = `testuser_${timestamp}@example.com`;
    const password = 'Password123!';
    const name = 'Test User Local';

    // Capture console logs from the browser to debug AuthContext
    page.on('console', msg => console.log(`BROWSER CONS: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERR: ${err}`));

    console.log(`Starting test for user: ${randomUser}`);

    try {
        console.log('Navigating to register page...');
        await page.goto('/register');

        console.log('Filling registration form...');
        // Waiting for selectors to ensure page is loaded
        await page.waitForSelector('input[type="email"]');

        await page.fill('input[placeholder="Nombre completo"]', name);
        await page.fill('input[type="email"]', randomUser);
        await page.fill('input[type="password"]', password);

        console.log('Clicking register button...');
        await page.click('button:has-text("Crear Cuenta")');

        console.log('Waiting for navigation to onboarding/dashboard...');
        // Match either onboarding or dashboard, in case logic changes
        await expect(page).toHaveURL(/.*(onboarding|dashboard).*/, { timeout: 15000 });

        console.log('Registration SUCCESS - URL changed');

        // Verify session persistence (optional)
        console.log('Verifying LocalStorage...');
        const session = await page.evaluate(() => localStorage.getItem('budgy_session'));
        if (!session) throw new Error("No session found in LocalStorage after register");
        console.log('Session found in LocalStorage');

    } catch (e) {
        console.log('Registration FAILED');
        console.log(`Current URL: ${page.url()}`);
        console.log(`Error: ${e}`);
        await page.screenshot({ path: `register_failure_${timestamp}.png` });
        throw e;
    }
});
