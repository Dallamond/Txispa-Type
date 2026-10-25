# Prompt para arrancar con Claude Code

Abre una terminal en `D:\Lukaton1\03 - PROYECTOS TEC\Txispa Type`, lanza `claude` y pega el texto de abajo.

---

Vamos a construir Txispa Type, mi entrenador de mecanografía. Lee en este orden: `CLAUDE.md`, `README.md`, `docs/HOJA-DE-PROYECTO.md`, `docs/ESPECIFICACION-TECNICA.md`, `docs/REUTILIZAR-SHELLPATH.md` y `docs/FASES.md`. Mira también las capturas de `reference/` y la v1 en `reference/txispa-type-v1.html`.

Trabajamos una fase cada vez. Empieza por la **Fase 1: Cimientos**.

Antes de escribir código:

1. Lee de `../Shellpath/app/src` los archivos que `docs/REUTILIZAR-SHELLPATH.md` marca como "copiar" y "adaptar", y dime si algo no cuadra con lo que dice el documento (en especial `HistorialTests.tsx`, `StatsView.tsx` y `index.css`, que no están revisados del todo).
2. Propón un plan corto de la fase 1 con el orden de tareas y los commits que harás. Espera mi visto bueno.

Después de mi visto bueno, haz las tareas de una en una, con su commit, ejecutando `npm run check` antes de cada uno. Al terminar la fase, actualiza el apartado "Estado" de `docs/FASES.md` y dame la checklist manual para que la pruebe yo.

Recuerda: no modifiques nada de Shellpath, no abras archivos `.env*`, no añadas dependencias sin preguntarme y deja el idioma en español.

---

## Para las siguientes sesiones

Pega esto al empezar cada una:

"Retomamos Txispa Type. Lee `CLAUDE.md` y el apartado Estado y la fase en curso de `docs/FASES.md`. Dime en tres líneas dónde lo dejamos y cuál es la siguiente tarea, y empieza."
