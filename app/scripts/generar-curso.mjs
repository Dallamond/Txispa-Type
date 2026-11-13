// Convierte los temarios de docs/curso/**/TEMARIO*.md en app/src/data/curso/<curso>.ts (uno por curso)
// y en generado.ts (el índice). Un temario puede traer módulos de varios cursos (HTML y CSS comparten archivo).
// Uso:
//   node scripts/generar-curso.mjs              escribe los archivos
//   node scripts/generar-curso.mjs --comprobar  falla si los archivos no están al día
// Gramática en docs/curso/SPEC-FORMATO-LECCIONES.md §3 y docs/curso/AÑADIR-CURSO.md. Lo que no encaje hace
// fallar el script con el archivo y el número de línea del Markdown.

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR_CURSOS = join(raiz, "..", "docs", "curso");
const DIR_SALIDA = join(raiz, "src", "data", "curso");
const salidaDe = (curso) => join(DIR_SALIDA, `${curso}.ts`);
const SALIDA_INDICE = join(DIR_SALIDA, "generado.ts");

/** Temarios: todos los TEMARIO*.md bajo docs/curso (en orden alfabético de ruta). */
function listarTemarios(dir = DIR_CURSOS) {
  const salida = [];
  for (const nombre of readdirSync(dir).sort()) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...listarTemarios(ruta));
    else if (/^TEMARIO.*\.md$/.test(nombre)) salida.push(ruta);
  }
  return salida;
}

