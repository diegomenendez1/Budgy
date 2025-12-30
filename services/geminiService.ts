import { GoogleGenAI } from "@google/genai";
import { Transaction, RecurringItem, TransactionType } from '../types';

const apiKey = process.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeFinances = async (
  transactions: Transaction[],
  recurringItems: RecurringItem[],
  disposableIncome: number
): Promise<string> => {
  if (!apiKey) return "Configura tu VITE_GEMINI_API_KEY para activar el asesor inteligente.";

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

  const prompt = `
    Como estratega financiero de élite, analiza el siguiente perfil financiero (JSON).
    Tu objetivo es encontrar ineficiencias y proporcionar una hoja de ruta clara para maximizar el excedente.
    
    Perfil: ${dataSummary}

    Estructura tu respuesta en Markdown:

    # 💎 Veredicto Estratégico
    [Un párrafo ejecutivo y directo. Analiza el "Burn Rate" y la proporción de gastos fijos vs variables. Identifica fugas de efectivo o patrones de riesgo.]

    # 🚀 Acciones de Alto Impacto
    * **[Impacto Inmediato]:** [Acción concreta para esta semana basada en los gastos reales detectados.]
    * **[Optimización Estructural]:** [Consejo sobre gastos fijos o ahorros a largo plazo.]
    * **[Mentalidad de Riqueza]:** [Breve micro-hábito financiero relevante.]

    Mantén un tono de "coach" de alto nivel: sofisticado, motivador y extremadamente preciso. Usa emojis premium como 💎, 📈, 🛡️, 🚀. Evita introducciones genéricas.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });
    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "El analista está ocupado en este momento. Reintenta en unos segundos.";
  }
};
