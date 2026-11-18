# Backlog vivo de Txispa Type

Lista maestra de todo lo que se puede hacer, de lo pequeño a lo grande. **Aquí se anota cada idea nueva**; cuando una tarea se hace, se marca `[x]` con la fecha y se deja una línea de qué se hizo. `ROADMAP.md` (4/11) conserva el plan por fases F0-F4 y `MEJORAS.md` el detalle técnico M-01 a M-34; este archivo los referencia en vez de copiarlos. Las fases del proyecto y su estado siguen en `FASES.md`.

Creado el 18 de noviembre de 2026. Todo lo de aquí es propuesta hasta que Lucas lo apruebe; nada se hace "por cuenta propia" salvo lo ya acordado (ver "Ya aprobado").

**Leyenda.** Prioridad: 🔴 crítica · 🟠 alta · 🟡 media · 🟢 baja · 💭 idea sin decidir. Esfuerzo: **S** ≤ 2 h · **M** medio día · **L** 1-2 días · **XL** más. Quién: **C** Claude solo · **L** necesita a Lucas (arte, cuentas, teclado físico, decisión) · **C+L** mixto.

## Ya aprobado y en marcha (18/11/2026)

1. Limpieza de `index.css` (hex sueltos a tokens, reglas duplicadas) y carga diferida de pantallas (bundle ~529 KB). **C**
2. Rutas por hash (botón atrás, enlaces a pestañas) = ROADMAP F2-6. **C**
3. Generar las imágenes de la sección A. **L**
4. Mascota F y J: primero decidir el tono (ver B-1). **L**

---

## A. Imágenes y arte (las genera Lucas; Claude deja el hueco ya cableado)

Rutas en `app/public/img/`. Sin archivo se ve un marcador punteado, así que nada se rompe. Estilo: pastel sobrio azul grisáceo, **sin verde**, rejilla de fondo, sin texto dentro de la imagen.

| ID | Archivo | Dónde sale | Tamaño | Estado |
| --- | --- | --- | --- | --- |
| A-1 | `hero.webp` | Franja del hero de Inicio | 1600×600 | [ ] pendiente |
| A-2 | `ico-calentar.svg`, `ico-test.svg`, `ico-entrenar.svg`, `ico-cursos.svg` | 4 tarjetas del hero | 128×128 | [ ] pendiente |
| A-3 | `curso-html.webp`, `curso-css.webp`, `curso-linux.webp` | Tarjetas del catálogo de Cursos | 640×360 | [ ] pendiente |
| A-4 | `logo.svg` (+ versión 512) | Cabecera, favicon, manifest, Open Graph | 64 y 512 | [ ] pendiente |
| A-5 | `vacio.webp` | Estados vacíos (0 tests, sin ranking, sin cuenta) | 480×320 | [ ] pendiente |
| A-6 | `logro.webp` | Récord y lección superada | 480×320 | [ ] pendiente |
| A-7 | `ranking.webp` | Cabecera del Ranking | 480×320 | [ ] pendiente |
| A-8 | `mascota/f-*.webp`, `mascota/j-*.webp` | Hero, tutoriales, vacíos, logros (ver B) | 512×512 por pose | [ ] pendiente |
| A-9 | Iconos de módulo (texto, enlaces, tablas, formularios, flex/grid, red, permisos…) | Cabeceras de módulo en Cursos (hoy emojis/SVG simples) | 64×64 | 💭 opcional |
| A-10 | `og.png` (1200×630) | Vista previa al compartir el enlace | 1200×630 | [ ] pendiente |
| A-11 | Insignias de logros (bronce→diamante) | Pantalla de logros y toasts | 96×96 | 💭 opcional |
| A-12 | Imagen por curso nuevo (Git, SQL, Python…) | Catálogo | 640×360 | cuando haya curso |
| A-13 | Fondo/ilustración de cabecera por tema (oscuro/claro) | Cabecera y hero | — | 💭 |

Notas para generarlas: pedir siempre fondo transparente en los iconos y mascotas, formato WebP (o SVG si se puede), y la misma paleta en todas para que no desentonen. Si una imagen sale con texto, regenerarla: el texto va en la interfaz, no en la imagen.

---

## B. Mascota y personajes

Idea de Lucas (18/11): **las teclas F y J**, con sus protuberancias, como personajes principales que hablan entre sí en los tutoriales; doble sentido de las protuberancias.

