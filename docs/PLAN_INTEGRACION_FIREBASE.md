# Plan de integración de Firebase (Auth + Firestore)

Objetivo: sincronizar el progreso de Txispa Type entre varios PCs sin perder lo que ya hay en cada navegador. Documento de diseño; **no se ha tocado código**. Contexto y hallazgos en `ESTADO_DEL_PROYECTO.md`.

## 0. Decisiones previas que necesito de Lucas

| # | Decisión | Recomendación |
| --- | --- | --- |
| D1 | `CLAUDE.md` prohíbe backend y cuentas, y exige preguntar antes de añadir dependencias. Firebase rompe ambas reglas. | Reescribir la regla: *"Local primero: la nube es opcional, se activa al iniciar sesión, y todo funciona igual sin red ni cuenta."* y aprobar la dependencia `firebase`. |
| D2 | ¿Despliegue en Vercel, Pages o ambos? (No hay config de Vercel en el repo.) | Vercel como destino único; Pages se puede dejar o retirar. |
| D3 | ¿Qué ajustes se sincronizan? | Ver §3.4. |

## 1. Principios de diseño

1. **Local primero.** IndexedDB sigue siendo la fuente de verdad que lee la UI. Firestore es solo el medio de transporte entre dispositivos. Sin login o sin red, la app se comporta exactamente como hoy.
2. **Encajar en `RunStore`** (`lib/almacen.ts:12-22`). Se añade un almacén decorador que envuelve el de IndexedDB y sube/baja datos. `App.tsx`, `useIntentos` y los componentes no cambian de contrato.
3. **Los intentos son inmutables y tienen UUID** → sincronizar = unión de conjuntos por `id`. No hay conflictos que resolver para ellos.
4. **Sincronización incremental** para no agotar la cuota (§7).
5. **Firebase se carga de forma diferida** (`import()` dinámico) para no engordar el bundle de quien no inicia sesión (hoy 345 KB).

## 2. Autenticación

### 2.1 Google (principal)

- Proveedor: `GoogleAuthProvider` con `signInWithPopup`. Si el popup se bloquea, caer a `signInWithRedirect`.
- Persistencia: `browserLocalPersistence` (por defecto en web).
- Problema conocido: `signInWithRedirect` falla en navegadores que bloquean almacenamiento de terceros cuando `authDomain` (`*.firebaseapp.com`) difiere del dominio de la app. Dos opciones:
  - **Simple (recomendada):** usar popup. Funciona sin proxy.
  - **Robusta (si hay problemas):** poner `authDomain = txispa-type.vercel.app` y añadir en Vercel un *rewrite* de `/__/auth/:path*` → `https://<proyecto>.firebaseapp.com/__/auth/:path*`, y añadir esa URI de redirección en la consola de Google Cloud.
- Consola: Authentication → Sign-in method → Google; **Dominios autorizados**: `txispa-type.vercel.app`, `localhost`, y los dominios de *preview* de Vercel si se quieren probar (`*.vercel.app` no admite comodines: o se prueba solo en producción/local, o se añade cada preview).

### 2.2 ¿Modo anónimo con migración posterior? — Valoración

**No lo recomiendo**, por tres razones:

1. La app ya es *local-first*: el "modo invitado" es simplemente **no estar logueado**. No hace falta un usuario anónimo de Firebase para eso.
2. Un `uid` anónimo es distinto en cada PC; para unir datos habría que usar `linkWithPopup` en un PC y en el otro iniciar sesión con Google (lo que crea otro usuario o falla con `credential-already-in-use`). Complica el caso de uso principal (varios PCs) sin ganar nada.
3. Genera usuarios huérfanos en Auth y obliga a limpiar.

**Flujo propuesto:** sin login = solo local. Al pulsar "Iniciar sesión con Google" → primera sincronización con migración de lo local (§5). Si en el futuro se quisiera nube sin cuenta, se reevalúa.

## 3. Modelo de datos en Firestore

Todo cuelga de `users/{uid}`. Un único usuario tiene su propio árbol; no hay colecciones compartidas (ranking futuro: ver §3.6).

