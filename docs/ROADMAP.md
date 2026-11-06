# Roadmap de Txispa Type

Fecha: 4 de noviembre de 2026. Basado en `ESTADO_DEL_PROYECTO.md` y `PLAN_INTEGRACION_FIREBASE.md`.

**Leyenda.** Prioridad: 🔴 crítica · 🟠 alta · 🟡 media · 🟢 baja. Esfuerzo: **S** ≤ 2 h · **M** ≈ medio día · **L** 1-2 días · **XL** > 2 días (estimaciones para una persona con la base de código ya conocida). Dependencias entre corchetes, p. ej. `[F0-2]`.

Regla de `CLAUDE.md` que se mantiene: un cambio = un commit, y antes de cada commit pasan `tsc -b`, `lint`, `test` y `build`.

---

## Fase 0 — Cimientos y correcciones previas (corto plazo, ~1 semana)

Objetivo: arreglar lo que puede perder datos **antes** de enchufar la nube, y tomar las decisiones pendientes.

| ID | Tarea | Prio | Esf. | Depende de |
| --- | --- | --- | --- | --- |
| F0-1 | Decidir y escribir: despliegue (Vercel vs Pages), regla "local primero" reformulada, aprobar dependencia `firebase` | 🔴 | S | — |
| F0-2 | Gestionar el error de guardado en `Tecleo.tsx:78` (aviso visible + reintento) | 🔴 | S | — |
| F0-3 | Fallback de `crypto.randomUUID` (`Tecleo.tsx:73`) para HTTP en LAN | 🔴 | S | — |
| F0-4 | Incluir contadores de calentamiento y tiempo extra en la exportación; desacoplar versión de exportación de `SCHEMA` (`exportar.ts`, `almacen.ts:9`) | 🟠 | M | — |
| F0-5 | Endurecer `esIntentoValido` (valores numéricos de teclas/pares) y no importar `ollamaUrl`/`zoom` | 🟠 | S | — |
| F0-6 | Reiniciar `extraSeg` al cambiar de día (`ContadorTecleo.tsx`) + test | 🟡 | S | — |
| F0-7 | Limpiar deuda trivial: `Pendiente.tsx`, import duplicado, comentarios heredados de Shellpath, `formatoReloj` duplicado | 🟢 | S | — |
| F0-8 | Añadir `vercel.json` con cabeceras de seguridad (sin CSP de Firebase todavía) y `.env.example` | 🟡 | S | F0-1 |
| F0-9 | Checklist manual pendiente (tildes, AltGr, Tab, tema claro) — **lo hace Lucas** | 🟠 | M | — |

**Hecho cuando:** `npm run check` verde, un fallo de IndexedDB se ve en pantalla, y la exportación/importación conserva todo el progreso.

---

## Fase 1 — Firebase: cuenta y sincronización (corto plazo, ~2 semanas)

Detalle técnico en `PLAN_INTEGRACION_FIREBASE.md`.

| ID | Tarea | Prio | Esf. | Depende de |
| --- | --- | --- | --- | --- |
| F1-1 | Crear proyecto Firebase, activar Auth (Google) y Firestore, dominios autorizados | 🔴 | S | F0-1 |
| F1-2 | `firestore.rules` + emulador + tests de reglas (`@firebase/rules-unit-testing`) | 🔴 | M | F1-1 |
| F1-3 | Capa pura `sincronizacion.ts` y `migracion.ts` + tests con remoto simulado | 🔴 | L | F0-4 |
| F1-4 | `firebase.ts` (carga diferida, degrada a "solo local" sin variables) | 🔴 | S | F1-1 |
| F1-5 | `remotoFirestore.ts` + `almacenSincronizado.ts` (decorador de `RunStore`), tras flag `VITE_SYNC_ENABLED` | 🔴 | L | F1-3, F1-4 |
| F1-6 | Hook `useSesion` + `PanelCuenta` (login/logout, copia de seguridad previa) | 🔴 | M | F1-4 |
| F1-7 | Migración guiada del primer inicio de sesión (intentos + contadores + ajustes) | 🔴 | M | F1-5, F1-6 |
| F1-8 | Contadores aditivos (`increment`) para calentamientos y tiempo extra | 🟠 | M | F1-5 |
| F1-9 | Sincronización de ajustes (subconjunto, `updatedAt`) | 🟠 | M | F1-5 |
| F1-10 | "Borrar todo" con `resetEpoch` | 🟠 | M | F1-5 |
| F1-11 | `IndicadorSync` en cabecera (solo local / sincronizando / pendientes / error) | 🟠 | S | F1-5 |
| F1-12 | Variables en Vercel, CSP con dominios Firebase, prueba real con **dos navegadores/PCs** (offline → online) | 🔴 | M | F1-7 |
| F1-13 | Documentar: `CLAUDE.md`, `README.md`, `ESPECIFICACION-TECNICA.md`, aviso de privacidad | 🟡 | S | F1-12 |
| F1-14 | Retirar el flag y publicar | 🟠 | S | F1-12 |

