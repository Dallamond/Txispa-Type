import { describe, it, expect } from "vitest";
import { EXTRA_MAX, MotorTecleo } from "../motor";

/** Teclea una cadena con un hueco fijo entre pulsaciones. */
function teclear(m: MotorTecleo, texto: string, t0 = 1000, gap = 100): number {
  let t = t0;
  for (const ch of texto) {
    m.tecla(ch, t);
    t += gap;
  }
  return t;
}

describe("avance por palabras", () => {
  it("teclear todo bien suma caracteres y el espacio de cierre", () => {
    const m = new MotorTecleo(["hola", "mundo"]);
    teclear(m, "hola mundo ");
    expect(m.correct).toBe(11);
    expect(m.errors).toBe(0);
    expect(m.agotado).toBe(true);
  });

  it("el espacio cierra la palabra y no se vuelve atrás", () => {
    const m = new MotorTecleo(["ab", "cd"]);
    teclear(m, "ab ");
    expect(m.idx).toBe(1);
    m.tecla("Backspace", 5000);
    expect(m.idx).toBe(1);
    expect(m.tecleadaActual).toBe("");
  });

  it("un espacio al aire no salta la palabra", () => {
    const m = new MotorTecleo(["ab"]);
    expect(m.tecla(" ", 0)).toBe("ignorada");
    expect(m.idx).toBe(0);
    expect(m.inicio).toBeNull();
  });

  it("cuando se acaba el texto ya no admite nada", () => {
    const m = new MotorTecleo(["a"]);
    teclear(m, "a ");
    expect(m.tecla("b", 9999)).toBe("ignorada");
    expect(m.errors).toBe(0);
  });

  it("siguienteCaracter pasa al espacio al completar la palabra", () => {
    const m = new MotorTecleo(["ab"]);
    expect(m.siguienteCaracter).toBe("a");
    m.tecla("a", 0);
    m.tecla("b", 50);
    expect(m.siguienteCaracter).toBe(" ");
    m.tecla(" ", 100);
    expect(m.siguienteCaracter).toBeNull();
  });
});

describe("errores", () => {
  it("una letra equivocada es un error y queda escrita", () => {
    const m = new MotorTecleo(["casa"]);
    expect(m.tecla("x", 0)).toBe("fallo");
    expect(m.errors).toBe(1);
    expect(m.tecleadaActual).toBe("x");
  });

  it("borrar NO devuelve el fallo ya contado", () => {
    const m = new MotorTecleo(["casa"]);
    m.tecla("x", 0);
    m.tecla("Backspace", 100);
    m.tecla("c", 200);
    expect(m.errors).toBe(1);
    expect(m.correct).toBe(1);
  });

  it("las letras que faltan al cerrar cuentan como fallos", () => {
    const m = new MotorTecleo(["camino", "x"]);
    teclear(m, "cam");
    expect(m.tecla(" ", 1000)).toBe("cierraConFaltas");
    expect(m.errors).toBe(3);
    expect(m.correct).toBe(4); // c, a, m y el espacio
    expect(m.ac.teclas["n"]).toEqual({ n: 1, e: 1, ms: 0, msN: 0 });
  });

  it("las letras de más son error, sin confusión, y respetan el tope", () => {
    const m = new MotorTecleo(["ab"]);
    teclear(m, "ab");
    for (let i = 0; i < EXTRA_MAX; i++) expect(m.tecla("z", 1000 + i)).toBe("fallo");
    expect(m.tecla("z", 2000)).toBe("ignorada");
    expect(m.errors).toBe(EXTRA_MAX);
    expect(m.ac.confusiones).toEqual({});
    expect(m.tecleadaActual).toHaveLength(2 + EXTRA_MAX);
  });

  it("la confusión queda registrada", () => {
    const m = new MotorTecleo(["vaca"]);
    m.tecla("b", 0);
    expect(m.ac.confusiones).toEqual({ "v>b": 1 });
  });

  it("cerrar una palabra con una letra mal sigue contando el espacio como correcto", () => {
    const m = new MotorTecleo(["ab", "cd"]);
    teclear(m, "ax ");
    expect(m.correct).toBe(2); // a y el espacio
    expect(m.errors).toBe(1);
    expect(m.idx).toBe(1);
  });
});

describe("modo estricto", () => {
  it("una letra equivocada cuenta pero no entra en la palabra", () => {
    const m = new MotorTecleo(["casa"], true);
    expect(m.tecla("x", 0)).toBe("fallo");
    expect(m.errors).toBe(1);
    expect(m.tecleadaActual).toBe("");
    expect(m.tecla("c", 100)).toBe("ok");
  });

  it("el espacio no cierra una palabra incompleta", () => {
    const m = new MotorTecleo(["casa", "x"], true);
    teclear(m, "ca");
    expect(m.tecla(" ", 500)).toBe("ignorada");
    expect(m.idx).toBe(0);
  });
});

describe("cronómetro y tiempos", () => {
  it("arranca con la primera pulsación, no antes", () => {
    const m = new MotorTecleo(["hola"]);
    expect(m.segundosReales(5000)).toBe(0);
    m.tecla("h", 5000);
    expect(m.inicio).toBe(5000);
    expect(m.segundosReales(7000)).toBe(2);
  });

  it("borrar con la palabra vacía no arranca el reloj", () => {
    const m = new MotorTecleo(["hola"]);
    expect(m.tecla("Backspace", 100)).toBe("ignorada");
    expect(m.inicio).toBeNull();
  });

  it("las teclas que no son un carácter se ignoran", () => {
    const m = new MotorTecleo(["hola"]);
    for (const k of ["Enter", "Shift", "Dead", "ArrowLeft", "Tab"]) expect(m.tecla(k, 0)).toBe("ignorada");
    expect(m.inicio).toBeNull();
  });

  it("acentos y ñ se aceptan como cualquier carácter", () => {
    const m = new MotorTecleo(["año", "canción"]);
    teclear(m, "año canción ");
    expect(m.errors).toBe(0);
    expect(m.correct).toBe(12);
  });

  it("el tiempo de corregir no entra en los intervalos", () => {
    const m = new MotorTecleo(["abc"]);
    m.tecla("a", 0);
    m.tecla("x", 100);
    m.tecla("Backspace", 200);
    m.tecla("b", 300);
    expect(m.ac.intervalos).toEqual([]);
  });

  it("medidas: 250 caracteres correctos en 60 s son 50 ppm", () => {
    const palabras = Array(50).fill("abcd"); // 4 letras + espacio = 5 caracteres
    const m = new MotorTecleo(palabras);
    let t = 0;
    for (const p of palabras) {
      for (const ch of p + " ") {
        m.tecla(ch, t);
        t += 60000 / 250;
      }
    }
    const r = m.medidas(60000, 60);
    expect(r.wpm).toBeCloseTo(50, 0);
    expect(r.acc).toBe(100);
  });
});
