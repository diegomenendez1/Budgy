import { test, expect } from '@playwright/test';

test('Simple Login Verification (Local Mode)', async ({ page }) => {
    const email = 'local.test@example.com';
    const password = 'Password123!';
    const name = 'Local Test User';

    // Capture logs
    page.on('console', msg => console.log(`BROWSER CONS: ${msg.text()}`));
    page.on('pageerror', err => console.log(`BROWSER ERR: ${err}`));

    console.log('Navigating to login...');
    await page.goto('/login');

    console.log('Seeding LocalStorage with mock user...');
    await page.evaluate(({ email, password, name }) => {
        const users = [{
            id: 'mock-user-id-123',
            email,
            password,
            full_name: name,
            created_at: new Date().toISOString()
        }];
        localStorage.setItem('budgy_users', JSON.stringify(users));
        console.log('LocalStorage seeded:', JSON.stringify(users));
    }, { email, password, name });

    console.log('Filling credentials...');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    console.log('Clicking login...');
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    console.log('Waiting for navigation to dashboard...');
    try {
        await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });
        console.log('Login SUCCESS');

        // Check session
        const session = await page.evaluate(() => localStorage.getItem('budgy_session'));
        if (!session) throw new Error("No session found in LocalStorage after login");
        console.log('Session verified in LocalStorage');

    } catch (e) {
        console.log('Login FAILED');
        console.log(`Current URL: ${page.url()}`);
        console.log(`Error: ${e}`);
        await page.screenshot({ path: 'login_failure_local.png' });
        throw e;
    }
});
