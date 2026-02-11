import { Transaction, RecurringItem, TransactionType } from '../types';
import { AIParseResultSchema } from '../src/lib/validation';
import { z } from 'zod';

// Local-first service: Key is passed from the component (Context), not hardcoded.
// Uses direct Fetch to OpenAI to avoid backend dependency.
// MODEL: gpt-5-mini

const SYSTEM_PROMPT_ANALYZE = `
Como estratega financiero de élite, analiza el siguiente perfil financiero (JSON).
Tu objetivo es encontrar ineficiencias y proporcionar una hoja de ruta clara para maximizar el excedente.

Estructura tu respuesta en Markdown:
# 💎 Veredicto Estratégico
[Un párrafo ejecutivo y directo. Analiza el "Burn Rate" y la proporción de gastos fijos vs variables.]

# 🚀 Acciones de Alto Impacto
* **[Impacto Inmediato]:** [Acción concreta para esta semana.]
* **[Optimización Estructural]:** [Consejo sobre gastos fijos.]
* **[Mentalidad de Riqueza]:** [Breve micro-hábito financiero relevante.]

Mantén un tono de "coach" de alto nivel: sofisticado, motivador y extremadamente preciso. Usa emojis premium como 💎, 📈, 🛡️, 🚀.
`;

const SYSTEM_PROMPT_PARSE = `
Actúa como un parser de datos financieros extremadamente preciso.
Analiza el siguiente texto de usuario y extrae la intención estructurada en JSON.

Reglas de Extracción:
1. Detecta si es GASTO (EXPENSE) o INGRESO (INCOME).
2. Extrae el monto total.
3. Identifica la categoría más probable (Comida, Transporte, Ocio, Salud, Compras, Tecnología, Hogar, Otros).
4. CRÍTICO: Detecta si es una compra a "meses", "cuotas", "plazos" o "MSI".
   - Si es a plazos:
     - "isInstallment": true
     - "totalInstallments": número de cuotas (default 1 si no se especifica)
     - "startDate": fecha ISO de hoy
     
Formato JSON esperado (SOLO JSON, sin markdown):
{
  "type": "EXPENSE" | "INCOME",
  "amount": number,
  "description": string,
  "category": string,
  "isInstallment": boolean,
  "totalInstallments": number, 
  "startDate": string
}
`;

export const analyzeFinances = async (
    transactions: Transaction[],
    recurringItems: RecurringItem[],
    disposableIncome: number,
    apiKey: string
): Promise<string> => {
    if (!apiKey) return "Configura tu API Key en Ajustes para activar el Asesor Inteligente.";

    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const variableIncome = transactions.filter(t => t.type === TransactionType.INCOME);
    const fixedExpenses = recurringItems.filter(r => r.type === TransactionType.EXPENSE);
    const income = recurringItems.filter(r => r.type === TransactionType.INCOME);

    const dataSummary = JSON.stringify({
        fixed_income_sources: income.map(i => ({ desc: i.description, amount: i.amount })),
        fixed_expenses: fixedExpenses.map(e => ({ desc: e.description, amount: e.amount })),
        recent_variable_expenses: expenses.slice(0, 50).map(e => ({ desc: e.description, amount: e.amount, date: e.date, category: e.category, exceptional: e.isExceptional })),
        recent_variable_income: variableIncome.slice(0, 20).map(i => ({ desc: i.description, amount: i.amount, date: i.date })),
        calculated_disposable_income: disposableIncome,
    });

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-5-mini', // Confirmed user preference
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT_ANALYZE },
                    { role: 'user', content: `Perfil: ${dataSummary}` }
                ],
                temperature: 0.5,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("OpenAI Error:", err);
            return "Error al contactar con el estratega. Verifica tu API Key.";
        }

        const data = await response.json();
        return data.choices[0].message.content || "Sin respuesta del estratega.";

    } catch (err) {
        console.error("AI Service Exception:", err);
        return "Error de conexión. Verifica tu internet.";
    }
};

export const parseTransactionInput = async (input: string, apiKey: string): Promise<z.infer<typeof AIParseResultSchema> | null> => {
    if (!apiKey) return null;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-5-mini', // Confirmed
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT_PARSE },
                    { role: 'user', content: `Texto: "${input}"` }
                ],
                temperature: 0.1, // Lower temp for parsing
            }),
        });

        if (!response.ok) {
            console.error("OpenAI Parse Error:", await response.text());
            return null;
        }

        const data = await response.json();
        const text = data.choices[0].message.content || "{}";
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(cleanJson);
        const validated = AIParseResultSchema.safeParse(parsed);

        if (!validated.success) {
            console.error("AI Parse Validation Error:", validated.error);
            return null;
        }

        return validated.data;
    } catch (err) {
        console.error("AI Parse Exception:", err);
        return null;
    }
};