```
users/{uid}                                  ← perfil y control
users/{uid}/intentos/{intentoId}             ← un doc por sesión (test o entreno)
users/{uid}/ajustes/actual                   ← ajustes sincronizables (1 doc)
users/{uid}/dias/{YYYY-MM-DD}                ← tiempo extra del día (contadores aditivos)
users/{uid}/contadores/global                ← pulsaciones acumuladas de calentamientos
```

### 3.1 `users/{uid}` (perfil)

| Campo | Tipo | Uso |
| --- | --- | --- |
| `createdAt` | timestamp (servidor) | Alta |
| `schema` | number | Versión del modelo de datos en la nube (empieza en 1) |
| `resetEpoch` | number | Se incrementa al "Borrar todo"; los demás dispositivos limpian su copia local al verlo mayor que el suyo (§4.5) |
| `migratedFrom` | map `{deviceId: timestamp}` | Auditoría opcional de migraciones iniciales |

### 3.2 `users/{uid}/intentos/{id}` (el `id` es el UUID del intento)

Mismos campos que `Intento` (`types.ts:37-70`), **tal cual**, más:

| Campo extra | Tipo | Motivo |
| --- | --- | --- |
| `syncedAt` | timestamp (`serverTimestamp()`) | **Cursor de sincronización.** Imprescindible: ver nota. |
| `deviceId` | string | Opcional; saber desde qué PC se hizo (depuración). |

Notas:

- `teclas`, `pares`, `confusiones` se guardan como **mapas** dentro del documento (3-5 KB, muy por debajo del límite de 1 MiB). Sus claves son caracteres arbitrarios (`.`, `ñ`, `␣`, `"v>b"`). Firestore las admite como nombres de campo de un `set()`, **pero no se deben tocar nunca con `update()` y rutas con puntos**: siempre `setDoc` del documento completo. Dejarlo anotado en el código del adaptador.
- **Por qué `syncedAt` y no `date`:** un intento hecho offline se sube horas o días después. Si otro PC consulta "`date` > último que vi", **no verá nunca** ese intento, porque su `date` es anterior al cursor. `syncedAt` lo pone el servidor en el momento de escribir y es monótono para este fin.
- Los documentos se **crean una vez y no se editan** (regla de seguridad lo exige, §4).

**Índices:** el único filtro/orden es por `syncedAt` → basta el **índice de campo único automático**. No hace falta ningún índice compuesto. (La UI ordena y filtra en memoria como hoy.)

### 3.3 `users/{uid}/dias/{YYYY-MM-DD}` y `contadores/global`

Hoy estos datos viven en localStorage y no se exportan (`lib/contador.ts`). Se mueven a documentos con **operaciones aditivas** para evitar conflictos entre PCs:

- `dias/{fecha}`: `extraSeg` (number). Se actualiza con `increment(n)`. Reemplaza a `txispatype.tiempoextra.v1` (que hoy solo guarda *el día en curso*; ahora se conservaría la historia del día para la meta y el mapa de actividad).
- `contadores/global`: `calentamientoPuls` (number, `increment`). Reemplaza a `txispatype.calentamiento.v1`.

`increment` es conmutativo: si dos PCs suman offline, el resultado es correcto al reconectar.

### 3.4 `users/{uid}/ajustes/actual`

Un documento con el subconjunto de `Ajustes` que tiene sentido compartir, más `updatedAt` (timestamp de servidor) para resolver conflictos por *última escritura gana*.

| Se sincroniza | Solo en el dispositivo |
| --- | --- |
| `objetivoTests`, `objetivoMinutos`, `estrictoPorDefecto`, `puntuacionYMayusculas`, `duracionPorDefecto`, `calentamientoMin`, `reglasDeAjuste` | `zoom`, `tecladoVisible`, `ollamaUrl`, `ollamaModelo`, `sonidos`, `tema`* |

\* `tema` y `guiaDedos` son discutibles (pregunta abierta 5). Propuesta inicial: `tema` y `guiaDedos` en local.

Implementación: dividir `Ajustes` en `AjustesSincronizables` y `AjustesLocales` en `types.ts`; `normalizarAjustes` ya valida campo a campo (`lib/ajustes.ts:46-71`) y servirá para validar lo que llegue de la nube.

