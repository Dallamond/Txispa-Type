# Revisión de Shellpath para integrarlo en Txispa Type

Fecha: 13 de noviembre de 2026. Revisión **de solo lectura** del código y de los documentos de `../Shellpath/` (el código está en `Shellpath/app/`). No se ha tocado nada de Shellpath, no se han abierto archivos `.env*` y no se ha ejecutado nada contra Supabase. Las rutas de la forma `archivo:línea` son de Shellpath salvo que digan `Txispa`.

**Alcance y límites.** Lo que sigue sale de leer el esquema, el código cliente y los documentos de septiembre. El último documento de estado es del 10/09/2026 y la última línea de `log.md` es del 11/09/2026, así que **no sé en qué estado está hoy el proyecto vivo de Supabase ni el sitio en Vercel**. Lo que los documentos dan por "pendiente" lo trato como pendiente hasta que Lucas lo compruebe en los paneles.

---

## 0. Resumen y recomendación

1. **Shellpath ya resolvió bien lo difícil del backend**: el progreso son eventos inmutables con UUID del cliente, los contadores se derivan, las notas (`acc`, `ppm`, `score`, `xp_earned`) son columnas `generated always` que calcula Postgres, la RLS es estricta y hay una suite de pruebas de sincronización contra un servidor de mentira. Es exactamente el modelo que Txispa Type ya tiene en el cliente (`Intento` inmutable con UUID, progreso derivado en `lib/xp.ts` y `lib/gamCurso.ts`). El encaje es casi 1 a 1.
2. **Recomendación sobre la base de datos: una sola cuenta y un solo backend en Supabase (Postgres) para Shellpath y Txispa Type, y dejar Firebase como estaba (sin usar).** La razón de fondo no es el gusto por SQL: con Firebase en plan Spark no se puede ejecutar código de servidor (Cloud Functions exige el plan de pago Blaze; ver §5), y entonces la XP, el ranking y los anti-trampas dependerían de reglas de seguridad que solo validan forma, no calculan. Para un ranking público y una XP fiable hace falta lógica en el servidor, y Postgres la da gratis (columnas generadas, triggers, vistas, funciones). Además cuadra con tu plan de cursos de MySQL/SQL y con cursos largos de SMR/ASIR (datos relacionales: cursos → módulos → lecciones → intentos).
3. **Costes honestos de esa decisión:** el plan gratuito de Supabase duerme el proyecto (7,8 s en frío medidos por Lucas el 10/09), no hay copias de seguridad automáticas en el plan gratuito y ya está el trabajo de Firebase a medias (app web registrada, Google habilitado, Firestore creado). Todo se puede mitigar (ver §5.3), pero hay que decidirlo conscientemente.
4. **Lo que se lleva a Txispa y lo que no.** Se llevan el *patrón* (eventos + sync con buzón de salida + copia local por usuario + adopción de la copia anónima + clasificación de errores de subida) y el *flujo de pantallas* (catálogo → mapa de nodos → lección → resultado, jefes, subida de etapa, tutorial corto). No se lleva lo específico de Linux (ROOT, categorías "Buscando el pipe", jefes de diagnóstico tal cual, test de 60 s de comandos).
5. **Antes de abrir una web pública hay que cerrar tres cosas que en Shellpath siguen abiertas según sus documentos**: borrado de cuenta autoservicio, confirmación de correo (o Google OAuth), y un límite de escritura en todas las tablas de hechos. Y decidir qué se promete en privacidad (§7).

---

## 1. Backend de Shellpath

### 1.1 Qué hay (fuente: `app/supabase/schema.sql`, 491 líneas, idempotente, más una migración)

| Pieza | Dónde | Qué hace |
| --- | --- | --- |
| Funciones de puntuación `sp_completion_bonus`, `sp_acc`, `sp_ppm`, `sp_xp`, `sp_score` | `schema.sql:28-89` | La fórmula de XP vive en la base de datos (`immutable`). El cliente no puede ser autoridad sobre su nota. |
| `profiles` | `schema.sql:96-109` | `nickname` con `check` `^[A-Za-z0-9_-]{3,20}$` y único sin distinguir mayúsculas; `cohort` (sin uso visible). |
| `progress_baseline` | `schema.sql:121-138` | Importación única del progreso heredado de localStorage, `verificado=false` para siempre: nunca entra en rankings. |
| `attempts` (fuente de verdad) | `schema.sql:154-195` | `id uuid` generado en el cliente (idempotencia); `correct_chars`, `error_chars`, `time_sec` acotados; `acc`, `ppm`, `score`, `xp_earned` **generated always stored**; `local_date` aparte de `created_at` (racha por día local); `keystroke_log jsonb` reservado; `sospechoso`. |
| `boss_wins` | `schema.sql:202-211` | `unique (user_id, jefe_id)`: el bonus de jefe se cobra una vez, lo garantiza la BD. |
| `speed_runs` | `schema.sql:213-243` | Test de velocidad con `seed`, `ppm`/`wpm`/`acc` generadas, índice parcial del ranking (`where sospechoso = false`). |
| `badges_unlocked` | `schema.sql:245-250` | Existe, pero **ningún código cliente la usa**: los logros se derivan en `data/logros.ts` (comprobado con búsqueda). Tabla huérfana. |
| Trigger de sanidad `sp_marcar_sospechoso` | `schema.sql:263-340` | Fecha futura → rechaza; fecha vieja o desfasada → acepta y marca; >900 ppm en intentos, >600 sin errores, >600 ppm en tests → marca `sospechoso` (la fila entra pero no compite). |
| Límite de escritura `sp_limite_escritura` | `schema.sql:345-376` | 60 intentos/minuto con código propio `54000` ("vuelve en un minuto", distinto de una restricción). **Solo en `attempts`.** |
| RLS | `schema.sql:391-435` | Leer y añadir lo propio; **sin update ni delete en las tablas de hechos**; `progress_baseline` sí reescribible por su dueño. |
| Vista `leaderboard_60s` | `schema.sql:449-468` | `security_invoker = off`, expone solo `nickname`, mejor ppm/wpm, precisión de la mejor, nº de tests, `limit 100`; `grant select` a `anon`. |
| Permiso por columna en `profiles` | `schema.sql:490-491` | `revoke select ... from anon; grant select (nickname) ... to anon;` para que `nickLibre()` funcione sin dar el censo. |

### 1.2 Decisiones que eran buenas (y conviene copiar)

