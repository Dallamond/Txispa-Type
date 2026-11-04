# Mejoras técnicas y de producto

Lista priorizada con justificación y, cuando aplica, un ejemplo breve. Los números de línea corresponden al commit `131cce8`. Ver `ROADMAP.md` para el orden de ejecución y `ESTADO_DEL_PROYECTO.md` para el contexto.

Prioridad: 🔴 crítica · 🟠 alta · 🟡 media · 🟢 baja.

---

## A. Técnicas — fiabilidad de datos

### M-01 🔴 Gestionar el fallo de guardado de un intento
- **Dónde:** `components/Tecleo.tsx:78` (`void alGuardarRef.current(intento)`).
- **Por qué:** si IndexedDB falla (cuota, modo privado, bloqueo por otra pestaña), la promesa rechazada se pierde y el usuario cree que el test está guardado. Con la nube, cualquier fallo de sincronización también debe verse.
- **Ejemplo:**
  ```tsx
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  // en terminar():
  if (guardar && motor.correct + motor.errors > 0) {
    Promise.resolve(alGuardarRef.current(intento)).catch(() =>
      setErrorGuardado("No se pudo guardar este intento. Descárgalo para no perderlo.")
    );
  }
  ```
  y un botón "Descargar este intento (JSON)" en `Resultado`.

### M-02 🔴 `crypto.randomUUID` no existe fuera de contextos seguros
- **Dónde:** `Tecleo.tsx:73`.
- **Por qué:** con la app servida por HTTP en la LAN (lo que el `README` plantea para Ollama) lanza `TypeError` y el test termina sin guardarse.
- **Ejemplo:** helper en `lib/rng.ts`:
  ```ts
  export function nuevoId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
  }
  ```
  `getRandomValues` sí funciona en HTTP. Con test unitario.

### M-03 🟠 La exportación omite parte del progreso
- **Dónde:** `lib/exportar.ts:15-22`.
- **Por qué:** `txispatype.calentamiento.v1` y `txispatype.tiempoextra.v1` quedan fuera: se pierden al cambiar de PC y en la migración a Firebase.
- **Ejemplo:** añadir `contadores: { calentamientoPuls: number; tiempoExtra: {dia, segundos} | null }` a `Exportacion`, con valores por defecto al importar un archivo antiguo (campo opcional).

### M-04 🟠 Validación superficial al importar
- **Dónde:** `lib/exportar.ts:35-52`.
- **Por qué:** solo comprueba que `teclas/pares/confusiones` sean objetos; valores no numéricos o `NaN` romperían estadísticas y `debiles.ts`. Crítico antes de subir datos a la nube.
- **Ejemplo:**
  ```ts
  const esTecla = (v: unknown) => esObjeto(v) && [v.n, v.e, v.ms, v.msN].every(esNumero);
  const esPar = (v: unknown) => esObjeto(v) && esNumero(v.n) && esNumero(v.ms);
  // en esIntentoValido:
  Object.values(v.teclas).every(esTecla) && Object.values(v.pares).every(esPar) &&
  Object.values(v.confusiones).every(esNumero)
  ```
  Acotar también tamaño (`Object.keys(v.teclas).length < 200`).

### M-05 🟠 Separar versión de exportación y versión de IndexedDB
- **Dónde:** `lib/almacen.ts:9` (`SCHEMA`), usado en `lib/exportar.ts:21,63`.
- **Por qué:** cambiar el esquema local (p. ej. añadir un almacén de cola) bloquearía la importación de archivos viejos o confundiría "versión más nueva".
- **Ejemplo:** `export const FORMATO_EXPORTACION = 1;` en `exportar.ts` y `DB_VERSION` en `almacen.ts`.

### M-06 🟠 Importar no debe pisar ajustes del dispositivo
- **Dónde:** `components/AjustesPantalla.tsx:59`.
- **Por qué:** sobrescribe `zoom` y `ollamaUrl`; un JSON manipulado redirigiría las peticiones de IA a otro host.
- **Ejemplo:** `onCambiar(soloSincronizables(r.ajustes))` (misma función que usará Firebase).

### M-07 🟡 `extraSeg` no se reinicia al cambiar de día
- **Dónde:** `hooks/ContadorTecleo.tsx:42,54,80`.
- **Por qué:** con la pestaña abierta tras medianoche arrastra el tiempo de ayer a "hoy".
- **Ejemplo:** guardar `{dia, seg}` en el estado y usar `extra.dia === hoy ? extra.seg : 0`; test con `hoy` simulado.

### M-08 🟡 Unificar el cálculo de fechas
- **Dónde:** `components/Hoy.tsx:41-42` usa `new Date(\`${hoy}T12:00:00\`)` (zona del sistema).
- **Por qué:** el resto del código usa `sumarDias` (UTC) para ser independiente de la zona horaria.
- **Ejemplo:** `const corte = sumarDias(hoy, -6);` y mover `mejorDeLaSemana` a `lib/estadisticas.ts` con test (la regla del proyecto dice que los componentes no calculan).