### 3.5 Lo que NO se guarda en la nube

- Estadísticas agregadas (media semanal, racha, teclas débiles…): se **recalculan** a partir de los intentos, que son idénticos en todos los PCs. Guardarlas duplicaría datos y crearía inconsistencias. Coste: cero lecturas adicionales.
- Caché de textos de IA (`txispatype.ia.v1`): es del dispositivo.
- Texto tecleado o pulsaciones sueltas (regla de privacidad existente).

### 3.6 Ranking futuro (fuera de alcance ahora)

Si más adelante se quiere un ranking, se haría con una colección **separada y pública** `publico/{uid}` con solo `{alias, mejorWpm, mediaSemanal, actualizadoEn}`, escrita por el cliente con reglas muy estrictas o, mejor, por una Cloud Function. Nunca exponer `users/**`.

## 4. Reglas de seguridad de Firestore

Principio: **cada usuario solo accede a lo suyo**, los intentos son *append-only* salvo borrado, y se valida la forma de los datos para que un cliente manipulado no inflé la base de datos.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function esDueno(uid) {
      return request.auth != null && request.auth.uid == uid;
    }

    match /users/{uid} {
      allow read: if esDueno(uid);
      allow create, update: if esDueno(uid)
        && request.resource.data.keys().hasOnly(['createdAt','schema','resetEpoch','migratedFrom'])
        && request.resource.data.schema is int;
      allow delete: if false;

      match /intentos/{id} {
        allow read: if esDueno(uid);
        // Crear una vez; sin updates (los intentos son inmutables).
        allow create: if esDueno(uid)
          && id.size() > 0 && id.size() <= 64
          && request.resource.data.id == id
          && request.resource.data.modo in ['test','entreno']
          && request.resource.data.wpm is number && request.resource.data.wpm >= 0 && request.resource.data.wpm < 500
          && request.resource.data.acc is number && request.resource.data.acc >= 0 && request.resource.data.acc <= 100
          && request.resource.data.durationSec is number
          && request.resource.data.localDate.matches('^\\d{4}-\\d{2}-\\d{2}$')
          && request.resource.data.teclas is map
          && request.resource.data.pares is map
          && request.resource.data.confusiones is map
          && request.resource.data.syncedAt == request.time;
        allow update: if false;
        allow delete: if esDueno(uid);   // necesario para "Borrar todo"
      }

      match /ajustes/{doc} {
        allow read: if esDueno(uid);
        allow write: if esDueno(uid) && doc == 'actual'
          && request.resource.data.updatedAt == request.time;
      }

      match /dias/{dia} {
        allow read, write: if esDueno(uid) && dia.matches('^\\d{4}-\\d{2}-\\d{2}$');
      }

      match /contadores/{doc} {
        allow read, write: if esDueno(uid) && doc == 'global';
      }
    }

    // Todo lo demás, cerrado.
    match /{document=**} { allow read, write: if false; }
  }
}
```

Observaciones:

- Con la regla `request.resource.data.id == id` el documento y su clave no pueden divergir.
- No se puede validar con reglas el tamaño del mapa `teclas` de forma barata; el límite de 1 MiB por documento acota el daño. Si se quisiera más control, `request.resource.data.teclas.size() < 200`.
- Probar las reglas con el **Emulador de Firebase** y `@firebase/rules-unit-testing` antes de publicarlas (tareas en `ROADMAP.md`).
- Activar **Firebase App Check** (reCAPTCHA v3/Enterprise) como mejora posterior; la clave de API web no es secreta, así que las reglas + App Check son la verdadera protección.

## 5. Migración de los datos actuales

Situación: cada PC tiene su propio IndexedDB + localStorage, posiblemente con datos distintos. No se puede perder ninguno.

### 5.1 Algoritmo del primer inicio de sesión en un dispositivo

1. **Copia de seguridad automática:** antes de nada, generar el JSON de `crearExportacion` (ampliado con los contadores de localStorage) y ofrecer su descarga ("Guardar copia de seguridad"). Cinturón de seguridad barato.
2. Leer local: `intentos = await local.list()`, `ajustes`, `calentamientoPuls`, `tiempoextra`.
3. **Descargar los intentos remotos** (una lectura por documento; es el coste inevitable del primer sync de cada PC, ver §7) y calcular la diferencia de ids: `paraSubir = locales − remotos`, `paraBajar = remotos − locales`.
4. **Subida idempotente en lotes:** `writeBatch` de hasta **500** operaciones con `set` de `users/{uid}/intentos/{id}` = `{...intento, syncedAt: serverTimestamp()}`, solo para `paraSubir`. Las reglas prohíben `update` y un `set` sobre un doc existente cuenta como update y **fallaría**; por eso se sube únicamente lo que falta. Así repetir la migración (cierre a mitad, o un segundo PC con los mismos ids por haber importado el mismo JSON) no duplica ni falla.
5. **Descarga de los que faltan en local:** los intentos remotos cuyo `id` no está en local se insertan con `local.importMany(...)` (ya existe y fusiona por id: `almacen.ts`).
6. **Contadores:** `calentamientoPuls` local → `increment(valorLocal)` **una sola vez**, marcando en localStorage `txispatype.migrado.v1 = {uid, fecha}` para no repetirlo. `tiempoextra` del día en curso → `increment` en `dias/{hoy}`. Después, dejar de usar las claves viejas (o conservarlas como caché y leer de la nube).
7. **Ajustes:** si no existe `ajustes/actual` → subir los locales. Si existe → gana el remoto para los campos sincronizables (el usuario ya configuró otro PC) y se avisa en un mensaje.
8. Guardar `lastSync` (el mayor `syncedAt` visto) en `txispatype.sync.v1` y pasar a modo incremental (§6).

### 5.2 Casos límite

- **Dos PCs migran a la vez:** seguro, porque la subida es por `id` y se descartan los ya presentes; en carrera, el `create` duplicado que falle por regla se ignora (se captura `permission-denied` en ese doc concreto y se continúa).
- **`increment` repetido** (doble clic / reintento): protegido por la marca `migrado.v1` y por ejecutarlo dentro del mismo batch que registra un doc `migratedFrom.{deviceId}`.
- **Más de 500 intentos:** troceado en lotes secuenciales con progreso en pantalla.
- **Cuota o red:** si la subida se interrumpe, al volver a abrir se reanuda (los ya subidos aparecen en la lista remota).
- **Datos corruptos locales:** pasar por `esIntentoValido` endurecido (ver `MEJORAS.md` M-04) antes de subir.

## 6. Sincronización entre dispositivos y offline

### 6.1 Arquitectura

```
UI ─▶ useIntentos ─▶ RunStore (almacén sincronizado)
                       ├─ local: IndexedDB  (siempre; lectura/escritura inmediata)
                       └─ remoto: Firestore (cuando hay sesión y red)
