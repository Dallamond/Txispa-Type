# Temario de HTML5 y CSS3 para Txispa Type

Fuente de verdad del contenido del curso. Formato parseable descrito en `docs/curso/SPEC-FORMATO-LECCIONES.md` §3: lo lee `app/scripts/generar-curso.mjs` y lo valida el test de contenido (§7 de esa especificación).

**Estado:** M01-M12 completos y listos para revisar (normalizados a partir de los lotes de NotebookLM y corregidos). Falta la revisión de Lucas y contrastarlos con las fuentes del cuaderno.

Convenciones del archivo:

- Código con **sangría de 2 espacios**, sin tabuladores, sin líneas en blanco y sin espacios dobles. La sangría la pone la app; se teclea `Enter` al final de cada línea.
- Lecciones de 6 a 15 líneas; repasos de 12 a 25 (las tablas, los formularios y las páginas con CSS no caben en menos).
- Desde M07 los fragmentos de CSS llevan un `<style>` suelto delante del HTML al que se aplican: es para practicar y ver el efecto. La página completa, con el `<style>` dentro de `<head>`, va en los repasos.
- Para evitar fallos injustos, el código usa letras sin tilde (el texto de las explicaciones sí lleva tildes). Las lecciones con tildes se marcarán a propósito más adelante.
- `nuevas` lista los símbolos que se estrenan en esa lección; `ninguna` si no hay.
- Los comentarios HTML (`<!-- -->`) deben ignorarse en la comprobación de etiquetas balanceadas del validador.

---

## M01 · Estructura básica de HTML5
Curso: html
Descripción: Qué es una etiqueta y cómo se monta un documento HTML mínimo y válido.

### L01.01 · Etiquetas de apertura, cierre y vacías
- tipo: leccion
- dificultad: 1
- nuevas: `< > /`
> HTML estructura el contenido con etiquetas. La mayoría se abre y se cierra con una barra, como `<p>` y `</p>`. Las etiquetas vacías, como `<br>` y `<hr>`, no envuelven nada y no se cierran.

```html
<p>Aprender HTML es divertido.</p>
<p>
  Cada etiqueta se abre y se cierra.
</p>
<br>
<p>El br es una etiqueta vacia.</p>
<hr>
<p>Y el hr dibuja una linea.</p>
```

### L01.02 · Tipo de documento y elemento raíz
- tipo: leccion
- dificultad: 1
- nuevas: `! = "`
> `<!DOCTYPE html>` va siempre en la primera línea y activa el modo estándar del navegador. Después, `<html>` envuelve toda la página y su atributo `lang="es"` indica el idioma, lo que ayuda a la accesibilidad y a los buscadores.

```html
<!DOCTYPE html>
<html lang="es">
  <head>
  </head>
  <body>
  </body>
</html>
```

### L01.03 · La cabecera: head, meta y title
- tipo: leccion
- dificultad: 1
- nuevas: `, -`
> `<head>` guarda información que el usuario no ve directamente. `<meta charset="UTF-8">` hace que las tildes se vean bien, `viewport` adapta la página al móvil y `<title>` es el texto de la pestaña del navegador.

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Mi primera web">
  <title>Mi primera pagina web</title>
</head>
```

### L01.04 · El cuerpo y la plantilla mínima
- tipo: leccion
- dificultad: 1
- nuevas: ninguna
> `<body>` contiene todo lo que se ve en la página. Esta plantilla reúne doctype, `html`, `head` y `body`, y es el punto de partida de cualquier página web.

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Mi Web</title>
  </head>
  <body>
    <h1>Hola, mundo</h1>
    <p>Contenido del cuerpo.</p>
  </body>
</html>
```

### L01.05 · Comentarios
- tipo: leccion
- dificultad: 1
- nuevas: ninguna
> Un comentario empieza con `<!--` y termina con `-->`. El navegador no lo muestra, así que sirve para explicar el código o para desactivar un trozo sin borrarlo.

```html
<!-- Esto es un comentario -->
<p>Este texto se ve.</p>
<!--
  <p>Este texto no se ve.</p>
-->
<p>Un comentario explica el codigo.</p>
```

### L01.R · Repaso: mi primera página
- tipo: repaso
- dificultad: 2
- nuevas: ninguna
> Una página completa con todo lo visto en el módulo: doctype, cabecera con metadatos, comentario y contenido.

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi primera pagina</title>
  </head>
  <body>
    <!-- Cabecera de la pagina -->
    <h1>Bienvenido</h1>
    <p>Esta es mi primera web.</p>
    <br>
    <hr>
    <p>Hecha con HTML5.</p>
  </body>
</html>
```

---

## M02 · Texto: encabezados, párrafos y formato
Curso: html
Descripción: Títulos, párrafos y las etiquetas que dan énfasis o significado al texto.

### L02.01 · Encabezados de h1 a h6
- tipo: leccion
- dificultad: 1
- nuevas: ninguna
> Hay seis niveles de encabezado, de `<h1>` a `<h6>`. `<h1>` es el título principal y se usa una sola vez por página; los demás organizan subtítulos y secciones sin saltarse niveles.

```html
<h1>Mi blog de cocina</h1>
<h2>Recetas</h2>
<h3>Platos de cuchara</h3>
<h3>Postres</h3>
<h2>Contacto</h2>
<h3>Redes sociales</h3>
```

### L02.02 · Párrafos, saltos y separadores
- tipo: leccion
- dificultad: 1
- nuevas: ninguna
> `<p>` define un párrafo y deja un margen alrededor. `<br>` fuerza un salto de línea dentro del párrafo y `<hr>` dibuja una línea horizontal que separa temas.

```html
<p>Primer parrafo de texto.</p>
<hr>
<p>
  Segundo parrafo con<br>
  un salto de linea.
