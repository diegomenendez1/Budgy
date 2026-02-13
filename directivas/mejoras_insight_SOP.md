# Directiva: Optimización Módulo Insights (Project Budgy)

**Objetivo:** Transformar el módulo "Insights" de un tablero estático a un centro de inteligencia financiera proactivo, profundo y potenciado por IA real.

## 1. Diagnóstico Actual
- **Falsa IA:** El "Coach IA" actual (`Insights.tsx`) usa lógica `if/else` rígida (ej. "si gastas > 30% en X, muestra alerta Y"). No hay inteligencia real.
- **Servicio Desconectado:** Existe `src/services/aiService.ts` con capacidad de conectar a OpenAI, pero no se está consumiendo en la vista principal de Insights.
- **UX Limitada:** Solo muestra gráficos estándar (Pie/Bars) sin interactividad profunda ni análisis de tendencias a largo plazo.

## 2. Visión "Optimized & Powerful"
El usuario requiere: "más optimo, mas util, mas entendible, mas eficiente, mas potente, mas completo".

### A. Integración de IA Real (Hybrid One-Shot)
- **Concepto:** Mantener la velocidad de los cálculos locales, pero inyectar un análisis cualitativo asíncrono.
- **Cambio:** Al cargar Insights, disparar `analyzeFinances` en segundo plano. Mostrar "Analizando..." y luego revelar un "Veredicto Estratégico" generado por GPT-5 Mini (según `aiService.ts`) que cruce datos complejos (ej. "Estás gastando mucho en hormiga vs tus ingresos fijos").

### B. Nuevas Métricas de "Potencia"
1.  **Burn Rate Real vs Ideal:** Gráfico de velocímetro (ya existente pero mejorado visualmente).
2.  **Detección de Fugas:** Módulo específico que agrupe "Gastos Hormiga" o "Suscripciones" (detectando patrones repetitivos o montos pequeños frecuentes).
3.  **Proyección Inteligente:** No solo lineal (`promedio * días`), sino ponderada (ej. "Sueles gastar más los fines de semana").

### C. UX "Entendible y Completa"
- **Navegación por Pestañas:** Dividir Insights en:
    -   **Resumen:** (Lo que hay ahora + Veredicto IA).
    -   **Tendencias:** Comparativa mes a mes (requiere historial).
    -   **Categorías:** Drill-down profundo.

## 3. Plan de Ejecución (Paso a Paso)

### Fase 1: Conexión Cerebral (Backend/Service)
1.  Modificar `src/services/aiService.ts`:
    -   Asegurar que el prompt de sistema (`SYSTEM_PROMPT_ANALYZE`) sea agresivamente útil y financiero.
    -   Optimizar el payload para no enviar TODO el historial, sino un resumen denso (tokens efficiency).

### Fase 2: Refactor UI (Frontend)
1.  **Componente `AICoachWidget`:** Crear un componente nuevo que maneje el estado de carga/error/éxito de la petición a OpenAI.
    -   Reemplazar la tarjeta estática actual por este widget dinámico.
    -   Fallback: Si no hay API Key o falla, mostrar la lógica estática actual (como "Modo Offline").
2.  **Mejoras Visuales:**
    -   Usar las gráficas de `recharts` con diseños más "premium" (gradientes, tooltips personalizados).

### Fase 3: "Más Potente" (Nuevas Features)
1.  **Trend Analysis:** Si hay datos de ciclos anteriores, mostrar "¿Vas mejor o peor que el mes pasado?".

## 4. Restricciones y Advertencias
- **Costos API:** No llamar a OpenAI en cada render. Usar `useEffect` con caché local (o `localStorage`) para guardar el análisis del día y no repetir la llamada hasta que cambien drásticamente las transacciones o pase X tiempo.
- **Privacidad:** Recordar al usuario que los datos se envían a OpenAI (aunque sea su propia key).

---
*Fin de la Directiva. Proceder a crear scripts/código según este plan.*
