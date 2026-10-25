# Reutilizar código de Shellpath

Revisión hecha el 25 de octubre de 2026 leyendo `D:\Lukaton1\03 - PROYECTOS TEC\Shellpath\app\src`. Rutas relativas a `Shellpath/app/src`. Shellpath es solo lectura: se copia, no se modifica.

## Hallazgo principal

Shellpath ya contiene un **entrenador de mecanografía de prosa** (N19, `components/TextoTest.tsx`): pruebas de 1, 3 y 5 minutos con texto en español, avance por palabras, historial, gráfica de evolución, meta diaria y teclado virtual con guía de dedos. Lo que **no** tiene, y es lo que añade Txispa Type: tiempo por tecla y por par de letras, confusiones, teclas débiles, calentamientos, sesión de entrenamiento dirigida, plan semanal y textos de IA local.

Stack idéntico: React 19, Vite 8, TypeScript 6, Vitest 5, oxlint. Versiones exactas en `Shellpath/app/package.json`.

## Trampa de nombres

En Shellpath `ppm` son **pulsaciones** por minuto y `wpm` son palabras por minuto (`ppm / 5`). En typing.com y en la hoja de proyecto "ppm" son **palabras** por minuto. Al copiar, renombrar: `cpm` (caracteres por minuto) y `wpm`; la interfaz de Txispa Type muestra "ppm" = `wpm`.

## Copiar casi tal cual

| Archivo | Qué aporta | Cambios |
| --- | --- | --- |
| `lib/typing.ts` + `lib/__tests__/typing.test.ts` | `isModifier`, `modifierLabel`, `pressedKeyFor`, `charState`, `esAtajo` (con el matiz de AltGr en teclado español) | Ninguno. |
| `lib/speed.ts` (solo `mulberry32` y `newSeed`) + test | PRNG determinista para reproducir un texto con su semilla | Quitar `buildSequence` y la importación de `speedLines`. |
| `data/keyboard.ts` | Teclado ISO español, mapa de dedos (0-8), `CHARMAP`, `FINGER_NAMES` | Ninguno. |
| `components/VirtualKeyboard.tsx` | Teclado con tecla siguiente, tecla pulsada y nombre del dedo | Añadir prop opcional para pintar un mapa de calor por tecla. |
| `hooks/usePressedKey.ts` | Pulso visual de la última tecla | Ninguno. |
| `hooks/useTecladoFisico.ts` | Detecta si hay teclado físico | Ninguno. |
| `lib/grafica.ts` | `dominioY` e `indicesEjeX` para gráficas | Ninguno. |
| `data/textos.ts` | Banco de párrafos en prosa española (criterios de ampliación en su cabecera) | Ampliar en la fase 3. Mantener sus criterios: sin código, sin símbolos raros. |

## Adaptar

| Archivo | Qué aporta | Qué cambiar |
| --- | --- | --- |
| `components/TextoTest.tsx` | Base de la pantalla de test: fases config, corriendo y hecho; avance por palabras; desplazamiento del texto; tope `EXTRA_MAX = 8` de letras de más | Capturar tiempo por pulsación, pares y confusiones. Quitar `useSpeedRuns`, `registraEvento`, `CategoriaBadge`, `TestSwitch`, mascota y la referencia al ranking. Las duraciones pasan a 30, 60, 120, 180 y 300 s. Mantener las convenciones de `CLAUDE.md`. |
| `lib/texto.ts` | `buildPalabras(seed)` determinista | Añadir selección ponderada (teclas débiles, alternancia) y texto de IA. |
| `lib/speedStore.ts` | Patrón `SpeedRunStore` con `list`, `add`, `clear`, `peek` y `subscribe`, esquema versionado y migración | Pasar a `RunStore` sobre IndexedDB; quitar uuid determinista, buzón de salida y todo lo de sincronización. Mantener la idea de guardar siempre en local sin esperar. |
| `lib/settingsStore.ts` | Ajustes separados del progreso | Clave `txispatype.settings.v1`; quitar música y migración legacy; añadir objetivo diario de tests y teclado. |
| `components/DailyGoal.tsx` | Anillo de meta diaria con presets | Cambiar la unidad a tests del día (con minutos como dato secundario). Sustituir `Icon` o copiar solo el icono de llama. |
| `components/HistorialTests.tsx` | Historial y gráfica de las pruebas | Revisar al copiar (no se ha leído entero). Filtros por modo y duración. |
| `components/StatsView.tsx` y `lib/skillRadar.ts` | Vista de estadísticas con registro diario y radar | Revisar al copiar. Los ejes del radar son de comandos Linux; probablemente solo sirve el registro diario. |
| `index.css` (105 KB) | Tokens de color y estilos del teclado (`.keyboard`, `.krow`, `.key`, `--f0` a `--f7`, `--fthumb`) | **No copiar entero.** Extraer solo tokens, tema claro y oscuro, y estilos del teclado. |

## Opcional, fase 5

| Archivo | Para qué |
| --- | --- |
| `lib/audio.ts`, `data/musica.ts`, `data/teclados.ts`, `hooks/useAudio.ts`, `components/MusicaBoton.tsx` y los `.mp3` | Sonidos de tecla y de error con recortes ya ajustados (los de "pulsación única" traen silencio al principio y ya están recortados). Arrancan apagados. |
| `lib/xp.ts`, `data/stages.ts`, `data/logros.ts`, `components/LogrosView.tsx`, `components/LogroToast.tsx`, `components/SubidaEtapaPanel.tsx`, `hooks/useMascotFrame.ts` | XP, etapas de ROOT e insignias. Si se reutiliza, la XP debe premiar precisión y constancia, no solo velocidad. |

## No copiar

- Todo lo de cuentas y red: `lib/supabase.ts`, `lib/auth.ts`, `hooks/useAuth.ts`, `components/AuthModal.tsx`, `lib/remote*.ts`, `lib/*Sync.ts`, `components/Leaderboard.tsx`, `supabase/`.
- Analítica y consentimiento: `lib/analytics.ts`, `lib/consent.ts`, `components/CookieBanner.tsx`, `components/Privacidad.tsx`.
- Contenido de Linux: `data/levels.ts`, `data/jefes.ts`, `data/speedLines.ts`, `components/Practice.tsx`, `BossBattle.tsx`, `LevelMap.tsx`, `SpeedTest.tsx` (test de comandos), `Tutorial.tsx`.
- Archivos de secretos: `.env.local` (no abrir).

## Cosas a vigilar al copiar

- `TextoTest.tsx` cuenta el espacio de cierre como pulsación correcta y no devuelve el fallo al borrar. Mantenerlo para que los números sean comparables con los que ya tiene Lucas en Shellpath.
- El avance por palabras con `EXTRA_MAX` evita que quien no mira la pantalla rompa la maquetación; conservarlo.
- El cronómetro de `TextoTest` arranca con la primera pulsación y corre en un intervalo de 100 ms; los resultados se calculan con refs (`correctRef`, `errorRef`) para no depender del renderizado. Conservar esa disciplina.
- Pendiente N18 de Shellpath: en portátiles de 13-15" la pantalla de práctica con teclado no cabe en vertical. En Txispa Type el texto es el protagonista y el teclado debe poder plegarse.
- Shellpath avisa de que sin teclado físico no se puede practicar; `useTecladoFisico` ya lo resuelve.
