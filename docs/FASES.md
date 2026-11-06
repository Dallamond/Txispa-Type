# Fases y criterios de "hecho"

Se trabaja una fase cada vez, en orden. Cada fase termina en una puerta: no se pasa a la siguiente hasta cumplir su criterio. Las fases no llevan fechas porque dependen del tiempo que Lucas le dedique.

Marca las tareas con `- [x]` al terminarlas. Detalle técnico en `ESPECIFICACION-TECNICA.md`.

## Estado

**Sesión del 3 de noviembre de 2026:** mapa de actividad anual en Inicio, como el de contribuciones de GitHub (`lib/actividad.ts` con tests, `components/MapaActividad.tsx`). Una celda por día de las últimas 53 semanas (de lunes a domingo); el color sale de la meta diaria de minutos (tres tercios y la meta cumplida como color más fuerte); al pasar el ratón muestra el tiempo, las pulsaciones y los tests y entrenos del día. Cuentan solo intentos guardados: los calentamientos y el tiempo de sesiones abandonadas (`tiempoextra`) no salen.

Verificado: tests unitarios y render de servidor con datos sintéticos (53 columnas, meses de noviembre a noviembre, resumen correcto). **No verificado en navegador** (la extensión de Chrome no estaba conectada): aspecto, tooltip y tema claro.

Checklist manual del mapa de actividad:
- [ ] Se ve en Inicio, cabe en la tarjeta a ~1280 px y en ventana estrecha se desplaza empezando por la semana actual.
- [ ] El tooltip sale encima de la celda, no se corta en los bordes y desaparece al salir del mapa.
- [ ] Colores legibles en tema oscuro y claro; hoy lleva un borde.
- [ ] Las cifras del tooltip de hoy cuadran con "pulsaciones de hoy" y el tiempo de la tarjeta superior (salvo el tiempo de sesiones abandonadas).

Historial con detalle (misma sesión): al pulsar una fila del historial se despliega el detalle del intento (ppm netas y brutas, precisión con la diferencia frente a los 10 tests anteriores a ese, ritmo constante, errores, pulsaciones, fuente del texto, tiempo tecleando, teclas falladas y confusiones). Verificado con tests y render de servidor; no en navegador.

Checklist manual del historial:
- [ ] Pulsar una fila abre el detalle y pulsarla otra vez lo cierra; con Tab y Enter sobre la fecha también funciona.
- [ ] Las cifras del detalle coinciden con las del resultado que viste al terminar ese test.
- [ ] En ventana estrecha el detalle no rompe la tabla.

**Cierre de sesión del 25 de octubre de 2026: las fases 1 a 4 están codificadas; las puertas 2, 3 y 4 dependen del uso real de Lucas.** Repo: https://github.com/Dallamond/Txispa-Type. `npm run check` en verde (257 tests). Todo está en commits locales; el último push no se ha hecho en esta sesión.

**Por dónde seguir mañana:**
1. Arrancar con `npm run dev` en `app/` y pasar la checklist por secciones de más abajo (empezar por Test y Calentar con el teclado real: tildes, ñ, AltGr).
2. Si algo del aspecto no convence, ajustar tamaños en `index.css` (`.texto-viewport`, `.texto-caja`) o la paleta en los tokens del principio.
3. Probar la IA solo si se instala Ollama (`OLLAMA_ORIGINS=http://localhost:5173`); si no, se deja apagada.
4. Dar las puertas 2 (una semana con tres tests al día) y 3 (dos semanas con la media estable o subiendo). La fase 5 solo con petición expresa de Lucas.

