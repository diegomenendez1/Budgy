# DIRECTIVA: VERIFICACION_SISTEMA_BUDGY

> **ID:** VER-001
> **Script Asociado:** `scripts/verificar_logica.py` (Por crear si es necesario, o usar Playwright)
> **Última Actualización:** 2026-02-13
> **Estado:** ACTIVO

---

## 1. Objetivos y Alcance
*Garantizar la integridad lógica y funcional de la aplicación Budgy (ARQUITECTURA LOCAL).*
- **Objetivo Principal:** Auditar módulo por módulo asegurando que todo funcione **offline-first/localmente** sin dependencias de backend externo (Supabase eliminado).
- **Criterio de Éxito:** Autenticación, persistencia de datos y lógica de negocio funcionan perfectamente usando almacenamiento local (IndexedDB/LocalStorage).

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- **Código Fuente:** `src/` (Auth y DB local).
- **Tests Existentes:** `tests/` (Playwright).

### Salidas (Outputs)
- **Reporte de Auditoría:** `audit_report.md`.
- **Correcciones de Código:** Implementación de adaptadores locales.

## 3. Flujo Lógico (Algoritmo)

1.  **Inicialización:**
    - Verificar entorno local.
    
2.  **Auditoría por Módulo (Iterativo):**
    - **Selección:** Autenticación (Local).
    - **Implementación:** Asegurar que `AuthContext` gestione usuarios en memoria/disco local.
    - **Verificación:** Tests E2E no deben fallar por red.

## 4. Herramientas y Librerías
- **BD Local:** Dexie.js / LocalStorage.
- **Testing:** Playwright.

## 5. Restricciones y Casos Borde (Edge Cases)
- **Persistencia:** Los datos deben sobrevivir a la recarga de página.
- **Seguridad Local:** Aunque sea local, mantener separación lógica de usuarios (si aplica multi-perfil local).

## 6. Protocolo de Errores y Aprendizajes (Memoria Viva)

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
|-------|-----------------|------------|--------------------------|
|       |                 |            |                          |

## 7. Ejemplos de Uso

```bash
# Ejecutar verificación de tipos
npm run type-check

# Ejecutar tests de Playwright
npx playwright test
```

## 8. Checklist de Pre-Ejecución
- [ ] `.env` configurado correctamente.
- [ ] Base de datos de prueba accesible.
- [ ] Servidor de desarrollo corriendo (`npm run dev`) si es necesario para Playwright UI.

## 9. Checklist Post-Ejecución
- [ ] Reporte actualizado.
- [ ] No hay errores críticos pendientes.
