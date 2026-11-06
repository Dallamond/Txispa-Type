# Curso de HTML y CSS en Txispa Type: especificación de formato y motor

Estado: propuesta para aprobar por Lucas antes de programar. Complementa `docs/ESPECIFICACION-TECNICA.md` (que sigue siendo la fuente de verdad del resto) y se implementa según `docs/curso/ROADMAP-CURSO.md`.

## 1. Qué hay hoy y qué choca con el curso

Lectura del código actual (`repo/app/src`):

- `lib/motor.ts` (`MotorTecleo`) trabaja con una lista de **palabras**: el espacio cierra la palabra, no se vuelve atrás, y cualquier tecla de longitud distinta de 1 (incluido `Enter`) se ignora.
- `components/Tecleo.tsx` (≈ línea 124) se come `Enter` con `preventDefault`. Solo lo usa, tras acabar, para repetir.
- `lib/textos.ts` y `Entrenar.tsx` generan `palabras: string[]` troceando por `\s+`, así que **un salto de línea o una sangría se pierden**.
- `data/keyboard.ts` ya contiene todos los símbolos del curso en el teclado ISO español: `< > / " = # ; : { } ( ) [ ] @ - _ . , ! ' ` y `\ | ~` con AltGr. `CHARMAP["\n"]` ya apunta a `Enter`.
- `types.ts`: `Fuente` es `"banco" | "debiles" | "alternancia" | "ia" | "ejercicio"` e `Intento` ya admite `ejercicioId?`. `lib/plan.ts:252` excluye la fuente `"ejercicio"` del "entreno del día".

Conclusión: el contenido del curso (código con líneas y sangrías) **no cabe** en el modelo "lista de palabras separadas por espacio". Hay que añadir un modo de código al motor, sin tocar el comportamiento de los tests y entrenos actuales.

## 2. Decisiones que hay que tomar (con recomendación)

| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| D1 | Cómo se teclean los saltos de línea | (a) el usuario teclea `Enter` al final de cada línea; (b) el salto va implícito | **(a)**: `Enter` es una tecla más que entrenar, y `CHARMAP` ya la conoce. |
| D2 | Cómo se teclea la sangría | (a) teclear los espacios; (b) sangría automática, como en un editor | **(b)**: la app inserta la sangría al pasar de línea. Los espacios iniciales no se teclean ni cuentan. Evita errores de "cuántos espacios son" y el uso de `Tab`. |
| D3 | Qué tipo de intento es una lección | `modo: "entreno"` o `modo: "test"` | **`entreno`**: no mezcla velocidad de código con la media de ppm de texto (`mediaSemanal` solo usa tests). |
| D4 | Cómo se identifica | reutilizar `fuente: "ejercicio"` + `ejercicioId`, o fuente nueva | **Fuente nueva `"curso"` + campo `leccionId`**, para poder contar el curso en el plan del día sin tocar la lógica de `"ejercicio"` (calentamientos y metrónomo). |
| D5 | Dónde se guarda el progreso | almacén propio o derivado | **Derivado de los intentos** (función pura `progresoCurso(intentos, curso)`). No hay almacén nuevo y se sincroniza con Firebase gratis cuando llegue F1. |
| D6 | ¿Alimenta las teclas débiles? | sí / no | **Sí**: `<`, `>`, `{`, `}`, `"`, `=` son teclas débiles reales para programar. La media de ppm no se toca (solo tests). Si distorsiona el análisis de letras, filtrar por `fuente === "curso"` en `analizar()`. |
| D7 | Formato fuente del contenido | `.ts` a mano o Markdown | **Markdown parseable** (`docs/curso/TEMARIO-HTML-CSS.md`) + script que genera los `.ts`. Así el contenido se edita y revisa como texto. |

## 2b. Decisiones tomadas (6 de noviembre de 2026)

Aprobadas por Lucas al dar el visto bueno al plan de implementación. Se aplican las opciones recomendadas de la tabla anterior:

- **D1-D7:** `Enter` explícito; sangría automática; lección = `entreno`; fuente nueva `"curso"` con `leccionId`; progreso derivado de los intentos; las lecciones alimentan las teclas débiles (si distorsiona las letras, se filtra por fuente); el Markdown es la fuente del contenido.
- **Criterios de paso (semilla):** `acc ≥ 95` para "hecha"; 3 intentos válidos para "dominada".
- **C0-3:** pestaña propia **Curso**.
- **C0-4:** las lecciones cuentan para los minutos del día, pero no para el "entreno del día" de `plan.ts`.
- **Componente:** `TecleoCodigo.tsx` nuevo, en vez de un modo dentro de `Tecleo.tsx`. `Tecleo` está construido alrededor de una cuenta atrás y una lección termina al completar el código; así `Test`, `Entrenar` y `Calentar` no se tocan.
- **Publicación:** push directo a `main` (despliega en GitHub Pages) tras cada capítulo, con `npm run check` en verde. Los módulos M02-M12 se activan de uno en uno, y Lucas revisa cada uno antes del siguiente.

