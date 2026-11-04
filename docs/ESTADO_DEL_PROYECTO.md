# Estado del proyecto — Txispa Type

Análisis del código a fecha **4 de noviembre de 2026** (commit `131cce8`, rama `main`). Documento generado en modo solo lectura: no se ha modificado ningún archivo de código.

> Convención: las rutas son relativas a `app/src/` salvo que se indique otra cosa. `archivo:línea` apunta al código real.

---

## 1. Resumen ejecutivo

- Web de mecanografía **100 % cliente**, sin backend: React 19 + Vite 8 + TypeScript 6. Los datos viven en el navegador (IndexedDB para intentos, localStorage para ajustes y contadores).
- Calidad de base **buena**: `tsc -b` limpio, `oxlint` sin avisos, **272 tests de Vitest en verde** (24 archivos), toda la lógica de cálculo en `lib/` como funciones puras.
- El **progreso hoy no sale del navegador**: la única vía de pasarlo entre PCs es Exportar/Importar JSON a mano (`components/AjustesPantalla.tsx:40-62`). Esa es la necesidad que cubre Firebase.
- Hay **tres cosas importantes para la integración con Firebase** que no son obvias (detalle en §7 y en `PLAN_INTEGRACION_FIREBASE.md`):
  1. `CLAUDE.md` prohíbe explícitamente backend y cuentas ("Local primero: sin backend, sin cuentas…"). Hay que **cambiar esa regla** antes de implementar.
  2. Parte del progreso **no está en IndexedDB**: los contadores de calentamiento (`txispatype.calentamiento.v1`) y el tiempo extra del día (`txispatype.tiempoextra.v1`) están en localStorage y **ni siquiera se exportan** (`lib/exportar.ts:15-22`). Una migración ingenua los perdería.
  3. El repo está preparado para **GitHub Pages**, no para Vercel (no hay `vercel.json` ni configuración de Vercel; ver "Preguntas abiertas").

---

## 2. Stack y versiones

| Pieza | Versión (`app/package.json`) | Notas |
| --- | --- | --- |
| React / React DOM | ^19.2.7 | Solo estas dos dependencias de producción. |
| Vite | ^8.1.1 | `base: "./"` (`vite.config.ts:7`) para servir bajo `/Txispa-Type/` en Pages y en local. |
| `@vitejs/plugin-react` | ^6.0.3 | |
| TypeScript | ~6.0.2 | `tsconfig.app.json` + `tsconfig.node.json`. |
| Vitest | ^5.0.0 | `include: ["src/**/*.test.ts"]` → **solo `.ts`, no `.tsx`**. Sin jsdom ni testing-library. |
| oxlint | ^1.71.0 | Linter único (sin ESLint, sin Prettier). |
| Node (CI) | 24 | `.github/workflows/pages.yml:29`. |

No hay router, ni gestor de estado, ni librería de gráficas (las gráficas son SVG a mano, `components/GraficaLinea.tsx`), ni librería de UI, ni fuentes ni CDN externos.

**Build:** `dist/` = 1 JS de **345 KB** + 1 CSS de **22 KB** (sin comprimir, sin code-splitting; medido en `app/dist/assets/`).

**Despliegue actual:** GitHub Actions → GitHub Pages (`.github/workflows/pages.yml`): `npm ci` → `npm run check` (tsc + oxlint + vitest + build) → publica `app/dist`. URL documentada en `README.md`: `https://dallamond.github.io/Txispa-Type/`. **La URL de Vercel que has indicado no aparece en el repositorio** (ver preguntas abiertas).

**Estructura del repositorio:** el repo git está en `D:\Txispa-Type-main\repo\` (remoto `github.com/Dallamond/Txispa-Type`). Existe además una **copia antigua sin git** en `D:\Txispa-Type-main\Txispa-Type-main\` cuyo código difiere del actual (le faltan, p. ej., `actividad.css`, `DetalleIntento.tsx`). Ver preguntas abiertas.

---

## 3. Arquitectura

Aplicación de una sola página con **pestañas por estado** (`useState`, sin router): `App.tsx:103`.

```
main.tsx ─▶ App.tsx
             ├─ useAjustes()         ─ localStorage  (txispatype.settings.v1)
             ├─ crearAlmacenIndexedDB() ─ IndexedDB  (BD txispatype / almacén intentos)
             ├─ useIntentos(almacen) ─ lista completa de intentos en memoria (React state)
             ├─ useTotalPulsaciones() ─ contador global (intentos + localStorage + sesión viva)
             └─ pestañas: Inicio(Hoy + Estadisticas) · Calentar · Test · Entrenar · [modal Ajustes]
