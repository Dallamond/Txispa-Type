// Generado por scripts/generar-curso.mjs desde docs/curso/**/TEMARIO*.md.
// No editar a mano: se cambia el Markdown y se ejecuta `npm run curso:generar`.

import type { Modulo } from "./tipos";

export const MODULOS_CSS: readonly Modulo[] = [
  {
    "id": "M06",
    "curso": "css",
    "titulo": "Fundamentos de CSS: reglas, selectores, color y tipografía",
    "descripcion": "Cómo se incluye CSS, cómo se escribe una regla y cómo se eligen los elementos a los que se aplica.",
    "lecciones": [
      {
        "id": "L06.01",
        "moduloId": "M06",
        "titulo": "Incluir CSS y escribir una regla",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [
          "{",
          "}",
          ";"
        ],
        "explicacion": "CSS separa el diseño del contenido. Una regla tiene un selector y un bloque entre llaves con declaraciones `propiedad: valor;`. Se incluye dentro de `<style>` o desde un archivo con `<link>`.",
        "codigo": "<head>\n  <meta charset=\"UTF-8\">\n  <title>Mi estilo</title>\n  <link rel=\"stylesheet\" href=\"estilos.css\">\n  <style>\n    p {\n      color: blue;\n      font-size: 16px;\n    }\n  </style>\n</head>"
      },
      {
        "id": "L06.02",
        "moduloId": "M06",
        "titulo": "Selectores básicos",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [
          "*"
        ],
        "explicacion": "El selector de etiqueta afecta a todos los elementos de ese tipo. `*` selecciona todos. Un punto `.` selecciona una clase, que puede repetirse, y una almohadilla `#` selecciona un `id`, que debe ser único.",
        "codigo": "* {\n  margin: 0;\n}\nh1 {\n  color: black;\n}\n.destacado {\n  color: red;\n}\n#principal {\n  color: green;\n}"
      },
      {
        "id": "L06.03",
        "moduloId": "M06",
        "titulo": "Combinadores, atributos y pseudoclases",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [
          "[",
          "]"
        ],
        "explicacion": "Dos selectores separados por un espacio eligen los elementos anidados. Los corchetes filtran por atributo. `:hover` se aplica al pasar el ratón y `:nth-child()` según la posición del elemento entre sus hermanos.",
        "codigo": "div p {\n  color: black;\n}\ninput[type=\"text\"] {\n  border: 1px solid;\n}\na:hover {\n  color: red;\n}\np:nth-child(even) {\n  background: gray;\n}"
      },
      {
        "id": "L06.04",
        "moduloId": "M06",
        "titulo": "Color y tipografía",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [
          "'"
        ],
        "explicacion": "Un color puede darse por nombre, en hexadecimal `#rrggbb` o con `rgba()`, cuyo último valor es la transparencia de 0 a 1. `font-family` lista fuentes por orden de preferencia y `@font-face` carga una fuente propia con `src: url()`.",
        "codigo": "@font-face {\n  font-family: 'MiFuente';\n  src: url('fuente.ttf');\n}\nbody {\n  font-family: 'MiFuente', sans-serif;\n  color: #333333;\n  background: rgba(0, 0, 0, 0.5);\n}"
      },
      {
        "id": "L06.R",
        "moduloId": "M06",
        "titulo": "Repaso: página con estilos",
        "tipo": "repaso",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Una página completa con CSS interno que usa selectores de etiqueta y de clase, una pseudoclase y un color con transparencia.",
        "codigo": "<!DOCTYPE html>\n<html lang=\"es\">\n  <head>\n    <title>Repaso CSS</title>\n    <style>\n      body {\n        color: #333333;\n      }\n      .titulo {\n        color: rgba(255, 0, 0, 0.8);\n      }\n      a:hover {\n        color: blue;\n      }\n    </style>\n  </head>\n  <body>\n    <h1 class=\"titulo\">Titulo CSS</h1>\n    <a href=\"#ver\">Enlace</a>\n  </body>\n</html>"
      }
    ]
  },
  {
    "id": "M07",
    "curso": "css",
    "titulo": "Modelo de caja, bordes y sombras",
    "descripcion": "Cómo calcula CSS el tamaño de cada elemento y cómo se decoran sus bordes y su sombra.",
    "lecciones": [
      {
        "id": "L07.01",
        "moduloId": "M07",
        "titulo": "El modelo de caja",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "Todo elemento es una caja de cuatro capas: el contenido, el relleno interior (`padding`), el borde (`border`) y el margen exterior (`margin`). Cambiar cualquiera de ellas cambia el espacio que ocupa el elemento.",
        "codigo": "<style>\n  div {\n    width: 200px;\n    padding: 10px;\n    border: 2px solid black;\n    margin: 15px;\n  }\n</style>\n<div>\n  Contenido de la caja\n</div>"
      },
      {
        "id": "L07.02",
        "moduloId": "M07",
        "titulo": "Tamaño de la caja: box-sizing",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [
          "%"
        ],
        "explicacion": "Por defecto, el relleno y el borde se suman al ancho y al alto. Con `box-sizing: border-box` quedan incluidos dentro de `width` y `height`, y las cuentas del diseño salen más fáciles. Un porcentaje se calcula sobre el contenedor.",
        "codigo": "<style>\n  .caja {\n    box-sizing: border-box;\n    width: 100%;\n    height: 100px;\n    padding: 20px;\n    border: 5px solid red;\n  }\n</style>\n<div class=\"caja\">\n  Caja dimensionada\n</div>"
      },
      {
        "id": "L07.03",
        "moduloId": "M07",
        "titulo": "Esquinas redondeadas y sombras",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "`border-radius` redondea las esquinas. `box-shadow` proyecta una sombra con desplazamiento horizontal, desplazamiento vertical, desenfoque y color. `text-shadow` hace lo mismo con el texto.",
        "codigo": "<style>\n  .tarjeta {\n    border-radius: 10px;\n    box-shadow: 0 4px 8px gray;\n    text-shadow: 1px 1px black;\n  }\n</style>\n<div class=\"tarjeta\">\n  Texto con sombra\n</div>"
      },
      {
        "id": "L07.04",
        "moduloId": "M07",
        "titulo": "Desbordamiento de contenido",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Cuando el contenido no cabe en su caja, `overflow` decide qué pasa. `hidden` recorta lo que sobra y `auto` o `scroll` añaden barras de desplazamiento.",
        "codigo": "<style>\n  .auto {\n    height: 40px;\n    overflow: auto;\n  }\n  .recorte {\n    height: 40px;\n    overflow: hidden;\n  }\n</style>\n<div class=\"auto\">Texto largo que genera desplazamiento interno al superar la altura de la caja.</div>\n<div class=\"recorte\">Texto largo que queda recortado al superar la altura de la caja.</div>"
      },
      {
        "id": "L07.R",
        "moduloId": "M07",
        "titulo": "Repaso: tarjeta con estilo",
        "tipo": "repaso",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Una página completa con una tarjeta que combina `box-sizing`, relleno, borde redondeado, sombra y control de desbordamiento.",
        "codigo": "<!DOCTYPE html>\n<html lang=\"es\">\n  <head>\n    <title>Repaso modelo de caja</title>\n    <style>\n      .tarjeta {\n        box-sizing: border-box;\n        padding: 15px;\n        border: 2px solid blue;\n        border-radius: 8px;\n        box-shadow: 0 4px 6px gray;\n        overflow: hidden;\n      }\n    </style>\n  </head>\n  <body>\n    <div class=\"tarjeta\">\n      <h2>Tarjeta de repaso</h2>\n      <p>Contenido en modelo de caja.</p>\n    </div>\n  </body>\n</html>"
      }
    ]
  },
  {
    "id": "M08",
    "curso": "css",
    "titulo": "Display y posicionamiento",
    "descripcion": "Cómo se colocan los elementos en la página: flujo normal, flotantes, posiciones y capas.",
    "lecciones": [
      {
        "id": "L08.01",
        "moduloId": "M08",
        "titulo": "La propiedad display",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "`display` cambia cómo se comporta un elemento. `block` ocupa todo el ancho y abre línea nueva (como `div` y `p` por defecto), `inline` ocupa solo su contenido, `inline-block` permite dar ancho y alto sin salir de la línea, y `none` lo oculta del todo.",
        "codigo": "<style>\n  span {\n    display: inline-block;\n    width: 100px;\n    background: red;\n  }\n  .oculto {\n    display: none;\n  }\n</style>\n<span>Elemento 1</span>\n<span>Elemento 2</span>\n<p class=\"oculto\">No se ve</p>"
      },
      {
        "id": "L08.02",
        "moduloId": "M08",
        "titulo": "Flotantes: float y clear",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "`float` empuja un elemento a un lado (`left` o `right`) y el texto fluye a su alrededor. `clear: both` hace que un elemento se coloque por debajo de los flotantes en lugar de montarse sobre ellos.",
        "codigo": "<style>\n  .caja {\n    float: left;\n    width: 50%;\n  }\n  .limpiar {\n    clear: both;\n  }\n</style>\n<div class=\"caja\">Caja flotante</div>\n<div class=\"limpiar\">Texto limpio</div>"
      },
      {
        "id": "L08.03",
        "moduloId": "M08",
        "titulo": "Posición relativa y absoluta",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "`position: relative` mantiene el elemento en su sitio y lo convierte en referencia. `position: absolute` coloca un elemento con `top`, `right`, `bottom` y `left` respecto a su ancestro posicionado más cercano. `fixed` hace lo mismo respecto a la ventana y no se mueve al desplazarse.",
        "codigo": "<style>\n  .padre {\n    position: relative;\n    height: 100px;\n  }\n  .hijo {\n    position: absolute;\n    top: 10px;\n    right: 20px;\n  }\n</style>\n<div class=\"padre\">\n  <div class=\"hijo\">Caja absoluta</div>\n</div>"
      },
      {
        "id": "L08.04",
        "moduloId": "M08",
        "titulo": "Capas: z-index",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Cuando varios elementos posicionados se solapan, `z-index` decide cuál queda delante: gana el número mayor. Solo funciona en elementos cuyo `position` no es `static`.",
        "codigo": "<style>\n  .capa1 {\n    position: absolute;\n    z-index: 1;\n  }\n  .capa2 {\n    position: absolute;\n    z-index: 2;\n  }\n</style>\n<div class=\"capa1\">Fondo</div>\n<div class=\"capa2\">Frente</div>"
      },
      {
        "id": "L08.R",
        "moduloId": "M08",
        "titulo": "Repaso: cabecera fija y capa superpuesta",
        "tipo": "repaso",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Una página con una cabecera fija a la ventana y una capa absoluta por encima del resto.",
        "codigo": "<!DOCTYPE html>\n<html lang=\"es\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <title>Repaso posicionamiento</title>\n    <style>\n      header {\n        position: fixed;\n        top: 0;\n      }\n      .modal {\n        position: absolute;\n        z-index: 10;\n      }\n    </style>\n  </head>\n  <body>\n    <header>Menu fijo</header>\n    <div class=\"modal\">Capa sobrepuesta</div>\n  </body>\n</html>"
      }
    ]
  },
  {
    "id": "M09",
    "curso": "css",
    "titulo": "Maquetación moderna: Flexbox y Grid",
    "descripcion": "Los dos sistemas actuales para distribuir elementos: Flexbox en una dimensión y Grid en dos.",
    "lecciones": [
      {
        "id": "L09.01",
        "moduloId": "M09",
        "titulo": "Flexbox: contenedor y eje principal",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Flexbox reparte el espacio entre elementos en una sola dimensión. `display: flex` convierte un contenedor en flexible y afecta a sus hijos directos. `flex-direction` elige el eje: `row` en fila o `column` en columna.",
        "codigo": "<style>\n  .contenedor {\n    display: flex;\n    flex-direction: row;\n  }\n  .item {\n    width: 100px;\n  }\n</style>\n<div class=\"contenedor\">\n  <div class=\"item\">Caja 1</div>\n  <div class=\"item\">Caja 2</div>\n</div>"
      },
      {
        "id": "L09.02",
        "moduloId": "M09",
        "titulo": "Alineación en Flexbox",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "`justify-content` reparte los elementos a lo largo del eje principal (`center`, `space-between`, `flex-end`). `align-items` los alinea en el eje perpendicular. `gap` fija el espacio entre hijos sin usar márgenes.",
        "codigo": "<style>\n  .menu {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    gap: 15px;\n  }\n</style>\n<nav class=\"menu\">\n  <a href=\"#inicio\">Inicio</a>\n  <a href=\"#perfil\">Perfil</a>\n</nav>"
      },
      {
        "id": "L09.03",
        "moduloId": "M09",
        "titulo": "Grid: columnas y unidad fr",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Grid organiza filas y columnas a la vez. `display: grid` activa la rejilla y `grid-template-columns` define el ancho de cada columna. La unidad `fr` es una fracción del espacio disponible: `1fr 2fr` da a la segunda columna el doble de ancho.",
        "codigo": "<style>\n  .rejilla {\n    display: grid;\n    grid-template-columns: 1fr 2fr;\n    gap: 10px;\n  }\n</style>\n<div class=\"rejilla\">\n  <div>Columna 1</div>\n  <div>Columna 2</div>\n  <div>Columna 3</div>\n</div>"
      },
      {
        "id": "L09.04",
        "moduloId": "M09",
        "titulo": "Grid: repeat y celdas que se extienden",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "`repeat(3, 1fr)` evita escribir tres veces la misma columna. Con `grid-column: span 2` una celda ocupa dos columnas seguidas.",
        "codigo": "<style>\n  .panel {\n    display: grid;\n    grid-template-columns: repeat(3, 1fr);\n  }\n  .destacado {\n    grid-column: span 2;\n  }\n</style>\n<div class=\"panel\">\n  <div class=\"destacado\">Gran caja</div>\n  <div>Caja 2</div>\n  <div>Caja 3</div>\n</div>"
      },
      {
        "id": "L09.R",
        "moduloId": "M09",
        "titulo": "Repaso: menú flex y contenido en rejilla",
        "tipo": "repaso",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "Una página con una barra de enlaces hecha con Flexbox y una zona de contenido en dos columnas con Grid.",
        "codigo": "<!DOCTYPE html>\n<html lang=\"es\">\n  <head>\n    <title>Repaso layouts</title>\n    <style>\n      nav {\n        display: flex;\n      }\n      main {\n        display: grid;\n        grid-template-columns: 1fr 2fr;\n      }\n    </style>\n  </head>\n  <body>\n    <nav>\n      <a href=\"#uno\">Uno</a>\n      <a href=\"#dos\">Dos</a>\n    </nav>\n    <main>\n      <p>Caja 1</p>\n      <p>Caja 2</p>\n    </main>\n  </body>\n</html>"
      }
    ]
  },
  {
    "id": "M10",
    "curso": "css",
    "titulo": "Diseño adaptable",
    "descripcion": "Hacer que una misma página se vea bien en móvil, tableta y ordenador.",
    "lecciones": [
      {
        "id": "L10.01",
        "moduloId": "M10",
        "titulo": "La etiqueta meta viewport",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "El diseño adaptable ajusta la página a cualquier tamaño de pantalla. La etiqueta `<meta name=\"viewport\">` va en el `<head>` y evita que el móvil simule una pantalla de escritorio reducida: con `width=device-width` los píxeles de CSS coinciden con los del dispositivo.",
        "codigo": "<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Sitio responsive</title>\n</head>\n<body>\n  <h1>Sitio adaptable</h1>\n  <p>Contenido adaptativo</p>\n</body>"
      },
      {
        "id": "L10.02",
        "moduloId": "M10",
        "titulo": "Media queries: max-width y min-width",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "`@media` aplica unas reglas solo si se cumple una condición. `max-width` se cumple en pantallas iguales o más estrechas que el valor y `min-width` en pantallas iguales o más anchas. Diseñar primero para móvil y ampliar con `min-width` se llama mobile first.",
        "codigo": "<style>\n  body {\n    background: white;\n  }\n  @media (max-width: 768px) {\n    body {\n      background: gray;\n    }\n  }\n  @media (min-width: 1200px) {\n    body {\n      background: black;\n    }\n  }\n</style>"
      },
      {
        "id": "L10.03",
        "moduloId": "M10",
        "titulo": "Imágenes y tipografía fluidas",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "`max-width: 100%` con `height: auto` impide que una imagen se salga de su contenedor. `rem` es relativo al tamaño de letra de la raíz y `vw` al ancho de la ventana, de modo que el texto escala con la pantalla.",
        "codigo": "<style>\n  img {\n    max-width: 100%;\n    height: auto;\n  }\n  h1 {\n    font-size: 2rem;\n  }\n  p {\n    font-size: 2vw;\n  }\n</style>\n<img src=\"foto.jpg\" alt=\"Imagen adaptativa\">"
      },
      {
        "id": "L10.04",
        "moduloId": "M10",
        "titulo": "Rejilla adaptable",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "Combinar Grid con una media query reorganiza el diseño según el ancho. En pantallas estrechas, una sola columna; a partir de 600 px, tres columnas iguales. Con Flexbox se hace igual cambiando `flex-direction`.",
        "codigo": ".caja {\n  display: grid;\n  grid-template-columns: 1fr;\n  gap: 10px;\n}\n@media (min-width: 600px) {\n  .caja {\n    grid-template-columns: repeat(3, 1fr);\n  }\n}"
      },
      {
        "id": "L10.R",
        "moduloId": "M10",
        "titulo": "Repaso: página adaptable",
        "tipo": "repaso",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "Una página completa con viewport y una rejilla que pasa de una a dos columnas en pantallas anchas.",
        "codigo": "<!DOCTYPE html>\n<html lang=\"es\">\n  <head>\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Repaso responsive</title>\n    <style>\n      .caja {\n        display: grid;\n        gap: 10px;\n      }\n      @media (min-width: 600px) {\n        .caja {\n          grid-template-columns: 1fr 1fr;\n        }\n      }\n    </style>\n  </head>\n  <body>\n    <div class=\"caja\">\n      <img src=\"uno.jpg\" alt=\"Foto uno\">\n      <img src=\"dos.jpg\" alt=\"Foto dos\">\n    </div>\n  </body>\n</html>"
      }
    ]
  },
  {
    "id": "M11",
    "curso": "css",
    "titulo": "Transiciones, transformaciones y animaciones",
    "descripcion": "Dar movimiento a una página: cambios suaves, giros, desplazamientos y animaciones por fotogramas.",
    "lecciones": [
      {
        "id": "L11.01",
        "moduloId": "M11",
        "titulo": "Transiciones",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "`transition` suaviza el cambio de una propiedad en lugar de hacerlo de golpe. Se indica la propiedad, la duración y la curva de velocidad. Suele activarse con `:hover`.",
        "codigo": "<style>\n  button {\n    background: blue;\n    transition: background 0.5s ease;\n  }\n  button:hover {\n    background: red;\n  }\n</style>\n<button>Boton suave</button>"
      },
      {
        "id": "L11.02",
        "moduloId": "M11",
        "titulo": "Transformaciones 2D",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "`transform` cambia la forma o la posición de un elemento sin alterar el resto de la maquetación. `rotate()` gira en grados, `scale()` cambia el tamaño, `translate()` mueve en X e Y y `skew()` inclina.",
        "codigo": "<style>\n  .caja {\n    width: 100px;\n    height: 100px;\n    background: green;\n    transform: rotate(45deg) scale(1.1);\n  }\n  .mover {\n    transform: translate(20px, 10px) skew(10deg);\n  }\n</style>\n<div class=\"caja\">Giro</div>\n<div class=\"mover\">Mover</div>"
      },
      {
        "id": "L11.03",
        "moduloId": "M11",
        "titulo": "Animaciones con @keyframes",
        "tipo": "leccion",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "`@keyframes` define los estados de una animación en porcentajes de su duración, de `0%` a `100%`. Después, la propiedad `animation` la aplica indicando nombre, duración y repeticiones (`infinite` para siempre).",
        "codigo": "<style>\n  @keyframes mover {\n    0% {\n      transform: translateX(0);\n    }\n    100% {\n      transform: translateX(50px);\n    }\n  }\n  .pelota {\n    animation: mover 2s infinite;\n  }\n</style>\n<div class=\"pelota\">Pelota</div>"
      },
      {
        "id": "L11.04",
        "moduloId": "M11",
        "titulo": "Filtros visuales",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "`filter` aplica efectos gráficos antes de dibujar el elemento: `blur()` desenfoca, `brightness()` cambia el brillo y `contrast()` el contraste. Combinado con `transition` y `:hover` crea efectos suaves.",
        "codigo": "<style>\n  img {\n    filter: blur(2px) brightness(80%) contrast(120%);\n    transition: filter 0.3s;\n  }\n  img:hover {\n    filter: blur(0) brightness(100%);\n  }\n</style>\n<img src=\"foto.jpg\" alt=\"Filtro\">"
      },
      {
        "id": "L11.R",
        "moduloId": "M11",
        "titulo": "Repaso: caja animada",
        "tipo": "repaso",
        "dificultad": 4,
        "nuevas": [],
        "explicacion": "Una página con una caja que gira sin parar y cambia de color al pasar el ratón.",
        "codigo": "<!DOCTYPE html>\n<html lang=\"es\">\n  <head>\n    <title>Repaso animaciones</title>\n    <style>\n      @keyframes giro {\n        100% {\n          transform: rotate(360deg);\n        }\n      }\n      .caja {\n        background: blue;\n        transition: background 0.5s ease;\n        animation: giro 4s infinite;\n      }\n      .caja:hover {\n        background: red;\n      }\n    </style>\n  </head>\n  <body>\n    <div class=\"caja\">Giro</div>\n  </body>\n</html>"
      }
    ]
  },
  {
    "id": "M12",
    "curso": "css",
    "titulo": "Buenas prácticas y proyecto final",
    "descripcion": "Cómo organizar, nombrar y validar el código para que se pueda mantener, y una última página que reúne todo.",
    "lecciones": [
      {
        "id": "L12.01",
        "moduloId": "M12",
        "titulo": "Separar estructura y estilo",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "HTML se ocupa de la estructura y el contenido, y CSS de la presentación, en archivos `.css` aparte. Se vinculan con `<link rel=\"stylesheet\">` en el `<head>`. Así es más fácil mantener el sitio y el navegador guarda los estilos en caché.",
        "codigo": "<!DOCTYPE html>\n<html lang=\"es\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <title>Separacion de capas</title>\n    <link rel=\"stylesheet\" href=\"estilos.css\">\n  </head>\n  <body>\n    <p>Texto con estilos externos</p>\n  </body>\n</html>"
      },
      {
        "id": "L12.02",
        "moduloId": "M12",
        "titulo": "Reset CSS básico",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Cada navegador aplica márgenes y rellenos por defecto distintos. Un reset con el selector universal `*` los quita y `box-sizing: border-box` hace que bordes y rellenos no cambien el tamaño fijado. Los pseudoelementos `::before` y `::after` se incluyen para que el reset también les afecte.",
        "codigo": "*,\n*::before,\n*::after {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}"
      },
      {
        "id": "L12.03",
        "moduloId": "M12",
        "titulo": "Código limpio y validación",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "El validador del W3C detecta etiquetas sin cerrar y errores de sintaxis. Un documento limpio tiene doctype, idioma, codificación, título, estructura semántica, imágenes con `alt` y sangría constante. Este es un ejemplo que lo pasaría.",
        "codigo": "<!DOCTYPE html>\n<html lang=\"es\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <title>Pagina valida</title>\n  </head>\n  <body>\n    <main>\n      <h1>Titulo limpio</h1>\n      <img src=\"foto.jpg\" alt=\"Foto de ejemplo\">\n    </main>\n  </body>\n</html>"
      },
      {
        "id": "L12.04",
        "moduloId": "M12",
        "titulo": "Nombres de clase con BEM",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [
          "_"
        ],
        "explicacion": "BEM (Bloque, Elemento, Modificador) da nombres claros a las clases. El bloque es el componente (`tarjeta`), el elemento se une con doble guion bajo (`tarjeta__titulo`) y el modificador con doble guion medio (`tarjeta--activa`).",
        "codigo": "<style>\n  .tarjeta {\n    padding: 10px;\n  }\n  .tarjeta__titulo {\n    color: blue;\n  }\n  .tarjeta--activa {\n    border: 1px solid black;\n  }\n</style>\n<div class=\"tarjeta tarjeta--activa\">\n  <h2 class=\"tarjeta__titulo\">Titulo</h2>\n</div>"
      },
      {
        "id": "L12.R",
        "moduloId": "M12",
        "titulo": "Proyecto final: página adaptable",
        "tipo": "repaso",
        "dificultad": 5,
        "nuevas": [],
        "explicacion": "Una página que reúne estructura semántica, viewport, Flexbox y una media query para pasar de columna a fila en pantallas anchas.",
        "codigo": "<!DOCTYPE html>\n<html lang=\"es\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Proyecto final</title>\n    <style>\n      .menu {\n        display: flex;\n        flex-direction: column;\n      }\n      @media (min-width: 600px) {\n        .menu {\n          flex-direction: row;\n        }\n      }\n    </style>\n  </head>\n  <body>\n    <nav class=\"menu\">\n      <a href=\"#uno\">Uno</a>\n      <a href=\"#dos\">Dos</a>\n    </nav>\n  </body>\n</html>"
      }
    ]
  }
];
