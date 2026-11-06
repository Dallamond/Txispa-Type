# Roadmap del curso de HTML y CSS en Txispa Type

Fecha: 6 de noviembre de 2026. Complementa `docs/ROADMAP.md` (donde el curso encaja como **F3-8 / M-31, lecciones guiadas**) y se apoya en `docs/curso/SPEC-FORMATO-LECCIONES.md` (decisiones, formato y motor) y `docs/curso/TEMARIO-HTML-CSS.md` (el contenido).

**Objetivo:** aprender HTML5 y CSS3 desde cero mientras se practica mecanografía, con lecciones cortas de código real que se teclean, y con símbolos de programación (`< > / " = { } ; : #`) como teclas a entrenar.

**Reglas que se mantienen** (de `CLAUDE.md`): español, local primero (sin CDN, sin dependencias nuevas), lógica pura en `src/lib/` con tests de Vitest, claves de almacenamiento `txispatype.*`, un cambio = un commit con `tsc -b`, `lint`, `test` y `build` en verde, y nada de inventar datos del usuario.

**Leyenda.** Prioridad 🔴 🟠 🟡 🟢 y esfuerzo S ≤ 2 h · M medio día · L 1-2 días, como en `ROADMAP.md`.

---

## Fase C0 — Decisiones (antes de escribir código)

| ID | Tarea | Prio | Esf. |
| --- | --- | --- | --- |
| C0-1 | Aprobar D1-D7 de la especificación (Enter explícito, sangría automática, `entreno`, fuente `"curso"`, progreso derivado, ¿alimenta teclas débiles?, Markdown como fuente) | 🔴 | S |
| C0-2 | Aprobar los criterios de paso semilla (§6 de la especificación): ≥ 95 % de precisión para "hecha", 3 intentos para "dominada" | 🔴 | S |
| C0-3 | Decidir si el curso va en una pestaña propia **Curso** (recomendado) o dentro de Entrenar | 🟠 | S |
| C0-4 | Decidir si las lecciones cuentan para el "entreno del día" de `plan.ts` (recomendado: no; sí cuentan para los minutos) | 🟠 | S |
| C0-5 | Revisar el temario de M01-M03 y el índice de módulos con las correcciones del documento de temario | 🟠 | S |

**Hecho cuando:** las cinco decisiones están escritas en `docs/curso/SPEC-FORMATO-LECCIONES.md` (sección "Decisiones tomadas").

---

## Fase C1 — Contenido y validador (sin tocar la app)

| ID | Tarea | Prio | Esf. | Depende de |
| --- | --- | --- | --- | --- |
| C1-1 | Revisar a mano el temario completo M01-M12 (ya redactado y normalizado) y contrastarlo con las fuentes del cuaderno | 🔴 | L | C0-5 |
| C1-2 | `app/src/data/curso/tipos.ts` con `Leccion`, `Modulo`, `CursoId` | 🔴 | S | C0-1 |
| C1-3 | `app/scripts/generar-curso.mjs`: parsea el Markdown y genera `html.ts` y `css.ts` (falla con nº de línea si algo no encaja). Script npm `curso:generar` | 🔴 | M | C1-2 |
| C1-4 | Test del contenido (`data/__tests__/curso.test.ts`): las 6 validaciones de la §7 (caracteres en `CHARMAP`, longitudes, sangría, balanceo, símbolos nuevos) | 🔴 | M | C1-3 |
| C1-5 | Añadir `curso:generar` y la comprobación de que los `.ts` generados están al día a `scripts/run-checks.mjs` (`npm run check`) | 🟠 | S | C1-3 |

**Hecho cuando:** `npm run check` pasa con el curso cargado y un error en una lección (símbolo imposible de teclear, sangría rara, etiqueta sin cerrar) hace fallar el test indicando la lección.

---

## Fase C2 — Tokenización y motor de código

