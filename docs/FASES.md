# Fases y criterios de "hecho"

Se trabaja una fase cada vez, en orden. Cada fase termina en una puerta: no se pasa a la siguiente hasta cumplir su criterio. Las fases no llevan fechas porque dependen del tiempo que Lucas le dedique.

Marca las tareas con `- [x]` al terminarlas. Detalle técnico en `ESPECIFICACION-TECNICA.md`.

## Estado

**Fase 1 hecha (25 de octubre de 2026), pendiente de la puerta 1 de Lucas.** Repo en https://github.com/Dallamond/Txispa-Type. `npm run check` en verde (47 tests). Verificado en navegador (Chrome, dev server): seis pestañas, teclado virtual con guía de dedos y tecla muerta para tildes, IndexedDB guarda/lee/borra (botón "Probar almacenamiento" en Ajustes, que se quitará en la fase 2), sin errores de consola.

Notas de la fase 1:
- `CHARMAP` de Shellpath no contemplaba las vocales con tilde ni la diéresis; se han añadido (tecla muerta `´`). El teclado marca primero `´` y luego la vocal.
- `grafica.ts`: la métrica `"ppm"` pasa a `"wpm"`.
- No se ha copiado `DailyGoal`, `HistorialTests` ni `StatsView` todavía (fase 2).
- Siguiente: fase 2, tarea `medidas.ts`.

## Fase 1: Cimientos

Dejar un proyecto que compila, con las piezas reutilizables de Shellpath y sus pruebas funcionando.

- [x] Iniciar el repositorio git en `Txispa Type/` y crear `app/` con Vite, React 19 y TypeScript (mismas versiones que Shellpath). Añadir Vitest y oxlint.
- [x] Script `npm run check` que encadene `tsc -b`, lint, tests y build.
- [x] Copiar y renombrar (`cpm` y `wpm`) `typing.ts`, `rng.ts`, `data/keyboard.ts`, `data/textos.ts`, `lib/grafica.ts`, `hooks/usePressedKey.ts`, `hooks/useTecladoFisico.ts` con sus tests.
- [x] Extraer de `index.css` de Shellpath solo los tokens, el tema claro y oscuro, y los estilos del teclado.
- [x] Copiar `VirtualKeyboard` y comprobar que pinta la tecla siguiente y el nombre del dedo.
- [x] Interfaz `RunStore` con implementación en memoria (para tests) y en IndexedDB.
- [x] Ajustes en localStorage con valores por defecto.
- [x] Estructura de pestañas vacía: Hoy, Calentar, Test, Entrenar, Estadísticas, Ajustes.

**Hecho cuando:** `npm run check` pasa en verde, la app abre con las seis pestañas, el teclado virtual se ve y los tests de lo copiado pasan.

**Puerta 1:** la base funciona igual que en Shellpath, y los datos de prueba se guardan y se leen de IndexedDB.

## Fase 2: MVP diario

Que Lucas pueda dejar typing.com.

- [ ] Pantalla Test con duraciones 30, 60, 120, 180 y 300 s, avance por palabras y conteo de errores como en Shellpath.
- [ ] Captura por intento de tiempo por tecla, por par de letras y confusiones (`agregados.ts`) con tests.
- [ ] `medidas.ts`: wpm neta y bruta, precisión, consistencia, con tests.
- [ ] Pantalla de resultados: wpm, precisión, ritmo constante, comparación con la media de los últimos 10 y teclas más falladas del test.
- [ ] Modo estricto opcional y opción de puntuación y mayúsculas.
- [ ] Historial filtrable por duración y gráfica de ppm y precisión (con `grafica.ts`).
- [ ] Pantalla Hoy con objetivo diario de tests, racha y media semanal.
- [ ] Calentamiento rápido (`manos`, `escala`, `fila-base`, `lento`) con el motor de cursor fantasma.
- [ ] Exportar e importar JSON.
- [ ] Cargar las semillas de typing.com (V, X, U, Y).
- [ ] Texto de respaldo suficiente: ampliar `data/textos.ts` hasta unos 60 párrafos.

