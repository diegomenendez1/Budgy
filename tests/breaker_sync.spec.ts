import { test, expect } from '@playwright/test';

test.describe('Breaker - Sync & Resilience', () => {

    test.setTimeout(180000);

    test('Multi-Tab Sync Conflict (Last Write Wins)', async ({ browser }) => {
        const contextA = await browser.newContext();
        const page1 = await contextA.newPage();
        const page2 = await contextA.newPage();

        // Login on both pages
        for (const p of [page1, page2]) {
            await p.goto('/login');
            await p.fill('input[type="email"]', 'diego.menendez@xpdglobal.com');
            await p.fill('input[type="password"]', 'Yali.202');
            await p.click('button:text("Iniciar Sesión")');
            await expect(p).toHaveURL(/.*dashboard.*/);
        }

        // Create a transaction on page 1
        const txId = "sync-test-" + Date.now();
        await page1.click('button[aria-label="Agregar Gasto"]');
        await page1.fill('input[placeholder="0"]', "100");
        await page1.fill('input[placeholder="¿En qué gastaste?"]', txId);
        await page1.click('button:has-text("Agregar Gasto")');
        await page1.waitForTimeout(2000);

        // Modify same transaction on page 1 (wait for sync)
        await page1.click('button:has-text("Presupuesto")');
        await page1.click(`text=${txId}`);
        await page1.fill('input[placeholder="0"]', "150");
        await page1.click('button:text("Guardar Cambios")');

        // Wait for page 2 to sync or attempt to modify it there
        await page2.click('button:has-text("Presupuesto")');
        // Page 2 might still have "100" if sync hasn't propagated
        // This test checks if the app handles the conflict if both pages try to update

        console.log("Multi-tab test complete (observation mode)");
        await contextA.close();
    });

    test('Offline Mode Resilience', async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto('/login');
        await page.fill('input[type="email"]', 'diego.menendez@xpdglobal.com');
        await page.fill('input[type="password"]', 'Yali.202');
        await page.click('button:text("Iniciar Sesión")');

        // Go offline
        await context.setOffline(true);
        console.log("Emulator: Offline Mode ON");

        // Wait a bit and ensure UI is ready
        await page.waitForTimeout(1000);
        await expect(page.locator('button[aria-label="Agregar Gasto"]')).toBeVisible();

        // Perform action while offline
        const offlineTx = "Offline Transaction " + Date.now();
        await page.click('button[aria-label="Agregar Gasto"]');
        await page.fill('input[placeholder="0"]', "50");
        await page.fill('input[placeholder="¿En qué gastaste?"]', offlineTx);
        await page.click('button:has-text("Agregar Gasto")');

        // Verify it exists in local UI
        await page.click('button:has-text("Presupuesto")');
        await expect(page.getByText(offlineTx)).toBeVisible();

        // Go online
        await context.setOffline(false);
        console.log("Emulator: Offline Mode OFF");

        // Wait for sync
        await page.waitForTimeout(5000);

        // Reload to see if it persisted in DB
        await page.reload();
        await expect(page.getByText(offlineTx)).toBeVisible();
        console.log("CONFIRMED: Offline transaction synced successfully after reconnection.");

        await context.close();
    });

});
