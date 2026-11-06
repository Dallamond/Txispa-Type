# Prompt de arranque para Claude Code: curso de HTML y CSS

Pega esto al abrir Claude Code en la carpeta del repositorio (`repo/`, la que tiene `.git`). No empieces por aquí otra copia de la carpeta.

---

Vamos a implementar el curso de HTML y CSS de Txispa Type. Antes de tocar nada:

1. Lee `CLAUDE.md` y sus reglas (español, local primero, sin dependencias nuevas, lógica pura en `src/lib/` con tests, un cambio = un commit con `tsc -b`, `lint`, `test` y `build` en verde).
2. Lee en este orden: `docs/curso/SPEC-FORMATO-LECCIONES.md` (con las decisiones ya tomadas en §2b), `docs/curso/ROADMAP-CURSO.md` y `docs/curso/TEMARIO-HTML-CSS.md`.
3. Revisa el código que afecta al curso: `app/src/lib/motor.ts`, `app/src/components/Tecleo.tsx` (el `Enter` se descarta hoy), `AreaTexto.tsx`, `VirtualKeyboard.tsx`, `lib/intento.ts`, `lib/plan.ts` (línea del "entreno hecho"), `lib/almacen.ts` (validación al importar), `types.ts` y `App.tsx` (`PESTANAS`).

Trabaja **una fase cada sesión**, empezando por C1 (contenido y validador). Antes de escribir código, propón en pocas líneas el plan de la sesión y espera mi visto bueno. Reglas para este trabajo:

- Crea una rama `curso` y no toques los archivos de la integración con Firebase ni el roadmap `docs/ROADMAP.md`.
- No cambies el comportamiento de `Test`, `Calentar` ni de las fuentes actuales de `Entrenar`. El modo de código es aparte y los tests existentes tienen que seguir pasando sin modificarlos.
- No modifiques el temario sin avisarme: si una lección no pasa el validador, dime cuál y por qué en vez de arreglarla en silencio.
- El contenido de las lecciones lo genera el script a partir del Markdown; no copies código de las lecciones a mano en archivos `.ts`.
- No marques como probado lo que solo compila. Al final de cada fase, deja en `docs/FASES.md` la checklist manual que me toca hacer y, bajo "Estado", qué queda hecho y por dónde seguir.

Fases en orden: C1 (contenido y validador), C2 (tokenización y motor de código), C3 (pantalla del curso), C4 (progreso y estadísticas), C5 (compatibilidad con Firebase) y C6 (mejoras).

Para esta primera sesión, hazme el plan de C1 (tareas C1-2 a C1-5) y dime qué dudas tienes antes de empezar.
