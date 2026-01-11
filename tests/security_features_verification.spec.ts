import { test, expect } from '@playwright/test';

test.describe('Security Implementation Verification', () => {

    test.setTimeout(120000);

    const EMAIL = 'diego.menendez@xpdglobal.com';
    const PASSWORD = 'Yali.202';

    test('Verification of Export and Delete UI in AuthScreen', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', EMAIL);
        await page.fill('input[type="password"]', PASSWORD);
        await page.click('button:text("Iniciar Sesión")');

        // Navigate to Profile/Auth via Dashboard
        await page.click('button[aria-label="Perfil de usuario e inicio de sesión"]');
        await page.waitForTimeout(1000); // Wait for modal animation

        // Check for Export button
        const exportBtn = page.locator('button:has-text("Exportar")');
        await expect(exportBtn).toBeVisible();
        console.log("SUCCESS: Export button is visible.");

        // Check for Delete button
        const deleteBtn = page.locator('button:has-text("Eliminar mi cuenta")');
        await expect(deleteBtn).toBeVisible();
        console.log("SUCCESS: Delete button is visible.");

        // Check for Confirmation Logic
        await deleteBtn.click();
        await page.waitForTimeout(500);
        await expect(page.locator('text=Esta acción es permanente')).toBeVisible();
        await expect(page.locator('button:has-text("Sí, borrar todo")')).toBeVisible();
        console.log("SUCCESS: Delete confirmation UI is working.");

        // Cancel deletion for now to keep the account
        await page.click('button:has-text("Cancelar")');
        await expect(page.locator('text=Eliminar mi cuenta y datos')).toBeVisible();
        console.log("SUCCESS: Cancel button works.");
    });

});