/** Ids de curso registrados en tipos.ts (CURSOS), para rechazar un "Curso:" que no exista. */
function cursosRegistrados() {
  const t = readFileSync(join(DIR_SALIDA, "tipos.ts"), "utf8");
  const bloque = /export const CURSOS = \{([\s\S]*?)\} as const/.exec(t);
  if (!bloque) throw new Error("No encuentro CURSOS en data/curso/tipos.ts");
  return [...bloque[1].matchAll(/^ {2}(\w+): \{/gm)].map((m) => m[1]);
}

/** Parsea un temario. Lanza un Error con archivo y número de línea si algo no encaja. */
export function parsearTemario(texto, archivo = "TEMARIO.md", cursosValidos = null) {
  const lineas = texto.replace(/\r\n/g, "\n").split("\n");
  const modulos = [];
  let modulo = null;
  let leccion = null;

  const fallo = (n, msg) => {
    throw new Error(`${archivo}, línea ${n}: ${msg}`);
  };

  const cerrarLeccion = (n) => {
    if (!leccion) return;
    const { _n: inicio, ...l } = leccion;
    if (!l.tipo) fallo(inicio, `la lección ${l.id} no tiene "- tipo:"`);
    if ((l.tipo === "jefe") !== l.id.endsWith(".J")) fallo(inicio, `la lección ${l.id}: solo los jefes llevan el id L..J y "tipo: jefe"`);
    if (!l.dificultad) fallo(inicio, `la lección ${l.id} no tiene "- dificultad:"`);
    if (!l.nuevas) fallo(inicio, `la lección ${l.id} no tiene "- nuevas:"`);
    if (!l.explicacion) fallo(inicio, `la lección ${l.id} no tiene explicación (líneas que empiezan por ">")`);
    if (l.codigo === undefined) fallo(inicio, `la lección ${l.id} no tiene bloque de código (línea ${n})`);
    const nLineas = l.codigo.split("\n").length;
    if (l.notas.length > 0 && l.notas.length !== nLineas) {
      fallo(inicio, `la lección ${l.id} tiene ${l.notas.length} notas y ${nLineas} líneas de código (debe haber una nota por línea)`);
    }
    if (l.tipo === "jefe") {
      const buenas = l.opciones.filter((o) => o.correcta);
      if (l.opciones.length < 2) fallo(inicio, `el jefe ${l.id} necesita al menos 2 opciones`);
      if (buenas.length !== 1) fallo(inicio, `el jefe ${l.id} debe tener exactamente una opción ✔ (tiene ${buenas.length})`);
      if (buenas[0].comando !== l.codigo) fallo(inicio, `el jefe ${l.id}: el comando a teclear no coincide con la opción ✔`);
      for (const o of l.opciones) if (!o.correcta && !o.razon) fallo(inicio, `el jefe ${l.id}: la opción ✘ \`${o.comando}\` no tiene razón`);
    } else if (l.opciones.length > 0) {
      fallo(inicio, `la lección ${l.id} lleva opciones pero no es un jefe`);
    }
    if (l.notas.length === 0) delete l.notas;
    if (l.opciones.length === 0) delete l.opciones;
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

    if ((m = /^### (L\d{2}\.(?:\d{2}|R|J)) · (.+)$/.exec(l))) {
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
        notas: [],
        opciones: [],
        _n: n,
      };
      continue;
    }
    if (l.startsWith("### ")) fallo(n, `encabezado de lección no reconocido: "${l}"`);
    // Líneas en blanco, separadores y comentarios HTML de una línea (avisos para quien revisa) se ignoran.
    if (l.trim() === "" || l.trim() === "---" || /^<!--.*-->$/.test(l.trim())) continue;

    if (!leccion) {
      if ((m = /^Curso: (\w+)$/.exec(l))) {
        if (cursosValidos && !cursosValidos.includes(m[1])) fallo(n, `el curso "${m[1]}" no está en CURSOS (data/curso/tipos.ts)`);
        modulo.curso = m[1];
      } else if ((m = /^Descripción: (.+)$/.exec(l))) modulo.descripcion = m[1].trim();
      else fallo(n, `línea inesperada en la cabecera del módulo ${modulo.id}: "${l}"`);
      continue;
    }

    if ((m = /^- tipo: (leccion|repaso|jefe)$/.exec(l))) leccion.tipo = m[1];
    else if ((m = /^- nota (\d+): (.+)$/.exec(l))) {
      if (Number(m[1]) !== leccion.notas.length + 1) {
        fallo(n, `la nota ${m[1]} de ${leccion.id} está fuera de orden (toca la ${leccion.notas.length + 1})`);
      }
      leccion.notas.push(m[2].trim());
    } else if ((m = /^- opción (✔|✘): `(.+?)`(?: \| (.+))?$/.exec(l))) {
      leccion.opciones.push({ comando: m[2], correcta: m[1] === "✔", razon: (m[3] ?? "").trim() });
    } else if ((m = /^- dificultad: ([1-5])$/.exec(l))) leccion.dificultad = Number(m[1]);
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

/** Lee todos los temarios y devuelve los módulos agrupados por curso. */
export function leerCursos() {
  const validos = cursosRegistrados();
  const porCurso = Object.fromEntries(validos.map((c) => [c, []]));
  for (const ruta of listarTemarios()) {
    const nombre = ruta.slice(DIR_CURSOS.length + 1).replace(/\\/g, "/") || basename(ruta);
    for (const m of parsearTemario(readFileSync(ruta, "utf8"), nombre, validos)) porCurso[m.curso].push(m);
  }
  for (const [curso, modulos] of Object.entries(porCurso)) {
    if (modulos.length === 0) throw new Error(`El curso "${curso}" está en CURSOS pero ningún temario tiene módulos suyos.`);
    const ids = modulos.map((m) => m.id);
    const repetido = ids.find((id, k) => ids.indexOf(id) !== k);
    if (repetido) throw new Error(`El módulo ${repetido} está repetido en el curso "${curso}".`);
  }
  return porCurso;
}

/** Contenido de cada <curso>.ts y del índice generado.ts. Devuelve { ruta: contenido }. */
export function generarArchivos(porCurso) {
  const archivos = {};
  const cabecera = (origen) =>
    `// Generado por scripts/generar-curso.mjs desde ${origen}.\n` +
    `// No editar a mano: se cambia el Markdown y se ejecuta \`npm run curso:generar\`.\n\n`;
  const cursos = Object.keys(porCurso);
  for (const curso of cursos) {
    archivos[salidaDe(curso)] =
      cabecera("docs/curso/**/TEMARIO*.md") +
      `import type { Modulo } from "./tipos";\n\n` +
      `export const MODULOS_${curso.toUpperCase()}: readonly Modulo[] = ${JSON.stringify(porCurso[curso], null, 2)};\n`;
  }
  archivos[SALIDA_INDICE] =
    cabecera("la lista CURSOS de tipos.ts") +
    cursos.map((c) => `import { MODULOS_${c.toUpperCase()} } from "./${c}";`).join("\n") +
    `\nimport type { CursoId, Modulo } from "./tipos";\n\n` +
    `/** Módulos de cada curso tal como salen de los temarios (sin ordenar). */\n` +
    `export const MODULOS_GENERADOS: Readonly<Record<CursoId, readonly Modulo[]>> = {\n` +
    cursos.map((c) => `  ${c}: MODULOS_${c.toUpperCase()},`).join("\n") +
    `\n};\n`;
  return archivos;
}

function principal() {
  const porCurso = leerCursos();
  const archivos = generarArchivos(porCurso);
  const comprobar = process.argv.includes("--comprobar");
  let desfasados = 0;
  for (const [ruta, contenido] of Object.entries(archivos)) {
    if (comprobar) {
      let actual = "";
      try {
        actual = readFileSync(ruta, "utf8").replace(/\r\n/g, "\n");
      } catch {
        // no existe: se considera desfasado
      }
      if (actual !== contenido) {
        console.error(`✖ ${ruta} no está al día con el temario. Ejecuta: npm run curso:generar`);
        desfasados++;
      }
    } else {
      writeFileSync(ruta, contenido);
    }
  }
  if (comprobar) {
    if (desfasados > 0) process.exit(1);
    console.log("✔ Los datos del curso están al día con el temario.");
    return;
  }
  const todos = Object.values(porCurso).flat();
  const lecciones = todos.reduce((s, m) => s + m.lecciones.length, 0);
  console.log(`✔ ${Object.keys(porCurso).length} cursos, ${todos.length} módulos y ${lecciones} lecciones generados.`);
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