</p>
<hr>
<p>Tercer parrafo.</p>
```

### L02.03 · Énfasis y formato semántico
- tipo: leccion
- dificultad: 2
- nuevas: `:`
> `<strong>` marca importancia y se ve en negrita; `<em>` marca énfasis y se ve en cursiva. `<mark>` resalta, `<small>` es para letra pequeña, `<sub>` y `<sup>` sirven para subíndices y superíndices, y `<del>` e `<ins>` indican texto borrado e insertado.

```html
<p>Texto <strong>importante</strong> en negrita.</p>
<p>Texto con <em>enfasis</em> en cursiva.</p>
<p>Texto <mark>resaltado</mark> en amarillo.</p>
<p><small>Aviso legal en letra pequena.</small></p>
<p>Agua: H<sub>2</sub>O y x<sup>2</sup>.</p>
<p>Precio: <del>20</del> <ins>15</ins> euros.</p>
```

### L02.04 · Texto preformateado, código y citas
- tipo: leccion
- dificultad: 2
- nuevas: `( )`
> `<pre>` respeta los saltos de línea tal como se escriben. `<code>` marca un fragmento de código dentro de una frase y `<blockquote>` sirve para citas largas.

```html
<pre>
Linea uno
Linea dos
Linea tres
</pre>
<p>Usa <code>console.log()</code> para depurar.</p>
<blockquote>
  La practica hace al maestro.
</blockquote>
```

### L02.R · Repaso: entrada de blog
- tipo: repaso
- dificultad: 2
- nuevas: ninguna
> Una entrada completa que mezcla encabezados, párrafos, énfasis, texto preformateado y una cita.

```html
<h1>Mi blog de cocina</h1>
<p>Bienvenido a <strong>mi blog</strong>.</p>
<hr>
<h2>Receta del dia</h2>
<p>
  Ingredientes: <em>tomate</em>, <em>cebolla</em><br>
  y un poco de <mark>sal</mark>.
</p>
<h3>Pasos</h3>
<pre>
Cortar
Mezclar
Servir
</pre>
<blockquote>
  Cocinar es un acto de amor.
</blockquote>
<p><small>Receta de ejemplo.</small></p>
```

---

## M03 · Enlaces, imágenes y listas
Curso: html
Descripción: Conectar páginas, mostrar imágenes de forma accesible y organizar información en listas.

### L03.01 · Enlaces
- tipo: leccion
- dificultad: 2
- nuevas: `# @`
> `<a>` crea un enlace y su atributo `href` indica el destino. Con `target="_blank"` se abre en otra pestaña, con `#id` se salta a una sección de la misma página y con `mailto:` se abre el correo.

```html
<a href="https://ejemplo.com">Visitar sitio web</a>
<a href="https://ejemplo.com" target="_blank">
  Abrir en una pestana nueva
</a>
<a href="#contacto">Ir a contacto</a>
<a href="mailto:hola@ejemplo.com">Enviar correo</a>
<h2 id="contacto">Contacto</h2>
```

### L03.02 · Imágenes y accesibilidad
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> `<img>` inserta una imagen con `src` y no se cierra. `alt` es obligatorio: describe la imagen para lectores de pantalla y para cuando no carga. `width` y `height` fijan su tamaño y una imagen puede ir dentro de un enlace.

```html
<img src="foto.jpg" alt="Montana al amanecer">
<img
  src="logo.png"
  alt="Logotipo de la web"
  width="300"
  height="200">
<a href="inicio.html">
  <img src="casa.png" alt="Volver al inicio">
</a>
```

### L03.03 · Listas ordenadas, no ordenadas y de definición
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> `<ul>` crea una lista con viñetas y `<ol>` una numerada; ambas usan `<li>` para cada elemento. `<dl>` agrupa términos `<dt>` con su descripción `<dd>`.

```html
<ul>
  <li>Pan</li>
  <li>Leche</li>
</ul>
<ol>
  <li>Abrir el editor</li>
  <li>Escribir el codigo</li>
</ol>
<dl>
  <dt>HTML</dt>
  <dd>Lenguaje de marcado</dd>
</dl>
```

### L03.04 · Menú de navegación con listas anidadas
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> Una lista puede contener otra dentro de un `<li>`. Combinada con `<nav>` y enlaces es la forma estándar de construir un menú con submenús.

```html
<nav>
  <ul>
    <li><a href="index.html">Inicio</a></li>
    <li>
      <a href="cursos.html">Cursos</a>
      <ul>
        <li><a href="html.html">HTML</a></li>
        <li><a href="css.html">CSS</a></li>
      </ul>
    </li>
  </ul>
</nav>
```

### L03.R · Repaso: página con menú y secciones
- tipo: repaso
- dificultad: 3
- nuevas: ninguna
> Menú de anclas, secciones con identificador, una imagen con texto alternativo y una lista numerada.

```html
<h1>Mis sitios favoritos</h1>
<nav>
  <ul>
    <li><a href="#html">HTML</a></li>
    <li><a href="#css">CSS</a></li>
    <li><a href="mailto:yo@ejemplo.com">Contacto</a></li>
  </ul>
</nav>
<h2 id="html">HTML</h2>
<img src="html.png" alt="Logo de HTML" width="100">
<ol>
  <li>Etiquetas</li>
  <li>Atributos</li>
</ol>
<h2 id="css">CSS</h2>
<p>Estilos para la web.</p>
```

---

## M04 · Tablas y formularios
Curso: html
Descripción: Presentar datos en tablas y recoger información con formularios.

