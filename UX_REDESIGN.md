# Rediseño de Experiencia de Usuario (UX) - Budgy

Este documento presenta una propuesta integral para la arquitectura de información y flujo de usuario de **Budgy**. El objetivo es minimizar la fricción cognitiva, asegurar que el usuario siempre sepa qué hacer y proporcionar una experiencia "premium" y fluida.

---

## 1. Mapa de Flujo de Usuario (User Flow Map)

El flujo se estructura para guiar al usuario suavemente desde la entrada hasta el valor principal de la app (el Dashboard).

### Diagrama Conceptual
```
[Splash Screen] (Carga inicial)
      │
      ├─── ¿Tiene token válido? ───► [Home / Dashboard]
      │
      ▼
[Welcome / Landing]
      │
      ├───► [Login] ─────────────► [Home / Dashboard]
      │
      └───► [Registro] ──► [Onboarding] ──► [Home / Dashboard (Empty State)]
```

### Escenario 1: Usuario Nuevo (Onboarding)
El objetivo es llevar al usuario al "¡Ahá! Moment" lo más rápido posible.

1.  **Splash Screen**: Logo de Budgy, fondo limpio. Carga silenciosa de assets. (Máx 2s).
2.  **Welcome Screen**:
    *   **Visual**: Ilustración atractiva o mockup de la app.
    *   **Copy**: "Toma el control de tu dinero."
    *   **Acciones**: Botón primario grande "Empezar" (Registro), Botón secundario texto "Ya tengo cuenta" (Login).
3.  **Registro (Sign Up)**:
    *   **Campos**: Nombre, Email, Password. Apuntar a "Registro con Google/Apple" para reducir fricción.
    *   **Validación**: En tiempo real (check verde al lado del campo).
4.  **Onboarding (Configuración Inicial - Crucial)**:
    *   *No dejar al usuario caer en un dashboard vacío sin contexto.*
    *   **Paso 1**: "Configura tu moneda principal".
    *   **Paso 2**: "¿Cuál es tu presupuesto mensual aproximado?" (Opcional, pero ancla la experiencia).
    *   **Paso 3**: "Listo, ¡vamos!"
5.  **Home (Dashboard - Empty State)**:
    *   El usuario ve el dashboard, pero en lugar de "Ceros" fríos, ve una invitación:
    *   "¡Hola [Nombre]! Empieza agregando tu primer gasto para ver la magia." -> Flecha apuntando al botón flotante (+).

### Escenario 2: Usuario que Inicia Sesión (First Time Login on Device)
1.  **Welcome Screen** -> Click en "Ya tengo cuenta".
2.  **Login**:
    *   **Campos**: Email, Password (o Social Login).
    *   **Acción**: Botón "Entrar". Link "¿Olvidaste tu contraseña?".
    *   **Feedback**: Si falla, mensaje claro: "El correo o la contraseña no coinciden". No usar "Error genérico".
3.  **Sincronización (Loading State)**:
    *   Pantalla de transición con spinner o barra de progreso visual: "Descargando tus finanzas...".
4.  **Home (Dashboard con Datos)**: Aterriza directamente en la vista principal con sus gráficos cargados.

### Escenario 3: Usuario Recurrente (La experiencia diaria)
1.  **Splash Screen**:
    *   Verificación biométrica (FaceID/Huella) si está disponible/activada.
    *   Carga de datos en segundo plano (SWR - Stale Whiles Revalidate).
2.  **Home (Dashboard)**:
    *   Acceso inmediato.
    *   Si los datos son viejos, mostrar un indicador discreto de "Actualizando..." arriba, pero permitir interacción inmediata con datos en caché.

### Escenario 4: Logout y Retorno
1.  **Perfil / Configuración**: Botón "Cerrar Sesión" (destacado en rojo o separado).
2.  **Confirmación**: Modal nativo o custom: "¿Seguro que quieres salir? Tus datos quedarán seguros en la nube." -> [Salir] | [Cancelar].
3.  **Acción**: Limpieza de tokens locales y redirección inmediata a **Welcome Screen**.

