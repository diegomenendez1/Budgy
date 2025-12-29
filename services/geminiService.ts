import { GoogleGenAI } from "@google/genai";
import { Transaction, RecurringItem, TransactionType } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeFinances = async (
  transactions: Transaction[], 
  recurringItems: RecurringItem[],
  disposableIncome: number
): Promise<string> => {
  if (!apiKey) return "API Key no configurada.";

  const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
  const variableIncome = transactions.filter(t => t.type === TransactionType.INCOME);
  const fixedExpenses = recurringItems.filter(r => r.type === TransactionType.EXPENSE);
  const income = recurringItems.filter(r => r.type === TransactionType.INCOME);

  // Prepare data summary for the prompt
  const dataSummary = JSON.stringify({
    fixed_income_sources: income.map(i => ({ desc: i.description, amount: i.amount })),
    fixed_expenses: fixedExpenses.map(e => ({ desc: e.description, amount: e.amount })),
    recent_variable_expenses: expenses.slice(0, 30).map(e => ({ desc: e.description, amount: e.amount, date: e.date, category: e.category, exceptional: e.isExceptional })),
    recent_variable_income: variableIncome.slice(0, 30).map(i => ({ desc: i.description, amount: i.amount, date: i.date })),
    calculated_disposable_income: disposableIncome,
  });

  const prompt = `
    Actúa como un asesor financiero experto y empático. Analiza mis datos financieros a continuación (en JSON), considerando tanto ingresos fijos como ingresos variables recientes.
    
    Datos: ${dataSummary}

    Genera una respuesta en Markdown con exactamente esta estructura:

    # 🤖 Resumen de IA
    [Aquí escribe un párrafo breve de 3-4 líneas resumiendo mi estado actual, mencionando si estoy gastando demasiado en variables o si mi estructura fija es sólida.]

    # 💡 Acciones Recomendadas
    * **[Título Acción 1]:** [Descripción breve]
    * **[Título Acción 2]:** [Descripción breve]
    * **[Título Acción 3]:** [Descripción breve]

    Mantén el tono motivador pero realista. Usa emojis. No uses introducción ni cierre, ve directo al contenido.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocurrió un error al contactar a tu asistente financiero.";
  }
};
