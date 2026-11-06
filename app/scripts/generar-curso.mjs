// Convierte docs/curso/TEMARIO-HTML-CSS.md en app/src/data/curso/html.ts y css.ts.
// Uso:
//   node scripts/generar-curso.mjs              escribe los dos archivos
//   node scripts/generar-curso.mjs --comprobar  falla si los archivos no están al día
// Gramática en docs/curso/SPEC-FORMATO-LECCIONES.md §3. Lo que no encaje hace fallar
// el script con el número de línea del Markdown.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEMARIO = join(raiz, "..", "docs", "curso", "TEMARIO-HTML-CSS.md");
const SALIDA = {
  html: join(raiz, "src", "data", "curso", "html.ts"),
  css: join(raiz, "src", "data", "curso", "css.ts"),
};

/** Parsea el temario. Lanza un Error con el número de línea si algo no encaja. */
export function parsearTemario(texto) {
  const lineas = texto.replace(/\r\n/g, "\n").split("\n");
  const modulos = [];
  let modulo = null;
  let leccion = null;

  const fallo = (n, msg) => {
    throw new Error(`TEMARIO-HTML-CSS.md, línea ${n}: ${msg}`);
  };

  const cerrarLeccion = (n) => {
    if (!leccion) return;
    const { _n: inicio, ...l } = leccion;
    if (!l.tipo) fallo(inicio, `la lección ${l.id} no tiene "- tipo:"`);
    if (!l.dificultad) fallo(inicio, `la lección ${l.id} no tiene "- dificultad:"`);
    if (!l.nuevas) fallo(inicio, `la lección ${l.id} no tiene "- nuevas:"`);
    if (!l.explicacion) fallo(inicio, `la lección ${l.id} no tiene explicación (líneas que empiezan por ">")`);
    if (l.codigo === undefined) fallo(inicio, `la lección ${l.id} no tiene bloque de código (línea ${n})`);
    modulo.lecciones.push(l);
    leccion = null;
  };

  const cerrarModulo = (n) => {
    cerrarLeccion(n);
    if (!modulo) return;
    if (!modulo.curso) fallo(modulo._n, `el módulo ${modulo.id} no tiene "Curso:"`);
    if (!modulo.descripcion) fallo(modulo._n, `el módulo ${modulo.id} no tiene "Descripción:"`);
    if (modulo.lecciones.length === 0) fallo(modulo._n, `el módulo ${modulo.id} no tiene lecciones`);
    const { _n, ...m } = modulo;
    modulos.push(m);
    modulo = null;
  };

  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    const n = i + 1;
    let m;

    if ((m = /^## (M\d{2}) · (.+)$/.exec(l))) {
      cerrarModulo(n);
      modulo = { id: m[1], curso: null, titulo: m[2].trim(), descripcion: null, lecciones: [], _n: n };
      continue;
    }
    if (l.startsWith("## ")) {
      // Sección ajena al curso (resumen, cambios…): se acaba el módulo y no se interpreta nada más.
      cerrarModulo(n);
      continue;
    }
    if (!modulo) continue;

    if ((m = /^### (L\d{2}\.(?:\d{2}|R)) · (.+)$/.exec(l))) {
      cerrarLeccion(n);
      leccion = {
        id: m[1],
        moduloId: modulo.id,
        titulo: m[2].trim(),
        tipo: null,
        dificultad: null,
        nuevas: null,
        explicacion: "",
        codigo: undefined,
        _n: n,
      };
      continue;
    }
    if (l.startsWith("### ")) fallo(n, `encabezado de lección no reconocido: "${l}"`);
    if (l.trim() === "" || l.trim() === "---") continue;

    if (!leccion) {
      if ((m = /^Curso: (html|css)$/.exec(l))) modulo.curso = m[1];
      else if ((m = /^Descripción: (.+)$/.exec(l))) modulo.descripcion = m[1].trim();
      else fallo(n, `línea inesperada en la cabecera del módulo ${modulo.id}: "${l}"`);
      continue;
    }

    if ((m = /^- tipo: (leccion|repaso)$/.exec(l))) leccion.tipo = m[1];
    else if ((m = /^- dificultad: ([1-5])$/.exec(l))) leccion.dificultad = Number(m[1]);
    else if ((m = /^- nuevas: (.+)$/.exec(l))) {
      const v = m[1].trim();
      if (v === "ninguna") leccion.nuevas = [];
      else if ((m = /^`([^`]+)`$/.exec(v))) leccion.nuevas = m[1].trim().split(/\s+/);
      else fallo(n, `"nuevas" debe ser \`símbolos separados por espacio\` o "ninguna": "${v}"`);
    } else if (l.startsWith(">")) {
      const t = l.replace(/^>\s?/, "").trim();
      leccion.explicacion = leccion.explicacion ? `${leccion.explicacion} ${t}` : t;
    } else if (/^```\w*$/.test(l)) {
      if (leccion.codigo !== undefined) fallo(n, `la lección ${leccion.id} tiene más de un bloque de código`);
      const cuerpo = [];
      let j = i + 1;
      while (j < lineas.length && lineas[j] !== "```") cuerpo.push(lineas[j++]);
      if (j >= lineas.length) fallo(n, `bloque de código sin cerrar en la lección ${leccion.id}`);
      leccion.codigo = cuerpo.join("\n");
      i = j;
    } else {
      fallo(n, `línea inesperada en la lección ${leccion.id}: "${l}"`);
    }
  }
  cerrarModulo(lineas.length);
  return modulos;
}

/** Contenido de html.ts y css.ts a partir de los módulos. */
export function generarArchivos(modulos) {
  const porCurso = { html: [], css: [] };
  for (const m of modulos) porCurso[m.curso].push(m);
  const archivos = {};
  for (const curso of ["html", "css"]) {
    archivos[curso] =
      `// Generado por scripts/generar-curso.mjs desde docs/curso/TEMARIO-HTML-CSS.md.\n` +
      `// No editar a mano: se cambia el Markdown y se ejecuta \`npm run curso:generar\`.\n\n` +
      `import type { Modulo } from "./tipos";\n\n` +
      `export const MODULOS_${curso.toUpperCase()}: readonly Modulo[] = ${JSON.stringify(porCurso[curso], null, 2)};\n`;
  }
  return archivos;
}

function principal() {
  const modulos = parsearTemario(readFileSync(TEMARIO, "utf8"));
  const archivos = generarArchivos(modulos);
  const comprobar = process.argv.includes("--comprobar");
  let desfasados = 0;
  for (const curso of ["html", "css"]) {
    if (comprobar) {
      let actual = "";
      try {
        actual = readFileSync(SALIDA[curso], "utf8").replace(/\r\n/g, "\n");
      } catch {
        // no existe: se considera desfasado
      }
      if (actual !== archivos[curso]) {
        console.error(`✖ ${SALIDA[curso]} no está al día con el temario. Ejecuta: npm run curso:generar`);
        desfasados++;
      }
    } else {
      writeFileSync(SALIDA[curso], archivos[curso]);
    }
  }
  if (comprobar) {
    if (desfasados > 0) process.exit(1);
    console.log("✔ Los datos del curso están al día con el temario.");
    return;
  }
  const lecciones = modulos.reduce((s, m) => s + m.lecciones.length, 0);
  console.log(`✔ ${modulos.length} módulos y ${lecciones} lecciones generados.`);
}

// Solo se ejecuta si se lanza directamente (no al importarlo).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    principal();
  } catch (e) {
    console.error(`✖ ${e.message}`);
    process.exit(1);
  }
}
