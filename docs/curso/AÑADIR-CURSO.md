# Cómo añadir otro curso

El motor, los datos y las pantallas del curso no dependen de HTML ni de CSS más que en unos pocos puntos. Para añadir un curso nuevo (por ejemplo `js`):

1. **Temario.** Escribe los módulos en un Markdown con el mismo formato que `TEMARIO-HTML-CSS.md` (ver `SPEC-FORMATO-LECCIONES.md`), con `Curso: js` en cada módulo.
2. **Registro.** Añade el curso en `CURSOS` (`app/src/data/curso/tipos.ts`) con `nombre`, `descripcion` y, si hace falta, `requiere` (el curso que hay que completar antes; debe ir antes en la lista). Cada curso tiene su propia ruta de módulos y se muestra como una tarjeta en la pestaña Cursos. Un módulo libre (como el diccionario de HTML) se marca en `LIBRES` de `data/curso/index.ts` con la clave `curso/módulo` (`html/M13`). Los logros de curso (`curso-<id>`) se generan solos. Las claves de módulo son `curso/módulo`, así que `M01` puede existir en varios cursos.
3. **Generador.** En `app/scripts/generar-curso.mjs` hay que añadir el id en tres sitios: la expresión `Curso: (html|css)`, el objeto `porCurso` y los dos bucles `["html", "css"]` (pendiente de generalizar: fase 3); y apuntar `SALIDA` al archivo nuevo (`data/curso/js.ts`). Ejecuta `npm run curso:generar`.
4. **Datos.** En `app/src/data/curso/index.ts` importa `MODULOS_JS` y añádelo a `MODULOS`.
5. **Glosario.** Si el curso tiene notas laterales, añade su glosario en `data/curso/glosario.ts` y su enrutado en `lib/glosario.ts` (`notasDeLinea` distingue HTML y CSS por la propia línea).
6. **Validador.** `data/__tests__/curso.test.ts` valida longitud, sangría, caracteres tecleables y balanceo de llaves; revisa que los caracteres nuevos (p. ej. `` ` `` o `^`) se puedan teclear en un teclado ISO español.
7. **Comprobar.** `npm run check` y probar a mano con `desbloquearCurso` activado.

El progreso se calcula a partir de los intentos (`fuente "curso"`, `leccionId` como `js/L01.01`), así que no hace falta migrar nada guardado.

## Fusionar otro juego de mecanografía

Lucas quiere integrar más adelante otro juego suyo. Para que encaje: el motor de tecleo (`lib/motorCodigo.ts`) y la medición (`lib/intento.ts`) son puros y sin React; el guardado va por `Intento` con una `fuente` nueva. Antes de empezar hace falta la ruta del otro proyecto.
