// Arranque diferido de Firebase. Nada de `firebase/*` se carga hasta que hace falta (sesión iniciada o
// pantalla de cuenta), así que quien no usa la nube no descarga el SDK. Sin las variables `VITE_FIREBASE_*`
// la nube está "no configurada" y la app funciona exactamente igual, solo en local.
//
// La configuración web de Firebase no es secreta (viaja al navegador): la seguridad la dan las reglas de
// Firestore y el inicio de sesión, no esconder la clave.

import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

export interface ConfigFirebase {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

/** Lee la configuración de las variables de entorno de Vite; null si falta algo imprescindible. */
export function leerConfigFirebase(env: Record<string, string | undefined> = import.meta.env): ConfigFirebase | null {
  const { VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID } = env;
  if (!VITE_FIREBASE_API_KEY || !VITE_FIREBASE_AUTH_DOMAIN || !VITE_FIREBASE_PROJECT_ID || !VITE_FIREBASE_APP_ID) return null;
  if (env.VITE_SYNC_ENABLED === "false") return null; // interruptor para apagar la nube sin tocar código
  return {
    apiKey: VITE_FIREBASE_API_KEY,
    authDomain: VITE_FIREBASE_AUTH_DOMAIN,
    projectId: VITE_FIREBASE_PROJECT_ID,
    appId: VITE_FIREBASE_APP_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  };
}

export const nubeConfigurada = (): boolean => leerConfigFirebase() !== null;

export interface Nube {
  auth: Auth;
  db: Firestore;
}

let cargada: Promise<Nube> | null = null;

/** Carga el SDK y crea la app (una sola vez). Falla si la nube no está configurada. */
export function cargarFirebase(): Promise<Nube> {
  cargada ??= (async () => {
    const config = leerConfigFirebase();
    if (!config) throw new Error("La nube no está configurada en esta versión.");
    const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore"),
    ]);
    const app = initializeApp(config);
    return { auth: getAuth(app), db: getFirestore(app) };
  })();
  cargada.catch(() => {
    cargada = null; // permite reintentar tras un fallo de red al cargar el SDK
  });
  return cargada;
}