**Hecho cuando:** un test hecho en el PC A aparece en el PC B en segundos; un test hecho sin red se sube al reconectar; sin login todo funciona como hoy; lecturas diarias < 1 % de la cuota.

---

## Fase 2 — Calidad y experiencia (medio plazo, 1-2 meses)

### 2.1 Tests y mantenibilidad

| ID | Tarea | Prio | Esf. | Depende de |
| --- | --- | --- | --- | --- |
| F2-1 | Tests de componentes/hook (jsdom + testing-library; **pedir permiso por la regla de dependencias**) o, alternativa, extraer lógica de `Tecleo` a funciones puras | 🟠 | L | — |
| F2-2 | Test del almacén IndexedDB real (con `fake-indexeddb`) | 🟡 | M | — |
| F2-3 | Dividir `Tecleo.tsx` (eventos / temporizador / resultado) y `Estadisticas.tsx` (una vista por archivo) | 🟡 | L | F2-1 |
| F2-4 | Tests E2E con Playwright de: teclear → guardar → recargar → ver resultado | 🟡 | L | — |
| F2-5 | CI: ejecutar `check` en cada PR/rama también para Vercel (previews) | 🟡 | S | F1-12 |

### 2.2 UX/UI

| ID | Tarea | Prio | Esf. | Depende de |
| --- | --- | --- | --- | --- |
| F2-6 | Router por *hash* (`#/test`, `#/estadisticas`) para enlazar y usar Atrás | 🟡 | M | — |
| F2-7 | Pantalla de bienvenida / vacía (primer uso) y de "migrar tus datos" | 🟡 | M | F1-7 |
| F2-8 | Revisión del tema claro (contraste) y ajuste `prefers-color-scheme` | 🟡 | M | F0-9 |
| F2-9 | Resolver ajuste `sonidos`: implementar sonido de tecla/error o eliminarlo | 🟢 | M | — |
| F2-10 | Mensajes de estado y errores consistentes (toasts) | 🟢 | M | — |

### 2.3 Accesibilidad

| ID | Tarea | Prio | Esf. | Depende de |
| --- | --- | --- | --- | --- |
| F2-11 | Logo y controles como `<button>`/`<a>`; trampa de foco y devolución de foco en el modal de ajustes | 🟠 | M | — |
| F2-12 | Anuncios `aria-live` de inicio/fin/resultado de la prueba; tabla alternativa para el mapa de actividad y de calor | 🟡 | M | — |
| F2-13 | Respetar `prefers-reduced-motion`; auditoría con axe/Lighthouse | 🟡 | S | — |

### 2.4 Rendimiento

| ID | Tarea | Prio | Esf. | Depende de |
| --- | --- | --- | --- | --- |
| F2-14 | Code-splitting: `Estadisticas`, `Entrenar` y Firebase con `React.lazy`/`import()` | 🟡 | M | — |
| F2-15 | Memoizar `AreaTexto`/`VirtualKeyboard`; separar el cronómetro del resto del render | 🟡 | M | — |
| F2-16 | Compartir `analizar()` (una sola evaluación) vía contexto/memo central | 🟡 | S | — |
| F2-17 | Carga incremental de intentos (ventana reciente en memoria + agregados diarios) | 🟢 | L | F1-5 |

### 2.5 SEO y PWA (básico)

| ID | Tarea | Prio | Esf. | Depende de |
| --- | --- | --- | --- | --- |
| F2-18 | `theme-color`, Open Graph, iconos PNG, `manifest.webmanifest` | 🟢 | S | — |
| F2-19 | Service worker (Workbox o a mano) para funcionar offline desde la primera visita | 🟠 | L | F2-14 |

---

## Fase 3 — Producto: estadísticas y práctica (medio plazo, 2-4 meses)

### 3.1 Estadísticas y gráficas

| ID | Tarea | Prio | Esf. | Depende de |
| --- | --- | --- | --- | --- |
| F3-1 | Clasificar el tipo de error (vecina / omisión / añadido / transposición); ya es la mejora nº 2 de `docs/ESTADO.md` | 🟠 | L | — |
| F3-2 | Curva de mejora por tecla débil (evolución de la tasa de error en el tiempo) | 🟠 | M | F3-1 |
| F3-3 | Gráficas: precisión vs ppm (dispersión), distribución de ppm, tiempo semanal | 🟡 | M | — |
| F3-4 | Comparativa de dispositivos/teclados (usando `deviceId` de Firebase) | 🟢 | M | F1-5 |
| F3-5 | Objetivos con fecha (55 ppm a 30 días, 65 a 90) y proyección según la tendencia | 🟡 | M | — |
| F3-6 | Resumen semanal automático (texto), opcionalmente con IA local usando solo agregados | 🟢 | M | — |
| F3-7 | Exportar a CSV además de JSON | 🟢 | S | F0-4 |

### 3.2 Modos de práctica y lecciones