```

- **Escritura (`add`)**: 1) guardar en IndexedDB y avisar a la UI **sin esperar la red**; 2) encolar la subida. La subida usa Firestore con **`persistentLocalCache` + `persistentMultipleTabManager`**: el propio SDK guarda las escrituras pendientes en su caché de IndexedDB y las envía al recuperar la red, incluso tras cerrar y reabrir el navegador. Así no hay que construir una cola propia ni cambiar el esquema de IndexedDB (que hoy es `SCHEMA = 1`).
- **Lectura / bajada**: un `onSnapshot` sobre `intentos` con `where('syncedAt', '>', lastSync)` y `orderBy('syncedAt')`. Solo llegan documentos nuevos o modificados desde el último cursor (con la caché persistente, además, las reconexiones solo cobran el delta). Cada documento nuevo → `local.importMany([...])` → la UI se actualiza sola por `subscribe`.
  - Los documentos con `syncedAt` pendiente (`null` en la escritura local) se ignoran en el listener hasta que el servidor los confirme.
- **Tiempo real**: al ser un listener, abrir la web en el PC B muestra el test que acaba de hacer el PC A en segundos.
- **Ajustes**: `onSnapshot` del documento `ajustes/actual`; al cambiar, `useAjustes` aplica solo los campos sincronizables. Escritura con *debounce* de 1-2 s (los cambios de teclado en el ajuste numérico generan ráfagas).
- **Contadores**: `increment` desde `Tecleo`/`ContadorTecleo` al terminar o abandonar (no pulsación a pulsación, para ahorrar escrituras: ver §7).

### 6.2 Conflictos

| Dato | Estrategia |
| --- | --- |
| Intentos | Unión por `id`. Inmutables. Sin conflicto. |
| Ajustes | Última escritura gana (`updatedAt` del servidor). |
| Contadores | Aditivos con `increment`. Sin conflicto. |
| Borrado total | `resetEpoch` (§6.3). |

### 6.3 "Borrar todo"

Hoy: `almacen.clear()` (`AjustesPantalla.tsx:64-68`). Con la nube:

1. Pedir confirmación explícita y avisar de que **borra también en la nube y en todos los PCs**.
2. `resetEpoch += 1` en `users/{uid}` y borrado remoto de `intentos` por lotes de 500 (y reset de contadores).
3. Cada dispositivo guarda su `epochVisto` en `txispatype.sync.v1`; al ver un `resetEpoch` mayor en el listener del perfil, ejecuta `local.clear()` y reinicia su `lastSync`.
4. Sin esto, el PC B volvería a subir sus datos viejos y "resucitaría" lo borrado.

### 6.4 Estados de la interfaz

Un indicador discreto en la cabecera (junto al engranaje): `Solo local` · `Sincronizando…` · `Sincronizado` · `Sin conexión (N pendientes)` · `Error de sincronización`. Se alimenta de `navigator.onLine`, el listener y `waitForPendingWrites`. Cada fallo debe mostrarse (hoy los errores de guardado se tragan: `Tecleo.tsx:78`).

### 6.5 Cierre de sesión

`signOut` **no borra** los datos locales (la app sigue funcionando en local). Si el usuario quiere limpiar el equipo, tiene "Borrar datos locales" (nuevo botón distinto de "Borrar todo"). Evita que otra persona en un PC compartido vea los datos: aviso al iniciar sesión con otra cuenta (`uid` distinto del registrado en `sync.v1`) → ofrecer "Mantener datos locales y unirlos a esta cuenta / Empezar limpio".

## 7. Control de costes y límites (plan Spark, gratuito)

Cuotas diarias aproximadas del plan gratuito de Firestore: **50 000 lecturas, 20 000 escrituras, 20 000 borrados, 1 GiB almacenado, 10 GiB/mes de salida** (verificar los valores vigentes en la consola de Firebase antes de depender de ellos). Auth con Google es gratuita.

### 7.1 Estimación para este proyecto

Supuestos: 10 intentos/día, 365 días → ~3 650 documentos/año, ≈ 4 KB cada uno ≈ 15 MB/año.

| Operación | Cantidad | Veredicto |
| --- | --- | --- |
| Escrituras: 10 intentos + ~10 `increment` + ajustes | ≈ 25-40 / día | ≈ 0,2 % de la cuota |
| Lecturas: arranque con cursor incremental | delta del día ≈ 10-30 | ≈ 0,05 % |
| Lecturas: **primer sync de un PC nuevo** tras 1 año | ≈ 3 650 una vez | ≈ 7 % de un día, solo una vez |
| Lecturas **si se releyese todo en cada arranque** | 3 650 × N arranques | 14 arranques/día agotarían la cuota → **por eso hay cursor** |
| Almacenamiento | 15 MB/año | irrelevante frente a 1 GiB |

### 7.2 Medidas para minimizar

1. **Cursor `syncedAt` persistido** en `txispatype.sync.v1` (nunca reconsultar todo).
2. **IndexedDB como caché**: la UI nunca lee Firestore directamente.
3. **Un solo listener** por colección y ninguno por pestaña: `persistentMultipleTabManager` comparte el listener entre pestañas.
4. **Escribir al terminar la sesión**, no por pulsación; `increment` agrupado (un solo write por test/abandono).
5. **Debounce** de ajustes (1-2 s).
6. **No sincronizar derivados** (estadísticas) ni la caché de IA.
7. **Lotes** (`writeBatch`) para migraciones y borrados.
8. Si el volumen creciera mucho (años), compactar: agrupar intentos antiguos por mes en un documento (`intentos_mes/{YYYY-MM}`) y reducir lecturas ×10. No es necesario ahora.
9. **Alertas de presupuesto**: configurar un presupuesto de 0 € con avisos en Google Cloud; en Spark, además, el servicio se limita solo al superar la cuota (no genera cobros).

## 8. Variables de entorno y Vercel

### 8.1 Variables (Vite solo expone las que empiezan por `VITE_`)

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=<proyecto>.firebaseapp.com   (o txispa-type.vercel.app si se usa el proxy de auth)
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=      (no se usa; puede omitirse)
VITE_FIREBASE_MESSAGING_SENDER_ID= (no se usa; puede omitirse)
VITE_FIREBASE_APP_ID=
VITE_SYNC_ENABLED=true             (interruptor para apagar la nube sin tocar código)
```

