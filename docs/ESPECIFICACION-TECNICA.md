# Especificación técnica

Fuente de verdad técnica del proyecto. Si algo contradice a la hoja de proyecto, manda este documento y se anota el cambio en `FASES.md`. Los valores marcados como "inicial" son punto de partida y se calibran con datos reales.

## 1. Stack y estructura

React 19, Vite, TypeScript, Vitest y oxlint, con las versiones de `Shellpath/app/package.json`. Sin otras dependencias.

```
app/src/
├── lib/                 lógica pura, una función = una responsabilidad
│   ├── typing.ts        (copiado de Shellpath)
│   ├── rng.ts           mulberry32 y newSeed
│   ├── medidas.ts       wpm, precisión, consistencia
│   ├── agregados.ts     claves, pares y confusiones por intento
│   ├── debiles.ts       puntuación de teclas y pares, ventana de datos
│   ├── textos.ts        generación de texto: banco, débiles, alternancia
│   ├── calentamientos.ts rutinas y ejercicios (datos)
│   ├── plan.ts          foco semanal y reglas de ajuste
│   ├── estadisticas.ts  media semanal, mediana, peor test, tendencia, racha
│   ├── ia.ts            cliente de Ollama y validación del texto
│   ├── almacen.ts       interfaz RunStore + IndexedDB + memoria (tests)
│   ├── ajustes.ts       localStorage
│   ├── exportar.ts      exportar e importar JSON
│   └── __tests__/
├── data/                keyboard.ts, textos.ts, palabras.ts, semillas.ts
├── hooks/
├── components/          Hoy, Calentar, Test, Entrenar, Estadisticas, Ajustes, Teclado
└── App.tsx
```

## 2. Modelo de datos

```ts
type Modo = "test" | "entreno";          // los calentamientos NO se guardan
type Fuente = "banco" | "debiles" | "alternancia" | "ia" | "ejercicio";

interface TeclaStat {
  n: number;      // pulsaciones esperadas con esa tecla
  e: number;      // errores (se pulsó otra cosa o faltó al cerrar la palabra)
  ms: number;     // suma de intervalos válidos (ms)
  msN: number;    // número de intervalos válidos
}

interface ParStat { n: number; ms: number }

interface Intento {
  id: string;              // crypto.randomUUID()
  date: string;            // ISO-8601
  localDate: string;       // "YYYY-MM-DD" en hora local (Europe/Madrid)
  modo: Modo;
  fuente: Fuente;
  ejercicioId?: string;    // si fuente === "ejercicio"
  durationSec: number;     // duración elegida
  elapsedSec: number;      // tiempo real desde la primera pulsación
  seed: number;
  estricto: boolean;
  correct: number;         // caracteres correctos (incluye el espacio de cierre)
  errors: number;          // errores permanentes
  wpm: number;             // netas, 1 decimal
  rawWpm: number;          // brutas, 1 decimal
  acc: number;             // 0-100, 1 decimal
  consistency: number | null; // 0-100 o null si hay pocos datos
  teclas: Record<string, TeclaStat>;   // clave: carácter en minúscula, espacio = "␣"
  pares: Record<string, ParStat>;      // clave: dos caracteres, p. ej. "er"
  confusiones: Record<string, number>; // clave: "esperada>escrita", p. ej. "v>b"
}

interface Ajustes {
  tema: "oscuro" | "claro";
  zoom: number;
  tecladoVisible: boolean;
  guiaDedos: boolean;
  objetivoTests: number;      // por defecto 3
  estrictoPorDefecto: boolean;
  puntuacionYMayusculas: boolean;
  duracionPorDefecto: 30 | 60 | 120 | 180 | 300;
  rutinaCalentamiento: "rapida" | "estandar" | "completa";
  sonidos: boolean;           // fase 5
  ollamaUrl: string;          // por defecto "http://localhost:11434"
  ollamaModelo: string;
}
```

Almacenamiento:

- `txispatype.runs` en **IndexedDB** (base `txispatype`, almacén `intentos`, clave `id`, índices `localDate` y `date`). Un intento con teclas y pares ocupa unos 3-5 KB: con 4 tests y un entreno al día son varios MB al año, demasiado para el límite de localStorage. Se pide `navigator.storage.persist()`.
- `txispatype.settings.v1` en localStorage.
- `txispatype.ia.v1` en localStorage: últimos 20 textos generados por la IA, para no repetir.
- Esquema versionado (`schema: 1`). Si cambia el significado de un campo, se migra al leer, nunca se borra.
- Todo acceso pasa por la interfaz `RunStore { list, add, clear, importMany, subscribe }`. En los tests se usa la versión en memoria.

Exportar e importar: JSON `{ app: "txispa-type", schema: 1, exportedAt, intentos, ajustes }`. Al importar se fusiona por `id` y no se duplican intentos.

## 3. Fórmulas

Una palabra son 5 caracteres, contando el espacio.

- `elapsed` = `min(tiempo real desde la primera pulsación, durationSec)`, mínimo 1 s.
- `wpm` (neta) = `(correct / 5) / (elapsed / 60)`.
- `rawWpm` = `((correct + errors) / 5) / (elapsed / 60)`.
- `acc` = `correct / (correct + errors) × 100`; 100 si no hay pulsaciones.
- Un error es una pulsación distinta de la esperada, o una letra que falta al cerrar una palabra con espacio. Borrar no devuelve el error. Máximo 8 letras de más por palabra (`EXTRA_MAX`).
- **Intervalo válido:** tiempo entre dos pulsaciones consecutivas **correctas**, entre 1 y 2000 ms. Las pausas largas se descartan.
- **Consistencia:** con los intervalos válidos (mínimo 20), `CV = desviación / media` y `consistency = clamp(100 × (1 − CV / 1.6), 0, 100)`. Valor inicial heurístico; si no hay 20 intervalos, `null`.
- **Tiempo por tecla:** el intervalo de una pulsación correcta se suma a la tecla esperada (`ms`, `msN`) si la pulsación anterior también fue correcta.
- **Pares:** el intervalo de una pulsación correcta se suma al par `anterior + actual` si ambas son letras o espacio y ambas fueron correctas.
- **Confusiones:** cuando se pulsa un carácter distinto del esperado, se suma 1 a `esperada>escrita` (ambas en minúscula). Las letras omitidas y las de más no generan confusión.

### Teclas y pares débiles

Ventana: los últimos 30 intentos (`test` y `entreno`), ajustable.

Para evitar que un entreno lento distorsione la latencia, la latencia de cada tecla se normaliza por intento: `latRel = (ms/msN de la tecla en ese intento) / (media de ms/msN del intento)`. Se agrega ponderando por `msN`.

- Mínimo 20 pulsaciones y 10 intervalos en la ventana para evaluar una tecla.
- `errRate = e / n`.
- `slow = max(0, latRel − 1)`.
- `puntuacion = 10 × errRate + 1.5 × slow`.
- Tecla débil si `puntuacion ≥ 0.15`. Se muestran como máximo las 8 más altas.
- Par lento: mínimo 6 repeticiones y `latRelPar ≥ 1.25`. Se muestran los 10 peores.

**Valores iniciales (semillas):** hasta que haya 100 pulsaciones propias de una tecla, se suma una semilla de 50 pulsaciones pseudo con las tasas de typing.com: V 17%, X 11%, U 9%, Y 8%. Se ven marcadas como "semilla" en estadísticas. Archivo: `data/semillas.ts`.

## 4. Generación de texto

Todo es determinista a partir de `seed` (mulberry32), para poder repetir un texto exacto.

- **banco:** párrafos de `data/textos.ts` en orden barajado, devueltos como lista de palabras. Mínimo 700 palabras por intento.
- **debiles:** palabras de `data/palabras.ts` (objetivo: 1500 palabras comunes del español) con peso `1 + 3 × boost(palabra)`. `boost = Σ pesoLetra × 1.2 + Σ pesoPar × 2`, dividido entre `√longitud`, con `pesoLetra = min(puntuacion, 6)` y `pesoPar = latRelPar − 1`. Si no hay teclas débiles, cae al banco.
- **alternancia:** palabras en las que al menos el 70% de los pares de letras consecutivos cambian de mano. Mano izquierda = dedos 0-3 del mapa de `keyboard.ts`; derecha = dedos 4-7.
- **ia:** ver sección 8.
- Opción "puntuación y mayúsculas": se agrupan las palabras en frases de 6 a 12, con mayúscula inicial, punto final y alguna coma. Sin ella, solo minúsculas.
- Caracteres permitidos en cualquier texto: letras del español, dígitos, espacio y `. , ; : ¿ ? ¡ ! ( ) " ' -`. Sin guiones largos, comillas tipográficas ni saltos de línea.