- **Eventos inmutables + idempotencia por UUID del cliente** (`lib/attempts.ts:15-38`). Un reintento tras un corte no duplica XP; dos dispositivos se reconcilian uniendo listas, sin decidir quién gana.
- **Todo lo derivable no se guarda** (`lib/derive.ts:1-8`). Racha, XP total, registro diario y récords salen de los eventos; no pueden descuadrarse.
- **El servidor decide la nota** (`schema.sql:168-171`): un insert que incluya una columna generada falla con `428C9`. El cliente declara pulsaciones y tiempo, Postgres valora.
- **Marcar en vez de rechazar** (`schema.sql:287-296`): rechazar a quien teclea sin conexión un fin de semana le borraría trabajo real; se acepta y se excluye del ranking.
- **Distinguir "reintentable" de "rechazado"** con códigos Postgres (`remoteProgress.ts:49-67`): si no, el buzón de salida o tira intentos buenos o se atasca para siempre con uno imposible.
- **`security_invoker = off` en la vista + permiso por columna** para exponer lo mínimo.
- **La app funciona sin backend** (`supabase.ts:20-33`): `supabase` vale `null` y todo sigue contra localStorage. Es el mismo principio de "local primero" de Txispa.
- **Pruebas sin red**: `scripts/check-sync.ts`, `check-speed.ts`, `check-migracion.ts`, `check-derive.ts`, `check-formulas.ts` (5 suites, según `package.json` y los documentos) con un `Remoto` inyectable (`remoteProgress.ts:253-260`).

### 1.3 Fallos ya encontrados (útiles porque son los que se repetirían en Txispa)

| Fallo | Origen | Lección |
| --- | --- | --- |
| Bucle de nick: `ensureProfile` corría dos veces (`getSession` + `INITIAL_SESSION`) y el `23505` se atribuía siempre al nick | Hoja de Ruta Backend §0 | Cerrojo por usuario y preguntar a la BD ante un `23505` (`auth.ts:176-186`). |
| Fechas viejas rechazadas: lo tecleado offline un fin de semana quedaba reintentándose para siempre | Hoja de Ruta Backend §0 | Aceptar y marcar (`schema.sql:287-289`). |
| Ids con formato propio en una columna `uuid`: los tests se atascaban en el buzón sin error visible | Informe de Situación §3 | Generar siempre UUID válidos, también sin `crypto.randomUUID` (`attempts.ts:19-38`; en Txispa es la mejora M-02 de `docs/MEJORAS.md`, aún no hecha). |
| Migración no determinista: un uuid al azar en cada lectura subía el mismo test dos veces | Informe de Situación §3 | La migración de ids tiene que ser determinista. |
| `profiles` entregaba el censo (user_id, fecha de alta) a `anon` | Auditoría S1 | Permiso por columna (aplicado en el esquema; **sin aplicar en la base viva** según el Estado del 10/09). |
| Techo anti-trampas en 900 ppm (récord mundial ≈ 750) | Auditoría S2 | Bajado a 600 en el esquema; sigue sin cerrar el agujero (se puede publicar 599). Lo cerraría verificar contra el `seed`. |
| Techo propuesto de 300-400 ppm habría marcado a usuarios reales | Auditoría S2 | Un falso positivo silencioso es peor que colar una marca falsa. |

### 1.4 Hallazgos propios de esta revisión (no están en los documentos de Shellpath)

| # | Hallazgo | Dónde | Gravedad para Txispa |
| --- | --- | --- | --- |
| H1 | El permiso por columna solo restringe a `anon`. Cualquier usuario **con sesión** puede leer **todas** las filas de `profiles` con `user_id`, `cohort` y `created_at`: `profiles_lectura_publica using (true)` sigue aplicando a `authenticated`. | `schema.sql:401-402`, `490-491` | Media. Con usuarios públicos es el censo a la vista de cualquier cuenta. Se arregla con una vista pública de solo `nickname` y quitando `select` directo a `authenticated` salvo la fila propia. |
| H2 | La XP **total** no la calcula el servidor. Solo `xp_earned` por intento es server-side. El XP de jefes es una constante de cliente (`BOSS_XP = 200`) y `boss_wins` solo valida que `jefe_id` cumpla un regex, sin tabla de jefes válidos: se pueden insertar `jefe-abc`, `jefe-abd`… y el cliente reconstruye +200 XP por cada uno. | `remoteProgress.ts:123-136`, `schema.sql:205`, `lib/xp.ts:11` | Baja en Shellpath (no hay ranking por XP), **alta si Txispa hace ranking de XP**. |
| H3 | `progress_baseline` es reescribible por su dueño (`for all`) con solo `xp >= 0` como restricción. | `schema.sql:433-435` | Baja mientras `verificado=false` y no compita. No hace falta en Txispa (no hay datos heredados anónimos que importar). |
| H4 | `speed_runs` sigue sin límite de escritura (Auditoría S3); `sp_limite_escritura` tiene `public.attempts` escrito a fuego. | `schema.sql:354-357`, `373-376` | Media si se copia tal cual. Parametrizar con `tg_table_name`. |
| H5 | `pull()` descarga **todo** el historial en cada sincronización, sin cursor (`order by created_at` en tramos de 1000). Con 1 usuario va bien; en Txispa cada fila pesa 3-5 KB por los mapas de teclas. | `remoteProgress.ts:153-168` | Media. Hace falta cursor (`created_at`/`seq` del servidor). Atención: el plan de Firebase ya lo ve (`syncedAt`). |
| H6 | No hay borrado de cuenta desde la app: la página dice "escríbeme, lo hago a mano". Existe `on delete cascade` desde `auth.users`, pero solo lo ejecuta un administrador. | `components/Privacidad.tsx:166-169`, `schema.sql:97` | **Alta con usuarios públicos** (derecho de supresión, §7). |
| H7 | `pantalla_key` tiene un regex propio de Shellpath `^[0-9]+/[A-Za-z0-9_-]+/[0-9]+$`. | `schema.sql:160` | Hay que cambiarlo para `leccionId` (`html/L01.01`, `linux/L01.J`). |
| H8 | Sin copias de seguridad en el plan gratuito; el único respaldo es cada navegador. | Auditoría §3 | Alta si hay datos de otras personas. |
| H9 | La función de ranking agrupa por `nickname` (único), así que el cambio de nick reescribe el ranking histórico (es lo deseado) pero no hay `nick_changed_at` ni moderación de nombres. | `schema.sql:462` | Baja. Con nicks públicos hace falta una vía de moderación. |

### 1.5 Estado de lo pendiente según los documentos (sin suponer que se resolvió)