Cambios de esta sesión, tras probar la app Lucas:
- Texto de prueba sin recuadro, 1,8 rem y columna de 40 caracteres (unas 6 palabras por fila).
- Meta de tiempo diario (`objetivoMinutos`, 20 min por defecto): barra en Hoy y ajuste. Cuentan tests y entrenos, no los calentamientos (no se guardan).
- Pulsaciones totales (aciertos más errores) y tiempo de hoy en Estadísticas.
- El resultado de un test muestra la gráfica de todos los tests con el actual resaltado, su puesto y si es récord (`posicionEnHistorial`).
- Calentar pasa a ser una sola sesión tecleada de duración elegible (se quitan los ejercicios de manos y las rutinas; ajuste `calentamientoMin`, 5 por defecto). Temporizador m:ss arriba en todas las pantallas de tecleo.
- Rediseño de la interfaz: paleta más neutra, cabecera con pestañas subrayadas, tarjetas con más aire, cifras sin cajas y tablas sin fondos rojos. Estadísticas se divide en tres vistas (Resumen, Teclas y errores, Historial). Las gráficas miden su ancho real (texto a tamaño natural), con degradado bajo la media móvil, valor final y horas en el eje cuando todos los tests son del mismo día.
- Cabecera fija con el tiempo de práctica de hoy (reloj, meta y barra, en vivo; solo tests y entrenos) y el contador global de pulsaciones, que sube en vivo (intentos guardados + calentamientos en `txispatype.calentamiento.v1` + sesión en curso).
- Fase 4: `lib/ia.ts` (listado de modelos, generación con 30 s, validación, un reintento, caché de 20 textos), fuente **IA** en Entrenar y en el entreno del jueves, ajustes de Ollama con "Detectar modelos", y `iaHashes` en el intento.

Decisión que conviene que revises: un entreno largo necesita unas 1300 palabras y cada llamada da unas 65, así que se generan como mucho 6 textos seguidos y el resto se completa con el banco, con aviso en pantalla. Si falla la primera, se usa el banco entero y se avisa.

**Verificado en navegador (Chrome, con datos de prueba aparte de los reales):** cabecera fija con tiempo y pulsaciones en vivo, un test completo con su resultado y gráfica, Estadísticas en sus tres vistas, Ajustes, Entrenar y el tema claro en ventana estrecha.

**No verificado:** un Ollama real (no había en el equipo; solo tests con `fetch` simulado), el calentamiento completo hasta su pantalla final, y el tecleo real: con la automatización las tildes y la ñ dieron fallos que pueden ser de la herramienta o de la app, así que Lucas debe probarlas con su teclado. Tampoco el cursor fantasma, el metrónomo ni el tema claro en todas las pantallas.

### Checklist manual por secciones

**Test** (Test)
- [ ] El texto se ve cómodo: tamaño y ancho. Si no, ajusta `font-size` y `max-width` de `.texto-viewport` en `index.css`.
- [ ] Tildes y ñ (á é í ó ú ü, mayúsculas con tilde): no cuentan fallo.
- [ ] AltGr y símbolos: no se rompe nada.
- [ ] Test de 60 s: ppm y precisión parecidas a typing.com.
- [ ] Cerrar la pestaña a mitad de un test y volver: no queda nada guardado a medias. Ctrl+R durante un test: no cuenta como fallo.
- [ ] Resultado: la gráfica muestra todos los tests, el punto grande es el actual y el puesto tiene sentido.
- [ ] Ritmo constante y teclas falladas del resultado tienen sentido.

**Aspecto general**
- [ ] Tema claro: contraste correcto en cabecera, tarjetas, tablas y gráficas.
- [ ] Estadísticas > Resumen, Teclas y errores, Historial: todo se lee bien con ~1280x720 y en una ventana estrecha (las gráficas pasan a una columna).
- [ ] Las gráficas del Resumen y la del resultado de un test se ven nítidas y con el eje X legible.

**Contador y cabecera**
- [ ] La cabecera se queda fija al hacer scroll y el contador sube con cada pulsación, también en el calentamiento.
- [ ] El tiempo de hoy de la cabecera avanza mientras haces un test o entreno (no en el calentamiento), se pone verde al llegar a la meta y no pega saltos al terminar.
- [ ] Al terminar un test o entreno el contador no se duplica ni baja; tras Esc conserva lo tecleado en un calentamiento y descarta el test cancelado.

**Hoy**
- [ ] Barra de tiempo diario sube al terminar tests y entrenos, y se pone verde al llegar a la meta.
- [ ] Propone el entreno correcto cada día de la semana y da el motivo si baja el ritmo.

**Calentar**
- [ ] Calentar es tecleo: eliges 2, 3, 5, 8 o 10 min y el texto va de fila base a alternancia, pares lentos y texto corrido, sin pausas ni ejercicios de manos.
- [ ] El temporizador está arriba y el cursor fantasma marca un ritmo tranquilo: ¿ayuda o molesta?