- La configuración web de Firebase **no es secreta** (viaja al navegador). La seguridad la dan las **reglas** y App Check, no esconder la clave. Aun así: no se commitea ningún `.env` (ya cubierto por `.gitignore`: `.env`, `.env.*`) y se añade `app/.env.example` con los nombres vacíos.
- **Local:** `app/.env.local` con los valores reales.
- **Vercel:** Project → Settings → Environment Variables → añadir las `VITE_*` en *Production* y *Preview*; redeploy (las variables se incrustan en el build).
- **Vercel Project Settings:** *Root Directory* = `app`, *Framework* = Vite, *Build* = `npm run build`, *Output* = `dist`. Si el repo ya está importado, comprobarlo.
- Sin `vercel.json` hoy. Se propone añadir `app/vercel.json` con (a) cabeceras de seguridad y CSP que permitan Firebase (`connect-src https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src https://*.firebaseapp.com https://accounts.google.com`) y (b) opcionalmente el *rewrite* de `/__/auth/*`.
- **`vite.config.ts` usa `base: "./"`** (pensado para Pages): funciona en la raíz de Vercel; no hay router, así que no hacen falta rewrites de SPA.
- **CI:** `pages.yml` ejecuta `npm run check` sin variables. Como el SDK debe poder compilar sin configuración, el código tiene que **degradar a "solo local"** cuando falten las `VITE_FIREBASE_*` (así el CI y los tests no necesitan secretos).