### L04.01 · Estructura básica de una tabla
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> `<table>` define una tabla. Cada fila es un `<tr>`, las celdas de encabezado son `<th>` y las celdas de datos son `<td>`.

```html
<table>
  <tr>
    <th>Nombre</th>
    <th>Edad</th>
  </tr>
  <tr>
    <td>Ana</td>
    <td>25</td>
  </tr>
</table>
```

### L04.02 · Cabecera y cuerpo de la tabla
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> `<thead>` agrupa las filas de cabecera y `<tbody>` las filas de datos. Separarlas mejora la accesibilidad y permite dar estilos distintos a cada parte.

```html
<table>
  <thead>
    <tr>
      <th>Mes</th>
      <th>Gasto</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Enero</td>
      <td>120</td>
    </tr>
  </tbody>
</table>
```

### L04.03 · Fusión de celdas: colspan y rowspan
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> `colspan` hace que una celda ocupe varias columnas y `rowspan` varias filas. Las filas siguientes no repiten las celdas que ya quedan cubiertas.

```html
<table>
  <tbody>
    <tr>
      <td colspan="2">Fila ancha</td>
    </tr>
    <tr>
      <td rowspan="2">Alto</td>
      <td>Uno</td>
    </tr>
    <tr>
      <td>Dos</td>
    </tr>
  </tbody>
</table>
```

### L04.04 · Formularios y campos de entrada
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> `<form>` agrupa los campos y su atributo `action` indica a dónde se envían los datos. `<label for="…">` se conecta con el `id` de su campo. `<input>` cambia según su `type`: texto, contraseña o botón de envío. `placeholder` muestra una pista dentro de la casilla.

```html
<form action="/enviar" method="post">
  <label for="usr">Usuario:</label>
  <input type="text" id="usr" placeholder="Nombre">
  <label for="pass">Clave:</label>
  <input type="password" id="pass">
  <input type="submit" value="Enviar">
</form>
```

### L04.05 · Selección, opciones y texto largo
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> `<select>` con `<option>` crea un desplegable. `<textarea>` es una caja de varias líneas. Los botones `radio` que comparten `name` permiten elegir una sola opción; las casillas `checkbox` son independientes.

```html
<form action="/procesar" method="post">
  <select name="ciudad">
    <option value="mad">Madrid</option>
    <option value="bcn">Barcelona</option>
  </select>
  <textarea name="msg" placeholder="Mensaje"></textarea>
  <label><input type="radio" name="turno" value="m"> Manana</label>
  <label><input type="radio" name="turno" value="t"> Tarde</label>
  <label><input type="checkbox" name="acepto"> Acepto</label>
</form>
```

### L04.R · Repaso: tabla y formulario
- tipo: repaso
- dificultad: 3
- nuevas: ninguna
> Una tabla con cabecera y cuerpo seguida de un formulario sencillo.

```html
<table>
  <thead>
    <tr>
      <th>Producto</th>
      <th>Precio</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Libro</td>
      <td>12</td>
    </tr>
  </tbody>
</table>
<form action="/enviar">
  <label for="nom">Nombre:</label>
  <input type="text" id="nom">
  <input type="submit" value="Enviar">
</form>
```

---

## M05 · Multimedia, semántica y accesibilidad
Curso: html
Descripción: Audio y vídeo nativos, estructura semántica de la página y buenas prácticas de accesibilidad.

### L05.01 · Audio y vídeo
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> `<video>` y `<audio>` reproducen medios sin plugins. `controls` muestra los botones del navegador. Dentro, varios `<source>` ofrecen formatos alternativos, y el texto final se muestra si el navegador no los soporta. `poster` y `preload` configuran la portada y la carga.

```html
<video width="320" height="240" controls poster="portada.jpg">
  <source src="video.mp4" type="video/mp4">
  <source src="video.ogv" type="video/ogg">
  Tu navegador no soporta video.
</video>
<audio controls preload="auto">
  <source src="audio.mp3" type="audio/mpeg">
</audio>
```

### L05.02 · Estructura semántica de la página
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> Las etiquetas semánticas dicen para qué sirve cada bloque: `<header>` cabecera, `<nav>` navegación, `<main>` contenido principal, `<section>` tema, `<article>` unidad autónoma, `<aside>` contenido lateral y `<footer>` pie.

```html
<header>
  <nav>
    <a href="#inicio">Inicio</a>
  </nav>
</header>
<main>
  <section>
    <article>
      <h2>Articulo principal</h2>
    </article>
  </section>
  <aside>Contenido lateral</aside>
</main>
<footer>Pie de pagina</footer>
```

### L05.03 · Figuras, desplegables y fechas
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> `<figure>` envuelve una imagen y `<figcaption>` la explica. `<details>` crea un desplegable que se abre al pulsar su `<summary>`. `<time>` marca una fecha con el atributo `datetime`, que entienden los programas.

```html
<figure>
  <img src="grafico.png" alt="Grafico de ventas">
  <figcaption>Figura 1: Ventas del ano.</figcaption>
</figure>
<details>
  <summary>Mas informacion</summary>
  <p>
    Publicado el <time datetime="2026-11-06">6 de noviembre</time>.
  </p>
</details>
```

### L05.04 · Accesibilidad: alt, title y ARIA
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> La accesibilidad permite que cualquier persona use la web. `alt` describe las imágenes, `title` añade una ayuda emergente, `role` indica la función de un bloque y `aria-label` da un nombre a un elemento sin texto visible.

```html
<button aria-label="Cerrar ventana" title="Cerrar">
  X
</button>
<div role="navigation" aria-label="Menu rapido">
  <a href="#enlace" title="Ir al enlace">Enlace accesible</a>
</div>
<img src="mapa.png" alt="Mapa del centro">
```