| Pendiente | Documento | Estado documentado |
| --- | --- | --- |
| Migración SQL de seguridad (techo 600 + permiso por columna) | Estado 10/09 §4.1 | Escrita y empujada, **sin aplicar en la base viva**. |
| Confirmación de correo (SMTP propio con Resend + *Confirm email*) | Estado 10/09 §4.2, Auditoría I1 | **Apagada** (`mailer_autoconfirm: true` verificado por API el 10/09). Bloqueaba difundir. Además hay que fijar *Site URL* y *Redirect URLs*. |
| Cabeceras de seguridad (CSP, `frame-ancestors`, `nosniff`, `Referrer-Policy`) | Auditoría S4 | Solo HSTS; la página se podía meter en un iframe. |
| Límite de escritura en `speed_runs` | Auditoría S3 | Sin hacer. |
| Cuenta de prueba `asdf` | Auditoría I2 | Viva a 10/09. |
| Copias de seguridad | Auditoría §3, Estado 10/09 §4.3 | Decisión pendiente. |
| Despliegue por detrás del código | Auditoría D1 (7 commits atrás) | El Estado 10/09 dice que se empujó y se comprobó; no hay confirmación posterior. |

**Nada de esto consta como resuelto en documentos posteriores al 11/09.** Hay que verificarlo en Supabase, Vercel y la web antes de decir que Shellpath está "limpio".

---

## 2. Sincronización y autenticación

### 2.1 Cómo funciona

| Pieza | Archivo | Resumen |
| --- | --- | --- |
| Cliente único, `null` sin variables | `lib/supabase.ts:20-33` | Sesión en localStorage, refresco automático, `detectSessionInUrl`. Aviso en consola si falta el backend en producción (`:40-45`). |
| Auth | `lib/auth.ts` | Correo + contraseña (mínimo 8). Cuenta (`auth.users`) y perfil (`profiles`) son dos cosas; `ensureProfile` (`:244-263`) cierra el hueco cuando la confirmación por correo hace que la cuenta nazca antes que la sesión. Nick pendiente en localStorage. |
| Traducción evento ↔ fila | `lib/remoteProgress.ts` | Único sitio que sabe los nombres de las columnas. Sube sin `acc/ppm/score/xp_earned`; baja con los números del servidor. |
| Sync de progreso | `lib/progressSync.ts` | `SyncingProgressStore`: escribe en local sin esperar (`append`, `:106-112`), sube por detrás, buzón `unsyncedIds`, reintento al evento `online` (`:89-93`), parada tras 5 fallos seguidos (`:224`). |
| Copia local por usuario | `progressSync.ts:134` | `shellpath.v5.<userId>`; evita que el progreso de una persona se suba a la cuenta de otra en el mismo navegador. |
| Adopción del progreso anónimo | `progressSync.ts:167-174`, `:232` | Marca `shellpath.sync.reclamadaPor`: solo adopta la copia anónima quien la reclama primero. |
| Línea base | `progressSync.ts:176-180`, `remoteProgress.ts:228-247` | Importación única; si el servidor ya tiene una, manda esa (dos líneas base duplicarían XP sin que se viera). |
| Sync de tests y ranking | `lib/speedSync.ts`, `lib/remoteSpeed.ts` | El mismo molde; los tests en modo texto **no** suben (`speedSync.ts:50-52`) para no mezclar prosa con comandos. |
| Mezcla | `progressSync.ts:59-65` | `une()` por id; el servidor va delante porque sus números son los buenos. |

### 2.2 Cómo se reutiliza en Txispa Type

Txispa ya tiene el contrato que lo permite: `RunStore` (`Txispa lib/almacen.ts:11`) con `list/add/clear/importMany/subscribe`, `importMany` ya fusiona por `id`, y `Intento.id` es UUID (aunque falta el *fallback* sin `crypto.randomUUID`, M-02).

| Reutilizar casi tal cual | Adaptar | No hace falta |
| --- | --- | --- |
| `clasifica()` de códigos Postgres (ok / duplicado / reintentar / rechazado) | `SyncingProgressStore` → `SyncingRunStore` que envuelve el IndexedDB (decorador de `RunStore`) | La línea base heredada (`progress_baseline`) y `Baseline` |
| Copia local por usuario (`txispatype.<userId>` para IndexedDB y claves `txispatype.*`) | La adopción de la copia anónima: con IndexedDB hay que mover/etiquetar intentos por `user_id` local, no por clave de localStorage | `boss_wins` tal cual (los jefes serán lecciones de tipo `jefe`, ver §6) |
| Buzón de salida y reintentos al evento `online` | `pull()` con **cursor** en lugar de descarga completa (H5) | El test de 60 s de comandos |
| Patrón `Remoto` inyectable + suite de sync con servidor de mentira | Subida en lotes (`insert` de arrays) por volumen de filas con `jsonb` | |
| Cliente `null` sin variables + aviso en producción | Validación de `leccionId` contra una tabla de lecciones (no regex) | |
| `ensureProfile` + nick pendiente | Login con Google (Supabase lo soporta) para evitar correo/contraseña y SMTP propio | |

**Riesgo de reutilizar sin cuidado:** la adopción de la copia anónima es la parte más delicada de todo el sync (Hoja de Ruta Backend §0 y la suite de 11 casos). No se debe reescribir de cero: portarla con sus pruebas.

---

## 3. XP, anti-trampas, ranking y logros

### 3.1 Comparativa

| Aspecto | Shellpath | Txispa Type |
| --- | --- | --- |
| Base de XP | 1 XP por pulsación correcta + bonus de completado `10 × (0,4+1,6·acc²) × (1+ppm/240·0,25)` (`schema.sql:28-38`, `lib/xp.ts:22-29`) | `correct / 10` × multiplicador por precisión (0,5 / 0,8 / 1 / 1,5) (`Txispa lib/xp.ts:9-40`) |
| ¿Depende del historial? | **No.** Cada intento vale lo mismo siempre (columna generada). | **Sí.** Récord (+50), lección superada por primera vez (+30), dominada (+20), módulo completo (+100) dependen de los intentos previos (`Txispa lib/xp.ts:56-76`). |
| Dónde se calcula | Servidor (por intento); total y jefes en cliente | Todo en cliente: `xpTotal` recorre el historial (`Txispa lib/xp.ts:97-101`) |
| Niveles/etapas | 6 etapas de ROOT por umbrales de XP (`data/stages.ts`) | Niveles con rangos (`Txispa lib/xp.ts:133`) |
| Anti-trampas | Cotas en `check`, sanidad con `sospechoso`, límite de 60/min, columnas generadas | Ninguno (todo local) |
| Ranking | Solo test de 60 s, vista pública con `limit 100` | Ninguno |
| Logros | 10 familias derivadas en cliente (`data/logros.ts`, "llegar a N"); tabla `badges_unlocked` sin usar | Familias por tiers bronce→diamante derivadas (`Txispa lib/logros.ts`), una por curso generada del catálogo |