**Entrenar**
- [ ] Teclas débiles: muchas V, X, U e Y al empezar (semillas de typing.com), que pasan poco a poco a tus datos.
- [ ] Metrónomo: suena y parpadea, − y + cambian el pulso, la desviación en ms tiene sentido.
- [ ] IA sin Ollama (o sin modelo elegido): cae al banco y avisa en pantalla, sin romperse.
- [ ] IA con Ollama: Cancelar funciona mientras genera; el texto no lleva comillas, markdown ni caracteres raros; tras repetir no se repite el mismo texto.
- [ ] Puerta 4: los textos de la IA se pueden usar sin retoques.

**Estadísticas**
- [ ] Con 0 tests (estado vacío) y con varios días; filtro de duración; ordenar el historial.
- [ ] Pulsaciones totales y tiempo de hoy son coherentes con lo que has tecleado.
- [ ] Mapa de calor marca tus teclas flojas; "Practicar teclas problemáticas" abre un entreno al momento.

**Ajustes**
- [ ] Meta de minutos y tests al día se guardan. Tema claro y tamaño de texto. En ~1280x720 el texto y el teclado caben sin scroll.
- [ ] Ollama: "Detectar modelos" lista los instalados; con Ollama apagado da un aviso claro.
- [ ] Exportar, borrar todo e importar: los intentos vuelven y no se duplican al importar dos veces.

**Puertas:** puerta 2 (una semana con tres tests al día sin perder datos) y puerta 3 (dos semanas con la media estable o subiendo).

### Estado de la fase 3 (anterior)

**Fase 3 codificada (25 de octubre de 2026); fase 2 pendiente de la puerta 2 de Lucas.** Repo: https://github.com/Dallamond/Txispa-Type. `npm run check` en verde (240 tests).

Fase 3, qué hay:
- `lib/debiles.ts` (ventana de 30 intentos, normalización por intento, semillas de typing.com), fuentes de texto `debiles` y `alternancia` por semilla, `data/palabras.ts` (1566 palabras), `lib/plan.ts` (foco semanal y reglas de ajuste).
- Pantallas: **Entrenar** (entreno del día, fuentes dirigidas, metrónomo), **Calentar** con los nueve ejercicios y las tres rutinas, **Hoy** con plan y reglas de ajuste, **Estadísticas** con mapa de calor, teclas y pares débiles con botones "Practicar", confusiones, tendencia, mediana y peor test del día, y calendario.
- Revisión de código de la fase 2 aplicada (ver historial de commits).

**Qué NO está verificado en navegador** (solo tests unitarios y render de servidor sin errores): Entrenar, metrónomo (sonido y desviación), mapa de calor y calendario. Al intentar la comprobación el navegador de automatización se colgó (ni un SVG estático se podía capturar), así que es un fallo del navegador y no de la app; hay que repetirla. Los datos sintéticos de prueba se han borrado de IndexedDB.

Pendiente de la fase 3: comprobar en navegador lo anterior, checklist manual con tu teclado, y la puerta 3 (dos semanas con la media estable o subiendo). Siguiente: fase 4 (IA local, `lib/ia.ts`).

Checklist manual de la fase 3:
- [ ] Entrenar > Teclas débiles: el texto lleva muchas V, X, U, Y al empezar (son semillas de typing.com) y poco a poco pasa a tus datos reales.
- [ ] Metrónomo: suena y parpadea a un ritmo cómodo; los botones − y + cambian el pulso; la desviación en ms tiene sentido.
- [ ] Calentamiento completo (8 min): todos los ejercicios encadenan con pausa de 3 s.
- [ ] Estadísticas tras unos días: el mapa de calor marca tus teclas flojas; "Practicar teclas problemáticas" abre un entreno al momento.
- [ ] Hoy propone el entreno correcto cada día de la semana y muestra el motivo si baja el ritmo.

### Estado de la fase 2 (anterior)

**Fase 2 codificada (25 de octubre de 2026), pendiente de la puerta 2 de Lucas.** Repo: https://github.com/Dallamond/Txispa-Type. `npm run check` en verde (157 tests). La puerta 1 se verificó en navegador; falta que Lucas la dé por buena con el teclado real.