## 5. Calentamientos

Datos en `lib/calentamientos.ts`. Los calentamientos no se guardan ni cuentan para ninguna estadística. Tipos: `guiado` (temporizador con instrucciones, sin teclear) y `texto` (se teclea, con cursor fantasma opcional que marca el ritmo objetivo).

| id | Nombre | Segundos | Tipo | Detalle |
| --- | --- | --- | --- | --- |
| `manos` | Estiramiento de manos | 45 | guiado | Abrir 3 s con dedos separados, puño 1 s, repetir 10 veces. |
| `arana` | Araña | 30 | guiado | Manos planas sobre la mesa; levantar cada dedo en orden, de pulgar a meñique, alternando manos. Indicador del dedo en turno. |
| `escala` | Escala del teclado | 30 | texto | `abcdefghijklmnñopqrstuvwxyz` y a la inversa, despacio. Meta: 0 errores. |
| `fila-base` | Fila base lenta | 60 | texto | Combinaciones de `a s d f j k l ñ` al 60% de tu `wpm` medio, con cursor fantasma. |
| `alternancia` | Alternancia de manos | 60 | texto | Palabras de la fuente `alternancia`. |
| `pares` | Pares débiles | 60 | texto | Fuente `debiles` solo con pares. Si no hay datos, `alternancia`. |
| `lento` | Texto lento | 60 | texto | Banco al 80% de tu `wpm` medio, con cursor fantasma. Meta: 0 errores. |
| `escalera` | Escalera de palabras | 90 | texto | Palabras de 2 a 10 letras en orden creciente, cada una repetida 5 veces. |
| `metronomo` | Metrónomo | 60 | texto | Pulso audible y visual a `wpm_objetivo × 5 / 60` pulsaciones por segundo. Se muestra la desviación media respecto al pulso en ms. |

Rutinas: `rapida` = manos, escala, fila-base, lento (195 s); `estandar` = los 7 primeros (345 s); `completa` = los 9 (495 s). Entre ejercicios hay una pausa de 3 s con cuenta atrás y un botón para saltar.

**Cursor fantasma:** un marcador que avanza por el texto a un `wpm` objetivo. No es obligatorio seguirlo; sirve de referencia visual. Valor inicial del `wpm` objetivo = media semanal de tests × porcentaje del ejercicio; si aún no hay datos, 46.

## 6. Estadísticas

Solo cuentan los intentos con `modo === "test"` para velocidad. Los de `entreno` alimentan teclas, pares y confusiones.

- **Media semanal:** media de `wpm` de los tests de los últimos 7 días naturales.
- **Mediana del día** y **peor test del día:** por `localDate`.
- **Tendencia:** pendiente de la regresión lineal de las medias semanales de las últimas 8 semanas, en wpm por semana. Variación frente a la semana anterior en %.
- **Racha:** días consecutivos con `tests del día ≥ objetivoTests`. Si hoy aún no se ha cumplido, la racha no se rompe hasta que acabe el día.
- **Objetivo del día:** tests hechos / `objetivoTests`. Tiempo activo del día como dato secundario.
- **Mapa de calor del teclado:** color por `puntuacion` de cada tecla; gris si hay pocos datos.
- **Confusiones:** las 10 más repetidas, con su porcentaje sobre el total de errores.
- **Calendario mensual** con los días cumplidos unidos por una línea (como el de typing.com).
- Gráficas con `lib/grafica.ts` de Shellpath: ppm y precisión por intento, con media móvil de 5.

## 7. Reglas de ajuste (`lib/plan.ts`)

