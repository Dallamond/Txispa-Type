# Txispa Type: hoja de proyecto

Versión del 25 de octubre de 2026. Copia del documento editable de claude.ai (https://claude.ai/artifact/2LQh8SMBFNDYDMTAibvztu), con las correcciones posteriores.

## 1. Objetivos y métricas

El objetivo es pasar de una media de unos 46 ppm (52-54 en tus mejores tests) a una media de 65 ppm en 90 días, con un 97% de precisión. Las metas son una propuesta inicial para que las ajustes.

| Plazo | Velocidad (ppm netas, media semanal) | Precisión | Hábito |
| --- | --- | --- | --- |
| Hoy | 46 de media, 52-54 en tus mejores tests | 94-96% | 3-4 tests de 1 min en typing.com |
| 30 días | 55 | 96% o más | Calentamiento + sesión de práctica + 3 tests cada día |
| 90 días | 65 de media, 70 en tus mejores tests | 97% o más | Misma rutina, con textos más difíciles |

Qué medimos, y por qué cuenta como calidad:

- **PPM netas:** solo caracteres correctos entre 5 y los minutos. Es la cifra que sube de verdad.
- **Precisión:** fallos entre pulsaciones. Si baja del 95%, la velocidad no cuenta como progreso.
- **Ritmo constante:** variación entre el tiempo de cada pulsación. Un ritmo parejo suele anunciar la siguiente subida de velocidad.
- **Tiempo por tecla y por par de letras:** localiza dónde pierdes tiempo.
- **Mediana y peor test de cada día:** subir el suelo vale más que buscar un récord.
- **Constancia:** días seguidos con el objetivo diario cumplido.

Los objetivos del proyecto en sí: tener una web propia que sustituya a typing.com, que decida qué practicar según tus datos, y que sirva para calentar antes de trabajar con el PC.

## 2. Qué dice la investigación

Pasar de 55 a 70 ppm se consigue con mucho volumen de texto real, precisión alta y trabajo sobre tus puntos débiles, no repitiendo tests de un minuto.

| Hallazgo | Fuente | Qué hacemos en la app |
| --- | --- | --- |
| Los mecanógrafos más rápidos cometen menos errores. Los "cuidadosos y sin errores" superan a los descuidados que corrigen mucho. | [Universidad de Cambridge / Aalto, 136 millones de pulsaciones](https://www.cam.ac.uk/research/news/what-makes-a-faster-typist) | Medir la precisión siempre junto a las ppm y no dar por buena una subida con muchos fallos. |
| Los más rápidos usan solapamiento (rollover) en el 40-70% de las pulsaciones: pulsan la siguiente tecla antes de soltar la anterior. | [Cambridge](https://www.cam.ac.uk/research/news/what-makes-a-faster-typist) | Ejercicios de alternancia de manos y dedos, y medir el tiempo entre pulsaciones. |
| Los pares de letras con distinta mano o dedo predicen la velocidad mejor que las repeticiones. | [Aalto](https://userinterfaces.aalto.fi/136Mkeystrokes/) | Medir tiempo por par de letras y practicar los pares lentos. |
| La media de los participantes fue de 52 ppm. Los profesionales entrenados suelen estar entre 60 y 90. | [Cambridge](https://www.cam.ac.uk/research/news/what-makes-a-faster-typist) | Tu meta de 70 ppm está dentro de lo realista para alguien que parte de 55. |
| Un artículo sobre un estudio de 1.301 alumnos sostiene que los ejercicios sueltos no predicen la velocidad; sí el volumen de texto real escrito. | [TypeLit](https://www.typelit.io/blog/why-typing-drills-dont-work) (fuente secundaria; conviene contrastar el estudio original) | Sesiones largas de 10-15 min con texto corrido, además de los tests de 1 minuto. |
| Frenar un poco para no equivocarse sale más rápido que borrar y corregir. El ritmo constante va primero. | [KeyHero](https://www.keyhero.com/wpm-typing-tips/) | Modo estricto opcional y métrica de ritmo constante. |
| La práctica dirigida a los errores propios, con seguimiento de patrones, funciona mejor que la práctica general. Cambiar de teclado o de postura no dio mejoras claras. | [Kaleidoscope Mind](https://kaleidoscopemind.substack.com/p/how-not-to-practice-typing) (experimento personal de una sola persona) | Ejercicios generados desde tus teclas y pares débiles, y clasificación de errores. |

Tres consecuencias para el diseño:

1. **Los 3-4 tests de 1 minuto no bastan.** Sirven para medir, pero la mejora viene del volumen de práctica. La app planifica una sesión de entrenamiento antes de los tests.
2. **El texto debe ser variado y real.** Las palabras aleatorias dan resultados menos fiables. Se mezclan frases naturales y la IA local genera textos nuevos para no memorizar el mismo.
3. **Hay que clasificar los errores.** Las sustituciones de letra son el fallo más habitual hoy. Guardar qué tecla escribiste en lugar de cuál permite ver confusiones concretas.

## 3. Qué aprovechar de typing.com

Según tus capturas del 24 y 25 de octubre, tu punto de partida real es una media de unos 46 ppm, y a typing.com le falta sobre todo decirte qué hacer con tus datos. Las capturas están en `reference/typing-com/`.

| Dato en typing.com | Valor |
| --- | --- |
| Rendimiento semanal, últimos 180 días | 47, 44 y 46 ppm en los tres puntos de la gráfica |
| Últimos 6 tests de 1 min | 52, 37, 32 y 51 el 24 de oct.; 48 y 54 el 22 de oct. |
| Precisión de esos tests | Entre 94% y 96% |
| Precisión media global | 96% |
| Racha | 5 días (del 20 al 24 de oct.); mejor racha: 5 días y 3 semanas |
| Tiempo total tecleando | 4 h 37 min |
| Teclas más falladas | V 17%, X 11%, U 9% e Y 8% |
| Teclas marcadas "necesita mejorar" | T, D, G, C, B y M |

Dos lecturas de estos datos:

- **El techo no es el problema, el suelo sí.** El mismo día tienes tests de 52 y de 32 ppm. Subir los peores tests y la regularidad vale más que buscar un récord, así que la app también mide la mediana y el peor test de cada día.
- **Tus fallos se agrupan en la fila inferior y en las columnas centrales** (V, X, C, B, M y T, Y, U, G). Puede deberse al alcance de los dedos índices y a la fila de abajo; es una hipótesis que se confirmará con dos semanas de datos propios.

Qué copiamos y qué cambiamos:

| Función de typing.com | Qué hará Txispa Type |
| --- | --- |
| Pruebas de 1, 3 y 5 min con cuenta atrás, botón Rehacer y sonidos | Igual, y añadir 30 y 120 s |
| Historial de los últimos 30 tests, ordenable por fecha, velocidad o precisión | Igual, con filtros por modo y duración |
| Gráfica de ppm y de precisión por prueba | Igual, con media móvil |
| Calendario de actividad con racha semanal | Copiar: días con el objetivo cumplido unidos por una línea |
| Rendimiento semanal con línea de tendencia y variación | Copiar la tendencia y el cambio respecto a la semana anterior |
| Teclas problemáticas con % de fallos, mapa del teclado y botón "Practicar teclas problemáticas" | Copiar y ampliar con tiempo por tecla y por par de letras, y lanzar el ejercicio con un clic |
| Estrellas y puntos | No hacen falta; la motivación sale del objetivo diario y de las insignias de la fase 5 |
| Anuncios y plan de pago | Fuera |
| Texto de lectura largo | Cambiar por frases más naturales y textos de tu IA local con tus teclas débiles |

Para empezar, la app carga a mano tus teclas problemáticas actuales (V, X, U, Y) como valores iniciales hasta tener datos propios.

## 4. Calentamientos dentro de la web

Nueve ejercicios cortos, agrupados en tres rutinas de 3, 6 y 8 minutos, para hacer antes de los tests. Se basan en las rutinas típicas de [TypeTest](https://typetest.io/blog/posts/2024-09-16-typing-warm-ups-prep-your-fingers-for-speed.html) y en lo que la investigación dice sobre ritmo, precisión y alternancia de manos. No hay estudios sólidos que prueben que calentar suba las ppm; se incluye por comodidad, para soltar las manos y empezar los tests con buen ritmo.

| # | Ejercicio | Duración | Qué entrena | Cómo funciona en la app |
| --- | --- | --- | --- | --- |
| 1 | Estiramiento de manos | 45 s | Muñecas y dedos sueltos | Guía con temporizador: abrir 3 s, puño 1 s, repetir 10 veces. Sin teclear. |
| 2 | Araña | 30 s | Independencia de dedos | Dedos sobre la mesa que se levantan uno a uno, con indicador de qué dedo toca. |
| 3 | Escala del teclado | 30 s | Precisión lenta | Alfabeto de ida y vuelta, empezando despacio. Debe salir sin fallos. |
| 4 | Fila base lenta | 60 s | Posición de manos | Combinaciones de asdf y jklñ al 60% de tu velocidad, con meta de 100% de precisión. |
| 5 | Alternancia de manos | 60 s | Solapamiento (rollover) | Palabras que alternan mano izquierda y derecha, filtradas del banco de palabras. |
| 6 | Pares débiles | 60 s | Tus puntos lentos | Texto con tus 5 pares de letras más lentos, a ritmo tranquilo. |
| 7 | Texto lento | 60 s | Ritmo constante | Frase corrida al 80% de tu velocidad media, con foco en no cometer errores. |
| 8 | Escalera de palabras | 90 s | Fluidez creciente | Cada palabra se repite 5 veces y la siguiente tiene una letra más. |
| 9 | Metrónomo | 60 s | Ritmo parejo | Tecleas una frase al compás de un pulso que puedes subir o bajar. |

Rutinas predefinidas:

- **Rápida (3 min):** ejercicios 1, 3, 4 y 7.
- **Estándar (6 min):** ejercicios 1 a 7.
- **Completa (8 min):** los nueve, para los días de entrenamiento largo.

La rutina se elige al abrir la web, y los resultados de los calentamientos no cuentan en las estadísticas.

## 5. Requisitos por módulo

Prioridad: **Base** es lo mínimo para sustituir typing.com, **Siguiente** mejora el entrenamiento, **Después** puede esperar. Cómo se reparte en fases: ver `FASES.md` (la IA local figura como Base aquí, pero va en la fase 4 porque no bloquea el reemplazo de typing.com; hasta entonces hay textos de respaldo).

| Módulo | Requisito | Prioridad |
| --- | --- | --- |
| Calentamientos | Rutinas Rápida, Estándar y Completa con temporizador y paso automático al siguiente ejercicio | Base |
| Calentamientos | Los nueve ejercicios de la tabla anterior, con el de pares débiles alimentado por tus datos | Siguiente |
| Tests | Tests de 30, 60 y 120 s (y 180 y 300 s) con ppm netas, precisión y ritmo constante al terminar | Base |
| Tests | Texto de frases naturales en español con tildes, ñ y signos; modo estricto opcional | Base |
| Tests | Comparar cada test con tu media de los últimos 10 | Base |
| Entrenamiento | Sesión diaria de 10-15 min con texto corrido, que no cuenta como test | Siguiente |
| Entrenamiento | Ejercicios automatizados: teclas débiles, pares lentos y alternancia de manos | Base |
| Entrenamiento | Subida gradual de dificultad según tu precisión de la semana | Después |
| Análisis de errores | Guardar qué tecla escribiste en lugar de cuál y mostrar las confusiones más repetidas | Siguiente |
| Análisis de errores | Separar errores de tecla vecina, de salto de letra y de letra añadida | Después |
| Estadísticas | Gráficas de ppm y precisión, mapa del teclado, racha y objetivo diario | Base |
| Estadísticas | Resumen semanal y comparación con tus metas de 30 y 90 días | Siguiente |
| IA local | Generar textos nuevos con Ollama usando tus puntos débiles, con texto de respaldo si falla | Base |
| IA local | Resumen semanal en lenguaje natural y recomendación de qué practicar | Después |
| Datos y ajustes | Todo en el navegador, exportar e importar JSON, objetivo diario configurable | Base |
| Datos y ajustes | Sincronizar entre dispositivos a través de tu homelab | Después |

Requisitos transversales: funciona sin internet, no usa librerías externas, se ve bien en pantalla de portátil (y en móvil si se decide), y no envía datos fuera de tu red.

## 6. Plan de entrenamiento

Sesión diaria de unos 24 minutos, con un foco distinto cada día. Es un punto de partida basado en lo investigado, no un método probado; se ajusta con tus datos tras las primeras dos semanas.

**Sesión diaria**

1. Calentamiento estándar: 6 min.
2. Entrenamiento del día: 12 min (el foco cambia según la tabla de abajo).
3. Tres tests de 1 min, con descanso entre ellos: unos 4 min. Es lo que ya haces en typing.com y mantiene la serie de datos comparable.
4. Revisión de errores: 2 min mirando las confusiones y los pares lentos del día.

**Foco semanal**

| Día | Foco | Entrenamiento de 12 min |
| --- | --- | --- |
| Lunes | Precisión | Texto corrido al 80% de tu velocidad, con meta de 98% o más |
| Martes | Pares débiles | 6 min con tus pares más lentos y 6 min de texto que los incluya |
| Miércoles | Alternancia de manos | Palabras que alternan manos y texto corrido para fijar el ritmo |
| Jueves | Volumen | 12 min seguidos de texto largo generado por tu IA local |
| Viernes | Ritmo constante | Metrónomo y frases al compás, subiendo el pulso poco a poco |
| Sábado | Ligero | 6 min de teclas débiles y los tres tests; el resto, libre |
| Domingo | Medición | Un test de 60 s y otro de 120 s como referencia semanal, y revisión del progreso |

**Reglas de ajuste, que la app puede aplicar sola**

- Si la precisión semanal baja del 95%, la semana siguiente se practica un 10% más despacio.
- Si pasa del 97% tres días seguidos, se sube la velocidad objetivo del texto lento un 5%.
- La comparación de progreso se hace con la media semanal, no con el mejor test del día, porque un test de un minuto fluctúa mucho.
- Si notas dolor en manos o muñecas, se salta la sesión de entrenamiento ese día y se hace solo el calentamiento.

## 7. Arquitectura propuesta

- **Interfaz:** React, Vite y TypeScript, igual que Shellpath, sin servidor propio.
- **Lógica separada:** el cálculo de ppm, errores, tiempos y selección de ejercicios en módulos sin interfaz y con pruebas.
- **Datos:** IndexedDB para los intentos (cada uno lleva agregados por tecla y par de letras) y localStorage para los ajustes, con exportación a JSON.
- **IA local:** llamada directa a Ollama desde el navegador, con textos de respaldo si no responde.
- **Alojamiento:** archivos estáticos servidos desde tu homelab, accesibles desde tu red o por VPN.

Detalle técnico en `ESPECIFICACION-TECNICA.md`, fases en `FASES.md`.

## 8. Qué dice Shellpath de sí mismo

Ver `REUTILIZAR-SHELLPATH.md`. Resumen: Shellpath ya tiene un entrenador de mecanografía (`TextoTest.tsx`) con pruebas de 1, 3 y 5 minutos, historial, gráfica, meta diaria, XP y teclado español con guía de dedos. La mayoría de la base de Txispa Type se copia de ahí.

## Fuentes

- [What makes a faster typist (Universidad de Cambridge)](https://www.cam.ac.uk/research/news/what-makes-a-faster-typist)
- [Observations on Typing from 136 Million Keystrokes (Aalto)](https://userinterfaces.aalto.fi/136Mkeystrokes/)
- [Why typing drills do not work (TypeLit)](https://www.typelit.io/blog/why-typing-drills-dont-work)
- [Typing tips (KeyHero)](https://www.keyhero.com/wpm-typing-tips/)
- [How (not?) to practice typing (Kaleidoscope Mind)](https://kaleidoscopemind.substack.com/p/how-not-to-practice-typing)
- [Typing warm-ups (TypeTest)](https://typetest.io/blog/posts/2024-09-16-typing-warm-ups-prep-your-fingers-for-speed.html)
