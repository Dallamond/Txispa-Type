// Guardar un intento sin perder el aviso si falla (cuota, modo privado, otra pestaña bloqueando IndexedDB).

export const AVISO_GUARDADO =
  "No se pudo guardar este intento en el navegador. Exporta tus datos desde Ajustes para no perderlos y libera espacio o cierra otras pestañas de Txispa Type.";

/** Ejecuta el guardado (síncrono o con promesa) y devuelve `true` si salió bien. Nunca lanza. */
export async function guardarIntento<T>(guardar: (intento: T) => Promise<void> | void, intento: T): Promise<boolean> {
  try {
    await guardar(intento);
    return true;
  } catch {
    return false;
  }
}
