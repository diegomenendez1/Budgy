# SOP: Inicialización del Workspace

## Objetivo
Configurar el entorno de desarrollo para asegurar que todas las dependencias estén instaladas y la infraestructura local (.tmp, scripts, directivas) sea correcta y funcional.

## Entradas
- `package.json` para dependencias de Node.
- `requirements.txt` (si existe) para dependencias de Python.
- Estructura de carpetas actual.

## Salidas
- Carpeta `node_modules` actualizada.
- Carpeta `.tmp/` creada para almacenamiento temporal.
- Entorno de Python configurado si es necesario.
- Carpeta `directivas/` y `scripts/` verificadas.

## Lógica de Ejecución
1. Verificar la existencia de la carpeta `.tmp/`. Si no existe, crearla.
2. Ejecutar `npm install` para asegurar que las dependencias de frontend estén al día.
3. Verificar si existe `requirements.txt`.
   - Si no existe, crear uno básico con `subprocess` (aunque es estándar) y cualquier otra librería necesaria para los scripts de automatización.
4. Ejecutar `pip install -r requirements.txt` o similar usando el comando `py`.
5. Verificar que `.env` contenga las claves necesarias (comparar con `.env.example` si estuviera disponible).

## Restricciones y Trampas Conocidas
- **Uso de `py`**: En este sistema Windows, usar siempre el comando `py` para scripts de Python.
- **Node Version**: Asegurarse de tener una versión de Node compatible (usualmente v18+).
- **Carpeta `.tmp`**: Debe estar en `.gitignore` para evitar subir datos basura.

## Notas de Aprendizaje
- Primera configuración realizada por el agente para estandarizar el workspace.