### 3.2 Qué XP debería ser server-side en Txispa

Solo hace falta **servidor** si hay algo público que dependa de la XP (ranking, perfiles con nivel). Si Txispa se queda como app personal, la XP derivada en cliente es suficiente. Si se abre al público:

| Concepto | Dónde debería vivir | Por qué |
| --- | --- | --- |
| `xp_base` por intento (caracteres correctos × multiplicador por precisión) | **Columna generada** en `attempts`, igual que Shellpath | Es sin estado; el cliente no puede inflarla. |
| Bonus sin historial (`limpio`: 0 errores y ≥150 caracteres) | Columna generada | Sin estado. |
| Bonus con historial (récord, lección por primera vez, dominada, módulo) | **Tabla `xp_awards` append-only**, rellenada por un trigger `after insert` en `attempts` con `unique (user_id, award_key)` (`lesson:html/L01.01`, `module:html/M01`…) | Es el equivalente a `unique (user_id, jefe_id)` de Shellpath: se cobra una vez y lo garantiza la BD, no el cliente. Resuelve H2. |
| XP total y nivel | **Vista** `user_xp` (`sum(xp_base) + sum(awards)`) | Se recalcula; no se mantiene a mano. |
| Logros | Seguir **derivándolos** (cliente y/o vista). Guardar `achievement_unlocked` solo si se quiere fecha de desbloqueo | Shellpath ya tiene `badges_unlocked` sin usar: no repetir el error de crear la tabla antes de necesitarla. |

**Aviso de rendimiento (Txispa, independiente del backend):** `xpTotal` llama a `desgloseXp(orden[k], orden.slice(0, k))` para cada intento (`Txispa lib/xp.ts:100`), y cada llamada recorre los previos (récord) y, en lecciones, recalcula `estadosGam` dos veces. Es **O(n²)**. Con los ~3.650 intentos/año de la estimación va bien; con decenas de miles se nota. Es otro motivo para mover XP a servidor o a un cálculo incremental.

### 3.3 Anti-trampas: lo que se puede y no se puede prometer

Shellpath lo dice con honestidad (`schema.sql:256-262`): ninguna app de mecanografía en el navegador puede impedir que alguien falsee su marca; solo se puede hacer que mentir cueste y que quede marcado. Para Txispa:

- **Ranking global de XP o de ppm:** solo con filas `sospechoso=false` y un tope por intento; el tope de ppm de Txispa debería ser el de **palabras** (`wpm`), no el de pulsaciones (Shellpath trabaja con *pulsaciones* por minuto; ojo con el glosario de `CLAUDE.md`).
- **Ranking por curso:** más difícil de falsear si la lección valida contra un `seed`/texto conocido (el contenido está en el repo; el servidor podría verificar longitud mínima del código y tiempo mínimo plausible por lección).
- **Perfil público mínimo:** nick, nivel, XP, racha. Nada de precisión por tecla.

---

## 4. Interfaz y flujo de usuario

### 4.1 Flujo de Shellpath (`App.tsx`, 652 líneas, sin enrutador)

La navegación es un `useState<View>` (`App.tsx:142`) y una cadena de `if/else` en `App.tsx:362-505`. Vistas: `inicio`, `niveles`, `test`, `ranking`, `stats`, `logros`, `privacidad`.

```
Landing (inicio) ─▶ Mapa de módulos (LevelMap) ─▶ Practice (una "pantalla" de 3 comandos)
                                              │            └─▶ ResultsModal (ppm, precisión, +XP, señal 1-3)
                                              └─▶ BossBattle (fase 1: elegir comando ante un escenario; fase 2: teclearlo)
Test de 60 s (TestsView) ─▶ Ranking (Leaderboard, sin cuenta)
Estadísticas (StatsView + radar de 5 ejes) · Logros (LogrosView) · Privacidad
Tutorial de 3 pasos tras el registro · SubidaEtapaPanel al subir de etapa · aviso de logro
```

Componentes y tamaño: `Landing.tsx` 258 líneas, `Header.tsx` 191, `StatsView.tsx` 237, `BossBattle.tsx` 302, `Tutorial.tsx` 150, `LogrosView.tsx` 78, `TestsView.tsx` 53. `Home.tsx` (3 líneas) no se usa.

**Lo que está bien resuelto y vale como referencia de producto**
- El **mapa** (`LevelMap.tsx`, 217 líneas) con progreso por módulo/lección y el jefe como remate; el rediseño aprobado lo cambia por un **camino serpenteante de nodos** con ROOT marcando "estás aquí" (`Especificación Visual (Fase 2).md` §4, y `preview/index.html`).
- El **resultado** por pantalla con "señal wifi" 1-3 en lugar de estrellas (`§2` y `preview/README.md`).
- El **jefe en dos fases** (diagnosticar y luego teclear): es el diferencial de Shellpath. Txispa ya tiene el equivalente de datos en `docs/curso/linux/TEMARIO-LINUX.md` (8 jefes con exactamente una opción ✔).
- **Subida de etapa** a pantalla completa y justificada (`SubidaEtapaPanel.tsx`): resuelve que la barra de XP "se reinicia" al subir.
- **Tutorial de 3 pasos** que solo enseña lo que no se deduce mirando (`Tutorial.tsx`, criterio de `Informe de Situación §11`).
- Regla de producto escrita: **toda insignia es "llegar a N"** con barra de progreso, nada opaco (`data/logros.ts:1-20`).

