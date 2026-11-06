# Estado del proyecto (actualizado el 6 de noviembre de 2026)

> La sección del curso se actualiza en cada push. El resto del documento es la copia del 27 de octubre de 2026; el análisis técnico del 4 de noviembre está en `ESTADO_DEL_PROYECTO.md`.

## Cursos (pestaña Curso)

**Curso de HTML y CSS:** se aprende tecleando código real. Cada línea se cierra con `Enter`, la sangría la pone la app, el cierre de cada palabra es el espacio, y al lado de la línea activa aparece el significado de sus etiquetas, atributos, selectores o propiedades. Una lección se supera con ≥ 95 % de precisión (la velocidad no cuenta para pasarla); se domina con 98 % y 8-16 ppm según su dificultad, o superándola en 3 días distintos.

| Módulo | Contenido | Estado |
| --- | --- | --- |
| M01 | Estructura básica de HTML5 (5 + repaso) | Abierto |
| M02 | Texto: encabezados, párrafos, formato | Abierto |
| M03 | Enlaces, imágenes y listas (estrena `#` y `@` con AltGr) | Abierto |
| M04 | Tablas y formularios | Abierto |
| M05 | Multimedia, semántica y accesibilidad | Abierto |
| M06 | Fundamentos de CSS (estrena `{ } ;`, `*`, `[ ]`, `'`) | Abierto (P10) |
| M07 | CSS: modelo de caja, bordes y sombras (estrena `%`) | Abierto (P11) |
| M08 | CSS: display y posicionamiento | Abierto (P12) |
| M09 | CSS: Flexbox y Grid | Abierto (P13) |
| M10 | CSS: diseño adaptable | Abierto (P14) |
| M11 | CSS: transiciones, transformaciones y animaciones | Abierto (P15) |
| M12 | CSS: buenas prácticas y proyecto final | Abierto (P16) |
| M13 | Diccionario de etiquetas HTML (módulo libre, cada etiqueta abierta, cerrada y comentada) | Abierto |

- **Dónde está:** contenido en `docs/curso/TEMARIO-HTML-CSS.md` (fuente) → `npm run curso:generar` → `app/src/data/curso/{html,css}.ts`. Lógica en `lib/curso.ts` (tokens, superada), `lib/motorCodigo.ts` (motor), `lib/progresoCurso.ts` (estados y desbloqueo) y `lib/glosario.ts` (notas laterales). Pantallas: `components/{Curso,TecleoCodigo,AreaCodigo,ResultadoLeccion}.tsx`. Módulos visibles en `data/curso/activos.ts`.
- **Datos:** no hay almacén nuevo. Cada lección tecleada es un intento (`fuente "curso"`, `modo "entreno"`, `leccionId` como `html/L01.01`); el progreso se calcula a partir de ellos, así que exportar/importar lo conserva. Las lecciones suman al tiempo del día, pero no cuentan como entreno del plan ni para la media de ppm. Nuevo ajuste `desbloquearCurso` en `txispatype.settings.v1`.
- **Calidad:** `npm run check` incluye que los datos generados estén al día con el temario y un test que valida las 71 lecciones (longitud, sangría, caracteres tecleables, etiquetas y llaves balanceadas, símbolos nuevos, explicaciones) y que todo lo usado tiene nota en el glosario.
- **Sin verificar en navegador por Claude** (la extensión de Chrome no conecta): lo prueba Lucas. Pendiente de su revisión: los textos del glosario y del diccionario, y el temario M06-M12. Checklists en `docs/FASES.md`, Fase 6.
- **Pendiente del curso:** abrir M07-M12, tarjeta "Siguiente lección" en Inicio, filtro de estadísticas por curso, símbolos de programación como teclas débiles, vista previa renderizada (opcional), y más cursos (ver `docs/curso/AÑADIR-CURSO.md` cuando exista).
- **Futuro:** Lucas quiere fusionar otro juego de mecanografía que ya creó; mantener motor, datos y pantalla desacoplados.

## Resumen

- **Objetivo:** sustituir a typing.com en la práctica diaria y subir de ~46 ppm a 65 (70 en mejores tests), cuidando la precisión.
- **Stack:** Vite + React 19 + TypeScript, datos en el navegador (IndexedDB para intentos, localStorage para ajustes). Sin backend, sin internet salvo Ollama en localhost (opcional).
- **Repo:** https://github.com/Dallamond/Txispa-Type — todo subido, incluyendo este doc.
- **Calidad:** `npm run check` en verde (tsc + oxlint + **268 tests** de Vitest + build).

## Fases

| Fase | Contenido | Estado |
| --- | --- | --- |
| 1 · Cimientos | Repo, código de Shellpath (renombrado cpm/wpm), IndexedDB, tokens de estilo, teclado virtual, pestañas | ✅ Codificada y verificada |
| 2 · MVP diario | Tests 30-300 s, resultados con comparación, historial, gráficas, exportar/importar | ✅ Codificada; puerta 2 (semana con 3 tests/día) en manos de Lucas |
| 3 · Entrenamiento dirigido | `debiles.ts`, 1566 palabras, Entrenar, metrónomo, plan semanal, mapa de calor, calendario | ✅ Codificada; puerta 3 pendiente |
| 4 · IA local | `ia.ts` con Ollama: listar modelos, generar, validar, caché de 20 textos | ✅ Codificada; sin probar con un Ollama real |
| 5 · Extras | Insignias/XP, sonidos, homelab/sincronizar, resumen semanal IA, modo comandos Linux, tipo de error por tecla | ✗ Solo a petición expresa |

