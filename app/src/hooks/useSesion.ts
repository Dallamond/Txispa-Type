import { useCallback, useEffect, useState } from "react";
import { cargarFirebase, nubeConfigurada } from "../lib/firebase";

export interface Usuario {
  uid: string;
  email: string | null;
  nombre: string | null;
}

export interface Sesion {
  /** ¿Esta versión de la app tiene la nube configurada? */
  disponible: boolean;
  /** Esperando a saber si ya había una sesión iniciada. */
  cargando: boolean;
  usuario: Usuario | null;
  /** Último error de inicio de sesión, ya en español. */
  error: string | null;
  entrarConGoogle(): Promise<void>;
  entrarConCorreo(correo: string, clave: string): Promise<void>;
  crearCuenta(correo: string, clave: string): Promise<void>;
  salir(): Promise<void>;
}

/** Traduce los códigos de error de Firebase Auth. Devuelve null para lo que no hace falta contar (cerrar la ventana). */
export function mensajeDeError(e: unknown): string | null {
  const code = typeof e === "object" && e !== null ? (e as { code?: string }).code : undefined;
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null;
    case "auth/popup-blocked":
      return "El navegador bloqueó la ventana de Google. Permite las ventanas emergentes para esta página e inténtalo de nuevo.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Correo o contraseña incorrectos.";
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con ese correo. Entra con ella o usa Google.";
    case "auth/weak-password":
      return "La contraseña es demasiado débil: usa al menos 6 caracteres.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera un rato e inténtalo de nuevo.";
    case "auth/network-request-failed":
      return "Sin conexión. Comprueba tu red e inténtalo de nuevo.";
    case "auth/operation-not-allowed":
      return "Este método de acceso no está activado todavía.";
    case "auth/unauthorized-domain":
      return "Esta dirección web no está autorizada para iniciar sesión. Hay que añadirla en la consola de Firebase.";
    default:
      return "No se pudo iniciar sesión. Inténtalo de nuevo.";
  }
}

/** Sesión de Firebase Auth. El SDK se carga sin bloquear la app y solo si la nube está configurada. */
export function useSesion(): Sesion {
  const disponible = nubeConfigurada();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(disponible);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!disponible) return;
    let vivo = true;
    let baja: (() => void) | null = null;
    void (async () => {
      try {
        const { auth } = await cargarFirebase();
        const { onAuthStateChanged } = await import("firebase/auth");
        baja = onAuthStateChanged(auth, (u) => {
          if (!vivo) return;
          setUsuario(u ? { uid: u.uid, email: u.email, nombre: u.displayName } : null);
          setCargando(false);
        });
      } catch {
        if (vivo) setCargando(false); // sin red o sin SDK: la app sigue en local
      }
    })();
    return () => {
      vivo = false;
      baja?.();
    };
  }, [disponible]);

  const intentar = useCallback(async (accion: () => Promise<unknown>) => {
    setError(null);
    try {
      await accion();
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, []);

  return {
    disponible,
    cargando,
    usuario,
    error,
    entrarConGoogle: () =>
      intentar(async () => {
        const { auth } = await cargarFirebase();
        const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
        await signInWithPopup(auth, new GoogleAuthProvider());
      }),
    entrarConCorreo: (correo, clave) =>
      intentar(async () => {
        const { auth } = await cargarFirebase();
        const { signInWithEmailAndPassword } = await import("firebase/auth");
        await signInWithEmailAndPassword(auth, correo.trim(), clave);
      }),
    crearCuenta: (correo, clave) =>
      intentar(async () => {
        const { auth } = await cargarFirebase();
        const { createUserWithEmailAndPassword } = await import("firebase/auth");
        await createUserWithEmailAndPassword(auth, correo.trim(), clave);
      }),
    salir: () =>
      intentar(async () => {
        const { auth } = await cargarFirebase();
        const { signOut } = await import("firebase/auth");
        await signOut(auth);
      }),
  };
}