**Deuda conocida (documentada)**
- **Móvil sin resolver**: teclado virtual con teclas de `min-width: 44px` (`index.css:640`) y barra espaciadora de 320 px; modal de resultados con `min-width: 380px`. Decisión de fondo: practicar exige teclado físico (`useTecladoFisico`, `NecesitaTeclado.tsx`), así que "arreglar el móvil" es decidir qué ve quien entra desde un teléfono.
- **Rediseño visual a medias**: 2 de 10 pantallas portadas (Landing y Ajustes) a 09/09. El resto del rediseño sigue como `preview/` (HTML autocontenido con React 18 y CSS con variables, sin Tailwind).
- Tipografía: Nunito descartada por "app para niños"; recomendación IBM Plex Sans + JetBrains Mono (Informe de Situación §4.1). 14 emojis a sustituir por SVG a mano (`ModuleIcon.tsx` ya lo hace).
- Teclado virtual con las 9 teclas de la fila coloreadas a la vez: ruido; propuesta de acento único en la tecla activa (Auditoría Visual §3).
- Sonido y música: efectos de teclado recortados al ataque, error = mismo golpe más grave (`DefEfecto.tono`, `types.ts`), música con play/pausa en cabecera; arranca **apagado** a propósito (`types.ts`, `Settings.sonidos`). 20 MB de MP3 dentro de git (D4 de la auditoría: no se pueden adelgazar después).
- Mascota ROOT: 6 etapas (`data/stages.ts`), solo "Aprendiz" tiene fotogramas; el resto respira por CSS.

### 4.2 Qué es genérico y qué es de Linux

| Genérico (se lleva) | Específico de Linux / ROOT (no se lleva tal cual) |
| --- | --- |
| Catálogo → mapa de módulos → lección → resultado | La mascota ROOT y sus 6 etapas (decisión abierta en el `README` de Txispa) |
| Mapa de nodos con progreso y candados | Las categorías del test (`categorias.ts`: "Buscando el pipe"…) |
| Jefe de módulo (escenario + elegir + teclear) | El contenido de `levels.ts` y `jefes.ts` (ya convertido a `TEMARIO-LINUX.md`) |
| Subida de nivel con panel y barra de XP | El test oficial de 60 s de comandos y su ranking |
| Tutorial de 3 pasos | El radar de 5 ejes tal cual (hay que redefinir ejes: precisión, constancia, símbolos…) |
| Logros "llegar a N" con barra | Textos y chistes del mundo sysadmin |
| Sonido por teclado (`DefEfecto`) y tema claro/oscuro | |
| Aviso de "necesita teclado físico" | |

### 4.3 Flujo propuesto para Txispa con muchos cursos

```
Inicio (hoy: siguiente lección del curso activo, racha, XP)
  └─▶ Cursos (catálogo: tarjeta por curso con avance)           ← ya hecho en la fase 1
        └─▶ Curso (mapa de nodos por módulo, jefe al final)      ← nuevo, sustituye al listado
              └─▶ Lección (explicación + tecleo + nota por línea)
                    └─▶ Resultado (ppm, precisión, +XP, ¿superada?, siguiente)
Test · Entrenar · Calentar (como hoy)   Logros · Estadísticas (filtro por curso) · Perfil/Ranking (si hay cuenta)
```

Recomendaciones de arquitectura de UI:
- **Enrutado por hash** (`#/cursos/linux/M03`) hecho a mano: sin dependencia nueva (`CLAUDE.md` solo permite React, Vite, TypeScript, Vitest y oxlint) y permite enlaces directos y botón "atrás". Shellpath demuestra el coste de no tenerlo (`App.tsx` de 652 líneas y reseteos frágiles, Auditoría Técnica 13/07 §4).
- **El curso es la unidad de producto**; ROOT, si se conserva, debería ser la mascota de la *plataforma*, con skins por curso, no una mascota por curso.
- **Tema y diseño**: Txispa ya usa tokens CSS; el sistema de `preview/` (colores por señal: ámbar=XP, verde=acierto, rojo=error, morado=liga) es reutilizable tal cual.
- **Móvil**: decidir de entrada que el tecleo exige teclado físico y que el resto (catálogo, estadísticas, ranking, perfil) debe ser responsive desde el primer día; no repetir "portar primero y arreglar el móvil después".

---

## 5. Firebase frente a Supabase para Txispa Type

Situación actual: Lucas creó en Firebase el proyecto `txispa-type` (plan Spark), registró la app web `txispa-type-web`, habilitó Google en Authentication, creó Firestore en `eur3` en modo producción (sin reglas todavía) y autorizó `dallamond.github.io`. Shellpath ya tiene Supabase con SQL, RLS y un ranking funcionando.

### 5.1 Comparativa

| Criterio | Firebase (Auth + Firestore, Spark) | Supabase (Postgres) |
| --- | --- | --- |
| Encaje con intentos inmutables con UUID | Muy bueno: doc por intento, `create` sin `update`, id = clave | Muy bueno: tabla `attempts`, `id uuid` PK, idempotencia por PK (ya probado en Shellpath) |
| Anti-trampas y XP en servidor | **No sin Cloud Functions.** Las reglas validan forma, no calculan. Cloud Functions exige plan Blaze (pago por uso, con tarjeta; confirmar condiciones vigentes). | **Sí, gratis**: columnas generadas, triggers, vistas, funciones SQL |
| Ranking global y por curso | Documentos agregados escritos por el cliente (falseables) o Functions (Blaze) | Vista/consulta sobre las tablas, como `leaderboard_60s` |
| Datos relacionales (cursos, módulos, lecciones, XP) | Se modelan con subcolecciones; las consultas cruzadas son incómodas y caras en lecturas | Natural; y a Lucas le sirve para aprender SQL con su propio proyecto (futuro curso de MySQL) |
| Offline y tiempo real | **Excelente**: `persistentLocalCache`, `onSnapshot` entre PCs | Hay que construirlo (ya existe en `progressSync.ts`); tiempo real opcional |
| Plan gratuito | 50.000 lecturas, 20.000 escrituras al día, 1 GiB (valores del plan del propio repo: verificar vigentes). **No se duerme.** | 500 MB de base de datos y límite de usuarios activos (verificar vigentes). **El proyecto se pausa por inactividad** y tarda **7,8 s en frío** (medido en Shellpath, Auditoría D6) |
| Copias de seguridad | No automáticas en Spark (exportación manual) | No automáticas en el plan gratuito; con Pro sí |
| Login con Google | Nativo, ya habilitado | Soportado (OAuth); hay que configurar el cliente en Google Cloud |
| Una sola cuenta para Shellpath y Txispa | Shellpath tendría que migrar de Supabase Auth a Firebase Auth (usuarios actuales: solo Lucas) | Mismo proyecto, mismo `profiles`: la cuenta ya existe |
| Lock-in | Alto (Firestore NoSQL propietario) | Bajo (Postgres estándar, exportable con `pg_dump`) |
| Mantenimiento | Reglas en un DSL aparte, emulador para probarlas | SQL versionado en el repo, como ya se hace; pruebas con servidor de mentira ya escritas |
| Coste de la decisión | Reutiliza lo ya creado en la consola | Hay que añadir el SDK de Supabase (ya lo usa Shellpath) y crear o reutilizar un proyecto |