| ID | Tarea | Prio | Esf. | Depende de |
| --- | --- | --- | --- | --- |
| F3-8 | Lecciones guiadas por filas/dedos (progresión base → superior → inferior → cifras → símbolos) con criterio de paso (ppm y precisión) | 🟠 | XL | — |
| F3-9 | Modo "sin errores" (parar hasta acertar) y modo "ráfagas" (30 s repetidos) | 🟡 | M | — |
| F3-10 | Modo palabras/ números/ símbolos y código (comandos Linux, ya previsto en la fase 5 original) | 🟡 | L | — |
| F3-11 | Textos propios (pegar un texto) con las mismas métricas | 🟡 | M | — |
| F3-12 | Importar textos desde una lista curada por categorías y dificultad | 🟢 | M | — |
| F3-13 | Probar de verdad la IA local (Ollama) y documentar la alternativa HTTPS | 🟡 | M | — |

---

## Fase 4 — Largo plazo (4-12 meses)

| ID | Tarea | Prio | Esf. | Depende de |
| --- | --- | --- | --- | --- |
| F4-1 | Ranking opcional: colección pública `publico/{uid}` con alias, mejor ppm con precisión ≥ 95 %; reglas estrictas y, a ser posible, Cloud Function de validación | 🟢 | XL | F1-14, decisión de privacidad |
| F4-2 | Gamificación ligera: insignias, XP, rachas (fase 5 original). **Hecho en parte (nov 2026):** XP, niveles, símil de velocidad y logros por niveles bronce→diamante (`lib/xp.ts`, `lib/logros.ts`); pendiente lo que dependa de la nube | 🟢 | L | F3-5 |
| F4-3 | PWA instalable completa con sincronización en segundo plano (Background Sync) | 🟡 | L | F2-19 |
| F4-4 | App Check (reCAPTCHA) para blindar Firestore | 🟡 | M | F1-14 |
| F4-5 | Compactar intentos antiguos por mes en la nube para reducir lecturas (solo si el volumen lo pide) | 🟢 | L | F1-14 |
| F4-6 | i18n (euskera/inglés) si interesa abrir la herramienta | 🟢 | L | — |
| F4-7 | Copias de seguridad programadas (export de Firestore o JSON semanal descargable) | 🟡 | M | F1-14 |
| F4-8 | Accesibilidad avanzada: modo de alto contraste, navegación completa por teclado, pruebas con lector de pantalla | 🟡 | L | F2-11 |
| F4-9 | **Reto diario con ranking** (idea de Lucas, ver abajo) | 🟡 | XL | F1-14, F4-1 |

### Idea: reto diario con ranking (F4-9)

Propuesta de Lucas, anotada el 6 de noviembre de 2026. Todavía sin diseñar en detalle.

- **Qué es:** cada día hay un reto de tecleo igual para todos (mismo texto o mismo ejercicio). Se mide **cuánto tardas en completarlo** y se ve tu tiempo.
- **Ranking diario:** los tiempos del día se ordenan en un ranking. Dar más puntos (XP) según tu puesto o por completarlo.
- **Sin login:** se puede hacer el reto igualmente (tiempo y XP locales), pero **no apareces en el ranking**. Hace falta cuenta (Firebase Auth) para puntuar en él.
- **Preguntas por resolver cuando se diseñe:**
  - Reto determinista por día: semilla = fecha (ya hay textos por semilla, `rng.ts`), así todos tienen el mismo texto sin servidor.
  - La precisión debe contar: el tiempo solo vale si se supera un mínimo de precisión (p. ej. 95 %), o se suma penalización por error; si no, gana quien teclea sucio y rápido.
  - Anti-trampas: un ranking en cliente es fácil de falsificar; con reglas de Firestore o una Cloud Function que valide (ver F4-1) se reduce, pero no se elimina del todo.
  - Alias público y privacidad (se enlaza con la decisión de F4-1: ¿solo para Lucas o más usuarios?).
  - Cómo se combina con el XP actual: los puntos del reto deberían ser derivables del historial o venir de la nube de forma verificable.

---

## Hitos y orden recomendado

```
F0 (arreglos) ──▶ F1 (Firebase) ──▶ F2 (calidad/UX/PWA) ──▶ F3 (producto) ──▶ F4 (largo plazo)
   ~1 sem            ~2 sem             1-2 meses              2-4 meses          4-12 meses
```

Camino crítico para tu objetivo (sincronizar entre PCs): **F0-1 → F0-2/3/4 → F1-1 → F1-3 → F1-5 → F1-7 → F1-12**. Todo lo demás se puede intercalar sin bloquearlo.

## Puertas de decisión

1. **Antes de F1:** decisión de despliegue (Vercel/Pages) y reformulación de la regla "local primero".
2. **Antes de F2-1:** ¿se acepta añadir jsdom/testing-library o se prefiere extraer lógica pura?
3. **Antes de F4-1:** ¿es solo para ti o habrá más usuarios? Afecta a ranking, privacidad y moderación.
