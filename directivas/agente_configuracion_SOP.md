# DIRECTIVA: CONFIGURACION_AGENTE_SOP

> **ID:** AGENT-001
> **Objetivo:** Garantizar que el agente sea útil, preciso y nunca cometa errores en implementaciones técnicas.
> **Modelo Estándar:** `gpt-5-mini` (OpenAI).
> **Última Actualización:** 2026-02-13

## 1. Principios de Operación

1.  **Cero Alucinaciones:** Si no conoces un dato o una API, búscala. Nunca inventes parámetros o comportamientos.
2.  **Verificación Cruzada:** Antes de ejecutar un cambio crítico, lee el archivo afectado y sus dependencias.
3.  **Memoria de Errores:** Cada vez que un script falle, DEBES actualizar la directiva correspondiente en la sección de "Historial de Aprendizaje".
4.  **Estandarización de IA:** Cualquier componente, servicio o script que utilice Inteligencia Artificial dentro de Budgy DEBE usar obligatoriamente el modelo `gpt-5-mini`.

## 2. Protocolo de Implementación de IA

*   **Identificación:** Buscar cualquier uso previo de IA (ej. Gemini, otros modelos de GPT).
*   **Migración:** Refactorizar el código para usar el endpoint de OpenAI con el modelo `gpt-5-mini`.
*   **Prompting:** Los prompts deben ser precisos, profesionales y seguir la estética "Premium" de la aplicación.
*   **Error Handling:** Implementar capturas de error robustas. Si la IA falla, la app debe informar al usuario de forma elegante sin romper el flujo.

## 3. Lista Blanca de Modelos
- ✅ `gpt-5-mini` (Prioridad 1: Uso General, Parsing, Coaching)
- ❌ `gpt-4o`, `gpt-4-turbo`, `gemini-1.5-pro` (Prohibidos a menos que se especifique lo contrario).

## 4. Validación de Calidad (Criterios de Aceptación)
- [ ] El código no contiene placeholders como "API_KEY_AQUÍ".
- [ ] Las llamadas a IA pasan por un validador de esquema (Zod) si retornan JSON.
- [ ] El agente ha verificado que el modelo en el código sea exactamente `gpt-5-mini`.
- [ ] Se ha actualizado la directiva del proyecto afectado con los nuevos aprendizajes.