### 5.2 Recomendación

**Supabase, un único proyecto para ambas apps, con un esquema compartido de identidad (`profiles`, nicks) y tablas propias por producto.** Motivos, por orden de peso:

1. Si habrá ranking público o XP con valor, la autoridad tiene que estar en el servidor; con Spark no se puede.
2. Postgres encaja con el modelo de cursos futuros y con tu aprendizaje de SQL.
3. Ya hay un backend probado, una suite de sincronización y una auditoría de seguridad de la que aprender; reutilizarlo ahorra semanas.
4. Una sola cuenta para dos aplicaciones, sin migrar usuarios.

**Cuándo elegiría Firebase en su lugar:** si Txispa Type fuera a seguir siendo una app **personal** con sincronización entre tus PCs, sin ranking ni usuarios públicos. Ahí Firestore con caché persistente es más simple, no se duerme y el plan de `docs/PLAN_INTEGRACION_FIREBASE.md` está completo y bien pensado. Pero tu mensaje apunta a lo contrario (web con cursos, XP, inicio de sesión, "buen proyecto desde el principio", usuarios futuros).

**Lo hecho en Firebase no se pierde:** el proyecto vacío no cuesta nada. Puede dejarse sin usar o borrarse. Lo único con valor reutilizable es el cliente OAuth de Google si se enlaza con Supabase.

### 5.3 Riesgos de la recomendación y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Pausa por inactividad y 7,8 s en frío | Un *ping* programado (GitHub Actions cada pocos días) evita la pausa; la interfaz ya sabe avisar a los 2,5 s y cortar a los 15 (`Estado 10/09 §2`). Con usuarios reales, valorar el plan de pago. |
| Sin copias de seguridad | Exportación periódica (`pg_dump` programado o export de intentos desde la app a JSON, que ya existe en Txispa). |
| Un único proyecto = un único punto de fallo para dos apps | Esquemas separados (`shellpath`, `txispa`) y `profiles` compartido; límites de escritura en todas las tablas. |
| Límite del plan gratuito de proyectos activos | Verificar que Shellpath + Txispa caben en uno solo (por eso se propone un solo proyecto). |
| Los mapas `teclas/pares/confusiones` (3-5 KB por intento) engordan la base | `jsonb` comprimido por defecto en TOAST; para público, valorar guardar el detalle solo local y sincronizar agregados. Calcular antes de abrir. |
| Reutilizar mal la adopción de copia anónima | Portarla con su suite de pruebas, no reescribirla (§2.2). |

---

## 6. Propuesta de esquema (Postgres / Supabase)

Principios heredados de Shellpath: hechos inmutables, derivar todo lo derivable, nota decidida por el servidor, marcar en vez de rechazar, límite de escritura en **todas** las tablas de hechos, y RLS: leer y añadir solo lo propio.

### 6.1 Esquemas y tablas

```sql
-- Identidad compartida entre Shellpath y Txispa (un perfil por cuenta)
create schema if not exists txispa;

-- profiles ya existe en public (Shellpath). Se amplía, no se duplica:
alter table public.profiles
  add column if not exists avatar text,                 -- id de un avatar predefinido, nunca una URL libre
  add column if not exists is_public boolean not null default false;  -- aparecer en rankings: opt-in

-- Catálogo de contenido (solo METADATOS; el texto a teclear se queda en el repo)
create table txispa.courses (
  id        text primary key check (id ~ '^[a-z0-9-]{2,30}$'),   -- 'html', 'css', 'linux', 'mysql'
  title     text not null,
  requires  text references txispa.courses(id),
  position  smallint not null
);
create table txispa.modules (
  course_id text references txispa.courses(id),
  id        text,                                  -- 'M01'
  position  smallint not null,
  free      boolean not null default false,        -- módulo libre (diccionario)
  primary key (course_id, id)
);
create table txispa.lessons (
  id         text primary key check (id ~ '^[a-z0-9-]{2,30}/L[0-9]{2}\.([0-9]{2}|R|J)$'), -- 'html/L01.01'
  course_id  text not null,
  module_id  text not null,
  position   smallint not null,
  kind       text not null check (kind in ('leccion','repaso','jefe')),
  difficulty smallint not null check (difficulty between 1 and 5),
  lines      smallint not null,
  foreign key (course_id, module_id) references txispa.modules(course_id, id)
);

-- FUENTE DE VERDAD: un intento = una fila
create table txispa.attempts (
  id           uuid primary key,                   -- generado en el cliente (idempotencia)
  user_id      uuid not null references auth.users(id) on delete cascade,
  mode         text not null check (mode in ('test','entreno')),
  source       text not null check (source in ('banco','debiles','alternancia','ia','ejercicio','curso')),
  lesson_id    text references txispa.lessons(id),      -- solo si source = 'curso'
  duration_sec integer not null check (duration_sec between 1 and 3600),
  elapsed_sec  integer not null check (elapsed_sec between 1 and 3600),
  correct      integer not null check (correct between 0 and 20000),
  errors       integer not null check (errors  between 0 and 20000),
  strict       boolean not null default false,
  seed         bigint,
  keys         jsonb,                              -- agregados por tecla / par / confusión (nunca texto del usuario)
  created_at   timestamptz not null default now(),
  local_date   date not null,
  suspicious   boolean not null default false,
  -- Calculadas por el servidor (el cliente no puede declararlas):
  acc          numeric(4,1) generated always as (txispa.acc(correct, errors)) stored,
  wpm          numeric(5,1) generated always as (txispa.wpm(correct, elapsed_sec)) stored,   -- caracteres/5 por minuto
  xp_base      integer      generated always as (txispa.xp_base(correct, errors)) stored,
  check ((source = 'curso') = (lesson_id is not null))
);
create index on txispa.attempts (user_id, created_at desc);
create index on txispa.attempts (user_id, lesson_id) where lesson_id is not null;
create index on txispa.attempts (mode, wpm desc) where suspicious = false;
```

