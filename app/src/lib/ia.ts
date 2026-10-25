// Cliente de Ollama y validación del texto (especificación §8). Toda la red pasa
// por `fetchFn` para poder probarla sin servidor. Lo único que sale a la red es
// la llamada a `ollamaUrl` (por defecto localhost).

import type { AlmacenClaveValor } from "./ajustes";

export const CLAVE_IA = "txispatype.ia.v1";
export const TIEMPO_MAXIMO_MS = 30_000;
export const CACHE_MAXIMA = 20;
export const MIN_CARACTERES = 250;
export const MAX_CARACTERES = 600;

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

/** Letras, dígitos, espacio y `. , ; : ¿ ? ¡ ! ( ) " ' -` (especificación §4). */
const PERMITIDO = /^[\p{L}\p{N} .,;:¿?¡!()"'-]+$/u;

export function construirPrompt(letrasDebiles: readonly string[]): string {
  const letras = letrasDebiles.length > 0 ? letrasDebiles.join(", ") : "todas por igual";
  return (
    "Escribe un texto corrido en español de unas 70 palabras, natural y variado, sobre un tema cotidiano, tecnología o naturaleza. " +
    `Usa muchas palabras que contengan las letras: ${letras}. ` +
    "Sin títulos, sin listas, sin markdown, sin comillas, sin saltos de línea. Devuelve solo el texto."
  );
}

/** Hash corto y estable (FNV-1a de 32 bits) para reconocer repeticiones y anotarlo en el intento. */
export function hashTexto(texto: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Deja el texto en una sola línea sin adornos que los modelos añaden (comillas, markdown, saltos). */
export function limpiarRespuesta(bruto: string): string {
  return bruto
    .replace(/[“”«»]/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[*_#`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type ResultadoValidacion = { ok: true } | { ok: false; motivo: string };

/** Valida un texto ya limpio: longitud, caracteres permitidos, al menos dos frases y no repetido. */
export function validarTexto(texto: string, recientes: readonly string[]): ResultadoValidacion {
  if (texto.length < MIN_CARACTERES) return { ok: false, motivo: `demasiado corto (${texto.length} caracteres)` };
  if (texto.length > MAX_CARACTERES) return { ok: false, motivo: `demasiado largo (${texto.length} caracteres)` };
  if (!PERMITIDO.test(texto)) return { ok: false, motivo: "lleva caracteres no permitidos" };
  const frases = texto.split(/[.!?]+(?:\s|$)/).filter((f) => f.trim().length > 0);
  if (frases.length < 2) return { ok: false, motivo: "tiene menos de dos frases" };
  if (recientes.includes(hashTexto(texto))) return { ok: false, motivo: "repite un texto reciente" };
  return { ok: true };
}

// ---------- Red ----------

function normalizarUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

async function conTiempo<T>(ms: number, fn: (senal: AbortSignal) => Promise<T>): Promise<T> {
  const control = new AbortController();
  const id = setTimeout(() => control.abort(), ms);
  try {
    return await fn(control.signal);
  } finally {
    clearTimeout(id);
  }
}

/** Nombres de los modelos instalados en Ollama. Lanza si no responde. */
export async function listarModelos(url: string, fetchFn: FetchFn = fetch, ms = 5000): Promise<string[]> {
  return conTiempo(ms, async (signal) => {
    const r = await fetchFn(`${normalizarUrl(url)}/api/tags`, { signal });
    if (!r.ok) throw new Error(`Ollama respondió ${r.status}`);
    const json = (await r.json()) as { models?: { name?: unknown }[] };
    return (json.models ?? []).map((m) => m.name).filter((n): n is string => typeof n === "string");
  });
}

/** Una petición de generación. Devuelve el texto limpio (sin validar). */
export async function pedirTexto(
  url: string,
  modelo: string,
  prompt: string,
  fetchFn: FetchFn = fetch,
  ms = TIEMPO_MAXIMO_MS
): Promise<string> {
  return conTiempo(ms, async (signal) => {
    const r = await fetchFn(`${normalizarUrl(url)}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelo, prompt, stream: false, options: { temperature: 0.8 } }),
      signal,
    });
    if (!r.ok) throw new Error(`Ollama respondió ${r.status}`);
    const json = (await r.json()) as { response?: unknown };
    if (typeof json.response !== "string") throw new Error("Respuesta sin texto");
    return limpiarRespuesta(json.response);
  });
}

export interface TextoIA {
  texto: string;
  hash: string;
}

/** Genera un texto válido: un intento y un reintento. Devuelve el motivo del fallo si ninguno sirve. */
export async function generarTextoValido(p: {
  url: string;
  modelo: string;
  letras: readonly string[];
  recientes: readonly string[];
  fetchFn?: FetchFn;
  ms?: number;
}): Promise<{ ok: true; texto: TextoIA } | { ok: false; motivo: string }> {
  const prompt = construirPrompt(p.letras);
  let motivo = "sin respuesta";
  for (let intento = 0; intento < 2; intento++) {
    try {
      const texto = await pedirTexto(p.url, p.modelo, prompt, p.fetchFn, p.ms);
      const v = validarTexto(texto, p.recientes);
      if (v.ok) return { ok: true, texto: { texto, hash: hashTexto(texto) } };
      motivo = v.motivo;
    } catch (e) {
      motivo = e instanceof DOMException && e.name === "AbortError" ? "tardó más de 30 s" : e instanceof Error ? e.message : "error de red";
    }
  }
  return { ok: false, motivo };
}

// ---------- Caché de los últimos 20 textos ----------

export interface EntradaCache {
  hash: string;
  texto: string;
  /** ISO-8601. */
  fecha: string;
}

export function leerCache(almacen: AlmacenClaveValor | null): EntradaCache[] {
  if (!almacen) return [];
  try {
    const crudo = JSON.parse(almacen.getItem(CLAVE_IA) ?? "[]") as unknown;
    if (!Array.isArray(crudo)) return [];
    return crudo
      .filter((e): e is EntradaCache => typeof e?.hash === "string" && typeof e?.texto === "string" && typeof e?.fecha === "string")
      .slice(-CACHE_MAXIMA);
  } catch {
    return [];
  }
}

export function guardarEnCache(almacen: AlmacenClaveValor | null, nuevos: readonly TextoIA[], ahora: Date): void {
  if (!almacen || nuevos.length === 0) return;
  const lista = [...leerCache(almacen), ...nuevos.map((t) => ({ hash: t.hash, texto: t.texto, fecha: ahora.toISOString() }))];
  try {
    almacen.setItem(CLAVE_IA, JSON.stringify(lista.slice(-CACHE_MAXIMA)));
  } catch {
    // Almacenamiento lleno o bloqueado: el texto de esta sesión sigue siendo válido.
  }
}

// ---------- Orquestación ----------

export interface ResultadoIA {
  /** Textos válidos generados, en orden. */
  textos: TextoIA[];
  /** Por qué se dejó de generar antes de llegar al objetivo; null si se llegó. */
  motivoFallo: string | null;
}

const PALABRAS_POR_TEXTO = 65;

/**
 * Genera textos hasta cubrir `palabrasObjetivo` o hasta `maxTextos`. Los textos
 * generados en esta tanda cuentan como recientes para no repetirse entre sí.
 * `alProgreso` recibe cuántos llevamos, para pintar "Generando 2 de 6".
 */
export async function generarTextosIA(p: {
  url: string;
  modelo: string;
  letras: readonly string[];
  palabrasObjetivo: number;
  maxTextos?: number;
  almacen: AlmacenClaveValor | null;
  fetchFn?: FetchFn;
  ms?: number;
  ahora?: Date;
  alProgreso?: (hechos: number, total: number) => void;
}): Promise<ResultadoIA> {
  const total = Math.min(p.maxTextos ?? 6, Math.max(1, Math.ceil(p.palabrasObjetivo / PALABRAS_POR_TEXTO)));
  const recientes = leerCache(p.almacen).map((e) => e.hash);
  const textos: TextoIA[] = [];
  let motivoFallo: string | null = null;
  p.alProgreso?.(0, total);
  for (let i = 0; i < total; i++) {
    const r = await generarTextoValido({
      url: p.url,
      modelo: p.modelo,
      letras: p.letras,
      recientes: [...recientes, ...textos.map((t) => t.hash)],
      fetchFn: p.fetchFn,
      ms: p.ms,
    });
    if (!r.ok) {
      motivoFallo = r.motivo;
      break; // Ollama apagado o modelo inútil: no se encadenan más esperas de 30 s.
    }
    textos.push(r.texto);
    p.alProgreso?.(textos.length, total);
  }
  guardarEnCache(p.almacen, textos, p.ahora ?? new Date());
  return { textos, motivoFallo };
}
