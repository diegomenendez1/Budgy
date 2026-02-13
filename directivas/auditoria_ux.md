# DIRECTIVA: AUDITORIA_UX_BUDGY

> **ID:** UX-001
> **Objetivo:** Asegurar una experiencia simple, cómoda y sin fricciones.
> **Última Actualización:** 2026-02-13

## 1. Criterios de Evaluación "Simple y Cómodo"

*   **Fricción Cognitiva:** ¿El usuario tiene que pensar demasiado para realizar una acción común (ej. añadir un gasto)?
*   **Claridad Visual:** ¿Hay demasiada información en pantalla? ¿Los contrastes son adecuados?
*   **Feedback Inmediato:** ¿La app responde visualmente a cada acción?
*   **Consistencia:** ¿Los botones, colores y tipografías siguen un patrón predecible?
*   **Carga Mental:** ¿El lenguaje es humano o técnico? ¿Hay demasiados pasos para tareas simples?

## 2. Proceso de Auditoría por Módulo

1.  **Observación Visual:** Capturar pantalla y analizar layout.
2.  **Prueba de Flujo:** Navegar por el módulo simulando ser un usuario real.
3.  **Identificación de Fricciones:** Anotar obstáculos, confusión o diseño "agobiante".
4.  **Propuesta de Mejora:** Definir cambios específicos para simplificar.

## 3. Registro de Hallazgos (Memoria de UX)

| Módulo | Hallazgo (Fricción/Problema) | Impacto | Propuesta de Mejora/Estado |
| :--- | :--- | :--- | :--- |
| Auth/Register | Bajo contraste en botón de Google (blanco sobre blanco). | Alto | RESUELTO: Se aplicó contraste adecuado (texto oscuro sobre fondo secundario). |
| Dashboard | Saludo genérico "HOLA, USUARIO". | Bajo | RESUELTO: Sincronizado para usar nombre de registro o email. |
| Dashboard/Logic | Métricas en 0 por desajuste de zona horaria (UTC vs Local). | Alto | RESUELTO: Sincronizado uso de horas locales en cálculos de ciclos. |
| MagicInput | El usuario puede dudar sobre qué escribir. | Medio | RESUELTO: Se añadieron placeholders dinámicos y ejemplos claros. |
| Welcome Page | Botón principal causaba bucle de redirección en usuarios nuevos. | Crítico | RESUELTO: Redirigido a /register para asegurar entrada limpia. |
| UI/Contrast | Bajo contraste en etiquetas y metadatos en Planning/Dashboard. | Medio | RESUELTO: Ajustado a blanco con opacidad alta para legibilidad WCAG. |
| Planning/Savings | Bajo contraste en "Meta Ahorro" (blanco sobre celeste claro). | Alto | RESUELTO: Cambiado a texto oscuro y fondo de input blanco para legibilidad óptima. |
| Onboarding | Usuarios nuevos entran al dashboard sin guía inicial. | Medio | RESUELTO: Implementado sistema de TabHints (Onboarding Progresivo). |

## 4. Restricciones de Diseño

*   **No usar colores alarmantes** (excepto errores críticos).
*   **Contraste Premium**: Asegurar que los botones sociales y de acción principal tengan legibilidad AA/AAA.
*   **Coherencia de Saludo**: Usar siempre el nombre del usuario o el prefijo del email, evitar genéricos.
*   **Sincronización de Fechas**: Usar siempre objetos Date locales para cálculos de ciclos financieros para evitar desfases de 24h.
*   **Priorizar interacción táctil** (touch targets > 44px).
*   **Uso de Micro-animaciones** para feedback, no para decoración excesiva.