```

Principios que sigue el código (y que conviene respetar al añadir Firebase):

- **Lógica pura en `lib/`, componentes que solo pintan** (regla de `CLAUDE.md`). Hay una interfaz de almacenamiento, `RunStore` (`lib/almacen.ts:12-22`), con implementación en memoria (tests) e IndexedDB. **Es el punto de extensión natural para la sincronización.**
- **Todo el historial se carga entero en memoria** (`hooks/useIntentos.ts`: `almacen.list()` → `getAll()`), y cada estadística se recalcula sobre el array completo con `useMemo` (`components/Estadisticas.tsx:90-115`).
- El motor de tecleo es una **clase mutable** (`lib/motor.ts:36`) que el componente `Tecleo` fuerza a repintar con `useReducer` (`Tecleo.tsx:55`).

### Flujo de datos de una sesión de tecleo

1. `Test.tsx` / `Entrenar.tsx` / `Calentar.tsx` construyen `palabras` (generadores en `lib/textos.ts`, `lib/calentamientos.ts`, `lib/ia.ts`) y un `ConfigIntento`.
2. `Tecleo.tsx` crea un `MotorTecleo` y escucha `keydown` en `window` (`Tecleo.tsx:103-139`). Cada pulsación → `motor.tecla(key, e.timeStamp)` → `agregados.ts` acumula por tecla, par y confusión.
3. Al acabar (tiempo o texto agotado) → `terminar()` (`Tecleo.tsx:69-83`) → `crearIntento()` (`lib/intento.ts`) construye el objeto `Intento` con `id: crypto.randomUUID()`.
4. Si `guardar` es true y hubo pulsaciones → `onGuardar(intento)` → `App.guardar` → `almacen.add()` (`App.tsx:114`) → `put` en IndexedDB → `avisa()` → `useIntentos` vuelve a leer **todo** (`getAll`) → todo el árbol se recalcula.
5. Los **calentamientos no se guardan** como intento: solo suman su nº de pulsaciones a un contador en localStorage (`lib/contador.ts`).
6. Un test **abandonado con Esc** o desmontado a mitad no guarda el intento, pero sus segundos se suman a `txispatype.tiempoextra.v1` (`Tecleo.tsx:107-110` y `143-149`).

---

## 4. Datos generados y dónde se guardan hoy

### 4.1 Mapa de almacenamiento

| Dónde | Clave / almacén | Contenido | Definido en | ¿Se exporta? |
| --- | --- | --- | --- | --- |
| **IndexedDB** | BD `txispatype` v1, almacén `intentos` (keyPath `id`, índices `localDate` y `date`) | Todos los `Intento` (test y entreno) | `lib/almacen.ts:80-93` | ✅ |
| localStorage | `txispatype.settings.v1` | `Ajustes` (14 campos) | `lib/ajustes.ts:9` | ✅ (campo `ajustes`) |
| localStorage | `txispatype.calentamiento.v1` | Un número: pulsaciones acumuladas en calentamientos | `lib/contador.ts` | ❌ **No** |
| localStorage | `txispatype.tiempoextra.v1` | `{dia, segundos}` de sesiones no terminadas (solo el día en curso) | `lib/contador.ts` | ❌ **No** |
| localStorage | `txispatype.ia.v1` | Caché de los últimos 20 textos generados por Ollama | `lib/ia.ts:7` | ❌ (y no hace falta) |

> `almacen.ts:2-5` documenta por qué IndexedDB y no localStorage: un intento ocupa 3-5 KB.

### 4.2 Modelo `Intento` (`types.ts:37-70`)

Un documento por sesión guardada (test o entreno). Campos:

- Identidad: `id` (UUID), `date` (ISO), `localDate` ("YYYY-MM-DD" en Europe/Madrid).
- Contexto: `modo` (`test`|`entreno`), `fuente` (`banco|debiles|alternancia|ia|ejercicio`), `ejercicioId?`, `iaHashes?`, `durationSec`, `elapsedSec`, `seed`, `estricto`.
- Resultado: `correct`, `errors`, `wpm`, `rawWpm`, `acc`, `consistency` (nullable).
- **Agregados** (lo que pesa): `teclas: Record<char, {n,e,ms,msN}>`, `pares: Record<"ab", {n,ms}>`, `confusiones: Record<"esperada>escrita", number>`.

No se guardan pulsaciones sueltas ni el texto tecleado (regla de privacidad en `CLAUDE.md`). Tamaño típico **3-5 KB** por intento → ≈ 15 MB/año con 10 intentos/día.

> ⚠️ Los textos de `ESTADO.md` dicen "cada pulsación del intento guarda esperado/escrito/falta"; **no es cierto**: solo se guardan agregados. Documentación vieja que conviene corregir.

### 4.3 Modelo `Ajustes` (`types.ts:74-89`)

`tema`, `zoom`, `tecladoVisible`, `guiaDedos`, `objetivoTests`, `objetivoMinutos`, `estrictoPorDefecto`, `puntuacionYMayusculas`, `duracionPorDefecto`, `calentamientoMin`, `reglasDeAjuste`, `sonidos`, `ollamaUrl`, `ollamaModelo`. Se normalizan al leer (`lib/ajustes.ts:46-71`): un campo roto vuelve a su valor por defecto. Varios son **por dispositivo** (zoom, URL de Ollama): ver plan de Firebase.

### 4.4 Estadísticas derivadas (no se guardan, se recalculan)

Media semanal, tendencia, racha, objetivo del día, mapa de actividad anual, teclas/pares débiles, confusiones, etc. (`lib/estadisticas.ts`, `debiles.ts`, `actividad.ts`, `agregados.ts`). Dependen **solo de la lista de intentos + hoy + ajustes**, así que si la lista es idéntica en todos los PCs, las estadísticas lo serán sin sincronizarlas.

---

## 5. Mapa de archivos

### Raíz del repo

| Archivo | Función |
| --- | --- |
| `CLAUDE.md` | Reglas de trabajo para Claude Code (idioma, local primero, dependencias, un cambio = un commit…). |
| `README.md` | Descripción, decisiones tomadas, Ollama, preguntas abiertas. |
| `.github/workflows/pages.yml` | CI + despliegue en GitHub Pages. |
| `.gitignore` | Ignora `node_modules`, `dist`, `.env*`, `*.log`, etc. (ya cubre `.env*`, útil para Firebase). |
| `docs/` | Documentación de proyecto (`ESPECIFICACION-TECNICA.md` es la fuente de verdad técnica) **+ los 4 documentos de este análisis**. |
| `reference/` | Capturas de typing.com/Shellpath y la v1 en un solo HTML (`txispa-type-v1.html`, 555 líneas). |

### `app/` (configuración)

| Archivo | Función |
| --- | --- |
| `package.json` | Scripts: `dev`, `build` (`tsc -b && vite build`), `lint`, `test`, `check`. |
| `vite.config.ts` | `base: "./"`, plugin React, Vitest solo `src/**/*.test.ts`. |
| `scripts/run-checks.mjs` | Ejecuta tsc → oxlint → vitest → vite build y corta en el primer fallo. |
| `index.html` | Entrada; `lang="es"`, `<title>` y `description`. Favicon en `public/favicon.svg`. |

### `app/src/` — raíz

| Archivo | Líneas | Función |
| --- | --- | --- |
| `main.tsx` | 10 | Monta `<App/>` en `StrictMode`. |
| `App.tsx` | 217 | Shell: cabecera, pestañas, contador de tiempo/pulsaciones, modal de ajustes. Crea el almacén. |
| `types.ts` | 89 | `Intento`, `Ajustes`, `TeclaStat`, `ParStat`, `Fuente`, `Modo`, `Duracion`. |
| `index.css` / `estadisticas.css` / `actividad.css` | 1142 / 413 / 145 | Estilos (tokens, tema oscuro/claro, teclado, estadísticas, mapa). |

### `app/src/lib/` (lógica pura, 100 % con tests salvo lo indicado)

| Archivo | Función |
| --- | --- |
| `motor.ts` | `MotorTecleo`: avance por palabras, modo estricto, conteo de aciertos/errores. |
| `agregados.ts` | Acumula por tecla, par y confusión; intervalos válidos 1-2000 ms. |
| `medidas.ts` | Fórmulas: wpm neta/bruta, precisión, consistencia (CV). `PRECISION_MINIMA = 95`. |
| `intento.ts` | `crearIntento()`; teclas más falladas; confusiones más repetidas. |
| `almacen.ts` | `RunStore` + implementaciones memoria e IndexedDB (`SCHEMA = 1`). |
| `ajustes.ts` | Defaults, normalización, carga/guardado en localStorage. |
| `exportar.ts` | Exportar/importar JSON `{app, schema, exportedAt, intentos, ajustes}`; valida forma mínima. |
| `contador.ts` | Contadores en localStorage: pulsaciones de calentamientos y tiempo extra del día. |
| `estadisticas.ts` | Medias, tendencia, racha, objetivo, tiempo del día, resumen por día; `diaLocal`, `sumarDias`. |
| `historial.ts` | Filtros, orden, media móvil, formatos de número/fecha/tiempo, posición del test en el historial. |
| `debiles.ts` | Teclas y pares débiles (ventana de 30 intentos) con "semillas" de typing.com. |
| `confusiones.ts` | Agrega confusiones de varios intentos. |
| `plan.ts` | Foco del día (L-D), pasos del plan, reglas de ajuste automático de dificultad. |
| `textos.ts` | Palabras para teclas débiles, alternancia de manos y banco de textos. |
| `calentamientos.ts` | Texto progresivo de calentamiento y cursor fantasma. |
| `ia.ts` | Cliente de Ollama (`/api/tags`, `/api/generate`), validación del texto, caché de 20. |
| `actividad.ts` | Mapa anual tipo GitHub (53 semanas). |
| `grafica.ts` | Escalas/puntos de la gráfica de línea. |
| `calendario.ts` | Rejilla de mes. |
| `metronomo.ts` | Periodo y desviación del metrónomo. |
| `typing.ts` | `esAtajo`, `isModifier`, etiquetas de teclas (AltGr = Ctrl+Alt). |
| `rng.ts` | `mulberry32`, `newSeed`, `barajado`. |

### `app/src/data/`

`keyboard.ts` (distribución ISO español, dedos), `palabras.ts` (≈1566 palabras), `textos.ts` (párrafos del banco), `semillas.ts` (tasas iniciales de typing.com: V 17 %, X 11 %, U 9 %, Y 8 %).

### `app/src/hooks/`

| Archivo | Función |
| --- | --- |
| `useAjustes.ts` | Estado de ajustes + persistencia en localStorage + aplica tema y zoom al `<html>`. |
| `useIntentos.ts` | Lista de intentos desde el `RunStore`, relee entero tras cada cambio. |
| `ContadorTecleo.tsx` | Contexto + `useTotalPulsaciones`: suma intentos + calentamientos + sesión viva; calcula `segundosHoy`. |
| `useHoy.ts` | Día actual (se actualiza cada 30 s). |
| `useTecladoFisico.ts` | Detecta si hay teclado físico (`pointer: fine`). |
| `usePulso.ts` | Pulso audible/visual del metrónomo con WebAudio. |
| `usePressedKey.ts` | Resalta la última tecla pulsada 130 ms. |

### `app/src/components/`

| Archivo | Líneas | Función |
| --- | --- | --- |
| `Tecleo.tsx` | 370 | **Núcleo**: sesión de tecleo, cronómetro, eventos de teclado, guardado, pantalla de resultado. |
| `Estadisticas.tsx` | 510 | Tres vistas (resumen, teclas/errores, historial) con gráficas y mapa de calor. |
| `Entrenar.tsx` | 299 | Elegir fuente/duración, generar texto (incluye IA), lanzar `Tecleo`. |
| `AjustesPantalla.tsx` | 224 | Ajustes, Ollama, exportar/importar/borrar. |
| `Hoy.tsx` | 213 | Tarjeta de inicio: anillo de tests, racha, plan del día. |
| `Calentar.tsx` | 125 | Calentamiento tecleado con duración a elegir. |
| `MapaActividad.tsx` | 125 | Mapa anual de actividad. |
| `GraficaLinea.tsx` | 112 | Gráfica SVG propia. |
| `Test.tsx` | 115 | Test cronometrado 30-300 s. |
| `AreaTexto.tsx` | 114 | Texto a teclear con cursor y fantasma. |
| `DetalleIntento.tsx` | 96 | Detalle desplegable de un intento en el historial. |
| `VirtualKeyboard.tsx` | 87 | Teclado en pantalla con guía de dedos. |
| `Calendario.tsx` | 73 | Calendario mensual de cumplimiento. |
| `Pendiente.tsx` | 10 | **Código muerto** (ver §6). |

### Tests (`lib/__tests__`, `data/__tests__`)

24 archivos, 272 tests, **solo de lógica pura**. Cubren motor, medidas, agregados, estadísticas, historial, debiles, plan, ia (con `fetchFn` simulado), exportar, almacén en memoria, etc. **No hay tests de componentes, hooks ni del almacén IndexedDB real.**

---

## 6. Funcionalidades

### Existentes y funcionando (según código y tests)

- Test cronometrado (30/60/120/180/300 s) con ppm netas/brutas, precisión, consistencia, errores y comparación con los últimos 10 tests.
- Calentamiento tecleado con cursor fantasma; contador global de pulsaciones.
- Entrenar: teclas débiles, pares lentos, alternancia de manos, texto corrido, texto IA (Ollama) y metrónomo; "entreno del día" según un plan semanal.
- Estadísticas: resumen, gráfica de evolución, tabla por día, mapa de calor del teclado, confusiones, historial ordenable con detalle, calendario y mapa anual.
- Ajustes: tema, zoom, teclado virtual, metas (tests y minutos), exportar/importar JSON, borrar todo.
- Meta diaria de minutos editable desde la cabecera; el tiempo de tests abandonados cuenta.

### Incompletas, sin verificar o con dudas

- **Checklist manual de Lucas sin cerrar** (`docs/ESTADO.md`, `docs/FASES.md`): tildes con tecla muerta, AltGr, cursor fantasma, metrónomo, tema claro en todas las pantallas. Compila y pasa tests, pero **no está probado a mano**.
- **IA local con Ollama sin probar con un Ollama real** (`docs/ESTADO.md`, fase 4) y bloqueada por contenido mixto si la app se sirve por HTTPS (el despliegue en Vercel/Pages es HTTPS → solo `localhost` está exento en algunos navegadores; ver `README.md`, sección "HTTP y HTTPS").
- `sonidos` es un ajuste (`types.ts`, `ajustes.ts:20`) pero **no hay audio de teclas** (solo el pitido del metrónomo en `usePulso.ts`); el ajuste parece no hacer nada. *(Por verificar: no he encontrado ningún consumidor de `ajustes.sonidos`.)*
- Fase 5 del plan (insignias, XP, sonidos, resumen semanal con IA, ranking) **no existe**.

---

## 7. Problemas detectados

Ordenados por impacto. `S` = severidad (Alta / Media / Baja).

### 7.1 Bugs y riesgos de datos

| # | S | Dónde | Problema | Consecuencia |
| --- | --- | --- | --- | --- |
| 1 | **Alta** | `Tecleo.tsx:73` | `crypto.randomUUID()` solo existe en **contextos seguros** (HTTPS o `localhost`). Con la app servida por HTTP en la LAN (escenario que el `README.md` sugiere para Ollama) lanza `TypeError` al terminar la prueba. | El test termina sin resultado y **no se guarda**. En Vercel (HTTPS) no ocurre. |
| 2 | **Alta** | `Tecleo.tsx:78` | `void alGuardarRef.current(intento)` ignora la promesa. Si IndexedDB falla (cuota, modo privado, bloqueo), el error queda como *unhandled rejection* y el usuario ve el resultado como si estuviera guardado. | **Pérdida silenciosa de intentos.** Con sincronización será aún más importante señalar fallos. |
| 3 | Media | `lib/exportar.ts:8,21,63` y `lib/almacen.ts:9` | Se usa `SCHEMA` (versión de **IndexedDB**) también como versión del **formato de exportación**. Subir uno obliga a subir el otro. | Acoplamiento accidental; al cambiar el esquema local (p. ej. añadir cola de sincronización) se rompería la importación de archivos viejos. |
| 4 | Media | `lib/exportar.ts:15-22` | La exportación solo incluye `intentos` y `ajustes`; **omite** los contadores de localStorage. | Exportar/importar o migrar a otro PC pierde las pulsaciones de calentamientos (`contador` global) y el tiempo extra. |
| 5 | Media | `lib/exportar.ts:35-52` (`esIntentoValido`) | Validación **superficial**: comprueba que `teclas/pares/confusiones` sean objetos, pero no sus valores (`n`, `e`, `ms` numéricos). | Un JSON manipulado o corrupto puede dar `NaN` en estadísticas o romper `debiles.ts`. Más relevante aún antes de subir datos a la nube. |
| 6 | Media | `hooks/ContadorTecleo.tsx:42,54,80` | `extraSeg` (estado) **no se reinicia al cambiar de día**; si la pestaña queda abierta pasada la medianoche, `Math.max(segundosExtra, extraSeg)` arrastra los segundos de ayer. | La meta de minutos de "hoy" puede marcarse cumplida con tiempo del día anterior. |
| 7 | Media | `components/AjustesPantalla.tsx:59` | Importar un JSON **sobrescribe todos los ajustes** (`onCambiar(r.ajustes)`), incluidos `ollamaUrl` y `zoom`, que son del dispositivo. | Importar en otro PC cambia su zoom/URL de Ollama. |
| 8 | Baja | `components/Hoy.tsx:41-42` | `mejorDeLaSemana` calcula la fecha de corte con `new Date(\`${hoy}T12:00:00\`)` (zona del **sistema**), mientras el resto usa `sumarDias` (UTC, sin zona). | Incoherencia latente si el PC no está en Europe/Madrid; ya existe `sumarDias` y `mediaSemanal` para esto. |
| 9 | Baja | `lib/estadisticas.ts:275-277` | `diaLocal` usa `toLocaleDateString("sv", {timeZone})`: depende de que el navegador soporte el locale `sv` para el formato ISO (funciona hoy en todos los navegadores modernos, pero es un truco). | Riesgo bajo; conviene cubrirlo con test (ya existe parcialmente). |
| 10 | Baja | `components/Tecleo.tsx:125` | `e.preventDefault()` indiscriminado durante la prueba, **incluida Tab** (`typing.ts` la trata como modificador pero el flujo llega a `preventDefault` solo si no es modificador; Tab sí entra por `isModifier`, por lo que no se bloquea). *Por verificar en navegador.* Lo seguro: Enter y teclas de función se "comen". | Un usuario de teclado/lector de pantalla no puede salir de la prueba salvo con Esc. |

### 7.2 Código duplicado y deuda técnica

- **`formatoReloj` duplicado** con semántica distinta: `components/Tecleo.tsx:44-47` (m:ss, redondea hacia arriba) y `lib/historial.ts:95-102` (soporta horas, redondea hacia abajo). Mismo nombre, dos comportamientos.
- **Dos importaciones del mismo módulo** en `hooks/ContadorTecleo.tsx:4-5`; **comentario duplicado** en líneas 13-14 del mismo archivo; `lib/contador.ts:5` tiene un `import` a mitad del archivo (después de código).
- **`components/Pendiente.tsx`** no se importa en ningún sitio: código muerto (resto de las fases iniciales).
- **Comentarios heredados de Shellpath** que ya no describen este proyecto: `hooks/usePressedKey.ts:4` ("Practice/BossBattle"), `lib/typing.ts:2` ("Practice.tsx y BossBattle.tsx… futuros jefes"), `hooks/useTecladoFisico.ts:5-30` ("Shellpath escucha keydown…", "comandos").
- **Componentes demasiado grandes**: `Estadisticas.tsx` (510 líneas, 3 vistas + 12 `useMemo`), `Tecleo.tsx` (370, mezcla eventos, temporizador, guardado y vista de resultado). Dificultan tests y cambios.
- **`useIntentos` recarga todo** (`getAll`) tras cada `add` y el resto de la app recalcula sobre el array completo: coste O(n) por sesión que crecerá con los años.
- **CSS monolítico** (`index.css`, 1142 líneas) y tres hojas sin convención clara de nombres.
- **Estado de navegación sin URL**: no hay router ni hash; no se puede enlazar a una pestaña ni usar atrás/adelante.
- **Documentación desfasada**: `docs/ESTADO.md` tiene frases ininteligibles ("Sin revisiones sin conos") y la afirmación falsa sobre pulsaciones guardadas (§4.2); `README.md` aún dice "Web local… sin servidor ni cuentas".

### 7.3 Falta de tests

- `vitest.include = ["src/**/*.test.ts"]` (`vite.config.ts:10`): **ningún test de `.tsx`**. Sin jsdom/testing-library (además `CLAUDE.md` exige justificar nuevas dependencias).
- Sin tests de: `almacen.ts` en IndexedDB real (solo la versión en memoria), `useAjustes`, `ContadorTecleo`, `Tecleo` (el flujo de guardado/abandono), importación de ficheros.
- Sin tests de extremo a extremo (Playwright) ni del flujo de teclado real; el tecleo real lo prueba Lucas a mano.

### 7.4 Rendimiento

- `Tecleo.tsx:88-96`: un `setInterval` de 100 ms llama a `repinta()` y `contador.reportarTiempo` → repinta **todo `Tecleo` (texto + teclado virtual)** 10 veces por segundo, además de cada pulsación. Aceptable hoy; mejorable con memoización de `AreaTexto`/`VirtualKeyboard`.
- Bundle único de 345 KB sin *code-splitting*: `Estadisticas` y su lógica pesada se cargan aunque el usuario solo teclee. Añadir Firebase sumaría ~100-200 KB si no se carga de forma diferida.
- `analizar(intentos)` se calcula en **tres sitios** (`Estadisticas.tsx:104`, `Entrenar.tsx:65`, `Calentar.tsx:21`) sobre los mismos datos, sin compartir resultado.
- Sin *service worker*: no hay caché offline de la app (solo de los datos, en IndexedDB).

### 7.5 Accesibilidad

- `App.tsx:141`: el logo es un `<div onClick>`: no es focusable ni activable con teclado.
- El modal de ajustes (`App.tsx:193-212`) tiene `role="dialog"` y `aria-modal`, pero **sin trampa de foco, sin mover el foco al abrir ni devolverlo al cerrar**; el cierre con Esc se escucha en `window`.
- Durante la prueba, el texto vive en `AreaTexto` sin `aria-live` ni alternativa para lectores de pantalla (`aria-live="off"` en `Tecleo.tsx:193`): la mecanografía por naturaleza es visual, pero conviene al menos anunciar inicio/fin y resultado.
- La información por color (mapa de calor, mapa de actividad) tiene `aria-label` resumen pero no equivalente tabular para lectores.
- No se ha comprobado el contraste del tema claro (el propio `docs/ESTADO.md` lo deja pendiente).
- Aspectos buenos: `aria-label` en controles, `aria-current`, `aria-sort`, `aria-expanded`/`aria-controls` en el historial, `role="timer"`.

### 7.6 Seguridad y privacidad

- **Sin cabeceras de seguridad** (CSP, `X-Content-Type-Options`, `Referrer-Policy`) ni `vercel.json`. Al añadir Firebase hará falta una CSP que permita `*.googleapis.com`, `*.firebaseapp.com`, `accounts.google.com`.
- Sin `dangerouslySetInnerHTML`, `eval` ni HTML dinámico: superficie XSS baja (revisado por búsqueda en `src/`).
- La URL de Ollama es una entrada libre del usuario (`ollamaUrl`) usada en `fetch` desde el navegador (`ia.ts:538,556`): es el propio usuario, riesgo bajo, pero el JSON importado (`exportar.ts:58`) puede cambiarla (ver #7 arriba) → un archivo malicioso podría redirigir las peticiones de IA a otro host. Otra razón para no importar `ollamaUrl`.
- Datos personales: ninguno identificable hoy. Con Google Auth pasarán a existir **email y uid**: hará falta aviso de privacidad mínimo.
- No hay secretos en el repo (comprobado: `.gitignore` excluye `.env*`; no hay archivos `.env` en el árbol).

### 7.7 SEO / PWA

- `index.html` tiene `title` y `description`, pero **no** Open Graph, `theme-color`, manifest ni iconos PNG; el favicon se referencia como `/favicon.svg` en el fuente (Vite lo reescribe a `./favicon.svg` en `dist/index.html`, correcto).
- Sin `manifest.webmanifest` ni service worker → no instalable ni usable offline tras cerrar el navegador sin conexión.
- Sin `robots.txt` / `sitemap.xml` (poco relevante para una herramienta personal).

---

## 8. Resumen de lo que condiciona la integración con Firebase

1. **Regla del proyecto a revisar**: `CLAUDE.md` ("sin backend, sin cuentas, sin Supabase… Tiene que funcionar sin internet") y `README.md`. La integración debe ser **opcional y local-first** para respetar el espíritu: la app seguirá funcionando sin login y sin red.
2. **Punto de enganche limpio**: `RunStore` (`lib/almacen.ts`) permite añadir un almacén "sincronizado" sin tocar los componentes.
3. **IDs UUID** en los intentos y el hecho de que son **inmutables** (nunca se editan) hacen que la fusión entre dispositivos sea una simple unión por `id`, sin conflictos.
4. **Datos que quedan fuera del almacén de intentos** (calentamientos, tiempo extra) necesitan un hogar sincronizable.
5. **Volumen**: ~3-5 KB/intento, decenas de miles de lecturas/año si se releyese todo cada vez → hace falta sincronización **incremental** para no consumir la cuota gratuita.
6. **El `README` y el CI apuntan a GitHub Pages**; Vercel exigirá configurar variables de entorno y dominios autorizados (detallado en el plan).

---

## Preguntas abiertas

1. **¿Dónde está desplegado realmente?** El repositorio contiene el workflow de **GitHub Pages**, pero mencionas `https://txispa-type.vercel.app/`. No hay `vercel.json` ni referencia a Vercel en el repo. ¿Vercel está conectado al mismo repo `Dallamond/Txispa-Type` (con *Root Directory* = `app`)? ¿Se mantienen ambos despliegues o se abandona Pages? Afecta a los dominios autorizados de Firebase Auth y a las variables de entorno.
2. **¿Se levanta la regla "sin backend / sin cuentas" de `CLAUDE.md`?** La integración con Firebase la contradice. Propongo reescribirla como: *"Local primero; la nube es opcional, se activa iniciando sesión, y la app funciona igual sin ella."* Necesito tu confirmación para tocar `CLAUDE.md` en la fase de implementación.
3. **Copia antigua en `D:\Txispa-Type-main\Txispa-Type-main\`**: sin git y con código distinto del repo actual (`D:\Txispa-Type-main\repo\`). He analizado **solo `repo\`**. ¿Es una copia de seguridad que se puede ignorar/borrar?
4. **¿Quién usará la web?** Solo tú (un usuario) o también otras personas (ranking, cuentas ajenas). Cambia las reglas de seguridad, el aviso de privacidad y si interesa un perfil público.
5. **¿Qué ajustes quieres sincronizar entre PCs?** Propuesta en el plan: sincronizar metas y preferencias de práctica; **no** `zoom`, `tecladoVisible`, `ollamaUrl`, `ollamaModelo` (dependen del equipo). ¿Y el `tema`?
6. **`ajustes.sonidos`**: no he encontrado ningún código que lo consuma. ¿Es un ajuste reservado para la fase 5 o se debe quitar?
7. **Entorno de Ollama en Vercel**: la app en HTTPS no podrá llamar a `http://localhost:11434` en muchos navegadores (contenido mixto). ¿Usas la IA local desde la versión desplegada o solo en `localhost:5173`?
8. **Idioma/zona**: todo está fijado a `Europe/Madrid`. Si algún PC cambia de zona horaria, `localDate` de nuevos intentos seguiría siendo Madrid (correcto), pero conviene confirmar que es lo deseado.
9. **Tab y teclas especiales durante la prueba** (7.1 #10): no he podido verificar en navegador si Tab queda bloqueada; requiere una prueba manual.