- Precisión semanal < 95% → la semana siguiente el porcentaje del texto lento y de la fila base baja 10 puntos relativos (de 80% a 72%, de 60% a 54%).
- Precisión ≥ 97% tres días seguidos → el porcentaje del texto lento sube 5 puntos relativos.
- Sin tests ese día → el plan de la semana no se desplaza: el foco depende del día de la semana, no de lo hecho.
- Las reglas se muestran en la pantalla Hoy con su motivo ("Esta semana, 10% más despacio: tu precisión fue 94%"). El usuario puede desactivarlas en Ajustes.

Foco semanal (día → foco → fuente del entreno de 12 minutos): lunes precisión (banco al 80%), martes pares débiles, miércoles alternancia, jueves volumen (ia, o banco si no hay Ollama), viernes ritmo (metrónomo), sábado ligero (teclas débiles 6 min), domingo medición (un test de 60 s y otro de 120 s).

## 8. IA local (fase 4)

- `GET {ollamaUrl}/api/tags` para listar modelos. `POST {ollamaUrl}/api/generate` con `{ model, prompt, stream: false, options: { temperature: 0.8 } }`, tiempo máximo 30 s.
- Prompt base: "Escribe un texto corrido en español de unas 70 palabras, natural y variado, sobre un tema cotidiano, tecnología o naturaleza. Usa muchas palabras que contengan las letras: {letras débiles}. Sin títulos, sin listas, sin markdown, sin comillas, sin saltos de línea. Devuelve solo el texto."
- Validación obligatoria antes de usarlo: entre 250 y 600 caracteres, solo caracteres permitidos (sección 4), al menos dos frases, sin repetir un texto de los últimos 20. Si no pasa, un reintento; si vuelve a fallar, se usa el banco y se avisa en pantalla.
- Se guarda el texto usado en `txispatype.ia.v1` y su hash en el intento (`seed` no basta aquí, porque el modelo no es determinista).
- **CORS:** Ollama exige `OLLAMA_ORIGINS` con el origen de la web. Si la app se sirve por HTTPS desde el homelab, el navegador bloqueará la llamada a `http://localhost` o a otra IP en HTTP (contenido mixto). Opciones: servir la app por HTTP en la LAN, o poner Ollama detrás del mismo proxy con HTTPS. Decisión pendiente de Lucas (ver `README.md`).
- Fase 5: resumen semanal en lenguaje natural (el modelo recibe solo agregados, nunca texto tecleado).

## 9. Pantallas

1. **Hoy:** plan del día (calentamiento → entrenamiento → 3 tests → revisión), objetivo diario con anillo y racha, reglas de ajuste activas, acceso rápido a cada paso.
2. **Calentar:** elegir rutina o ejercicio suelto; ejercicio actual a pantalla casi completa; temporizador; botón saltar.
3. **Test:** duración, texto central con la palabra activa visible, medidor en vivo (tiempo, ppm, precisión), teclado plegable, resultados al terminar con comparación contra los últimos 10 y teclas más falladas del test. Esc cancela, Enter repite.
4. **Entrenar:** elegir fuente (teclas débiles, pares, alternancia, banco, IA) y duración; mismo motor que Test pero guarda como `entreno`.
5. **Estadísticas:** resumen, gráficas, mapa de calor, teclas y pares débiles con botón "Practicar", confusiones, calendario, tabla de los últimos 14 días, historial filtrable.
6. **Ajustes:** objetivo diario, tema, zoom, teclado, rutina por defecto, reglas de ajuste, Ollama, exportar, importar y borrar datos.

Principios de interfaz: el texto es el protagonista; el teclado no debe empujar el texto fuera de la vista en un portátil de 13-15" (altura típica de 700-800 px); foco siempre en el área de tecleo; respeta `prefers-reduced-motion`; el tema oscuro y el claro tienen contraste suficiente; nada se anima mientras se teclea.

## 10. Pruebas

- Vitest para todo `src/lib/`: medidas, agregados, débiles, textos, plan, estadísticas, exportar e importar, validación de IA. Casos mínimos: texto vacío, un solo carácter, acentos y `ñ`, mayúsculas, errores seguidos, pausas largas, borrar, cierre de palabra incompleto.
- Verificaciones con datos sintéticos de varias semanas (mismo estilo que `scripts/check-mecanografia.ts` de Shellpath) para estadísticas y gráficas.
- Lo que no se puede probar con tests (el tecleo real, el aspecto, el sonido) se lista en la checklist manual de cada fase.