### L05.R · Repaso: página de noticia
- tipo: repaso
- dificultad: 3
- nuevas: ninguna
> Una página semántica con artículo, fecha, vídeo y pie.

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Repaso multimedia y semantica</title>
  </head>
  <body>
    <main>
      <article>
        <h2>Noticia</h2>
        <p>Fecha: <time datetime="2026-11-06">hoy</time></p>
        <video width="300" controls>
          <source src="video.mp4" type="video/mp4">
        </video>
      </article>
    </main>
    <footer>Derechos reservados</footer>
  </body>
</html>
```

---

## M06 · Fundamentos de CSS: reglas, selectores, color y tipografía
Curso: css
Descripción: Cómo se incluye CSS, cómo se escribe una regla y cómo se eligen los elementos a los que se aplica.

### L06.01 · Incluir CSS y escribir una regla
- tipo: leccion
- dificultad: 2
- nuevas: `{ } ;`
> CSS separa el diseño del contenido. Una regla tiene un selector y un bloque entre llaves con declaraciones `propiedad: valor;`. Se incluye dentro de `<style>` o desde un archivo con `<link>`.

```html
<head>
  <meta charset="UTF-8">
  <title>Mi estilo</title>
  <link rel="stylesheet" href="estilos.css">
  <style>
    p {
      color: blue;
      font-size: 16px;
    }
  </style>
</head>
```

### L06.02 · Selectores básicos
- tipo: leccion
- dificultad: 2
- nuevas: `*`
> El selector de etiqueta afecta a todos los elementos de ese tipo. `*` selecciona todos. Un punto `.` selecciona una clase, que puede repetirse, y una almohadilla `#` selecciona un `id`, que debe ser único.

```css
* {
  margin: 0;
}
h1 {
  color: black;
}
.destacado {
  color: red;
}
#principal {
  color: green;
}
```

### L06.03 · Combinadores, atributos y pseudoclases
- tipo: leccion
- dificultad: 3
- nuevas: `[ ]`
> Dos selectores separados por un espacio eligen los elementos anidados. Los corchetes filtran por atributo. `:hover` se aplica al pasar el ratón y `:nth-child()` según la posición del elemento entre sus hermanos.

```css
div p {
  color: black;
}
input[type="text"] {
  border: 1px solid;
}
a:hover {
  color: red;
}
p:nth-child(even) {
  background: gray;
}
```

### L06.04 · Color y tipografía
- tipo: leccion
- dificultad: 3
- nuevas: `'`
> Un color puede darse por nombre, en hexadecimal `#rrggbb` o con `rgba()`, cuyo último valor es la transparencia de 0 a 1. `font-family` lista fuentes por orden de preferencia y `@font-face` carga una fuente propia con `src: url()`.

```css
@font-face {
  font-family: 'MiFuente';
  src: url('fuente.ttf');
}
body {
  font-family: 'MiFuente', sans-serif;
  color: #333333;
  background: rgba(0, 0, 0, 0.5);
}
```

### L06.R · Repaso: página con estilos
- tipo: repaso
- dificultad: 3
- nuevas: ninguna
> Una página completa con CSS interno que usa selectores de etiqueta y de clase, una pseudoclase y un color con transparencia.

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <title>Repaso CSS</title>
    <style>
      body {
        color: #333333;
      }
      .titulo {
        color: rgba(255, 0, 0, 0.8);
      }
      a:hover {
        color: blue;
      }
    </style>
  </head>
  <body>
    <h1 class="titulo">Titulo CSS</h1>
    <a href="#ver">Enlace</a>
  </body>
</html>
```

---

## M07 · Modelo de caja, bordes y sombras
Curso: css
Descripción: Cómo calcula CSS el tamaño de cada elemento y cómo se decoran sus bordes y su sombra.

### L07.01 · El modelo de caja
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> Todo elemento es una caja de cuatro capas: el contenido, el relleno interior (`padding`), el borde (`border`) y el margen exterior (`margin`). Cambiar cualquiera de ellas cambia el espacio que ocupa el elemento.

```html
<style>
  div {
    width: 200px;
    padding: 10px;
    border: 2px solid black;
    margin: 15px;
  }
</style>
<div>
  Contenido de la caja
</div>
```

### L07.02 · Tamaño de la caja: box-sizing
- tipo: leccion
- dificultad: 3
- nuevas: `%`
> Por defecto, el relleno y el borde se suman al ancho y al alto. Con `box-sizing: border-box` quedan incluidos dentro de `width` y `height`, y las cuentas del diseño salen más fáciles. Un porcentaje se calcula sobre el contenedor.

```html
<style>
  .caja {
    box-sizing: border-box;
    width: 100%;
    height: 100px;
    padding: 20px;
    border: 5px solid red;
  }
</style>
<div class="caja">
  Caja dimensionada
</div>
```

### L07.03 · Esquinas redondeadas y sombras
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> `border-radius` redondea las esquinas. `box-shadow` proyecta una sombra con desplazamiento horizontal, desplazamiento vertical, desenfoque y color. `text-shadow` hace lo mismo con el texto.

```html
<style>
  .tarjeta {
    border-radius: 10px;
    box-shadow: 0 4px 8px gray;
    text-shadow: 1px 1px black;
  }
</style>
<div class="tarjeta">
  Texto con sombra
</div>
```

### L07.04 · Desbordamiento de contenido
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> Cuando el contenido no cabe en su caja, `overflow` decide qué pasa. `hidden` recorta lo que sobra y `auto` o `scroll` añaden barras de desplazamiento.

```html
<style>
  .auto {
    height: 40px;
    overflow: auto;
  }
  .recorte {
    height: 40px;
    overflow: hidden;
  }