## 3. Formato del temario (Markdown, parseable)

El archivo `TEMARIO-HTML-CSS.md` es la fuente. Un script `app/scripts/generar-curso.mjs` lo convierte en `app/src/data/curso/html.ts` y `css.ts`. Gramática estricta:

````md
## M01 · Estructura básica de HTML5
Curso: html
Descripción: Una línea.

### L01.01 · Título de la lección
- tipo: leccion            # leccion | repaso
- dificultad: 1            # 1 a 5
- nuevas: `< > /`          # teclas o símbolos que se estrenan, separados por espacio
> Explicación breve (1 a 4 frases), una sola línea de cita.
> Se admiten varias líneas `>` seguidas; se unen con un espacio.

```html
<p>Código que se teclea.</p>
```
````

`nuevas` admite la palabra `ninguna` (lista vacía). Reglas del parser: un `## Mxx · …` abre módulo; un `### Lxx.yy · …` abre lección; `L01.R` es el repaso del módulo (`tipo: repaso`); el bloque de código es el primer bloque con vallas dentro de la lección; lo que no encaje con la gramática hace fallar el script con el número de línea.

## 4. Modelo de datos (TypeScript)

```ts
// src/data/curso/tipos.ts
export type CursoId = "html" | "css";

export interface Leccion {
  /** "L01.01"; el repaso del módulo es "L01.R". Único dentro del curso. */
  id: string;
  moduloId: string;           // "M01"
  titulo: string;
  tipo: "leccion" | "repaso";
  dificultad: 1 | 2 | 3 | 4 | 5;
  /** Símbolos que se estrenan en la lección (para el aviso previo y el teclado). */
  nuevas: string[];
  explicacion: string;
  /** Código tal cual, con "\n" y sangría de 2 espacios. Sin tabuladores. */
  codigo: string;
}

export interface Modulo {
  id: string;                 // "M01"
  curso: CursoId;
  titulo: string;
  descripcion: string;
  lecciones: Leccion[];
}
```

Cambios en tipos existentes (retrocompatibles):

```ts
// types.ts
export type Fuente = "banco" | "debiles" | "alternancia" | "ia" | "ejercicio" | "curso";
export interface Intento {
  // ...
  /** Si fuente === "curso": "html/L01.01". */
  leccionId?: string;
}
// lib/intento.ts: ConfigIntento admite leccionId y lo copia al intento (como ejercicioId).
```

Importante: ampliar `esIntentoValido` (lista F0-5 del roadmap) para validar `leccionId` (cadena corta con patrón `^(html|css)/L\d{2}\.(\d{2}|R)$`) y, cuando llegue Firebase, las reglas de Firestore.

## 5. Tokenización y motor de código

`lib/curso.ts` (puro, con tests) convierte el código de una lección en tokens:

```ts
export interface Token {
  /** Texto a teclear, sin espacios ni saltos. */
  texto: string;
  /** Lo que se teclea para cerrarlo: espacio, Enter o nada (último token). */
  cierre: " " | "\n" | "";
  /** Espacios de sangría que la app inserta al pasar a la línea siguiente (no se teclean). */
  sangriaSiguiente: number;
}
export function tokenizar(codigo: string): Token[];
```

Reglas de `tokenizar`:

1. Se parte por líneas. Los espacios iniciales de cada línea son sangría (no forman parte de ningún token).
2. Dentro de la línea se parte por un único espacio: cada trozo es un token con `cierre: " "`.
3. El último token de la línea cierra con `"\n"`; el último de la lección, con `""`.
4. `sangriaSiguiente` del último token de cada línea es la sangría de la línea siguiente.

Ejemplo:

```
<ul>
  <li>Pan</li>
</ul>
```

da `[<ul>·"\n"·2] [<li>Pan</li>·"\n"·0] [</ul>·""·0]`.

Motor (`lib/motorCodigo.ts`): mismo contrato que `MotorTecleo` (para reutilizar `Tecleo`, medidas, agregados y tests) pero con estas diferencias:

