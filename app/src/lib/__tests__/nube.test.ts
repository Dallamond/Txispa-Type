import { describe, expect, it } from "vitest";
import { leerConfigFirebase } from "../firebase";
import { etiquetaCorta, textoEstadoSync } from "../estadoSync";
import { mensajeDeError } from "../../hooks/useSesion";
import { datosVacios, guardarDatosSync, leerDatosSync } from "../sincronizacion";

const ENV_COMPLETO = {
  VITE_FIREBASE_API_KEY: "k",
  VITE_FIREBASE_AUTH_DOMAIN: "x.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "x",
  VITE_FIREBASE_APP_ID: "1:2:web:3",
};

describe("configuración de la nube", () => {
  it("sin variables, la nube no está configurada", () => {
    expect(leerConfigFirebase({})).toBeNull();
    expect(leerConfigFirebase({ ...ENV_COMPLETO, VITE_FIREBASE_API_KEY: "" })).toBeNull();
  });

  it("con las variables imprescindibles, sí; y VITE_SYNC_ENABLED=false la apaga", () => {
    expect(leerConfigFirebase(ENV_COMPLETO)?.projectId).toBe("x");
    expect(leerConfigFirebase({ ...ENV_COMPLETO, VITE_SYNC_ENABLED: "false" })).toBeNull();
  });
});

describe("textos del estado", () => {
  it("el indicador de la cabecera no sale sin sesión y cuenta los pendientes sin conexión", () => {
    expect(etiquetaCorta({ tipo: "local" })).toBeNull();
    expect(etiquetaCorta({ tipo: "sincronizado", pendientes: 0 })).toBe("Sincronizado");
    expect(etiquetaCorta({ tipo: "sin-conexion", pendientes: 3 })).toBe("Sin conexión (3)");
  });

  it("el panel explica cada estado en español", () => {
    expect(textoEstadoSync({ tipo: "sin-conexion", pendientes: 1 })).toContain("1 intento pendiente");
    expect(textoEstadoSync({ tipo: "error", mensaje: "x", pendientes: 2 })).toContain("2 intentos pendientes");
    expect(textoEstadoSync({ tipo: "cuenta-distinta" })).toContain("otra cuenta");
  });
});

describe("errores de inicio de sesión", () => {
  it("traduce los códigos habituales y calla cerrar la ventana", () => {
    expect(mensajeDeError({ code: "auth/invalid-credential" })).toContain("incorrectos");
    expect(mensajeDeError({ code: "auth/email-already-in-use" })).toContain("Ya existe");
    expect(mensajeDeError({ code: "auth/popup-closed-by-user" })).toBeNull();
    expect(mensajeDeError({ code: "auth/unauthorized-domain" })).toContain("autorizada");
    expect(mensajeDeError(new Error("raro"))).toContain("No se pudo");
  });
});

describe("datos de sincronización guardados", () => {
  const kv = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
  };

  it("ida y vuelta, y un valor corrupto vuelve a los datos vacíos", () => {
    const a = kv();
    guardarDatosSync(a, { uid: "u", cursor: 5, epochVisto: 1, pendientes: ["x"] });
    expect(leerDatosSync(a)).toEqual({ uid: "u", cursor: 5, epochVisto: 1, pendientes: ["x"] });
    a.setItem("txispatype.sync.v1", "{roto");
    expect(leerDatosSync(a)).toEqual(datosVacios());
    a.setItem("txispatype.sync.v1", JSON.stringify({ uid: 3, cursor: "x", pendientes: [1, "ok"] }));
    expect(leerDatosSync(a)).toEqual({ uid: null, cursor: null, epochVisto: null, pendientes: ["ok"] });
  });
});