- [ ] **B-1 💭 L:** decidir el tono: (a) humor picante pero sin pasarse, (b) "los dos topos que guían los dedos", (c) mezcla según contexto (limpio en pantalla, picante solo en easter eggs). Esto fija el diseño, el guion y la imagen. Recomendación: (c).
- [ ] **B-2 L:** hoja de personaje: nombres, personalidad (p. ej. F = la prudente que cuida la precisión; J = la impulsiva que quiere velocidad), 5-6 poses cada una (reposo, hablando, contenta, preocupada, celebrando, durmiendo). → A-8.
- [ ] **B-3 C:** componente `Mascota` (props: personaje, pose, texto) con burbuja de diálogo, accesible (texto real, no solo imagen), ocultable en Ajustes.
- [ ] **B-4 C+L:** guion de diálogo: bienvenida, primera vez en cada pestaña, tutorial del primer test, consejos según tus datos ("hoy fallas la V: ¿practicamos?"), mensajes al batir récord y al fallar racha. Los textos los propone Claude, Lucas los aprueba.
- [ ] **B-5 C:** tutorial inicial guiado (3-5 pasos) con F y J: dónde poner los dedos, para qué sirven las protuberancias, cómo es un test.
- [ ] **B-6 C:** reacciones en vivo: F y J comentan el resultado de un test (precisión baja → F regaña; récord → J celebra), con frecuencia limitada para no cansar.
- [ ] **B-7 C:** la mascota en estados vacíos, toasts de logros, subida de nivel y pantalla de lección superada.
- [ ] **B-8 💭:** animación sencilla (CSS, sin librerías): parpadeo, rebote al hablar. Respetar `prefers-reduced-motion`.
- [ ] **B-9 💭:** más personajes por curso (un icono-personaje para HTML, CSS, Linux: p. ej. `<`, `{ }`, `$`).
- [ ] **B-10 💭:** easter eggs (Konami, tecla F+J a la vez, 100 días de racha).
- [ ] **B-11 💭:** sonidos o "voces" de personaje (texto en burbuja con blips, apagado por defecto). Depende de F-1.

---

## C. Interfaz y estilo

- [x] **C-1** (18/11) Capas de cristal, paneles hundidos y hover/active reactivos: `styles/capas.css`.
- [ ] **C-2 C:** limpieza de `index.css` (aprobada). Mover colores hex a tokens, quitar duplicados, partir en archivos por área.
- [ ] **C-3 C+L:** revisión visual con Lucas pantalla a pantalla (Inicio, Estadísticas, Cursos, Test, Entrenar, Ranking, Ajustes) con capturas y ajustes finos de contraste y movimiento.
- [ ] **C-4 C:** tema claro: auditoría de contraste y de las capas (nunca verificado en navegador).
- [ ] **C-5 C:** ventana estrecha / móvil: auditoría de todas las pantallas (nunca verificado).
- [ ] **C-6 C:** tipografía: decidir una fuente propia (sin CDN: se incluiría en el repo, WOFF2 con licencia libre) o seguir con las del sistema.
- [ ] **C-7 C:** temas extra (p. ej. "tinta", "arena", "alto contraste") con el mismo sistema de tokens. Sin verde por defecto.
- [ ] **C-8 C:** microinteracciones del tecleo: sutil pulso en la tecla del teclado virtual, brillo al cerrar una palabra bien, shake mínimo al fallar (opcional en Ajustes).
- [ ] **C-9 C:** transición entre pestañas más cuidada y esqueletos (skeletons) mientras cargan las pantallas diferidas.
- [ ] **C-10 C:** estados vacíos con ilustración y siguiente paso claro en todas las pantallas.
- [ ] **C-11 C:** toasts consistentes para guardado, errores de sync, logros (ROADMAP F2-10).
- [ ] **C-12 💭 C:** modo "foco" que oculta cabecera y contadores durante el test.
- [ ] **C-13 💭 C:** personalizar la rejilla/fondo (intensidad, desactivar) y el efecto de cristal (desactivar para equipos lentos).

---

## D. Inicio, hero y navegación

- [ ] **D-1 C:** rutas por hash (`#/test`, `#/estadisticas`, `#/curso/html`) = F2-6.
- [ ] **D-2 C:** pantalla de bienvenida en el primer uso (qué es esto, qué hacer hoy) = F2-7.
- [ ] **D-3 C:** hero que cambia según contexto: sin datos → "haz tu primer test"; con racha → mensaje de racha; tras 3 días sin entrar → "vuelve con un calentamiento corto".
- [ ] **D-4 C:** tarjeta "siguiente mejor acción" única y destacada en Inicio, decidida por `plan.ts`.
- [ ] **D-5 C:** atajos de teclado globales (p. ej. `T` test, `E` entrenar, `?` ayuda) sin interferir con el tecleo.
- [ ] **D-6 C:** página/pestaña "Ayuda y cómo funciona" (glosario ppm/neta/bruta, qué cuenta y qué no, ranking).
- [ ] **D-7 💭 C:** buscador/paleta de comandos (`Ctrl+K`) para ir a cualquier lección o pantalla.
- [ ] **D-8 C:** mapa de nodos por curso (camino serpenteante, "estás aquí") según `REVISION-SHELLPATH.md` §4. Necesita ideas de Lucas.