```sql
-- Premios con historial: se cobran una vez, lo garantiza la base de datos
create table txispa.xp_awards (
  user_id   uuid not null references auth.users(id) on delete cascade,
  award_key text not null check (award_key ~ '^(lesson|mastered|module|record|clean):[A-Za-z0-9/._-]{1,60}$'),
  xp        integer not null check (xp > 0),
  attempt_id uuid not null references txispa.attempts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, award_key)
);
-- Lo rellena una función security definer (trigger after insert en attempts) con los mismos
-- criterios que lib/progresoCurso.ts: superada ≥95 %; dominada ≥98 % y ppm de la dificultad, o 3 días distintos;
-- módulo completo cuando todas sus lecciones (no libres) tienen un intento superado.

-- Ajustes sincronizables (último en escribir gana; los de dispositivo NO se suben)
create table txispa.settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 4096),
  updated_at timestamptz not null default now()
);

-- Contadores aditivos que hoy están en localStorage (calentamientos, tiempo extra)
create table txispa.daily_extra (
  user_id    uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  extra_sec  integer not null default 0 check (extra_sec >= 0),
  warmup_keys integer not null default 0 check (warmup_keys >= 0),
  primary key (user_id, local_date)
);
```

```sql
-- Derivados: VISTAS, no tablas mantenidas a mano
create view txispa.user_xp as
  select u.user_id,
         coalesce(a.xp, 0) + coalesce(w.xp, 0) as xp
  from (select distinct user_id from txispa.attempts) u
  left join (select user_id, sum(xp_base) xp from txispa.attempts where not suspicious group by 1) a using (user_id)
  left join (select user_id, sum(xp)      xp from txispa.xp_awards group by 1) w using (user_id);

create view txispa.lesson_progress as           -- hecha / dominada por lección y usuario
  select user_id, lesson_id,
         bool_or(acc >= 95)                                     as superada,
         count(distinct local_date) filter (where acc >= 95)    as dias_superada,
         max(wpm) filter (where acc >= 95)                      as mejor_wpm
  from txispa.attempts where source = 'curso' group by 1, 2;

-- Rankings públicos: solo nick + marca; nunca user_id; solo quien optó (is_public)
create view txispa.leaderboard_xp  with (security_invoker = off) as
  select p.nickname, x.xp from txispa.user_xp x join public.profiles p using (user_id)
  where p.is_public order by x.xp desc limit 100;
create view txispa.leaderboard_course with (security_invoker = off) as   -- una fila por (curso, usuario)
  select l.course_id, p.nickname, count(*) filter (where lp.superada) as lecciones, max(lp.mejor_wpm) as mejor_wpm
  from txispa.lesson_progress lp
  join txispa.lessons l on l.id = lp.lesson_id
  join public.profiles p using (user_id)
  where p.is_public group by 1, 2;
```

**Logros:** no tabla al principio (se derivan, como hoy). Si se quiere "desbloqueado el 12/11", añadir `txispa.achievements (user_id, achievement_id, tier, unlocked_at, primary key (user_id, achievement_id, tier))` rellenada por el cliente y verificada por una función. No repetir `badges_unlocked`, que en Shellpath nació sin uso.

### 6.2 Seguridad (checklist mínima)

| Medida | Detalle |
| --- | --- |
| RLS en todas las tablas | Leer y `insert` solo `auth.uid() = user_id`; **sin update ni delete** en hechos. `settings` y `daily_extra` sí reescribibles por su dueño. |
| Catálogo (`courses/modules/lessons`) | Lectura pública; escritura solo con la clave de servicio (script de CI al publicar), nunca desde el cliente. |
| Límite de escritura en **todas** las tablas de hechos | Una sola función parametrizada con `tg_table_name` (H4). Código `54000` para "reintenta". |
| Perfiles | Vista pública de solo `nickname` + permiso por columna; quitar `select` directo a `authenticated` salvo la fila propia (H1). |
| Marcado, no rechazo | Fecha futura rechaza; `wpm` imposible, fechas desfasadas o intentos de curso más rápidos que un mínimo plausible por línea → `suspicious`. |
| Validación del `lesson_id` | FK a `lessons`; hay que sincronizar el catálogo desde `npm run curso:generar` (un script más) y un test que compruebe que todo `leccionId` del repo existe en la BD de pruebas. |
| Borrado de cuenta autoservicio | Función de borrado (Edge Function con clave de servicio) que borra `auth.users` y deja actuar a `on delete cascade`. Imprescindible antes de abrir (H6). |
| Cabeceras | `vercel.json`/hosting con CSP (primero `Report-Only`), `frame-ancestors`, `nosniff`, `Referrer-Policy` (S4). En GitHub Pages no se pueden fijar cabeceras: otro motivo para valorar Vercel como destino único. |
| Copias | Export programado y probado de restauración. |

### 6.3 ¿El contenido de los cursos va en la base de datos o en el repo?

**En el repo, como hoy.** El texto de las lecciones (el código que se teclea, las notas, las explicaciones) es contenido versionado, revisable en Markdown, validado por el generador y por los tests (`docs/curso/linux/TEMARIO-LINUX.md`, `npm run check`), y funciona sin red. Meterlo en la BD añade latencia, cuota de lecturas y pérdida del modo sin conexión sin aportar nada hasta que haya **autores** que editen contenido sin tocar Git.

En la BD van solo los **metadatos** (`courses`, `modules`, `lessons`: ids, orden, dificultad, nº de líneas) para que el servidor valide `lesson_id` y calcule módulos completos, y se generan del mismo Markdown en el paso de publicación.

**Cuándo replantearlo:** si llegan cursos largos de SMR/ASIR con muchos autores, ejercicios con corrección (consultas SQL ejecutadas en un sandbox, tests con respuesta) o contenido de pago. Entonces el contenido pasa a una tabla `lesson_content` versionada, con el repo como origen de importación. Dejar el modelo de `lessons` ya preparado (`kind` ampliable: `'quiz'`, `'sql'`, `'lab'`).

**Cursos que no son de tecleo (SMR/ASIR):** el modelo de `attempts` está pensado para tecleo. Para teoría, tests tipo test y laboratorios hará falta una tabla de eventos hermana (`txispa.activity_events (id uuid, user_id, lesson_id, kind, score, payload jsonb, ...)`) con el mismo patrón (inmutable, UUID de cliente, RLS propia). No forzar un `attempt` de tecleo con `correct=0` para registrar un test.

---

## 7. Privacidad y RGPD (importante antes de abrir)

Shellpath ya tiene una página de privacidad (`components/Privacidad.tsx`) que declara: correo y contraseña gestionados por Supabase, nick público, analítica de Google solo con consentimiento, Supabase alojado en la UE, edad mínima de **14 años** (`:175`) y derechos ejercidos escribiendo a un alias (`:166-169`). Es un buen punto de partida, pero:

