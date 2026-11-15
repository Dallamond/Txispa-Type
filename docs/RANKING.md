# Ranking público opt-in (mejor ppm en test)

Estado: interfaz, lógica y almacén en memoria hechos. **No hay almacén real** (`RankingFirestore` pendiente) y no está enganchado en `App.tsx`.

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

## Integrarlo en `App.tsx` (pendiente, lo haces tú)

```tsx
import Ranking from "./components/Ranking";
import { RankingMemoria } from "./lib/rankingMemoria";

// fuera del componente (o en un useMemo/useState estable): el almacén debe ser el mismo entre renders
const rankingStore = new RankingMemoria({ latenciaMs: 300 });

// dentro de la pestaña "Ranking":
<Ranking store={rankingStore} intentos={intentos} haySesion={!!sesion.usuario} />
```

1. Añade la pestaña "Ranking" a la navegación y renderiza el bloque anterior.
2. `intentos` es el de `useIntentos(almacen)` y `sesion` el de `useSesion()`, ambos ya presentes en `App`.
3. El almacén tiene que ser estable (la caché del hook va por instancia).
4. Cuando exista `RankingFirestore`, cárgalo de forma diferida con la sesión y, si no hay `VITE_FIREBASE_*`, deja `RankingMemoria` vacío (`filas: []`) o oculta la pestaña. Con la memoria, los datos de ejemplo son ficticios: no los muestres en producción.

## Esquema de Firestore propuesto

```
publico/{uid}        { alias, mejorWpm, accMejor, tests, actualizadoEn }
alias/{aliasLower}   { uid }
```

- Lista: `publico` ordenada por `mejorWpm` descendente, `limit(50)`, con índice de un solo campo.
- Puesto: contar documentos con `mejorWpm` mayor (`count()`), más uno.
- Publicar: transacción que crea `alias/{aliasLower}` (si no existe o es del mismo uid), borra el alias antiguo si cambió y escribe `publico/{uid}`.
- Retirar: transacción que borra `publico/{uid}` y `alias/{aliasLower}`.

### Reglas propuestas (NO PROBADAS en el emulador)

```
match /publico/{uid} {
  allow read: if true;
  allow create, update: if request.auth != null && request.auth.uid == uid
    && request.resource.data.keys().hasOnly(['alias','mejorWpm','accMejor','tests','actualizadoEn'])
    && request.resource.data.alias is string
    && request.resource.data.alias.matches('^[A-Za-z0-9_-]{3,20}$')
    && request.resource.data.mejorWpm is number
    && request.resource.data.mejorWpm >= 0 && request.resource.data.mejorWpm <= 300
    && request.resource.data.accMejor is number
    && request.resource.data.accMejor >= 95 && request.resource.data.accMejor <= 100
    && request.resource.data.tests is int && request.resource.data.tests >= 1
    && request.resource.data.actualizadoEn == request.time
    && getAfter(/databases/$(database)/documents/alias/$(request.resource.data.alias.lower())).data.uid == uid;
  allow delete: if request.auth != null && request.auth.uid == uid;
}
match /alias/{aliasLower} {
  allow read: if true;
  allow create: if request.auth != null
    && request.resource.data.keys().hasOnly(['uid'])
    && request.resource.data.uid == request.auth.uid
    && aliasLower == aliasLower.lower()
    && aliasLower.matches('^[a-z0-9_-]{3,20}$');
  allow delete: if request.auth != null && resource.data.uid == request.auth.uid;
  allow update: if false;
}
```

Todo esto está sin ejecutar: faltan pruebas en el emulador (`firebase emulators:start`) de: alias duplicado, cambio de alias, borrado de ambos documentos, `getAfter` dentro de transacciones, y que `read: if true` permita las consultas de lista sin exponer nada más. `firestore.rules` no se ha tocado.

## Límite conocido: el ppm se puede falsear

Con el plan Spark el cliente escribe directamente su marca: las reglas pueden validar forma y rangos, pero no que el test haya ocurrido. Un cliente manipulado puede publicar, por ejemplo, 120 ppm. Es un ranking de confianza entre conocidos. Verificarlo de verdad exigiría que un servidor recalculara la marca a partir de los intentos (Cloud Functions, que requiere plan Blaze) o mover el ranking a otro backend (por ejemplo Supabase con funciones propias). Mientras tanto la interfaz avisa de que no está verificado.

## Checklist manual (pendiente de probar por Lucas)

- [ ] Sin sesión: se ve la tabla y el aviso de que hay que iniciar sesión.
- [ ] Sin tests con precisión >= 95 %: no deja publicar y lo explica.
- [ ] Activar el interruptor, alias inválido, alias ocupado ("Norte" en la memoria) y alias bueno.
- [ ] Tras publicar, tu fila sale resaltada y con el puesto.
- [ ] "Salir del ranking" borra la fila.
- [ ] Con `latenciaMs` de 3000 aparece el aviso de lentitud; con `fallar: true`, el error y "Reintentar".
- [ ] Navegación con teclado y lector de pantalla (el interruptor es un botón con `role="switch"`).