---

## B. Técnicas — arquitectura y mantenimiento

### M-09 🟠 Sincronización detrás de `RunStore`
- **Por qué:** `RunStore` (`lib/almacen.ts:12-22`) ya aísla la persistencia; un decorador `crearAlmacenSincronizado(local, remoto)` añade la nube sin tocar `App.tsx` más que en la línea 105.
- **Ejemplo (esqueleto):**
  ```ts
  export function crearAlmacenSincronizado(local: RunStore, remoto: RemotoIntentos): RunStore {
    return {
      ...local,
      async add(i) { await local.add(i); void remoto.subir(i).catch(avisarFallo); },
      async clear() { await local.clear(); await remoto.borrarTodo(); },
    };
  }
  ```
  Detalle completo en `PLAN_INTEGRACION_FIREBASE.md`.

### M-10 🟡 Dividir los componentes grandes
- **Dónde:** `Estadisticas.tsx` (510 líneas, 12 `useMemo`) y `Tecleo.tsx` (370).
- **Por qué:** difíciles de revisar y de probar; cada cambio toca mucho.
- **Propuesta:** `estadisticas/Resumen.tsx`, `TeclasYErrores.tsx`, `Historial.tsx`; en `Tecleo`, extraer un hook `useSesionTecleo(motor, config)` (temporizador + teclado + terminar) y dejar `Resultado` en su archivo.

### M-11 🟡 Evaluar `analizar()` una sola vez
- **Dónde:** `Estadisticas.tsx:104`, `Entrenar.tsx:65`, `Calentar.tsx:21`.
- **Por qué:** mismo cálculo sobre los mismos datos tres veces.
- **Ejemplo:** calcularlo en `App` con `useMemo([intentos])` y pasarlo por props o contexto.

### M-12 🟡 Cargar solo lo necesario de IndexedDB
- **Dónde:** `hooks/useIntentos.ts` relee todo tras cada `add`.
- **Por qué:** O(n) por sesión y crecerá con los años; además cada lectura reconstruye todos los `useMemo`.
- **Ejemplo:** en `add`, el almacén emite el intento nuevo y `useIntentos` lo añade al estado (`setIntentos(prev => [...prev, nuevo])`) en vez de `list()`; mantener la recarga completa solo para `import`/`clear`.

### M-13 🟢 Limpieza de deuda trivial
- Borrar `components/Pendiente.tsx` (no se importa en ningún lado).
- Unir los dos `import` de `./lib/contador` (`ContadorTecleo.tsx:4-5`), quitar el comentario duplicado (líneas 13-14) y mover el `import` de `lib/contador.ts:5` arriba.
- Un único `formatoReloj` (hoy hay dos con comportamiento distinto: `Tecleo.tsx:44` y `lib/historial.ts:95`); renombrar el de la cuenta atrás a `formatoRestante`.
- Reescribir comentarios heredados de Shellpath: `usePressedKey.ts:4`, `typing.ts:2`, `useTecladoFisico.ts:5-30`.
- Corregir `docs/ESTADO.md` (frase ininteligible y afirmación falsa sobre pulsaciones guardadas) y `README.md` ("sin servidor ni cuentas").

### M-14 🟡 Configuración de despliegue explícita
- **Por qué:** no hay `vercel.json`, ni CSP ni cabeceras. El despliegue "real" (Vercel) no está documentado en el repo.
- **Ejemplo (`app/vercel.json`):**
  ```json
  {
    "headers": [{
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com http://localhost:11434; frame-src https://*.firebaseapp.com https://accounts.google.com; img-src 'self' data: https://*.googleusercontent.com" }
      ]
    }]
  }
  ```
  Ajustar tras probar (el popup de Google y `style` inline de React pueden requerir afinar la CSP).

---

## C. Técnicas — tests

### M-15 🟠 Cubrir el flujo de guardado/abandono
- **Por qué:** `Tecleo` concentra la lógica más delicada (cronómetro, guardado, abandono con Esc, contador) y no tiene tests; `vitest` solo incluye `.ts`.
- **Opciones:** (a) extraer a `lib/sesion.ts` una función pura `decidirCierre(estado)` que diga si guardar/descartar y cuánto tiempo contar; (b) añadir jsdom + testing-library (requiere tu visto bueno por la regla de dependencias).

### M-16 🟡 Tests del almacén IndexedDB real
- **Por qué:** solo se prueba la versión en memoria (`almacen.test.ts`); `abrir`, índices y `importMany` transaccional no tienen cobertura.
- **Ejemplo:** `fake-indexeddb` en devDependencies y reutilizar la misma batería para ambos `RunStore` (test de contrato).

### M-17 🟡 Test de contrato para sincronización
- Remoto simulado en memoria; casos: dos dispositivos, offline → online, duplicados, `resetEpoch`, migración interrumpida.

---

## D. Técnicas — rendimiento