| Tema | Situación | Qué hace falta |
| --- | --- | --- |
| Responsable del tratamiento | Lucas, persona física, 19 años | Identificarse como responsable en la política y tener un correo real recibiendo en el alias (el propio código avisa de que "TIENE que estar recibiendo correo", `Privacidad.tsx:8`). |
| Menores | La edad mínima declarada es 14 (coherente con la edad de consentimiento digital en España), pero **no hay ninguna comprobación**: es solo una frase. | Casilla explícita de "tengo 14 años o más" en el alta, y no recoger fecha de nacimiento. Si el público objetivo incluye alumnado de SMR/ASIR, es plausible que haya menores de 18: nada de datos innecesarios. |
| Nicks públicos | Visibles en rankings, con regex seguro | **Opt-in** al ranking (`profiles.is_public` por defecto `false`), nick sin datos personales, vía de moderación y de reporte, y no permitir el nick = correo. |
| Supresión (art. 17) | Solo "escríbeme, lo hago a mano" | Botón de borrado de cuenta (H6) y exportación (la exportación JSON de Txispa ya existe). |
| Retención | "Mientras tengas la cuenta" | Añadir qué pasa con cuentas inactivas (p. ej. aviso y borrado a los N meses). |
| Transferencias fuera del EEE | Vercel y Google (cláusulas tipo) | Mantenerlo y añadir lo que corresponda si Txispa usa GitHub Pages o Firebase. |
| Analítica | Google Analytics solo con consentimiento previo (`lib/consent.ts`) | Txispa hoy no tiene analítica; **no añadirla** salvo necesidad. |
| Datos de teclado | Agregados por tecla/par/confusión, sin texto | Mantener la regla de `CLAUDE.md` ("no guardes pulsaciones sueltas con texto del usuario"); documentarlo en la política. |
| Registro de actividades y evaluación de impacto | No existe | Si solo es un proyecto personal sin fines comerciales con pocos usuarios, el riesgo es bajo, pero conviene un registro simple de tratamientos. Esto **no es asesoría legal**: si se abre a un centro educativo, consultar con quien corresponda. |

---

## 8. Preguntas abiertas para Lucas

1. **¿Txispa Type será pública con ranking, o personal con sincronización?** Es la pregunta que decide Firebase o Supabase (§5.2). Mi lectura de tus mensajes es "pública, con cursos y XP".
2. **¿Un solo proyecto de Supabase para Shellpath y Txispa, o uno por producto?** Recomiendo uno solo para compartir cuenta; el coste es el acoplamiento.
3. **¿Cuenta con correo y contraseña (como Shellpath), con Google, o ambas?** Google ahorra el SMTP propio de Resend y la confirmación por correo.
4. **¿Ranking de XP global, por curso, ambos o ninguno al principio?** Cuanto menos se prometa, menos hay que defender de las trampas.
5. **¿Los cursos de SMR/ASIR serán de tecleo o también de teoría/tipo test/laboratorio?** Cambia el modelo (§6.3, tabla de eventos hermana).
6. **¿Trasladamos Txispa a Vercel como destino único?** Permitiría cabeceras de seguridad y un solo despliegue; GitHub Pages no deja fijarlas.
7. **¿Se conserva ROOT como mascota de la plataforma?** Pregunta abierta desde el `README` de Txispa. El rediseño de Shellpath tiene el sistema visual ya aprobado en `preview/`.
8. **¿Qué hacemos con los pendientes de Shellpath (confirmación de correo, migración SQL, cabeceras, backups)?** Si Txispa comparte proyecto de Supabase, esos pendientes pasan a bloquear también a Txispa.
9. **¿Los `^` de L07.02 del curso de Linux** (tecla muerta en el teclado español): se prueban en el navegador antes de abrir al público.
10. **¿Quieres conservar el proyecto de Firebase?** No cuesta nada, pero conviene decidir para no tener dos fuentes de verdad.

## 9. Riesgos de la integración (resumen)

| Riesgo | Prob. | Impacto | Mitigación |
| --- | --- | --- | --- |
| Abrir al público sin borrado de cuenta ni confirmación de correo | Media | Alto (RGPD y cuentas huérfanas) | Cerrarlos antes de difundir (§7, H6, §1.5). |
| Ranking con trampas (XP o ppm falsos) | Alta si hay ranking | Medio | Valores server-side, `suspicious`, opt-in, nada de ranking al principio. |
| Pausa de Supabase y primera carga de 7,8 s | Alta en plan gratuito | Medio | *Ping* programado, mensajes de espera, plan de pago si hay usuarios. |
| Pérdida de datos sin copias | Baja-media | Alto | Exportación programada y restauración probada. |
| XP en cliente con coste O(n²) | Media a medio plazo | Medio | XP en servidor o cálculo incremental (§3.2). |
| Mezclar `^` y teclas muertas en las lecciones de Linux | Media | Bajo | Probar con el teclado físico antes de publicar. |
| Dos backends a medias (Firebase y Supabase) | Media | Medio | Decidir ya cuál se queda (pregunta 10). |
| Reescribir la adopción de copia anónima y duplicar XP | Media | Alto | Portarla con sus pruebas (§2.2). |
| Un único `App.tsx`/vista por `useState` creciendo con cada curso | Alta | Medio | Enrutado por hash desde el inicio (§4.3). |

---

## Anexo: archivos leídos

Código de Shellpath: `app/supabase/schema.sql`, `app/supabase/migraciones/2026-09-10-umbral-trampas-y-columnas-de-profiles.sql`, `lib/attempts.ts`, `lib/derive.ts`, `lib/xp.ts`, `lib/supabase.ts`, `lib/auth.ts`, `lib/remoteProgress.ts`, `lib/progressSync.ts`, partes de `lib/remoteSpeed.ts`, `lib/speedSync.ts`, `lib/progressStore.ts`, `lib/consent.ts`, `lib/skillRadar.ts`, `data/stages.ts`, `data/logros.ts`, `data/categorias.ts`, y cabeceras de `App.tsx`, `LevelMap.tsx`, `Tutorial.tsx`, `SubidaEtapaPanel.tsx`, `Header.tsx`, `Privacidad.tsx`.
Documentos de Shellpath: Auditoría Técnica 13/07, Auditoría de Seguridad 10/09, Informe de Situación 09/09, Hoja de Ruta Backend 08-09/09, Estado 10/09, `PARALELO`, `log.md`, Especificación Visual (Fase 2), Auditoría Visual 08/09, PROMPT de rediseño, Guía de Mejoras Fase 2 (índice), Roadmap, TEMARIO PREMIUM (índice), `preview/README.md`.
Txispa: `types.ts`, `lib/almacen.ts`, `lib/xp.ts`, `docs/PLAN_INTEGRACION_FIREBASE.md`.
