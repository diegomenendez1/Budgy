import { test, expect } from '@playwright/test';

test.describe('Anxious User Persona - Experience Test', () => {

    test('Onboarding Flow: Clarity and Friction', async ({ page }) => {
        // Ensure a clean slate: Clear all storage
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.context().clearCookies();

        // Generate a random email to ensure a clean slate
        const randomPrefix = Math.random().toString(36).substring(7);
        const testEmail = `anxious_${randomPrefix}@test.com`;
        const testPassword = 'Password123!';

        await page.goto('/welcome');

        // Initial impressions - Using a more robust locator
        const heading = page.getByRole('heading', { level: 1 });
        await expect(heading).toBeVisible({ timeout: 10000 });
        await expect(heading).toContainText(/Toma el control/i);

        // Navigate to Register
        await page.click('text=Empezar ahora');
        await expect(page).toHaveURL(/\/register/);

        // Fill registration
        await page.fill('input[placeholder="Tu nombre"]', 'Anxious User');
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.click('button:has-text("Registrarme")');

        // Step 1: Currency - Testing new simplified clarity
        await expect(page).toHaveURL(/\/onboarding/);
        await expect(page.locator('h2')).toContainText(/Hola, Anxious/);
        // Verify the new explanatory text for anxious users
        await expect(page.locator('text=Hemos seleccionado')).toBeVisible();
        await page.click('button:has-text("Continuar")');

        // Step 2: Initial Budget - Testing psychological friction
        await expect(page.locator('h2')).toContainText('Presupuesto Inicial');
        await expect(page.locator('text=No te preocupes, puedes ajustarlo luego')).toBeVisible();

        await page.fill('input[placeholder="0"]', '2000');
        await page.click('button:has-text("Siguiente")');

        // Step 3: Finish
        await expect(page.locator('text=¡Todo listo!')).toBeVisible();
        await page.click('button:has-text("Ir a mi Dashboard")');

        // Verify Dashboard Landing
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.locator('text=Disponible Real')).toBeVisible();
    });

    test('Dashboard: AI Prominence & Terminology', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'diegomenendez1@gmail.com');
        await page.fill('input[type="password"]', 'Yali.202');
        await page.click('button:has-text("Entrar")');

        await expect(page).toHaveURL(/\/dashboard/);

        // Open Transaction Modal
        await page.click('aria-label="Agregar Gasto"');

        // Verify AI Mode Prominence (New "Magia" button)
        await expect(page.locator('text=Magia')).toBeVisible();

        // Toggle Magic Mode and verify UI update
        await page.click('text=Magia');
        await expect(page.locator('text=Modo Magia')).toBeVisible();
        await page.click('text=Modo Magia'); // Toggle back

        // Verify New Terminology (Gasto Único instead of Gasto Excepcional)
        await expect(page.locator('text=Gasto Único')).toBeVisible();
        await expect(page.locator('text=No afecta tu ritmo diario')).toBeVisible();

        // Simulate Adding a Transaction
        await page.fill('input[placeholder="¿En qué gastaste?"]', 'Prueba Persona');
        await page.fill('input[placeholder="0"]', '5');
        await page.click('button:has-text("Agregar Gasto")');

        // Verify instant feedback
        await expect(page.locator('text=Prueba Persona')).toBeVisible();
    });

    test('Overspending Scenario: Emotional Guidance', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'diegomenendez1@gmail.com');
        await page.fill('input[type="password"]', 'Yali.202');
        await page.click('button:has-text("Entrar")');

        // Add a large expense to trigger overspending alert
        await page.click('aria-label="Agregar Gasto"');
        await page.fill('input[placeholder="¿En qué gastaste?"]', 'Gasto Impulsivo');
        await page.fill('input[placeholder="0"]', '5000');
        await page.click('button:has-text("Agregar Gasto")');

        // Check for the "Ajusta el ritmo" alert (Non-judgmental coaching)
        await expect(page.locator('text=Ajusta el ritmo')).toBeVisible();
        await expect(page.locator('text=Trata de reducir gastos variables hoy')).toBeVisible();
    });

});