| ID | Tarea | Prio | Esf. | Depende de |
| --- | --- | --- | --- | --- |
| C2-1 | `lib/curso.ts`: `tokenizar(codigo)` y `aTexto(tokens)` con tests (incluye sangría, líneas con varios espacios simples, último token sin cierre) | 🔴 | M | C1-2 |
| C2-2 | `lib/motorCodigo.ts`: mismo contrato que `MotorTecleo` pero con cierre `" "` / `"\n"` / `""`, modo estricto, fin al completar el último token. Tests espejo de `motor.test.ts` más los casos de `Enter` | 🔴 | L | C2-1 |
| C2-3 | Ampliar `types.ts` (`Fuente "curso"`, `Intento.leccionId`) y `lib/intento.ts` (`ConfigIntento.leccionId`). Ampliar `esIntentoValido` (ver F0-5) y los tests de importar/exportar | 🔴 | M | C0-1 |
| C2-4 | Comprobar en navegador real la entrada de `{ } [ ] @ # | \ ~` con AltGr y de `Enter`, y qué `key` llega con `´` y con `` ` `` (tecla muerta). **Lo hace Lucas con el teclado físico** | 🟠 | S | C2-2 |

**Hecho cuando:** hay tests verdes de tokenizar y del motor, y una lección entera se puede "teclear" en un test automático sin errores de medición (ppm, precisión y teclas/pares coherentes con `MotorTecleo`).

---

## Fase C3 — Pantalla del curso

| ID | Tarea | Prio | Esf. | Depende de |
| --- | --- | --- | --- | --- |
| C3-1 | `Tecleo.tsx`: aceptar un modo código (props `tokens`, `motor`); dejar pasar `Enter` al motor solo en ese modo; conservar el comportamiento actual (Enter repite tras el resultado) | 🔴 | L | C2-2 |
| C3-2 | `AreaTexto`: pintar el código por líneas con la sangría ya puesta, resaltando el carácter siguiente (incluido `⏎`), sin romper la vista de texto actual | 🔴 | L | C3-1 |
| C3-3 | `VirtualKeyboard`: resaltar `Enter`, `Shift` y `AltGr` cuando el siguiente carácter los necesite (revisar qué hace hoy con símbolos) | 🟠 | M | C3-1 |
| C3-4 | `components/Curso.tsx`: lista de cursos y módulos (plegables), estado de cada lección, botón "continuar donde lo dejé" | 🔴 | L | C3-1 |
| C3-5 | Pantalla de lección: explicación, símbolos nuevos, `Tecleo` en modo código, resultado con "¿pasada?" y botones Repetir y Siguiente | 🔴 | L | C3-4 |
| C3-6 | Pestaña **Curso** en `PESTANAS` de `App.tsx` y paso de `onGuardar` con `fuente "curso"`, `modo "entreno"` y `leccionId` | 🔴 | S | C3-5 |
| C3-7 | Tema claro y oscuro, móvil estrecho (el código puede desbordar: `overflow-x` con aviso) y accesibilidad (`aria-live` para el resultado, foco inicial en el área de tecleo) | 🟡 | M | C3-5 |

**Hecho cuando:** se puede hacer una lección de punta a punta con el teclado físico, se guarda como intento y aparece en el historial y en los minutos de hoy.

---

## Fase C4 — Progreso y estadísticas

| ID | Tarea | Prio | Esf. | Depende de |
| --- | --- | --- | --- | --- |
| C4-1 | `lib/progresoCurso.ts`: `progresoCurso(intentos, modulos)` con los estados bloqueada / disponible / hecha / dominada y desbloqueo por orden. Tests con intentos sintéticos | 🔴 | M | C2-3 |
| C4-2 | Conectar `Curso.tsx` al progreso: candados, tick de "hecha", estrella de "dominada", barra de módulo | 🔴 | M | C4-1, C3-4 |
| C4-3 | Ajuste **Desbloquear todo el curso** (y su clave `txispatype.*`) | 🟡 | S | C4-2 |
| C4-4 | `Hoy.tsx`: tarjeta "Siguiente lección del curso" y racha de días con lección | 🟡 | M | C4-1 |
| C4-5 | `Estadisticas`: separar o filtrar por fuente `curso`; teclas de símbolos (`< > { } " =`) visibles como débiles con botón "Practicar" que lance la lección que más las trabaja | 🟡 | M | C4-1 |
| C4-6 | Decisión C0-4 en `plan.ts:252` (el "entreno hecho" no cuenta `"curso"`) con test | 🟠 | S | C0-4 |
| C4-7 | Calibrar los umbrales de ppm de "dominada" con datos reales tras 2-3 semanas de uso | 🟢 | S | C4-1 |