---

## E. Cursos y contenido

- [ ] **E-1 C+L:** revisar los textos `paraQuien` y `nivel` de `data/curso/tipos.ts` (los redactó Claude).
- [ ] **E-2 C+L:** revisar los significados del glosario HTML/CSS (`data/curso/glosario.ts`, pendiente desde P4b).
- [ ] **E-3 C:** vista previa renderizada de lo tecleado (HTML/CSS) = P19 de la fase 6.
- [ ] **E-4 C:** filtro por curso en Estadísticas y teclas débiles de símbolos de código (resto de P17).
- [ ] **E-5 L:** probar `^` de L07.02 (tecla muerta) y AltGr `{ } [ ] @ #` con el teclado físico.
- [ ] **E-6 C:** mejor retroalimentación al fallar en código (qué símbolo fallaste y cómo se teclea en tu teclado ISO español).
- [ ] **E-7 C:** repasos espaciados: la app propone repetir lecciones que llevas tiempo sin tocar o con peor precisión.
- [ ] **E-8 C:** certificado/medalla al terminar un curso (imagen A-11 + página imprimible).
- [ ] **E-9 💭 C+L:** cursos nuevos, en orden de utilidad para Lucas (ASIR, homelab, Suiza/IT):
  - Git y GitHub (comandos y flujo)
  - Bash/scripting y atajos de terminal (continuación de Linux)
  - Redes (IPs, máscaras, comandos `ip`, `ss`, `nmap` básico)
  - SQL
  - Docker y Compose (homelab)
  - Python básico
  - JavaScript/TypeScript
  - Atajos de VS Code y de Windows
  - Teclado numérico y símbolos
  - Inglés técnico (palabras comunes de IT)
  Cada curso es una carpeta de temario más una línea en `CURSOS` (`docs/curso/AÑADIR-CURSO.md`). El temario se redacta con Lucas para que no haya contenido inventado.
- [ ] **E-10 💭:** cursos de otros usuarios / contenido comunitario (solo si se abre la plataforma, depende de G-9).
- [ ] **E-11 C:** exportar progreso del curso a Markdown para el vault de Obsidian (ver H-3).

---

## F. Práctica, tests y medición

- [ ] **F-1 C:** sonidos de tecla y error (`lib/audio.ts` de Shellpath), apagados por defecto; ajuste `sonidos` ya existe sin implementar.
- [ ] **F-2 C:** clasificar el tipo de error (vecina / omisión / añadida / transposición) = M-29, F3-1. Alimenta mejores entrenos.
- [ ] **F-3 C:** curva de mejora por tecla débil en el tiempo = F3-2.
- [ ] **F-4 C:** modo "sin errores" y modo "ráfagas" de 30 s = F3-9.
- [ ] **F-5 C:** textos propios (pegar un texto) con las mismas métricas = F3-11.
- [ ] **F-6 C:** texto con cifras, símbolos y mayúsculas como modos separados (hoy el banco apenas usa símbolos).
- [ ] **F-7 C:** modo "cita" y modo "código" real (fragmentos de TypeScript, Python, shell).
- [ ] **F-8 C:** objetivos con fecha y proyección ("a este ritmo, 55 ppm el 12/12") = F3-5.
- [ ] **F-9 C:** retos semanales personales (p. ej. "3 tests sobre 96 % de precisión esta semana").
- [ ] **F-10 C:** calibración inicial: un test guiado que fija tu nivel, tus teclas débiles reales y reemplaza las semillas de typing.com por tus datos.
- [ ] **F-11 💭 C:** teclado alternativo (Dvorak, Colemak, US) como opción, sin tocar el ISO español por defecto (regla de `CLAUDE.md`: no cambiar sin aviso).
- [ ] **F-12 💭 C:** importar histórico de typing.com o de Monkeytype (CSV) para no empezar de cero.
- [ ] **F-13 C:** resumen semanal en lenguaje natural (con IA local solo con agregados) = F3-6.
- [ ] **F-14 C:** exportar a CSV además de JSON = F3-7.
- [ ] **F-15 💭 C:** modo "espejo de ritmo": cursor fantasma que replica tu mejor test.
- [ ] **F-16 L:** comparar con typing.com en un mismo texto para validar las cifras (mismo orden de magnitud). Parte de la puerta 2.

