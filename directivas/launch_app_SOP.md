# SOP: Lanzamiento de Aplicación

## Objetivo
Iniciar el servidor de desarrollo de la aplicación para previsualizar los cambios locales.

## Entradas
- Dependencias instaladas (`node_modules`).
- Script definido en `package.json` (`dev`).

## Salidas
- Servidor de desarrollo corriendo (usualmente en `http://localhost:5173`).

## Lógica de Ejecución
1. Verificar si `node_modules` existe. Si no, ejecutar `npm install`.
2. Ejecutar `npm run dev`.
3. Capturar la URL de salida y proporcionarla al usuario.

## Restricciones y Trampas Conocidas
- **Puertos Ocupados**: Si el puerto 5173 está ocupado, Vite podría elegir otro.
- **Variables de Entorno**: Asegurarse de que el archivo `.env` esté presente antes de lanzar.

## Notas de Aprendizaje
- *Pendiente de actualización tras la primera ejecución.*
