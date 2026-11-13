# Cómo añadir otro curso

Cada curso es una carpeta de temario más una línea de registro. El motor, el progreso, los logros, el catálogo de la pestaña Cursos y la importación de intentos se alimentan solos.

1. **Temario.** Crea `docs/curso/<id>/TEMARIO-<NOMBRE>.md` con los módulos (formato de `SPEC-FORMATO-LECCIONES.md`, con `Curso: <id>` en cada módulo). El generador lee todos los `TEMARIO*.md` bajo `docs/curso/`.
   - **Cursos de código** (HTML, CSS, SQL…): lecciones de 6 a 15 líneas, repaso al final del módulo (`L01.R`). Las notas laterales salen del glosario (`data/curso/glosario.ts`, enrutado en `lib/glosario.ts`).
   - **Cursos de terminal** (Linux, y los que vengan): una línea por comando, con `- nota N:` por cada línea (una nota por línea, mismo número de notas que de líneas), y un jefe al final de cada módulo (`### L01.J · …`, `- tipo: jefe`, opciones `- opción ✔:` / `- opción ✘: … | razón` y el bloque con el comando correcto, que es lo que se teclea).
2. **Registro.** Añade el curso en `CURSOS` (`app/src/data/curso/tipos.ts`) con `nombre`, `descripcion` y, si hace falta, `requiere` (curso que hay que completar antes; debe ir antes en la lista). Si tiene un módulo libre (como el diccionario de HTML), márcalo en `LIBRES` de `data/curso/index.ts` con la clave `curso/módulo` (`html/M13`). Pon un emoji en `EMOJI_CURSO` de `lib/logros.ts` si quieres uno propio (los logros `curso-<id>` se generan solos).
3. **Generar.** `npm run curso:generar` crea `data/curso/<id>.ts` y actualiza `data/curso/generado.ts`. `npm run check` falla si los datos no están al día. El generador rechaza un `Curso:` que no esté en `CURSOS`, ids de módulo repetidos y jefes mal formados, con el archivo y la línea.
4. **Validador.** `data/__tests__/curso.test.ts` valida longitudes, sangría, caracteres tecleables en el teclado ISO español, símbolos nuevos, notas y jefes. Añade el rango de líneas del curso en `LONGITUD` y su cierre (`repaso` o `jefe`) en `CIERRE`; si es de código, también sus reglas de "bien formado".
5. **Comprobar.** `npm run check` y probar a mano con el ajuste `desbloquearCurso`.

El progreso se calcula a partir de los intentos (`fuente "curso"`, `leccionId` como `linux/L01.01`), así que no hay nada que migrar. Las claves de módulo son `curso/módulo`, por lo que `M01` puede repetirse entre cursos.
