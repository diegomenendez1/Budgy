import { test, expect } from '@playwright/test';

test.describe('Insights Module & AI Coach', () => {
    test.beforeEach(async ({ page }) => {
        // 1. Mock OpenAI API
        await page.route('https://api.openai.com/v1/chat/completions', async route => {
            const json = {
                choices: [
                    {
                        message: {
                            content: '# 💎 Veredicto Estratégico\n\nEstás en buen camino, pero cuidado con los gastos hormiga.\n\n## 🚀 Plan de Acción\n1. Ahorrar más.'
                        }
                    }
                ]
            };
            await route.fulfill({ json });
        });

        // 2. Perform Login via UI (More robust than session seeding)
        const email = 'insight.ui.test@example.com';
        const password = 'Password123!';
        const name = 'Insight UI User';

        await page.goto('/');

        // Check if we need to register or login
        if (await page.getByText('Empezar ahora').isVisible()) {
            // Register flow
            await page.getByText('Empezar ahora').click();
            await page.getByPlaceholder('Tu nombre').fill(name);
            await page.getByPlaceholder('Tu objetivo principal').fill('Test Insight');
            await page.getByRole('button', { name: 'Comenzar' }).click();
        } else if (await page.getByRole('button', { name: /Login/i }).isVisible()) {
            // Login flow (if implemented)
            // simplified: assume local storage auth works or we register fresh
        }

        // Set API Key after login/load to ensure it persists
        await page.evaluate(() => {
            localStorage.setItem('openai_api_key', 'sk-mock-key-123');
            localStorage.removeItem('budgy_ai_coach_verdict');
        });
    });

    test('should load insights and generate AI advice', async ({ page }) => {
        console.log('Starting Insight Test...');
        try {
            // Wait for dashboard to load
            await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });
            console.log('Dashboard loaded.');

            // Navigate (try multiple ways)
            const insightsLink = page.getByRole('link', { name: /Insights/i }).or(page.getByRole('button', { name: /Insights/i }));

            if (await insightsLink.isVisible()) {
                console.log('Clicking Insights link...');
                await insightsLink.click();
            } else {
                console.log('Navigating directly to /insights...');
                await page.goto('/insights');
            }

            // Check Title
            console.log('Verifying title...');
            await expect(page.getByText('Radiografía de tus finanzas')).toBeVisible({ timeout: 10000 });

            // Check Widget Initial State
            console.log('Verifying widget...');
            const coachWidget = page.locator('div').filter({ hasText: 'CFO Virtual' }).first();
            await expect(coachWidget).toBeVisible();

            // Check Button
            const generateBtn = page.locator('button').filter({ hasText: 'Generar Análisis' });

            if (await generateBtn.isVisible()) {
                console.log('Clicking Generate Analysis...');
                await generateBtn.click();
            } else {
                console.log('Generate button not visible, checking if result is already there...');
            }

            // Verify Result (Mocked)
            console.log('Waiting for verdict...');
            // Relaxed check
            await expect(page.getByText('Veredicto Estratégico', { exact: false })).toBeVisible({ timeout: 15000 });
            await expect(page.getByText('Estás en buen camino', { exact: false })).toBeVisible();
            console.log('Test PASSED!');

        } catch (error) {
            console.error('Test FAILED:', error);
            await page.screenshot({ path: 'insights_ui_failure.png', fullPage: true });
            throw error;
        }
    });
});