</style>
<div class="auto">Texto largo que genera desplazamiento interno al superar la altura de la caja.</div>
<div class="recorte">Texto largo que queda recortado al superar la altura de la caja.</div>
```

### L07.R · Repaso: tarjeta con estilo
- tipo: repaso
- dificultad: 3
- nuevas: ninguna
> Una página completa con una tarjeta que combina `box-sizing`, relleno, borde redondeado, sombra y control de desbordamiento.

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <title>Repaso modelo de caja</title>
    <style>
      .tarjeta {
        box-sizing: border-box;
        padding: 15px;
        border: 2px solid blue;
        border-radius: 8px;
        box-shadow: 0 4px 6px gray;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div class="tarjeta">
      <h2>Tarjeta de repaso</h2>
      <p>Contenido en modelo de caja.</p>
    </div>
  </body>
</html>
```

---

## M08 · Display y posicionamiento
Curso: css
Descripción: Cómo se colocan los elementos en la página: flujo normal, flotantes, posiciones y capas.

### L08.01 · La propiedad display
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> `display` cambia cómo se comporta un elemento. `block` ocupa todo el ancho y abre línea nueva (como `div` y `p` por defecto), `inline` ocupa solo su contenido, `inline-block` permite dar ancho y alto sin salir de la línea, y `none` lo oculta del todo.

```html
<style>
  span {
    display: inline-block;
    width: 100px;
    background: red;
  }
  .oculto {
    display: none;
  }
</style>
<span>Elemento 1</span>
<span>Elemento 2</span>
<p class="oculto">No se ve</p>
```

### L08.02 · Flotantes: float y clear
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> `float` empuja un elemento a un lado (`left` o `right`) y el texto fluye a su alrededor. `clear: both` hace que un elemento se coloque por debajo de los flotantes en lugar de montarse sobre ellos.

```html
<style>
  .caja {
    float: left;
    width: 50%;
  }
  .limpiar {
    clear: both;
  }
</style>
<div class="caja">Caja flotante</div>
<div class="limpiar">Texto limpio</div>
```

### L08.03 · Posición relativa y absoluta
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> `position: relative` mantiene el elemento en su sitio y lo convierte en referencia. `position: absolute` coloca un elemento con `top`, `right`, `bottom` y `left` respecto a su ancestro posicionado más cercano. `fixed` hace lo mismo respecto a la ventana y no se mueve al desplazarse.

```html
<style>
  .padre {
    position: relative;
    height: 100px;
  }
  .hijo {
    position: absolute;
    top: 10px;
    right: 20px;
  }
</style>
<div class="padre">
  <div class="hijo">Caja absoluta</div>
</div>
```

### L08.04 · Capas: z-index
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> Cuando varios elementos posicionados se solapan, `z-index` decide cuál queda delante: gana el número mayor. Solo funciona en elementos cuyo `position` no es `static`.

```html
<style>
  .capa1 {
    position: absolute;
    z-index: 1;
  }
  .capa2 {
    position: absolute;
    z-index: 2;
  }
</style>
<div class="capa1">Fondo</div>
<div class="capa2">Frente</div>
```

### L08.R · Repaso: cabecera fija y capa superpuesta
- tipo: repaso
- dificultad: 3
- nuevas: ninguna
> Una página con una cabecera fija a la ventana y una capa absoluta por encima del resto.

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Repaso posicionamiento</title>
    <style>
      header {
        position: fixed;
        top: 0;
      }
      .modal {
        position: absolute;
        z-index: 10;
      }
    </style>
  </head>
  <body>
    <header>Menu fijo</header>
    <div class="modal">Capa sobrepuesta</div>
  </body>
</html>
```

---

## M09 · Maquetación moderna: Flexbox y Grid
Curso: css
Descripción: Los dos sistemas actuales para distribuir elementos: Flexbox en una dimensión y Grid en dos.

### L09.01 · Flexbox: contenedor y eje principal
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> Flexbox reparte el espacio entre elementos en una sola dimensión. `display: flex` convierte un contenedor en flexible y afecta a sus hijos directos. `flex-direction` elige el eje: `row` en fila o `column` en columna.

```html
<style>
  .contenedor {
    display: flex;
    flex-direction: row;
  }
  .item {
    width: 100px;
  }
</style>
<div class="contenedor">
  <div class="item">Caja 1</div>
  <div class="item">Caja 2</div>
</div>
```

### L09.02 · Alineación en Flexbox
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> `justify-content` reparte los elementos a lo largo del eje principal (`center`, `space-between`, `flex-end`). `align-items` los alinea en el eje perpendicular. `gap` fija el espacio entre hijos sin usar márgenes.

```html
<style>
  .menu {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
  }
</style>
<nav class="menu">
  <a href="#inicio">Inicio</a>
  <a href="#perfil">Perfil</a>
</nav>
```

### L09.03 · Grid: columnas y unidad fr
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> Grid organiza filas y columnas a la vez. `display: grid` activa la rejilla y `grid-template-columns` define el ancho de cada columna. La unidad `fr` es una fracción del espacio disponible: `1fr 2fr` da a la segunda columna el doble de ancho.

```html
<style>
  .rejilla {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 10px;
  }
</style>
<div class="rejilla">
  <div>Columna 1</div>
  <div>Columna 2</div>
  <div>Columna 3</div>
