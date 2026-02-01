
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { action, payload } = await req.json();
        const openAiKey = Deno.env.get('OPENAI_API_KEY');

        if (!openAiKey) {
            console.error("Missing OPENAI_API_KEY");
            throw new Error('Server configuration error: Missing API Key.');
        }

        let systemPrompt = "";
        let userContent = "";

        if (action === 'analyze-finances') {
            const { transactions, recurringItems, disposableIncome } = payload;

            const expenses = transactions.filter((t: any) => t.type === 'EXPENSE');
            const variableIncome = transactions.filter((t: any) => t.type === 'INCOME');
            const fixedExpenses = recurringItems.filter((r: any) => r.type === 'EXPENSE');
            const income = recurringItems.filter((r: any) => r.type === 'INCOME');

            const dataSummary = JSON.stringify({
                fixed_income_sources: income.map((i: any) => ({ desc: i.description, amount: i.amount })),
                fixed_expenses: fixedExpenses.map((e: any) => ({ desc: e.description, amount: e.amount })),
                recent_variable_expenses: expenses.slice(0, 50).map((e: any) => ({ desc: e.description, amount: e.amount, date: e.date, category: e.category, exceptional: e.isExceptional })),
                recent_variable_income: variableIncome.slice(0, 20).map((i: any) => ({ desc: i.description, amount: i.amount, date: i.date })),
                calculated_disposable_income: disposableIncome,
            });

            systemPrompt = `
        Como estratega financiero de élite, analiza el siguiente perfil financiero (JSON).
        Tu objetivo es encontrar ineficiencias y proporcionar una hoja de ruta clara para maximizar el excedente.
        
        Estructura tu respuesta en Markdown:
        # 💎 Veredicto Estratégico
        [Un párrafo ejecutivo y directo. Analiza el "Burn Rate" y la proporción de gastos fijos vs variables. Identifica fugas de efectivo o patrones de riesgo.]
        
        # 🚀 Acciones de Alto Impacto
        * **[Impacto Inmediato]:** [Acción concreta para esta semana basada en los gastos reales detectados.]
        * **[Optimización Estructural]:** [Consejo sobre gastos fijos o ahorros a largo plazo.]
        * **[Mentalidad de Riqueza]:** [Breve micro-hábito financiero relevante.]
        
        Mantén un tono de "coach" de alto nivel: sofisticado, motivador y extremadamente preciso. Usa emojis premium como 💎, 📈, 🛡️, 🚀. Evita introducciones genéricas.
      `;
            userContent = `Perfil: ${dataSummary}`;

        } else if (action === 'parse-transaction') {
            const { input } = payload;

            systemPrompt = `
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
              - "installmentAmount": monto calculada por cuota
              - "startDate": fecha ISO de hoy (o la mencionada)
         
         Formato JSON esperado (SOLO JSON, sin markdown):
         {
           "type": "EXPENSE" | "INCOME",
           "amount": number,
           "description": string, // Breve y limpia
           "category": string,
           "isInstallment": boolean,
           "totalInstallments": number, 
           "startDate": string
         }
      `;
            userContent = `Texto: "${input}"`;

        } else {
            throw new Error('Invalid action');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-5-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userContent }
                ],
                temperature: 0.5,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("OpenAI API Error:", err);
            throw new Error(`OpenAI API Error: ${response.status}`);
        }

        const data = await response.json();
        const reply = data.choices[0].message.content;

        return new Response(JSON.stringify({ result: reply }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