### M-18 🟡 Reducir repintados durante la prueba
- **Dónde:** `Tecleo.tsx:88-96` (cada 100 ms) y `:133` (cada tecla) repintan texto y teclado virtual.
- **Ejemplo:** `React.memo` en `AreaTexto` y `VirtualKeyboard` con props estables, y mover el cronómetro/métricas a un subcomponente que tenga su propio intervalo.

### M-19 🟡 Code-splitting
- **Por qué:** 345 KB en un solo bundle; Firebase añadirá más.
- **Ejemplo:**
  ```tsx
  const Estadisticas = lazy(() => import("./components/Estadisticas"));
  // <Suspense fallback={<p className="tenue">Cargando…</p>}>…</Suspense>
  ```
  y `await import("./lib/firebase")` solo tras pulsar "Iniciar sesión" o si ya hay sesión.

### M-20 🟢 Service worker + manifest
- Caché del *shell* de la app para uso offline real e instalable como PWA.

---

## E. Accesibilidad

### M-21 🟠 Controles operables con teclado
- **Dónde:** `App.tsx:141` (`<div className="logo" onClick>`).
- **Ejemplo:** `<button type="button" className="logo" onClick={…}>` con estilos de botón neutros.

### M-22 🟠 Modal de ajustes accesible
- **Dónde:** `App.tsx:193-212`.
- **Por qué:** sin foco inicial, sin trampa de foco, sin devolver el foco al botón que lo abrió.
- **Ejemplo:** usar el elemento `<dialog>` con `showModal()` (gestiona foco y Esc de forma nativa) o un pequeño hook `useTrampaFoco`.

### M-23 🟡 Anuncios para lectores de pantalla
- Región `aria-live="polite"` con "Prueba iniciada", "Tiempo agotado: 52,3 ppm, 96 % de precisión"; tabla alternativa oculta visualmente para el mapa de calor y de actividad.

### M-24 🟡 Contraste y preferencias del sistema
- Comprobar el tema claro (pendiente en `docs/ESTADO.md`), respetar `prefers-color-scheme` en el primer uso y `prefers-reduced-motion`.

---

## F. Seguridad y privacidad

### M-25 🟠 Reglas de Firestore y App Check
- Reglas con validación de forma y solo propietario (`PLAN_INTEGRACION_FIREBASE.md` §4), probadas con emulador; App Check después.

### M-26 🟡 No exponer más de lo necesario
- No guardar email en Firestore (el `uid` basta); no subir `ollamaUrl`; aviso de privacidad breve ("se guardan tus estadísticas por tecla, no lo que escribes").

### M-27 🟢 Cabeceras y dependencias
- CSP y cabeceras (M-14); `npm audit` en CI; fijar versiones de Firebase.

---

## G. Producto

### M-28 🟠 Indicador de estado de sincronización
- Siempre visible: "Solo local / Sincronizando / N pendientes / Sincronizado / Error". Es lo que da confianza al usuario de que su progreso está a salvo.

### M-29 🟠 Clasificar el tipo de error
- **Por qué:** hoy se guardan confusiones `esperada>escrita`, pero no si fue una tecla vecina, omisión, letra añadida o transposición. Es la mejora nº 2 que ya tenía `docs/ESTADO.md` y alimenta mejores textos de entreno.
- **Ejemplo:** en `agregados.ts`, clasificar con la geometría de `data/keyboard.ts` (vecina = adyacente en la fila) y guardar contadores `tipos: {vecina, omision, anadida, transposicion}` por tecla.

### M-30 🟡 Objetivos y proyección
- Mostrar "a este ritmo llegas a 55 ppm el 12/12" usando `tendencia()` (`lib/estadisticas.ts`) y las metas del README (55 a 30 días, 65 a 90).

### M-31 🟡 Lecciones guiadas
- Progresión por filas/dedos con criterio de paso (p. ej. ≥ 96 % y ≥ N ppm en 3 intentos), usando `finger` de `data/keyboard.ts`.

### M-32 🟡 Textos propios
- Pegar un texto y teclearlo con las mismas métricas; validar con `PERMITIDO` de `ia.ts` y límites de longitud.

### M-33 🟢 Ranking opcional / gamificación
- Solo si se decide abrir la herramienta a más personas (`ROADMAP.md`, F4).

### M-34 🟢 Estado de IA en HTTPS
- Aviso claro en Ajustes cuando la app está en HTTPS y la URL de Ollama es HTTP (contenido mixto) en vez de un error genérico (`AjustesPantalla.tsx:36`).

---

## Resumen de prioridades

| Prioridad | Mejoras |
| --- | --- |
| 🔴 | M-01, M-02 |
| 🟠 | M-03, M-04, M-05, M-06, M-09, M-15, M-21, M-22, M-25, M-28, M-29 |
| 🟡 | M-07, M-08, M-10, M-11, M-12, M-14, M-16, M-17, M-18, M-19, M-23, M-24, M-26, M-30, M-31, M-32 |
| 🟢 | M-13, M-20, M-27, M-33, M-34 |