**Hecho cuando:** completar el repaso de un módulo desbloquea el siguiente, y la pantalla Curso refleja el progreso tras recargar la página.

---

## Fase C5 — Compatibilidad con Firebase (F1 de `ROADMAP.md`)

| ID | Tarea | Prio | Esf. | Depende de |
| --- | --- | --- | --- | --- |
| C5-1 | Incluir `leccionId` y `fuente "curso"` en la validación de importación, en `sincronizacion.ts` y en `firestore.rules` | 🟠 | S | F1-2, C2-3 |
| C5-2 | Comprobar con dos navegadores que el progreso del curso aparece en el otro PC (es derivado de intentos, no hay nada más que sincronizar) | 🟠 | S | F1-12, C4-2 |

El curso **no bloquea** la fase F1 y la fase F1 no bloquea el curso: C0-C4 se pueden hacer antes, durante o después de Firebase, porque solo añaden un campo opcional al intento.

---

## Fase C6 — Mejoras (cuando lo anterior funcione)

| ID | Tarea | Prio | Esf. |
| --- | --- | --- | --- |
| C6-1 | **Vista previa renderizada** del código tecleado en `<iframe sandbox srcdoc>` (sin scripts ni red), para ver el resultado de cada lección | 🟠 | M |
| C6-2 | Modo "ronda": repetir la misma lección 3 veces seguidas con un solo resultado agregado | 🟡 | M |
| C6-3 | Lecciones de repaso espaciado: reaparecen lecciones "dominadas" hace más de N días | 🟢 | M |
| C6-4 | Más cursos con el mismo formato: JavaScript básico, comandos de Linux (relacionado con F3-10 y con Shellpath) | 🟢 | L |
| C6-5 | Insignias por módulo completado (relacionado con F4-2) | 🟢 | M |
| C6-6 | Importar el curso desde el Markdown en tiempo de ejecución para añadir lecciones propias sin recompilar (relacionado con F3-11/F3-12) | 🟢 | L |

---

## Camino crítico y orden

```
C0 decisiones ─▶ C1 contenido + validador ─▶ C2 motor ─▶ C3 pantalla ─▶ C4 progreso ─▶ C5 Firebase ─▶ C6 mejoras
   1 sesión          2-3 sesiones           2 sesiones   3-4 sesiones    2 sesiones     1 sesión
```

C1-1 (completar el temario) puede avanzar en paralelo con C2 y C3: el motor se prueba con M01 y M02, que ya están. Una sesión de Claude Code = una fase o parte de una fase; al cerrar, anotar en `docs/FASES.md` bajo "Estado" qué queda hecho y por dónde seguir.

## Checklist manual de Lucas al terminar cada fase

- C2: teclear `{ } [ ] @ # | \ ~` con AltGr, `Enter` y una tilde; comprobar que ninguno cuenta como fallo.
- C3: hacer una lección en tema oscuro y en tema claro, y una con errores a propósito (modo normal y estricto).
- C4: pasar un repaso de módulo y comprobar que se desbloquea el siguiente tras recargar.
- C5: hacer una lección en un PC y verla en otro.

## Riesgos

1. **Entrada de símbolos en el navegador** (teclas muertas, AltGr): se mitiga con C2-4 antes de construir la pantalla y evitando `` ` `` y `^` en el temario.
2. **Calidad del contenido generado por IA:** el test de la §7 de la especificación detecta lo mecánico (caracteres, longitudes, balanceo), pero no la exactitud. Cada módulo se revisa a mano antes de darlo por bueno.
3. **Mezclar velocidad de código con la de texto:** evitado con `modo "entreno"` y fuente propia.
4. **Crecimiento del bundle:** el curso son datos de texto (decenas de KB); cargar `html.ts`/`css.ts` con `import()` diferido si pesa (ver F2-14).
