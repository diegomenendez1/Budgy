# Directiva: Rediseño de Budgy con Stitch

## Objetivo
Rediseñar completamente la aplicación Budgy para lograr una experiencia profesional, coherente y escalable, utilizando Stitch para la generación de interfaces y siguiendo las pautas de `UX_REDESIGN.md`.

## Entradas
- `UX_REDESIGN.md`: Guía maestra de flujo y experiencia.
- Herramientas Stitch (`mcp_stitch_*`).

## Pasos del Proceso

### 1. Preparación de Diseño (Stitch)
- [ ] Crear proyecto en Stitch llamado "Budgy V2".
- [ ] Generar pantallas clave basadas en `UX_REDESIGN.md`:
    - **Welcome Screen**: "Toma el control de tu dinero", botones grandes, ilustración.
    - **Login/Register**: Formularios limpios, validación visual.
    - **Dashboard (Empty)**: Estado vacío con invitación a agregar gasto.
    - **Dashboard (Populated)**: Gráficos, lista de transacciones, FAB.
- [ ] Revisar y refinar diseños en Stitch.

### 2. Implementación de Código
- [ ] **Reestructuración**: Mover `App.tsx`, `index.tsx` y otros archivos raíz a `src/` para seguir estándares de Vite.
- [ ] **Design System**: Configurar `tailwind.config.js` con los colores y tipografías (Inter/Manrope) definidos en los diseños de Stitch.
- [ ] **Componentes**: Crear componentes reutilizables en `src/components/ui` basados en los diseños (Botones, Inputs, Cards).
- [ ] **Vistas**: Implementar las páginas en `src/pages` siguiendo el flujo de usuario.

### 3. Verificación
- [ ] Verificar que no existan "pantallas blancas" (Loading states).
- [ ] Probar flujo completo: Welcome -> Login -> Dashboard.
- [ ] Verificar responsive design.

## Restricciones y Advertencias
- **No usar Placeholders**: Usar datos reales o mockups realistas.
- **Estética Premium**: Evitar colores default. Usar sombras suaves, bordes redondeados y buen espaciado.
- **Escalabilidad**: Mantener componentes pequeños y funcionalidad separada (hooks para lógica).
