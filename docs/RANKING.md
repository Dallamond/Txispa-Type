# Ranking público opt-in (mejor ppm en test)

Estado: interfaz, lógica, almacén en memoria, `RankingFirestore` y pestaña "Ranking" en `App.tsx` hechos y con `npm run check` en verde. **Las reglas de Firestore y el adaptador del SDK no se han probado contra Firebase real ni con emulador.**

## Qué es

Tabla pública de mejor ppm en test. Sin XP. Solo entra quien lo activa, con un alias propio. Es un ranking de la comunidad **sin verificación**, y la interfaz lo dice.

## Arquitectura

| Archivo | Papel |
|---|---|
| `src/lib/ranking.ts` | Tipos (`FilaRanking`, `RankingStore`), `validarAlias`, `aliasClave`, `perfilPublicoDesde`, `compararFilas`. Puro. |
| `src/lib/rankingMemoria.ts` | `RankingMemoria`: almacén en memoria con datos de ejemplo, latencia inyectable (`latenciaMs`) y `fallar` para probar errores. |
| `src/hooks/useRanking.ts` | Carga lista y puesto; aviso de lentitud a 2,5 s, tope de 15 s con error y botón de reintento, caché de 5 min por almacén (se invalida al recargar). |
| `src/components/Ranking.tsx` | Tabla con tu fila resaltada, estados cargando/error/vacío, interruptor de opt-in, formulario de alias, "Actualizar mi marca" y "Salir del ranking". |
| `src/ranking.css` | Estilos propios; solo variables de tema existentes. Lo importa `Ranking.tsx`. |

Reglas de lo que se publica (`perfilPublicoDesde`): solo intentos de modo test; `mejorWpm` es el mayor `wpm` con precisión >= 95 % (`PRECISION_MINIMA` de `lib/medidas.ts`); `accMejor` es la mayor precisión entre esos tests; `tests` cuenta todos los tests. Sin ningún test válido devuelve `null` y la interfaz no deja publicar.

El alias propio se recuerda en `txispatype.ranking.alias` (solo para saber qué fila resaltar y poder "Actualizar mi marca"). El puesto lo da `store.miPuesto()`.

## Integración en `App.tsx` (hecha)

- Pestaña `ranking` (etiqueta "Ranking"). El almacén se crea con `useMemo` por usuario: con la nube configurada, `crearRankingNube(uid)` (`lib/rankingFirestore.ts`); sin ella, `new RankingMemoria({ filas: [] })` (vacío, sin datos de ejemplo).
- `Ranking` recibe `haySesion` y `nubeDisponible`. Sin nube explica que la app funciona solo en local; sin sesión deja ver la tabla y pide iniciar sesión para participar.
- `rankingFirestore.ts` contiene `RankingFirestore` (orquestación pura sobre un `BackendRanking` inyectable, con tests) y no importa el SDK; `rankingFirestoreSdk.ts` es el único que importa `firebase/firestore` y se carga con `import()` dinámico (chunk aparte). Errores del SDK traducidos al español.
- Publicar: lee perfil propio y reserva del alias, y escribe en un `writeBatch` el perfil, la reserva (solo si aún no es nuestra: las reglas cierran el `update`) y el borrado de la reserva anterior si el alias cambió (mayúsculas aparte). Retirar borra perfil y reserva en otro lote. Puesto: `count()` de perfiles con más ppm, más uno (los empates comparten puesto).
- Cuota: lista de 50 filas y `count()` por carga, con caché de 5 min del hook; sin sesión solo se lee la lista.

## Esquema de Firestore propuesto

```
publico/{uid}        { alias, mejorWpm, accMejor, tests, actualizadoEn }
alias/{aliasLower}   { uid }
```

- Lista: `publico` ordenada por `mejorWpm` descendente, `limit(50)`, con índice de un solo campo.
- Puesto: contar documentos con `mejorWpm` mayor (`count()`), más uno.
- Publicar: lote atómico que crea `alias/{aliasLower}` (si no existe o es del mismo uid), borra el alias antiguo si cambió y escribe `publico/{uid}`.
- Retirar: lote que borra `publico/{uid}` y `alias/{aliasLower}`.

### Reglas (en `firestore.rules`, bloque "RANKING PÚBLICO", NO PROBADAS)

Están en el archivo, en un bloque separado antes de la denegación general. Resumen de lo que validan:

- `publico/{uid}`: lectura pública; escribe solo su dueño, con exactamente las 5 claves, alias con `^[A-Za-z0-9_-]{3,20}$`, `mejorWpm` 0 a 300, `accMejor` 95 a 100, `tests` entero >= 1, `actualizadoEn == request.time` y `getAfter(alias/{alias.lower()}).data.uid == uid` (la reserva tiene que ser suya tras el lote). Borra solo su dueño.
- `alias/{aliasLower}`: `get` público (para comprobar si está libre) pero **sin `list`**; `create` solo si el `uid` es el propio y `getAfter(publico/{auth.uid}).alias.lower()` coincide con la clave (nadie reserva alias sin perfil); `update` cerrado; `delete` solo del dueño.

Todo sin ejecutar. Faltan en el emulador (`firebase emulators:start`): alias duplicado, cambio de alias, borrado de ambos documentos, que `getAfter` funcione dentro de un `writeBatch` y que `read: if true` permita la consulta ordenada. Límites conocidos: la reserva y el perfil se comprueban entre sí pero un cliente manipulado podría dejar una reserva huérfana propia (un solo alias a la vez, sin impacto en terceros); el uid del dueño es legible en `alias/{clave}` (el id de `publico` ya es el uid).

## Límite conocido: el ppm se puede falsear

Con el plan Spark el cliente escribe directamente su marca: las reglas pueden validar forma y rangos, pero no que el test haya ocurrido. Un cliente manipulado puede publicar, por ejemplo, 120 ppm. Es un ranking de confianza entre conocidos. Verificarlo de verdad exigiría que un servidor recalculara la marca a partir de los intentos (Cloud Functions, que requiere plan Blaze) o mover el ranking a otro backend (por ejemplo Supabase con funciones propias). Mientras tanto la interfaz avisa de que no está verificado.

## Checklist manual (pendiente de probar por Lucas, contra Firebase real)

- [ ] Publicar `firestore.rules` (consola > Firestore > Reglas, o `firebase deploy --only firestore:rules`). Si la consola avisa de errores de sintaxis, anotarlos.
- [ ] Sin nube (sin `.env.local`): la pestaña Ranking sale vacía y explica que la app funciona solo en local.
- [ ] Con nube y sin sesión: se ve la tabla y pide iniciar sesión.
- [ ] Entrar con una cuenta; con un test de precisión >= 95 %, activar el interruptor, probar alias inválido y publicar uno bueno. Comprobar en la consola `publico/{uid}` y `alias/{alias en minúsculas}`.
- [ ] Ver tu fila resaltada y el puesto; abrir otro navegador (sin sesión o con otra cuenta) y ver la fila.
- [ ] Con otra cuenta, intentar el mismo alias (también en otras mayúsculas): debe rechazarlo.
- [ ] Cambiar de alias ("Salir" y volver a publicar, o "Actualizar mi marca" con otro): la reserva antigua desaparece y el alias antiguo queda libre.
- [ ] "Actualizar mi marca" con el mismo alias no da error de permisos.
- [ ] "Salir del ranking" borra `publico/{uid}` y `alias/{clave}`.
- [ ] Cerrar sesión: el ranking sigue visible y no deja publicar.
- [ ] Navegación con teclado y lector de pantalla (el interruptor es un botón con `role="switch"`).
