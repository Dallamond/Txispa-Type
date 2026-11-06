// Generado por scripts/generar-curso.mjs desde docs/curso/TEMARIO-HTML-CSS.md.
// No editar a mano: se cambia el Markdown y se ejecuta `npm run curso:generar`.

import type { Modulo } from "./tipos";

export const MODULOS_HTML: readonly Modulo[] = [
  {
    "id": "M01",
    "curso": "html",
    "titulo": "Estructura básica de HTML5",
    "descripcion": "Qué es una etiqueta y cómo se monta un documento HTML mínimo y válido.",
    "lecciones": [
      {
        "id": "L01.01",
        "moduloId": "M01",
        "titulo": "Etiquetas de apertura, cierre y vacías",
        "tipo": "leccion",
        "dificultad": 1,
        "nuevas": [
          "<",
          ">",
          "/"
        ],
        "explicacion": "HTML estructura el contenido con etiquetas. La mayoría se abre y se cierra con una barra, como `<p>` y `</p>`. Las etiquetas vacías, como `<br>` y `<hr>`, no envuelven nada y no se cierran.",
        "codigo": "<p>Aprender HTML es divertido.</p>\n<p>\n  Cada etiqueta se abre y se cierra.\n</p>\n<br>\n<p>El br es una etiqueta vacia.</p>\n<hr>\n<p>Y el hr dibuja una linea.</p>"
      },
      {
        "id": "L01.02",
        "moduloId": "M01",
        "titulo": "Tipo de documento y elemento raíz",
        "tipo": "leccion",
        "dificultad": 1,
        "nuevas": [
          "!",
          "=",
          "\""
        ],
        "explicacion": "`<!DOCTYPE html>` va siempre en la primera línea y activa el modo estándar del navegador. Después, `<html>` envuelve toda la página y su atributo `lang=\"es\"` indica el idioma, lo que ayuda a la accesibilidad y a los buscadores.",
        "codigo": "<!DOCTYPE html>\n<html lang=\"es\">\n  <head>\n  </head>\n  <body>\n  </body>\n</html>"
      },
      {
        "id": "L01.03",
        "moduloId": "M01",
        "titulo": "La cabecera: head, meta y title",
        "tipo": "leccion",
        "dificultad": 1,
        "nuevas": [
          ",",
          "-"
        ],
        "explicacion": "`<head>` guarda información que el usuario no ve directamente. `<meta charset=\"UTF-8\">` hace que las tildes se vean bien, `viewport` adapta la página al móvil y `<title>` es el texto de la pestaña del navegador.",
        "codigo": "<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <meta name=\"description\" content=\"Mi primera web\">\n  <title>Mi primera pagina web</title>\n</head>"
      },
      {
        "id": "L01.04",
        "moduloId": "M01",
        "titulo": "El cuerpo y la plantilla mínima",
        "tipo": "leccion",
        "dificultad": 1,
        "nuevas": [],
        "explicacion": "`<body>` contiene todo lo que se ve en la página. Esta plantilla reúne doctype, `html`, `head` y `body`, y es el punto de partida de cualquier página web.",
        "codigo": "<!DOCTYPE html>\n<html lang=\"es\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <title>Mi Web</title>\n  </head>\n  <body>\n    <h1>Hola, mundo</h1>\n    <p>Contenido del cuerpo.</p>\n  </body>\n</html>"
      },
      {
        "id": "L01.05",
        "moduloId": "M01",
        "titulo": "Comentarios",
        "tipo": "leccion",
        "dificultad": 1,
        "nuevas": [],
        "explicacion": "Un comentario empieza con `<!--` y termina con `-->`. El navegador no lo muestra, así que sirve para explicar el código o para desactivar un trozo sin borrarlo.",
        "codigo": "<!-- Esto es un comentario -->\n<p>Este texto se ve.</p>\n<!--\n  <p>Este texto no se ve.</p>\n-->\n<p>Un comentario explica el codigo.</p>"
      },
      {
        "id": "L01.R",
        "moduloId": "M01",
        "titulo": "Repaso: mi primera página",
        "tipo": "repaso",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "Una página completa con todo lo visto en el módulo: doctype, cabecera con metadatos, comentario y contenido.",
        "codigo": "<!DOCTYPE html>\n<html lang=\"es\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Mi primera pagina</title>\n  </head>\n  <body>\n    <!-- Cabecera de la pagina -->\n    <h1>Bienvenido</h1>\n    <p>Esta es mi primera web.</p>\n    <br>\n    <hr>\n    <p>Hecha con HTML5.</p>\n  </body>\n</html>"
      }
    ]
  },
  {
    "id": "M02",
    "curso": "html",
    "titulo": "Texto: encabezados, párrafos y formato",
    "descripcion": "Títulos, párrafos y las etiquetas que dan énfasis o significado al texto.",
    "lecciones": [
      {
        "id": "L02.01",
        "moduloId": "M02",
        "titulo": "Encabezados de h1 a h6",
        "tipo": "leccion",
        "dificultad": 1,
        "nuevas": [],
        "explicacion": "Hay seis niveles de encabezado, de `<h1>` a `<h6>`. `<h1>` es el título principal y se usa una sola vez por página; los demás organizan subtítulos y secciones sin saltarse niveles.",
        "codigo": "<h1>Mi blog de cocina</h1>\n<h2>Recetas</h2>\n<h3>Platos de cuchara</h3>\n<h3>Postres</h3>\n<h2>Contacto</h2>\n<h3>Redes sociales</h3>"
      },
      {
        "id": "L02.02",
        "moduloId": "M02",
        "titulo": "Párrafos, saltos y separadores",
        "tipo": "leccion",
        "dificultad": 1,
        "nuevas": [],
        "explicacion": "`<p>` define un párrafo y deja un margen alrededor. `<br>` fuerza un salto de línea dentro del párrafo y `<hr>` dibuja una línea horizontal que separa temas.",
        "codigo": "<p>Primer parrafo de texto.</p>\n<hr>\n<p>\n  Segundo parrafo con<br>\n  un salto de linea.\n</p>\n<hr>\n<p>Tercer parrafo.</p>"
      },
      {
        "id": "L02.03",
        "moduloId": "M02",
        "titulo": "Énfasis y formato semántico",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [
          ":"
        ],
        "explicacion": "`<strong>` marca importancia y se ve en negrita; `<em>` marca énfasis y se ve en cursiva. `<mark>` resalta, `<small>` es para letra pequeña, `<sub>` y `<sup>` sirven para subíndices y superíndices, y `<del>` e `<ins>` indican texto borrado e insertado.",
        "codigo": "<p>Texto <strong>importante</strong> en negrita.</p>\n<p>Texto con <em>enfasis</em> en cursiva.</p>\n<p>Texto <mark>resaltado</mark> en amarillo.</p>\n<p><small>Aviso legal en letra pequena.</small></p>\n<p>Agua: H<sub>2</sub>O y x<sup>2</sup>.</p>\n<p>Precio: <del>20</del> <ins>15</ins> euros.</p>"
      },
      {
        "id": "L02.04",
        "moduloId": "M02",
        "titulo": "Texto preformateado, código y citas",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [
          "(",
          ")"
        ],
        "explicacion": "`<pre>` respeta los saltos de línea tal como se escriben. `<code>` marca un fragmento de código dentro de una frase y `<blockquote>` sirve para citas largas.",
        "codigo": "<pre>\nLinea uno\nLinea dos\nLinea tres\n</pre>\n<p>Usa <code>console.log()</code> para depurar.</p>\n<blockquote>\n  La practica hace al maestro.\n</blockquote>"
      },
      {
        "id": "L02.R",
        "moduloId": "M02",
        "titulo": "Repaso: entrada de blog",
        "tipo": "repaso",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "Una entrada completa que mezcla encabezados, párrafos, énfasis, texto preformateado y una cita.",
        "codigo": "<h1>Mi blog de cocina</h1>\n<p>Bienvenido a <strong>mi blog</strong>.</p>\n<hr>\n<h2>Receta del dia</h2>\n<p>\n  Ingredientes: <em>tomate</em>, <em>cebolla</em><br>\n  y un poco de <mark>sal</mark>.\n</p>\n<h3>Pasos</h3>\n<pre>\nCortar\nMezclar\nServir\n</pre>\n<blockquote>\n  Cocinar es un acto de amor.\n</blockquote>\n<p><small>Receta de ejemplo.</small></p>"
      }
    ]
  },
  {
    "id": "M03",
    "curso": "html",
    "titulo": "Enlaces, imágenes y listas",
    "descripcion": "Conectar páginas, mostrar imágenes de forma accesible y organizar información en listas.",
    "lecciones": [
      {
        "id": "L03.01",
        "moduloId": "M03",
        "titulo": "Enlaces",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [
          "#",
          "@"
        ],
        "explicacion": "`<a>` crea un enlace y su atributo `href` indica el destino. Con `target=\"_blank\"` se abre en otra pestaña, con `#id` se salta a una sección de la misma página y con `mailto:` se abre el correo.",
        "codigo": "<a href=\"https://ejemplo.com\">Visitar sitio web</a>\n<a href=\"https://ejemplo.com\" target=\"_blank\">\n  Abrir en una pestana nueva\n</a>\n<a href=\"#contacto\">Ir a contacto</a>\n<a href=\"mailto:hola@ejemplo.com\">Enviar correo</a>\n<h2 id=\"contacto\">Contacto</h2>"
      },
      {
        "id": "L03.02",
        "moduloId": "M03",
        "titulo": "Imágenes y accesibilidad",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "`<img>` inserta una imagen con `src` y no se cierra. `alt` es obligatorio: describe la imagen para lectores de pantalla y para cuando no carga. `width` y `height` fijan su tamaño y una imagen puede ir dentro de un enlace.",
        "codigo": "<img src=\"foto.jpg\" alt=\"Montana al amanecer\">\n<img\n  src=\"logo.png\"\n  alt=\"Logotipo de la web\"\n  width=\"300\"\n  height=\"200\">\n<a href=\"inicio.html\">\n  <img src=\"casa.png\" alt=\"Volver al inicio\">\n</a>"
      },
      {
        "id": "L03.03",
        "moduloId": "M03",
        "titulo": "Listas ordenadas, no ordenadas y de definición",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "`<ul>` crea una lista con viñetas y `<ol>` una numerada; ambas usan `<li>` para cada elemento. `<dl>` agrupa términos `<dt>` con su descripción `<dd>`.",
        "codigo": "<ul>\n  <li>Pan</li>\n  <li>Leche</li>\n</ul>\n<ol>\n  <li>Abrir el editor</li>\n  <li>Escribir el codigo</li>\n</ol>\n<dl>\n  <dt>HTML</dt>\n  <dd>Lenguaje de marcado</dd>\n</dl>"
      },
      {
        "id": "L03.04",
        "moduloId": "M03",
        "titulo": "Menú de navegación con listas anidadas",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Una lista puede contener otra dentro de un `<li>`. Combinada con `<nav>` y enlaces es la forma estándar de construir un menú con submenús.",
        "codigo": "<nav>\n  <ul>\n    <li><a href=\"index.html\">Inicio</a></li>\n    <li>\n      <a href=\"cursos.html\">Cursos</a>\n      <ul>\n        <li><a href=\"html.html\">HTML</a></li>\n        <li><a href=\"css.html\">CSS</a></li>\n      </ul>\n    </li>\n  </ul>\n</nav>"
      },
      {
        "id": "L03.R",
        "moduloId": "M03",
        "titulo": "Repaso: página con menú y secciones",
        "tipo": "repaso",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Menú de anclas, secciones con identificador, una imagen con texto alternativo y una lista numerada.",
        "codigo": "<h1>Mis sitios favoritos</h1>\n<nav>\n  <ul>\n    <li><a href=\"#html\">HTML</a></li>\n    <li><a href=\"#css\">CSS</a></li>\n    <li><a href=\"mailto:yo@ejemplo.com\">Contacto</a></li>\n  </ul>\n</nav>\n<h2 id=\"html\">HTML</h2>\n<img src=\"html.png\" alt=\"Logo de HTML\" width=\"100\">\n<ol>\n  <li>Etiquetas</li>\n  <li>Atributos</li>\n</ol>\n<h2 id=\"css\">CSS</h2>\n<p>Estilos para la web.</p>"
      }
    ]
  },
  {
    "id": "M04",
    "curso": "html",
    "titulo": "Tablas y formularios",
    "descripcion": "Presentar datos en tablas y recoger información con formularios.",
    "lecciones": [
      {
        "id": "L04.01",
        "moduloId": "M04",
        "titulo": "Estructura básica de una tabla",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "`<table>` define una tabla. Cada fila es un `<tr>`, las celdas de encabezado son `<th>` y las celdas de datos son `<td>`.",
        "codigo": "<table>\n  <tr>\n    <th>Nombre</th>\n    <th>Edad</th>\n  </tr>\n  <tr>\n    <td>Ana</td>\n    <td>25</td>\n  </tr>\n</table>"
      },
      {
        "id": "L04.02",
        "moduloId": "M04",
        "titulo": "Cabecera y cuerpo de la tabla",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "`<thead>` agrupa las filas de cabecera y `<tbody>` las filas de datos. Separarlas mejora la accesibilidad y permite dar estilos distintos a cada parte.",
        "codigo": "<table>\n  <thead>\n    <tr>\n      <th>Mes</th>\n      <th>Gasto</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Enero</td>\n      <td>120</td>\n    </tr>\n  </tbody>\n</table>"
      },
      {
        "id": "L04.03",
        "moduloId": "M04",
        "titulo": "Fusión de celdas: colspan y rowspan",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "`colspan` hace que una celda ocupe varias columnas y `rowspan` varias filas. Las filas siguientes no repiten las celdas que ya quedan cubiertas.",
        "codigo": "<table>\n  <tbody>\n    <tr>\n      <td colspan=\"2\">Fila ancha</td>\n    </tr>\n    <tr>\n      <td rowspan=\"2\">Alto</td>\n      <td>Uno</td>\n    </tr>\n    <tr>\n      <td>Dos</td>\n    </tr>\n  </tbody>\n</table>"
      },
      {
        "id": "L04.04",
        "moduloId": "M04",
        "titulo": "Formularios y campos de entrada",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "`<form>` agrupa los campos y su atributo `action` indica a dónde se envían los datos. `<label for=\"…\">` se conecta con el `id` de su campo. `<input>` cambia según su `type`: texto, contraseña o botón de envío. `placeholder` muestra una pista dentro de la casilla.",
        "codigo": "<form action=\"/enviar\" method=\"post\">\n  <label for=\"usr\">Usuario:</label>\n  <input type=\"text\" id=\"usr\" placeholder=\"Nombre\">\n  <label for=\"pass\">Clave:</label>\n  <input type=\"password\" id=\"pass\">\n  <input type=\"submit\" value=\"Enviar\">\n</form>"
      },
      {
        "id": "L04.05",
        "moduloId": "M04",
        "titulo": "Selección, opciones y texto largo",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "`<select>` con `<option>` crea un desplegable. `<textarea>` es una caja de varias líneas. Los botones `radio` que comparten `name` permiten elegir una sola opción; las casillas `checkbox` son independientes.",
        "codigo": "<form action=\"/procesar\" method=\"post\">\n  <select name=\"ciudad\">\n    <option value=\"mad\">Madrid</option>\n    <option value=\"bcn\">Barcelona</option>\n  </select>\n  <textarea name=\"msg\" placeholder=\"Mensaje\"></textarea>\n  <label><input type=\"radio\" name=\"turno\" value=\"m\"> Manana</label>\n  <label><input type=\"radio\" name=\"turno\" value=\"t\"> Tarde</label>\n  <label><input type=\"checkbox\" name=\"acepto\"> Acepto</label>\n</form>"
      },
      {
        "id": "L04.R",
        "moduloId": "M04",
        "titulo": "Repaso: tabla y formulario",
        "tipo": "repaso",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Una tabla con cabecera y cuerpo seguida de un formulario sencillo.",
        "codigo": "<table>\n  <thead>\n    <tr>\n      <th>Producto</th>\n      <th>Precio</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Libro</td>\n      <td>12</td>\n    </tr>\n  </tbody>\n</table>\n<form action=\"/enviar\">\n  <label for=\"nom\">Nombre:</label>\n  <input type=\"text\" id=\"nom\">\n  <input type=\"submit\" value=\"Enviar\">\n</form>"
      }
    ]
  },
  {
    "id": "M05",
    "curso": "html",
    "titulo": "Multimedia, semántica y accesibilidad",
    "descripcion": "Audio y vídeo nativos, estructura semántica de la página y buenas prácticas de accesibilidad.",
    "lecciones": [
      {
        "id": "L05.01",
        "moduloId": "M05",
        "titulo": "Audio y vídeo",
        "tipo": "leccion",
        "dificultad": 2,
        "nuevas": [],
        "explicacion": "`<video>` y `<audio>` reproducen medios sin plugins. `controls` muestra los botones del navegador. Dentro, varios `<source>` ofrecen formatos alternativos, y el texto final se muestra si el navegador no los soporta. `poster` y `preload` configuran la portada y la carga.",
        "codigo": "<video width=\"320\" height=\"240\" controls poster=\"portada.jpg\">\n  <source src=\"video.mp4\" type=\"video/mp4\">\n  <source src=\"video.ogv\" type=\"video/ogg\">\n  Tu navegador no soporta video.\n</video>\n<audio controls preload=\"auto\">\n  <source src=\"audio.mp3\" type=\"audio/mpeg\">\n</audio>"
      },
      {
        "id": "L05.02",
        "moduloId": "M05",
        "titulo": "Estructura semántica de la página",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Las etiquetas semánticas dicen para qué sirve cada bloque: `<header>` cabecera, `<nav>` navegación, `<main>` contenido principal, `<section>` tema, `<article>` unidad autónoma, `<aside>` contenido lateral y `<footer>` pie.",
        "codigo": "<header>\n  <nav>\n    <a href=\"#inicio\">Inicio</a>\n  </nav>\n</header>\n<main>\n  <section>\n    <article>\n      <h2>Articulo principal</h2>\n    </article>\n  </section>\n  <aside>Contenido lateral</aside>\n</main>\n<footer>Pie de pagina</footer>"
      },
      {
        "id": "L05.03",
        "moduloId": "M05",
        "titulo": "Figuras, desplegables y fechas",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "`<figure>` envuelve una imagen y `<figcaption>` la explica. `<details>` crea un desplegable que se abre al pulsar su `<summary>`. `<time>` marca una fecha con el atributo `datetime`, que entienden los programas.",
        "codigo": "<figure>\n  <img src=\"grafico.png\" alt=\"Grafico de ventas\">\n  <figcaption>Figura 1: Ventas del ano.</figcaption>\n</figure>\n<details>\n  <summary>Mas informacion</summary>\n  <p>\n    Publicado el <time datetime=\"2026-11-06\">6 de noviembre</time>.\n  </p>\n</details>"
      },
      {
        "id": "L05.04",
        "moduloId": "M05",
        "titulo": "Accesibilidad: alt, title y ARIA",
        "tipo": "leccion",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "La accesibilidad permite que cualquier persona use la web. `alt` describe las imágenes, `title` añade una ayuda emergente, `role` indica la función de un bloque y `aria-label` da un nombre a un elemento sin texto visible.",
        "codigo": "<button aria-label=\"Cerrar ventana\" title=\"Cerrar\">\n  X\n</button>\n<div role=\"navigation\" aria-label=\"Menu rapido\">\n  <a href=\"#enlace\" title=\"Ir al enlace\">Enlace accesible</a>\n</div>\n<img src=\"mapa.png\" alt=\"Mapa del centro\">"
      },
      {
        "id": "L05.R",
        "moduloId": "M05",
        "titulo": "Repaso: página de noticia",
        "tipo": "repaso",
        "dificultad": 3,
        "nuevas": [],
        "explicacion": "Una página semántica con artículo, fecha, vídeo y pie.",
        "codigo": "<!DOCTYPE html>\n<html lang=\"es\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <title>Repaso multimedia y semantica</title>\n  </head>\n  <body>\n    <main>\n      <article>\n        <h2>Noticia</h2>\n        <p>Fecha: <time datetime=\"2026-11-06\">hoy</time></p>\n        <video width=\"300\" controls>\n          <source src=\"video.mp4\" type=\"video/mp4\">\n        </video>\n      </article>\n    </main>\n    <footer>Derechos reservados</footer>\n  </body>\n</html>"
      }
    ]
  }
];