Qué hay:
- **Test** (30, 60, 120, 180 y 300 s) con motor por palabras (`lib/motor.ts`), modo estricto, puntuación y mayúsculas opcionales, resultado con comparación contra los últimos 10 y teclas y confusiones del test. Se guarda en IndexedDB.
- **Hoy** (anillo del objetivo, racha, media de 7 días con variación), **Estadísticas** (gráficas con media móvil, tabla de 14 días, historial ordenable y filtrable), **Calentar** (rutinas con los ejercicios disponibles, cursor fantasma, pausa de 3 s) y **Ajustes** (objetivo diario, exportar, importar y borrar).
- Verificado en navegador (Chrome, dev server, con datos sintéticos que ya se han borrado): tecleo y guardado de un test, ejercicios guiados y de texto con cursor fantasma, gráficas y tablas, sin errores de consola.

Qué NO se ha podido probar (lo pruebas tú, ver checklist): vocales con tilde con la tecla muerta (`´` + vocal), AltGr, la sensación del cursor fantasma y el tiempo real entre pulsaciones. La automatización del navegador teclea de golpe, así que ritmo constante y pares de letras solo están probados con tests unitarios.

Decisiones y notas:
- `CHARMAP` de Shellpath no contemplaba tildes ni diéresis; se añadieron con tecla muerta. El motor ignora la tecla `Dead` sin bloquearla para que el sistema componga la vocal; si en tu teclado no compone, avísame y paso a un campo de texto oculto.
- Modo estricto (la especificación no lo detallaba): la letra equivocada cuenta como fallo pero no entra, y el espacio no cierra una palabra incompleta.
- Los pares de letras usan `␣` para el espacio (p. ej. `e␣`).
- Las semillas de typing.com están en `data/semillas.ts` pero se usarán en la fase 3 (`debiles.ts`).
- Los calentamientos `alternancia`, `pares`, `escalera` y `metronomo` están definidos pero marcados como no disponibles hasta la fase 3; las rutinas estándar y completa los saltan.

Checklist manual de la fase 2:
- [ ] Teclear con acentos y ñ: á é í ó ú ü, mayúsculas con tilde y ñ. Comprobar que no cuenta fallo.
- [ ] AltGr y símbolos (el banco apenas los usa, pero no debe romperse nada).
- [ ] Cerrar la pestaña a mitad de un test y volver: no debe quedar nada guardado a medias.
- [ ] Recargar con Ctrl+R durante un test: no cuenta como fallo.
- [ ] Un test de 60 s a tu ritmo normal: ppm y precisión parecidas a las de typing.com con un texto parecido.
- [ ] Ver si "ritmo constante" y las teclas falladas del resultado tienen sentido.
- [ ] Exportar, borrar todo e importar: los intentos vuelven y no se duplican al importar dos veces.
- [ ] Calentamiento: estiramiento, escala y fila base con el cursor fantasma. ¿El fantasma ayuda o molesta?
- [ ] Estadísticas con 0 tests (estado vacío) y con varios días; cambiar el filtro de duración; ordenar el historial.
- [ ] Tema claro y tamaño de texto en Ajustes; ventana de portátil (~1280x720): el texto y el teclado caben sin scroll.
- [ ] Puerta 2: una semana con tres tests al día sin perder datos.



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

- [x] Pantalla Test con duraciones 30, 60, 120, 180 y 300 s, avance por palabras y conteo de errores como en Shellpath.
- [x] Captura por intento de tiempo por tecla, por par de letras y confusiones (`agregados.ts`) con tests.
- [x] `medidas.ts`: wpm neta y bruta, precisión, consistencia, con tests.
- [x] Pantalla de resultados: wpm, precisión, ritmo constante, comparación con la media de los últimos 10 y teclas más falladas del test.
- [x] Modo estricto opcional y opción de puntuación y mayúsculas.
- [x] Historial filtrable por duración y gráfica de ppm y precisión (con `grafica.ts`).
- [x] Pantalla Hoy con objetivo diario de tests, racha y media semanal.
- [x] Calentamiento rápido (`manos`, `escala`, `fila-base`, `lento`) con el motor de cursor fantasma.
- [x] Exportar e importar JSON.
- [x] Cargar las semillas de typing.com (V, X, U, Y).
- [x] Texto de respaldo suficiente: ampliar `data/textos.ts` hasta unos 60 párrafos.

