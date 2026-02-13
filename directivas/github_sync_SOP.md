# SOP: Sincronización con GitHub

## Objetivo
Sincronizar los cambios locales con el repositorio remoto de GitHub de forma segura y consistente.

## Entradas
- Cambios realizados en el código local.
- Repositorio remoto configurado (`origin`).

## Salidas
- Código local actualizado con los cambios del remoto (pull).
- Cambios locales subidos al remoto (push).
- Estado limpio de git o información clara sobre conflictos.

## Lógica de Ejecución
1. Verificar el estado actual de Git (`git status`).
2. Añadir todos los cambios al área de preparación (`git add .`).
3. Realizar un commit con un mensaje descriptivo si hay cambios.
4. Intentar realizar un `git pull` para integrar cambios remotos.
5. Si hay conflictos, detenerse e informar.
6. Realizar un `git push` para subir los cambios locales.

## Restricciones y Trampas Conocidas
- **Tokens/Credenciales**: No incluir secretos en los mensajes de commit.
- **Conflictos**: Si el script encuentra conflictos de fusión, debe fallar y notificar al usuario para resolución manual si no se puede automatizar de forma segura.
- **Rama Protegida**: Si la rama principal está protegida, el push fallará si no se cumplen las reglas de la rama.
- **Entorno Windows**: Usar `py` en lugar de `python` si el alias estándar no está configurado.

## Notas de Aprendizaje
- Primera ejecución exitosa el 13/02/2026.
- Se detectó que en este entorno se debe usar el comando `py` para ejecutar scripts de Python.
- El script maneja la detección automática de la rama actual para el push.
