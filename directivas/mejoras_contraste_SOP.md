# DIRECTIVA: MEJORAS_CONTRASTE_SOP

> **ID:** UX-002
> **Objetivo:** Garantizar que todos los elementos de la interfaz tengan un contraste adecuado para la legibilidad (WCAG AA/AAA).
> **Última Actualización:** 2026-02-13

## 1. Guía de Aplicación de Contraste

*   **Fondo Claro (Secondary/Muted)**: No usar `text-white`. Usar `text-secondary-foreground`, `text-slate-900` o colores con contraste > 4.5:1.
*   **Fondos con Transparencia (White/5 o White/10)**: Si el fondo base es claro, la transparencia blanca reducirá el contraste. Asegurar que el texto sea oscuro. Si el fondo base es oscuro (Indigo-900), la transparencia blanca es segura para texto blanco.
*   **Elementos Críticos**: Secciones como "Meta Ahorro", "Resultado Final" y botones de acción deben ser legibles de un vistazo.

## 2. Casos Específicos Identificados

| Elemento | Problema | Solución Recomendada |
| :--- | :--- | :--- |
| Meta Ahorro (Card) | Texto blanco sobre `bg-secondary` (casi blanco). | Cambiar `text-white` por un color oscuro o usar un fondo más oscuro que contraste con blanco. |
| Input de Ahorro | Texto blanco en input con `bg-white/5` sobre `bg-secondary`. | Asegurar que el texto del input sea legible. |

## 3. Historial de Aprendizaje

- **2026-02-13**: Detectado bajo contraste en `Planning.tsx` debido al uso de `bg-secondary` (light blue) con `text-white`. **Lección**: Nunca usar `text-white` dentro de un contenedor con `bg-secondary`.
