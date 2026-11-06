import { describe, it, expect } from "vitest";
import { MotorCodigo } from "../motorCodigo";
import { MotorTecleo } from "../motor";
import { tokenizar } from "../curso";

const CODIGO = "<ul>\n  <li>Pan</li>\n</ul>";

/** Teclea una cadena con un hueco fijo entre pulsaciones; "\n" se envía como Enter. */
function teclear(m: MotorCodigo, texto: string, t0 = 1000, gap = 100): number {
  let t = t0;
  for (const ch of texto) {
    m.tecla(ch === "\n" ? "Enter" : ch, t);
    t += gap;
  }
  return t;
}

const nuevo = (codigo = CODIGO, estricto = false) => new MotorCodigo(tokenizar(codigo), estricto);

describe("avance por tokens", () => {
  it("teclear todo bien suma los caracteres y los cierres, y termina con el último carácter", () => {
    const m = nuevo();
    teclear(m, "<ul>\n<li>Pan</li>\n</ul");
    expect(m.agotado).toBe(false); // falta el ">" final
    teclear(m, ">", 9000);
    expect(m.agotado).toBe(true);
    // 4 + Enter + 12 + Enter + 5 = 23; la sangría no se teclea ni cuenta.
    expect(m.correct).toBe(23);
    expect(m.errors).toBe(0);
  });

  it("Enter cierra la línea y el espacio cierra el token dentro de la línea", () => {
    const m = nuevo("<p>Hola mundo</p>\n<br>");
    expect(m.tecla("Enter", 0)).toBe("ignorada"); // cierre al aire
    expect(m.inicio).toBeNull();
    teclear(m, "<p>Hola");
    expect(m.siguienteCaracter).toBe(" ");
    expect(m.tecla(" ", 700)).toBe("cierra");
    teclear(m, "mundo</p>", 800);
    expect(m.siguienteCaracter).toBe("\n");
    expect(m.tecla("Enter", 2000)).toBe("cierra");
    expect(m.idx).toBe(2);
  });

  it("siguienteCaracter pasa de letra a cierre y es null al acabar", () => {
    const m = nuevo("ab\ncd");
    expect(m.siguienteCaracter).toBe("a");
    teclear(m, "ab");
    expect(m.siguienteCaracter).toBe("\n");
    m.tecla("Enter", 500);
    teclear(m, "cd", 600);
    expect(m.agotado).toBe(true);
    expect(m.siguienteCaracter).toBeNull();
  });

  it("cuando se acaba ya no admite nada", () => {
    const m = nuevo("a");
    teclear(m, "a");
    expect(m.agotado).toBe(true);
    expect(m.tecla("b", 9999)).toBe("ignorada");
    expect(m.errors).toBe(0);
  });

  it("el cronómetro arranca con la primera pulsación válida", () => {
    const m = nuevo("ab\ncd");
    m.tecla("Enter", 10);
    expect(m.inicio).toBeNull();
    m.tecla("a", 500);
    expect(m.inicio).toBe(500);
  });
});

describe("cierres equivocados", () => {
  it("espacio donde va Enter es un fallo y no avanza; se registra la confusión", () => {
    const m = nuevo("ab\ncd");
    teclear(m, "ab");
    expect(m.tecla(" ", 400)).toBe("fallo");
    expect(m.idx).toBe(0);
    expect(m.errors).toBe(1);
    expect(m.agregados().confusiones["⏎>␣"]).toBe(1);
    expect(m.tecla("Enter", 600)).toBe("cierra");
  });

  it("Enter donde va espacio es un fallo y no avanza", () => {
    const m = nuevo("ab cd");
    teclear(m, "ab");
    expect(m.tecla("Enter", 400)).toBe("fallo");
    expect(m.idx).toBe(0);
    expect(m.agregados().confusiones["␣>⏎"]).toBe(1);
  });

  it("cerrar el último token con espacio o Enter es un fallo", () => {
    const m = nuevo("ab\ncd");
    teclear(m, "ab\nc");
    expect(m.tecla(" ", 900)).toBe("fallo");
    expect(m.tecla("Enter", 950)).toBe("fallo");
    expect(m.idx).toBe(1);
    expect(m.errors).toBe(2);
  });

  it("un token incompleto cerrado con su cierre cuenta las letras que faltan", () => {
    const m = nuevo("abcd\nef");
    teclear(m, "ab");
    expect(m.tecla("Enter", 400)).toBe("cierraConFaltas");
    expect(m.errors).toBe(2);
    expect(m.idx).toBe(1);
    expect(m.agregados().teclas["c"]).toMatchObject({ n: 1, e: 1 });
  });
});

describe("errores y correcciones", () => {
  it("una letra equivocada es un error y queda escrita; Backspace la quita sin devolver el fallo", () => {
    const m = nuevo("abc\nd");
    expect(m.tecla("x", 0)).toBe("fallo");
    expect(m.tecleadaActual).toBe("x");
    expect(m.tecla("Backspace", 100)).toBe("retroceso");
    expect(m.tecleadaActual).toBe("");
    expect(m.errors).toBe(1);
    expect(m.agregados().confusiones["a>x"]).toBe(1);
  });

  it("en el último token hay que dejar el texto exacto: con una letra mal no termina", () => {
    const m = nuevo("a\nab");
    teclear(m, "a\na");
    expect(m.tecla("x", 700)).toBe("fallo"); // "ax" tiene la longitud pero no es "ab"
    expect(m.agotado).toBe(false);
    expect(m.siguienteCaracter).toBeNull(); // hay que borrar
    m.tecla("Backspace", 800);
    expect(m.tecla("b", 900)).toBe("ok");
    expect(m.agotado).toBe(true);
  });

  it("letras de más cuentan como error y se limitan", () => {
    const m = nuevo("ab\ncd");
    teclear(m, "ab");
    for (let i = 0; i < 20; i++) m.tecla("z", 1000 + i);
    expect(m.errors).toBeLessThanOrEqual(8);
    expect(m.errors).toBeGreaterThan(0);
  });
});

describe("modo estricto", () => {
  it("la letra equivocada cuenta pero no entra, y el cierre no vale con el token incompleto", () => {
    const m = nuevo("abc\nd", true);
    expect(m.tecla("x", 0)).toBe("fallo");
    expect(m.tecleadaActual).toBe("");
    expect(m.errors).toBe(1);
    m.tecla("a", 100);
    expect(m.tecla("Enter", 200)).toBe("ignorada");
    expect(m.idx).toBe(0);
    expect(m.errors).toBe(1);
  });
});

describe("medidas", () => {
  it("coinciden con MotorTecleo al teclear el mismo texto", () => {
    const codigo = "<p>Hola mundo</p>";
    const mc = nuevo(codigo);
    const mt = new MotorTecleo(["<p>Hola", "mundo</p>"]);
    let t = 1000;
    for (const ch of "<p>Hola mundo</p>") {
      mc.tecla(ch, t);
      mt.tecla(ch, t);
      t += 120;
    }
    expect(mc.agotado).toBe(true);
    expect(mc.correct).toBe(mt.correct);
    expect(mc.errors).toBe(mt.errors);
    expect(mc.agregados()).toEqual(mt.agregados());
    expect(mc.medidas(t, 3600)).toEqual(mt.medidas(t, 3600));
  });
});
