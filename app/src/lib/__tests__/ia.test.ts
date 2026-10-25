import { describe, expect, it } from "vitest";
import {
  CACHE_MAXIMA,
  CLAVE_IA,
  construirPrompt,
  generarTextosIA,
  generarTextoValido,
  guardarEnCache,
  hashTexto,
  leerCache,
  limpiarRespuesta,
  listarModelos,
  validarTexto,
  type FetchFn,
} from "../ia";
import type { AlmacenClaveValor } from "../ajustes";

function almacenFalso(): AlmacenClaveValor & { datos: Record<string, string> } {
  const datos: Record<string, string> = {};
  return { datos, getItem: (k) => datos[k] ?? null, setItem: (k, v) => void (datos[k] = v) };
}

/** Texto de unos 300 caracteres con dos frases. */
const bueno = (n = 0) =>
  `El viento baja por la sierra y mueve las ramas de los pinos mientras el río corre entre las piedras ${n}. ` +
  "Por la tarde, el programador cierra el portátil, prepara un café y sale a caminar por el sendero que rodea el pueblo, " +
  "escuchando el canto de los pájaros y pensando en el próximo proyecto que quiere construir con calma y buena letra.";

const respuesta = (cuerpo: unknown, status = 200) => new Response(JSON.stringify(cuerpo), { status });
const ollamaDe = (...textos: string[]): FetchFn => {
  let i = 0;
  return async () => respuesta({ response: textos[Math.min(i++, textos.length - 1)] });
};

describe("validación", () => {
  it("acepta un texto correcto", () => {
    expect(validarTexto(bueno(), [])).toEqual({ ok: true });
  });
  it("rechaza corto, largo, caracteres raros, una sola frase y repetidos", () => {
    expect(validarTexto("Hola. Adiós.", []).ok).toBe(false);
    expect(validarTexto(bueno() + bueno(1), []).ok).toBe(false);
    expect(validarTexto(bueno().replace("viento", "viento \u{1F600}"), []).ok).toBe(false);
    expect(validarTexto(bueno().replace(". Por", ", por"), []).ok).toBe(false);
    expect(validarTexto(bueno(), [hashTexto(bueno())]).ok).toBe(false);
  });
  it("limpiarRespuesta quita markdown, comillas tipográficas y saltos de línea", () => {
    expect(limpiarRespuesta("“Hola **mundo**”\n\nsegundo — tercero…")).toBe("Hola mundo segundo - tercero...");
  });
  it("el prompt incluye las letras débiles", () => {
    expect(construirPrompt(["v", "x"])).toContain("v, x");
  });
  it("el hash es estable y distingue textos", () => {
    expect(hashTexto("a")).toBe(hashTexto("a"));
    expect(hashTexto("a")).not.toBe(hashTexto("b"));
  });
});

describe("red", () => {
  it("listarModelos devuelve los nombres y falla si Ollama responde mal", async () => {
    const ok: FetchFn = async (url) => {
      expect(url).toBe("http://x:11434/api/tags");
      return respuesta({ models: [{ name: "llama3" }, { name: "qwen" }, {}] });
    };
    expect(await listarModelos("http://x:11434/", ok)).toEqual(["llama3", "qwen"]);
    await expect(listarModelos("http://x", async () => respuesta({}, 500))).rejects.toThrow();
  });
  it("reintenta una vez si el primer texto no es válido", async () => {
    const r = await generarTextoValido({ url: "u", modelo: "m", letras: [], recientes: [], fetchFn: ollamaDe("corto", bueno()) });
    expect(r.ok).toBe(true);
  });
  it("si falla dos veces devuelve el motivo", async () => {
    const r = await generarTextoValido({ url: "u", modelo: "m", letras: [], recientes: [], fetchFn: ollamaDe("corto") });
    expect(r).toEqual({ ok: false, motivo: expect.stringContaining("demasiado corto") });
  });
  it("Ollama apagado se trata como fallo, sin lanzar", async () => {
    const caido: FetchFn = async () => {
      throw new TypeError("Failed to fetch");
    };
    const r = await generarTextoValido({ url: "u", modelo: "m", letras: [], recientes: [], fetchFn: caido });
    expect(r.ok).toBe(false);
  });
  it("el tiempo máximo corta la petición", async () => {
    const colgado: FetchFn = (_u, init) =>
      new Promise((_res, rej) => init?.signal?.addEventListener("abort", () => rej(new DOMException("abort", "AbortError"))));
    const r = await generarTextoValido({ url: "u", modelo: "m", letras: [], recientes: [], fetchFn: colgado, ms: 10 });
    expect(r).toEqual({ ok: false, motivo: "tardó más de 30 s" });
  });
});

describe("caché y orquestación", () => {
  it("guarda como mucho 20 textos y ignora basura", () => {
    const a = almacenFalso();
    guardarEnCache(a, Array.from({ length: 25 }, (_, i) => ({ texto: `t${i}`, hash: `h${i}` })), new Date());
    expect(leerCache(a)).toHaveLength(CACHE_MAXIMA);
    expect(leerCache(a)[0].hash).toBe("h5");
    a.datos[CLAVE_IA] = "{roto";
    expect(leerCache(a)).toEqual([]);
  });
  it("genera varios textos distintos y los guarda", async () => {
    const a = almacenFalso();
    const r = await generarTextosIA({ url: "u", modelo: "m", letras: ["v"], palabrasObjetivo: 130, almacen: a, fetchFn: ollamaDe(bueno(1), bueno(2)) });
    expect(r.textos).toHaveLength(2);
    expect(r.motivoFallo).toBeNull();
    expect(leerCache(a)).toHaveLength(2);
  });
  it("no repite un texto de la caché", async () => {
    const a = almacenFalso();
    guardarEnCache(a, [{ texto: bueno(1), hash: hashTexto(bueno(1)) }], new Date());
    const r = await generarTextosIA({ url: "u", modelo: "m", letras: [], palabrasObjetivo: 65, almacen: a, fetchFn: ollamaDe(bueno(1), bueno(3)) });
    expect(r.textos[0].texto).toBe(bueno(3));
  });
  it("si falla a mitad devuelve lo generado y el motivo", async () => {
    const r = await generarTextosIA({ url: "u", modelo: "m", letras: [], palabrasObjetivo: 200, almacen: null, fetchFn: ollamaDe(bueno(1), "corto") });
    expect(r.textos).toHaveLength(1);
    expect(r.motivoFallo).toContain("corto");
  });
});