**Hecho cuando:** Lucas completa tres tests al día durante una semana en Txispa Type, sin perder datos, y las cifras son comparables con las de typing.com (mismo orden de magnitud en un mismo texto).

**Puerta 2:** una semana de uso real sin pérdida de datos.

Checklist manual de la fase: teclear con acentos y ñ; AltGr y símbolos; cerrar la pestaña a mitad de un test y volver; recargar con Ctrl+R sin que cuente como fallo; exportar, borrar e importar.

## Fase 3: Entrenamiento dirigido

Que la app decida qué practicar.

- [ ] `debiles.ts`: puntuación de teclas y pares con ventana de 30 intentos y normalización por intento, con tests.
- [ ] `data/palabras.ts` con unas 1500 palabras comunes del español.
- [ ] Fuentes de texto `debiles` y `alternancia` deterministas por semilla.
- [ ] Pantalla Entrenar con duraciones y fuentes; guarda como `entreno`.
- [ ] Calentamientos completos: los nueve ejercicios y las tres rutinas con pausas entre ejercicios.
- [ ] Metrónomo con desviación media en ms.
- [ ] Plan semanal y reglas de ajuste visibles en Hoy (`plan.ts`).
- [ ] Estadísticas completas: mapa de calor, teclas y pares débiles con botón "Practicar", confusiones, mediana y peor test del día, tendencia, calendario.
- [ ] Botón "Practicar teclas problemáticas" que lanza un entreno con un clic.

**Hecho cuando:** la pantalla Hoy propone cada día el entrenamiento correcto, los ejercicios usan datos reales de Lucas y todas las métricas de la sección 6 de la especificación se calculan con tests.

**Puerta 3:** dos semanas con la media semanal de ppm estable o subiendo.

## Fase 4: IA local

- [ ] `ia.ts`: listado de modelos, generación con tiempo máximo, validación y reintento.
- [ ] Ajustes de Ollama (URL, modelo, botón "detectar modelos").
- [ ] Fuente `ia` en Entrenar y en el entreno del jueves.
- [ ] Caché de los últimos 20 textos y aviso claro cuando se usa el banco como respaldo.
- [ ] Documentar `OLLAMA_ORIGINS` y la cuestión de HTTP y HTTPS.

**Hecho cuando:** con Ollama encendido, el entreno del jueves genera un texto usable; con Ollama apagado, cae al banco con un aviso y no se rompe nada.

**Puerta 4:** los textos generados por la IA se pueden usar sin retoques.

## Fase 5: Extras

Cada uno por separado, solo si Lucas lo pide.

- [ ] Insignias y XP que premien constancia y precisión (reutilizando lo que convenga de Shellpath).
- [ ] Sonidos de tecla y de error (`lib/audio.ts` de Shellpath), apagados por defecto.
- [ ] Servir la app desde el homelab y, si se quiere, sincronizar datos entre dispositivos.
- [ ] Resumen semanal en lenguaje natural con el modelo local (solo agregados).
- [ ] Modo de comandos Linux, enlazado a Shellpath.
- [ ] Error por tecla vecina, salto de letra y letra añadida.

## Registro de decisiones

| Fecha | Decisión |
| --- | --- |
| 2026-10-25 | Web local con React, Vite y TypeScript, igual que Shellpath. Datos en el navegador. |
| 2026-10-25 | Texto en español con teclado ISO español. Calidad antes que velocidad. |
| 2026-10-25 | Los calentamientos no cuentan en las estadísticas. Los entrenos solo alimentan teclas, pares y confusiones. |
| 2026-10-25 | La IA local va en la fase 4: no bloquea sustituir a typing.com. |
| 2026-10-25 | Estiramiento de manos de 45 s: abrir 3 s, puño 1 s, 10 repeticiones (la primera versión decía 5 s y no cuadraba). |