- El cierre de un token es **el carácter `cierre`** (espacio o `Enter`); se cuenta como pulsación correcta, igual que hoy el espacio. El cierre `""` termina la lección al completar el token.
- `key === "Enter"` se acepta como carácter de cierre `"\n"`. Hay que **dejar pasar `Enter` al motor** en `Tecleo.tsx` solo en modo código.
- Si el token está completo y se pulsa el cierre equivocado (espacio en vez de Enter o al revés), cuenta como fallo y no avanza.
- Modo estricto: igual que ahora (letra equivocada = fallo y no entra; el cierre no vale con el token incompleto).
- La sangría no se teclea; la vista la muestra ya puesta.
- La lección **termina** al completar el último token: el texto es finito, no hay "texto de relleno".
- Los atajos siguen filtrados con `esAtajo` (no tocar el `!e.altKey`: AltGr es Ctrl+Alt y de él salen `{ } [ ] @ # | \ ~`).

Pendiente de comprobar al implementar: la tecla muerta del acento `´` y de la comilla invertida `` ` `` en teclado español (`KeyboardEvent.key` puede llegar como `"Dead"`). El curso evita `` ` `` y `^`; las tildes sí se usan (con `´` + vocal, que `CHARMAP` ya modela).

## 6. Progreso, criterio de paso y desbloqueo

Todo en `lib/progresoCurso.ts`, funciones puras con test:

```ts
export type EstadoLeccion = "bloqueada" | "disponible" | "hecha" | "dominada";
export function progresoCurso(intentos: readonly Intento[], modulos: readonly Modulo[]): Map<string, EstadoLeccion>;
```

Criterios (valores **semilla**, ajustables; no son verdades sobre Lucas, ver `CLAUDE.md`):

- **Completada con éxito** = intento `fuente "curso"` de esa lección con la lección terminada y `acc ≥ 95`.
- **hecha** = al menos 1 intento completado con éxito.
- **dominada** = 3 intentos completados con éxito en días distintos o con `acc ≥ 98` y `wpm ≥ umbral` (umbral por dificultad, semilla `[8, 10, 12, 14, 16]`; se calibra con los datos reales de Lucas tras unas semanas).
- **Desbloqueo:** una lección se desbloquea al estar `hecha` la anterior del módulo; el primer elemento de un módulo, al estar `hecha` el repaso del módulo anterior. Ajuste "Desbloquear todo el curso" para saltarse el orden.
- **Repaso del módulo** (`L01.R`): documento completo de 12 a 20 líneas que combina lo aprendido.

## 7. Validaciones del contenido (test de Vitest que recorre todo el curso)

Cada lección debe cumplir, o el test falla con el id de la lección:

1. `id` y `moduloId` coherentes; ids únicos; dificultad entre 1 y 5.
2. Código de **6 a 25 líneas** (lecciones de 6 a 15, repasos de 12 a 25; el 15 se aprobó el 6-11-2026 por L10.02, que lleva dos media queries completas), sin líneas en blanco, sin tabuladores, sin espacios dobles dentro de una línea, sangría **múltiplo de 2**, sin espacios finales.
3. **Todos los caracteres** existen en `CHARMAP` (o son `\n`). Esto garantiza que se puedan teclear con el teclado ISO español.
4. HTML bien formado: etiquetas abiertas y cerradas en orden (salvo vacías: `br hr img meta link input`); CSS con llaves balanceadas y `;` al final de cada declaración.
5. `nuevas` solo contiene símbolos que aparecen en el código y que no se estrenan antes en el curso (el test calcula el orden de estreno).
6. `explicacion` de 1 a 4 frases.

## 8. Pantalla del curso (resumen; detalle en el roadmap)

- Nueva pestaña **Curso** en `PESTANAS` de `App.tsx`: dos cursos (HTML, CSS), módulos plegables y lecciones con su estado.
- Lección: explicación y símbolos nuevos arriba; debajo, `Tecleo` en modo código (líneas con sangría ya puesta, teclado virtual resaltando también `Enter` y `AltGr`).
- Resultado: ppm, precisión, errores por símbolo, ¿has pasado?, botón "Repetir" y "Siguiente".
- Opcional, pero muy útil para aprender: **vista previa renderizada** del código tecleado en un `<iframe sandbox srcdoc>` (sin scripts, sin red, compatible con "local primero").

## 9. Compatibilidad con lo ya planificado

- No añade dependencias.
- No toca `Test`, `Calentar` ni las fuentes existentes de `Entrenar`.
- `Hoy`/`plan.ts`: decidir (puerta C0-4) si las lecciones del curso cuentan para la meta de minutos (sí, ya cuentan por tiempo) y para el "entreno del día" (recomendado: **no**, para no pisar el plan de teclas débiles).
- Firebase (F1): el progreso se deriva de los intentos, así que sincroniza sin trabajo extra; solo hay que incluir `leccionId` en validación y reglas.