---

## G. Gamificación, social y ranking

- [ ] **G-1 C:** toasts de logros y panel de subida de nivel (piezas de Shellpath: `useLogrosNuevos`, `LogroToast`, `SubidaEtapaPanel`).
- [ ] **G-2 C:** radar de habilidades (`StatsRadar`, `skillRadar` de Shellpath) en Cursos > Progreso.
- [ ] **G-3 C:** insignias visuales por logro (A-11) y vitrina en Progreso.
- [ ] **G-4 C:** rachas más ricas: congelar un día, racha semanal, calendario de racha.
- [ ] **G-5 L:** probar el ranking real contra Firebase (checklist en `RANKING.md`).
- [ ] **G-6 L:** decidir Blaze o Supabase antes de abrir el ranking al público (hoy el ppm se puede falsear en Spark). Afecta a G-7 y G-8.
- [ ] **G-7 XL:** ranking de XP con validación en servidor (Cloud Functions o Supabase).
- [ ] **G-8 XL:** reto diario con ranking (ROADMAP F4-9): semilla = fecha, mismo texto para todos, precisión mínima, alias público.
- [ ] **G-9 💭 XL:** abrir la plataforma a más usuarios: RGPD y privacidad (`REVISION-SHELLPATH.md` §7), moderación de alias, cuentas, borrado de datos.
- [ ] **G-10 💭:** amigos/ligas privadas con código de invitación; comparar ppm sin ranking público.
- [ ] **G-11 💭:** perfil público compartible (tarjeta con tus mejores marcas, imagen generada).

---

## H. Integraciones

- [ ] **H-1 L:** Firebase real: `.env.local`, publicar `firestore.rules`, activar correo/contraseña y Google (F1-12, checklists F2 y RANKING).
- [ ] **H-2 C+L:** Vercel: crear proyecto, variables `VITE_FIREBASE_*`, autorizar dominio en Firebase; `vercel.json` con cabeceras y CSP (M-14).
- [ ] **H-3 💭 C:** exportar resumen diario/semanal en Markdown con YAML para el vault de Obsidian (carpeta `journal/` o `raw/`), con el formato de `CLAUDE.md` del vault. Aprovecha que el tecleo es hábito diario.
- [ ] **H-4 💭 C:** enlace con Shellpath: botón "practicar este comando" que abre la lección de Linux equivalente.
- [ ] **H-5 💭 C:** servir la app desde el homelab (contenedor nginx + Proxmox) y copia de seguridad del JSON a OMV. Fase 5 original.
- [ ] **H-6 💭 C:** webhook/notificación de recordatorio diario (Notification API del navegador, opt-in) o evento de calendario `.ics` con la hora de práctica.
- [ ] **H-7 💭 C:** widget "racha" para incrustar (imagen SVG generada) en el README de GitHub o en una nota.
- [ ] **H-8 C:** IA local: probar Ollama de verdad y documentar HTTPS vs HTTP (F3-13, M-34).
- [ ] **H-9 💭 C:** IA para generar textos de curso o explicaciones (solo local, opcional).
- [ ] **H-10 💭:** Plausible/analítica propia: **descartado por regla** ("sin analítica"); solo se reabre si Lucas lo decide.

---

## I. Nube y backend (resumen; el detalle está en `PLAN_INTEGRACION_FIREBASE.md`)

- [ ] **I-1 C:** emulador de Firestore y tests de reglas (`@firebase/rules-unit-testing`, pedir permiso por dependencia) = F1-2. Hoy las reglas **no se han ejecutado nunca**.
- [ ] **I-2 L:** pasar las checklists de F2 y ranking (offline → online, dos navegadores, borrar todo).
- [ ] **I-3 C:** indicador de sincronización siempre visible = M-28 (hay `estadoSync.ts`; revisar que se vea en la cabecera).
- [ ] **I-4 C:** arreglar las limitaciones conocidas (relojes desfasados en ajustes, `increment` repetido tras cierre, cuenta distinta que no recibe lo pendiente) — ver `SESION-2026-11-15.md`.
- [ ] **I-5 C:** App Check (F4-4) y copias de seguridad programadas (F4-7).
- [ ] **I-6 💭 C:** compactar intentos antiguos por mes si el volumen lo pide (F4-5).
- [ ] **I-7 💭:** migrar a Supabase si se abre al público (decisión G-6).

