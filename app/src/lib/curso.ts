// Tokenización del código de una lección. Lógica pura (ver docs/curso/SPEC-FORMATO-LECCIONES.md §5).
//
// El código se teclea token a token: el espacio o el Enter cierra cada token, y la sangría de
// la línea siguiente la pone la app (no se teclea ni cuenta).

export interface Token {
  /** Texto a teclear, sin espacios ni saltos. */
  texto: string;
  /** Lo que se teclea para cerrarlo: espacio, Enter o nada (último token del código). */
  cierre: " " | "\n" | "";
  /** Espacios de sangría que la app inserta al pasar a la línea siguiente (no se teclean). */
  sangriaSiguiente: number;
}

const sangriaDe = (linea: string) => linea.length - linea.trimStart().length;

/** Parte el código en tokens. Lanza un Error si el código no se puede teclear token a token
 * (línea en blanco, espacios dobles o sangría en la primera línea). */
export function tokenizar(codigo: string): Token[] {
  const lineas = codigo.split("\n");
  if (sangriaDe(lineas[0]) > 0) throw new Error("La primera línea no puede llevar sangría.");
  const tokens: Token[] = [];
  lineas.forEach((linea, i) => {
    const contenido = linea.trim();
    if (contenido === "") throw new Error(`La línea ${i + 1} está en blanco.`);
    const partes = contenido.split(" ");
    if (partes.includes("")) throw new Error(`La línea ${i + 1} tiene espacios dobles.`);
    const ultima = i === lineas.length - 1;
    partes.forEach((texto, k) => {
      const finDeLinea = k === partes.length - 1;
      tokens.push({
        texto,
        cierre: !finDeLinea ? " " : ultima ? "" : "\n",
        sangriaSiguiente: finDeLinea && !ultima ? sangriaDe(lineas[i + 1]) : 0,
      });
    });
  });
  return tokens;
}

/** Reconstruye el código tal cual a partir de los tokens (inverso de `tokenizar`). */
export function aTexto(tokens: readonly Token[]): string {
  return tokens.map((t) => t.texto + t.cierre + (t.cierre === "\n" ? " ".repeat(t.sangriaSiguiente) : "")).join("");
}

/** Reparte los tokens por líneas para pintarlas: cada línea guarda su sangría y los índices de sus tokens. */
export interface LineaCodigo {
  sangria: number;
  /** Índices (en la lista de tokens) de los tokens de la línea. */
  tokens: number[];
}

export function lineasDeTokens(tokens: readonly Token[]): LineaCodigo[] {
  const lineas: LineaCodigo[] = [{ sangria: 0, tokens: [] }];
  tokens.forEach((t, i) => {
    lineas[lineas.length - 1].tokens.push(i);
    if (t.cierre === "\n") lineas.push({ sangria: t.sangriaSiguiente, tokens: [] });
  });
  return lineas;
}
