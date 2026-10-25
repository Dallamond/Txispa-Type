# Txispa Type

Entrenador de mecanografía propio para sustituir a typing.com. Calentamientos antes de teclear, tests cronometrados, entrenamiento dirigido a tus teclas y pares de letras débiles, estadísticas de progreso y textos generados por tu IA local.

Creado el 25 de octubre de 2026 a partir de la conversación con Claude y de las capturas de typing.com y Shellpath.

## Qué hay en esta carpeta

| Archivo | Para qué sirve |
| --- | --- |
| `CLAUDE.md` | Reglas y flujo de trabajo para Claude Code. Es lo primero que lee. |
| `docs/HOJA-DE-PROYECTO.md` | Objetivos, investigación, calentamientos, requisitos, plan de entrenamiento. |
| `docs/ESPECIFICACION-TECNICA.md` | Modelo de datos, fórmulas, estructura, pantallas e IA local. |
| `docs/REUTILIZAR-SHELLPATH.md` | Qué código de Shellpath se copia, se adapta o se deja. |
| `docs/FASES.md` | Cinco fases con tareas marcables y criterio de "hecho". |
| `docs/PROMPT-INICIAL.md` | Texto para pegar en Claude Code y arrancar la fase 1. |
| `reference/` | Capturas de typing.com y de Shellpath, y la v1 de un solo HTML. |

La hoja de proyecto también está como documento editable en claude.ai: https://claude.ai/artifact/2LQh8SMBFNDYDMTAibvztu

## Cómo empezar

1. Abre una terminal en esta carpeta (`D:\Lukaton1\03 - PROYECTOS TEC\Txispa Type`).
2. Lanza Claude Code (`claude`).
3. Pega el contenido de `docs/PROMPT-INICIAL.md`.

## Decisiones ya tomadas

- Web local (HTML, JS y TypeScript), sin servidor ni cuentas. Los datos se guardan en el navegador y se pueden exportar a JSON.
- Stack igual que Shellpath: React 19, Vite, TypeScript, Vitest y oxlint, para copiar piezas casi sin cambios.
- Texto en español, con tildes, ñ y signos. Teclado ISO español.
- Prioridad: calidad antes que velocidad. Se mide la precisión siempre junto a las ppm.
- Se registran tiempo por tecla, por par de letras y confusiones desde el primer día, para que la fase de entrenamiento dirigido tenga datos reales.
- Se parte de la v1 (`reference/txispa-type-v1.html`) y del entrenador de mecanografía que Shellpath ya tiene (`TextoTest.tsx`).

## Punto de partida de Lucas (capturas de typing.com, 24 y 25 de octubre de 2026)

- Media semanal de unos 46 ppm; mejores tests entre 52 y 54 ppm.
- Precisión de 94% a 96%.
- Teclas más falladas: V (17%), X (11%), U (9%), Y (8%). Marcadas para mejorar: T, D, G, C, B, M.
- Metas propuestas: media de 55 ppm a 30 días y de 65 a 90 días, con 96% y 97% de precisión.

## Preguntas abiertas

- ¿Tema oscuro (como Shellpath) o claro por defecto?
- ¿Sonidos de tecla y de error, o silencio? Shellpath ya tiene `lib/audio.ts` con teclados y recortes de sonido para reutilizar en la fase 5.
- ¿La sesión diaria debe poder hacerse en el móvil, o solo en el PC? Shellpath ya decidió que sin teclado físico no se practica.
- ¿La app vive en el homelab (acceso por LAN o VPN) o solo en local? Afecta a la llamada a Ollama (ver especificación).
- ¿Quieres que ROOT, la mascota de Shellpath, aparezca aquí?