**Hecho cuando:** Lucas completa tres tests al día durante una semana en Txispa Type, sin perder datos, y las cifras son comparables con las de typing.com (mismo orden de magnitud en un mismo texto).

**Puerta 2:** una semana de uso real sin pérdida de datos.

Checklist manual de la fase: teclear con acentos y ñ; AltGr y símbolos; cerrar la pestaña a mitad de un test y volver; recargar con Ctrl+R sin que cuente como fallo; exportar, borrar e importar.

## Fase 3: Entrenamiento dirigido

Que la app decida qué practicar.

- [x] `debiles.ts`: puntuación de teclas y pares con ventana de 30 intentos y normalización por intento, con tests.
- [x] `data/palabras.ts` con unas 1500 palabras comunes del español.
- [x] Fuentes de texto `debiles` y `alternancia` deterministas por semilla.
- [x] Pantalla Entrenar con duraciones y fuentes; guarda como `entreno`.
- [x] Calentamientos completos: los nueve ejercicios y las tres rutinas con pausas entre ejercicios.
- [x] Metrónomo con desviación media en ms.
- [x] Plan semanal y reglas de ajuste visibles en Hoy (`plan.ts`).
- [x] Estadísticas completas: mapa de calor, teclas y pares débiles con botón "Practicar", confusiones, mediana y peor test del día, tendencia, calendario.
- [x] Botón "Practicar teclas problemáticas" que lanza un entreno con un clic.

**Hecho cuando:** la pantalla Hoy propone cada día el entrenamiento correcto, los ejercicios usan datos reales de Lucas y todas las métricas de la sección 6 de la especificación se calculan con tests.

**Puerta 3:** dos semanas con la media semanal de ppm estable o subiendo.

## Fase 4: IA local

- [x] `ia.ts`: listado de modelos, generación con tiempo máximo, validación y reintento.
- [x] Ajustes de Ollama (URL, modelo, botón "detectar modelos").
- [x] Fuente `ia` en Entrenar y en el entreno del jueves.
- [x] Caché de los últimos 20 textos y aviso claro cuando se usa el banco como respaldo.
- [x] Documentar `OLLAMA_ORIGINS` y la cuestión de HTTP y HTTPS.

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

## Fase 6: Curso de HTML y CSS

Detalle en `docs/curso/` (`ROADMAP-CURSO.md`, `SPEC-FORMATO-LECCIONES.md` con las decisiones de §2b, `TEMARIO-HTML-CSS.md`). Se publica con push directo a `main` tras cada capítulo (despliega en GitHub Pages). Plan de push: P0 documentos, P1 contenido y validador, P2 motor, P3 primera lección, P4 módulo 1, P5 progreso, P6-P16 un módulo por push (M02-M12), P17 Hoy y estadísticas, P18 exportar/importar, P19 vista previa (opcional).

- [x] P0: documentos del curso versionados y decisiones C0 anotadas (§2b).
- [x] P1 / C1-2: `data/curso/tipos.ts` (y `index.ts` con `MODULOS`, `LECCIONES`, `buscarLeccion`).
- [x] P1 / C1-3: `scripts/generar-curso.mjs` (Markdown a `html.ts` y `css.ts`; falla con nº de línea) y script `npm run curso:generar`.
- [x] P1 / C1-4: `data/__tests__/curso.test.ts` con las validaciones de la §7 (191 pruebas).
- [x] P1 / C1-5: `npm run check` comprueba que los datos generados están al día con el temario.
- [x] P2: tokenización y motor de código (`lib/curso.ts`, `lib/motorCodigo.ts`, `crearIntentoLeccion`, `Fuente "curso"`, `Intento.leccionId` validado al importar). El Enter se guarda como `⏎` en las teclas y confusiones.
- [x] P3: pestaña Curso con `TecleoCodigo`, `AreaCodigo` y un resultado mínimo (`ResultadoLeccion`). Se activa el módulo M01 entero (5 lecciones y el repaso) en vez de solo L01.01. `plan.ts` ya no cuenta una lección como entreno del día. **Sin verificar en navegador** (la extensión de Chrome no estaba conectada): solo compila y pasan los tests de la lógica.
- [x] P4: resultado completo de la lección (`ResultadoLeccion`: ppm, precisión, errores, símbolos y confusiones con fallos, "Lección superada" con `leccionSuperada` ≥ 95 %, Repetir y Siguiente lección) y ajustes para pantallas estrechas. El resaltado de Enter, Shift y AltGr en el teclado virtual ya lo da `CHARMAP`. **Sin verificar en navegador.**
- [ ] P4b (pedido por Lucas): glosario de etiquetas con **notas laterales** en la línea activa (`data/curso/glosario.ts`) y módulo **Diccionario de etiquetas** (abrir, cerrar y significado comentado, por categorías, sin tildes en el código).
- [ ] P5: progreso, candados y ajuste "Desbloquear todo".
- [ ] P6-P16: módulos M02 a M12, uno por push.
- [ ] P17: Hoy y estadísticas. P18: exportar/importar. P19 (opcional): vista previa renderizada.