### 8.2 Firebase CLI

`firebase.json` + `firestore.rules` + `firestore.indexes.json` (vacío) en la raíz del repo para versionar reglas; `firebase deploy --only firestore:rules`. Emuladores para desarrollo y para los tests de reglas.

## 9. Archivos a crear o modificar

### Crear

| Archivo | Contenido |
| --- | --- |
| `app/src/lib/firebase.ts` | Inicialización diferida (`import()`), lectura de `import.meta.env.VITE_*`, `isSyncAvailable()`; Firestore con `persistentLocalCache`. |
| `app/src/lib/sincronizacion.ts` | Lógica **pura** testeable: planificar subida/bajada (diferencia de ids), troceado en lotes de 500, resolución de ajustes por `updatedAt`, cursor. |
| `app/src/lib/almacenSincronizado.ts` | `crearAlmacenSincronizado(local: RunStore, remoto): RunStore` (decorador). |
| `app/src/lib/remotoFirestore.ts` | Adaptador de Firestore: `subir`, `suscribir(cursor)`, `borrarTodo`, `incrementar`. Única pieza que importa `firebase/*`. |
| `app/src/lib/migracion.ts` | Pasos de §5 como funciones puras + orquestador. |
| `app/src/hooks/useSesion.ts` | Estado de autenticación (`onAuthStateChanged`), `iniciarSesion`, `cerrarSesion`. |
| `app/src/hooks/useEstadoSync.ts` | Estado para el indicador de cabecera. |
| `app/src/components/PanelCuenta.tsx` | Botón Google, estado, copia de seguridad, "borrar datos locales", "borrar todo (nube)". Dentro del modal de ajustes. |
| `app/src/components/IndicadorSync.tsx` | Indicador en cabecera. |
| `app/src/lib/__tests__/sincronizacion.test.ts`, `migracion.test.ts`, `almacenSincronizado.test.ts` | Tests con un remoto simulado en memoria (misma técnica que `fetchFn` en `ia.test.ts`). |
| `app/.env.example` | Nombres de variables vacíos. |
| `app/vercel.json` | Cabeceras/CSP y rewrite opcional. |
| `firebase.json`, `firestore.rules`, `firestore.indexes.json` | Reglas e índices versionados. |
| `docs/PRIVACIDAD.md` (o sección en README) | Qué datos se guardan en la nube. |