## Estado de la app (sesiones del 27-10-2026)

Estructura de navegación actual: **Inicio, Calentar, Test, Entrenar** + ruedecita de ajustes.

### Inicio = Hoy + Estadísticas fusionadas
Plan del día, tiempo de práctica, y todas las estadísticas (Resumen, Teclas y errores, Historial) en la misma pestaña. El botón "Ver estadísticas" del plan baja con scroll en la misma página. El logo lleva a Inicio.

### Tarjeta superior de Inicio (ampliada hoy)
- Anillo de tests hoy / meta con leyenda nueva.
- Días de racha, ppm media 7 días con precisión y variación semanal.
- Mejor test de la semana (solo con precisión ≥ 95 %).
- Pulsaciones de hoy (tests + entrenos).
- Barra de tiempo de hoy integrada abajo (antes tarjeta aparte, ahora sin duplicar).

### Ajustes como panel flotante
Sin pestaña: botón de engranaje en la cabecera. Abre panel modal (círculo de fondo, botón Cerrar, clic fuera y Esc lo cierran). Dentro: tema, tamaño, teclado, metas, Ollama, exportar/importar, borrar todo.

### Cambios de medición y de UI de hoy
- Meta de tiempo diario elegible desde la **cabecera**: el contador "tiempo de hoy" abre (ratón o teclado) una lista de **5/10/15/20/30/45/60 min**; guarda solo (sin huecos que la cierren al cruzar) una meta-pop pegada al contador.
- **El tiempo vivido cuenta aunque el test no se acabe:** al abandonar con Esc, o cerrar la pestaña a mitad de un test o entreno, los segundos empezados se suman a la meta del día (`txispatype.tiempoextra.v1` en localStorage, con reinicio de día). Los tests completos cuentan una sola vez por intento; los calentamientos no cuentan como tiempo.
- Texto de las pruebas: **2,1 rem, columna de 46 ch y 5 líneas** visibles.
- Teclado separado del texto (margen de 40px).
- Cabecera fija: tiempo de hoy (reloj, meta y barra en vivo) + contador global de pulsaciones en vivo.

## Claves de almacenamiento

| Clave | Contenido |
| --- | --- |
| `txispatype.*` (IndexedDB) | Intentos con teclas, pares y confusiones |
| `txispatype.settings.v1` | Ajustes (objetivo min/tests, tema, zoom, teclado, Ollama) |
| `txispatype.calentamiento.v1` | Total de pulsaciones de calentamientos |
| `txispatype.tiempoextra.v1` | Segundos de sesiones que no terminaron, del día en curso |
| `txispatype.ia.v1` | Caché de los últimos 20 textos de IA |

## Fórmulas clave (fuente de verdad: ESPECIFICACION-TECNICA.md)

- **ppm** = (caracteres correctos ÷ 5) ÷ minutos (neta y bruta).
- **Precisión** = correctos ÷ (correctos + errores).
- **Consistencia** = 1 − CV de los intervalos entre pulsaciones (20 intervalos mínimo).
- **Debilidad de tecla/par** = ventana de 30 intentos: errores × 10 + lentitud relativa × 1,5; umbral 0,15.
- Sin revisiones sin conos: los intentos permiten una auditoría total: cada pulsación del intento guarda esperado/escrito/falta.

## Mejoras sugeridas (orden recomendado)

1. Checklist manual del tecleo (tildes/ñ/AltGr) y puertas 2 y 3.
2. Clasificar el tipo de error (vecina/omisión/añadido/transposición) — alimenta todo lo demás.
3. Curva de mejora por tecla débil; resumen semanal con IA (solo agregados); insignias; sonidos.

## Checklist manual pendiente (docs/FASES.md secciones Test / cabecera / calentamientos)

Ciertas cosas solo las puede probar Lucas: tildes con tecla muerta, AltGr, sensación del cursor fantasma, metrónomo, tema claro con todas las pantallas, y el botón de ruedecita y el panel de Inicio con la navegación de los ajustes.

## Registro de decisiones de la sesión 27-10-2026

1. El tiempo vivido (aunque el test no acabe) cuenta para la meta del día; guardado en `tiempoextra` con fecha, y reinicio automático cada día.
2. La meta de minutos se elige desde la cabecera: la tarjeta duplicada del resumen pasa a ser la misma elección, y el panel de ajustes mantiene su propia meta (mismos datos).
3. Inicio = Hoy + Estadísticas. Ajustes = modal con ruedecita. Nada cambia de las reglas del motor ni de las fórmulas.
4. Todo lo anterior subido a GitHub main.