**Hecho cuando:** se puede completar el curso entero con el teclado físico, el progreso sobrevive a recargar y a exportar/importar, y el plan del día no cambia.

**P1, notas y checklist de Lucas:**
- El validador encontró que L10.02 (media queries) tenía 15 líneas; con tu visto bueno el límite de las lecciones pasó de 14 a 15. El contenido del temario no se ha modificado.
- La pestaña Curso aún no existe: P1 no cambia nada visible en la web. Solo hay que comprobar que el sitio desplegado sigue igual.
- [ ] Revisar que el sitio de GitHub Pages sigue funcionando tras el despliegue (pestaña Actions del repositorio en verde).

**P4, checklist de Lucas:**
- [ ] Al terminar una lección salen los símbolos con fallos (con `Enter ⏎` y `Espacio` con nombre) y las confusiones. Con 100 % de precisión no sale esa sección.
- [ ] "Siguiente lección" abre la que sigue y no aparece en la última de M01 (el repaso). Con < 95 % el botón primario es Repetir.
- [ ] AltGr y tilde: aún no hay código con `{ } [ ] @ #` en M01; se prueban con M06. Para comprobar ya la tecla muerta, hay que esperar al Diccionario.
- [ ] Ventana estrecha (< 640 px): el código se reduce y el listado de lecciones no se desborda.

**P3, checklist de Lucas (pestaña Curso, módulo M01):**
- [ ] La pestaña Curso aparece entre Entrenar y Logros y lista M01 con sus 6 elementos.
- [ ] Al abrir L01.01 se ve el código con la sangría puesta y el cursor en la primera letra. El reloj arranca con la primera pulsación.
- [ ] Teclear `<`, `>`, `/`, `"`, `=`: no cuentan fallo. `Enter` cierra la línea (se ve `⏎`) y el espacio cierra la palabra.
- [ ] Pulsar espacio donde toca Enter (o al revés) cuenta fallo y no avanza. Con una letra mal: se pone en rojo; Backspace la quita.
- [ ] La lección termina sola al dejar bien la última palabra y muestra ppm, precisión, errores y tiempo. Con ≥ 95 % dice "Lección superada".
- [ ] Enter en el resultado repite; Esc a mitad vuelve al listado sin guardar.
- [ ] La lección aparece en el historial de Inicio como "Curso", suma al tiempo de hoy y no marca el entreno del plan como hecho.
- [ ] Tema claro y una ventana estrecha: el código largo (L01.03) hace scroll horizontal en vez de romperse.

## Registro de decisiones

| Fecha | Decisión |
| --- | --- |
| 2026-10-25 | Web local con React, Vite y TypeScript, igual que Shellpath. Datos en el navegador. |
| 2026-10-25 | Texto en español con teclado ISO español. Calidad antes que velocidad. |
| 2026-10-25 | Los calentamientos no cuentan en las estadísticas. Los entrenos solo alimentan teclas, pares y confusiones. |
| 2026-10-25 | La IA local va en la fase 4: no bloquea sustituir a typing.com. |
| 2026-10-25 | Estiramiento de manos de 45 s: abrir 3 s, puño 1 s, 10 repeticiones (la primera versión decía 5 s y no cuadraba). |