### Modificar

| Archivo | Cambio |
| --- | --- |
| `app/package.json` | Añadir `firebase` (última estable, import modular; fijar versión exacta al instalar) y, en dev, `@firebase/rules-unit-testing`. **Requiere tu aprobación (D1).** |
| `app/src/App.tsx:105` | `useMemo(() => crearAlmacenIndexedDB(), [])` → almacén sincronizado cuando haya sesión; montar `IndicadorSync` en la cabecera (`App.tsx:157-171`). |
| `app/src/types.ts` | Separar `Ajustes` en sincronizables/locales; tipo `EstadoSync`. |
| `app/src/lib/ajustes.ts` | Funciones para extraer/aplicar el subconjunto sincronizable. |
| `app/src/lib/contador.ts` + `hooks/ContadorTecleo.tsx` | Los contadores pasan a un servicio con dos backends (localStorage / Firestore con `increment`); corregir el reinicio de `extraSeg` por día (bug 7.1 #6). |
| `app/src/lib/exportar.ts` | Incluir contadores; desacoplar versión de exportación de `SCHEMA` (7.1 #3); endurecer `esIntentoValido`; no importar `ollamaUrl`. |
| `app/src/components/AjustesPantalla.tsx` | Insertar `PanelCuenta`; el botón de borrar distingue local/nube; importar ya no pisa ajustes locales. |
| `app/src/components/Tecleo.tsx:73,78` | Fallback de UUID si no hay `crypto.randomUUID`; **gestionar el error de guardado** (mostrar aviso) — requisito previo a la sincronización. |
| `CLAUDE.md`, `README.md`, `docs/ESPECIFICACION-TECNICA.md` | Actualizar la regla "local primero" y documentar las claves nuevas (`txispatype.sync.v1`, `txispatype.migrado.v1`). |
| `.github/workflows/pages.yml` | Opcional: retirar si se abandona Pages. |

### Claves de localStorage nuevas (prefijo `txispatype.`, regla de `CLAUDE.md`)

`txispatype.sync.v1` = `{uid, lastSync, epochVisto, deviceId}`; `txispatype.migrado.v1`.

## 10. Orden de implementación (resumen; detalle en `ROADMAP.md`)

1. Cerrar los bugs previos (UUID, error de guardado, contadores en la exportación).
2. Crear proyecto Firebase, Auth Google, reglas y emulador.
3. Capa pura + tests (`sincronizacion.ts`, `migracion.ts`) con remoto simulado.
4. Adaptador Firestore + almacén sincronizado, detrás del interruptor `VITE_SYNC_ENABLED`.
5. UI de cuenta e indicador; migración guiada.
6. Variables en Vercel, CSP, prueba con dos navegadores/PCs.
7. Retirar el flag y documentar.

## 11. Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Perder datos en la migración | Copia de seguridad previa obligatoria + subida idempotente + no se borra nada local. |
| Regla `update: false` choca con `set` repetido | Descargar ids remotos y subir solo los que faltan (§5.1). |
| Cuota por relecturas | Cursor `syncedAt`, caché persistente, un listener. |
| Intentos "invisibles" por cursor basado en `date` | Usar `syncedAt` de servidor (§3.2). |
| Resurrección tras "Borrar todo" | `resetEpoch`. |
| Bundle más pesado | `import()` dinámico solo al iniciar sesión. |
| Popup bloqueado / cookies de terceros | Popup con fallback a redirect; proxy `/__/auth` si hiciera falta. |
| Dominios de preview de Vercel no autorizados | Probar en producción/local o añadir cada dominio. |
| IA/Ollama + HTTPS (contenido mixto) | Independiente de Firebase; ver pregunta abierta 7 de `ESTADO_DEL_PROYECTO.md`. |
