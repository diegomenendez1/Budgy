# DIRECTIVA: AUDITORIA_COMPLETA_SOP

> **ID:** AUD-001
> **Script Asociado:** N/A (Manual & Browser Check)
> **Última Actualización:** 2026-02-13
> **Estado:** ACTIVO

---

## 1. Objetivos y Alcance
- **Objetivo Principal:** Realizar una inspección exhaustiva de Budgy para detectar inconsistencias visuales, fallos lógicos en funciones y botones, y falta de coherencia en el diseño premium.
- **Criterio de Éxito:** Todos los módulos han sido verificados, los errores encontrados han sido corregidos o documentados, y la interfaz se siente fluida y cohesiva.

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- **Archivos Fuente:** `src/pages/`, `src/components/`, `src/index.css`.
- **Entorno:** `http://localhost:5173`.

### Salidas (Outputs)
- **Artefactos Generados:** `walkthrough.md` con los resultados de la auditoría.
- **Memorias:** Actualización de la sección "Historial de Aprendizaje" en esta directiva si se detectan patrones de error.

## 3. Flujo Lógico (Algoritmo)

1. **Inicialización:** Abrir la aplicación en `localhost:5173`.
2. **Ciclo de Revisión de Módulo:**
    - Abrir código fuente del módulo.
    - Observar estética (colores, espaciado, tipografía).
    - Probar cada botón y función interactiva.
    - Verificar coherencia con el diseño global.
3. **Registro de Hallazgos:** Anotar cualquier desviación del estándar "Premium/WOW" o errores de lógica.
4. **Corrección Inmediata:** Si el error es menor, corregirlo y verificar. Si es mayor, documentar primero.
5. **Validación Cruzada:** Asegurar que los cambios en un módulo no afecten negativamente a otros.

## 4. Herramientas y Librerías
- **Browser:** Herramientas de desarrollador (Inspect, Console).
- **Vite:** Server de desarrollo para hot-reload.
- **Lucide Icons:** Para consistencia iconográfica.

## 5. Restricciones y Casos Borde (Edge Cases)
- **Modo Oscuro/Claro:** Verificar que los contrastes funcionen en el esquema actual.
- **Responsive:** Aunque el foco sea desktop, los componentes no deben romperse en vistas móviles.
- **Decimales:** Regla estricta de 2 decimales para montos financieros (ej. `10.50` en lugar de `10.504`).


## 6. Protocolo de Errores y Aprendizajes (Memoria Viva)

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
|-------|-----------------|------------|--------------------------|
| 13/02 | N/A             | Inicio de Auditoría | N/A                      |

## 7. Checklist de Pre-Ejecución
- [ ] Servidor Vite activo.
- [ ] Consola del navegador limpia.
- [ ] Directiva de UX leída.

## 8. Checklist Post-Ejecución
- [ ] Todos los botones probados.
- [ ] Visualmente coherente al 100%.
- [ ] Walkthrough generado y mostrado al usuario.