---

## 2. Reglas de Sesión y Permisos

### Estado: No Logueado (Guest)
*   **Visible**: Splash, Welcome, Login, Registro, Recuperar Contraseña.
*   **Restringido**: Cualquier ruta interna (`/dashboard`, `/profile`, `/transactions`) debe redirigir automáticamente a Welcome/Login.
*   **Persistencia**: Si intenta entrar a `/dashboard` por URL, guardar esa intención y redirigirlo allí post-login.

### Estado: Logueado (Auth)
*   **Visible**: Acceso total.
*   **Expiración de Token**:
    *   Si el token caduca mientras usa la app: No bloquear de golpe. Intentar *refresh token* silencioso.
    *   Si falla el refresh: Mostrar toast/modal "Tu sesión expiró. Por favor ingresa nuevamente" y redirigir a Login suavemente.

---

## 3. Checklist de UX para evitar bloqueos

Este checklist asegura que el usuario nunca se sienta "tonto" o perdido.

*   [ ] **Estados Vacíos (Empty States)**: Nunca mostrar una pantalla blanca. Si no hay transacciones, mostrar una ilustración y un botón CTA: "No hay movimientos aún. Agrega uno".
*   [ ] **Estados de Carga (Skeletons)**: Usar "esqueletos" (bloques grises pulsantes) que imiten la estructura del contenido mientras carga, en lugar de spinners globales que bloquean toda la pantalla.
*   [ ] **Botón Atrás**: En Android y Web, el botón "Atrás" debe llevar siempre a la pantalla lógica anterior. En procesos de varios pasos (Onboarding), "Atrás" vuelve al paso anterior, no cierra la app.
*   [ ] **Feedback de Acción**:
    *   Al guardar un gasto: Mostrar Toast "Gasto guardado" y cerrar modal automáticamente.
    *   Al borrar: Modal de confirmación "Deshacer" por 3 segundos (Undo) en lugar de preguntar "¿Estás seguro?" siempre (hace la app más rápida).
*   [ ] **Teclados Correctos**:
    *   Campo "Monto": Abrir teclado numérico automáticamente.
    *   Campo "Email": Abrir teclado con "@" y ".com" accesibles.
*   [ ] **Manejo de Errores de Red**:
    *   Si no hay internet: Mostrar aviso discreto "Modo Offline - Los cambios se guardarán al reconectar". Bloquear solo acciones críticas que requieran servidor sí o sí.

---

## 4. Recomendaciones para mejorar Claridad y Consistencia

1.  **Jerarquía Tipográfica**:
    *   Usa tamaños grandes y negritas para los montos de dinero (es lo que el usuario quiere ver).
    *   Usa colores semánticos: Verde para ingresos (o acento positivo), Rojo suave para gastos. *No uses rojos alarmantes, usa tonos coral o terracota.*

2.  **Navegación**:
    *   Usa una **Bottom Navigation Bar** (barra inferior) para las secciones principales: [Home] - [Transacciones] - [Presupuesto] - [Perfil].
    *   Coloca el botón de acción principal (**FAB +**) en el centro de la barra inferior o flotando abajo a la derecha, siempre visible.

3.  **Lenguaje Humano**:
    *   En lugar de "Error 404" o "Fallo de conexión", di "No pudimos conectar con Budgy. Revisa tu internet."
    *   En lugar de "Transacción exitosa", di "¡Listo! Gasto agregado."

4.  **Modo Oscuro/Claro**:
    *   Diseña pensando en ambos. El usuario financiero suele revisar la app de noche. Asegura contraste suficiente.

5.  **Accesibilidad**:
    *   Áreas de toque (touch targets) de mínimo 44x44px. No pongas enlaces pequeños muy juntos.