---

## J. Calidad, rendimiento y mantenimiento

- [ ] **J-1 C:** carga diferida de pantallas y Firebase (aprobada) = F2-14, M-19. Bundle principal ~529 KB.
- [ ] **J-2 C:** memoizar `AreaTexto` y `VirtualKeyboard`, separar el cronómetro = M-18, F2-15.
- [ ] **J-3 C:** `analizar()` una sola vez = M-11.
- [ ] **J-4 C:** dividir `Estadisticas.tsx` (510 líneas) y `Tecleo.tsx` = M-10.
- [ ] **J-5 C:** tests de componentes (pedir permiso para jsdom + testing-library) o extraer lógica pura = M-15.
- [ ] **J-6 C:** test del almacén IndexedDB real (`fake-indexeddb`) = M-16.
- [ ] **J-7 C:** E2E con Playwright: teclear → guardar → recargar → resultado = F2-4.
- [ ] **J-8 C:** GitHub Actions que ejecute `npm run check` en cada push y avise si el despliegue de Pages falla.
- [ ] **J-9 C:** guardar una captura de referencia por pantalla (visual regression ligera) para detectar roturas del reskin.
- [ ] **J-10 C:** limpiar avisos de oxlint en `sincronizadorAjustes.test.ts`.
- [ ] **J-11 C:** deuda trivial restante (M-13): comentarios heredados de Shellpath, `formatoReloj` duplicado.
- [ ] **J-12 C:** `npm audit` periódico y fijar versiones de Firebase.

---

## K. Accesibilidad

- [ ] **K-1 C:** modal de ajustes con trampa de foco y devolución de foco (`<dialog>`) = M-22.
- [ ] **K-2 C:** anuncios `aria-live` de inicio/fin/resultado y tabla alternativa para mapa de actividad y de calor = M-23.
- [ ] **K-3 C:** auditoría con axe/Lighthouse; modo de alto contraste = F4-8.
- [ ] **K-4 C:** `prefers-reduced-motion` ya está en el CSS global; revisar que cubre las nuevas animaciones de `capas.css` y la mascota.
- [ ] **K-5 💭 C:** opción de fuente para dislexia y tamaños extra de texto.

---

## L. PWA, despliegue y SEO

- [ ] **L-1 C:** `manifest.webmanifest`, `theme-color`, iconos PNG, Open Graph (A-4, A-10) = F2-18.
- [ ] **L-2 C:** service worker para uso offline desde la primera visita = F2-19.
- [ ] **L-3 C:** PWA instalable con sincronización en segundo plano = F4-3.
- [ ] **L-4 L:** comprobar que GitHub Pages despliega bien tras cada push (pestaña Actions) y decidir Pages vs Vercel como destino único.
- [ ] **L-5 💭:** dominio propio.

---

## M. Documentación

- [ ] **M-1 C:** mantener este archivo y `FASES.md` al día en cada sesión (regla de cierre).
- [ ] **M-2 C:** `README.md`: sección "qué es" con capturas cuando existan las imágenes.
- [ ] **M-3 C:** guía de contribución de contenido (cómo añadir lecciones, imágenes y personajes).
- [ ] **M-4 C:** archivar `ESTADO.md` y `ESTADO_DEL_PROYECTO.md` (desfasados) y dejar `FASES.md` + este backlog como única fuente de estado.

---

## Orden sugerido (propuesta, no compromiso)

1. **Ya:** C-2, J-1, D-1 (aprobados), y Lucas genera A-1 a A-4.
2. **Tras ver las imágenes:** C-3 (revisión visual con Lucas), C-4, C-5.
3. **Mascota:** B-1 y B-2 con Lucas; luego B-3 a B-5.
4. **Nube real:** H-1, I-1, I-2 (lo que más código sin verificar acumula).
5. **Producto:** F-10 (calibración), F-2 (tipos de error), G-1/G-2 (logros y radar), D-2/D-3 (bienvenida y hero contextual).
6. **Cursos nuevos (E-9):** empezar por Git o Redes (más útiles para ASIR).
7. **Apertura pública (G-6 a G-9):** solo tras decidir Blaze o Supabase.

## Registro de ideas nuevas

Añade aquí, con fecha, lo que vaya saliendo antes de clasificarlo en su sección.

- 18/11/2026: F y J como mascotas con doble sentido (→ B). Hero plegable (hecho). Estadísticas como pestaña con mapa de actividad en Inicio (hecho). Reskin de capas (hecho, C-1).
