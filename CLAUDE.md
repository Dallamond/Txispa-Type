# Txispa Type: instrucciones para Claude Code

Entrenador de mecanografía propio de Lucas. Sustituye a typing.com en su práctica diaria y está pensado para subir de unos 46 ppm de media a 65 (70 en sus mejores tests) cuidando la precisión. Este archivo lo lees siempre al empezar una sesión.

## Léelo en este orden

1. `README.md`: qué hay en la carpeta y decisiones ya tomadas.
2. `docs/HOJA-DE-PROYECTO.md`: objetivos, investigación, calentamientos, requisitos y plan de entrenamiento.
3. `docs/ESPECIFICACION-TECNICA.md`: modelo de datos, fórmulas, estructura de carpetas y pantallas. Es la fuente de verdad técnica.
4. `docs/REUTILIZAR-SHELLPATH.md`: qué archivos de Shellpath se copian, cuáles se adaptan y cuáles no.
5. `docs/FASES.md`: fases, tareas y criterio de "hecho" de cada una. Trabaja una fase cada vez.
6. `reference/`: capturas de typing.com y de Shellpath, y la v1 de un solo HTML (`txispa-type-v1.html`), que ya funciona y sirve de referencia de comportamiento.

## Reglas que no se negocian

- **Idioma:** interfaz, comentarios, commits y documentación en español (es-ES). Fechas en `Europe/Madrid`.
- **Local primero:** sin backend, sin cuentas, sin Supabase, sin analítica, sin CDN, sin fuentes externas. Tiene que funcionar sin internet. Lo único que sale a la red es la llamada opcional a Ollama en `localhost` (fase 4).
- **Shellpath es solo lectura.** Está en `../Shellpath/app/src`. Se copia código desde ahí, pero nunca se modifica ni se toca su repositorio. No abras `../Shellpath/app/.env.local` ni ningún archivo `.env*`.
- **Claves de almacenamiento propias:** todo lo que se guarde en el navegador empieza por `txispatype.` para no pisar el `shellpath.*` de Shellpath.
- **Dependencias:** solo React 19, Vite, TypeScript, Vitest y oxlint, con las mismas versiones que `../Shellpath/app/package.json`. Cualquier otra se pregunta a Lucas antes y se justifica.
- **La lógica de cálculo va en `src/lib/` como funciones puras con tests de Vitest.** Los componentes no calculan nada: pintan.
- **Un cambio = un commit.** Antes de cada commit tienen que pasar `npx tsc -b`, `npm run lint`, `npm test` y `npm run build`. Cuando exista, `npm run check` los agrupa (modelo: `../Shellpath/app/scripts/run-checks.mjs`).
- **Calidad antes que velocidad.** La app nunca presenta una subida de ppm sin enseñar la precisión al lado, y los textos de práctica no deben premiar el tecleo descuidado.
- **No inventes datos del usuario.** Los valores de la hoja de proyecto (46 ppm de media, V, X, U, Y como teclas débiles) son semillas iniciales, no verdades.
- **Prueba lo que puedas y di lo que no.** El tecleo real lo prueba Lucas. Al final de cada fase deja una checklist manual corta en `docs/FASES.md` y no marques como probado lo que solo compila.

## Glosario (importante, hay una trampa)

- **ppm** = palabras por minuto = (caracteres correctos ÷ 5) ÷ minutos. Es lo que usa typing.com y lo que Lucas llama "ppm". Es lo que se muestra en la interfaz.
- En Shellpath el campo `ppm` significa **pulsaciones** por minuto y `wpm` es ese valor entre 5. Al copiar código de Shellpath, renombra: `cpm` para caracteres por minuto y `wpm` para palabras por minuto. En Txispa Type nada se llama `ppm` en el código salvo textos de interfaz.
- **Neta** = solo caracteres correctos. **Bruta** = todos los tecleados.
- **Test** = prueba cronometrada que cuenta para las estadísticas de velocidad. **Entreno** = ejercicio de práctica, no cuenta para ppm. **Calentamiento** = rutina previa, no cuenta para nada.

## Convenciones de medición (heredadas de Shellpath, no las cambies sin avisar)

- Se avanza por palabras: el espacio cierra la palabra y no se vuelve atrás. Dentro de la palabra en curso sí se puede borrar.
- Borrar **no devuelve** el fallo ya contado.
- Las letras que faltan al cerrar una palabra con espacio cuentan como fallos.
- El cronómetro arranca con la primera pulsación, no al cargar el texto.
- Los atajos del navegador (Ctrl o Meta sin Alt) no cuentan como pulsación. En el teclado español AltGr llega como Ctrl+Alt, por eso `esAtajo` exige `!e.altKey`. No lo simplifiques.
- Las fórmulas exactas (ppm, precisión, consistencia, puntuación de teclas débiles) están en `docs/ESPECIFICACION-TECNICA.md`.

## Estructura de carpetas objetivo

```
Txispa Type/
├── CLAUDE.md
├── README.md
├── docs/
├── reference/
└── app/                 ← aquí va el código (Vite + React + TS)
    ├── package.json
    ├── src/
    │   ├── lib/         lógica pura + __tests__/
    │   ├── data/        teclado, textos, palabras, calentamientos
    │   ├── hooks/
    │   ├── components/
    │   └── App.tsx
    └── scripts/
```

El repositorio git se inicia en `Txispa Type/` (no dentro de `app/`) para que `docs/` y `reference/` viajen con el código.

## Cómo trabajar cada sesión

1. Lee este archivo y el apartado de la fase en curso de `docs/FASES.md`.
2. Antes de escribir código, propón en pocas líneas el plan de la sesión y espera el visto bueno de Lucas. Si el plan es evidente (la siguiente tarea de la lista), puedes empezar directamente.
3. Haz la tarea, con su test si es lógica pura.
4. Pasa las comprobaciones, haz el commit y marca la tarea en `docs/FASES.md` (`- [x]`).
5. Al cerrar la sesión, escribe en `docs/FASES.md`, bajo "Estado", qué queda hecho, qué falla y por dónde seguir.

## Qué no hacer

- No copies `index.css` de Shellpath entero (105 KB). Extrae solo los tokens y los estilos del teclado.
- No copies nada de autenticación, Supabase, ranking, analítica, banner de cookies, mascota ni música en las fases 1 a 3.
- No cambies la distribución del teclado a otra que no sea el ISO español de `data/keyboard.ts`.
- No guardes pulsaciones sueltas con texto del usuario: solo agregados por tecla, par de letras y confusión (ver especificación).
- No subas la dificultad de los textos ni la velocidad objetivo por tu cuenta: lo hacen las reglas de ajuste de la especificación.

## Cuando dudes

Pregunta a Lucas con dos o tres opciones concretas y tu recomendación. Las preguntas abiertas ya conocidas están en `README.md`.
