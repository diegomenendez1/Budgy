import { test, expect } from '@playwright/test';

test('Verify Persistence of Fixed Expenses', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'diego.menendez@xpdglobal.com');
    await page.fill('input[type="password"]', 'Yali.202');
    await page.click('button:text("Iniciar Sesión")');

    // Wait for Dashboard (look for greeting "Hola" which is always present)
    await expect(page.getByText('Hola', { exact: true }).or(page.getByText('Tu Dashboard te espera'))).toBeVisible({ timeout: 15000 });

    // 2. Navigate to Planning (where Fixed Expenses are)
    // Use TabBar navigation
    await page.click('button[aria-label="Plan"]');

    // Wait for Planning page
    await expect(page.getByText('Planificación')).toBeVisible();

    // 3. Add Fixed Expense
    const expenseName = "Test Expense " + Date.now();
    // Click the "Agregar" button in the Gastos Fijos section using robust filtering
    // Verify Planning page is loaded first
    await expect(page.getByText('Ingresos Fijos')).toBeVisible();

    // Find the container that has "Gastos Fijos" and click the "Agregar" button inside it
    // Falling back to positional selector as structure is stable: 0 is Income, 1 is Expense
    await page.getByRole('button', { name: 'Agregar' }).nth(1).click();

    // 4. Fill Modal
    await expect(page.getByText('Nuevo Gasto')).toBeVisible();
    await page.fill('input[placeholder*="Descripción"]', expenseName);
    await page.fill('input[placeholder="0.00"]', "500");
    await page.click('button:text("Guardar")');

    // 5. Verify it appears
    await expect(page.getByText(expenseName)).toBeVisible();

    // 6. Reload Page to simulate sync/refresh
    await page.reload();

    // 7. Verify it persists
    // Reload sends us back to Dashboard, so we must navigate to Planning again
    await page.click('button[aria-label="Plan"]');
    await expect(page.getByText('Planificación')).toBeVisible();
    await expect(page.getByText(expenseName)).toBeVisible();
});