</div>
```

### L09.04 · Grid: repeat y celdas que se extienden
- tipo: leccion
- dificultad: 4
- nuevas: ninguna
> `repeat(3, 1fr)` evita escribir tres veces la misma columna. Con `grid-column: span 2` una celda ocupa dos columnas seguidas.

```html
<style>
  .panel {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
  .destacado {
    grid-column: span 2;
  }
</style>
<div class="panel">
  <div class="destacado">Gran caja</div>
  <div>Caja 2</div>
  <div>Caja 3</div>
</div>
```

### L09.R · Repaso: menú flex y contenido en rejilla
- tipo: repaso
- dificultad: 4
- nuevas: ninguna
> Una página con una barra de enlaces hecha con Flexbox y una zona de contenido en dos columnas con Grid.

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <title>Repaso layouts</title>
    <style>
      nav {
        display: flex;
      }
      main {
        display: grid;
        grid-template-columns: 1fr 2fr;
      }
    </style>
  </head>
  <body>
    <nav>
      <a href="#uno">Uno</a>
      <a href="#dos">Dos</a>
    </nav>
    <main>
      <p>Caja 1</p>
      <p>Caja 2</p>
    </main>
  </body>
</html>
```

---

## M10 · Diseño adaptable
Curso: css
Descripción: Hacer que una misma página se vea bien en móvil, tableta y ordenador.

### L10.01 · La etiqueta meta viewport
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> El diseño adaptable ajusta la página a cualquier tamaño de pantalla. La etiqueta `<meta name="viewport">` va en el `<head>` y evita que el móvil simule una pantalla de escritorio reducida: con `width=device-width` los píxeles de CSS coinciden con los del dispositivo.

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sitio responsive</title>
</head>
<body>
  <h1>Sitio adaptable</h1>
  <p>Contenido adaptativo</p>
</body>
```

### L10.02 · Media queries: max-width y min-width
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> `@media` aplica unas reglas solo si se cumple una condición. `max-width` se cumple en pantallas iguales o más estrechas que el valor y `min-width` en pantallas iguales o más anchas. Diseñar primero para móvil y ampliar con `min-width` se llama mobile first.

```html
<style>
  body {
    background: white;
  }
  @media (max-width: 768px) {
    body {
      background: gray;
    }
  }
  @media (min-width: 1200px) {
    body {
      background: black;
    }
  }
</style>
```

### L10.03 · Imágenes y tipografía fluidas
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> `max-width: 100%` con `height: auto` impide que una imagen se salga de su contenedor. `rem` es relativo al tamaño de letra de la raíz y `vw` al ancho de la ventana, de modo que el texto escala con la pantalla.

```html
<style>
  img {
    max-width: 100%;
    height: auto;
  }
  h1 {
    font-size: 2rem;
  }
  p {
    font-size: 2vw;
  }
</style>
<img src="foto.jpg" alt="Imagen adaptativa">
```

### L10.04 · Rejilla adaptable
- tipo: leccion
- dificultad: 4
- nuevas: ninguna
> Combinar Grid con una media query reorganiza el diseño según el ancho. En pantallas estrechas, una sola columna; a partir de 600 px, tres columnas iguales. Con Flexbox se hace igual cambiando `flex-direction`.

```css
.caja {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
@media (min-width: 600px) {
  .caja {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### L10.R · Repaso: página adaptable
- tipo: repaso
- dificultad: 4
- nuevas: ninguna
> Una página completa con viewport y una rejilla que pasa de una a dos columnas en pantallas anchas.

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Repaso responsive</title>
    <style>
      .caja {
        display: grid;
        gap: 10px;
      }
      @media (min-width: 600px) {
        .caja {
          grid-template-columns: 1fr 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="caja">
      <img src="uno.jpg" alt="Foto uno">
      <img src="dos.jpg" alt="Foto dos">
    </div>
  </body>
</html>
```

---

## M11 · Transiciones, transformaciones y animaciones
Curso: css
Descripción: Dar movimiento a una página: cambios suaves, giros, desplazamientos y animaciones por fotogramas.

### L11.01 · Transiciones
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> `transition` suaviza el cambio de una propiedad en lugar de hacerlo de golpe. Se indica la propiedad, la duración y la curva de velocidad. Suele activarse con `:hover`.

```html
<style>
  button {
    background: blue;
    transition: background 0.5s ease;
  }
  button:hover {
    background: red;
  }
</style>
<button>Boton suave</button>
```

### L11.02 · Transformaciones 2D
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> `transform` cambia la forma o la posición de un elemento sin alterar el resto de la maquetación. `rotate()` gira en grados, `scale()` cambia el tamaño, `translate()` mueve en X e Y y `skew()` inclina.

```html
<style>
  .caja {
    width: 100px;
    height: 100px;
    background: green;
    transform: rotate(45deg) scale(1.1);
  }
  .mover {
    transform: translate(20px, 10px) skew(10deg);
  }
</style>
<div class="caja">Giro</div>
<div class="mover">Mover</div>
```

### L11.03 · Animaciones con @keyframes
- tipo: leccion
- dificultad: 4
- nuevas: ninguna
> `@keyframes` define los estados de una animación en porcentajes de su duración, de `0%` a `100%`. Después, la propiedad `animation` la aplica indicando nombre, duración y repeticiones (`infinite` para siempre).

```html
<style>
  @keyframes mover {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(50px);
    }
  }
  .pelota {
    animation: mover 2s infinite;
  }
</style>
<div class="pelota">Pelota</div>
```

### L11.04 · Filtros visuales
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> `filter` aplica efectos gráficos antes de dibujar el elemento: `blur()` desenfoca, `brightness()` cambia el brillo y `contrast()` el contraste. Combinado con `transition` y `:hover` crea efectos suaves.

```html
<style>
  img {
    filter: blur(2px) brightness(80%) contrast(120%);
    transition: filter 0.3s;
  }
  img:hover {
    filter: blur(0) brightness(100%);
  }
</style>
<img src="foto.jpg" alt="Filtro">
```

### L11.R · Repaso: caja animada
- tipo: repaso
- dificultad: 4
- nuevas: ninguna
> Una página con una caja que gira sin parar y cambia de color al pasar el ratón.

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <title>Repaso animaciones</title>
    <style>
      @keyframes giro {
        100% {
          transform: rotate(360deg);
        }
      }
      .caja {
        background: blue;
        transition: background 0.5s ease;
        animation: giro 4s infinite;
      }
      .caja:hover {
        background: red;
      }
    </style>
  </head>
  <body>
    <div class="caja">Giro</div>
  </body>
</html>
```

---

## M12 · Buenas prácticas y proyecto final
Curso: css
Descripción: Cómo organizar, nombrar y validar el código para que se pueda mantener, y una última página que reúne todo.

### L12.01 · Separar estructura y estilo
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> HTML se ocupa de la estructura y el contenido, y CSS de la presentación, en archivos `.css` aparte. Se vinculan con `<link rel="stylesheet">` en el `<head>`. Así es más fácil mantener el sitio y el navegador guarda los estilos en caché.

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Separacion de capas</title>
    <link rel="stylesheet" href="estilos.css">
  </head>
  <body>
    <p>Texto con estilos externos</p>
  </body>
</html>
```

### L12.02 · Reset CSS básico
- tipo: leccion
- dificultad: 3
- nuevas: ninguna
> Cada navegador aplica márgenes y rellenos por defecto distintos. Un reset con el selector universal `*` los quita y `box-sizing: border-box` hace que bordes y rellenos no cambien el tamaño fijado. Los pseudoelementos `::before` y `::after` se incluyen para que el reset también les afecte.

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

### L12.03 · Código limpio y validación
- tipo: leccion
- dificultad: 2
- nuevas: ninguna
> El validador del W3C detecta etiquetas sin cerrar y errores de sintaxis. Un documento limpio tiene doctype, idioma, codificación, título, estructura semántica, imágenes con `alt` y sangría constante. Este es un ejemplo que lo pasaría.

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Pagina valida</title>
  </head>
  <body>
    <main>
      <h1>Titulo limpio</h1>
      <img src="foto.jpg" alt="Foto de ejemplo">
    </main>
  </body>
</html>
```

### L12.04 · Nombres de clase con BEM
- tipo: leccion
- dificultad: 3
- nuevas: `_`
> BEM (Bloque, Elemento, Modificador) da nombres claros a las clases. El bloque es el componente (`tarjeta`), el elemento se une con doble guion bajo (`tarjeta__titulo`) y el modificador con doble guion medio (`tarjeta--activa`).

```html
<style>
  .tarjeta {
    padding: 10px;
  }
  .tarjeta__titulo {
    color: blue;
  }
  .tarjeta--activa {
    border: 1px solid black;
  }
</style>
<div class="tarjeta tarjeta--activa">
  <h2 class="tarjeta__titulo">Titulo</h2>
</div>
```

### L12.R · Proyecto final: página adaptable
- tipo: repaso
- dificultad: 5
- nuevas: ninguna
> Una página que reúne estructura semántica, viewport, Flexbox y una media query para pasar de columna a fila en pantallas anchas.

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proyecto final</title>
    <style>
      .menu {
        display: flex;
        flex-direction: column;
      }
      @media (min-width: 600px) {
        .menu {
          flex-direction: row;
        }
      }
    </style>
  </head>
  <body>
    <nav class="menu">
      <a href="#uno">Uno</a>
      <a href="#dos">Dos</a>
    </nav>
  </body>
</html>
```

---

## Resumen del curso

| Módulo | Curso | Lecciones | Repaso |
| --- | --- | --- | --- |
| M01 · Estructura básica | html | 5 | L01.R |
| M02 · Texto | html | 4 | L02.R |
| M03 · Enlaces, imágenes y listas | html | 4 | L03.R |
| M04 · Tablas y formularios | html | 5 | L04.R |
| M05 · Multimedia, semántica y accesibilidad | html | 4 | L05.R |
| M06 · Fundamentos de CSS | css | 4 | L06.R |
| M07 · Modelo de caja | css | 4 | L07.R |
| M08 · Display y posicionamiento | css | 4 | L08.R |
| M09 · Flexbox y Grid | css | 4 | L09.R |
| M10 · Diseño adaptable | css | 4 | L10.R |
| M11 · Transiciones y animaciones | css | 4 | L11.R |
| M12 · Buenas prácticas y proyecto final | css | 4 | L12.R |

Total: 50 elementos, 12 repasos de módulo. Nota: M12 está marcado como `css` aunque su repaso es una página completa; al implementarlo, el curso se agrupa por módulos y no depende de esa etiqueta. Los símbolos estrenados siguen este orden: `< > /` (M01), `! = "` (M01), `, -`, `:`, `( )` (M02), `# @` (M03), `{ } ;` (M06), `*`, `[ ]`, `'`, `%` (M07) y `_` (M12).

---

## Cambios respecto a los lotes de NotebookLM (para revisar)

**Lote 1 (M01-M03)**

- **L01.01:** el ejemplo no mostraba etiquetas vacías aunque la explicación las mencionaba. Ahora incluye `<br>` y `<hr>`.
- **L01.02 y L01.04:** el original dejaba `<html>` vacío y comprimía el `head` en una sola línea. Ahora cada elemento va en su línea y con su sangría.
- **L02.04:** se sustituye `<bdo>` por `<code>` y `<blockquote>`, y se evitan los espacios múltiples dentro de `<pre>`.
- Se añaden L01.05 (comentarios) y L03.04 (menú con listas anidadas), y un repaso por módulo.

**Lote 2 (M04-M06)**

- **Sangría:** los repasos del original dejaban `<head>` y `<body>` sin sangría y metían `<head><title>…</title>` en una línea. Ahora todo está a 2 espacios y un elemento por línea.
- **Tildes en el código:** "Artículo", "Gráfico", "Menú", "Título", "Página"... se han pasado a texto sin tilde para no provocar fallos por la tecla muerta.
- **Símbolos "nuevos" mal marcados:** el original marcaba como nuevos `:` (ya estrenado en L02.03), `. #` (ya en L01.01 y L03.01), `( )` (ya en L02.04), `@` (ya en L03.01) y `,` (ya en L01.03). Solo son nuevos `{ } ;` en L06.01, `*` en L06.02, `[ ]` en L06.03 y `'` en L06.04.
- **L04.02 original:** el `rowspan="2"` con una sola fila era HTML mal formado, y la lección mezclaba `thead`, `tbody`, `tfoot`, `colspan` y `rowspan`. Se separa en dos lecciones (cabecera/cuerpo y fusión de celdas) y se quita `tfoot` por no caber; se puede añadir más adelante en un repaso.
- **L04.04/L04.05:** se añade `method="post"` a los formularios, se sustituye el radio "sexo" por turnos con `<label>` y se corrigen los campos sin etiqueta.
- **L05.03:** se quita `<mark>` (ya visto en M02) y se usa una fecha con texto visible en lugar de "hoy".
- **L06.01:** se añade `<link>`, que la explicación citaba pero el código no mostraba.
- **Límites de longitud:** las tablas y los formularios no caben en 12 líneas; el límite pasa a **14 para lecciones y 22 para repasos** (actualizado en la especificación).
- **L05.04 y repasos:** se ha comprobado por script que todas las lecciones cumplen longitud, sangría de 2 espacios y solo caracteres ASCII.
- Sigue sin contrastarse contra las 23 fuentes del cuaderno: es una reescritura del texto recibido.

**Lote 3 (M07-M09)**

- **Símbolos "nuevos" mal marcados:** el original daba como nuevos `% . = "` y `# -` en lecciones donde ya se conocían. Solo `%` es nuevo, en L07.02.
- **Explicaciones que no coincidían con el código:** L07.04 hablaba de `overflow-x`/`overflow-y` y `scroll` sin mostrarlos, L08.01 de `block` e `inline` sin usarlos, y L09.04 de `grid-row` que no aparecía. Ahora el código muestra lo que se explica y el resto se menciona solo como contexto.
- **L07.04:** el ejemplo solo tenía un contenedor con `auto`; ahora compara `auto` con `hidden`.
- **L09.04:** el panel tenía un único hijo; ahora tiene tres para que se vea la rejilla.
- **Tildes y sangría:** "Menú" pasa a "Menu", y los repasos vuelven a ir con la sangría de 2 espacios en `head` y `body`.
- **L07.R:** se quita `width: 100%` para acortar el repaso (queda en 22 líneas).
- **Repaso de M09:** el original usaba dos bloques casi vacíos (`<p>Menú Flex</p>`); ahora tiene enlaces en la barra y dos cajas en la rejilla, y el límite de los repasos sube a **25 líneas**.
- **Estructura:** NotebookLM juntó Flexbox y Grid en un solo módulo (M09), por lo que se mantiene así y se retoca el índice: M10 pasa a diseño adaptable y unidades, M11 a transiciones, animaciones y variables, y M12 a buenas prácticas y proyecto final.
- **Pendiente de verificar:** `<style>` suelto dentro del `<body>` en los fragmentos de M07-M09. Los navegadores lo aceptan, pero no es HTML estricto: por eso la página completa va en los repasos.

**Lote 4 (M10-M12)**

- **Símbolos "nuevos":** el original no marcaba casi nada. Solo `_` es nuevo (L12.04). Todos los demás ya estaban estrenados.
- **Explicaciones sin código:** L10.02 no mostraba `min-width`, L10.03 no mostraba `rem`, L10.04 hablaba de Flexbox y Grid sin código completo, L11.02 solo usaba `rotate` y `scale`, y L11.04 citaba `mix-blend-mode` sin usarlo. Ahora cada lección enseña lo que dice (en L11.04 se ha quitado `mix-blend-mode` y se ha añadido `contrast()`).
- **Fragmentos incompletos:** L10.04, L12.02 y L12.04 eran CSS sin HTML al que aplicarse. L10.04 y L12.02 pasan a ser bloques solo de CSS (como en M06) y L12.04 incluye el HTML con las clases BEM.
- **L11.03:** el original escribía `0% { transform: ...; }` en una sola línea, contra la regla de un elemento por línea. Ahora cada declaración va en la suya.
- **L12.03:** el original era una página vacía sin relación con el tema (validar y limpiar). Ahora muestra un documento con todo lo que el validador espera (idioma, codificación, título, `alt`, semántica).
- **L12.R (proyecto final):** el original era `body { display: flex; }` con un título y un párrafo, que no reunía lo aprendido. Ahora combina estructura semántica, viewport, Flexbox y una media query. Dejé fuera el reset y el BEM para no pasar de 25 líneas.
- **Repasos de M10 y M11:** el de M10 pasa de un cambio de color de fondo a una rejilla adaptable con dos imágenes, y el de M11 suma `transition` y `:hover` a la animación de giro. En ambos se quitó el `<meta charset>`/el tamaño de la caja para ajustarse a 25 líneas.
- **Tildes y sangría:** "Separación", "Código Valido", "Título limpio" y similares pasan a texto sin tilde, y `head`/`body` van con sangría en todos los repasos.
- **Etiquetas del curso:** el índice ya no tiene módulos pendientes, así que se sustituye por un resumen del curso completo.
